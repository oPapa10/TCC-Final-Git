const express = require('express');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  console.log('[OPCOES] sessão.usuario =', req.session.usuario);
  res.render('opcoes', {
    usuario: req.session.usuario || null,
    pagamentos: [],
    query: req.query
  });
});

module.exports = router;
