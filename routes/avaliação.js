// routes/avaliacao.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/:produtoId', (req, res) => {
    const produtoId = req.params.produtoId;
    db.query('SELECT p.*, c.nome AS categoria_nome FROM PRODUTO p LEFT JOIN CATEGORIA c ON p.Categoria_ID = c.ID WHERE p.ID = ?', [produtoId], (err, results) => {
        const produto = results && results[0] ? results[0] : {};
        res.render('avaliar', {
            produtoId,
            produtoImagem: produto.imagem || '/images/product-placeholder.jpg',
            produtoNome: produto.nome || 'Nome do Produto',
            produtoCategoria: produto.categoria_nome || 'Categoria do Produto'
        });
    });
});

router.post('/enviar', (req, res) => {
    const { produtoId, estrela, descricao } = req.body;
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

    // Verifica se já existe avaliação desse usuário para esse produto
    db.query(
        'SELECT id FROM AVALIACAO WHERE produto_id = ? AND usuario_id = ?',
        [produtoId, usuarioId],
        (err, results) => {
            if (err) return res.status(500).send('Erro ao verificar avaliações');
            if (results && results.length > 0) {
                // Atualiza avaliação existente
                db.query(
                    'UPDATE AVALIACAO SET estrela = ?, titulo = ?, descricao = ?, data_avaliacao = NOW() WHERE id = ?',
                    [estrela, titulo, descricao, results[0].id],
                    (err2) => {
                        if (err2) return res.status(500).send('Erro ao atualizar avaliação');
                        res.redirect('/avaliacao/carrinho');
                    }
                );
            } else {
                // Se não existe, insere normalmente
                db.query(
                    'INSERT INTO AVALIACAO (produto_id, usuario_id, estrela, titulo, descricao) VALUES (?, ?, ?, ?, ?)',
                    [produtoId, usuarioId, estrela, titulo, descricao],
                    (err2) => {
                        if (err2) return res.status(500).send('Erro ao salvar avaliação');
                        res.redirect('/avaliacao/carrinho');
                    }
                );
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
    if (!req.session.usuario) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para avaliar.' });
    }
    const carrinho = req.session.carrinho || [];
    const produtosAtivos = carrinho.filter(item => !item.oculto);

    if (produtosAtivos.length === 0) {
        return res.redirect('/carrinho');
    }

    const ids = produtosAtivos.map(item => item.produtoId);
    const placeholders = ids.map(() => '?').join(',');
    db.query(
        `SELECT p.*, c.nome AS categoria_nome 
         FROM PRODUTO p 
         LEFT JOIN CATEGORIA c ON p.Categoria_ID = c.ID 
         WHERE p.ID IN (${placeholders})`, 
        ids, 
        (err, produtos) => {
            if (err) return res.status(500).send('Erro ao buscar produtos');
            // Busca avaliações do usuário para esses produtos
            db.query(
                `SELECT * FROM AVALIACAO WHERE usuario_id = ? AND produto_id IN (${placeholders})`,
                [req.session.usuario.ID, ...ids],
                (err2, avaliacoes) => {
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