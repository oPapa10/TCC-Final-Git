router.get('/comprar-confirmacao/:produtoId', (req, res) => {
    const produtoId = req.params.produtoId;
    const quantidade = req.query.quantidade || 1;
    // Busca o produto para mostrar nome/imagem
    db.query('SELECT * FROM PRODUTO WHERE ID = ?', [produtoId], (err, results) => {
        const produto = results && results[0] ? results[0] : null;
        res.render('comprarConfirmacao', { produto, quantidade });
    });
});