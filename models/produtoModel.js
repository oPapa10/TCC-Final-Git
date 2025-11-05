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

// Busca produto por ID
exports.findById = (id, callback) => {
    db.query('SELECT * FROM Produto WHERE ID = ?', [id], (err, results) => {
        if (err) return callback(err);
        callback(null, results[0]);
    });
};

exports.create = (produto, callback) => {
    // Lista completa de campos permitidos
    const camposPermitidos = [
        'nome', 'valor', 'descricao', 'Categoria_ID', 'thumbnails', 
        'estoque', 'slug', 'especificacoes', 'cor', 'cilindrada',
        'potencia', 'tanque', 'material', 'protecao', 'imagem',
        'marca', 'modelo', 'tamanho', 'peso', 'ano',
        'tipo_motor', 'refrigeracao', 'partida', 'quilometragem', 'marchas',
        'material_casco', 'tipo_viseira', 'sistema_retencao', 'certificacao',
        'tipo_oleo', 'viscosidade', 'volume_unidade', 'formato_venda',
        'tipo_recipiente', 'aplicacao', 'tipo_peca', 'modelo_compativel',
        'numero_peca', 'dimensoes', 'posicao_lado', 'quantidade_kit',
        'garantia'
    ];
    
    // Filtra campos com valores
    const campos = [];
    const valores = [];
    const especificacoes = {};
    
    // Processa campos normais e especificações
    Object.entries(produto).forEach(([campo, valor]) => {
        if (valor !== undefined && valor !== '' && valor !== null) {
            // Se é um campo direto da tabela
            if (camposPermitidos.includes(campo)) {
                campos.push(campo);
                valores.push(valor);
            } 
            // Se não é um campo sistema, adiciona às especificações
            else if (!['categoria_key', 'imagemLink', 'submit'].includes(campo)) {
                especificacoes[campo] = valor;
            }
        }
    });

    // Adiciona especificações como JSON se houver alguma
    if (Object.keys(especificacoes).length > 0) {
        campos.push('especificacoes');
        valores.push(JSON.stringify(especificacoes));
    }

    const sql = `
        INSERT INTO produto 
        (${campos.join(', ')})
        VALUES 
        (${campos.map(() => '?').join(', ')})
    `;

    console.log('SQL:', sql);
    console.log('Valores:', valores);

    db.query(sql, valores, callback);
};

// ATUALIZAÇÃO COM REMOÇÃO DE PROMOÇÃO SE ESTOQUE = 0
exports.update = (id, produto, callback) => {
  db.query('SELECT * FROM Produto WHERE ID = ?', [id], (err, results) => {
    if (err || !results[0]) return callback(err || new Error('Produto não encontrado'));
    const atual = results[0];

    // Corrige peso: envia null se vazio
    const pesoFinal = (produto.peso !== undefined && produto.peso !== '') ? produto.peso : atual.peso;

    const sql = `UPDATE Produto SET 
        nome = ?, valor = ?, Categoria_ID = ?, cor = ?, tamanho = ?, peso = ?, cilindrada = ?, potencia = ?, tanque = ?, material = ?, protecao = ?, thumbnails = ?, imagem = ?, descricao = ?
        WHERE ID = ?`;
    const values = [
      produto.nome ?? atual.nome,
      produto.valor ?? atual.valor,
      produto.Categoria_ID ?? atual.Categoria_ID,
      produto.cor ?? atual.cor,
      produto.tamanho ?? atual.tamanho,
      pesoFinal,
      produto.cilindrada ?? atual.cilindrada,
      produto.potencia ?? atual.potencia,
      produto.tanque ?? atual.tanque,
      produto.material ?? atual.material,
      produto.protecao ?? atual.protecao,
      produto.thumbnails ?? atual.thumbnails,
      produto.imagem ?? atual.imagem,
      produto.descricao ?? atual.descricao,
      id
    ];
    db.query(sql, values, callback);
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

// Atualiza apenas o estoque do produto
exports.updateEstoque = (id, estoque, callback) => {
    db.query(
        'UPDATE Produto SET estoque = ? WHERE ID = ?',
        [estoque, id],
        callback
    );
};


