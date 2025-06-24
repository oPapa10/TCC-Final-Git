const express = require('express');
const path = require('path');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'seeProduto.html'));
});

module.exports = router;
