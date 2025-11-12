require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');

// Primeiro cria a aplicação Express
const app = express();

// === ADICIONADO: parsing de JSON e form-urlencoded (necessário para req.body) ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Depois importa as rotas
const indexRouter = require('./routes/index');
const perfilRouter = require('./routes/perfil');
const carrinhoRouter = require('./routes/carrinho');
const cadastroRouter = require('./routes/cadastro');
const productRouter = require('./routes/product');
const opcoesRouter = require('./routes/opcoes');
const ajudaRouter = require('./routes/ajuda');
const seeProdutoRouter = require('./routes/seeProduto');
const createCategoriaRouter = require('./routes/createCategoria');
const createItensRouter = require('./routes/createItens');
const admRouter = require('./routes/adm');
const admVendasRouter = require('./routes/admVendas');
const categoriaRoutes = require('./routes/categoria');
const produtoRoutes = require('./routes/produto');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const usuariosRouter = require('./routes/usuarios');
const perfilPosCadastroRouter = require('./routes/perfil-pos-cadastro');
const entradaEstoqueRouter = require('./routes/entradaEstoque');
const cadastrarPromocaoRouter = require('./routes/cadastrarPromocao');
const editarPerfilRouter = require('./routes/editar-perfil');
const avaliacaoRouter = require('./routes/avaliacao');
const pagamentoRouter = require('./routes/pagamento');
const recuperarSenhaRouter = require('./routes/recuperarSenha');
const notificacoesRouter = require('./routes/notificacoes');
const { router: adminAuthRouter } = require('./routes/adminAuth');

// Configurações
app.set('etag', false);
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(logger('dev'));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware do usuário
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Middleware de logging
app.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} referer=${req.get('referer') || '-'}`);
    next();
});

// Rotas
app.use('/', indexRouter);
app.use('/', productRouter);
app.use('/carrinho', carrinhoRouter);
app.use('/cadastro', cadastroRouter);
app.use('/opcoes', opcoesRouter);
app.use('/ajuda', ajudaRouter);
app.use('/createItens', createItensRouter);
app.use('/seeProduto', seeProdutoRouter);
app.use('/createCategoria', createCategoriaRouter);
app.use('/admCenterMotos', admRouter);
app.use('/admCenterMotos/vendas', admVendasRouter);
app.use('/categorias', categoriaRoutes);
app.use('/produtos', produtoRoutes);
app.use('/login', loginRouter);
app.use('/perfil', perfilRouter);
app.use('/logout', logoutRouter);
app.use('/usuarios', usuariosRouter);
app.use('/', perfilPosCadastroRouter);
app.use('/entradaEstoque', entradaEstoqueRouter);
app.use('/cadastrarPromocao', cadastrarPromocaoRouter);
app.use('/editar-perfil', editarPerfilRouter);
app.use('/avaliacao', avaliacaoRouter);
app.use('/pagamento', pagamentoRouter);
app.use('/', recuperarSenhaRouter);
app.use('/', notificacoesRouter);
app.use('/admin', adminAuthRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handlers
app.use(function(req, res, next) {
    res.status(404).render('error', { error: { status: 404 }, message: 'Página não encontrada' });
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error', { error: err, message: err.message });
});

app.use((req, res, next) => {
    console.warn(`[404] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
    return res.redirect('/perfil');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
