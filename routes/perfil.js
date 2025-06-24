const express = require('express');
const path = require('path');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'perfil.html'));
});


router.get('/cadastro', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'cadastro.html'));        
})
module.exports = router;