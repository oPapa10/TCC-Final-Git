const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  db.query(
    `SELECT p.*, pr.valor_promocional, pr.id AS promocao_id, c.nome AS categoria_nome
     FROM Produto p
     LEFT JOIN Promocao pr ON pr.produto_id = p.ID
     LEFT JOIN Categoria c ON p.Categoria_ID = c.ID
     WHERE p.estoque > 0`, // <-- só produtos com estoque
    (err, produtos) => {
      if (err) return res.status(500).render('index', { produtos: [], categorias: [], promocoes: [] });
      db.query('SELECT * FROM Categoria', (err2, categorias) => {
        if (err2) return res.status(500).render('index', { produtos, categorias: [], promocoes: [] });
        db.query(
          `SELECT Promocao.id, Promocao.imagem, Promocao.descricao, Promocao.valor_promocional, Produto.nome AS produto_nome, Produto.valor AS valor_real, Promocao.produto_id, Produto.slug
FROM Promocao
JOIN Produto ON Promocao.produto_id = Produto.ID
ORDER BY Promocao.id DESC`,
          (err3, promocoes) => {
            if (err3) return res.status(500).render('index', { produtos, categorias, promocoes: [] });
            res.render('index', { produtos, categorias, promocoes });
          }
        );
      });
    }
  );
});

module.exports = router;
