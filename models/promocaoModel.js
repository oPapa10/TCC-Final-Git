const db = require('../config/db');

function gerarSlug(nome, id) {
    let base = nome
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    return id ? `${base}-${id}` : base;
}

const Promocao = {
    findAll: (callback) => {
        db.query(`
            SELECT Promocao.*, Produto.nome AS produto_nome, Produto.valor AS valor_real
            FROM Promocao
            JOIN Produto ON Promocao.produto_id = Produto.ID
            ORDER BY Promocao.id DESC
        `, callback);
    },

    update: (id, produto, callback) => {
        // Busca o nome e slug atuais do produto
        db.query('SELECT nome, slug FROM Produto WHERE ID = ?', [id], (err, results) => {
            if (err || !results[0]) return callback(err || new Error('Produto não encontrado'));
            const nomeAtual = results[0].nome;
            const slugAtual = results[0].slug;

            const nomeFinal = produto.nome ?? nomeAtual;
            // Se o nome mudou, gere slug único, senão mantenha o slug atual
            const slugFinal = (produto.nome && produto.nome !== nomeAtual)
                ? gerarSlug(produto.nome, id)
                : slugAtual;

            const sql = `UPDATE Produto 
                SET nome=?, valor=?, descricao=?, Categoria_ID=?, estoque=?, cor=?, tamanho=?, peso=?, cilindrada=?, potencia=?, tanque=?, material=?, protecao=?, imagem=?, thumbnails=?, slug=? 
                WHERE ID=?`;

            const values = [
                nomeFinal,
                produto.valor ?? 0,
                produto.descricao ?? '',
                produto.Categoria_ID ?? null,
                produto.estoque ?? 0,
                produto.cor ?? '',
                produto.tamanho ?? '',
                produto.peso ?? 0,
                produto.cilindrada ?? '',
                produto.potencia ?? '',
                produto.tanque ?? '',
                produto.material ?? '',
                produto.protecao ?? '',
                produto.imagem ?? '',
                produto.thumbnails ?? '',
                slugFinal,
                id
            ];

            db.query(sql, values, (err2, result) => {
                if (err2) return callback(err2);
                // Se estoque ficou zero, remove promoção
                if ((produto.estoque ?? 0) === 0) {
                    db.query('DELETE FROM Promocao WHERE produto_id = ?', [id], (err3) => {
                        callback(null, result);
                    });
                } else {
                    callback(null, result);
                }
            });
        });
    }
};

module.exports = Promocao;