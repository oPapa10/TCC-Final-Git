// routes/avaliacao.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Lista produtos elegíveis para avaliação (vendas com status 'entregue' e sem avaliação vinculada)
// e lista de produtos já avaliados pelo usuário (com dados da avaliação)
router.get('/', async (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario || !usuario.ID) {
    return res.render('avaliacoes', {
      naoAvaliados: [],
      avaliados: [],
      usuario: null,
      mensagemNaoLogado: 'Para ver e enviar avaliações, faça login em sua conta.'
    });
  }

  try {
    // produtos (a avaliar): vendas entregues do usuário que ainda não têm avaliação (venda_id)
    const naoAvaliados = await new Promise((resolve, reject) => {
      db.query(`
        SELECT v.ID AS venda_id, p.ID AS ID, p.nome, p.slug, p.imagem, p.estoque, p.Categoria_ID, v.valor_venda
        FROM VENDE v
        JOIN PRODUTO p ON v.Produto_ID = p.ID
        WHERE v.Cliente_ID = ? AND v.status = 'entregue'
          AND NOT EXISTS (SELECT 1 FROM AVALIACAO a WHERE a.venda_id = v.ID)
        ORDER BY v.hora_venda DESC
      `, [usuario.ID], (err, rows) => err ? reject(err) : resolve(rows));
    });

    // produtos já avaliados pelo usuário — traz avaliação + produto
    const avaliadosRows = await new Promise((resolve, reject) => {
      db.query(`
        SELECT a.id AS aval_id, a.produto_id, a.usuario_id, a.estrela, a.titulo, a.descricao, a.data_avaliacao, a.venda_id,
               p.ID AS produto_ID, p.nome AS produto_nome, p.slug AS produto_slug, p.imagem AS produto_imagem, p.estoque, p.Categoria_ID
        FROM AVALIACAO a
        JOIN PRODUTO p ON a.produto_id = p.ID
        WHERE a.usuario_id = ?
        ORDER BY a.data_avaliacao DESC
      `, [usuario.ID], (err, rows) => err ? reject(err) : resolve(rows));
    });

    // montar estrutura esperada pela view: [{ produto: {...}, av: {...} }, ...]
    const avaliados = avaliadosRows.map(r => ({
      produto: {
        ID: r.produto_ID,
        nome: r.produto_nome,
        slug: r.produto_slug,
        imagem: r.produto_imagem,
        estoque: r.estoque,
        Categoria_ID: r.Categoria_ID,
        categoria_nome: ''
      },
      av: {
        id: r.aval_id,
        produto_id: r.produto_id,
        usuario_id: r.usuario_id,
        estrela: r.estrela,
        titulo: r.titulo,
        descricao: r.descricao,
        data_avaliacao: r.data_avaliacao,
        venda_id: r.venda_id
      }
    }));

    // buscar categorias apenas para preencher categoria_nome se necessário
    const categoriaIds = [...new Set([
      ...naoAvaliados.map(p => p.Categoria_ID).filter(Boolean),
      ...avaliados.map(i => i.produto.Categoria_ID).filter(Boolean)
    ])];
    let categorias = {};
    if (categoriaIds.length) {
      const cats = await new Promise((resolve, reject) => {
        db.query('SELECT ID, nome FROM CATEGORIA WHERE ID IN (?)', [categoriaIds], (err, rows) => err ? reject(err) : resolve(rows));
      });
      cats.forEach(c => categorias[c.ID] = c.nome);
    }

    naoAvaliados.forEach(p => p.categoria_nome = categorias[p.Categoria_ID] || '');
    avaliados.forEach(i => i.produto.categoria_nome = categorias[i.produto.Categoria_ID] || '');

    res.render('avaliacoes', { naoAvaliados, avaliados, usuario, mensagemNaoLogado: null });
  } catch (err) {
    console.error('Erro carregar avaliações:', err);
    res.status(500).render('error', { error: err, message: 'Erro ao carregar avaliações' });
  }
});

// Enviar avaliação: usa venda_id (se disponível) e produto_id; grava avaliação e marca VENDE como 'realizada'
router.post('/enviar', async (req, res) => {
  try {
    const usuario = req.session.usuario;
    if (!usuario || !usuario.ID) return res.status(401).redirect('/login?redirect=/avaliacao');

    const produto_id = req.body.produto_id || req.body.produtoId;
    const venda_id = req.body.venda_id || null;
    const estrela = Number(req.body.estrela || req.body.nota || 5);
    const descricao = req.body.descricao || req.body.comentario || '';
    let titulo = '';
    switch (estrela) {
      case 5: titulo = 'Excelente produto'; break;
      case 4: titulo = 'Boa qualidade'; break;
      case 3: titulo = 'Produto razoável'; break;
      case 2: titulo = 'Produto regular'; break;
      default: titulo = 'Produto ruim';
    }

    // inserir avaliação
    await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO AVALIACAO (produto_id, usuario_id, estrela, titulo, descricao, venda_id, data_avaliacao) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [produto_id, usuario.ID, estrela, titulo, descricao, venda_id],
        (err, result) => err ? reject(err) : resolve(result)
      );
    });

    // se veio venda_id, marcar VENDE como realizada (muda para que ADM veja em "Vendas realizadas")
    if (venda_id) {
      await new Promise((resolve, reject) => {
        db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['realizada', venda_id], (err, r) => err ? reject(err) : resolve(r));
      });
    }

    // volta para a página de avaliações e abre a aba de avaliados
    return res.redirect('/avaliacao?msg=avaliacao_sucesso&show=avaliados');
  } catch (err) {
    console.error('Erro ao enviar avaliação:', err);
    return res.status(500).render('error', { error: err, message: 'Erro ao enviar avaliação' });
  }
});

module.exports = router;
