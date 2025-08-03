const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ajuste o caminho conforme seu projeto

// Rota para home
router.get('/', (req, res) => {
  db.query(`
    SELECT Produto.*, Categoria.nome AS categoria_nome
    FROM Produto
    LEFT JOIN Categoria ON Produto.Categoria_ID = Categoria.ID
  `, (err, produtos) => {
    if (err) return res.status(500).send('Erro no banco');
    db.query('SELECT * FROM Categoria', (err2, categorias) => {
      if (err2) return res.status(500).send('Erro ao buscar categorias');
      res.render('index', { produtos, categorias });
    });
  });
});

// Rota para carrinho
router.get('/carrinho', (req, res) => {
  res.render('carrinho', { carrinho: [] }); // Passe um array vazio ou os itens reais
});

// Rota para produto
router.get('/product', (req, res) => {
  res.render('product', { produto: null }); // Passe o produto selecionado ou null
});

// Rota para opções
router.get('/opcoes', (req, res) => {
  res.render('opcoes', {
    usuario: req.session.usuario || null,
    pagamentos: [],
    query: req.query
  });
});

// Rota para ajuda
router.get('/ajuda', (req, res) => {
  res.render('ajuda', { categoriasAjuda: [], perguntasFrequentes: [] });
});

// Rota para área do administrador
router.get('/adm', (req, res) => {
  res.render('adm');
});

module.exports = router;
