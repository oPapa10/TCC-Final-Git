const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ajuste conforme seu arquivo de conexão

// ✅ FUNÇÃO MELHORADA: Remove TODAS as notificações antigas dessa venda antes de inserir a nova
async function upsertNotification(clienteId, vendaId, titulo, mensagem, status) {
  return new Promise((resolve, reject) => {
    // Primeiro, REMOVE TODAS as notificações dessa venda (independente do status)
    db.query('DELETE FROM notificacoes WHERE venda_id = ?', [vendaId], (delErr) => {
      if (delErr) console.warn('[NOTIF] erro ao limpar antigas:', delErr);
      
      // Depois, INSERE a nova notificação com o novo status
      db.query(
        'INSERT INTO notificacoes (cliente_id, titulo, mensagem, status, venda_id) VALUES (?, ?, ?, ?, ?)',
        [clienteId, titulo, mensagem, status, vendaId],
        (err, result) => {
          if (err) return reject(err);
          console.log('[NOTIF] notificação criada com ID:', result.insertId, 'venda:', vendaId, 'status:', status);
          resolve(result);
        }
      );
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
            v.ID AS venda_id, v.valor_venda, v.Produto_ID,
            p.ID AS produto_id, p.nome AS produto_nome, p.imagem AS produto_imagem
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
    
    // ✅ PROCESSA IMAGENS PARA GARANTIR URLs CORRETAS
    const notificacoesProcessadas = rows.map(row => {
      let imagemFinal = row.produto_imagem || null;
      
      if (imagemFinal) {
        // Se for URL externa (começa com http), mantém como está
        if (!/^https?:\/\//i.test(imagemFinal)) {
          // Se for caminho relativo, adiciona /uploads/ se necessário
          const clean = String(imagemFinal).split('?')[0];
          const filename = require('path').basename(clean);
          imagemFinal = `/uploads/${filename}`;
        }
      }
      
      return {
        ...row,
        produto_imagem: imagemFinal
      };
    });
    
    console.log('[notificacoes] rows processadas:', notificacoesProcessadas.slice(0, 2));
    res.render('notificacoes', { notificacoes: notificacoesProcessadas, usuario: usuario });
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
      // ✅ Remove a notificação anterior e cria uma nova
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
      // ✅ Remove a notificação anterior e cria uma nova
      await upsertNotification(venda.Cliente_ID, venda.venda_id, titulo, mensagem, 'a_caminho');
    }
    return res.redirect(req.get('referer') || '/adm/vendas');
  } catch (err) {
    console.error('Erro marcar a caminho:', err);
    return res.status(500).send('Erro ao marcar a caminho');
  }
});

router.post('/:id/entregue', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await new Promise((resolve, reject) => db.query('UPDATE VENDE SET status = ? WHERE ID = ?', ['entregue', id], (e,r)=> e?reject(e):resolve(r)));
    const rows = await new Promise((resolve, reject) => {
      db.query(`SELECT v.Cliente_ID, v.ID AS venda_id, p.nome AS produto_nome, v.valor_venda
                FROM VENDE v LEFT JOIN PRODUTO p ON v.Produto_ID = p.ID WHERE v.ID = ?`, [id],
                (err, r) => err ? reject(err) : resolve(r));
    });
    if (rows && rows[0]) {
      const venda = rows[0];
      const titulo = 'Pedido entregue';
      const mensagem = `Seu pedido (${venda.produto_nome}) foi entregue. Obrigado por comprar conosco!`;
      // ✅ Remove a notificação anterior e cria uma nova
      await upsertNotification(venda.Cliente_ID, venda.venda_id, titulo, mensagem, 'entregue');
    }
    return res.redirect(req.get('referer') || '/adm/vendas');
  } catch (err) {
    console.error('Erro marcar entregue:', err);
    return res.status(500).send('Erro ao marcar entregue');
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

/*
  Rota para CANCELAR pedido (apenas para pendente).
  Remove a notificação E a venda associada.
*/
router.post('/notificacoes/cancelar-pedido', async (req, res) => {
  const usuario = req.session.usuario;
  const vendaId = Number(req.body.vendaId || 0);

  if (!usuario || !usuario.ID) {
    return res.status(401).redirect('/login?redirect=/notificacoes');
  }
  if (!vendaId) {
    return res.status(400).send('Venda inválida');
  }

  try {
    // Verifica se a venda pertence ao usuário e está em pendente
    const vendaRows = await new Promise((resolve, reject) => {
      db.query('SELECT ID, Cliente_ID, status FROM VENDE WHERE ID = ? AND Cliente_ID = ?', [vendaId, usuario.ID], (err, r) => err ? reject(err) : resolve(r));
    });

    if (!vendaRows || vendaRows.length === 0) {
      return res.status(404).send('Venda não encontrada');
    }

    const venda = vendaRows[0];

    // Só permite cancelar se estiver em pendente
    if (venda.status !== 'pendente') {
      return res.status(400).send('Só é possível cancelar pedidos em pendente');
    }

    // Remove a notificação
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM notificacoes WHERE venda_id = ? AND cliente_id = ?', [vendaId, usuario.ID], (err, r) => err ? reject(err) : resolve(r));
    });

    // Remove a venda
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM VENDE WHERE ID = ? AND Cliente_ID = ?', [vendaId, usuario.ID], (err, r) => err ? reject(err) : resolve(r));
    });

    console.log('[CANCELAR-PEDIDO] Venda/Notificação cancelada:', vendaId);

    return res.redirect('/notificacoes');
  } catch (err) {
    console.error('Erro ao cancelar pedido:', err);
    return res.status(500).send('Erro interno');
  }
});

module.exports = router;