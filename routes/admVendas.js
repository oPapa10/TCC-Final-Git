const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ajuste conforme seu arquivo de conexão

/* substitua a função upsertNotification por esta versão (logs + fallback) */
let _adm_notificacoesHasVendaId = null;
function admCheckNotificacoesHasVendaId() {
  if (_adm_notificacoesHasVendaId !== null) return Promise.resolve(_adm_notificacoesHasVendaId);
  return new Promise((resolve) => {
    db.query("SHOW COLUMNS FROM notificacoes LIKE 'venda_id'", (err, rows) => {
      if (err) {
        console.warn('[ADM-NOTIF] SHOW COLUMNS error:', err && err.code ? err.code : err);
        _adm_notificacoesHasVendaId = false;
        return resolve(false);
      }
      _adm_notificacoesHasVendaId = !!(rows && rows.length);
      resolve(_adm_notificacoesHasVendaId);
    });
  });
}

async function upsertNotification(clienteId, vendaId, titulo, mensagem, status) {
  try {
    const hasVendaId = await admCheckNotificacoesHasVendaId();
    // debug
    db.query('SELECT DATABASE() AS db', (dberr, dbrows) => {
      if (!dberr && dbrows && dbrows[0]) console.log('[ADM-NOTIF] DB conectado:', dbrows[0].db);
    });
    db.query('SHOW COLUMNS FROM notificacoes', (colErr, cols) => {
      if (!colErr && cols) console.log('[ADM-NOTIF] colunas notificacoes:', cols.map(c => c.Field).join(', '));
    });

    return new Promise((resolve, reject) => {
      if (hasVendaId) {
        db.query('SELECT id FROM notificacoes WHERE venda_id = ? LIMIT 1', [vendaId], (err, rows) => {
          if (err) {
            console.warn('[ADM-NOTIF] SELECT por venda_id falhou:', err.code, err.sqlMessage || err.message);
            return db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status) VALUES (?, ?, ?, ?)', [clienteId, titulo, mensagem, status], (e, r) => e ? reject(e) : resolve(r));
          }
          if (rows && rows.length) {
            return db.query(
              'UPDATE notificacoes SET cliente_id = ?, titulo = ?, mensagem = ?, status = ?, lida = 0, created_at = NOW() WHERE id = ?',
              [clienteId, titulo, mensagem, status, rows[0].id],
              (e, r) => e ? reject(e) : resolve(r)
            );
          }
          db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)', [clienteId, titulo, mensagem, status, vendaId], (e, r) => {
            if (e) {
              console.error('[ADM-NOTIF] INSERT com venda_id falhou:', e.code, e.sqlMessage || e.message);
              if (e.code === 'ER_BAD_FIELD_ERROR') {
                return db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status) VALUES (?, ?, ?, ?)', [clienteId, titulo, mensagem, status], (e2, r2) => e2 ? reject(e2) : resolve(r2));
              }
              return reject(e);
            }
            return resolve(r);
          });
        });
      } else {
        db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status) VALUES (?, ?, ?, ?)', [clienteId, titulo, mensagem, status], (e, r) => e ? reject(e) : resolve(r));
      }
    });
  } catch (ex) {
    console.error('[ADM-NOTIF] upsertNotification catch:', ex);
    throw ex;
  }
}

// middleware simples para garantir admin (se tiver sistema de sessão/roles, troque)
// Removi a exigência de login para o ADM conforme solicitado.
// Se quiser reativar proteção depois, aplique novamente um middleware de autorização.
function exigeAdm(req, res, next) {
  return next(); // acesso livre
}

