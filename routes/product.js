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
        `SELECT p.*, pr.valor_promocional, p.especificacoes
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
                return res.render('product', { produto: null, relacionados: [], avaliacoes: [] });
            }
            const produto = results[0];
            const categoriaId = Number(produto.Categoria_ID);
            const produtoId = Number(produto.ID);

            // Busca avaliações do produto
            db.query(
                `SELECT a.*, u.nome AS usuario_nome 
                 FROM AVALIACAO a 
                 LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
                 WHERE a.produto_id = ? 
                 ORDER BY a.data_avaliacao DESC`,
                [produtoId],
                (err3, avaliacoes) => {
                    // Busca produtos da mesma categoria, exceto o atual
                    db.query(
                        `SELECT * FROM Produto WHERE Categoria_ID = ? AND ID != ? LIMIT 4`,
                        [categoriaId, produtoId],
                        (err2, relacionados) => {
                            if (err2 || !relacionados) relacionados = [];
                            res.render('product', {
                                produto,
                                relacionados,
                                avaliacoes: avaliacoes || []
                            });
                        }
                    );
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
    if (!req.session.usuario) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para finalizar a compra.' });
    }
    const { produtoId, quantidade } = req.body;
    db.query(
        'UPDATE Produto SET estoque = estoque - ? WHERE ID = ? AND estoque >= ?',
        [quantidade, produtoId, quantidade],
        (err, result) => {
            if (err) return res.status(500).send('Erro ao atualizar estoque');
            db.query(
                'INSERT INTO PEDIDO_ITENS (usuario_id, produto_id, quantidade) VALUES (?, ?, ?)',
                [req.session.usuario.ID, produtoId, quantidade],
                (err2) => {
                    if (err2) return res.status(500).send('Erro ao registrar pedido');
                    console.log('[PEDIDO_ITENS] Tentando inserir:', {
                        usuarioId: req.session.usuario.ID,
                        produtoId,
                        quantidade
                    });
                    res.redirect('/?msg=avaliacao');
                }
            );
        }
    );
});

router.get('/comprar-confirmacao/:produtoId', (req, res) => {
    const produtoId = req.params.produtoId;
    db.query('SELECT * FROM Produto WHERE ID = ?', [produtoId], (err, results) => {
        const produto = results && results[0] ? results[0] : null;
        res.render('partials/compraConfirmacao', {
            confirmacaoCompra: true,
            produtoId,
            produtoNome: produto ? produto.nome : '',
            quantidade: 1
        });
    });
});

module.exports = router;
