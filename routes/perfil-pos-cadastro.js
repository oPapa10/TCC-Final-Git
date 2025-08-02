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
    res.render('perfil-pos-cadastro', {
        usuario: req.session.usuario || {}, // garante que sempre existe
        primeiroAcesso: false // ou true, conforme sua lógica
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