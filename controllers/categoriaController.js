// controllers/categoriaController.js
const Categoria = require('../models/Categoria');

exports.listar = (req, res) => {
  Categoria.findAll((err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createCategoria', { categorias });
  });
};

exports.criar = (req, res) => {
  const { categoryName, categoryDescription } = req.body;
  Categoria.create({ nome: categoryName, descricao: categoryDescription }, (err) => {
    if (err) return res.status(500).send('Erro ao criar categoria');
    res.redirect('/createCategoria');
  });
};