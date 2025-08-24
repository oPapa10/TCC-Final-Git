const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');
const db = require('../config/db'); // Certifique-se de importar seu banco

// Função para validar nome da categoria
function nomeCategoriaValido(nome) {
    return /^[A-Za-zÀ-ÿ0-9]+( [A-Za-zÀ-ÿ0-9]+)*$/.test(nome.trim());
}

// Listar categorias
router.get('/', (req, res) => {
  Categoria.findAll((err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createCategoria', { categorias, sucesso: false });
  });
});

// Criar categoria
router.post('/categorias', (req, res) => {
  const { categoryName } = req.body;
  if (!nomeCategoriaValido(categoryName)) {
    return Categoria.findAll((err, categorias) => {
      if (err) return res.status(500).send('Erro ao buscar categorias');
      res.render('createCategoria', { categorias, sucesso: false, erro: 'O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.' });
    });
  }
  Categoria.create({ nome: categoryName }, (err) => {
    if (err) return res.status(500).send('Erro ao criar categoria');
    // Após cadastrar, busque as categorias novamente e renderize a página com sucesso
    Categoria.findAll((err, categorias) => {
      if (err) return res.status(500).send('Erro ao buscar categorias');
      res.render('createCategoria', { categorias, sucesso: true });
    });
  });
});

// Excluir categoria
router.post('/categorias/excluir/:id', (req, res) => {
  const categoriaId = req.params.id;

  // Verifica se existe algum produto conectado à categoria
  db.query('SELECT COUNT(*) AS total FROM Produto WHERE Categoria_ID = ?', [categoriaId], (err, result) => {
    if (err) return res.status(500).send('Erro ao verificar produtos da categoria');
    if (result[0].total > 0) {
      // Não permite excluir
      Categoria.findAll((err, categorias) => {
        if (err) return res.status(500).send('Erro ao buscar categorias');
        res.render('createCategoria', { categorias, sucesso: false, erro: 'Não é possível excluir: existem produtos conectados a esta categoria.' });
      });
    } else {
      // Pode excluir
      Categoria.delete(categoriaId, (err2) => {
        if (err2) return res.status(500).send('Erro ao excluir categoria');
        Categoria.findAll((err, categorias) => {
          if (err) return res.status(500).send('Erro ao buscar categorias');
          res.render('createCategoria', { categorias, sucesso: true });
        });
      });
    }
  });
});

// Verificar se há produtos conectados à categoria (AJAX)
router.get('/categorias/tem-produtos/:id', (req, res) => {
  const categoriaId = req.params.id;
  db.query('SELECT COUNT(*) AS total FROM Produto WHERE Categoria_ID = ?', [categoriaId], (err, result) => {
    if (err) return res.json({ erro: true });
    res.json({ temProdutos: result[0].total > 0 });
  });
});

// Editar categoria (GET)
router.get('/categorias/editar/:id', (req, res) => {
  const categoriaId = req.params.id;
  Categoria.findById(categoriaId, (err, categoria) => {
    if (err || !categoria) return res.status(404).send('Categoria não encontrada');
    res.render('editCategoria', { categoria });
  });
});

// Editar categoria (POST)
router.post('/categorias/editar/:id', (req, res) => {
  const categoriaId = req.params.id;
  const { categoryName } = req.body;
  if (!nomeCategoriaValido(categoryName)) {
    return Categoria.findById(categoriaId, (err, categoria) => {
      if (err || !categoria) return res.status(404).send('Categoria não encontrada');
      res.render('editCategoria', { categoria, erro: 'O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.' });
    });
  }
  Categoria.update(categoriaId, { nome: categoryName }, (err) => {
    if (err) return res.status(500).send('Erro ao atualizar categoria');
    res.redirect('/createCategoria');
  });
});

module.exports = router;
