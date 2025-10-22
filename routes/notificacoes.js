const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/notificacoes', (req, res) => {
  const usuario = req.session.usuario;
  // Se não estiver logado, renderiza a página com mensagem (igual ao /avaliacao)
  if (!usuario || !usuario.ID) {
    return res.render('notificacoes', {
      notificacoes: [],
      usuario: null,
      mensagemNaoLogado: 'Para ver suas notificações e atualizações de pedidos, faça login em sua conta.'
    });
  }

  db.query(
    `SELECT n.id, n.titulo, n.mensagem, n.status, n.lida, n.created_at,
            v.ID AS venda_id, v.valor_venda, p.ID AS produto_id, p.nome AS produto_nome, p.imagem AS produto_imagem
     FROM notificacoes n
     LEFT JOIN VENDE v ON n.venda_id = v.ID
     LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID
     WHERE n.cliente_id = ?
     ORDER BY n.created_at DESC
     LIMIT 200`, [usuario.ID], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar notificações:', err);
      return res.status(500).render('error', { error: err, message: 'Erro ao carregar notificações' });
    }
    console.log('[notificacoes] rows:', rows.slice(0,5));
    res.render('notificacoes', { notificacoes: rows, usuario: usuario });
  });
});

router.post('/notificacoes/confirmar-entrega', async (req, res) => {
  const usuario = req.session.usuario;
  const { vendaId } = req.body;
  if (!usuario || !usuario.ID) return res.status(401).redirect('/login?redirect=/notificacoes');

  try {
    // confirmar apenas se a venda pertence ao usuário
    const rows = await new Promise((resolve, reject) => {
      db.query('SELECT ID, Cliente_ID, Produto_ID FROM VENDE WHERE ID = ? AND Cliente_ID = ?', [vendaId, usuario.ID], (err, r) => err ? reject(err) : resolve(r));
    });
    if (!rows || rows.length === 0) return res.status(404).send('Venda não encontrada');

    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['entregue', vendaId], (e,r)=> e?reject(e):resolve(r)));

    // gravar notificação de entrega para o usuário
    db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
      [usuario.ID, 'Produto entregue', 'Produto recebido com sucesso. Você pode avaliar o produto agora.', 'entregue', vendaId],
      (err) => { if (err) console.error(err); });

    // redireciona para avaliações para que o usuário possa avaliar
    return res.redirect('/avaliacao');
  } catch (err) {
    console.error('Erro confirmar entrega:', err);
    return res.status(500).send('Erro interno');
  }
});

module.exports = router;