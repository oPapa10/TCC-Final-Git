require('dotenv').config();
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const db = require('../config/db'); // ajuste conforme seu arquivo de conexão

/* substitua a função upsertNotification por esta versão mais robusta (logs + fallback) */
let _notificacoesHasVendaId = null;
function checkNotificacoesHasVendaId() {
  if (_notificacoesHasVendaId !== null) return Promise.resolve(_notificacoesHasVendaId);
  return new Promise((resolve) => {
    db.query("SHOW COLUMNS FROM notificacoes LIKE 'venda_id'", (err, rows) => {
      if (err) {
        console.warn('[NOTIF] SHOW COLUMNS error:', err && err.code ? err.code : err);
        _notificacoesHasVendaId = false;
        return resolve(false);
      }
      _notificacoesHasVendaId = !!(rows && rows.length);
      resolve(_notificacoesHasVendaId);
    });
  });
}

async function upsertNotification(clienteId, vendaId, titulo, mensagem, status) {
  try {
    const hasVendaId = await checkNotificacoesHasVendaId();
    // debug info
    db.query('SELECT DATABASE() AS db', (dberr, dbrows) => {
      if (!dberr && dbrows && dbrows[0]) console.log('[NOTIF] DB conectado:', dbrows[0].db);
    });
    db.query('SHOW COLUMNS FROM notificacoes', (colErr, cols) => {
      if (!colErr && cols) console.log('[NOTIF] colunas notificacoes:', cols.map(c => c.Field).join(', '));
    });

    return new Promise((resolve, reject) => {
      if (hasVendaId) {
        db.query('SELECT id FROM notificacoes WHERE venda_id = ? LIMIT 1', [vendaId], (err, rows) => {
          if (err) {
            console.warn('[NOTIF] SELECT por venda_id falhou:', err.code, err.sqlMessage || err.message);
            // fallback inserir sem venda_id
            return db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status) VALUES (?, ?, ?, ?)', [clienteId, titulo, mensagem, status], (e, r) => e ? reject(e) : resolve(r));
          }
          if (rows && rows.length) {
            const id = rows[0].id;
            return db.query(
              'UPDATE notificacoes SET cliente_id = ?, titulo = ?, mensagem = ?, status = ?, lida = 0, created_at = NOW() WHERE id = ?',
              [clienteId, titulo, mensagem, status, id],
              (e, r) => e ? reject(e) : resolve(r)
            );
          }
          // insere com venda_id (tratando erro se a coluna estiver ausente por algum motivo)
          db.query(
            'INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
            [clienteId, titulo, mensagem, status, vendaId],
            (e, r) => {
              if (e) {
                console.error('[NOTIF] INSERT com venda_id falhou:', e.code, e.sqlMessage || e.message);
                if (e.code === 'ER_BAD_FIELD_ERROR') {
                  return db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status) VALUES (?, ?, ?, ?)', [clienteId, titulo, mensagem, status], (e2, r2) => e2 ? reject(e2) : resolve(r2));
                }
                return reject(e);
              }
              return resolve(r);
            }
          );
        });
      } else {
        // tabela sem venda_id -> insere simples
        db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status) VALUES (?, ?, ?, ?)', [clienteId, titulo, mensagem, status], (e, r) => e ? reject(e) : resolve(r));
      }
    });
  } catch (ex) {
    console.error('[NOTIF] upsertNotification catch:', ex);
    throw ex;
  }
}

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

/* --- helper: checar existência de coluna em tabela (cache) --- */
const _tableColumnCache = {};
function tableHasColumn(table, column) {
  const key = `${table}.${column}`;
  if (typeof _tableColumnCache[key] !== 'undefined') return Promise.resolve(_tableColumnCache[key]);
  return new Promise((resolve) => {
    db.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column], (err, rows) => {
      if (err) {
        console.warn(`[DB-CHECK] SHOW COLUMNS ${table}.${column} erro:`, err.code || err);
        _tableColumnCache[key] = false;
        return resolve(false);
      }
      _tableColumnCache[key] = !!(rows && rows.length);
      console.log(`[DB-CHECK] ${table}.${column} => ${_tableColumnCache[key]}`);
      resolve(_tableColumnCache[key]);
    });
  });
}

