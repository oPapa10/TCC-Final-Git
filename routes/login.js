const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

function limitarCarrinhoPorEstoque(carrinho, produtos) {
  const estoqueMap = {};
  produtos.forEach(p => estoqueMap[p.ID] = p.estoque);

  return carrinho.map(item => {
    const estoque = estoqueMap[item.produtoId] ?? 0;
    return {
      ...item,
      quantidade: Math.min(item.quantidade, estoque)
    };
  });
}

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
    req.session.usuario = {
      ID: usuario.ID,
      nome: usuario.nome,
      cpf: usuario.cpf || usuario.CPF || usuario.Cpf || null,
      CPF: usuario.cpf || usuario.CPF || usuario.Cpf || null,
      email: usuario.email,
      telefone: usuario.telefone || null,
      genero: usuario.genero || null,
      cep: usuario.cep,
      rua: usuario.rua || usuario.endereco || null,
      endereco: usuario.endereco || null,
      numero: usuario.numero || null,
      bairro: usuario.bairro || null,
      cidade: usuario.cidade || null,
      estado: usuario.estado || null,
      complemento: usuario.complemento || null,
      avatar: usuario.avatar || null
    };

    // DEBUG: mostrar estado do carrinho em sessão antes de persistir
    const usuarioId = usuario.ID || usuario.id;
    const carrinhoSessao = Array.isArray(req.session.carrinho) ? req.session.carrinho : [];
    console.log('[LOGIN] usuarioId=', usuarioId, 'carrinhoSessao.length=', carrinhoSessao.length);

    db.query('SELECT * FROM CARRINHO WHERE usuario_id = ?', [usuarioId], (err, rows) => {
      if (err) {
        console.error('[LOGIN] erro ao buscar carrinho do banco:', err);
        // mesmo com erro, segue para perfil com carrinho de sessão (não perder fluxo)
        req.session.carrinho = carrinhoSessao;
        return res.redirect('/perfil');
      }

      const carrinhoBanco = (rows || []).map(row => ({ produtoId: row.produto_id, quantidade: row.quantidade }));
      console.log('[LOGIN] carrinhoBanco.length=', carrinhoBanco.length);

      // Se ambos têm produtos, perguntar ao usuário
      if (carrinhoSessao.length > 0 && carrinhoBanco.length > 0) {
        console.log('[LOGIN] ambos têm itens -> pedir escolha (mesclar/substituir)');
        req.session.carrinhoSessaoTemp = carrinhoSessao;
        req.session.carrinhoBancoTemp = carrinhoBanco;
        req.session.pedirEscolhaCarrinho = true;
        return res.redirect('/perfil');
      }

      // Se só a sessão tem itens, salva no banco
      if (carrinhoSessao.length > 0) {
        console.log('[LOGIN] só sessão tem itens -> salvando no banco');
        // normalize items
        const inserts = carrinhoSessao.map(item => {
          const pid = Number(item.produtoId || item.produto_id);
          const qtd = Number(item.quantidade || 1);
          if (!pid) {
            console.warn('[LOGIN] item inválido na sessão, ignorando:', item);
            return Promise.resolve({ skipped: true });
          }
          return new Promise((resolve) => {
            db.query(
              'INSERT INTO CARRINHO (usuario_id, produto_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = quantidade + ?',
              [usuarioId, pid, qtd, qtd],
              (insertErr) => {
                if (insertErr) {
                  console.error('[LOGIN] erro ao inserir item no CARRINHO:', { usuarioId, pid, qtd, err: insertErr });
                  return resolve({ ok: false, pid, err: insertErr.message });
                } else {
                  console.log('[LOGIN] item salvo no CARRINHO:', { usuarioId, pid, qtd });
                  return resolve({ ok: true, pid, qtd });
                }
              }
            );
          });
        });

        // Aguardar todas inserções antes de continuar
        Promise.all(inserts).then(results => {
          req.session.carrinho = carrinhoSessao;
          return res.redirect('/perfil');
        }).catch(err => {
          console.error('[LOGIN] erro ao salvar carrinho (Promise.all):', err);
          req.session.carrinho = carrinhoSessao;
          return res.redirect('/perfil');
        });

        return; // importante: evita continuar antes do Promise.all
      }

      // Se só o banco tem produtos
      req.session.carrinho = carrinhoBanco;
      return res.redirect('/perfil');
    });
  });
});

