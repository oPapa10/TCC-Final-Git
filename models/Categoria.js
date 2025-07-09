const db = require('../config/db');

// Busca todas as categorias
exports.findAll = (callback) => {
  db.query('SELECT * FROM Categoria', callback);
};

// Cria uma nova categoria
exports.create = (categoria, callback) => {
  db.query(
    'INSERT INTO Categoria (nome, descricao) VALUES (?, ?)',
    [categoria.nome, categoria.descricao],
    callback
  );
};