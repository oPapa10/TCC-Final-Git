const express = require('express');
const router = express.Router();
const Produto = require('../models/produtoModel');
const Categoria = require('../models/Categoria');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const produtoController = require('../controllers/produtoController');

// Página de detalhes do produto usando slug
router.get('/p/:slug', (req, res) => {
    const slug = req.params.slug;
    db.query(
        `SELECT p.*, pr.valor_promocional, p.especificacoes
         FROM Produto p
         LEFT JOIN (
             SELECT produto_id, MAX(valor_promocional) AS valor_promocional
             FROM Promocao
             GROUP BY produto_id
         ) pr ON pr.produto_id = p.ID
         WHERE p.slug = ?`,
        [slug],
        (err, results) => {
            if (err || results.length === 0) {
                return res.render('product', { produto: null, relacionados: [], avaliacoes: [] });
            }
            const produto = results[0];
            const categoriaId = Number(produto.Categoria_ID);
            const produtoId = Number(produto.ID);

            // Busca avaliações do produto
            db.query(
                `SELECT a.*, u.nome AS usuario_nome 
                 FROM AVALIACAO a 
                 LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
                 WHERE a.produto_id = ? 
                 ORDER BY a.data_avaliacao DESC`,
                [produtoId],
                (err3, avaliacoes) => {
                    // Busca produtos da mesma categoria, exceto o atual
                    db.query(
                        `SELECT * FROM Produto WHERE Categoria_ID = ? AND ID != ? LIMIT 4`,
                        [categoriaId, produtoId],
                        (err2, relacionados) => {
                            if (err2 || !relacionados) relacionados = [];
                            res.render('product', {
                                produto,
                                relacionados,
                                avaliacoes: avaliacoes || []
                            });
                        }
                    );
                }
            );
        }
    );
});

