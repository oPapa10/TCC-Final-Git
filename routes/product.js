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
                return res.render('product', { produto: null, relacionados: [] });
            }
            const produto = results[0];
            const categoriaId = Number(produto.Categoria_ID);
            const produtoId = Number(produto.ID);

            // Busca produtos da mesma categoria, exceto o atual
            db.query(
                `SELECT * FROM Produto WHERE Categoria_ID = ? AND ID != ? LIMIT 4`,
                [categoriaId, produtoId],
                (err2, relacionados) => {
                    if (err2 || !relacionados) relacionados = [];
                    res.render('product', { produto, relacionados });
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
                return res.render('product', { produto: null, relacionados: [], avaliacoes: [] });
            }
            // Buscar avaliações
            db.query(
                `SELECT a.*, u.nome AS usuario_nome 
                 FROM AVALIACAO a 
                 LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
                 WHERE a.produto_id = ? 
                 ORDER BY a.data_avaliacao DESC`,
                [id],
                (err2, avaliacoes) => {
                    res.render('product', {
                        produto: results[0],
                        relacionados: [],
                        avaliacoes: avaliacoes || []
                    });
                }
            );
        }
    );
});

router.get('/product/:slug', (req, res) => {
    const slug = req.params.slug;
    Produto.findBySlug(slug, (err, produto) => {
        if (err || !produto) {
            return res.render('product', { produto: null, relacionados: [], avaliacoes: [] });
        }
        // Buscar avaliações
        db.query(
            `SELECT a.*, u.nome AS usuario_nome 
             FROM AVALIACAO a 
             LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
             WHERE a.produto_id = ? 
             ORDER BY a.data_avaliacao DESC`,
            [produto.ID],
            (err2, avaliacoes) => {
                res.render('product', {
                    produto,
                    relacionados: [],
                    avaliacoes: avaliacoes || []
                });
            }
        );
    });
});

const campos = [
    'nome', 'valor', 'valor_promocional', 'Categoria_ID', 'cor', 'tamanho', 'peso', 'cilindrada',
    'potencia', 'tanque', 'material', 'protecao', 'thumbnails', 'imagem', 'descricao'
];

// Exemplo para rota POST /comprar-agora
router.post('/comprar-agora', (req, res) => {
    const { produtoId, quantidade } = req.body;
    if (!req.session.usuario) {
        // ...busca produto e avaliações como antes...
        db.query('SELECT * FROM PRODUTO WHERE ID = ?', [produtoId], (err, results) => {
            if (err || !results || results.length === 0) {
                return res.status(404).send('Produto não encontrado');
            }
            const produto = results[0];
            db.query(
                `SELECT a.*, u.nome AS usuario_nome 
                 FROM AVALIACAO a 
                 LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
                 WHERE a.produto_id = ? 
                 ORDER BY a.data_avaliacao DESC`,
                [produtoId],
                (err2, avaliacoes) => {
                    db.query('SELECT * FROM PRODUTO WHERE Categoria_ID = ? AND ID != ? LIMIT 4', [produto.Categoria_ID, produtoId], (err3, relacionados) => {
                        // Se for AJAX/fetch, renderiza só o bloco do alerta
                        if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.headers['content-type'] === 'application/json') {
                            return res.render('partials/compraConfirmacao', {
                                mensagemNaoLogado: 'Você precisa estar logado para comprar!',
                                confirmacaoCompra: false,
                                produtoNome: null,
                                produtoId: null
                            });
                        }
                        // Se não for AJAX, renderiza a página inteira (fallback)
                        res.render('product', {
                            produto,
                            avaliacoes: avaliacoes || [],
                            relacionados: relacionados || [],
                            mensagemNaoLogado: 'Você precisa estar logado para comprar!',
                            confirmacaoCompra: false,
                            quantidade: quantidade || 1
                        });
                    });
                }
            );
        });
        return;
    }

    // USUÁRIO LOGADO: mostrar confirmação de compra
    db.query('SELECT * FROM PRODUTO WHERE ID = ?', [produtoId], (err, results) => {
        if (err || !results || results.length === 0) {
            return res.status(404).send('Produto não encontrado');
        }
        const produto = results[0];
        // Se for AJAX/fetch, renderiza só o bloco do alerta de confirmação
        if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.headers['content-type'] === 'application/json') {
            return res.render('partials/compraConfirmacao', {
                mensagemNaoLogado: null,
                confirmacaoCompra: true,
                produtoId: produtoId,
                produtoNome: produto.nome
            });
        }
        // Se não for AJAX, renderiza a página inteira (fallback)
        db.query(
            `SELECT a.*, u.nome AS usuario_nome 
             FROM AVALIACAO a 
             LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
             WHERE a.produto_id = ? 
             ORDER BY a.data_avaliacao DESC`,
            [produtoId],
            (err2, avaliacoes) => {
                db.query('SELECT * FROM PRODUTO WHERE Categoria_ID = ? AND ID != ? LIMIT 4', [produto.Categoria_ID, produtoId], (err3, relacionados) => {
                    res.render('product', {
                        produto,
                        avaliacoes: avaliacoes || [],
                        relacionados: relacionados || [],
                        confirmacaoCompra: true,
                        quantidade: quantidade || 1
                    });
                });
            }
        );
    });
});

module.exports = router;
