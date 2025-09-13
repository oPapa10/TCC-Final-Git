const express = require('express');
const router = express.Router();
const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const produtoController = require('../controllers/produtoController');

// Página de detalhes do produto usando slug
router.get('/p/:slug', (req, res) => {
    const slug = req.params.slug;
    db.query(
        `SELECT p.*, pr.valor_promocional
         FROM Produto p
         LEFT JOIN (
             SELECT produto_id, MAX(valor_promocional) AS valor_promocional
             FROM Promocao
             GROUP BY produto_id
         ) pr ON pr.produto_id = p.ID
         WHERE p.slug = ?`,
        [slug],
        (err, results) => {
            if (err || results.length === 0) {
                return res.render('product', { produto: null });
            }
            // Envia só a primeira linha
            res.render('product', { produto: results[0] });
        }
    );
});

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
        nome, valor, valor_promocional, categoria, cor, tamanho, peso, cilindrada,
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
        valor_promocional, // <-- adicione aqui
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

router.get('/product/:id', (req, res) => {
    const id = req.params.id;
    db.query(
        `SELECT p.*, pr.valor_promocional
         FROM Produto p
         LEFT JOIN Promocao pr ON pr.produto_id = p.ID
         WHERE p.ID = ?`,
        [id],
        (err, results) => {
            if (err || results.length === 0) {
                console.log('[PRODUCT] Produto não encontrado ou erro:', err);
                return res.render('product', { produto: null });
            }
            console.log('[PRODUCT] Produto retornado:', results[0]);
            res.render('product', { produto: results[0] });
        }
    );
});

// Se tiver rota por slug:
router.get('/product/:slug', (req, res) => {
    const slug = req.params.slug;
    Produto.findBySlug(slug, (err, produto) => {
        if (err || !produto) {
            console.log('[PRODUCT] Produto não encontrado por slug:', slug);
            return res.status(404).send('Produto não encontrado');
        }
        console.log('[PRODUCT] Produto retornado por slug:', produto);
        res.render('product', { produto });
    });
});

const campos = [
    'nome', 'valor', 'valor_promocional', 'Categoria_ID', 'cor', 'tamanho', 'peso', 'cilindrada',
    'potencia', 'tanque', 'material', 'protecao', 'thumbnails', 'imagem', 'descricao'
];

module.exports = router;
