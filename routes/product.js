const express = require('express');
const router = express.Router();
const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

// Página de detalhes do produto usando slug
router.get('/:slug', (req, res) => {
    const slug = req.params.slug;
    db.query(
        `SELECT p.*, pr.valor_promocional
         FROM Produto p
         LEFT JOIN Promocao pr ON pr.produto_id = p.ID
         WHERE p.slug = ?`,
        [slug],
        (err, results) => {
            if (err || results.length === 0) {
                return res.render('product', { produto: null });
            }
            const produto = results[0];

            // Converta para número se existir, senão deixa undefined
            produto.valor_promocional = produto.valor_promocional ? Number(produto.valor_promocional) : undefined;
            produto.valor = produto.valor ? Number(produto.valor) : 0;

            // Trate thumbnails como array
            if (produto.thumbnails) {
                try {
                    produto.thumbnails = JSON.parse(produto.thumbnails);
                } catch {
                    produto.thumbnails = produto.thumbnails.split(',').map(s => s.trim());
                }
            } else {
                produto.thumbnails = [];
            }

            res.render('product', { produto });
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

module.exports = router;
