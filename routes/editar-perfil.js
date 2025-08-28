const express = require('express');
const router = express.Router();

// GET - exibe o formulário
router.get('/', (req, res) => {
    res.render('editar-perfil', { usuario: req.session.usuario });
});

// POST - salva alterações
router.post('/', (req, res) => {
    // Aqui você deve atualizar o usuário no banco de dados
    // Exemplo: await Usuario.update(req.session.usuario.id, req.body);
    // Atualize os dados na sessão também, se necessário
    // Redirecione para /perfil
    res.redirect('/perfil');
});

module.exports = router;