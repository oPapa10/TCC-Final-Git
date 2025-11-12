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
    // consulta colunas reais da tabela produto para evitar ER_BAD_FIELD_ERROR
    db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'produto'`,
      (err, cols) => {
        if (err) return callback(err);

        // mapa lowerCase -> columnName real
        const colMap = {};
        cols.forEach(r => { colMap[String(r.COLUMN_NAME).toLowerCase()] = r.COLUMN_NAME; });

        const sistemaIgnore = new Set(['categoria_key', 'imagelink', 'submit', 'thumbnailupload', 'imagem']);
        const campos = [];
        const valores = [];
        const especificacoes = {};

        // se já veio especificacoes no payload, tenta mesclar
        if (produto.especificacoes) {
          try {
            const parsed = typeof produto.especificacoes === 'string' ? JSON.parse(produto.especificacoes) : produto.especificacoes;
            if (parsed && typeof parsed === 'object') {
              Object.assign(especificacoes, parsed);
            }
          } catch (e) {
            // ignora parse error e trata como string simples (não mesclar)
          }
          // removemos para não processar novamente abaixo
          delete produto.especificacoes;
        }

        const usadoCols = new Set();

        Object.entries(produto).forEach(([campo, valor]) => {
          if (valor === undefined || valor === null || valor === '') return;

          const chaveLower = String(campo).toLowerCase();

          if (colMap[chaveLower]) {
            const realCol = colMap[chaveLower];
            // evita duplicar mesma coluna (ex: Categoria_ID e categoria_id)
            if (!usadoCols.has(realCol)) {
              campos.push(realCol);
              valores.push(valor);
              usadoCols.add(realCol);
            }
          } else if (!sistemaIgnore.has(chaveLower)) {
            // este campo não existe como coluna -> fica em especificacoes
            especificacoes[campo] = valor;
          }
        });

        // adiciona especificacoes consolidado se houver chaves
        if (Object.keys(especificacoes).length > 0) {
          // se houver coluna especificacoes no DB, usa o nome real; senão usa 'especificacoes' mesmo (inserção falhará se não existir)
          const especificacoesCol = colMap['especificacoes'] || 'especificacoes';
          campos.push(especificacoesCol);
          valores.push(JSON.stringify(especificacoes));
        }

        if (campos.length === 0) {
          return callback(new Error('Nenhum campo válido para inserir no produto'));
        }

        const sql = `INSERT INTO produto (${campos.join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`;
        console.log('SQL:', sql);
        console.log('Valores:', valores);

        db.query(sql, valores, callback);
      }
    );
};

// ATUALIZAÇÃO COM REMOÇÃO DE PROMOÇÃO SE ESTOQUE = 0
exports.update = (id, produto, callback) => {
  // busca colunas reais
  db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'produto'`,
    (err, cols) => {
      if (err) return callback(err);
      const colMap = {};
      cols.forEach(r => { colMap[String(r.COLUMN_NAME).toLowerCase()] = r.COLUMN_NAME; });

      const sistemaIgnore = new Set(['submit', '_method']); // ignores comuns
      const updates = [];
      const values = [];
      let novasEspecificacoes = {};

      // se veio especificacoes como string/obj, tenta parsear e mesclar depois
      if (produto.especificacoes) {
        try {
          const parsed = typeof produto.especificacoes === 'string' ? JSON.parse(produto.especificacoes) : produto.especificacoes;
          if (parsed && typeof parsed === 'object') {
            Object.assign(novasEspecificacoes, parsed);
          }
        } catch (e) {
          // se não for JSON, ignora (pode haver campos individuais)
        }
        delete produto.especificacoes;
      }

      // percorre keys do objeto recebido
      Object.entries(produto).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        const keyLow = String(k).toLowerCase();
        if (sistemaIgnore.has(keyLow)) return;

        // se coluna existe no DB, adiciona ao UPDATE
        if (colMap[keyLow]) {
          updates.push(`${colMap[keyLow]} = ?`);
          values.push(v);
        } else {
          // trata como especificacao dinâmica
          novasEspecificacoes[k] = v;
        }
      });

      // antes de gravar, obter especificacoes atuais para mesclar
      db.query('SELECT especificacoes FROM Produto WHERE ID = ?', [id], (err2, rows) => {
        if (err2) return callback(err2);
        let atualEspec = {};
        if (rows && rows[0] && rows[0].especificacoes) {
          try {
            atualEspec = typeof rows[0].especificacoes === 'string' ? JSON.parse(rows[0].especificacoes) : rows[0].especificacoes;
            if (!atualEspec || typeof atualEspec !== 'object') atualEspec = {};
          } catch (e) { atualEspec = {}; }
        }

        // mescla atual + novas (novas sobrescrevem)
        const especFinal = Object.assign({}, atualEspec, novasEspecificacoes);

        // se coluna especificacoes existe no DB, adiciona ao UPDATE
        if (colMap['especificacoes']) {
          updates.push(`${colMap['especificacoes']} = ?`);
          values.push(JSON.stringify(especFinal));
        } else if (Object.keys(especFinal).length > 0) {
          // se não há coluna, nada a fazer com especificações (opcional: retornar erro)
          console.warn('[MODEL] Coluna especificacoes não existe; especificações não serão salvas.');
        }

        // depois de montar updates/values, se estiver vazio, log detalhado
        if (updates.length === 0) {
          console.warn('[MODEL] Nenhum campo para atualizar — colMap keys:', Object.keys(colMap).slice(0,50));
          console.warn('[MODEL] Objeto produto recebido (keys):', Object.keys(produto));
          return callback(new Error('Nenhum campo para atualizar'));
        }

        const sql = `UPDATE Produto SET ${updates.join(', ')} WHERE ID = ?`;
        values.push(id);
        db.query(sql, values, callback);
      });
    }
  );
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


