const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  // Log antes de remover promoções expiradas
  db.query('SELECT id, data_fim FROM Promocao', (err, todasPromos) => {
    if (err) console.log('[LOG] Erro ao buscar promoções antes de deletar:', err);
    else console.log('[LOG] Promoções antes de deletar:', todasPromos);

    // Remove promoções expiradas antes de listar
    db.query(
      'DELETE FROM Promocao WHERE data_fim IS NOT NULL AND data_fim < NOW()',
      (errDel, resultDel) => {
        if (errDel) console.log('[LOG] Erro ao deletar promoções expiradas:', errDel);
        else console.log('[LOG] Promoções expiradas removidas:', resultDel && resultDel.affectedRows);

        db.query(
          `SELECT p.*, pr.valor_promocional, pr.id AS promocao_id, pr.data_fim, c.nome AS categoria_nome
           FROM Produto p
           LEFT JOIN Promocao pr ON pr.produto_id = p.ID
           LEFT JOIN Categoria c ON p.Categoria_ID = c.ID
           WHERE p.estoque > 0`,
          (err, produtos) => {
            if (err) return res.status(500).render('index', { produtos: [], categorias: [], promocoes: [] });
            db.query('SELECT * FROM Categoria ORDER BY COALESCE(ordem,999), ID', (err2, categorias) => {
              if (err2) return res.status(500).render('index', { produtos, categorias: [], promocoes: [] });
              db.query(
                `SELECT Promocao.id, Promocao.imagem, Promocao.descricao, Promocao.valor_promocional, Promocao.data_fim, Produto.nome AS produto_nome, Produto.valor AS valor_real, Promocao.produto_id, Produto.slug
                 FROM Promocao
                 JOIN Produto ON Promocao.produto_id = Produto.ID
                 ORDER BY Promocao.id DESC`,
                (err3, promocoes) => {
                  if (err3) return res.status(500).render('index', { produtos, categorias, promocoes: [] });
                  console.log('[LOG] Promoções enviadas para o index:', promocoes);
                  res.render('index', { produtos, categorias, promocoes });
                }
              );
            });
          }
        );
      }
    );
  });
});

// novas rotas estáticas simples
router.get('/termos-uso', (req, res) => {
  res.render('termos-uso');
});

router.get('/sobre-nos', (req, res) => {
  res.render('aboutUs');
});

router.get('/privacidade', (req, res) => {
  // manter rota compatível com a label "Política de Privacidade"
  res.redirect('/seguranca');
});

router.get('/seguranca', (req, res) => {
  res.render('seguranca');
});

module.exports = router;
