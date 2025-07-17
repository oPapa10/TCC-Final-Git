// routes/categoria.js
const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');

// Listar categorias (para ADM)
router.get('/createCategoria', (req, res) => {
  Categoria.findAll((err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createCategoria', { categorias });
  });
});

// Criar categoria
router.post('/categorias', (req, res) => {
  const { categoryName, categoryDescription } = req.body;
  Categoria.create({ nome: categoryName, descricao: categoryDescription }, (err) => {
    if (err) return res.status(500).send('Erro ao criar categoria');
    res.redirect('/createCategoria');
  });
});

// Editar categoria (formulário)
router.get('/categorias/editar/:id', (req, res) => {
  Categoria.findById(req.params.id, (err, categoria) => {
    if (err || !categoria) return res.status(404).send('Categoria não encontrada');
    res.render('editCategoria', { categoria });
  });
});

// Atualizar categoria
router.post('/categorias/editar/:id', (req, res) => {
  const { categoryName, categoryDescription } = req.body;
  Categoria.update(req.params.id, { nome: categoryName, descricao: categoryDescription }, (err) => {
    if (err) return res.status(500).send('Erro ao atualizar categoria');
    res.redirect('/createCategoria');
  });
});

// Excluir categoria
router.post('/categorias/excluir/:id', (req, res) => {
  Categoria.delete(req.params.id, (err) => {
    if (err) return res.status(500).send('Erro ao excluir categoria');
    res.redirect('/createCategoria');
  });
});

module.exports = router;
