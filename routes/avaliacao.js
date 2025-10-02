// routes/avaliacao.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/:produtoId', (req, res) => {
    const produtoId = req.params.produtoId;
    const origem = req.query.origem || 'produto';
    const quantidadeSelecionada = req.query.quantidade || 1;
    db.query('SELECT p.*, c.nome AS categoria_nome FROM PRODUTO p LEFT JOIN CATEGORIA c ON p.Categoria_ID = c.ID WHERE p.ID = ?', [produtoId], (err, results) => {
        const produto = results && results[0] ? results[0] : {};
        res.render('avaliar', {
            produtoId,
            produtoImagem: produto.imagem || '/images/product-placeholder.jpg',
            produtoNome: produto.nome || 'Nome do Produto',
            produtoCategoria: produto.categoria_nome || 'Categoria do Produto',
            origem,
            quantidadeSelecionada
        });
    });
});

router.post('/enviar', (req, res) => {
    const { produtoId, estrela, descricao, origem } = req.body;
    console.log('[AVALIACAO ENVIAR] Dados recebidos:', req.body);
    const usuarioId = req.session.usuario ? req.session.usuario.ID : null;
    let titulo = '';
    switch(Number(estrela)) {
        case 5: titulo = 'Excelente produto'; break;
        case 4: titulo = 'Boa qualidade'; break;
        case 3: titulo = 'Produto razoável'; break;
        case 2: titulo = 'Produto regular'; break;
        default: titulo = 'Produto ruim';
    }

    if (!usuarioId) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para avaliar.' });
    }

    db.query(
        'SELECT id FROM AVALIACAO WHERE produto_id = ? AND usuario_id = ?',
        [produtoId, usuarioId],
        (err, results) => {
            if (err) return res.status(500).send('Erro ao verificar avaliações');
            const atualizarOuInserir = (callback) => {
                if (results && results.length > 0) {
                    db.query(
                        'UPDATE AVALIACAO SET estrela = ?, titulo = ?, descricao = ?, data_avaliacao = NOW() WHERE id = ?',
                        [estrela, titulo, descricao, results[0].id],
                        callback
                    );
                } else {
                    db.query(
                        'INSERT INTO AVALIACAO (produto_id, usuario_id, estrela, titulo, descricao) VALUES (?, ?, ?, ?, ?)',
                        [produtoId, usuarioId, estrela, titulo, descricao],
                        callback
                    );
                }
            };

            const quantidade = Number(req.body.quantidade) || 1;

            if (origem === 'produto') {
                db.query(
                    'UPDATE Produto SET estoque = estoque - ? WHERE ID = ? AND estoque >= ?',
                    [quantidade, produtoId, quantidade],
                    (errEstoque) => {
                        if (errEstoque) return res.status(500).send('Erro ao atualizar estoque');
                        atualizarOuInserir((err2) => {
                            if (err2) return res.status(500).send('Erro ao salvar avaliação');
                            res.redirect('/?msg=avaliacao');
                        });
                    }
                );
            } else {
                // Origem carrinho: só salva avaliação
                atualizarOuInserir((err2) => {
                    if (err2) return res.status(500).send('Erro ao salvar avaliação');
                    // Remove produto avaliado da lista
                    if (req.session.produtosParaAvaliar) {
                        req.session.produtosParaAvaliar = req.session.produtosParaAvaliar.filter(p => p.produtoId != produtoId);
                    }
                    if (!req.session.produtosParaAvaliar || req.session.produtosParaAvaliar.length === 0) {
                        return res.redirect('/?msg=avaliacao');
                    }
                    res.redirect('/avaliacao/carrinho');
                });
            }
        }
    );
});

router.post('/iniciar', (req, res) => {
    const { produtoId, quantidade } = req.body;
    res.redirect(`/avaliacao/${produtoId}?quantidade=${quantidade}`);
});

router.post('/remover', (req, res) => {
    const { avaliacaoId, produtoId } = req.body;
    // Só permite remover se for o dono da avaliação
    const usuarioId = req.session.usuario ? req.session.usuario.ID : null;
    if (!usuarioId) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para remover sua avaliação.' });
    }
    db.query(
        'DELETE FROM AVALIACAO WHERE id = ? AND usuario_id = ?',
        [avaliacaoId, usuarioId],
        (err) => {
            return res.redirect('/product/' + produtoId);
        }
    );
});

// GET para avaliar todos os produtos ativos do carrinho
router.get('/carrinho', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    if (!req.session.usuario) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para avaliar.' });
    }
    const produtosParaAvaliar = req.session.produtosParaAvaliar || [];
    console.log('[AVALIACAO CARRINHO] produtosParaAvaliar na sessão:', produtosParaAvaliar);

    if (produtosParaAvaliar.length === 0) {
        console.log('[AVALIACAO CARRINHO] Nenhum produto para avaliar, redirecionando para /carrinho');
        return res.redirect('/carrinho');
    }
    const ids = produtosParaAvaliar.map(item => Number(item.produtoId));
    const placeholders = ids.length ? ids.map(() => '?').join(',') : 'NULL';
    db.query(
        `SELECT p.*, c.nome AS categoria_nome 
         FROM PRODUTO p 
         LEFT JOIN CATEGORIA c ON p.Categoria_ID = c.ID 
         WHERE p.ID IN (${placeholders})`, 
        [...ids], 
        (err, produtos) => {
            if (err) {
                console.error('[AVALIACAO CARRINHO] Erro ao buscar produtos:', err);
                return res.status(500).send('Erro ao buscar produtos');
            }
            console.log('[AVALIACAO CARRINHO] Produtos encontrados:', produtos);

            db.query(
                `SELECT * FROM AVALIACAO WHERE usuario_id = ? AND produto_id IN (${placeholders})`,
                [req.session.usuario.ID, ...ids],
                (err2, avaliacoes) => {
                    if (err2) {
                        console.error('[AVALIACAO CARRINHO] Erro ao buscar avaliações:', err2);
                        return res.status(500).send('Erro ao buscar avaliações');
                    }
                    console.log('[AVALIACAO CARRINHO] Avaliacoes encontradas:', avaliacoes);

                    console.log('[AVALIACAO CARRINHO] VAI RENDERIZAR VIEW COM:', {
                        produtos,
                        avaliacoes,
                        usuario: req.session.usuario
                    });

                    res.render('avaliar-carrinho', {
                        produtos: produtos || [],
                        avaliacoes: avaliacoes || [],
                        usuario: req.session.usuario
                    });
                }
            );
        }
    );
});

router.use((req, res, next) => {
    if (!req.session.usuario) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para avaliar.' });
    }
    next();
});

module.exports = router;