router.post('/mesclar-carrinho', (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) return res.redirect('/login');
  const usuarioId = usuario.ID || usuario.id;
  const acao = req.body.acao;

  if (acao === 'mesclar') {
    const carrinhoSessao = req.session.carrinhoSessaoTemp || [];
    const carrinhoBanco = req.session.carrinhoBancoTemp || [];

    // Cria mapa seguro somando quantidades (evita duplicatas)
    const mapa = new Map();
    const pushToMap = (item) => {
      const pid = Number(item.produtoId);
      const qtd = Math.max(0, Number(item.quantidade || 0));
      if (!pid || qtd <= 0) return;
      mapa.set(pid, (mapa.get(pid) || 0) + qtd);
    };
    carrinhoBanco.forEach(pushToMap);
    carrinhoSessao.forEach(pushToMap);

    let carrinhoFinal = Array.from(mapa, ([produtoId, quantidade]) => ({ produtoId, quantidade }));

    if (carrinhoFinal.length === 0) {
      // limpa temporários e volta
      delete req.session.carrinhoSessaoTemp;
      delete req.session.carrinhoBancoTemp;
      req.session.pedirEscolhaCarrinho = false;
      req.session.carrinho = [];
      return res.redirect('/perfil');
    }

    // Limita pelo estoque antes de salvar
    const ids = carrinhoFinal.map(i => Number(i.produtoId)).filter(Boolean);
    const placeholders = ids.map(() => '?').join(',');
    db.query(`SELECT ID, estoque FROM PRODUTO WHERE ID IN (${placeholders})`, ids, (err, produtos) => {
      if (err) {
        console.error('[MESCLAR] erro ao buscar estoques:', err);
        return res.redirect('/perfil');
      }

      // aplica limite de estoque
      const estoqueMap = {};
      (produtos || []).forEach(p => estoqueMap[p.ID] = p.estoque || 0);
      carrinhoFinal = carrinhoFinal.map(item => {
        const estoque = estoqueMap[item.produtoId] ?? 0;
        return { produtoId: item.produtoId, quantidade: Math.min(item.quantidade, estoque) };
      }).filter(i => i.quantidade > 0);

      if (carrinhoFinal.length === 0) {
        // nada para salvar
        delete req.session.carrinhoSessaoTemp;
        delete req.session.carrinhoBancoTemp;
        req.session.pedirEscolhaCarrinho = false;
        req.session.carrinho = [];
        return res.redirect('/perfil');
      }

      // Remove entradas antigas desses produtos e insere as novas (evita somas duplicadas)
      const prodIdsToUpdate = carrinhoFinal.map(i => i.produtoId);
      const deletePlaceholders = prodIdsToUpdate.map(() => '?').join(',');
      const deleteParams = [usuarioId, ...prodIdsToUpdate];

      db.query(`DELETE FROM CARRINHO WHERE usuario_id = ? AND produto_id IN (${deletePlaceholders})`, deleteParams, (delErr) => {
        if (delErr) {
          console.error('[MESCLAR] erro ao deletar carrinho antigo:', delErr);
          return res.redirect('/perfil');
        }

        // Monta INSERT em lote
        const insertValues = [];
        const insertPlaceholders = [];
        carrinhoFinal.forEach(item => {
          insertPlaceholders.push('(?, ?, ?)');
          insertValues.push(usuarioId, item.produtoId, item.quantidade);
        });

        const insertSql = `INSERT INTO CARRINHO (usuario_id, produto_id, quantidade) VALUES ${insertPlaceholders.join(',')}`;
        db.query(insertSql, insertValues, (insErr) => {
          if (insErr) {
            console.error('[MESCLAR] erro ao inserir carrinho final:', insErr);
            // mesmo com erro, atualiza sessão local para UX
            req.session.carrinho = carrinhoFinal;
            delete req.session.carrinhoSessaoTemp;
            delete req.session.carrinhoBancoTemp;
            req.session.pedirEscolhaCarrinho = false;
            return res.redirect('/perfil');
          }

          // Atualiza sessão e limpa temporários
          req.session.carrinho = carrinhoFinal;
          delete req.session.carrinhoSessaoTemp;
          delete req.session.carrinhoBancoTemp;
          req.session.pedirEscolhaCarrinho = false;
          console.log('[MESCLAR] carrinho mesclado salvo:', carrinhoFinal);
          return res.redirect('/perfil');
        });
      });
    });
  } else {
    // Substituir: usa só o do banco
    const carrinhoFinal = req.session.carrinhoBancoTemp || [];
    req.session.carrinho = carrinhoFinal;
    delete req.session.carrinhoSessaoTemp;
    delete req.session.carrinhoBancoTemp;
    req.session.pedirEscolhaCarrinho = false;
    return res.redirect('/perfil');
  }
});

router.get('/carrinho', (req, res) => {
  const carrinhoCompleto = req.session.carrinho || [];
  const produtosArray = carrinhoCompleto.map(item => item.produtoId);

  db.query(
    `SELECT ID, estoque FROM PRODUTO WHERE ID IN (${produtosArray.join(',')})`,
    (err, produtos) => {
      if (err) {
        return res.status(500).send('Erro ao buscar produtos');
      }

      const carrinhoLimitado = limitarCarrinhoPorEstoque(carrinhoCompleto, produtos);
      res.render('carrinho', { carrinho: carrinhoLimitado });
    }
  );
});

module.exports = router;