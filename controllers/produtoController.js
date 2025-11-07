const Produto = require('../models/produtoModel');
const { gerarSlug } = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const db = require('../config/db');

// Listar todos os produtos
exports.listar = (req, res) => {
  Produto.findAll((err, produtos) => {
    if (err) return res.status(500).send('Erro ao buscar produtos');
    res.render('seeProduto', { produtos });
  });
};

// Detalhar um produto
exports.detalhar = (req, res) => {
  const produtoId = req.params.id;
  db.query('SELECT * FROM PRODUTO WHERE ID = ?', [produtoId], (err, produtos) => {
    if (err || produtos.length === 0) return res.render('product', { produto: null, avaliacoes: [], relacionados: [], categoriaCampos: [] });

    const produto = produtos[0];

    // busca campos da categoria
    db.query('SELECT campos FROM categoria WHERE ID = ?', [produto.Categoria_ID], (errCat, rowsCat) => {
      let categoriaCampos = [];
      if (!errCat && rowsCat && rowsCat[0] && rowsCat[0].campos) {
        try {
          const arr = JSON.parse(rowsCat[0].campos);
          categoriaCampos = Array.isArray(arr) ? arr.map(c => {
            const key = String(c).toLowerCase().replace(/\s+/g,'_');
            return { key, label: String(c) };
          }) : [];
        } catch(e) {
          categoriaCampos = [];
        }
      }

      // Busca avaliações
      db.query(
        `SELECT a.*, u.nome AS usuario_nome 
         FROM AVALIACAO a 
         JOIN CLIENTE u ON a.usuario_id = u.ID 
         WHERE a.produto_id = ? 
         ORDER BY a.data_avaliacao DESC`,
        [produtoId],
        (err2, avaliacoes) => {
          // Busca produtos relacionados (opcional)
          db.query('SELECT * FROM PRODUTO WHERE Categoria_ID = ? AND ID != ? LIMIT 4', [produto.Categoria_ID, produtoId], (err3, relacionados) => {
            res.render('product', {
              produto,
              avaliacoes: avaliacoes || [],
              relacionados: relacionados || [],
              categoriaCampos
            });
          });
        }
      );
    });
  });
};

// Detalhar por slug
exports.detalharPorSlug = (req, res) => {
  const slug = req.params.slug;
  db.query(
      `SELECT p.*, pr.valor_promocional
       FROM Produto p
       LEFT JOIN (
           SELECT produto_id, MAX(valor_promocional) AS valor_promocional
           FROM Promocao
           GROUP BY produto_id
       ) pr ON pr.produto_id = p.ID
       WHERE p.slug = ?`,
      [slug],
      (err, results) => {
          if (err || results.length === 0) {
              return res.render('product', { produto: null, avaliacoes: [], relacionados: [], categoriaCampos: [] });
          }
          const produto = results[0];
          produto.valor_promocional = produto.valor_promocional ? Number(produto.valor_promocional) : undefined;
          produto.valor = produto.valor ? Number(produto.valor) : 0;
          if (produto.thumbnails) {
              try {
                  produto.thumbnails = JSON.parse(produto.thumbnails);
              } catch {
                  produto.thumbnails = produto.thumbnails.split(',').map(s => s.trim());
              }
          } else {
              produto.thumbnails = [];
          }

          // busca campos da categoria
          db.query('SELECT campos FROM categoria WHERE ID = ?', [produto.Categoria_ID], (errCat, rowsCat) => {
            let categoriaCampos = [];
            if (!errCat && rowsCat && rowsCat[0] && rowsCat[0].campos) {
              try {
                const arr = JSON.parse(rowsCat[0].campos);
                categoriaCampos = Array.isArray(arr) ? arr.map(c => {
                  const key = String(c).toLowerCase().replace(/\s+/g,'_');
                  return { key, label: String(c) };
                }) : [];
              } catch(e) { categoriaCampos = []; }
            }

            // continua o fluxo (buscar avaliações e relacionados)
            db.query(
              `SELECT a.*, u.nome AS usuario_nome 
               FROM AVALIACAO a 
               JOIN CLIENTE u ON a.usuario_id = u.ID 
               WHERE a.produto_id = ? 
               ORDER BY a.data_avaliacao DESC`,
              [produto.ID],
              (err2, avaliacoes) => {
                db.query('SELECT * FROM PRODUTO WHERE Categoria_ID = ? AND ID != ? LIMIT 4', [produto.Categoria_ID, produto.ID], (err3, relacionados) => {
                  res.render('product', {
                    produto,
                    avaliacoes: avaliacoes || [],
                    relacionados: relacionados || [],
                    categoriaCampos
                  });
                });
              }
            );
          });
      }
  );
};

