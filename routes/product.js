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
    console.log('Rota /p/:slug chamada com slug:', req.params.slug);
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
                return res.render('product', { produto: null, relacionados: [] });
            }
            const produto = results[0];

            const categoriaId = Number(produto.Categoria_ID);
            const produtoId = Number(produto.ID);

            db.query(
                `SELECT * FROM Produto WHERE Categoria_ID = ? AND ID != ? LIMIT 4`,
                [categoriaId, produtoId],
                (err2, relacionados) => {
                    if (err2 || !relacionados || relacionados.length === 0) {
                        db.query(
                            `SELECT * FROM Produto WHERE ID != ? LIMIT 4`,
                            [produto.ID],
                            (err3, outros) => {
                                console.log('Produto atual:', produto);
                                console.log('Relacionados:', outros || []);
                                res.render('product', { produto, relacionados: outros || [] });
                            }
                        );
                    } else {
                        console.log('Produto atual:', produto);
                        console.log('Relacionados:', relacionados);
                        res.render('product', { produto, relacionados });
                    }
                }
            );
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

// Outras rotas que renderizam product.ejs devem SEMPRE passar relacionados: []
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
                return res.render('product', { produto: null, relacionados: [] });
            }
            res.render('product', { produto: results[0], relacionados: [] });
        }
    );
});

router.get('/product/:slug', (req, res) => {
    const slug = req.params.slug;
    Produto.findBySlug(slug, (err, produto) => {
        if (err || !produto) {
            return res.render('product', { produto: null, relacionados: [] });
        }
        console.log('Produto encontrado:', produto);
        console.log('Categoria_ID:', produto.Categoria_ID, 'ID:', produto.ID);
        res.render('product', { produto, relacionados: [] });
    });
});

const campos = [
    'nome', 'valor', 'valor_promocional', 'Categoria_ID', 'cor', 'tamanho', 'peso', 'cilindrada',
    'potencia', 'tanque', 'material', 'protecao', 'thumbnails', 'imagem', 'descricao'
];

module.exports = router;
