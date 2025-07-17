const express = require('express');
const path = require('path');
const router = express.Router();
const Produto = require('../models/produtoModel');

//Rota para home
router.get('/', (req, res) => {
    // Supondo que Produto é seu model
    Produto.findAll((err, produtos) => {
        if (err) return res.status(500).send('Erro ao buscar produtos');
        res.render('seeProduto', { produtos }); // <-- produtos deve ser passado aqui!
    });
});

module.exports = router;
