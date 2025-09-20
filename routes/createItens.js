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

function slugify(text) {
    return text.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, '-')           // Espaços para hífen
        .replace(/[^\w\-]+/g, '')       // Remove caracteres especiais
        .replace(/\-\-+/g, '-')         // Hífens múltiplos para um só
        .replace(/^-+/, '')             // Remove hífens do início
        .replace(/-+$/, '');            // Remove hífens do fim
}

router.get('/', (req, res) => {
  db.query('SELECT * FROM Categoria', (err, categorias) => {
    if (err) return res.status(500).send('Erro ao carregar categorias');
    res.render('createItens', { categorias, sucesso: false });
  });
});

router.post('/produtos', upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'thumbnailUpload', maxCount: 1 }
]), async (req, res) => {
  const {
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, thumbnails, categoria
  } = req.body;

  // Imagem principal: upload ou link
  let imagem = '';
  if (req.body.imagemLink && req.body.imagemLink.trim() !== '') {
      imagem = req.body.imagemLink.trim();
  } else if (req.files['imagem'] && req.files['imagem'][0]) {
      imagem = '/uploads/' + req.files['imagem'][0].filename;
  }

  // Thumbnails: upload ou link
  let thumbnail = '';
  if (req.files && req.files['thumbnailUpload'] && req.files['thumbnailUpload'][0]) {
      thumbnail = '/uploads/' + req.files['thumbnailUpload'][0].filename;
  }
  let thumbnailsFinal = req.body.thumbnails ? req.body.thumbnails.trim() : '';
  if (thumbnail) {
      thumbnailsFinal = thumbnail;
  }

  // Gera slug único
  let baseSlug = slugify(nome);
  let slug = baseSlug;
  let count = 1;
  const [rows] = await db.promise().query('SELECT COUNT(*) as total FROM Produto WHERE slug = ?', [slug]);
  while (rows[0].total > 0) {
    slug = `${baseSlug}-${count++}`;
    const [rows2] = await db.promise().query('SELECT COUNT(*) as total FROM Produto WHERE slug = ?', [slug]);
    if (rows2[0].total === 0) break;
  }

  if (!categoria || isNaN(parseInt(categoria, 10))) {
    return res.status(400).send('Selecione uma categoria válida!');
  }
  Produto.create({
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, imagem, thumbnails: thumbnailsFinal, Categoria_ID: parseInt(categoria, 10) || null, slug
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
