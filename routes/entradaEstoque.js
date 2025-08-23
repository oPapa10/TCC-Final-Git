const express = require('express');
const router = express.Router();
const db = require('../config/db');
const Produto = require('../models/produtoModel');

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
    // Busca todos os dados do produto
    Produto.findById(produto, (err, prod) => {
        if (err || !prod) return res.status(500).send('Produto não encontrado');
        const estoqueAtual = prod.estoque ?? 0;
        const novoEstoque = estoqueAtual + Number(quantidade);
        // Atualiza todos os campos, mudando só o estoque
        Produto.update(produto, { ...prod, estoque: novoEstoque }, (err2) => {
            if (err2) return res.status(500).send('Erro ao atualizar estoque');
            db.query('SELECT ID, nome, estoque FROM Produto', (err3, produtos) => {
                if (err3) return res.status(500).send('Erro ao buscar produtos');
                res.render('entradaEstoque', { produtos, sucesso: true });
            });
        });
    });
});

// Retirar do estoque
router.post('/saida', (req, res) => {
    const { produtoSaida, quantidadeSaida } = req.body;
    if (!produtoSaida || !quantidadeSaida || quantidadeSaida <= 0) {
        return res.status(400).send('Dados inválidos');
    }
    Produto.findById(produtoSaida, (err, prod) => {
        if (err || !prod) return res.status(500).send('Produto não encontrado');
        const estoqueAtual = prod.estoque ?? 0;
        const novoEstoque = Math.max(estoqueAtual - Number(quantidadeSaida), 0);
        Produto.update(produtoSaida, { ...prod, estoque: novoEstoque }, (err2) => {
            if (err2) return res.status(500).send('Erro ao atualizar estoque');
            db.query('SELECT ID, nome, estoque FROM Produto', (err3, produtos) => {
                if (err3) return res.status(500).send('Erro ao buscar produtos');
                res.render('entradaEstoque', { produtos, sucesso: true });
            });
        });
    });
});

router.post('/atualizar', (req, res) => {
  const { produtoId, novoEstoque } = req.body;
  Produto.update(produtoId, { estoque: Number(novoEstoque) }, (err) => {
    if (err) return res.status(500).send('Erro ao atualizar estoque');
    res.redirect('/seeProduto');
  });
});

module.exports = router;