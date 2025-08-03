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

router.post('/produtos', upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'thumbnailUpload', maxCount: 1 }
]), (req, res) => {
  const {
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, thumbnails, categoria
  } = req.body;
  let imagem = '';
  let thumbnail = thumbnails || '';
  if (req.files['imagem'] && req.files['imagem'][0]) {
    imagem = '/uploads/' + req.files['imagem'][0].filename;
  }
  if (req.files['thumbnailUpload'] && req.files['thumbnailUpload'][0]) {
    const uploadedPath = '/uploads/' + req.files['thumbnailUpload'][0].filename;
    // Junta os links digitados e o arquivo enviado, separados por vírgula
    thumbnail = thumbnail ? (thumbnail + ',' + uploadedPath) : uploadedPath;
  }
  console.log('Categoria recebida:', categoria);
  if (!categoria || isNaN(parseInt(categoria, 10))) {
    return res.status(400).send('Selecione uma categoria válida!');
  }
  Produto.create({
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, imagem, thumbnails: thumbnail, Categoria_ID: parseInt(categoria, 10) || null
  }, (err) => {
    if (err) {
      console.error('Erro ao cadastrar produto:', err);
      return res.status(500).send('Erro ao criar produto');
    }
    db.query('SELECT * FROM Categoria', (err, categorias) => {
      if (err) return res.status(500).send('Erro ao carregar categorias');
      res.render('createItens', { categorias, sucesso: true });
    });
  });
});

module.exports = router;
