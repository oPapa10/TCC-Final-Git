const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Editar perfil
router.put('/:id', (req, res) => {
  const { nome, email, telefone, data_nascimento } = req.body;
  db.query(
    'UPDATE Cliente SET nome = ?, email = ?, telefone = ?, data_nascimento = ? WHERE ID = ?',
    [nome, email, telefone, data_nascimento, req.params.id],
    (err) => {
      if (err) {
        // Você pode enviar uma mensagem de erro para o EJS se quiser
        return res.redirect('/opcoes?erro=1');
      }
      // Atualiza os dados na sessão
      db.query('SELECT * FROM Cliente WHERE ID = ?', [req.params.id], (err2, results) => {
        if (!err2 && results.length > 0) {
          req.session.usuario = results[0];
        }
        res.redirect('/opcoes?sucesso=1');
      });
    }
  );
});

module.exports = router;