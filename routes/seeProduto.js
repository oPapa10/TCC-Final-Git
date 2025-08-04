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

module.exports = router;
