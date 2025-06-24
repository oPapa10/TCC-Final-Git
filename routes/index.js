const express = require('express');
const path = require('path');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

//Rota para sobre
router.get('/carrinho', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'carrinho.html'));
});

//Rota para contato
router.get('/perfil', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'perfil.html'));
});

module.exports = router;
