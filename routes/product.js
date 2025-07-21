const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Página de detalhes do produto usando slug
router.get('/:slug', (req, res) => {
  const slug = req.params.slug;
  db.query('SELECT * FROM Produto WHERE slug = ?', [slug], (err, results) => {
    console.log('Slug recebido:', slug);
    console.log('Resultados do banco:', results);
    if (err || results.length === 0) return res.render('product', { produto: null });
    let produto = results[0];

    // Converta valor para número, se existir
    if (produto.valor) {
      produto.valor = Number(produto.valor);
    }

    // Trate thumbnails como array
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
