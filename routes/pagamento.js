require('dotenv').config();
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// ✅ Configurar transporter FORA das rotas
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Função para converter imagem para Base64
function imageToBase64(relativePath) {
  try {
    const filePath = path.join(__dirname, '..', 'public', relativePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('[BASE64] Arquivo não encontrado:', filePath);
      return null;
    }

    const fileExtension = path.extname(filePath).toLowerCase().slice(1);
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    const base64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.error('[BASE64] Erro ao converter imagem:', err);
    return null;
  }
}

// Função para gerar payload PIX (EMV)
function gerarPayloadPix(chave, nome, cidade, valor, txid, complemento) {
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

// middleware: exige login para acessar pagamento
function exigeLogin(req, res, next) {
  if (!req.session || !req.session.usuario) {
    // redireciona para login com redirect
    const redirectTo = encodeURIComponent(req.originalUrl || '/pagamento');
    return res.redirect('/login?redirect=' + redirectTo);
  }
  next();
}

// Monta HTML do email com imagens embutidas em Base64
async function sendOrderEmail(usuario, itens = [], valorTotal = 0, descricao = '') {
  try {
    const baseItensHtml = itens.map(it => {
      const imagemBase64 = imageToBase64(it.imagem) || imageToBase64(`/uploads/${path.basename(it.imagem || '')}`) || null;
      const imgHtml = imagemBase64
        ? `<img src="${imagemBase64}" alt="${(it.nome||'Produto')}" style="width:88px;height:88px;object-fit:cover;border-radius:6px;border:1px solid #e6e6e6">`
        : `<div style="width:88px;height:88px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px">Sem imagem</div>`;

      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;width:100px">${imgHtml}</td>
        <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle">
          <div style="font-size:14px;color:#111;font-weight:600;margin-bottom:6px">${(it.nome||'Produto')}</div>
          <div style="font-size:13px;color:#6b7280">Qtd: ${Number(it.quantidade||1)}</div>
        </td>
        <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;text-align:right;color:#111;font-weight:600">R$ ${(Number(it.precoUnitario||0)).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
        <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;text-align:right;color:#111;font-weight:700">R$ ${(Number(it.lineTotal|| (it.precoUnitario*it.quantidade) )).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
      </tr>`;
    }).join('\n');

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f7fb;padding:30px;">
        <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(15,23,42,0.08)">
          <div style="padding:20px 24px;border-bottom:1px solid #eef2f7;background:linear-gradient(90deg,#ffffff,#fbfcff)">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:48px;height:48px;border-radius:8px;background:#0b5ed7;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700">CM</div>
              <div>
                <div style="font-size:16px;color:#0b5ed7;font-weight:700">Center Motos</div>
                <div style="font-size:12px;color:#6b7280">Confirmação de Pedido</div>
              </div>
            </div>
          </div>

          <div style="padding:18px 24px;">
            <p style="margin:0 0 12px 0;color:#111;font-size:14px">
              Olá <strong>${usuario && usuario.nome ? usuario.nome : 'cliente'}</strong>,
            </p>
            ${descricao ? `<p style="margin:0 0 12px 0;color:#4b5563;font-size:13px">${descricao}</p>` : ''}
            <div style="border:1px solid #eef2f7;border-radius:6px;overflow:hidden;margin-top:12px">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
                <thead>
                  <tr style="background:#fafafa">
                    <th style="text-align:left;padding:12px 12px;color:#6b7280;font-size:13px">Produto</th>
                    <th style="text-align:left;padding:12px 12px;color:#6b7280;font-size:13px"></th>
                    <th style="text-align:right;padding:12px 12px;color:#6b7280;font-size:13px">Valor</th>
                    <th style="text-align:right;padding:12px 12px;color:#6b7280;font-size:13px">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${baseItensHtml}
                </tbody>
              </table>
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:18px;align-items:center;gap:16px">
              <div style="text-align:right">
                <div style="color:#6b7280;font-size:13px">Valor total</div>
                <div style="font-size:20px;color:#111;font-weight:800">R$ ${Number(valorTotal||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
              </div>
            </div>

            <p style="margin-top:18px;color:#6b7280;font-size:13px">
              Em breve você receberá informações sobre o envio. Se precisar de ajuda, responda este e-mail.
            </p>
          </div>

          <div style="padding:14px 24px;background:#fff;border-top:1px solid #eef2f7">
            <div style="font-size:12px;color:#9ca3af;text-align:center">
              Center Motos — Loja e Oficina • Rua João José Guimarães, nº 748, Centro, Sombrio
            </div>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: usuario && usuario.email ? usuario.email : (process.env.EMAIL_USER || ''),
      bcc: process.env.EMAIL_USER || undefined,
      subject: `Confirmação do pedido — ${descricao ? descricao : 'Center Motos'}`,
      html,
      text: `Confirmação de pedido. Total: R$ ${Number(valorTotal||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
    };

    console.log('[EMAIL] enviando confirmação para:', mailOptions.to, 'itens:', itens.length);
    await transporter.sendMail(mailOptions);
    console.log('[EMAIL] envio concluído');
    return true;
  } catch (err) {
    console.error('[EMAIL] falha ao enviar email de pedido:', err);
    return false;
  }
}

/* --- ROTA GET - RENDERIZAR PÁGINA DE PAGAMENTO --- */
router.get('/', exigeLogin, async (req, res) => {
  try {
    const { valor, descricao, produtoId } = req.query;
    const quantidadeQuery = Number(req.query.quantidade || 1);
    const usuario = req.session.usuario || null;

    let itensParaMostrar = [];
    let valorTotal = Number(valor || 0);

    if (produtoId) {
      try {
        const rows = await new Promise((resolve, reject) => {
          db.query(
            `SELECT p.ID, p.nome, p.imagem, p.valor AS valorOriginal,
                    COALESCE(pr.valor_promocional, NULL) AS valor_promocional
             FROM Produto p
             LEFT JOIN Promocao pr ON pr.produto_id = p.ID
             WHERE p.ID = ?`,
            [produtoId],
            (err, r) => err ? reject(err) : resolve(r || [])
          );
        });

        if (rows && rows.length) {
          const prod = rows[0];
          const precoUnit = (prod.valor_promocional != null) ? Number(prod.valor_promocional) : Number(prod.valorOriginal || 0);
          const lineTotal = precoUnit * quantidadeQuery;
          valorTotal = lineTotal;

          // Monta URL da imagem corretamente
          let imagemUrl = '/images/placeholder.png';
          if (prod.imagem) {
            if (/^https?:\/\//i.test(prod.imagem)) {
              imagemUrl = prod.imagem;
            } else {
              const clean = String(prod.imagem).split('?')[0];
              const filename = path.basename(clean);
              imagemUrl = `/uploads/${filename}`;
            }
          }

          itensParaMostrar = [{
            produtoId: prod.ID,
            imagem: imagemUrl,
            nome: prod.nome,
            quantidade: quantidadeQuery,
            precoUnitario: precoUnit,
            precoOriginal: prod.valor_promocional != null ? Number(prod.valorOriginal) : null,  // ✅ ADICIONE ISTO
            lineTotal
          }];
        }
      } catch (dbErr) {
        console.warn('[pagamento] erro buscando produto:', dbErr);
      }
    }

    const txid = 'pedido-' + Date.now();
    const payload = gerarPayloadPix(
      process.env.CHAVE_PIX || '',
      process.env.PIX_NOME || 'Center Motos',
      process.env.PIX_CIDADE || 'Sombrio',
      valorTotal,
      txid,
      descricao
    );
    const qrCodeImage = await QRCode.toDataURL(payload);

    res.render('pagamento', {
      valor: valorTotal,
      descricao,
      payload,
      qrCodeImage,
      usuario,
      itens: itensParaMostrar,
      produtoId: produtoId || null,
      quantidade: quantidadeQuery
    });
  } catch (err) {
    console.error('[pagamento][GET /] erro:', err);
    res.status(500).send('Erro no servidor');
  }
});

// ✅ ROTA POST - PROCESSAR COMPRA
router.post('/compraConfirmacao', exigeLogin, async (req, res) => {
  try {
    const usuario = req.session.usuario;
    const { valor, descricao, itensArray } = req.body;
    const valorFormulario = Number(valor || 0);

    let itensProcessar = [];
    
    console.log('[compraConfirmacao] itensArray recebido:', itensArray);
    console.log('[compraConfirmacao] req.body completo:', req.body);

    if (itensArray) {
      if (Array.isArray(itensArray)) {
        itensProcessar = itensArray.filter(it => it && it.produtoId);
      } else if (typeof itensArray === 'object') {
        itensProcessar = Object.values(itensArray).filter(it => it && it.produtoId);
      }
    }

    console.log('[compraConfirmacao] itensProcessar após tratamento:', itensProcessar);

    if (!itensProcessar.length) {
      console.error('[compraConfirmacao] Nenhum item encontrado:', { itensArray, itensProcessar });
      return res.status(400).json({ error: 'Nenhum item para processar' });
    }

    const ids = itensProcessar.map(i => Number(i.produtoId)).filter(Boolean);
    
    if (!ids.length) {
      return res.status(400).json({ error: 'IDs de produtos inválidos' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const produtosRows = await new Promise((resolve, reject) => {
      db.query(
        `SELECT p.ID, p.nome, p.imagem, p.valor AS valorOriginal,
                COALESCE(pr.valor_promocional, NULL) AS valor_promocional
         FROM Produto p
         LEFT JOIN Promocao pr ON pr.produto_id = p.ID
         WHERE p.ID IN (${placeholders})`,
        ids,
        (err, r) => err ? reject(err) : resolve(r || [])
      );
    });

    let itensParaEmail = [];
    let itensParaSessao = [];
    let somaTotal = 0;

    itensProcessar.forEach(it => {
      const prod = produtosRows.find(p => p.ID === Number(it.produtoId)) || {};
      const precoUnit = (prod.valor_promocional != null) ? Number(prod.valor_promocional) : Number(prod.valorOriginal || 0);
      const qtd = Number(it.quantidade || 1);
      const lineTotal = precoUnit * qtd;
      somaTotal += lineTotal;

      let imagemUrl = '/images/placeholder.png';
      if (prod.imagem) {
        if (/^https?:\/\//i.test(prod.imagem)) {
          imagemUrl = prod.imagem;
        } else {
          const clean = String(prod.imagem).split('?')[0];
          const filename = path.basename(clean);
          imagemUrl = `/uploads/${filename}`;
        }
      }

      const itemObj = {
        produtoId: it.produtoId,
        imagem: imagemUrl,
        nome: prod.nome || 'Produto',
        quantidade: qtd,
        precoUnitario: precoUnit,
        precoOriginal: (prod.valor_promocional != null) ? Number(prod.valorOriginal) : null,  // ✅ ADICIONE ISTO
        lineTotal
      };

      itensParaEmail.push(itemObj);
      itensParaSessao.push(itemObj);
    });

    console.log('[compraConfirmacao] email será enviado com:', itensParaEmail.length, 'itens');

    // ✅ ARMAZENA DADOS NA SESSÃO PARA A PÁGINA DE CONFIRMAÇÃO
    req.session.ultimaCompra = {
      itens: itensParaSessao,
      valor: somaTotal || valorFormulario,
      descricao: descricao,
      data: new Date().toISOString()
    };

    await sendOrderEmail(usuario, itensParaEmail, somaTotal || valorFormulario, descricao);

    res.json({ 
      success: true, 
      message: 'Pedido processado com sucesso',
      redirect: '/pagamento/compra-confirmacao'
    });
  } catch (err) {
    console.error('[compraConfirmacao] erro:', err);
    res.status(500).json({ error: 'Erro ao processar compra: ' + err.message });
  }
});

// ✅ ADICIONE ROTA GET PARA EXIBIR CONFIRMAÇÃO (atualizada)
router.get('/compra-confirmacao', exigeLogin, (req, res) => {
  const ultimaCompra = req.session.ultimaCompra || {};
  
  res.render('compraConfirmacao', {
    usuario: req.session.usuario,
    itens: ultimaCompra.itens || [],
    valor: ultimaCompra.valor || 0,
    descricao: ultimaCompra.descricao || ''
  });

  // ✅ LIMPA DADOS APÓS USAR (para não mostrar compra antiga se recarregar)
  delete req.session.ultimaCompra;
});

module.exports = router;