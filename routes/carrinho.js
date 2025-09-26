const express = require('express');
const path = require('path');
const db = require('../config/db');
const router = express.Router();

// Função para limitar a quantidade no carrinho de acordo com o estoque
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

// Rota para exibir o carrinho
router.get('/', (req, res) => {
  let carrinho = req.session.carrinho || [];
  if (carrinho.length === 0) {
    return res.render('carrinho', { carrinho: [] });
  }

  const ids = carrinho.map(item => Number(item.produtoId));
  const placeholders = ids.map(() => '?').join(',');
  const sql = `
    SELECT p.*, pr.valor_promocional 
    FROM Produto p
    LEFT JOIN Promocao pr ON pr.produto_id = p.ID
    WHERE p.ID IN (${placeholders})
  `;

  db.query(sql, ids, (err, produtos) => {
    if (err) {
      console.error('Erro ao buscar produtos do carrinho:', err);
      return res.status(500).send('Erro ao buscar produtos');
    }

    const produtosArray = Array.isArray(produtos) ? produtos : [produtos];

    // Monta o carrinho completo e verifica estoque e promoção
    const carrinhoCompleto = carrinho.map(item => {
      const produto = produtosArray.find(p => p.ID == item.produtoId);
      const valorPromocionalAtual = produto && produto.valor_promocional ? Number(produto.valor_promocional) : null;
      const valorOriginal = produto && produto.valor ? Number(produto.valor) : 0;
      const estoque = produto ? produto.estoque : 0;
      let semEstoque = estoque <= 0;

      // Detecta mudança de promoção
      let mudancaPromocao = false;
      // Se o valor anterior era promocional e agora não é, ou mudou o valor promocional
      if (
        item.valorPromocional !== undefined &&
        ((item.valorPromocional !== null && valorPromocionalAtual === null) ||
         (item.valorPromocional !== null && valorPromocionalAtual !== null && item.valorPromocional !== valorPromocionalAtual))
      ) {
        mudancaPromocao = true;
        console.log(`[PROMOÇÃO] Produto ${item.produtoId} perdeu ou mudou promoção!`);
      } else {
        console.log(`[PROMOÇÃO] Produto ${item.produtoId} - anterior: ${item.valorPromocional}, atual: ${valorPromocionalAtual}, mudancaPromocao: ${mudancaPromocao}`);
      }

      // Atualiza o valor anterior para o próximo GET
      item.valorPromocional = valorPromocionalAtual;

      return {
        ...item,
        nome: produto ? produto.nome : 'Produto removido',
        imagem: produto ? produto.imagem : '',
        preco: valorPromocionalAtual || valorOriginal,
        valorOriginal,
        valorPromocional: valorPromocionalAtual,
        estoque,
        oculto: item.oculto || semEstoque,
        semEstoque,
        mudancaPromocao
      };
    });

    carrinhoCompleto.sort((a, b) => a.produtoId - b.produtoId);
    res.render('carrinho', { carrinho: carrinhoCompleto });
  });
});

// Rota para adicionar item ao carrinho
router.post('/adicionar', (req, res) => {
    console.log('--- INÍCIO /carrinho/adicionar ---');
    console.log('req.body:', req.body);

    const { produtoId, quantidade } = req.body;

    if (!produtoId || !quantidade) {
        console.log('FALHA: produtoId ou quantidade ausentes ou inválidos');
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({ success: false, message: 'ID do produto ou quantidade inválidos.' });
        }
        return res.status(400).send('ID do produto ou quantidade inválidos.');
    }

    db.query(
        `SELECT p.*, pr.valor_promocional 
         FROM Produto p 
         LEFT JOIN Promocao pr ON pr.produto_id = p.ID 
         WHERE p.ID = ?`, 
        [produtoId], 
        (err, results) => {
            console.log('Resultado do SELECT produto:', results);
            if (err || results.length === 0) {
                console.log('FALHA: Produto não encontrado');
                return res.status(400).send('Produto não encontrado');
            }
            const produto = results[0];
            const preco = produto.valor_promocional || produto.valor;
            const estoque = produto.estoque ?? 0;
            const valorPromocionalAtual = produto.valor_promocional ? Number(produto.valor_promocional) : null;

            if (!req.session.carrinho) req.session.carrinho = [];
            const idx = req.session.carrinho.findIndex(item => item.produtoId == produtoId);
            const quantidadeAtual = idx >= 0 ? req.session.carrinho[idx].quantidade : 0;
            let quantidadeTotal = quantidadeAtual + Number(quantidade);

            if (quantidadeTotal > estoque) quantidadeTotal = estoque;

            if (idx >= 0) {
                req.session.carrinho[idx].quantidade = quantidadeTotal;
                req.session.carrinho[idx].valorPromocional = valorPromocionalAtual;
            } else {
                req.session.carrinho.push({
                    produtoId: produto.ID,
                    nome: produto.nome,
                    preco: preco,
                    imagem: produto.imagem,
                    quantidade: Math.min(Number(quantidade), estoque),
                    valorPromocional: valorPromocionalAtual
                });
            }

            if (req.session.usuario) {
                db.query(
                    'INSERT INTO CARRINHO (usuario_id, produto_id, quantidade) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantidade = ?',
                    [req.session.usuario.ID, produto.ID, Math.min(Number(quantidade), estoque), quantidadeTotal]
                );
            }

            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                console.log('SUCESSO: Produto adicionado ao carrinho');
                return res.json({ success: true, quantidade: quantidadeTotal, estoque });
            }
            res.redirect('/carrinho');
        }
    );
});

