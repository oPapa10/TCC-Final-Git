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
  if (req.session.primeiroAcesso) {
    req.session.primeiroAcesso = false;
    return res.redirect('/perfil-pos-cadastro');
  }
  let usuario = req.session.usuario;
  if (usuario) {
    usuario.endereco = [
      usuario.rua,
      usuario.numero,
      usuario.complemento,
      usuario.cidade,
      usuario.estado
    ].filter(Boolean).join(', ');
  }
  const mostrarModalCarrinho = req.session.pedirEscolhaCarrinho;
  req.session.pedirEscolhaCarrinho = false;
  res.render('perfil', {
      usuario,
      mostrarModalCarrinho,
      mensagem: null
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