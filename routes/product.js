const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Página de detalhes do produto
router.get('/product/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM Produto WHERE ID = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.render('product', { produto: null });
    let produto = results[0];
    if (produto.thumbnails) {
      try {
        produto.thumbnails = JSON.parse(produto.thumbnails);
      } catch {
        produto.thumbnails = produto.thumbnails.split(',').map(s => s.trim());
      }
    } else {
      produto.thumbnails = [];
    }
    res.render('product', { produto });
  });
});

module.exports = router;
