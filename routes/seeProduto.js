const express = require('express');
const path = require('path');
const router = express.Router();
const Produto = require('../models/produtoModel');
const db = require('../config/db');

//Rota para home
router.get('/', (req, res) => {
    // Supondo que Produto é seu model
    Produto.findAll((err, produtos) => {
        if (err) return res.status(500).send('Erro ao buscar produtos');
        res.render('seeProduto', { produtos }); // <-- produtos deve ser passado aqui!
    });
});

router.get('/lista', (req, res) => {
    db.query('SELECT ID, nome, valor FROM Produto', (err, produtos) => {
        if (err) return res.json([]);
        res.json(produtos);
    });
});

router.post('/excluir/:id', (req, res) => {
    const id = req.params.id;
    // Exclui avaliações
    db.query('DELETE FROM AVALIACAO WHERE produto_id = ?', [id], (err1) => {
        if (err1) {
            console.error('Erro ao remover avaliações:', err1);
            return res.status(500).send('Erro ao remover avaliações: ' + err1.message);
        }
        // Exclui itens de pedido
        db.query('DELETE FROM PEDIDO_ITENS WHERE produto_id = ?', [id], (err2) => {
            if (err2) {
                console.error('Erro ao remover itens de pedido:', err2);
                return res.status(500).send('Erro ao remover itens de pedido: ' + err2.message);
            }
            // Exclui produto
            db.query('DELETE FROM Produto WHERE ID = ?', [id], (err3) => {
                if (err3) {
                    console.error('Erro ao remover produto:', err3);
                    return res.status(500).send('Erro ao remover produto: ' + err3.message);
                }
                res.redirect('/seeProduto');
            });
        });
    });
});

module.exports = router;