/* helper: insere item em PEDIDO_ITENS de forma adaptativa (detecta colunas) */
async function insertPedidoItem(usuarioId, produtoId, quantidade, vendaId, precoUnit) {
  return new Promise((resolve, reject) => {
    db.query('SHOW COLUMNS FROM PEDIDO_ITENS', (err, cols) => {
      if (err) {
        console.warn('[DB-ADAPT] SHOW COLUMNS PEDIDO_ITENS erro:', err && err.code ? err.code : err);
        return reject(err);
      }
      const fields = cols.map(c => c.Field);
      console.log('[DB-ADAPT] PEDIDO_ITENS colunas detectadas:', fields.join(', '));

      const insertCols = [];
      const params = [];

      if (fields.includes('usuario_id')) { insertCols.push('usuario_id'); params.push(usuarioId); }
      if (fields.includes('produto_id')) { insertCols.push('produto_id'); params.push(produtoId); }
      if (fields.includes('quantidade')) { insertCols.push('quantidade'); params.push(quantidade); }
      // venda_id é opcional
      if (vendaId !== undefined && vendaId !== null && fields.includes('venda_id')) { insertCols.push('venda_id'); params.push(vendaId); }
      // detecta alguma coluna para armazenar preço (valor_unitario, valor, preco_unitario, preco)
      const possiblePriceCols = ['valor_unitario','valor','preco_unitario','preco','valor_venda'];
      const priceCol = possiblePriceCols.find(c => fields.includes(c));
      if (priceCol) { insertCols.push(priceCol); params.push(precoUnit); }

      if (!insertCols.length) {
        console.warn('[DB-ADAPT] PEDIDO_ITENS sem colunas esperadas para inserção.');
        return reject(new Error('Tabela PEDIDO_ITENS não possui colunas compatíveis'));
      }

      const sql = `INSERT INTO PEDIDO_ITENS (${insertCols.join(',')}) VALUES (${insertCols.map(()=>'?').join(',')})`;
      console.log('[DB-ADAPT] INSERT PEDIDO_ITENS SQL:', sql, 'PARAMS:', params);

      db.query(sql, params, (e, r) => {
        if (e) {
          console.error('[DB-ADAPT] INSERT PEDIDO_ITENS falhou:', e.code, e.sqlMessage || e.message);
          return reject(e);
        }
        resolve(r);
      });
    });
  });
}

