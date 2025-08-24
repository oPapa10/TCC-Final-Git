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
    const { produto, quantidade, novoEstoque } = req.body;
    console.log('[POST /entradaEstoque] Dados recebidos:', { produto, quantidade, novoEstoque });
    if (!produto) {
        console.log('[POST /entradaEstoque] Produto não selecionado');
        return res.status(400).send('Produto não selecionado');
    }
    Produto.findById(produto, (err, prod) => {
        if (err || !prod) {
            console.log('[POST /entradaEstoque] Produto não encontrado:', err, prod);
            return res.status(500).send('Produto não encontrado');
        }
        let estoqueFinal;
        // Só um campo pode ser usado
        if (quantidade && Number(quantidade) > 0 && (!novoEstoque || novoEstoque === '')) {
            estoqueFinal = prod.estoque + Number(quantidade);
            console.log('[POST /entradaEstoque] Adicionando quantidade:', quantidade, 'Novo estoque:', estoqueFinal);
        } else if ((novoEstoque !== undefined && novoEstoque !== '' && Number(novoEstoque) >= 0) && (!quantidade || quantidade === '')) {
            estoqueFinal = Number(novoEstoque);
            console.log('[POST /entradaEstoque] Alterando estoque diretamente para:', estoqueFinal);
        } else {
            console.log('[POST /entradaEstoque] Erro: ambos os campos preenchidos ou inválidos');
            return res.status(400).send('Preencha apenas um campo: quantidade a adicionar OU novo estoque!');
        }
        Produto.update(produto, { ...prod, estoque: estoqueFinal }, (err2) => {
            if (err2) {
                console.log('[POST /entradaEstoque] Erro ao atualizar estoque:', err2);
                return res.status(500).send('Erro ao atualizar estoque');
            }
            db.query('SELECT ID, nome, estoque FROM Produto', (err3, produtos) => {
                if (err3) {
                    console.log('[POST /entradaEstoque] Erro ao buscar produtos:', err3);
                    return res.status(500).send('Erro ao buscar produtos');
                }
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