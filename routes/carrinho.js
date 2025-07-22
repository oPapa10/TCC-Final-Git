const express = require('express');
const path = require('path');
const db = require('../config/db');
const router = express.Router();

// Rota para exibir o carrinho
router.get('/', (req, res) => {
  const carrinho = req.session.carrinho || [];
  console.log('Carrinho na sessão:', carrinho);

  if (carrinho.length === 0) {
    return res.render('carrinho', { carrinho: [] });
  }

  const ids = carrinho.map(item => Number(item.produtoId));
  const placeholders = ids.map(() => '?').join(',');
  const sql = `SELECT * FROM Produto WHERE ID IN (${placeholders})`;

  db.query(sql, ids, (err, produtos) => {
    if (err) {
      console.error('Erro ao buscar produtos do carrinho:', err);
      return res.status(500).send('Erro ao buscar produtos');
    }

    const produtosArray = Array.isArray(produtos) ? produtos : [produtos];
    console.log('Produtos retornados:', produtosArray);

    const carrinhoCompleto = carrinho.map(item => {
      const produto = produtosArray.find(p => p.ID == item.produtoId);
      return {
        id: item.produtoId,
        nome: produto ? produto.nome : 'Produto removido',
        imagem: produto ? produto.imagem : '',
        preco: produto ? parseFloat(produto.valor) : 0,
        quantidade: item.quantidade
      };
    });

    res.render('carrinho', { carrinho: carrinhoCompleto });
  });
});

// Rota para adicionar item ao carrinho
router.post('/adicionar', (req, res) => {
  const { produtoId, quantidade } = req.body;
  console.log('Dados recebidos:', req.body);

  if (!produtoId || !quantidade) {
    return res.status(400).send('ID do produto ou quantidade inválidos.');
  }

  if (!req.session.carrinho) req.session.carrinho = [];

  const idx = req.session.carrinho.findIndex(item => item.produtoId == produtoId);
  if (idx >= 0) {
    req.session.carrinho[idx].quantidade += Number(quantidade);
  } else {
    req.session.carrinho.push({ produtoId, quantidade: Number(quantidade) });
  }

  console.log('Carrinho após adicionar:', req.session.carrinho);
  res.redirect('/carrinho');
});

module.exports = router;
