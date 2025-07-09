const express = require('express');
const path = require('path');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.render('cadastro');
});

module.exports = router;