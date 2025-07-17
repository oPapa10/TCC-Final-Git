const db = require('../config/db');

// Busca todas as categorias
exports.findAll = (callback) => {
  db.query('SELECT * FROM Categoria', callback);
};

// Cria uma nova categoria
exports.create = (categoria, callback) => {
  db.query(
    'INSERT INTO Categoria (nome) VALUES (?)',
    [categoria.nome],
    callback
  );
};

// Atualiza uma categoria existente
exports.update = (id, categoria, callback) => {
  db.query(
    'UPDATE Categoria SET nome=? WHERE ID=?',
    [categoria.nome, id],
    callback
  );
};

// Deleta uma categoria pelo ID
exports.delete = (id, callback) => {
  db.query('DELETE FROM Categoria WHERE ID=?', [id], callback);
};

// Busca uma categoria pelo ID (útil para editar)
exports.findById = (id, callback) => {
  db.query('SELECT * FROM Categoria WHERE ID=?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};