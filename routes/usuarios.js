const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/avatars/');
  },
  filename: function (req, file, cb) {
    cb(null, 'avatar_' + req.params.id + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Editar perfil
router.put('/:id', upload.single('avatar'), (req, res) => {
  const { nome, email, telefone, estado, cidade, rua, numero, complemento, senha } = req.body;
  let campos = [];
  let valores = [];

  if (nome && nome !== usuario.nome) { campos.push('nome = ?'); valores.push(nome); }
  if (email && email !== usuario.email) { campos.push('email = ?'); valores.push(email); }
  if (telefone && telefone !== usuario.telefone) { campos.push('telefone = ?'); valores.push(telefone); }
  if (estado && estado !== usuario.estado) { campos.push('estado = ?'); valores.push(estado); }
  if (cidade && cidade !== usuario.cidade) { campos.push('cidade = ?'); valores.push(cidade); }
  if (rua && rua !== usuario.rua) { campos.push('rua = ?'); valores.push(rua); }
  if (numero && numero !== usuario.numero) { campos.push('numero = ?'); valores.push(numero); }
  if (complemento && complemento !== usuario.complemento) { campos.push('complemento = ?'); valores.push(complemento); }
  if (senha) { campos.push('senha = ?'); valores.push(hashSenha(senha)); }
  if (req.file) {
    campos.push('avatar = ?');
    valores.push('/uploads/avatars/' + req.file.filename);
  }

  if (campos.length > 0) {
    db.query(`UPDATE Cliente SET ${campos.join(', ')} WHERE ID = ?`, [...valores, req.params.id], (err) => {
      if (err) return res.redirect('/opcoes?erro=1');
      db.query('SELECT * FROM Cliente WHERE ID = ?', [req.params.id], (err2, results) => {
        if (!err2 && results.length > 0) {
          req.session.usuario = results[0];
        }
        res.redirect('/opcoes?sucesso=1');
      });
    });
  } else {
    res.redirect('/opcoes?nenhuma_alteracao=1');
  }
});

module.exports = router;