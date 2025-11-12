const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria'); // <-- ADICIONADO

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
    // Busca categorias criadas via CREATECATEGORIA (tabela Categoria)
    Categoria.findAll((err, categorias) => {
        if (err) {
            console.error('Erro ao buscar categorias do catálogo:', err);
            return res.redirect('/');
        }
        // garante que 'sucesso' sempre exista para a view
        res.render('createItens', { categorias, sucesso: false });
    });
});

// Rota POST criar produto - modificada para salvar categoria e campos específicos
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

    // Monta objeto de especificações com base no tipo de produto selecionado
    const tipoCategoria = body.categoria_key;
    let especificacoes = {};

    // Mapeamento dos campos por tipo
    const camposPorTipo = {
      vestuario: ['marca', 'modelo', 'tamanho', 'cor', 'material', 'genero', 'impermeavel', 'protecoes'],
      capacete: ['marca', 'modelo', 'tamanho', 'cor', 'material_casco', 'tipo_viseira', 'certificacao'],
      moto: ['marca', 'modelo', 'ano', 'cilindrada', 'tipo_motor', 'refrigeracao', 'partida', 'quilometragem', 'marchas'],
      oleo: ['marca', 'tipo_oleo', 'viscosidade', 'volume_unidade', 'especificacao_api'],
      pecas: ['marca', 'modelo_compativel', 'numero_peca', 'ano_compativel', 'material', 'posicao'],
      outros: ['marca', 'modelo', 'cor', 'tamanho', 'material']
    };

    // Pega campos do tipo selecionado
    const camposPermitidos = camposPorTipo[tipoCategoria] || camposPorTipo.outros;

    // Copia apenas campos permitidos para especificacoes
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined && body[campo] !== null && body[campo] !== '') {
        especificacoes[campo] = body[campo];
      }
    });

    // Prepara objeto para salvar
    const produtoParaSalvar = {
      nome: nome,
      valor: body.valor ? Number(body.valor) : 0,
      descricao: (body.descricao || '').substring(0, 2000), // Limita a 2000 caracteres
      Categoria_ID: parseInt(body.categoria_id, 10),
      imagem: imagem,
      thumbnails: thumbnailsFinal,
      estoque: body.estoque ? Number(body.estoque) : 0,
      slug: slug,
      especificacoes: JSON.stringify(especificacoes)
    };

    // Cria o produto
    Produto.create(produtoParaSalvar, (err) => {
      if (err) {
        console.error('Erro ao cadastrar produto:', err);
        return res.status(500).send('Erro ao criar produto');
      }
      
      // Busca categorias para recarregar a página
      Categoria.findAll((err2, categorias) => {
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
