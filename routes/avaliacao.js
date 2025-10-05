// routes/avaliacao.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Página de avaliações gerais
router.get('/', (req, res) => {
    if (!req.session.usuario) {
        // Não está logado: mostra a página sem produtos, com mensagem amigável
        return res.render('avaliacoes', {
            produtos: [],
            avaliacoes: [],
            usuario: null,
            mensagemNaoLogado: 'Para ver e enviar avaliações, faça login em sua conta.'
        });
    }
    db.query(`
        SELECT p.*, c.nome AS categoria_nome
        FROM PRODUTO p
        LEFT JOIN CATEGORIA c ON p.Categoria_ID = c.ID
        WHERE p.ID IN (
            SELECT produto_id FROM PEDIDO_ITENS WHERE usuario_id = ?
        )
    `, [req.session.usuario.ID], (err, produtos) => {
        db.query(`
            SELECT id, produto_id, usuario_id, estrela, titulo, descricao
            FROM AVALIACAO
            WHERE usuario_id = ?
        `, [req.session.usuario.ID], (err2, avaliacoes) => {
            console.log('Usuário logado:', req.session.usuario);
            console.log('Produtos:', produtos);
            console.log('Avaliacoes:', avaliacoes);
            res.render('avaliacoes', {
                produtos: produtos || [],
                avaliacoes: avaliacoes || [],
                usuario: req.session.usuario,
                mensagemNaoLogado: null
            });
        });
    });
});

// Enviar avaliação
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
    db.query(
        'SELECT id FROM AVALIACAO WHERE produto_id = ? AND usuario_id = ?',
        [produtoId, usuarioId],
        (err, results) => {
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
            atualizarOuInserir((err2) => {
                if (err2) {
                    console.error('Erro ao salvar avaliação:', err2);
                    return res.status(500).send('Erro ao salvar avaliação');
                }
                res.redirect('/avaliacao?msg=avaliacao_sucesso');
            });
        }
    );
});

// Editar avaliação
router.post('/editar', (req, res) => {
    const { avaliacaoId, produtoId, estrela, descricao } = req.body;
    const usuarioId = req.session.usuario ? req.session.usuario.ID : null;
    
    if (!usuarioId) {
        return res.status(401).json({ error: 'Não autorizado' });
    }

    let titulo = '';
    switch(Number(estrela)) {
        case 5: titulo = 'Excelente produto'; break;
        case 4: titulo = 'Boa qualidade'; break;
        case 3: titulo = 'Produto razoável'; break;
        case 2: titulo = 'Produto regular'; break;
        default: titulo = 'Produto ruim';
    }

    db.query(
        'UPDATE AVALIACAO SET estrela = ?, titulo = ?, descricao = ?, data_avaliacao = NOW() WHERE id = ? AND usuario_id = ?',
        [estrela, titulo, descricao, avaliacaoId, usuarioId],
        (err) => {
            if (err) {
                console.error('Erro ao editar avaliação:', err);
                return res.status(500).json({ error: 'Erro ao editar avaliação' });
            }
            res.redirect('/avaliacao?msg=avaliacao_editada');
        }
    );
});

// Excluir produto da lista de avaliações (não avaliado)
router.post('/excluir-produto', (req, res) => {
    const { produtoId } = req.body;
    const usuarioId = req.session.usuario ? req.session.usuario.ID : null;
    if (!usuarioId) return res.status(401).json({ error: 'Não autorizado' });
    
    db.query(
        'DELETE FROM PEDIDO_ITENS WHERE usuario_id = ? AND produto_id = ?',
        [usuarioId, produtoId],
        (err) => {
            if (err) {
                console.error('Erro ao excluir produto:', err);
                return res.status(500).json({ error: 'Erro ao excluir produto' });
            }
            res.json({ ok: true });
        }
    );
});

// Remover avaliação (volta para produtos não avaliados)
router.post('/remover', (req, res) => {
    const { avaliacaoId, produtoId } = req.body;
    const usuarioId = req.session.usuario ? req.session.usuario.ID : null;
    if (!usuarioId) return res.status(401).json({ error: 'Não autorizado' });
    
    db.query(
        'DELETE FROM AVALIACAO WHERE id = ? AND usuario_id = ?',
        [avaliacaoId, usuarioId],
        (err) => {
            if (err) {
                console.error('Erro ao remover avaliação:', err);
                return res.status(500).json({ error: 'Erro ao remover avaliação' });
            }
            res.json({ ok: true });
        }
    );
});

module.exports = router;