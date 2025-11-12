const express = require('express');
const path = require('path');
const db = require('../config/db');
const router = express.Router();
const nodemailer = require('nodemailer');
const fs = require('fs');

// ✅ CONFIGURAR TRANSPORTER PARA EMAIL
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ FUNÇÃO PARA CONVERTER IMAGEM PARA BASE64
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

// ✅ FUNÇÃO PARA ENVIAR EMAIL DO CARRINHO
async function sendCartOrderEmail(usuario, itens = [], valorTotal = 0) {
  try {
    const baseItensHtml = itens.map(it => {
      const imagemBase64 = imageToBase64(it.imagem) || imageToBase64(`/uploads/${path.basename(it.imagem || '')}`) || null;
      const imgHtml = imagemBase64
        ? `<img src="${imagemBase64}" alt="${(it.nome||'Produto')}" style="width:88px;height:88px;object-fit:cover;border-radius:6px;border:1px solid #e6e6e6">`
        : `<div style="width:88px;height:88px;background:#f3f4f6;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px">Sem imagem</div>`;

      // ✅ MOSTRA PREÇO COM DESCONTO
      const precoHtml = it.precoOriginal 
        ? `<div style="font-size:12px;color:#999"><s>R$ ${(Number(it.precoOriginal)).toLocaleString('pt-BR',{minimumFractionDigits:2})}</s></div><div style="color:#28a745;font-weight:600">R$ ${(Number(it.precoUnitario)).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>`
        : `R$ ${(Number(it.precoUnitario||0)).toLocaleString('pt-BR',{minimumFractionDigits:2})}`;

      return `<tr>
        <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;width:100px">${imgHtml}</td>
        <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle">
          <div style="font-size:14px;color:#111;font-weight:600;margin-bottom:6px">${(it.nome||'Produto')}</div>
          <div style="font-size:13px;color:#6b7280">Qtd: ${Number(it.quantidade||1)}</div>
        </td>
        <td style="padding:12px;border-bottom:1px solid #f1f1f1;vertical-align:middle;text-align:right;color:#111;font-weight:600">${precoHtml}</td>
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
                <div style="font-size:12px;color:#6b7280">Confirmação de Pedido do Carrinho</div>
              </div>
            </div>
          </div>

          <div style="padding:18px 24px;">
            <p style="margin:0 0 12px 0;color:#111;font-size:14px">
              Olá <strong>${usuario && usuario.nome ? usuario.nome : 'cliente'}</strong>,
            </p>
            <p style="margin:0 0 12px 0;color:#4b5563;font-size:13px">
              Você finalizou a compra de múltiplos produtos do seu carrinho. Confira os detalhes abaixo:
            </p>
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
      subject: `Confirmação de Pedido — Carrinho (${itens.length} produto${itens.length > 1 ? 's' : ''})`,
      html,
      text: `Confirmação de pedido do carrinho. Total: R$ ${Number(valorTotal||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`
    };

    console.log('[EMAIL-CARRINHO] enviando confirmação para:', mailOptions.to, 'itens:', itens.length);
    await transporter.sendMail(mailOptions);
    console.log('[EMAIL-CARRINHO] envio concluído');
    return true;
  } catch (err) {
    console.error('[EMAIL-CARRINHO] falha ao enviar email:', err);
    return false;
  }
}

// Função para limitar a quantidade no carrinho de acordo com o estoque
function limitarCarrinhoPorEstoque(carrinho, produtos) {
    const estoqueMap = {};
    produtos.forEach(p => estoqueMap[p.ID] = p.estoque);

    return carrinho.map(item => {
        const estoque = estoqueMap[item.produtoId] ?? 0;
        return {
            ...item,
            quantidade: Math.min(item.quantidade, estoque)
        };
    });
}

// Rota para exibir o carrinho
router.get('/', (req, res) => {
  let carrinho = req.session.carrinho || [];
  if (carrinho.length === 0) {
    return res.render('carrinho', { carrinho: [], mensagemCompra: 'Compra finalizada com sucesso! Avalie seus produtos.' });
  }

  const ids = carrinho.map(item => Number(item.produtoId));
  const placeholders = ids.map(() => '?').join(',');
  const sql = `
    SELECT p.*, pr.valor_promocional 
    FROM Produto p
    LEFT JOIN Promocao pr ON pr.produto_id = p.ID
    WHERE p.ID IN (${placeholders})
  `;

  db.query(sql, ids, (err, produtos) => {
    if (err) {
      console.error('Erro ao buscar produtos do carrinho:', err);
      return res.status(500).send('Erro ao buscar produtos');
    }

    const produtosArray = Array.isArray(produtos) ? produtos : [produtos];

    // Monta o carrinho completo e verifica estoque e promoção
    const carrinhoCompleto = carrinho.map(item => {
      const produto = produtosArray.find(p => p.ID == item.produtoId);
      const valorPromocionalAtual = produto && produto.valor_promocional ? Number(produto.valor_promocional) : null;
      const valorOriginal = produto && produto.valor ? Number(produto.valor) : 0;
      const estoque = produto ? produto.estoque : 0;
      let semEstoque = estoque <= 0;

      // Detecta mudança de promoção
      let mudancaPromocao = false;
      // Se o valor anterior era promocional e agora não é, ou mudou o valor promocional
      if (
        item.valorPromocional !== undefined &&
        ((item.valorPromocional !== null && valorPromocionalAtual === null) ||
         (item.valorPromocional !== null && valorPromocionalAtual !== null && item.valorPromocional !== valorPromocionalAtual))
      ) {
        mudancaPromocao = true;
        console.log(`[PROMOÇÃO] Produto ${item.produtoId} perdeu ou mudou promoção!`);
      } else {
        console.log(`[PROMOÇÃO] Produto ${item.produtoId} - anterior: ${item.valorPromocional}, atual: ${valorPromocionalAtual}, mudancaPromocao: ${mudancaPromocao}`);
      }

      // Atualiza o valor anterior para o próximo GET
      item.valorPromocional = valorPromocionalAtual;

      return {
        ...item,
        nome: produto ? produto.nome : 'Produto removido',
        imagem: produto ? produto.imagem : '',
        preco: valorPromocionalAtual || valorOriginal,
        valorOriginal,
        valorPromocional: valorPromocionalAtual,
        estoque,
        oculto: item.oculto || semEstoque,
        semEstoque,
        mudancaPromocao
      };
    });

    carrinhoCompleto.sort((a, b) => a.produtoId - b.produtoId);
    res.render('carrinho', { carrinho: carrinhoCompleto });
  });
});

// Rota para adicionar item ao carrinho
router.post('/adicionar', (req, res) => {
  const { produtoId, quantidade } = req.body;
  const qtd = Number(quantidade || 1);

  if (!produtoId || qtd < 1) {
    return res.status(400).json({ success: false, message: 'Dados inválidos' });
  }

  // Busca nome do produto para resposta
  db.query('SELECT ID, nome FROM Produto WHERE ID = ?', [produtoId], (err, rows) => {
    if (err || !rows || !rows.length) {
      return res.status(404).json({ success: false, message: 'Produto não encontrado' });
    }

    const produtoNome = rows[0].nome;
    req.session.carrinho = req.session.carrinho || [];

    const itemExistente = req.session.carrinho.find(item => Number(item.produtoId) === Number(produtoId));

    if (itemExistente) {
      itemExistente.quantidade = Number(itemExistente.quantidade || 1) + qtd;
    } else {
      req.session.carrinho.push({
        produtoId: Number(produtoId),
        quantidade: qtd,
        nome: produtoNome,
      });
    }

    // Se usuário logado, persiste no banco (upsert)
    if (req.session.usuario && req.session.usuario.ID) {
      const usuarioId = Number(req.session.usuario.ID);
      db.query(
        'INSERT INTO CARRINHO (usuario_id, produto_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + ?',
        [usuarioId, produtoId, qtd, qtd],
        (dbErr) => {
          if (dbErr) {
            console.error('[CARRINHO][adicionar] erro ao persistir no DB:', dbErr);
            // mesmo em erro de BD, responde sucesso para não bloquear UX
            return res.json({ success: true, message: 'Produto adicionado ao carrinho (sessão)', produtoNome, quantidade: qtd });
          }
          console.log('[CARRINHO][adicionar] persistido no DB:', { usuarioId, produtoId, qtd });
          return res.json({ success: true, message: 'Produto adicionado ao carrinho', produtoNome, quantidade: qtd });
        }
      );
    } else {
      // usuário não logado — apenas sessão
      return res.json({
        success: true,
        message: 'Produto adicionado ao carrinho (sessão)',
        produtoNome,
        quantidade: qtd
      });
    }
  });
});

// Rota para remover item do carrinho
router.post('/remover', (req, res) => {
  const { produtoId } = req.body;
  if (req.session.carrinho) {
    req.session.carrinho = req.session.carrinho.filter(item => item.produtoId != produtoId);
  }
  if (req.session.usuario) {
    db.query(
      'DELETE FROM CARRINHO WHERE usuario_id = ? AND produto_id = ?',
      [req.session.usuario.ID, produtoId],
      (err) => {
        res.redirect('/carrinho');
      }
    );
  } else {
    res.redirect('/carrinho');
  }
});

// Rota para contar itens no carrinho
router.get('/contador', (req, res) => {
  const carrinho = req.session.carrinho || [];
  const total = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  res.json({ total });
});

// Rota para alterar a quantidade de um item no carrinho
router.post('/alterar', (req, res) => {
    const { produtoId, acao } = req.body;
    if (!produtoId || !acao) return res.redirect('/carrinho');

    db.query('SELECT estoque FROM Produto WHERE ID = ?', [produtoId], (err, results) => {
        if (err || !results[0]) return res.redirect('/carrinho');
        const estoque = results[0].estoque ?? 0;

        if (!req.session.carrinho) req.session.carrinho = [];
        const idx = req.session.carrinho.findIndex(item => item.produtoId == produtoId);
        if (idx < 0) return res.redirect('/carrinho');

        let quantidade = req.session.carrinho[idx].quantidade;
        if (acao === 'aumentar' && quantidade < estoque) {
            quantidade += 1;
        } else if (acao === 'diminuir' && quantidade > 1) {
            quantidade -= 1;
        }
        req.session.carrinho[idx].quantidade = quantidade;

        if (req.session.usuario) {
            db.query(
                'UPDATE CARRINHO SET quantidade = ? WHERE usuario_id = ? AND produto_id = ?',
                [quantidade, req.session.usuario.ID, produtoId]
            );
        }
        res.redirect('/carrinho');
    });
});

// Ocultar item
router.post('/ocultar', (req, res) => {
  const { produtoId } = req.body;
  if (req.session.carrinho) {
    req.session.carrinho = req.session.carrinho.map(item =>
      item.produtoId == produtoId ? { ...item, oculto: true } : item
    );
  }
  res.json({ success: true });
});

// Mostrar item novamente
router.post('/mostrar', (req, res) => {
  const { produtoId } = req.body;
  if (req.session.carrinho) {
    req.session.carrinho = req.session.carrinho.map(item =>
      item.produtoId == produtoId ? { ...item, oculto: false } : item
    );
  }
  res.json({ success: true });
});

router.post('/pedido/finalizar', async (req, res) => {
  try {
    if (!req.session.usuario) {
      return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para finalizar a compra.' });
    }

    let carrinho = req.session.carrinho || [];
    const ativos = carrinho.filter(item => !item.oculto && !item.semEstoque);

    if (ativos.length === 0) {
      return res.redirect('/carrinho');
    }

    // Helper para query com Promise
    const queryAsync = (sql, params) => new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });

    // Carrega dados atuais dos produtos (preço, estoque, promoção)
    const ids = ativos.map(it => Number(it.produtoId));
    const placeholders = ids.map(() => '?').join(',');
    const produtosRows = await queryAsync(
      `SELECT p.ID, p.nome, p.imagem, p.valor, p.estoque, COALESCE(pr.valor_promocional, NULL) AS valor_promocional
       FROM Produto p
       LEFT JOIN Promocao pr ON pr.produto_id = p.ID
       WHERE p.ID IN (${placeholders})`,
      ids
    );

    // Monta itens para email e checkout com preços atualizados e atualiza estoque
    const itensParaEmail = [];
    const itensParaCheckout = [];
    let somaTotal = 0;

    for (const item of ativos) {
      const prod = produtosRows.find(p => p.ID === Number(item.produtoId));
      if (!prod) continue;

      const precoUnitario = (prod.valor_promocional != null) ? Number(prod.valor_promocional) : Number(prod.valor || 0);
      const precoOriginal = (prod.valor_promocional != null) ? Number(prod.valor || 0) : null;
      const quantidade = Number(item.quantidade || 1);
      const lineTotal = precoUnitario * quantidade;
      somaTotal += lineTotal;

      // Atualiza estoque no banco (garante não negativo)
      const novoEstoque = Math.max(0, (Number(prod.estoque || 0) - quantidade));
      try {
        await queryAsync('UPDATE Produto SET estoque = ? WHERE ID = ?', [novoEstoque, prod.ID]);
      } catch (err) {
        console.error('[finalizar] falha ao atualizar estoque para produto', prod.ID, err);
        // continua mesmo assim (ou você pode optar por abortar)
      }

      const imagemUrl = prod.imagem ? prod.imagem : '';

      const itemObj = {
        produtoId: Number(prod.ID),
        imagem: imagemUrl,
        nome: prod.nome || item.nome || 'Produto',
        quantidade,
        precoUnitario,
        precoOriginal,
        lineTotal
      };

      itensParaEmail.push(itemObj);
      itensParaCheckout.push({
        produtoId: Number(prod.ID),
        quantidade,
        nome: prod.nome,
        imagem: imagemUrl,
        precoUnitario
      });
    }

    // Remove do session.carrinho os itens comprados (mantém ocultos e itens não comprados)
    const compradosIds = itensParaCheckout.map(i => Number(i.produtoId));
    req.session.carrinho = (req.session.carrinho || []).filter(item => {
      // mantém se oculto, semEstoque, ou não foi comprado agora
      return item.oculto || item.semEstoque || !compradosIds.includes(Number(item.produtoId));
    });

    // salva checkout na sessão
    req.session.checkout = {
      itens: itensParaCheckout,
      criadoEm: Date.now(),
      source: 'cart'
    };

    // redireciona para pagamento (SEM enviar email ainda)
    return res.redirect('/pagamento');
  } catch (err) {
    console.error('[finalizar] erro ao processar pedido do carrinho:', err);
    return res.status(500).render('error', { error: err, message: 'Erro ao finalizar pedido' });
  }
});

// Exemplo para rota POST /comprar-agora
router.post('/comprar-agora', (req, res) => {
    if (!req.session || !req.session.usuario) {
        // redireciona para login e volta para a confirmação depois
        const redirectTo = encodeURIComponent('/comprar-confirmacao/' + (req.body.produtoId || ''));
        return res.redirect('/login?redirect=' + redirectTo);
    }

    const produtoId = Number(req.body.produtoId || req.query.produtoId || 0);
    const quantidade = Math.max(1, Number(req.body.quantidade || req.query.quantidade || 1));

    if (!produtoId) return res.status(400).render('error', { error: {}, message: 'Produto inválido' });

    // busca dados do produto para preencher o checkout (preço, imagem, nome)
    db.query(
      `SELECT p.ID, p.nome, p.imagem, p.valor, COALESCE(pr.valor_promocional, NULL) AS valor_promocional, p.estoque
       FROM Produto p LEFT JOIN Promocao pr ON pr.produto_id = p.ID WHERE p.ID = ? LIMIT 1`,
      [produtoId],
      (err, rows) => {
        if (err || !rows || rows.length === 0) {
          console.error('[comprar-agora] erro ao buscar produto:', err);
          return res.status(500).render('error', { error: err || {}, message: 'Erro ao buscar produto' });
        }

        const p = rows[0];
        const precoUnitario = (p.valor_promocional !== null && p.valor_promocional !== undefined) ? Number(p.valor_promocional) : Number(p.valor || 0);
        const qtd = Math.min(quantidade, p.estoque ?? quantidade);

        // monta checkout na sessão com apenas este item
        req.session.checkout = {
          itens: [{
            produtoId: Number(p.ID),
            quantidade: Number(qtd),
            nome: p.nome,
            imagem: p.imagem,
            precoUnitario
          }],
          criadoEm: Date.now(),
          source: 'quick'   // <-- ADICIONE ISTO
        };

        // redireciona para a página de pagamento (mostrará apenas este item)
        return res.redirect('/pagamento');
      }
    );
});

module.exports = router;
