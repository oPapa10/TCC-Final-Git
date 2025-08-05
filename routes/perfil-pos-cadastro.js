const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/avatars/');
  },
  filename: function (req, file, cb) {
    cb(null, 'avatar_' + req.session.usuario.ID + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// GET perfil-pos-cadastro
router.get('/perfil-pos-cadastro', (req, res) => {
  let usuario = req.session.usuario || {};
  usuario.endereco = [
    usuario.rua,
    usuario.numero,
    usuario.complemento,
    usuario.cidade,
    usuario.estado
  ].filter(Boolean).join(', ');
  res.render('perfil-pos-cadastro', {
    usuario,
    primeiroAcesso: true
  });
});

// POST avatar upload
router.post('/avatar', upload.single('avatar'), (req, res) => {
    if (!req.session.usuario || !req.file) {
        return res.redirect('/perfil-pos-cadastro');
    }
    const avatarPath = '/uploads/avatars/' + req.file.filename;
    db.query('UPDATE Cliente SET avatar = ? WHERE ID = ?', [avatarPath, req.session.usuario.ID], (err) => {
        if (!err) req.session.usuario.avatar = avatarPath;
        res.redirect('/perfil-pos-cadastro');
    });
});

module.exports = router;