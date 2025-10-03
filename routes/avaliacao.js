// routes/avaliacao.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Página de avaliações gerais
router.get('/', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado.' });
    }
    db.query(`
        SELECT p.*, c.nome AS categoria_nome
        FROM PRODUTO p
        LEFT JOIN CATEGORIA c ON p.Categoria_ID = c.ID
        WHERE p.ID IN (
            SELECT produto_id FROM PEDIDO_ITENS WHERE usuario_id = ?
        )
    `, [req.session.usuario.ID], (err, produtos) => {
        db.query('SELECT * FROM AVALIACAO WHERE usuario_id = ?', [req.session.usuario.ID], (err2, avaliacoes) => {
            res.render('avaliacoes', {
                produtos: produtos || [],
                avaliacoes: avaliacoes || [],
                usuario: req.session.usuario
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
                if (err2) return res.status(500).send('Erro ao salvar avaliação');
                res.redirect('/?msg=avaliacao');
            });
        }
    );
});

// Remover avaliação
router.post('/remover', (req, res) => {
    const { avaliacaoId, produtoId } = req.body;
    const usuarioId = req.session.usuario ? req.session.usuario.ID : null;
    if (!usuarioId) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para remover sua avaliação.' });
    }
    db.query(
        'DELETE FROM AVALIACAO WHERE id = ? AND usuario_id = ?',
        [avaliacaoId, usuarioId],
        (err) => {
            return res.redirect('/avaliacao');
        }
    );
});

module.exports = router;