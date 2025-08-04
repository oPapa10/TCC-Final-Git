const express = require('express');
const path = require('path');
const router = express.Router();

//Rota para home
router.get('/', (req, res) => {
  res.render('ajuda', {
    categoriasAjuda: [], // ou um array de categorias, se quiser
    perguntasFrequentes: [] // se quiser evitar erro em perguntas também
  });
});

module.exports = router;
