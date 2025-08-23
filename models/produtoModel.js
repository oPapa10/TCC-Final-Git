const db = require('../config/db');

function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

exports.gerarSlug = gerarSlug;

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
    produto.valor,
    produto.cilindrada,
    produto.descricao,
    produto.potencia,
    produto.tanque,
    produto.estoque ?? 0,
    produto.material,
    produto.protecao,
    produto.imagem,
    produto.thumbnails,
    produto.Categoria_ID,
    produto.slug ?? gerarSlug(produto.nome)
  ];

  db.query(sql, values, callback);
};

// ATUALIZAÇÃO COM REMOÇÃO DE PROMOÇÃO SE ESTOQUE = 0
exports.update = (id, produto, callback) => {
  // Busca o nome do produto se não vier no objeto
  if (!produto.nome) {
    db.query('SELECT nome FROM Produto WHERE ID = ?', [id], (err, results) => {
      const nome = results && results[0] ? results[0].nome : 'produto';
      updateProduto(id, produto, nome, callback);
    });
  } else {
    updateProduto(id, produto, produto.nome, callback);
  }
};

function updateProduto(id, produto, nome, callback) {
  const sql = `UPDATE Produto 
               SET nome=?, valor=?, descricao=?, Categoria_ID=?, estoque=?, cor=?, tamanho=?, peso=?, cilindrada=?, potencia=?, tanque=?, material=?, protecao=?, imagem=?, thumbnails=?, slug=? 
               WHERE ID=?`;

  const values = [
    produto.nome ?? nome,
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
    gerarSlug(nome),
    id
  ];

  console.log('Atualizando produto:', { id, estoque: produto.estoque, values });

  db.query(sql, values, (err, result) => {
    if (err) {
      console.log('Erro ao atualizar produto:', err);
      return callback(err);
    }
    // Se estoque ficou zero, remove promoção
    if ((produto.estoque ?? 0) === 0) {
      console.log(`Removendo promoção do produto ${id} porque estoque ficou zero`);
      db.query('DELETE FROM Promocao WHERE produto_id = ?', [id], (err2) => {
        if (err2) {
          console.log('Erro ao remover promoção:', err2);
        } else {
          console.log('Promoção removida com sucesso!');
        }
        callback(null, result);
      });
    } else {
      callback(null, result);
    }
  });
};

exports.delete = (id, callback) => {
  console.log('[MODEL] Iniciando exclusão do produto:', id);

  db.query('DELETE FROM Promocao WHERE produto_id = ?', [id], (err, resultPromo) => {
    if (err) {
      console.log('[MODEL] Erro ao apagar promoção:', err);
      return callback(err);
    }
    console.log('[MODEL] Promoções removidas:', resultPromo.affectedRows);

    db.query('DELETE FROM Produto WHERE ID = ?', [id], (err2, resultProd) => {
      if (err2) {
        console.log('[MODEL] Erro ao apagar produto:', err2);
        return callback(err2);
      }
      console.log('[MODEL] Produto removido:', resultProd.affectedRows);
      callback(null, resultProd);
    });
  });
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

exports.remover = (req, res) => {
  console.log('[CONTROLLER] Tentando apagar produto:', req.params.id);
  Produto.delete(req.params.id, (err, result) => {
    if (err) {
      console.log('[CONTROLLER] Erro ao apagar produto:', err);
      return res.status(500).send('Erro ao remover produto');
    }
    console.log('[CONTROLLER] Produto apagado com sucesso!');
    res.redirect('/seeProduto');
  });
};
