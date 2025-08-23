const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/', (req, res) => {
    res.render('cadastrarPromocao');
});

router.post('/', upload.single('imagem'), (req, res) => {
    const { descricao, produtosIds, valorPromocao } = req.body;
    const valorPromo = Array.isArray(valorPromocao) ? valorPromocao[0] : valorPromocao;
    const imagem = req.file ? '/uploads/' + req.file.filename : '';
    if (!produtosIds || !imagem || !valorPromocao) {
        return res.status(400).send('Selecione um produto, envie a imagem e informe o valor promocional!');
    }
    const id = Number(produtosIds);
    console.log({ id, descricao, imagem, valorPromo });
    db.query(
        'INSERT INTO Promocao (produto_id, descricao, imagem, valor_promocional) VALUES (?, ?, ?, ?)',
        [id, descricao, imagem, valorPromo],
        (err) => {
            if (err) return res.status(500).send('Erro ao cadastrar promoção: ' + err.message);
            res.redirect('/cadastrarPromocao');
        }
    );
});

// Listar promoções
router.get('/listar', (req, res) => {
    db.query(
        `SELECT Promocao.id, Promocao.imagem, Promocao.descricao, Promocao.valor_promocional, Produto.nome AS produto_nome
         FROM Promocao
         JOIN Produto ON Promocao.produto_id = Produto.ID
         ORDER BY Promocao.id DESC`,
        (err, promocoes) => {
            if (err) return res.status(500).json([]);
            res.json(promocoes);
        }
    );
});

// Remover promoção
router.post('/remover/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM Promocao WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// Adicione esta rota para buscar produtos válidos para promoção
router.get('/produtos-disponiveis', (req, res) => {
    db.query(
        'SELECT ID, nome, valor, estoque FROM Produto WHERE estoque > 0 AND valor > 0',
        (err, produtos) => {
            if (err) return res.status(500).json([]);
            res.json(produtos);
        }
    );
});

module.exports = router;