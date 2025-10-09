const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');

// Rotas
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
const categoriaRoutes = require('./routes/categoria');
const produtoRoutes = require('./routes/produto'); // Corrigido para importar o router certo
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const usuariosRouter = require('./routes/usuarios');
const perfilPosCadastroRouter = require('./routes/perfil-pos-cadastro');
const entradaEstoqueRouter = require('./routes/entradaEstoque');
const cadastrarPromocaoRouter = require('./routes/cadastrarPromocao');
const editarPerfilRouter = require('./routes/editar-perfil');
const avaliacaoRouter = require('./routes/avaliacao');
const pagamentoRouter = require('./routes/pagamento');

const app = express();

app.set('etag', false);
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Configuração do express-session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para disponibilizar o usuário na resposta
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    next();
});

// Rotas

app.use('/', indexRouter);
app.use('/', productRouter); // Inclui as rotas de produto, inclusive /comprar-agora e /comprar-confirmacao/:produtoId
app.use('/carrinho', carrinhoRouter); // Isso já está correto!
app.use('/cadastro', cadastroRouter);
app.use('/opcoes', opcoesRouter);
app.use('/ajuda', ajudaRouter);
app.use('/createItens', createItensRouter);
app.use('/seeProduto', seeProdutoRouter);
app.use('/createCategoria', createCategoriaRouter);
app.use('/adm', admRouter);
app.use('/categorias', categoriaRoutes);   //  corrigido
app.use('/produtos', require('./routes/produto'));
app.use('/login', loginRouter);
app.use('/perfil', perfilRouter);
app.use('/logout', logoutRouter);
app.use('/usuarios', usuariosRouter);
app.use('/', perfilPosCadastroRouter);
app.use('/entradaEstoque', entradaEstoqueRouter);
app.use('/cadastrarPromocao', cadastrarPromocaoRouter);
app.use('/editar-perfil', editarPerfilRouter);
app.use('/avaliacao', avaliacaoRouter); // Nova rota adicionada
app.use('/pagamento', pagamentoRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).render('error', { error: { status: 404 }, message: 'Página não encontrada' });
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error', { error: err, message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
