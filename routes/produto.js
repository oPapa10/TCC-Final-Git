// routes/produto.js
const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const Produto = require('../models/produtoModel'); // <-- Adicione esta linha

// Listar todos os produtos (ADM)
router.get('/seeProduto', produtoController.listar);

// Detalhar produto por ID
router.get('/produto/:id', produtoController.detalhar);

// Detalhar produto por slug
router.get('/p/:slug', produtoController.detalharPorSlug);

// Formulário para criar produto
router.get('/createItens', produtoController.formulario);

// Criar novo produto
router.post('/', produtoController.criar);

// Atualizar produto
router.post('/editar/:id', produtoController.atualizar);

// Excluir produto
router.post('/excluir/:id', produtoController.remover);

// Exibir formulário de edição de produto
router.get('/editar/:id', (req, res) => {
  Produto.findById(req.params.id, (err, produto) => {
    if (err || !produto) return res.status(404).send('Produto não encontrado');
    // Buscar categorias
    const db = require('../config/db');
    db.query('SELECT * FROM Categoria', (err2, categorias) => {
      if (err2) return res.status(500).send('Erro ao buscar categorias');
      res.render('editProduto', { produto, categorias });
    });
  });
});

module.exports = router;
