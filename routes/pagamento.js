require('dotenv').config();
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const db = require('../config/db');

const CHAVE_PIX = process.env.PIX_KEY || '11147464952';
const NOME_RECEBEDOR = process.env.PIX_NOME || 'Ruan Borges da Silveira';
const CIDADE_RECEBEDOR = process.env.PIX_CIDADE || 'Balneário Gaivota';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_SMTP_PORT ? Number(process.env.EMAIL_SMTP_PORT) : 465,
  secure: (typeof process.env.EMAIL_SMTP_SECURE !== 'undefined') ? (process.env.EMAIL_SMTP_SECURE === 'true') : true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err) => {
  if (err) console.error('Transporter verify error:', err);
  else console.log('Transporter pronto para envio de e-mails');
});

// CRC16-CCITT (0x1021)
function crc16(payload) {
  let pol = 0x1021;
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ pol) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id, value) {
  const len = String(value.length).padStart(2, '0');
  return id + len + value;
}

function buildPixPayload({ chave, nome, cidade, valor, txid, complemento }) {
  const valorStr = valor ? Number(valor).toFixed(2) : '';
  const merchantAccountInfo = tlv('00', 'br.gov.bcb.pix') + tlv('01', chave) + (complemento ? tlv('02', complemento) : '');
  let payload = '';
  payload += tlv('00', '01'); // payload format indicator
  payload += tlv('26', merchantAccountInfo);
  payload += tlv('52', '0000');
  payload += tlv('53', '986');
  if (valorStr) payload += tlv('54', valorStr);
  payload += tlv('58', 'BR');
  payload += tlv('59', (nome || '').substring(0,25));
  payload += tlv('60', (cidade || '').substring(0,15));
  payload += tlv('62', tlv('05', txid || '***'));
  const payloadForCrc = payload + '63' + '04';
  const crc = crc16(payloadForCrc);
  return payload + '63' + '04' + crc;
}

// helper para e-mail destinatário seguro
function destinatarioPara(usuario) {
    return (usuario && usuario.email) ? usuario.email : (process.env.EMAIL_USER || '');
}

// middleware: exige login para acessar pagamento
function exigeLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    // redireciona para login com redirect
    const redirectTo = encodeURIComponent(req.originalUrl || '/pagamento');
    return res.redirect('/login?redirect=' + redirectTo);
  }
  next();
}

// Rota GET para exibir a página de pagamento (aceita ?valor=...&descricao=...)
router.get('/', exigeLogin, async (req, res) => {
    try {
        const valor = req.query.valor ? Number(req.query.valor) : 0;
        const descricao = req.query.descricao || '';
        const usuario = req.session.usuario || null;

        // gera payload e QR localmente (funciona em apps que aceitam QR com CRC)
        const txid = 'pedido-' + Date.now();
        const payload = buildPixPayload({
          chave: CHAVE_PIX,
          nome: NOME_RECEBEDOR,
          cidade: CIDADE_RECEBEDOR,
          valor: valor,
          txid,
          complemento: descricao
        });

        const qrCodeImage = await QRCode.toDataURL(payload);

        // { changed code }
        const produtoIdQuery = req.query.produtoId ? Number(req.query.produtoId) : null;
        // opcional: buscar imagem do produto para mostrar na view
        let produtoImagem = null;
        if (produtoIdQuery) {
          try {
            const rows = await new Promise((resolve, reject) => {
              db.query('SELECT imagem FROM PRODUTO WHERE ID = ?', [produtoIdQuery], (err, r) => err ? reject(err) : resolve(r));
            });
            if (rows && rows.length) produtoImagem = rows[0].imagem;
          } catch (e) {
            console.error('Erro ao buscar imagem do produto:', e);
          }
        }
        res.render('pagamento', { valor, descricao, payload, qrCodeImage, usuario, produtoId: produtoIdQuery, produtoImagem });
    } catch (err) {
        console.error('Erro gerando QR/Payload:', err);
        return res.status(500).render('error', { error: err, message: 'Erro ao gerar QR Code' });
    }
});