// Rota GET para editar produto
router.get('/produtos/editar/:id', (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT p.*, cp.campos as categoria_campos, cp.nome as categoria_nome, cp.ID as CategoriaProduto_ID
        FROM Produto p
        LEFT JOIN CategoriasProduto cp ON p.CategoriaProduto_ID = cp.ID
        WHERE p.ID = ?
    `;
    db.query(query, [id], (err, results) => {
        if (err || !results.length) {
            console.error('Erro ao buscar produto:', err);
            return res.redirect('/seeProduto');
        }
        const produto = results[0];

        // normaliza campos da categoria (garante array de objetos {key,label})
        let camposCategoria = [];
        if (produto.categoria_campos) {
            try {
                const parsed = (typeof produto.categoria_campos === 'string') ? JSON.parse(produto.categoria_campos) : produto.categoria_campos;
                if (Array.isArray(parsed)) {
                    camposCategoria = parsed.map(c => {
                        if (typeof c === 'string') return { key: c.toLowerCase().replace(/\s+/g,'_'), label: c };
                        if (c && typeof c === 'object' && c.key) return { key: String(c.key).toLowerCase(), label: c.label || c.key };
                        return null;
                    }).filter(Boolean);
                }
            } catch (e) {
                console.error('Erro ao parsear categoria_campos:', e);
                camposCategoria = [];
            }
        }

        // Busca todas as categorias de produto para o select (agora usa tabela Categoria do catálogo)
        db.query('SELECT * FROM Categoria', (errCat, categoriasCatalogo) => {
            if (errCat) {
                console.error('Erro ao buscar categorias do catálogo:', errCat);
                categoriasCatalogo = [];
            }
            res.render('editProduto', {
                produto,
                categorias: categoriasCatalogo || [], // usado no select da view
                categoriaCampos: camposCategoria
            });
        });
    });
});

// Rota POST para salvar a edição
router.post('/produtos/editar/:id', upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'thumbnailUpload', maxCount: 10 }
]), (req, res) => {
    const id = req.params.id;
    const {
        nome, valor, valor_promocional, categoria, cor, tamanho, peso, cilindrada,
        potencia, tanque, material, protecao, descricao
    } = req.body;

    // Prioriza upload de imagem, senão link, senão mantém imagemAtual
    let imagem = req.body.imagemAtual || '';
    if (req.files && req.files['imagem'] && req.files['imagem'][0]) {
        imagem = '/uploads/' + req.files['imagem'][0].filename;
    } else if (req.body.imagemLink && req.body.imagemLink.trim()) {
        imagem = req.body.imagemLink.trim();
    }

    // Thumbnails: prioridade upload múltiplo > newThumbnailLinks[] (inputs gerados) > thumbnailLinks (texto) > existingThumbnails[]
    let thumbnailsFinal = [];

    // existing thumbnails (hidden) continuam se não removidas
    const existingHidden = req.body['existingThumbnails[]'] || req.body.existingThumbnails;
    if (existingHidden) {
      if (Array.isArray(existingHidden)) thumbnailsFinal.push(...existingHidden);
      else thumbnailsFinal.push(existingHidden);
    }

    // arquivos enviados (uploads)
    if (req.files && req.files['thumbnailUpload'] && req.files['thumbnailUpload'].length > 0) {
      const ups = req.files['thumbnailUpload'].map(f => '/uploads/' + f.filename);
      thumbnailsFinal = thumbnailsFinal.concat(ups);
    }

    // novos links adicionados via inputs hidden name="newThumbnailLinks[]"
    const newLinksInput = req.body.newThumbnailLinks || req.body['newThumbnailLinks[]'];
    if (newLinksInput) {
      if (Array.isArray(newLinksInput)) thumbnailsFinal = thumbnailsFinal.concat(newLinksInput);
      else thumbnailsFinal.push(newLinksInput);
    }

    // campo de texto thumbnailLinks (comma separated)
    if (req.body.thumbnailLinks) {
      const txtLinks = String(req.body.thumbnailLinks).split(',').map(s => s.trim()).filter(Boolean);
      thumbnailsFinal = thumbnailsFinal.concat(txtLinks);
    }

    // remove duplicatas e limpas entradas vazias
    thumbnailsFinal = thumbnailsFinal.filter(Boolean);
    thumbnailsFinal = Array.from(new Set(thumbnailsFinal));

    // Salva como JSON (compatível com parsing em controllers/views)
    const thumbnailsStr = thumbnailsFinal.length ? JSON.stringify(thumbnailsFinal) : (req.body.thumbnails || null);

    Produto.update(id, {
        nome,
        valor,
        valor_promocional,
        Categoria_ID: categoria,
        cor,
        tamanho,
        peso,
        cilindrada,
        potencia,
        tanque,
        material,
        protecao,
        thumbnails: thumbnailsStr,
        imagem,
        descricao
    }, (err) => {
        if (err) {
            console.error('Erro ao atualizar produto:', err);
            return res.status(500).send('Erro ao atualizar produto');
        }
        res.redirect('/seeProduto');
    });
});

// Outras rotas que renderizam product.ejs devem SEMPRE passar relacionados: []
router.get('/product/:id', (req, res) => {
    const id = req.params.id;
    db.query(
        `SELECT p.*, pr.valor_promocional
         FROM Produto p
         LEFT JOIN Promocao pr ON pr.produto_id = p.ID
         WHERE p.ID = ?`,
        [id],
        (err, results) => {
            if (err || results.length === 0) {
                return res.render('product', { produto: null, relacionados: [], avaliacoes: [] });
            }
            // Buscar avaliações
            db.query(
                `SELECT a.*, u.nome AS usuario_nome 
                 FROM AVALIACAO a 
                 LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
                 WHERE a.produto_id = ? 
                 ORDER BY a.data_avaliacao DESC`,
                [id],
                (err2, avaliacoes) => {
                    res.render('product', {
                        produto: results[0],
                        relacionados: [],
                        avaliacoes: avaliacoes || []
                    });
                }
            );
        }
    );
});

router.get('/product/:slug', (req, res) => {
    const slug = req.params.slug;
    Produto.findBySlug(slug, (err, produto) => {
        if (err || !produto) {
            return res.render('product', { produto: null, relacionados: [], avaliacoes: [] });
        }
        // Buscar avaliações
        db.query(
            `SELECT a.*, u.nome AS usuario_nome 
             FROM AVALIACAO a 
             LEFT JOIN CLIENTE u ON a.usuario_id = u.ID 
             WHERE a.produto_id = ? 
             ORDER BY a.data_avaliacao DESC`,
            [produto.ID],
            (err2, avaliacoes) => {
                res.render('product', {
                    produto,
                    relacionados: [],
                    avaliacoes: avaliacoes || []
                });
            }
        );
    });
});

const campos = [
    'nome', 'valor', 'valor_promocional', 'Categoria_ID', 'cor', 'tamanho', 'peso', 'cilindrada',
    'potencia', 'tanque', 'material', 'protecao', 'thumbnails', 'imagem', 'descricao'
];

// Exemplo para rota POST /comprar-agora
router.post('/comprar-agora', (req, res) => {
    if (!req.session.usuario) {
        return res.status(401).render('error', { error: { status: 401 }, message: 'Você precisa estar logado para finalizar a compra.' });
    }
    const { produtoId, quantidade } = req.body;
    db.query(
        'UPDATE Produto SET estoque = estoque - ? WHERE ID = ? AND estoque >= ?',
        [quantidade, produtoId, quantidade],
        (err, result) => {
            if (err) return res.status(500).send('Erro ao atualizar estoque');
            db.query(
                'INSERT INTO PEDIDO_ITENS (usuario_id, produto_id, quantidade) VALUES (?, ?, ?)',
                [req.session.usuario.ID, produtoId, quantidade],
                (err2) => {
                    if (err2) return res.status(500).send('Erro ao registrar pedido');
                    console.log('[PEDIDO_ITENS] Tentando inserir:', {
                        usuarioId: req.session.usuario.ID,
                        produtoId,
                        quantidade
                    });
                    res.redirect('/?msg=avaliacao');
                }
            );
        }
    );
});

router.get('/comprar-confirmacao/:produtoId', (req, res) => {
    const produtoId = req.params.produtoId;
    db.query('SELECT * FROM Produto WHERE ID = ?', [produtoId], (err, results) => {
        const produto = results && results[0] ? results[0] : null;
        res.render('partials/compraConfirmacao', {
            confirmacaoCompra: true,
            produtoId,
            produtoNome: produto ? produto.nome : '',
            quantidade: 1
        });
    });
});

module.exports = router;