exports.formulario = (req, res) => {
  Categoria.findAll((err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createItens', { categorias });
  });
};

// Criar produto
exports.criar = (req, res) => {
    const categoria = req.body.categoria;
    const campos = {};
    
    // Buscar campos da categoria
    db.query('SELECT campos FROM categoria WHERE ID = ?', [categoria], (err, results) => {
        if (err) return res.status(500).send('Erro ao buscar categoria');
        
        const camposCategoria = JSON.parse(results[0].campos);
        
        // Montar objeto com valores dos campos
        camposCategoria.forEach(campo => {
            const id = campo.toLowerCase().replace(/ /g, '_');
            campos[id] = req.body[id];
        });

        // Salvar no banco com os campos específicos
        const produto = {
            ...campos,
            categoria_id: categoria,
            imagem: req.file ? '/uploads/' + req.file.filename : ''
        };

        Produto.create(produto, (err) => {
            if (err) return res.status(500).send('Erro ao criar produto');
            res.redirect('/seeProduto');
        });
    });
};

// Atualizar produto
exports.atualizar = (req, res) => {
  Produto.findById(req.params.id, (err, produtoOriginal) => {
    if (err || !produtoOriginal) return res.status(404).send('Produto não encontrado');

    const {
      nome, valor, descricao, categoria, cor, tamanho, peso, cilindrada,
      potencia, tanque, material, protecao, thumbnails
    } = req.body;

    let imagem = req.body.imagemAtual || produtoOriginal.imagem || '';
    if (req.file) {
      imagem = '/uploads/' + req.file.filename;
    }

    // Corrige peso: envia null se vazio
    const pesoFinal = (peso && peso.trim() !== '') ? Number(peso) : null;

    Produto.update(req.params.id, {
      nome: nome !== undefined && nome !== '' ? nome : produtoOriginal.nome,
      valor: valor !== undefined && valor !== '' ? Number(valor) : produtoOriginal.valor,
      descricao: descricao !== undefined && descricao !== '' ? descricao : produtoOriginal.descricao,
      Categoria_ID: categoria !== undefined && categoria !== '' ? categoria : produtoOriginal.Categoria_ID,
      cor: cor !== undefined && cor !== '' ? cor : produtoOriginal.cor,
      tamanho: tamanho !== undefined && tamanho !== '' ? tamanho : produtoOriginal.tamanho,
      peso: pesoFinal !== null ? pesoFinal : produtoOriginal.peso,
      cilindrada: cilindrada !== undefined && cilindrada !== '' ? cilindrada : produtoOriginal.cilindrada,
      potencia: potencia !== undefined && potencia !== '' ? potencia : produtoOriginal.potencia,
      tanque: tanque !== undefined && tanque !== '' ? tanque : produtoOriginal.tanque,
      material: material !== undefined && material !== '' ? material : produtoOriginal.material,
      protecao: protecao !== undefined && protecao !== '' ? protecao : produtoOriginal.protecao,
      thumbnails: thumbnails !== undefined && thumbnails !== '' ? thumbnails : produtoOriginal.thumbnails,
      imagem
    }, (err, result) => {
      if (err) {
        console.log('[EDIT PRODUTO] Erro ao atualizar:', err);
        return res.status(500).send('Erro ao atualizar produto');
      }
      console.log('[EDIT PRODUTO] Produto atualizado com sucesso! Result:', result);
      res.redirect('/seeProduto');
    });
  });
};

// Remover produto
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

// Função update (caso seja usada em outro lugar)
exports.update = (id, produto, callback) => {
  // ...existing code...
  console.log('[MODEL] Atualizando produto:', id, produto);
  db.query(sql, values, (err, result) => {
    if (err) {
      console.log('[MODEL] Erro ao atualizar produto:', err);
      return callback(err);
    }
    callback(null, result);
  });
};
