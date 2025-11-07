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

// Rota para buscar categorias do produto
router.get('/', (req, res) => {
    // Busca categorias de produto com seus campos
    db.query('SELECT * FROM CategoriasProduto', (err, categorias) => {
        if (err) {
            console.error('Erro ao buscar categorias:', err);
            return res.redirect('/');
        }
        
        // Parse os campos JSON de cada categoria
        categorias = categorias.map(cat => {
            try {
                cat.campos = JSON.parse(cat.campos);
            } catch (e) {
                cat.campos = [];
            }
            return cat;
        });

        res.render('createItens', { categorias });
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

router.post('/criar', upload.single('imagem'), (req, res) => {
    const produto = req.body;
    
    // Busca campos da categoria selecionada
    db.query('SELECT campos FROM CategoriasProduto WHERE ID = ?', [produto.categoria], (err, results) => {
        if (err || !results.length) {
            console.error('Erro ao buscar categoria:', err);
            return res.redirect('/createItens');
        }

        let camposCategoria = [];
        try {
            camposCategoria = JSON.parse(results[0].campos);
        } catch (e) {
            console.error('Erro ao parsear campos da categoria:', e);
        }

        // Cria objeto de especificações apenas com campos da categoria
        const especificacoes = {};
        camposCategoria.forEach(campo => {
            const key = typeof campo === 'string' ? campo : campo.key;
            if (produto[key]) {
                especificacoes[key] = produto[key];
            }
        });

        // Atualiza o produto com as especificações e categoria
        produto.especificacoes = JSON.stringify(especificacoes);
        produto.CategoriaProduto_ID = produto.categoria;

        // ... resto do código de criação do produto ...
    });
});

module.exports = router;
