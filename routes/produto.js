// routes/produto.js
const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

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

module.exports = router;
