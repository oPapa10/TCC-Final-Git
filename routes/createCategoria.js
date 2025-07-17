const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');

// Listar categorias
router.get('/createCategoria', (req, res) => {
  Categoria.findAll((err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createCategoria', { categorias, sucesso: false });
  });
});

// Criar categoria
router.post('/categorias', (req, res) => {
  const { categoryName } = req.body;
  Categoria.create({ nome: categoryName }, (err) => {
    if (err) return res.status(500).send('Erro ao criar categoria');
    // Após cadastrar, busque as categorias novamente e renderize a página com sucesso
    Categoria.findAll((err, categorias) => {
      if (err) return res.status(500).send('Erro ao buscar categorias');
      res.render('createCategoria', { categorias, sucesso: true });
    });
  });
});

module.exports = router;
