const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Página de detalhes do produto usando slug
router.get('/:slug', (req, res) => {
    const slug = req.params.slug;
    db.query(
        `SELECT p.*, pr.valor_promocional
         FROM Produto p
         LEFT JOIN Promocao pr ON pr.produto_id = p.ID
         WHERE p.slug = ?`,
        [slug],
        (err, results) => {
            if (err || results.length === 0) {
                return res.render('product', { produto: null });
            }
            const produto = results[0];

            // Converta para número se existir, senão deixa undefined
            produto.valor_promocional = produto.valor_promocional ? Number(produto.valor_promocional) : undefined;
            produto.valor = produto.valor ? Number(produto.valor) : 0;

            // Trate thumbnails como array
            if (produto.thumbnails) {
                try {
                    produto.thumbnails = JSON.parse(produto.thumbnails);
                } catch {
                    produto.thumbnails = produto.thumbnails.split(',').map(s => s.trim());
                }
            } else {
                produto.thumbnails = [];
            }

            res.render('product', { produto });
        }
    );
});


module.exports = router;
