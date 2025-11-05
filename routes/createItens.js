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

// slug helper
function slugify(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// GET form
router.get('/', (req, res) => {
  db.query('SELECT * FROM Categoria', (err, categorias) => {
    if (err) return res.status(500).send('Erro ao carregar categorias');
    res.render('createItens', { categorias, sucesso: false });
  });
});

// POST criar produto - ajustado para receber categoria_id e campos dinâmicos
router.post('/produtos', upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'thumbnailUpload', maxCount: 10 }
]), async (req, res) => {
  try {
    const body = req.body || {};

    // Validações iniciais
    if (!body.categoria_id || isNaN(parseInt(body.categoria_id, 10))) {
      return res.status(400).send('Selecione uma categoria válida!');
    }

    // Processa imagem principal
    let imagem = '';
    if (body.imagemLink?.trim()) {
      imagem = body.imagemLink.trim();
    } else if (req.files?.['imagem']?.[0]) {
      imagem = '/uploads/' + req.files['imagem'][0].filename;
    }

    // Processa thumbnails
    let thumbnailsFinal = '';
    if (req.files?.['thumbnailUpload']?.length > 0) {
      thumbnailsFinal = req.files['thumbnailUpload']
        .map(f => '/uploads/' + f.filename)
        .join(',');
    } else if (body.thumbnails?.trim()) {
      thumbnailsFinal = body.thumbnails.trim();
    }

    // Gera slug único
    const nome = (body.nome || '').trim();
    let baseSlug = slugify(nome || String(Date.now()));
    let slug = baseSlug;
    let count = 1;
    
    while ((await db.promise().query(
      'SELECT COUNT(*) as total FROM Produto WHERE slug = ?', 
      [slug]
    ))[0][0].total > 0) {
      slug = `${baseSlug}-${count++}`;
    }

    // Prepara objeto para salvar
    const produtoParaSalvar = {
      nome: nome,
      valor: body.valor ? Number(body.valor) : 0,
      descricao: body.descricao || null,
      Categoria_ID: parseInt(body.categoria_id, 10),
      imagem: imagem,
      thumbnails: thumbnailsFinal,
      estoque: body.estoque ? Number(body.estoque) : 0,
      slug: slug,
      // Inclui todos os campos do formulário
      ...body
    };

    // Remove campos de sistema
    delete produtoParaSalvar.categoria_key;
    delete produtoParaSalvar.imagemLink;
    delete produtoParaSalvar.submit;

    // Cria o produto
    Produto.create(produtoParaSalvar, (err) => {
      if (err) {
        console.error('Erro ao cadastrar produto:', err);
        return res.status(500).send('Erro ao criar produto');
      }
      
      db.query('SELECT * FROM Categoria', (err2, categorias) => {
        if (err2) return res.status(500).send('Erro ao carregar categorias');
        res.render('createItens', { categorias, sucesso: true });
      });
    });

  } catch (err) {
    console.error('Erro no POST /createItens/produtos:', err);
    res.status(500).send('Erro inesperado no servidor');
  }
});

module.exports = router;
