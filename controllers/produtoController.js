const Produto = require('../models/produtoModel');
const { gerarSlug } = require('../models/produtoModel');
const Categoria = require('../models/Categoria');

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
  const {
    nome, valor, descricao, categoria, estoque, quantidade, cor, tamanho, peso, cilindrada,
    potencia, tanque, material, protecao, thumbnails
  } = req.body;

  let imagem = req.body.imagemAtual || '';
  if (req.file) {
    imagem = '/uploads/' + req.file.filename;
  }

  Produto.update(req.params.id, {
    nome: nome || '',
    valor: valor ? Number(valor) : 0,
    descricao: descricao || '',
    Categoria_ID: categoria,
    estoque: typeof estoque !== 'undefined' ? Number(estoque) : (typeof quantidade !== 'undefined' ? Number(quantidade) : 0),
    cor: cor || '',
    tamanho: tamanho || '',
    peso: peso ? Number(peso) : 0,
    cilindrada: cilindrada || '',
    potencia: potencia || '',
    tanque: tanque || '',
    material: material || '',
    protecao: protecao || '',
    imagem,
    thumbnails: thumbnails || ''
  }, (err) => {
    if (err) return res.status(500).send('Erro ao atualizar produto');
    res.redirect('/seeProduto');
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
  Produto.findBySlug(req.params.slug, (err, produto) => {
    if (err || !produto) return res.status(404).send('Produto não encontrado');
    res.render('product', { produto });
  });
};
