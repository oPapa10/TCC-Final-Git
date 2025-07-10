const express = require('express');
const path = require('path');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.render('carrinho');
});

// Adicionar produto ao carrinho
router.post('/carrinho/adicionar', (req, res) => {
  const { produtoId, quantidade } = req.body;
  if (!req.session.carrinho) req.session.carrinho = [];
  // Se já existe o produto no carrinho, só soma a quantidade
  const idx = req.session.carrinho.findIndex(item => item.produtoId == produtoId);
  if (idx >= 0) {
    req.session.carrinho[idx].quantidade += Number(quantidade);
  } else {
    req.session.carrinho.push({ produtoId, quantidade: Number(quantidade) });
  }
  res.redirect('/carrinho');
});

module.exports = router;
