const express = require('express');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.render('perfil', {
    usuario: req.session.usuario || null,
    mensagem: null
  });
});

module.exports = router;