// Rota GET para exibir a página de pagamento (aceita checkout na sessão ou ?valor=... como antes)
router.get('/', exigeLogin, async (req, res) => {
    try {
+        console.log('[pagamento][GET /] query=', req.query || {});
+        console.log('[pagamento][GET /] session.checkout=', req.session && req.session.checkout ? req.session.checkout : null);
         const usuario = req.session.usuario || null;

        // se existir checkout na sessão, usamos ele
        const sessionCheckout = req.session.checkout && Array.isArray(req.session.checkout.itens) ? req.session.checkout.itens : null;

        let itensParaMostrar = [];
        let valorTotal = 0;
        let descricao = '';

        if (sessionCheckout) {
          // buscar dados atualizados dos produtos no DB (preço/promocao/imagem)
          const ids = sessionCheckout.map(i => i.produtoId);
          const placeholders = ids.length ? ids.map(()=>'?').join(',') : '0';
          const rows = await new Promise((resolve, reject) => {
            db.query(
              `SELECT p.ID, p.nome, p.imagem, p.valor AS valorOriginal, COALESCE(pr.valor_promocional, NULL) AS valor_promocional
               FROM Produto p LEFT JOIN Promocao pr ON pr.produto_id = p.ID WHERE p.ID IN (${placeholders})`,
              ids,
              (err, r) => err ? reject(err) : resolve(r || [])
            );
          });

          itensParaMostrar = sessionCheckout.map(si => {
            const prod = rows.find(r => r.ID === si.produtoId) || {};
            const precoUnit = (prod.valor_promocional !== null && prod.valor_promocional !== undefined) ? Number(prod.valor_promocional) : Number(prod.valorOriginal || si.precoUnitario || 0);
            const lineTotal = precoUnit * si.quantidade;
            valorTotal += lineTotal;
            return {
              produtoId: si.produtoId,
              nome: prod.nome || si.nome,
              imagem: prod.imagem || si.imagem,
              quantidade: si.quantidade,
              precoUnitario: precoUnit,
              lineTotal
            };
          });

          descricao = `Compra de ${itensParaMostrar.length} item(s)`;
        } else {
          // fallback: comportamento antigo (um produto via query) -> tenta carregar dados do produto para mostrar foto/nome
          const produtoIdQuery = req.query.produtoId ? Number(req.query.produtoId) : null;
          const quantidadeQuery = req.query.quantidade ? Number(req.query.quantidade) : 1;
          const descricaoQ = req.query.descricao || '';
          descricao = descricaoQ;

          if (produtoIdQuery) {
            // busca produto e promoção
            const rowsProd = await new Promise((resolve, reject) => {
              db.query(
                `SELECT p.ID, p.nome, p.imagem, p.valor AS valorOriginal,
                        (SELECT valor_promocional FROM Promocao WHERE produto_id = ? LIMIT 1) AS valor_promocional
                 FROM Produto p WHERE p.ID = ? LIMIT 1`,
                [produtoIdQuery, produtoIdQuery],
                (err, r) => err ? reject(err) : resolve(r || [])
              );
            }).catch(e => { console.warn('[pagamento] erro buscando produto via query:', e); return []; });

            if (rowsProd && rowsProd[0]) {
              const prod = rowsProd[0];
              const precoUnit = (prod.valor_promocional !== null && prod.valor_promocional !== undefined) ? Number(prod.valor_promocional) : Number(prod.valorOriginal || 0);
              const lineTotal = precoUnit * quantidadeQuery;
              valorTotal = lineTotal;
              itensParaMostrar = [{
                produtoId: prod.ID,
                nome: prod.nome,
                imagem: prod.imagem,
                quantidade: quantidadeQuery,
                precoUnitario: precoUnit,
                lineTotal
              }];
              descricao = descricao || `Compra de ${itensParaMostrar.length} item(s)`;
            } else {
              // sem produto encontrado — usa valor genérico se passado
              valorTotal = req.query.valor ? Number(req.query.valor) : 0;
            }
          } else {
            // sem produtoId — usa valor direto do querystring
            valorTotal = req.query.valor ? Number(req.query.valor) : 0;
          }
        }

        const txid = 'pedido-' + Date.now();
        const payload = buildPixPayload({
          chave: CHAVE_PIX,
          nome: NOME_RECEBEDOR,
          cidade: CIDADE_RECEBEDOR,
          valor: valorTotal,
          txid,
          complemento: descricao
        });
        const qrCodeImage = await QRCode.toDataURL(payload);

        res.render('pagamento', {
          valor: valorTotal,
          descricao,
          payload,
          qrCodeImage,
          usuario,
          itens: itensParaMostrar, // lista de itens para exibir na view
          // garante que produtoId/quantidade existam (evita ReferenceError na view)
          produtoId: req.query && req.query.produtoId ? Number(req.query.produtoId) : null,
          quantidade: req.query && req.query.quantidade ? Number(req.query.quantidade) : 1
        });
    } catch (err) {
        console.error('Erro gerando QR/Payload:', err);
        return res.status(500).render('error', { error: err, message: 'Erro ao gerar QR Code' });
    }
});

