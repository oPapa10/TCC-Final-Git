const db = require('../config/db');

const Promocao = {
    findAll: (callback) => {
        db.query(`
            SELECT Promocao.*, Produto.nome AS produto_nome, Produto.valor AS valor_real
            FROM Promocao
            JOIN Produto ON Promocao.produto_id = Produto.ID
            ORDER BY Promocao.id DESC
        `, callback);
    }
};

module.exports = Promocao;