router.get('/', /*exigeAdm,*/ async (req, res) => {
  try {
    const q = req.query || {};
    const year = q.year ? Number(q.year) : null;
    const month = q.month ? Number(q.month) : null;
    const day = q.day ? Number(q.day) : null;
    // status padrão: 'entregue' para que "Vendas realizadas" venha selecionado ao entrar na página
    const status = q.status ? String(q.status) : 'entregue';
    const search = q.search ? q.search.trim() : null;
    const priceMin = q.priceMin ? Number(q.priceMin) : null;
    const priceMax = q.priceMax ? Number(q.priceMax) : null;
    const rating = q.rating ? Number(q.rating) : null;

    // years available (distinct)
    const [yearsRows] = await new Promise((resolve, reject) => {
      db.query('SELECT DISTINCT YEAR(hora_venda) AS ano FROM VENDE ORDER BY ano DESC', (err, rows) => err ? reject(err) : resolve([rows]));
    });

    // build WHERE clauses
    let where = [];
    let params = [];

    if (year) {
      where.push('YEAR(v.hora_venda) = ?'); params.push(year);
    }
    if (month) {
      where.push('MONTH(v.hora_venda) = ?'); params.push(month);
    }
    if (day) {
      where.push('DAY(v.hora_venda) = ?'); params.push(day);
    }
    if (search) {
      where.push('(p.nome LIKE ? OR v.ID = ?)');
      params.push('%' + search + '%', Number.isFinite(Number(search)) ? Number(search) : 0);
    }
    if (priceMin !== null) {
      where.push('v.valor_venda >= ?'); params.push(priceMin);
    }
    if (priceMax !== null) {
      where.push('v.valor_venda <= ?'); params.push(priceMax);
    }
    if (rating) {
      where.push('v.estrela >= ?'); params.push(rating);
    }
    // filtro por status (pendente, pronto, a_caminho, entregue, realizada)
    if (status) {
      if (status === 'entregue') {
        // tratar "entregue" como entregue + realizada (vendas finalizadas)
        where.push("(v.status = 'entregue' OR v.status = 'realizada')");
      } else if (status === 'pendente') {
        // exibir tanto pendentes quanto prontos na aba "Vendas pendentes"
        where.push("(v.status = 'pendente' OR v.status = 'pronto')");
      } else {
        where.push('v.status = ?'); params.push(status);
      }
    }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const sql = `
      SELECT v.ID, v.hora_venda, v.valor_venda, v.status,
             c.nome AS cliente_nome, c.email AS cliente_email,
             p.nome AS produto_nome, p.ID AS produto_id, p.imagem AS produto_imagem, p.valor AS produto_valor,
             COALESCE(ar.avg_rating, 0) AS produto_media, COALESCE(ar.cnt, 0) AS produto_qtd_avaliacoes
      FROM VENDE v
      LEFT JOIN CLIENTE c ON v.Cliente_ID = c.ID
      LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID
      LEFT JOIN (
        SELECT produto_id, ROUND(AVG(estrela),2) AS avg_rating, COUNT(*) AS cnt
        FROM AVALIACAO
        GROUP BY produto_id
      ) ar ON p.ID = ar.produto_id
      ${whereSQL}
      ORDER BY v.hora_venda DESC
      LIMIT 100
    `;

    const vendas = await new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });

    // métricas GLOBAIS (independentes dos filtros) — garantem que os cards sempre exibam valores
    const globalMetrics = await new Promise((resolve, reject) => {
      db.query(
        `SELECT
           COUNT(*) AS totalVendas,
           COALESCE(SUM(valor_venda),0) AS valorTotalVendas,
           SUM(status = 'pendente') AS vendasPendentes,
           SUM(status IN ('entregue','realizada')) AS vendasEntregues,
           SUM(status = 'a_caminho') AS vendasCaminho,
           SUM(status = 'pronto') AS vendasPronto
         FROM VENDE`,
        (err, rows) => err ? reject(err) : resolve((rows && rows[0]) || { totalVendas:0, valorTotalVendas:0, vendasPendentes:0, vendasEntregues:0, vendasCaminho:0, vendasPronto:0 })
      );
    });

    // usar métricas globais para os cards (sempre visíveis)
    const totalVendas = Number(globalMetrics.totalVendas || 0);
    const valorTotalVendas = Number(globalMetrics.valorTotalVendas || 0);
    const vendasPendentes = Number(globalMetrics.vendasPendentes || 0);
    const vendasEntregues = Number(globalMetrics.vendasEntregues || 0);

    // métricas adicionais
    const vendasCaminho = Number(globalMetrics.vendasCaminho || 0);
    const vendasPronto = Number(globalMetrics.vendasPronto || 0);

    // preparar card contextual: por padrão mostra Valor Total (moeda). Se o filtro status estiver ativo, mostrar contagem daquele status.
    let contextualLabel = 'Valor Total';
    let contextualValue = valorTotalVendas;
    let contextualIsCurrency = true;
    if (status === 'a_caminho') {
      contextualLabel = 'A caminho';
      contextualValue = vendasCaminho;
      contextualIsCurrency = false;
    } else if (status === 'pendente') {
      contextualLabel = 'Pendentes';
      contextualValue = vendasPendentes;
      contextualIsCurrency = false;
    } else if (status === 'pronto') {
      contextualLabel = 'Prontos';
      contextualValue = vendasPronto;
      contextualIsCurrency = false;
    } else if (status === 'entregue') {
      contextualLabel = 'Entregues';
      contextualValue = vendasEntregues;
      contextualIsCurrency = false;
    }

    // preparar dados para renderização (evita re-declaração de variáveis)
    const years = Array.isArray(yearsRows) ? yearsRows.map(r => r.ano).filter(Boolean) : [];
    const filters = { year, month, day, status, search, priceMin, priceMax, rating };

    const renderData = {
      totalVendas,
      valorTotalVendas,
      contextualLabel,
      contextualValue,
      contextualIsCurrency,
      vendasPendentes,
      vendasEntregues,
      vendasCaminho,
      vendasPronto,
      years,
      filters,
      vendas
    };
    
    return res.render('adm-vendas', renderData);
  } catch (err) {
    console.error('admVendas error:', err);
    res.status(500).render('error', { error: err, message: 'Erro ao carregar vendas' });
  }
});

