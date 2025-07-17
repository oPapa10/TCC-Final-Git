const db = require('../config/db');

exports.findAll = (callback) => {
  db.query('SELECT * FROM Produto', callback);
};

exports.findById = (id, callback) => {
  db.query('SELECT * FROM Produto WHERE ID = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.create = (produto, callback) => {
  const sql = `INSERT INTO Produto 
    (nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque, estoque, material, protecao, imagem, thumbnails, Categoria_ID)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    produto.nome,
    produto.cor,
    produto.tamanho,
    produto.peso,
    Number(produto.valor), // importante!
    produto.cilindrada,
    produto.descricao,
    produto.potencia,
    produto.tanque,
    produto.estoque,
    produto.material,
    produto.protecao,
    produto.imagem,
    produto.thumbnails,
    produto.categoria
  ];
  db.query(sql, values, callback);
};

exports.update = (id, produto, callback) => {
  const sql = `UPDATE Produto SET nome=?, valor=?, descricao=?, Categoria_ID=?, estoque=?, imagem=? WHERE ID=?`;
  const values = [
    produto.nome,
    produto.valor,
    produto.descricao,
    produto.categoria,
    produto.estoque,
    produto.imagem,
    id
  ];
  db.query(sql, values, callback);
};

exports.delete = (id, callback) => {
  db.query('DELETE FROM Produto WHERE ID = ?', [id], callback);
};
