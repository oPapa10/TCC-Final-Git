const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAdmin } = require('./adminAuth'); // exige que adminAuth.js exista
const db = require('../config/db');

//Rota para home - protegida
router.get('/', requireAdmin, async (req, res) => {
  try {
    const promocoesPromise = new Promise((resolve, reject) => {
      db.query(
        'SELECT COUNT(*) AS cnt FROM Promocao WHERE data_fim IS NULL OR data_fim > NOW()',
        (err, rows) => err ? reject(err) : resolve((rows && rows[0] && rows[0].cnt) || 0)
      );
    });

    const estoqueBaixoPromise = new Promise((resolve, reject) => {
      db.query(
        'SELECT COUNT(*) AS cnt FROM Produto WHERE estoque <= 3',
        (err, rows) => err ? reject(err) : resolve((rows && rows[0] && rows[0].cnt) || 0)
      );
    });

    const vendasPendentesPromise = new Promise((resolve, reject) => {
      db.query(
        "SELECT COUNT(*) AS cnt FROM VENDE WHERE status = 'pendente'",
        (err, rows) => err ? reject(err) : resolve((rows && rows[0] && rows[0].cnt) || 0)
      );
    });

    const [promocoesAtivas, produtosEstoqueBaixo, vendasPendentes] = await Promise.all([
      promocoesPromise,
      estoqueBaixoPromise,
      vendasPendentesPromise
    ]);

    res.render('adm', { promocoesAtivas, produtosEstoqueBaixo, vendasPendentes });
  } catch (err) {
    console.error('[ADM] erro ao carregar dashboard', err);
    res.render('adm', { promocoesAtivas: 0, produtosEstoqueBaixo: 0, vendasPendentes: 0 });
  }
});

module.exports = router;