// Rota para confirmar pedido via PIX (usa req.session.checkout quando presente)
router.post('/compraConfirmacao', exigeLogin, async (req, res) => {
    try {
        console.log('[pagamento][POST /compraConfirmacao] inicio. req.get(referer)=', req.get('referer'));
        console.log('[pagamento][POST /compraConfirmacao] req.body=', req.body);
        console.log('[pagamento][POST /compraConfirmacao] session.checkout=', req.session && req.session.checkout ? req.session.checkout : null);
        const usuario = req.session.usuario;
        const checkout = req.session.checkout && Array.isArray(req.session.checkout.itens) ? req.session.checkout.itens : null;
        const valorFormulario = req.body.valor ? Number(req.body.valor) : 0;
        const descricao = req.body.descricao || '';
 
        // determina itens a processar: preferir sessão, senão usa produtoId do form (antigo) / fallback
        let itensProcessar = [];
        if (checkout) {
          itensProcessar = checkout;
        } else if (req.body && (req.body.produtoId || req.body.produtoID || req.body.produtoid)) {
          itensProcessar = [{ produtoId: Number(req.body.produtoId || req.body.produtoID || req.body.produtoid), quantidade: Number(req.body.quantidade || 1) }];
        } else {
          console.log('[pagamento][compraConfirmacao] sem checkout e sem produtoId no body. tentando extractItemsFromReq');
          itensProcessar = extractItemsFromReq(req);
          console.log('[pagamento][compraConfirmacao] extractItemsFromReq retornou:', itensProcessar);
          if (!itensProcessar || !itensProcessar.length) {
            console.error('[pagamento][compraConfirmacao] Nenhum item para processar. Verifique body, query, referer e session.');
            return res.status(400).render('error', { error: {}, message: 'Nenhum item para processar' });
          }
        }
 
        // busca preços atuais e insere VENDE por item; insere também PEDIDO_ITENS e notificação
        let vendaIds = [];
        for (const it of itensProcessar) {
          const produtoId = Number(it.produtoId);
          const quantidade = Number(it.quantidade || 1);
 
          // buscar produto e preço atual
          const produtos = await new Promise((resolve, reject) => {
            db.query('SELECT ID, nome, imagem, valor, estoque, (SELECT valor_promocional FROM Promocao WHERE produto_id = ? LIMIT 1) AS valor_promocional FROM Produto WHERE ID = ?', [produtoId, produtoId], (err, rows) => err ? reject(err) : resolve(rows || []));
          });
          const produto = produtos[0] || {};
          const precoUnit = (produto.valor_promocional !== null && produto.valor_promocional !== undefined) ? Number(produto.valor_promocional) : Number(produto.valor || 0);
          const valorVenda = precoUnit * quantidade;
 
          // insere VENDE
          const resInsert = await new Promise((resolve, reject) => {
            db.query('INSERT INTO VENDE (Cliente_ID, Produto_ID, hora_venda, valor_venda, status) VALUES (?, ?, NOW(), ?, ?)', [usuario.ID, produtoId, valorVenda, 'pendente'], (err, result) => err ? reject(err) : resolve(result));
          });
          const vendaId = resInsert.insertId;
          vendaIds.push(vendaId);
 
          // insere PEDIDO_ITENS (registro do item comprado)
          // usa helper adaptativo que detecta corretamente o nome da coluna de preço
          try {
            await insertPedidoItem(usuario.ID, produtoId, quantidade, vendaId, precoUnit);
          } catch (e) {
            console.error('[PEDIDO_ITENS] falha ao inserir item adaptativo:', e);
            // opcional: decidir rollback ou continuar — por enquanto registra erro e continua
          }
 
          // atualiza estoque (tenta decrementar)
          await new Promise((resolve, reject) => {
            db.query('UPDATE Produto SET estoque = GREATEST(0, estoque - ?) WHERE ID = ?', [quantidade, produtoId], (err) => err ? reject(err) : resolve());
          });
 
          // notificação
          const titulo = 'Pagamento Recebido';
          const mensagem = `Recebemos seu pagamento para ${produto.nome || 'produto'}. Valor: R$ ${valorVenda.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
          try {
            await upsertNotification(usuario.ID, vendaId, titulo, mensagem, 'pendente');
          } catch(e) {
            console.error('Erro ao gravar notificação:', e);
          }
        }
 
        // enviar e-mail (mantém comportamento anterior)
        try {
          const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: usuario && usuario.email ? usuario.email : (process.env.EMAIL_USER || ''),
            bcc: process.env.EMAIL_USER || undefined,
            subject: `Pagamento recebido — ${descricao || 'Pedido'}`,
            text: `Olá ${usuario && usuario.nome ? usuario.nome : 'cliente'},\n\nRecebemos seu pedido. Valor: R$ ${Number(valorFormulario || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}\n\nObrigado!`
          };
          await transporter.sendMail(mailOptions);
        } catch (mailErr) {
          console.error('[compraConfirmacao] falha ao enviar e-mail:', mailErr);
        }
 
        // limpar carrinho: remove itens comprados
        if (req.session.carrinho && Array.isArray(req.session.carrinho)) {
          const compradosIds = itensProcessar.map(i => Number(i.produtoId));
          req.session.carrinho = req.session.carrinho.filter(ci => !compradosIds.includes(Number(ci.produtoId)));
        }
        // limpar checkout
        delete req.session.checkout;
 
        return res.render('pagamento-confirmado', { valor: valorFormulario, descricao, usuario });
    } catch (err) {
        console.error('Erro em /pagamento/compraConfirmacao:', err);
        return res.status(500).render('error', { error: err, message: 'Erro ao confirmar pedido via PIX' });
    }
});
 
// extrai o handler existente para função reutilizável
async function handlePixConfirm(req, res) {
  try {
    console.log('[pagamento][handlePixConfirm] inicio. referer=', req.get('referer'));
    console.log('[pagamento][handlePixConfirm] req.body=', req.body);
    console.log('[pagamento][handlePixConfirm] session.checkout=', req.session && req.session.checkout ? req.session.checkout : null);
     // cópia do código atual de /pix-confirm (mantém lógica)
     const usuario = req.session.usuario;
     const checkout = req.session.checkout && Array.isArray(req.session.checkout.itens) ? req.session.checkout.itens : null;
     const valorFormulario = req.body.valor ? Number(req.body.valor) : 0;
     const descricao = req.body.descricao || '';
 
     // preferir checkout da sessão, caso contrário extrair do request
     let itensProcessar = [];
     if (checkout) {
       itensProcessar = checkout;
     } else {
       itensProcessar = extractItemsFromReq(req);
       console.log('[pagamento][handlePixConfirm] extractItemsFromReq retornou:', itensProcessar);
     }
     if (!itensProcessar || !itensProcessar.length) {
      console.error('[pagamento][handlePixConfirm] Nenhum item para processar. conferir logs: req.body, req.query, referer, session above.');
       return res.status(400).render('error', { error: {}, message: 'Nenhum item para processar' });
     }
 
     // processa cada item (mesma lógica já existente)
     let vendaIds = [];
     for (const it of itensProcessar) {
       const produtoId = Number(it.produtoId);
       const quantidade = Number(it.quantidade || 1);
 
       const produtos = await new Promise((resolve, reject) => {
         db.query('SELECT ID, nome, imagem, valor, estoque, (SELECT valor_promocional FROM Promocao WHERE produto_id = ? LIMIT 1) AS valor_promocional FROM Produto WHERE ID = ?', [produtoId, produtoId], (err, rows) => err ? reject(err) : resolve(rows || []));
       });
       const produto = produtos[0] || {};
       const precoUnit = (produto.valor_promocional !== null && produto.valor_promocional !== undefined) ? Number(produto.valor_promocional) : Number(produto.valor || 0);
       const valorVenda = precoUnit * quantidade;
 
       const resInsert = await new Promise((resolve, reject) => {
         db.query('INSERT INTO VENDE (Cliente_ID, Produto_ID, hora_venda, valor_venda, status) VALUES (?, ?, NOW(), ?, ?)', [usuario.ID, produtoId, valorVenda, 'pendente'], (err, result) => err ? reject(err) : resolve(result));
       });
       const vendaId = resInsert.insertId;
       vendaIds.push(vendaId);
 
       // insere PEDIDO_ITENS (registro do item comprado)
       await insertPedidoItem(usuario.ID, produtoId, quantidade, vendaId, precoUnit);
 
       // atualiza estoque (tenta decrementar)
       await new Promise((resolve, reject) => {
         db.query('UPDATE Produto SET estoque = GREATEST(0, estoque - ?) WHERE ID = ?', [quantidade, produtoId], (err) => err ? reject(err) : resolve());
       });
 
       const titulo = 'Pagamento Recebido';
       const mensagem = `Recebemos seu pagamento para ${produto.nome || 'produto'}. Valor: R$ ${valorVenda.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
       try {
         await upsertNotification(usuario.ID, vendaId, titulo, mensagem, 'pendente');
       } catch(e) {
         console.error('Erro ao gravar notificação:', e);
       }
     }
 
     // envio de e-mail (mantém)
     try {
       const mailOptions = {
         from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
         to: usuario && usuario.email ? usuario.email : (process.env.EMAIL_USER || ''),
         bcc: process.env.EMAIL_USER || undefined,
         subject: `Pagamento recebido — ${descricao || 'Pedido'}`,
         text: `Olá ${usuario && usuario.nome ? usuario.nome : 'cliente'},\n\nRecebemos seu pedido. Valor: R$ ${Number(valorFormulario || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}\n\nObrigado!`
       };
       await transporter.sendMail(mailOptions);
     } catch (mailErr) {
       console.error('[compraConfirmacao] falha ao enviar e-mail:', mailErr);
     }
 
     // limpa carrinho dos itens comprados e checkout
     if (req.session.carrinho && Array.isArray(req.session.carrinho)) {
       const compradosIds = itensProcessar.map(i => Number(i.produtoId));
       req.session.carrinho = req.session.carrinho.filter(ci => !compradosIds.includes(Number(ci.produtoId)));
     }
     delete req.session.checkout;
 
     return res.render('pagamento-confirmado', { valor: valorFormulario, descricao, usuario });
   } catch (err) {
     console.error('Erro em /pagamento/compraConfirmacao (handler):', err);
     return res.status(500).render('error', { error: err, message: 'Erro ao confirmar pedido via PIX' });
   }
}
 
// associa o handler às rotas existentes e ao novo alias /confirmar
router.post('/compraConfirmacao', exigeLogin, handlePixConfirm);
router.post('/confirmar', exigeLogin, handlePixConfirm);
 
// Rota cartao - mesma lógica de leitura de checkout
router.post('/cartao', exigeLogin, async (req, res) => {
  try {
    console.log('[pagamento][POST /cartao] inicio. req.body=', req.body, 'session.checkout=', req.session && req.session.checkout ? req.session.checkout : null, 'referer=', req.get('referer'));
    const usuario = req.session.usuario;
    const checkout = req.session.checkout && Array.isArray(req.session.checkout.itens) ? req.session.checkout.itens : null;
    const descricao = req.body.descricao || '';
 
    let itensProcessar = checkout || extractItemsFromReq(req);
    console.log('[pagamento][POST /cartao] itensProcessar=', itensProcessar);
    if (!itensProcessar || !itensProcessar.length) {
      console.error('[pagamento][POST /cartao] Nenhum item para processar');
      return res.status(400).render('error', { error: {}, message: 'Nenhum item para processar' });
    }
 
    for (const it of itensProcessar) {
      const produtoId = Number(it.produtoId);
      const quantidade = Number(it.quantidade || 1);
      const produtos = await new Promise((resolve, reject) => {
        db.query('SELECT ID, nome, valor, (SELECT valor_promocional FROM Promocao WHERE produto_id = ? LIMIT 1) AS valor_promocional FROM Produto WHERE ID = ?', [produtoId, produtoId], (err, rows) => err ? reject(err) : resolve(rows || []));
      });
      const produto = produtos[0] || {};
      const precoUnit = (produto.valor_promocional !== null && produto.valor_promocional !== undefined) ? Number(produto.valor_promocional) : Number(produto.valor || 0);
      const valorVenda = precoUnit * quantidade;
 
      const resInsert = await new Promise((resolve, reject) => {
        db.query('INSERT INTO VENDE (Cliente_ID, Produto_ID, hora_venda, valor_venda, status) VALUES (?, ?, NOW(), ?, ?)', [usuario.ID, produtoId, valorVenda, 'pendente'], (err, result) => err ? reject(err) : resolve(result));
      });
      const vendaId = resInsert.insertId;
 
      // insere PEDIDO_ITENS (registro do item comprado)
      await insertPedidoItem(usuario.ID, produtoId, quantidade, vendaId, precoUnit);
 
      await new Promise((resolve, reject) => {
        db.query('UPDATE Produto SET estoque = GREATEST(0, estoque - ?) WHERE ID = ?', [quantidade, produtoId], (err) => err ? reject(err) : resolve());
      });
 
      const titulo = 'Pedido Recebido';
      const mensagem = `Recebemos sua compra: ${produto.nome || 'produto'} no valor de R$ ${valorVenda.toLocaleString('pt-BR', {minimumFractionDigits:2})}.`;
      try { await upsertNotification(usuario.ID, vendaId, titulo, mensagem, 'pendente'); } catch(e) { console.error('Erro notificação:', e); }
    }
 
    // limpar carrinho e checkout
    if (req.session.carrinho && Array.isArray(req.session.carrinho)) {
      const compradosIds = itensProcessar.map(i => Number(i.produtoId));
      req.session.carrinho = req.session.carrinho.filter(ci => !compradosIds.includes(Number(ci.produtoId)));
    }
    delete req.session.checkout;
 
    return res.render('pagamento-confirmado', { valor: req.body.valor || 0, descricao, usuario });
  } catch (err) {
    console.error('Erro em /pagamento/cartao:', err);
    return res.status(500).render('error', { error: err, message: 'Erro ao processar pagamento por cartão' });
  }
});
 
function extractItemsFromReq(req) {
  console.log('[pagamento][extractItemsFromReq] entrada. body=', req.body, 'query=', req.query, 'referer=', req.get('referer'), 'session.checkout=', req.session && req.session.checkout ? req.session.checkout : null);
   // 1) itens vindo do body (formulário com itens)
   if (req.body && req.body.itens) {
     try {
       // pode vir como objeto/array dependendo do form
       const raw = req.body.itens;
       if (Array.isArray(raw)) {
        console.log('[pagamento][extractItemsFromReq] encontrou req.body.itens como array:', raw);
         return raw.map(it => ({ produtoId: Number(it.produtoId), quantidade: Number(it.quantidade || 1) }));
       } else if (typeof raw === 'object') {
        console.log('[pagamento][extractItemsFromReq] encontrou req.body.itens como objeto:', raw);
         // objeto com chaves numéricas ou único item
         const arr = [];
         Object.keys(raw).forEach(k => {
           const entry = raw[k];
           if (entry && (entry.produtoId || entry.produtoId === 0 || entry.produtoId === '0')) {
             arr.push({ produtoId: Number(entry.produtoId), quantidade: Number(entry.quantidade || 1) });
           }
         });
         if (arr.length) return arr;
       }
     } catch (e) {
      console.error('[pagamento][extractItemsFromReq] erro processando req.body.itens:', e);
       // ignore e continue fallback
     }
   }
 
   // 2) produtoId direto no body (nome pode variar em maiúsculas/minúsculas)
   const pid = (req.body && (req.body.produtoId || req.body.produtoID || req.body.produtoid));
   if (typeof pid !== 'undefined' && pid !== null && String(pid).trim() !== '') {
    console.log('[pagamento][extractItemsFromReq] encontrou produtoId no body:', pid, 'quantidade:', req.body.quantidade || req.body.qtd || 1);
     return [{ produtoId: Number(pid), quantidade: Number(req.body.quantidade || req.body.qtd || 1) }];
   }
 
   // 3) produtoId na query (caso o form não tenha enviado mas o referer possua)
   if (req.query && req.query.produtoId) {
    console.log('[pagamento][extractItemsFromReq] encontrou produtoId na query:', req.query);
     return [{ produtoId: Number(req.query.produtoId), quantidade: Number(req.query.quantidade || 1) }];
   }
 
   // 4) extrair do referer (fallback para links /pagamento?produtoId=...)
   const ref = req.get('referer') || '';
   try {
     const m = ref.match(/[?&]produtoId=(\d+)/i);
     if (m && m[1]) {
      console.log('[pagamento][extractItemsFromReq] extraindo produtoId do referer:', ref);
       const q = {};
       const qstr = ref.split('?')[1] || '';
       qstr.split('&').forEach(pair => {
         const [k, v] = pair.split('=');
         if (k && v) q[decodeURIComponent(k)] = decodeURIComponent(v);
       });
      console.log('[pagamento][extractItemsFromReq] querystring do referer =', q);
       return [{ produtoId: Number(m[1]), quantidade: Number(q.quantidade || q.qty || q.qtd || 1) }];
     }
   } catch (e) {
    console.error('[pagamento][extractItemsFromReq] erro extraindo do referer:', e);
     // nada
   }
 
  console.log('[pagamento][extractItemsFromReq] nenhum item encontrado.');
   // nenhum item encontrado
   return [];
 }

module.exports = router;