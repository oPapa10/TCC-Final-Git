const db = require('../config/db');

// Busca todos os produtos
exports.findAll = (callback) => {
  db.query('SELECT * FROM Produto', callback);
};

// Busca um produto por ID
exports.findById = (id, callback) => {
  db.query('SELECT * FROM Produto WHERE ID = ?', [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

// Cria um novo produto
exports.create = (produto, callback) => {
  const sql = `INSERT INTO Produto (nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, categoria, tanque, estoque, material, protecao, imagem)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    produto.nome, produto.cor, produto.tamanho, produto.peso, produto.valor,
    produto.cilindrada, produto.descricao, produto.potencia, produto.categoria,
    produto.tanque, produto.estoque, produto.material, produto.protecao, produto.imagem
  ];
  db.query(sql, values, callback);
};

// Atualiza um produto
exports.update = (id, produto, callback) => {
  const sql = `UPDATE Produto SET nome=?, cor=?, tamanho=?, peso=?, valor=?, cilindrada=?, descricao=?, potencia=?, categoria=?, tanque=?, estoque=?, material=?, protecao=?, imagem=?
               WHERE ID=?`;
  const values = [
    produto.nome, produto.cor, produto.tamanho, produto.peso, produto.valor,
    produto.cilindrada, produto.descricao, produto.potencia, produto.categoria,
    produto.tanque, produto.estoque, produto.material, produto.protecao, produto.imagem, id
  ];
  db.query(sql, values, callback);
};

// Remove um produto
exports.delete = (id, callback) => {
  db.query('DELETE FROM Produto WHERE ID = ?', [id], callback);
};