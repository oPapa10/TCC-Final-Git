const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ajuste conforme seu arquivo de conexão

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
    const status = q.status ? String(q.status) : null;
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
      } else {
        where.push('v.status = ?'); params.push(status);
      }
    }

    const whereSQL = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const sql = `
      SELECT v.ID, v.hora_venda, v.valor_venda, v.estrela, v.status,
             c.nome AS cliente_nome, c.email AS cliente_email,
             p.nome AS produto_nome, p.ID AS produto_id,
             p.imagem AS produto_imagem
      FROM VENDE v
      LEFT JOIN CLIENTE c ON v.Cliente_ID = c.ID
      LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID
      ${whereSQL}
      ORDER BY v.hora_venda DESC
      LIMIT 100
    `;

    const vendas = await new Promise((resolve, reject) => {
      db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });

    res.render('adm-vendas', {
      vendas,
      years: yearsRows.map(r => r.ano).filter(Boolean),
      filters: { year, month, day, search, priceMin, priceMax, rating, status }
    });
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
    // buscar cliente e produto para notificar
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido pronto para envio';
      const mensagem = `Seu pedido (${venda.produto_nome}) está pronto para envio. Em breve será despachado.`;
      // grava notificação para cliente (se existir)
      db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
        [venda.Cliente_ID, titulo, mensagem, 'pronto', venda.venda_id], (err)=>{ if (err) console.error(err); });
    }
    return res.redirect(req.get('referer') || '/adm/vendas');
  } catch (err) {
    console.error('Erro marcar pronto:', err);
    return res.status(500).send('Erro ao marcar pronto');
  }
});

router.post('/:id/caminho', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['a_caminho', id], (e,r)=> e?reject(e):resolve(r)));
    // notificar cliente que pedido está a caminho
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido a caminho';
      const mensagem = `Seu pedido (${venda.produto_nome}) está a caminho. Ao receber, confirme a entrega no app para avaliá-lo.`;
      db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
        [venda.Cliente_ID, titulo, mensagem, 'a_caminho', venda.venda_id], (err)=>{ if (err) console.error(err); });
    }
    return res.redirect(req.get('referer') || '/adm/vendas');
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
    return res.redirect(req.get('referer') || '/adm/vendas');
  } catch (err) {
    console.error('Erro marcar entregue:', err);
    return res.status(500).send('Erro ao marcar entregue');
  }
});

module.exports = router;