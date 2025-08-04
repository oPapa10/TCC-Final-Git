const db = require('../config/db');
const Promocao = require('../models/promocaoModel');

exports.index = (req, res) => {
    db.query(`
        SELECT Produto.*, Categoria.nome AS categoria_nome
        FROM Produto
        LEFT JOIN Categoria ON Produto.Categoria_ID = Categoria.ID
    `, (err, produtos) => {
        if (err) return res.status(500).send('Erro no banco');
        db.query('SELECT * FROM Categoria', (err2, categorias) => {
            if (err2) return res.status(500).send('Erro ao buscar categorias');
            Promocao.findAll((err3, promocoes) => {
                if (err3) return res.status(500).send('Erro ao buscar promoções');
                res.render('index', { produtos, categorias, promocoes });
            });
        });
    });
};