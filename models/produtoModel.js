const db = require('../config/db');

function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '-')     // troca espaços por hífen
    .replace(/-+/g, '-');     // evita múltiplos hífens
}

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
    (nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque, estoque, material, protecao, imagem, thumbnails, Categoria_ID, slug)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const values = [
    produto.nome,
    produto.cor,
    produto.tamanho,
    produto.peso,
    Number(produto.valor),
    produto.cilindrada,
    produto.descricao,
    produto.potencia,
    produto.tanque,
    produto.estoque,
    produto.material,
    produto.protecao,
    produto.imagem,
    produto.thumbnails,
    produto.categoria,
    gerarSlug(produto.nome) // slug só com o nome
  ];
  db.query(sql, values, callback);
};

exports.update = (id, produto, callback) => {
  const sql = `UPDATE Produto SET nome=?, valor=?, descricao=?, Categoria_ID=?, estoque=?, imagem=?, slug=? WHERE ID=?`;
  const values = [
    produto.nome,
    produto.valor,
    produto.descricao,
    produto.categoria,
    produto.estoque,
    produto.imagem,
    gerarSlug(produto.nome),
    id
  ];
  db.query(sql, values, callback);
};

exports.delete = (id, callback) => {
  db.query('DELETE FROM Produto WHERE ID = ?', [id], callback);
};

exports.findBySlug = (slug, callback) => {
  db.query('SELECT * FROM Produto WHERE slug = ?', [slug], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0]);
  });
};

exports.updateSlug = (id, slug, callback) => {
  db.query('UPDATE Produto SET slug = ? WHERE ID = ?', [slug, id], callback);
};
