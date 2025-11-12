const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const db = require('../config/db');

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ ROTA GET - RENDERIZAR FORMULÁRIO DE EDIÇÃO
router.get('/editar/:id', (req, res) => {
  const id = req.params.id;
  
  // Busca produto
  db.query('SELECT * FROM Produto WHERE ID = ?', [id], (err, produtosRows) => {
    if (err || !produtosRows || produtosRows.length === 0) {
      return res.status(404).render('error', { message: 'Produto não encontrado' });
    }

    const produto = produtosRows[0];

    // Busca categorias
    db.query('SELECT * FROM Categoria', (errCat, categorias) => {
      if (errCat) categorias = [];

      // Busca campos da categoria do produto
      db.query('SELECT campos FROM Categoria WHERE ID = ?', [produto.Categoria_ID], (errCampos, rowsCampos) => {
        let categoriaCampos = [];
        if (!errCampos && rowsCampos && rowsCampos[0] && rowsCampos[0].campos) {
          try {
            const arr = JSON.parse(rowsCampos[0].campos);
            categoriaCampos = Array.isArray(arr) ? arr : [];
          } catch (e) {
            categoriaCampos = [];
          }
        }

        res.render('editProduto', {
          produto,
          categorias,
          categoriaCampos
        });
      });
    });
  });
});

// === NOVA/ATUAL ROTA: salvar edição do produto ===
router.post('/editar/:id', upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'thumbnailUpload', maxCount: 10 }
]), (req, res) => {
  const id = Number(req.params.id);
  console.log('[PROD-EDIT] POST recebido — id=', id, 'bodyKeys=', Object.keys(req.body||{}), 'filesKeys=', Object.keys(req.files || {}));

  try {
    const body = req.body || {};
    const nome = body.nome;
    const valor = body.valor;
    const descricao = body.descricao;
    const categoria = body.categoria || body.Categoria_ID || body.categoria_id;
    const imagemAtual = body.imagemAtual || body.imagem || '';
    const imagemLink = body.imagemLink || '';

    // imagem final (upload > link > atual)
    let imagemFinal = imagemAtual || '';
    if (req.files && req.files.imagem && req.files.imagem[0]) {
      imagemFinal = '/uploads/' + req.files.imagem[0].filename;
    } else if (imagemLink && imagemLink.trim()) {
      imagemFinal = imagemLink.trim();
    }

    // thumbnails: existentes + uploads + links
    let thumbsFinal = [];
    if (body.existingThumbnails) {
      const existing = Array.isArray(body.existingThumbnails) ? body.existingThumbnails : [body.existingThumbnails];
      thumbsFinal.push(...existing.filter(t => t && t.trim()));
    }
    if (req.files && req.files.thumbnailUpload && req.files.thumbnailUpload.length) {
      req.files.thumbnailUpload.forEach(f => thumbsFinal.push('/uploads/' + f.filename));
    }
    if (body.thumbnailLinks) {
      const links = String(body.thumbnailLinks).split(',').map(s => s.trim()).filter(Boolean);
      thumbsFinal.push(...links);
    }

    // COLETA as especificações DINÂMICAS e guarda num único campo JSON
    const padrao = ['nome','valor','descricao','categoria','Categoria_ID','imagem','imagemAtual','imagemLink','existingThumbnails','thumbnailLinks','thumbnailUpload','_method','id'];
    const especificacoesObj = {};
    Object.entries(body).forEach(([k, v]) => {
      if (!padrao.includes(k) && v !== undefined && v !== null && String(v).trim() !== '') {
        especificacoesObj[k] = String(v).trim();
      }
    });

    // Prepara objeto de atualização: grava as especificações em "especificacoes_raw"
    const produtoAtualizado = {
      ...(nome !== undefined ? { nome } : {}),
      ...(valor !== undefined && valor !== '' ? { valor: Number(valor) } : {}),
      ...(descricao !== undefined ? { descricao } : {}),
      ...(categoria ? { Categoria_ID: Number(categoria) } : {}),
      ...(imagemFinal ? { imagem: imagemFinal } : {}),
      ...(thumbsFinal.length ? { thumbnails: JSON.stringify(thumbsFinal) } : {}),
    };

    // se houver especificações, salva como JSON no campo especificacoes_raw (ou altere para 'especificacoes' se for esse)
    if (Object.keys(especificacoesObj).length > 0) {
      produtoAtualizado.especificacoes_raw = JSON.stringify(especificacoesObj);
    }

    // Remove chaves vazias
    Object.keys(produtoAtualizado).forEach(k => {
      if (produtoAtualizado[k] === undefined || produtoAtualizado[k] === null || produtoAtualizado[k] === '') delete produtoAtualizado[k];
    });

    console.log('[PROD-EDIT] dados a gravar:', produtoAtualizado);

    // Usa o método do model (Produto.update) para gravar
    Produto.update(id, produtoAtualizado, (err, result) => {
      if (err) {
        console.error('[PROD-EDIT] erro update:', err);
        return res.status(500).render('error', { message: 'Erro ao salvar produto', error: err });
      }
      console.log('[PROD-EDIT] update OK id=', id);
      return res.redirect('/seeProduto');
    });
  } catch (err) {
    console.error('[PROD-EDIT] exceção:', err);
    return res.status(500).send('Erro interno');
  }
});

module.exports = router;