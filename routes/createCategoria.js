const express = require('express');
const router = express.Router();
const Categoria = require('../models/Categoria');
const db = require('../config/db'); // Certifique-se de importar seu banco

// Função para validar nome da categoria
function nomeCategoriaValido(nome) {
    return /^[A-Za-zÀ-ÿ0-9]+( [A-Za-zÀ-ÿ0-9]+)*$/.test(nome.trim());
}

// Listar categorias
router.get('/', (req, res) => {
  // buscar ordenadas por 'ordem' (fallback para ID)
  db.query('SELECT * FROM Categoria ORDER BY COALESCE(ordem,999), ID', (err, categorias) => {
    if (err) return res.status(500).send('Erro ao buscar categorias');
    res.render('createCategoria', { categorias, sucesso: false });
  });
});

// Criar categoria
router.post('/categorias', (req, res) => {
  const { categoryName } = req.body;
  if (!nomeCategoriaValido(categoryName)) {
    return Categoria.findAll((err, categorias) => {
      if (err) return res.status(500).send('Erro ao buscar categorias');
      res.render('createCategoria', { categorias, sucesso: false, erro: 'O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.' });
    });
  }
  Categoria.create({ nome: categoryName }, (err) => {
    if (err) return res.status(500).send('Erro ao criar categoria');
    // Após cadastrar, busque as categorias novamente e renderize a página com sucesso
    Categoria.findAll((err, categorias) => {
      if (err) return res.status(500).send('Erro ao buscar categorias');
      res.render('createCategoria', { categorias, sucesso: true });
    });
  });
});

// Excluir categoria
router.post('/categorias/excluir/:id', (req, res) => {
  const categoriaId = req.params.id;

  // Verifica se existe algum produto conectado à categoria
  db.query('SELECT COUNT(*) AS total FROM Produto WHERE Categoria_ID = ?', [categoriaId], (err, result) => {
    if (err) return res.status(500).send('Erro ao verificar produtos da categoria');
    if (result[0].total > 0) {
      // Não permite excluir
      Categoria.findAll((err, categorias) => {
        if (err) return res.status(500).send('Erro ao buscar categorias');
        res.render('createCategoria', { categorias, sucesso: false, erro: 'Não é possível excluir: existem produtos conectados a esta categoria.' });
      });
    } else {
      // Pode excluir
      Categoria.delete(categoriaId, (err2) => {
        if (err2) return res.status(500).send('Erro ao excluir categoria');
        Categoria.findAll((err, categorias) => {
          if (err) return res.status(500).send('Erro ao buscar categorias');
          res.render('createCategoria', { categorias, sucesso: true });
        });
      });
    }
  });
});

// Verificar se há produtos conectados à categoria (AJAX)
router.get('/categorias/tem-produtos/:id', (req, res) => {
  const categoriaId = req.params.id;
  db.query('SELECT COUNT(*) AS total FROM Produto WHERE Categoria_ID = ?', [categoriaId], (err, result) => {
    if (err) return res.json({ erro: true });
    res.json({ temProdutos: result[0].total > 0 });
  });
});

// Editar categoria (GET)
router.get('/categorias/editar/:id', (req, res) => {
  const categoriaId = req.params.id;
  Categoria.findById(categoriaId, (err, categoria) => {
    if (err || !categoria) return res.status(404).send('Categoria não encontrada');
    res.render('editCategoria', { categoria });
  });
});

// Editar categoria (POST)
router.post('/categorias/editar/:id', (req, res) => {
  const categoriaId = req.params.id;
  const { categoryName } = req.body;
  if (!nomeCategoriaValido(categoryName)) {
    return Categoria.findById(categoriaId, (err, categoria) => {
      if (err || !categoria) return res.status(404).send('Categoria não encontrada');
      res.render('editCategoria', { categoria, erro: 'O nome da categoria não pode conter caracteres especiais. Use apenas letras, números e espaços.' });
    });
  }
  Categoria.update(categoriaId, { nome: categoryName }, (err) => {
    if (err) return res.status(500).send('Erro ao atualizar categoria');
    res.redirect('/createCategoria');
  });
});

// Rota para reordenar categorias (recebe { order: [id1, id2, ...] })
router.post('/categorias/reordenar', async (req, res) => {
  console.log('[REORDER] payload:', req.body);
  const order = req.body && req.body.order;
  if (!Array.isArray(order)) return res.status(400).json({ ok: false, error: 'Payload inválido' });

  // Função que aplica updates e retorna Promise de results
  const applyUpdates = () => {
    const queries = order.map((id, idx) => {
      const pos = idx + 1;
      return new Promise((resolve) => {
        db.query('UPDATE Categoria SET ordem = ? WHERE ID = ?', [pos, id], (err) => {
          if (err) return resolve({ ok: false, id, err: err.message, code: err.code });
          return resolve({ ok: true, id, ordem: pos });
        });
      });
    });
    return Promise.all(queries);
  };

  try {
    let results = await applyUpdates();
    const badField = results.find(r => r.code === 'ER_BAD_FIELD_ERROR');
    if (badField) throw { code: 'ER_BAD_FIELD_ERROR' }; // força passar para criação da coluna
    const errors = results.filter(r => r.ok === false);
    if (errors.length) return res.status(500).json({ ok: false, error: 'Erro ao salvar ordem', details: errors });
    return res.json({ ok: true });
  } catch (err) {
    // Se coluna ausente, cria e tenta novamente
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      console.warn('[REORDER] coluna "ordem" não existe — tentando criar...');
      db.query('ALTER TABLE Categoria ADD COLUMN ordem INT DEFAULT 999', (alterErr) => {
        if (alterErr) {
          console.error('[REORDER] erro ao criar coluna ordem:', alterErr);
          return res.status(500).json({ ok: false, error: 'Falha ao criar coluna ordem', details: alterErr.message });
        }
        // retry
        applyUpdates().then(results2 => {
          const errors2 = results2.filter(r => r.ok === false);
          if (errors2.length) return res.status(500).json({ ok: false, error: 'Erro ao salvar ordem após criar coluna', details: errors2 });
          return res.json({ ok: true });
        }).catch(e2 => {
          console.error('[REORDER] erro ao aplicar updates após criar coluna:', e2);
          return res.status(500).json({ ok: false, error: 'Erro interno' });
        });
      });
    } else {
      console.error('[REORDER] erro inesperado:', err);
      return res.status(500).json({ ok: false, error: 'Erro interno' });
    }
  }
});

module.exports = router;