// Ações para mudar status da venda (acessíveis no ADM)
router.post('/:id/pronto', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['pronto', id], (e,r)=> e?reject(e):resolve(r)));
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido pronto para envio';
      const mensagem = `Seu pedido (${venda.produto_nome}) está pronto para envio. Em breve será despachado.`;
      await upsertNotification(venda.Cliente_ID, venda.venda_id, titulo, mensagem, 'pronto');
    }
    // preferir voltar ao referer se mantiver a aba; caso contrário, direcionar para pendentes
    const ref = req.get('referer') || '';
    if (ref.includes('/adm/vendas') && ref.includes('status=')) return res.redirect(ref);
    return res.redirect('/adm/vendas?status=pendente');
  } catch (err) {
    console.error('Erro marcar pronto:', err);
    return res.status(500).send('Erro ao marcar pronto');
  }
});

router.post('/:id/caminho', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['a_caminho', id], (e,r)=> e?reject(e):resolve(r)));
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido a caminho';
      const mensagem = `Seu pedido (${venda.produto_nome}) está a caminho. Ao receber, confirme a entrega no app para avaliá-lo.`;
      await upsertNotification(venda.Cliente_ID, venda.venda_id, titulo, mensagem, 'a_caminho');
    }
    const ref = req.get('referer') || '';
    if (ref.includes('/adm/vendas') && ref.includes('status=')) return res.redirect(ref);
    return res.redirect('/adm/vendas?status=a_caminho');
  } catch (err) {
    console.error('Erro marcar a caminho:', err);
    return res.status(500).send('Erro ao marcar a caminho');
  }
});

// opcional: marcar manualmente como entregue pelo ADM
router.post('/:id/entregue', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['entregue', id], (e,r)=> e?reject(e):resolve(r)));
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido entregue';
      const mensagem = `Seu pedido (${venda.produto_nome}) foi entregue. Obrigado por comprar conosco!`;
      await upsertNotification(venda.Cliente_ID, venda.venda_id, titulo, mensagem, 'entregue');
    }
    const ref = req.get('referer') || '';
    if (ref.includes('/adm/vendas') && ref.includes('status=')) return res.redirect(ref);
    return res.redirect('/adm/vendas?status=entregue');
  } catch (err) {
    console.error('Erro marcar entregue:', err);
    return res.status(500).send('Erro ao marcar entregue');
  }
});

module.exports = router;