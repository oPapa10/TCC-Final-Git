const express = require('express');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.render('opcoes', {
    usuario: req.session.usuario || null,
    pagamentos: [],
    query: req.query
  });
});

module.exports = router;
