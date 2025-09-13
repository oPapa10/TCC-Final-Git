const express = require('express');
const router = express.Router();
const Produto = require('../models/produtoModel');

function valorOuAntigo(novo, antigo) {
    return (novo !== undefined && novo !== null && novo !== '') ? novo : antigo;
}

router.post('/editar/:id', (req, res) => {
    const id = req.params.id;
    const {
        nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
        material, protecao, thumbnails, categoria
    } = req.body;

    let imagem = req.body.imagemAtual || '';
    if (req.files && req.files['imagem'] && req.files['imagem'][0]) {
        imagem = '/uploads/' + req.files['imagem'][0].filename;
    }

    let thumbList = [];
    if (thumbnails) {
        thumbList = thumbnails.split(',').map(t => t.trim()).filter(t => t);
    }
    if (req.files && req.files['thumbnailUpload'] && req.files['thumbnailUpload'][0]) {
        const uploadedPath = '/uploads/' + req.files['thumbnailUpload'][0].filename;
        if (!thumbList.includes(uploadedPath)) {
            thumbList.push(uploadedPath);
        }
    }
    const thumbnailsFinal = thumbList.join(',');

    // LOG: O que chegou do formulário
    console.log('--- [EDIT PRODUTO] Dados recebidos do form:');
    console.log({
        nome, cor, tamanho, peso, valor, cilindrada, descricao, potencia, tanque,
        material, protecao, thumbnails, categoria, imagem, thumbnailsFinal
    });

    Produto.findById(id, (err, produtoOriginal) => {
        if (err || !produtoOriginal) {
            console.log('[EDIT PRODUTO] Produto não encontrado ou erro:', err);
            return res.status(404).send('Produto não encontrado');
        }

        // LOG: Produto original do banco
        console.log('--- [EDIT PRODUTO] Produto original do banco:');
        console.log(produtoOriginal);

        const produtoAtualizado = {
            nome: valorOuAntigo(nome, produtoOriginal.nome),
            cor: valorOuAntigo(cor, produtoOriginal.cor),
            tamanho: valorOuAntigo(tamanho, produtoOriginal.tamanho),
            peso: valorOuAntigo(peso, produtoOriginal.peso),
            valor: valorOuAntigo(valor, produtoOriginal.valor),
            cilindrada: valorOuAntigo(cilindrada, produtoOriginal.cilindrada),
            descricao: valorOuAntigo(descricao, produtoOriginal.descricao),
            potencia: valorOuAntigo(potencia, produtoOriginal.potencia),
            tanque: valorOuAntigo(tanque, produtoOriginal.tanque),
            material: valorOuAntigo(material, produtoOriginal.material),
            protecao: valorOuAntigo(protecao, produtoOriginal.protecao),
            imagem: valorOuAntigo(imagem, produtoOriginal.imagem),
            thumbnails: valorOuAntigo(thumbnailsFinal, produtoOriginal.thumbnails),
            Categoria_ID: valorOuAntigo(categoria, produtoOriginal.Categoria_ID)
        };

        // LOG: Objeto que será enviado para update
        console.log('--- [EDIT PRODUTO] Objeto para update:');
        console.log(produtoAtualizado);

        Produto.update(id, produtoAtualizado, (err2) => {
            if (err2) {
                console.log('[EDIT PRODUTO] ERRO ao atualizar produto:', err2);
                return res.status(500).send('Erro ao atualizar produto');
            }
            console.log('[EDIT PRODUTO] Produto atualizado com sucesso!');
            res.redirect('/seeProduto');
        });
    });
});

module.exports = router;