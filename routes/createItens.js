const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const Produto = require('../models/produtoModel');

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  db.query('SELECT * FROM Categoria', (err, categorias) => {
    if (err) return res.status(500).send('Erro ao carregar categorias');
    res.render('createItens', { categorias, sucesso: false });
  });
});

router.post('/produtos', upload.single('imagem'), (req, res) => {
  const {
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, thumbnails, categoria
  } = req.body;
  let imagem = '';
  if (req.file) {
    imagem = '/uploads/' + req.file.filename;
  }
  Produto.create({
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, imagem, thumbnails, categoria
  }, (err) => {
    if (err) {
      console.error('Erro ao cadastrar produto:', err);
      return res.status(500).send('Erro ao criar produto');
    }
    // Após cadastrar, busque as categorias novamente e renderize a página
    db.query('SELECT * FROM Categoria', (err, categorias) => {
      if (err) return res.status(500).send('Erro ao carregar categorias');
      res.render('createItens', { categorias, sucesso: true });
    });
  });
});

module.exports = router;
