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
  Produto.findById(req.params.id, (err, produto) => {
    if (err || !produto) return res.status(404).send('Produto não encontrado');
    res.render('product', { produto });
  });
};

exports.formulario = (req, res) => {
  Categoria.findAll((err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createItens', { categorias });
  });
};

// Criar produto
exports.criar = (req, res) => {
  const {
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, thumbnails, categoria
  } = req.body;

  let imagem = '';
  if (req.file) {
    imagem = '/uploads/' + req.file.filename;
  }

  // Se vier do form, use o valor, senão, defina como zero
  const estoqueFinal = typeof estoque !== 'undefined' ? Number(estoque) : 0;

  const slug = gerarSlug(nome || 'produto');

  Produto.create({
    nome: nome || '',
    cor: cor || '',
    tamanho: tamanho || '',
    peso: peso ? Number(peso) : 0,
    valor: valor ? Number(valor) : 0,
    cilindrada: cilindrada || '',
    descricao: descricao || '',
    potencia: potencia || '',
    tanque: tanque || '',
    estoque: estoqueFinal,
    material: material || '',
    protecao: protecao || '',
    imagem: imagem || '',
    thumbnails: thumbnails || '',
    Categoria_ID: categoria,
    slug
  }, (err) => {
    if (err) return res.status(500).send('Erro ao criar produto: ' + (err.sqlMessage || err.message));
    res.redirect('/seeProduto');
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

    // LOG: Dados recebidos do form
    console.log('[EDIT PRODUTO] Dados recebidos:', req.body);

    Produto.update(req.params.id, {
      nome: nome !== undefined && nome !== '' ? nome : produtoOriginal.nome,
      valor: valor !== undefined && valor !== '' ? Number(valor) : produtoOriginal.valor,
      descricao: descricao !== undefined && descricao !== '' ? descricao : produtoOriginal.descricao,
      Categoria_ID: categoria !== undefined && categoria !== '' ? categoria : produtoOriginal.Categoria_ID,
      cor: cor !== undefined && cor !== '' ? cor : produtoOriginal.cor,
      tamanho: tamanho !== undefined && tamanho !== '' ? tamanho : produtoOriginal.tamanho,
      peso: peso !== undefined && peso !== '' ? Number(peso) : produtoOriginal.peso,
      cilindrada: cilindrada !== undefined && cilindrada !== '' ? cilindrada : produtoOriginal.cilindrada,
      potencia: potencia !== undefined && potencia !== '' ? potencia : produtoOriginal.potencia,
      tanque: tanque !== undefined && tanque !== '' ? tanque : produtoOriginal.tanque,
      material: material !== undefined && material !== '' ? material : produtoOriginal.material,
      protecao: protecao !== undefined && protecao !== '' ? protecao : produtoOriginal.protecao,
      thumbnails: thumbnails !== undefined && thumbnails !== '' ? thumbnails : produtoOriginal.thumbnails,
      imagem
    }, (err) => {
      // LOG: Resultado do update
      if (err) {
        console.log('[EDIT PRODUTO] Erro ao atualizar:', err);
        return res.status(500).send('Erro ao atualizar produto');
      }
      console.log('[EDIT PRODUTO] Produto atualizado com sucesso!');
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
              return res.render('product', { produto: null });
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
          res.render('product', { produto });
      }
  );
};

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
