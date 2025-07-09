// routes/categoria.js
const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/createCategoria', categoriaController.listar);
router.post('/categorias', categoriaController.criar);

module.exports = router;