// Rota para confirmar pedido via PIX (sem upload)
router.post('/pix-confirm', exigeLogin, async (req, res) => {
    try {
        const { valor, descricao, produtoId: produtoIdBody } = req.body;
        const usuario = req.session.usuario;

        const enderecoTexto = usuario ? `${usuario.endereco || ''} ${usuario.numero || ''} ${usuario.bairro || ''} ${usuario.cidade || ''} ${usuario.estado || ''}`.trim() : 'Endereço não cadastrado';
        const produtoTexto = descricao || 'Item(s) do pedido';

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            // envia para o e-mail do usuário quando disponível; bcc para o e-mail da loja
            to: (usuario && usuario.email) ? usuario.email : (process.env.EMAIL_USER || ''),
            bcc: process.env.EMAIL_USER || undefined,
            subject: `Pedido recebido — ${produtoTexto}`,
            text:
`Olá ${usuario && usuario.nome ? usuario.nome : 'cliente'},

Recebemos seu pedido: ${produtoTexto}
Valor: R$ ${Number(valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}

Seu pedido está em preparação. Quando o item estiver pronto para envio para o endereço:
${enderecoTexto}

Avisaremos por e-mail quando o envio for realizado.

Obrigado por comprar conosco!
`,
        };
        // Se o e-mail do usuário não existir, registrar warn
        if (!usuario || !usuario.email) {
          console.warn('[pagamento] usuário sem e-mail em sessão — enviando apenas para EMAIL_USER');
        }

        try {
          const info = await transporter.sendMail(mailOptions);
          console.log('[pix-confirm] e-mail enviado:', info && info.response);
        } catch (mailErr) {
          console.error('[pix-confirm] falha ao enviar e-mail:', mailErr);
          return res.render('pagamento-confirmado', { valor, descricao, usuario, mensagemErroEmail: 'Pedido registrado, mas falha ao enviar e-mail de confirmação. Verifique as configurações de e-mail.' });
        }

        // grava VENDE (se veio produtoId) ANTES de inserir a notificação
        const produtoId = produtoIdBody ? Number(produtoIdBody) : null;
        let vendaId = null;
        console.log('[pix-confirm] produtoId do form:', produtoId, 'usuario.ID:', usuario && usuario.ID);

        if (produtoId && usuario && usuario.ID) {
          try {
            const resInsert = await new Promise((resolve, reject) => {
              db.query(
                'INSERT INTO VENDE (Cliente_ID, Produto_ID, hora_venda, valor_venda, status) VALUES (?, ?, NOW(), ?, ?)',
                [usuario.ID, produtoId, valor, 'pendente'],
                (err, result) => err ? reject(err) : resolve(result)
              );
            });
            vendaId = resInsert.insertId;
            console.log('[pagamento] venda gravada id=', vendaId);
          } catch (e) {
            console.error('[pagamento] erro ao gravar VENDE:', e);
          }
        }

        if (usuario && usuario.ID) {
          const titulo = 'Pagamento Recebido';
          const mensagem = `Recebemos seu comprovante de pagamento no valor de R$ ${Number(valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}. Em breve seu pedido será processado e você receberá atualizações por e-mail.`;
          db.query(
            'INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
            [usuario.ID, titulo, mensagem, 'preparando', vendaId],
            (err) => { if (err) console.error('Erro ao gravar notificação PIX:', err); }
          );
        }

        return res.render('pagamento-confirmado', { valor, descricao, usuario });
    } catch (err) {
        console.error('Erro em /pagamento/pix-confirm:', err);
        return res.status(500).render('error', { error: err, message: 'Erro ao confirmar pedido via PIX' });
    }
});

router.post('/cartao', exigeLogin, async (req, res) => {
  try {
    const { valor, descricao, cep, endereco, numero, bairro, cidade, estado, nomeTitular, produtoId: produtoIdBody } = req.body;
    const usuario = req.session.usuario;

    const enderecoTexto = `${endereco || ''} ${numero || ''} ${bairro || ''} ${cidade || ''} ${estado || ''} ${cep || ''}`.trim();
    const produtoTexto = descricao || 'Item(s) do pedido';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: (usuario && usuario.email) ? usuario.email : (process.env.EMAIL_USER || ''),
      bcc: process.env.EMAIL_USER || undefined,
      subject: `Pedido recebido — ${produtoTexto}`,
      text:
`Olá ${usuario && usuario.nome ? usuario.nome : nomeTitular || 'cliente'},

Recebemos sua compra: ${produtoTexto}
Valor: R$ ${Number(valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}

Endereço de entrega:
${enderecoTexto}

Seu pedido está em preparação. Avisaremos por e-mail quando estiver pronto para envio.

Obrigado!
`
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('[cartao] e-mail enviado:', info && info.response);
    } catch (mailErr) {
      console.error('[cartao] falha ao enviar e-mail:', mailErr);
      return res.render('pagamento-confirmado', { valor, descricao, usuario, mensagemErroEmail: 'Pedido registrado, mas falha ao enviar e-mail de confirmação.' });
    }

    const produtoId = produtoIdBody ? Number(produtoIdBody) : null;
    let vendaId = null;
    console.log('[cartao] produtoId do form:', produtoId, 'usuario.ID:', usuario && usuario.ID);

    if (produtoId && usuario && usuario.ID) {
      try {
        const resInsert = await new Promise((resolve, reject) => {
          db.query(
            'INSERT INTO VENDE (Cliente_ID, Produto_ID, hora_venda, valor_venda) VALUES (?, ?, NOW(), ?)',
            [usuario.ID, produtoId, valor],
            (err, result) => err ? reject(err) : resolve(result)
          );
        });
        vendaId = resInsert.insertId;
        console.log('[pagamento] venda gravada id=', vendaId);
      } catch (e) {
        console.error('[pagamento] erro ao gravar VENDE (cartao):', e);
      }
    }

    if (usuario && usuario.ID) {
      const titulo = 'Pedido Recebido';
      const mensagem = `Recebemos sua compra: ${produtoTexto} no valor de R$ ${Number(valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}. Em breve seu pedido será processado.`;
      db.query(
        'INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
        [usuario.ID, titulo, mensagem, 'preparando', vendaId],
        (err) => { if (err) console.error('Erro ao gravar notificação (cartao):', err); }
      );
    }

    return res.render('pagamento-confirmado', { valor, descricao, usuario });
  } catch (err) {
    console.error('Erro em /pagamento/cartao:', err);
    return res.status(500).render('error', { error: err, message: 'Erro ao processar pagamento por cartão' });
  }
});

module.exports = router;