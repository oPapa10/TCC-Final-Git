const express = require('express');
const router = express.Router();
const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const produtoController = require('../controllers/produtoController');

// Página de detalhes do produto usando slug
router.get('/p/:slug', produtoController.detalharPorSlug);

// Rota GET para exibir o formulário de edição
router.get('/produtos/editar/:id', (req, res) => {
    const id = req.params.id;
    Produto.findById(id, (err, produto) => {
        if (err || !produto) return res.status(404).send('Produto não encontrado');
        Categoria.findAll((err, categorias) => {
            if (err) return res.status(500).send('Erro ao buscar categorias');
            res.render('editProduto', { produto, categorias });
        });
    });
});

// Rota POST para salvar a edição
router.post('/produtos/editar/:id', upload.single('imagem'), (req, res) => {
    const id = req.params.id;
    const {
        nome, valor, categoria, cor, tamanho, peso, cilindrada,
        potencia, tanque, material, protecao, thumbnails, descricao
    } = req.body;

    // Se não enviar nova imagem, mantém a atual
    let imagem = req.body.imagemAtual;
    if (req.file) {
        imagem = '/uploads/' + req.file.filename;
    }

    // Atualize o produto no banco
    Produto.update(id, {
        nome,
        valor,
        Categoria_ID: categoria,
        cor,
        tamanho,
        peso,
        cilindrada,
        potencia,
        tanque,
        material,
        protecao,
        thumbnails,
        imagem,
        descricao
    }, (err) => {
        if (err) {
            console.error('Erro ao atualizar produto:', err);
            return res.status(500).send('Erro ao atualizar produto');
        }
        res.redirect('/seeProduto');
    });
});

router.get('/product/:slug', (req, res) => {
    const slug = req.params.slug;
    Produto.findBySlug(slug, (err, produto) => {
        if (err || !produto) return res.status(404).send('Produto não encontrado');
        res.render('detalhesProduto', { produto });
    });
});


module.exports = router;
