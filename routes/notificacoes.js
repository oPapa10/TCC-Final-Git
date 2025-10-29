const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ajuste conforme seu arquivo de conexão

// helper upsert para notificações (novo)
async function upsertNotification(clienteId, vendaId, titulo, mensagem, status) {
  return new Promise((resolve, reject) => {
    db.query('SELECT id FROM notificacoes WHERE venda_id = ? LIMIT 1', [vendaId], (err, rows) => {
      if (err) return reject(err);
      if (rows && rows.length) {
        db.query(
          'UPDATE notificacoes SET cliente_id = ?, titulo = ?, mensagem = ?, status = ?, lida = 0, created_at = NOW() WHERE id = ?',
          [clienteId, titulo, mensagem, status, rows[0].id],
          (e, r) => e ? reject(e) : resolve(r)
        );
      } else {
        db.query(
          'INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
          [clienteId, titulo, mensagem, status, vendaId],
          (e, r) => e ? reject(e) : resolve(r)
        );
      }
    });
  });
}

// helper upsert (mesma lógica para manter consistência)
function upsertNotificationSimple(clienteId, vendaId, titulo, mensagem, status) {
  return new Promise((resolve, reject) => {
    db.query('SELECT id FROM notificacoes WHERE venda_id = ? LIMIT 1', [vendaId], (err, rows) => {
      if (err) return reject(err);
      if (rows && rows.length) {
        db.query('UPDATE notificacoes SET cliente_id=?, titulo=?, mensagem=?, status=?, lida=0, created_at=NOW() WHERE id=?',
          [clienteId, titulo, mensagem, status, rows[0].id], (e,r) => e?reject(e):resolve(r));
      } else {
        db.query('INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
          [clienteId, titulo, mensagem, status, vendaId], (e,r) => e?reject(e):resolve(r));
      }
    });
  });
}

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
    const rows = await new Promise((resolve, reject) => {
      db.query('SELECT ID, Cliente_ID, Produto_ID FROM VENDE WHERE ID = ? AND Cliente_ID = ?', [vendaId, usuario.ID], (err, r) => err ? reject(err) : resolve(r));
    });
    if (!rows || rows.length === 0) return res.status(404).send('Venda não encontrada');

    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['entregue', vendaId], (e,r)=> e?reject(e):resolve(r)));

    // atualiza/insere notificação (upsert) para essa venda
    await upsertNotificationSimple(usuario.ID, vendaId, 'Produto entregue', 'Produto recebido com sucesso. Obrigado pela compra!', 'entregue');

    // voltar para a lista de notificações (não ir direto para /avaliacao)
    return res.redirect('/notificacoes');
  } catch (err) {
    console.error('Erro confirmar entrega:', err);
    return res.status(500).send('Erro interno');
  }
});

router.post('/:id/pronto', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['pronto', id], (e,r)=> e?reject(e):resolve(r)));
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido pronto para envio';
      const mensagem = `Seu pedido (${venda.produto_nome}) está pronto para envio. Em breve será despachado.`;
      await upsertNotification(venda.Cliente_ID, venda.venda_id, titulo, mensagem, 'pronto');
    }
    return res.redirect(req.get('referer') || '/adm/vendas');
  } catch (err) {
    console.error('Erro marcar pronto:', err);
    return res.status(500).send('Erro ao marcar pronto');
  }
});

router.post('/:id/caminho', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['a_caminho', id], (e,r)=> e?reject(e):resolve(r)));
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido a caminho';
      const mensagem = `Seu pedido (${venda.produto_nome}) está a caminho. Ao receber, confirme a entrega no app para avaliá-lo.`;
      await upsertNotification(venda.Cliente_ID, venda.venda_id, titulo, mensagem, 'a_caminho');
    }
    return res.redirect(req.get('referer') || '/adm/vendas');
  } catch (err) {
    console.error('Erro marcar a caminho:', err);
    return res.status(500).send('Erro ao marcar a caminho');
  }
});

/*
  Rota para remover apenas a NOTIFICAÇÃO.
  Verifica que o usuário está logado e é o dono da notificação antes de remover.
*/
router.post('/notificacoes/remover', async (req, res) => {
  const usuario = req.session.usuario;
  const notificacaoId = Number(req.body.notificacaoId || req.body.id || 0);

  if (!usuario || !usuario.ID) {
    return res.status(401).redirect('/login?redirect=/notificacoes');
  }
  if (!notificacaoId) {
    return res.status(400).send('Notificação inválida');
  }

  try {
    const result = await new Promise((resolve, reject) => {
      db.query('DELETE FROM notificacoes WHERE id = ? AND cliente_id = ?', [notificacaoId, usuario.ID], (err, r) => {
        if (err) return reject(err);
        resolve(r);
      });
    });

    if (result && result.affectedRows) {
      // removido com sucesso
      return res.redirect('/notificacoes');
    } else {
      // não encontrou ou não pertence ao usuário
      return res.status(404).send('Notificação não encontrada ou sem permissão');
    }
  } catch (err) {
    console.error('Erro ao remover notificação:', err);
    return res.status(500).send('Erro interno');
  }
});

module.exports = router;