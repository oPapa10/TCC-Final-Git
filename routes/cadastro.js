const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

//Rota para home
router.get('/', (req, res) => {
  res.render('cadastro');
});

router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, cpf, telefone, genero, estado, cidade, rua, numero, complemento } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    db.query(
      'INSERT INTO Cliente (nome, email, senha, CPF, telefone, genero, endereco) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nome, email, hash, cpf, telefone, genero, `${rua}, ${numero}, ${complemento}, ${cidade}, ${estado}`],
      (err, result) => {
        if (err) {
          let msg = 'Erro ao cadastrar';
          if (err.code === 'ER_DUP_ENTRY') msg = 'Este e-mail já está cadastrado!';
          return res.render('cadastro', { mensagem: msg });
        }
        db.query('SELECT * FROM Cliente WHERE email = ?', [email], (err2, results) => {
          if (err2 || results.length === 0) return res.render('cadastro', { mensagem: 'Erro ao buscar usuário cadastrado.' });
          req.session.usuario = results[0]; // loga automaticamente
          res.redirect('/perfil?cadastro=ok');
        });
      }
    );
  } catch (e) {
    res.render('cadastro', { mensagem: 'Erro inesperado ao cadastrar.' });
  }
});

module.exports = router;