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
    cb(null, 'avatar_' + req.session.usuario.ID + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

//Rota para home
router.get('/', (req, res) => {
  const mostrarModalCarrinho = req.session.pedirEscolhaCarrinho;
  req.session.pedirEscolhaCarrinho = false; // Limpa o sinal após usar
  res.render('perfil', {
      usuario: req.session.usuario,
      mostrarModalCarrinho,
      mensagem: null // ou ''
  });
});

router.get('/perfil', (req, res) => {
  // ...busca usuário...
  const mostrarModalCarrinho = req.session.pedirEscolhaCarrinho;
  req.session.pedirEscolhaCarrinho = false;
  res.render('perfil', {
      usuario: req.session.usuario,
      mostrarModalCarrinho,
      mensagem: null // ou ''
  });
});

router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.session.usuario) return res.redirect('/perfil');
  if (!req.file) return res.redirect('/perfil-pos-cadastro?erro=1');
  const avatarPath = '/uploads/avatars/' + req.file.filename;
  db.query('UPDATE Cliente SET avatar = ? WHERE ID = ?', [avatarPath, req.session.usuario.ID], (err) => {
    if (!err) req.session.usuario.avatar = avatarPath;
    res.redirect('/perfil-pos-cadastro');
  });
});

module.exports = router;