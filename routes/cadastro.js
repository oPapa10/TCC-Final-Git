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
    let { nome, email, senha, cpf, telefone, genero, estado, cidade, rua, numero, complemento } = req.body;
    email = email.trim().toLowerCase();
    cpf = cpf.trim().replace(/\D/g, '').slice(0, 11); // <-- Limpa e limita o CPF
    const hash = await bcrypt.hash(senha, 10);
    db.query(
      'INSERT INTO CLIENTE (nome, email, senha, CPF, telefone, genero, estado, cidade, rua, numero, complemento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
      [ nome, email, hash, cpf, telefone, genero, estado, cidade, rua, numero, complemento ],
      (err, result) => {
        let msg = 'Erro ao cadastrar';
        if (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage.includes('email')) msg = 'Este e-mail já está cadastrado!';
            else if (err.sqlMessage.includes('CPF')) msg = 'Este CPF já está cadastrado!';
            else msg = 'Dados já cadastrados!';
          } else {
            msg = `Erro ao cadastrar: ${err.sqlMessage || err.message}`;
          }
          return res.render('cadastro', { mensagem: msg });
        }
        db.query('SELECT * FROM CLIENTE WHERE email = ?', [email], (err2, results) => {
          if (err2 || results.length === 0) return res.render('cadastro', { mensagem: 'Erro ao buscar usuário cadastrado.' });
          req.session.usuario = results[0];
          req.session.primeiroAcesso = true;
          res.redirect('/perfil');
        });
      }
    );
  } catch (e) {
    res.render('cadastro', { mensagem: 'Erro inesperado ao cadastrar.' });
  }
});

// Verifica se o e-mail já existe
router.get('/verificar-email', (req, res) => {
  const email = req.query.email;
  db.query('SELECT 1 FROM CLIENTE WHERE email = ?', [email], (err, results) => {
    if (err) return res.json({ existe: false });
    res.json({ existe: results.length > 0 });
  });
});

// Verifica se o CPF já existe
router.get('/verificar-cpf', (req, res) => {
  const cpf = req.query.cpf;
  db.query('SELECT 1 FROM CLIENTE WHERE CPF = ?', [cpf], (err, results) => {
    if (err) return res.json({ existe: false });
    res.json({ existe: results.length > 0 });
  });
});

module.exports = router;  