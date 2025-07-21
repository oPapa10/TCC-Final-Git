const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const path = require('path');
const fs = require('fs');

function gerarSlug(nome) {
  return nome
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove caracteres especiais
    .replace(/\s+/g, '-')     // troca espaços por hífen
    .replace(/-+/g, '-');     // evita múltiplos hífens
}

// Listar todos os produtos
exports.listar = (req, res) => {
  Produto.findAll((err, produtos) => {
    if (err) return res.status(500).send('Erro ao buscar produtos');
    res.render('index', { produtos });
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

  // Cria o produto já com o slug correto
  Produto.create({
    nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
    estoque, material, protecao, imagem, thumbnails, categoria,
    slug: gerarSlug(nome)
  }, (err, result) => {
    if (err) return res.status(500).send('Erro ao criar produto');
    res.redirect('/seeProduto');
  });
};

// Atualizar produto
exports.atualizar = (req, res) => {
  Produto.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send('Erro ao atualizar produto');
    res.redirect('/');
  });
};

// Remover produto
exports.remover = (req, res) => {
  Produto.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send('Erro ao remover produto');
    res.redirect('/');
  });
};

exports.detalharPorSlug = (req, res) => {
  Produto.findBySlug(req.params.slug, (err, produto) => {
    if (err || !produto) return res.status(404).send('Produto não encontrado');
    res.render('product', { produto });
  });
};