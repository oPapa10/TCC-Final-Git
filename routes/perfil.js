const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../config/db');
const upload = multer({ dest: 'public/uploads/' });

//Rota para home
router.get('/', (req, res) => {
  let primeiroAcesso = false;
  if (req.session.usuario) {
    if (req.query.cadastro === 'ok') {
      primeiroAcesso = true;
    }
    res.render('perfil-pos-cadastro', { usuario: req.session.usuario, primeiroAcesso });
  } else {
    res.render('perfil', { usuario: null, mensagem: null });
  }
});

router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.session.usuario) return res.redirect('/perfil');
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return res.redirect('/perfil');
  }
  const avatarPath = '/uploads/' + req.file.filename;
  const userId = req.session.usuario.ID; // ou usuario.id, conforme seu banco

  db.query('UPDATE Cliente SET avatar = ? WHERE ID = ?', [avatarPath, userId], (err) => {
    if (!err) {
      req.session.usuario.avatar = avatarPath;
    }
    res.redirect('/perfil');
  });
});

module.exports = router;