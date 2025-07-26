const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

router.post('/', (req, res) => {
  const { email, senha } = req.body;
  db.query('SELECT * FROM Cliente WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.render('perfil', { mensagem: 'Usuário não encontrado.', usuario: null });
    }
    const usuario = results[0];
    const match = await bcrypt.compare(senha, usuario.senha);
    if (!match) {
      return res.render('perfil', { mensagem: 'Senha incorreta.', usuario: null });
    }
    req.session.usuario = usuario;
    res.redirect('/perfil');
  });
});

module.exports = router;