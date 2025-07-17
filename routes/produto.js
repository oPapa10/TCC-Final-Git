const express = require('express');
const router = express.Router();
const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

// Listar produtos (para ADM)
router.get('/seeProduto', (req, res) => {
  Produto.findAll((err, produtos) => {
    if (err) return res.status(500).send('Erro ao buscar produtos');
    res.render('seeProduto', { produtos });
  });
});

// Formulário de criação
router.get('/createItens', (req, res) => {
  Categoria.findAll((err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createItens', { categorias });
  });
});

// Criar produto
router.post('/produtos', upload.single('imagem'), (req, res) => {
  const { nome, valor, descricao, categoria, quantidade } = req.body;
  let imagem = '';
  if (req.file) {
    imagem = '/uploads/' + req.file.filename;
  }
  Produto.create({ nome, valor, descricao, categoria, quantidade, imagem }, (err) => {
    if (err) return res.status(500).send('Erro ao criar produto');
    res.redirect('/seeProduto');
  });
});

// Formulário de edição
router.get('/produtos/editar/:id', (req, res) => {
  Produto.findById(req.params.id, (err, produto) => {
    if (err || !produto) return res.status(404).send('Produto não encontrado');
    Categoria.findAll((err, categorias) => {
      if (err) return res.status(500).send('Erro ao buscar categorias');
      res.render('editProduto', { produto, categorias });
    });
  });
});

// Atualizar produto
router.post('/produtos/editar/:id', upload.single('imagem'), (req, res) => {
  const { nome, valor, descricao, categoria, quantidade } = req.body;
  let imagem = req.body.imagemAtual || '';
  if (req.file) {
    imagem = '/uploads/' + req.file.filename;
  }
  Produto.update(req.params.id, { nome, valor, descricao, categoria, quantidade, imagem }, (err) => {
    if (err) return res.status(500).send('Erro ao atualizar produto');
    res.redirect('/seeProduto');
  });
});

// Excluir produto
router.post('/produtos/excluir/:id', (req, res) => {
  Produto.delete(req.params.id, (err) => {
    if (err) return res.status(500).send('Erro ao excluir produto');
    res.redirect('/seeProduto');
  });
});

module.exports = router;