const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

router.post('/', (req, res) => {
  const { email, senha } = req.body;
  db.query('SELECT * FROM Cliente WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.render('perfil', { mensagem: 'E-mail ou senha incorretos.', usuario: null });
    }
    const usuario = results[0];
    const match = await bcrypt.compare(senha, usuario.senha);
    if (!match) {
      return res.render('perfil', { mensagem: 'E-mail ou senha incorretos.', usuario: null });
    }
    req.session.usuario = usuario;

    // Após autenticar o usuário:
    const usuarioId = usuario.ID || usuario.id;
    const carrinhoSessao = req.session.carrinho || [];

    db.query('SELECT * FROM CARRINHO WHERE usuario_id = ?', [usuarioId], (err, rows) => {
      const carrinhoBanco = rows.map(row => ({
        produtoId: row.produto_id,
        quantidade: row.quantidade
      }));

      // Se ambos têm produtos, perguntar ao usuário
      if (carrinhoSessao.length > 0 && carrinhoBanco.length > 0) {
        req.session.carrinhoSessaoTemp = carrinhoSessao;
        req.session.carrinhoBancoTemp = carrinhoBanco;
        req.session.pedirEscolhaCarrinho = true; // <-- sinaliza para mostrar o modal
        return res.redirect('/perfil');
      }

      // Se só um tem produtos, usa ele
      if (carrinhoSessao.length > 0) {
        // Salva o carrinho da sessão no banco
        carrinhoSessao.forEach(item => {
          db.query(
            'INSERT INTO CARRINHO (usuario_id, produto_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + ?',
            [usuarioId, item.produtoId, item.quantidade, item.quantidade]
          );
        });
        req.session.carrinho = carrinhoSessao;
        return res.redirect('/perfil');
      }

      // Se só o banco tem produtos
      req.session.carrinho = carrinhoBanco;
      return res.redirect('/perfil');
    });
  });
});

router.post('/mesclar-carrinho', (req, res) => {
  const usuario = req.session.usuario;
  const usuarioId = usuario.ID || usuario.id;
  const acao = req.body.acao;
  let carrinhoFinal = [];

  if (acao === 'mesclar') {
    // Mescla os carrinhos
    const carrinhoSessao = req.session.carrinhoSessaoTemp || [];
    const carrinhoBanco = req.session.carrinhoBancoTemp || [];
    const mapa = new Map();

    carrinhoBanco.forEach(item => mapa.set(item.produtoId, item.quantidade));
    carrinhoSessao.forEach(item => {
      if (mapa.has(item.produtoId)) {
        mapa.set(item.produtoId, mapa.get(item.produtoId) + item.quantidade);
      } else {
        mapa.set(item.produtoId, item.quantidade);
      }
    });

    carrinhoFinal = Array.from(mapa, ([produtoId, quantidade]) => ({ produtoId, quantidade }));

    // Salva no banco
    carrinhoFinal.forEach(item => {
      db.query(
        'INSERT INTO CARRINHO (usuario_id, produto_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = ?',
        [usuarioId, item.produtoId, item.quantidade, item.quantidade]
      );
    });
  } else {
    // Substituir: usa só o do banco
    carrinhoFinal = req.session.carrinhoBancoTemp || [];
  }

  req.session.carrinho = carrinhoFinal;
  // Limpa temporários
  delete req.session.carrinhoSessaoTemp;
  delete req.session.carrinhoBancoTemp;

  res.redirect('/perfil');
});

module.exports = router;