// Rota para remover item do carrinho
router.post('/remover', (req, res) => {
  const { produtoId } = req.body;
  if (req.session.carrinho) {
    req.session.carrinho = req.session.carrinho.filter(item => item.produtoId != produtoId);
  }
  if (req.session.usuario) {
    db.query(
      'DELETE FROM CARRINHO WHERE usuario_id = ? AND produto_id = ?',
      [req.session.usuario.ID, produtoId],
      (err) => {
        res.redirect('/carrinho');
      }
    );
  } else {
    res.redirect('/carrinho');
  }
});

// Rota para contar itens no carrinho
router.get('/contador', (req, res) => {
  const carrinho = req.session.carrinho || [];
  const total = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  res.json({ total });
});

// Rota para alterar a quantidade de um item no carrinho
router.post('/alterar', (req, res) => {
    const { produtoId, acao } = req.body;
    if (!produtoId || !acao) return res.redirect('/carrinho');

    db.query('SELECT estoque FROM Produto WHERE ID = ?', [produtoId], (err, results) => {
        if (err || !results[0]) return res.redirect('/carrinho');
        const estoque = results[0].estoque ?? 0;

        if (!req.session.carrinho) req.session.carrinho = [];
        const idx = req.session.carrinho.findIndex(item => item.produtoId == produtoId);
        if (idx < 0) return res.redirect('/carrinho');

        let quantidade = req.session.carrinho[idx].quantidade;
        if (acao === 'aumentar' && quantidade < estoque) {
            quantidade += 1;
        } else if (acao === 'diminuir' && quantidade > 1) {
            quantidade -= 1;
        }
        req.session.carrinho[idx].quantidade = quantidade;

        if (req.session.usuario) {
            db.query(
                'UPDATE CARRINHO SET quantidade = ? WHERE usuario_id = ? AND produto_id = ?',
                [quantidade, req.session.usuario.ID, produtoId]
            );
        }
        res.redirect('/carrinho');
    });
});

// Ocultar item
router.post('/ocultar', (req, res) => {
  const { produtoId } = req.body;
  if (req.session.carrinho) {
    req.session.carrinho = req.session.carrinho.map(item =>
      item.produtoId == produtoId ? { ...item, oculto: true } : item
    );
  }
  res.json({ success: true });
});

// Mostrar item novamente
router.post('/mostrar', (req, res) => {
  const { produtoId } = req.body;
  if (req.session.carrinho) {
    req.session.carrinho = req.session.carrinho.map(item =>
      item.produtoId == produtoId ? { ...item, oculto: false } : item
    );
  }
  res.json({ success: true });
});

router.post('/pedido/finalizar', (req, res) => {
    let carrinho = req.session.carrinho || [];
    // Filtra apenas os itens ativos (não ocultos)
    const ativos = carrinho.filter(item => !item.oculto);

    if (ativos.length === 0) {
        return res.redirect('/carrinho');
    }

    // Para cada item ativo, diminui o estoque
    const promises = ativos.map(item => {
        return new Promise((resolve, reject) => {
            db.query(
                'UPDATE Produto SET estoque = estoque - ? WHERE ID = ? AND estoque >= ?',
                [item.quantidade, item.produtoId, item.quantidade],
                (err, result) => {
                    if (err) return reject(err);
                    resolve();
                }
            );
        });
    });

    Promise.all(promises)
        .then(() => {
            // Remove apenas os itens ativos do carrinho da sessão
            req.session.carrinho = carrinho.filter(item => item.oculto);

            // Opcional: Remove só os ativos do banco, se usar usuário logado
            if (req.session.usuario) {
                const ativosIds = ativos.map(item => item.produtoId);
                if (ativosIds.length > 0) {
                    db.query(
                        `DELETE FROM CARRINHO WHERE usuario_id = ? AND produto_id IN (${ativosIds.map(() => '?').join(',')})`,
                        [req.session.usuario.ID, ...ativosIds]
                    );
                }
            }
            res.redirect('/');
        })
        .catch(err => {
            console.error('Erro ao finalizar pedido:', err);
            res.status(500).send('Erro ao finalizar pedido');
        });
});

module.exports = router;
