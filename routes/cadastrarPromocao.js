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
    const { descricao, produtosIds, valorPromocao, porcentagemPromocao, dataFim, horaFim, minutoFim } = req.body;
    const imagem = req.file
        ? '/uploads/' + req.file.filename
        : (req.body.imagemProdutoSelecionada || '');
    console.log('[PROMOCAO] Dados recebidos:', { descricao, produtosIds, valorPromocao, porcentagemPromocao, imagem });

    if (!produtosIds || !imagem || (!valorPromocao && !porcentagemPromocao)) {
        console.log('[PROMOCAO] Falta produto, imagem ou valor/promocao');
        return res.status(400).send('Selecione um produto, envie a imagem e informe o valor ou porcentagem!');
    }
    const id = Number(produtosIds);

    db.query('SELECT valor FROM Produto WHERE ID = ?', [id], (err, results) => {
        if (err || !results[0]) {
            console.log('[PROMOCAO] Produto não encontrado:', err, results);
            return res.status(500).send('Produto não encontrado');
        }

        // Trate array
        const valorPromocaoVal = Array.isArray(valorPromocao) ? valorPromocao[0] : valorPromocao;
        const porcentagemPromocaoVal = Array.isArray(porcentagemPromocao) ? porcentagemPromocao[0] : porcentagemPromocao;

        const valorPromocaoNum = valorPromocaoVal ? Number(valorPromocaoVal) : null;
        const porcentagemPromocaoNum = porcentagemPromocaoVal ? Number(porcentagemPromocaoVal) : null;
        console.log('[PROMOCAO] valorPromocaoNum:', valorPromocaoNum, 'porcentagemPromocaoNum:', porcentagemPromocaoNum);

        let valorPromo = null;
        if (porcentagemPromocaoNum && porcentagemPromocaoNum > 0) {
            const valorOriginal = Number(results[0].valor);
            valorPromo = (valorOriginal * (1 - porcentagemPromocaoNum / 100));
            // Limite: mínimo R$1,00 abaixo do valor real
            if (valorPromo > (valorOriginal - 1)) valorPromo = valorOriginal - 1;
            valorPromo = valorPromo.toFixed(2);
            console.log('[PROMOCAO] Calculado valorPromo por porcentagem:', valorPromo);
        } else if (valorPromocaoNum && valorPromocaoNum > 0) {
            const valorOriginal = Number(results[0].valor);
            // Limite: mínimo R$1,00 abaixo do valor real
            if (valorPromocaoNum > (valorOriginal - 1)) valorPromo = (valorOriginal - 1).toFixed(2);
            else valorPromo = valorPromocaoNum.toFixed(2);
            console.log('[PROMOCAO] Usando valorPromo direto:', valorPromo);
        }

        if (!valorPromo || isNaN(valorPromo)) {
            console.log('[PROMOCAO] Valor promocional inválido:', valorPromo);
            return res.status(400).send('Informe um valor promocional válido!');
        }

        // Monta data/hora fim
        let dataHoraFim = null;
        if (dataFim && horaFim && minutoFim) {
            dataHoraFim = `${dataFim} ${horaFim}:${minutoFim}:00`;
        }

        db.query(
            'INSERT INTO Promocao (produto_id, descricao, imagem, valor_promocional, data_fim) VALUES (?, ?, ?, ?, ?)',
            [id, descricao, imagem, valorPromo, dataHoraFim],
            (err2) => {
                if (err2) {
                    console.log('[PROMOCAO] Erro ao cadastrar promoção:', err2);
                    return res.status(500).send('Erro ao cadastrar promoção: ' + err2.message);
                }
                console.log('[PROMOCAO] Promoção cadastrada com sucesso!');
                res.redirect('/cadastrarPromocao');
            }
        );
    });
});

// Listar promoções
router.get('/listar', (req, res) => {
    // Remove promoções expiradas antes de listar
    db.query(
        'DELETE FROM Promocao WHERE data_fim IS NOT NULL AND data_fim < NOW()',
        (err) => {
            // Agora lista as promoções válidas
            db.query(
                `SELECT Promocao.id, Promocao.imagem, Promocao.descricao, Promocao.valor_promocional, Produto.nome AS produto_nome
                 FROM Promocao
                 JOIN Produto ON Promocao.produto_id = Produto.ID
                 ORDER BY Promocao.id DESC`,
                (err2, promocoes) => {
                    if (err2) return res.status(500).json([]);
                    res.json(promocoes);
                }
            );
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
        'SELECT ID, nome, valor, estoque, imagem FROM Produto WHERE estoque > 0 AND valor > 0',
        (err, produtos) => {
            if (err) return res.status(500).json([]);
            res.json(produtos);
        }
    );
});

module.exports = router;