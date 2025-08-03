const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Página de entrada/saída de estoque
router.get('/', (req, res) => {
    db.query('SELECT ID, nome, estoque FROM Produto', (err, produtos) => {
        if (err) return res.status(500).send('Erro ao buscar produtos');
        res.render('entradaEstoque', { produtos, sucesso: false });
    });
});

// Adicionar ao estoque
router.post('/', (req, res) => {
    const { produto, quantidade } = req.body;
    if (!produto || !quantidade || quantidade <= 0) {
        return res.status(400).send('Dados inválidos');
    }
    db.query('UPDATE Produto SET estoque = estoque + ? WHERE ID = ?', [quantidade, produto], (err) => {
        if (err) return res.status(500).send('Erro ao atualizar estoque');
        db.query('SELECT ID, nome, estoque FROM Produto', (err2, produtos) => {
            if (err2) return res.status(500).send('Erro ao buscar produtos');
            res.render('entradaEstoque', { produtos, sucesso: true });
        });
    });
});

// Retirar do estoque
router.post('/saida', (req, res) => {
    const { produtoSaida, quantidadeSaida } = req.body;
    if (!produtoSaida || !quantidadeSaida || quantidadeSaida <= 0) {
        return res.status(400).send('Dados inválidos');
    }
    db.query('UPDATE Produto SET estoque = GREATEST(estoque - ?, 0) WHERE ID = ?', [quantidadeSaida, produtoSaida], (err) => {
        if (err) return res.status(500).send('Erro ao atualizar estoque');
        db.query('SELECT ID, nome, estoque FROM Produto', (err2, produtos) => {
            if (err2) return res.status(500).send('Erro ao buscar produtos');
            res.render('entradaEstoque', { produtos, sucesso: true });
        });
    });
});

module.exports = router;