const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

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

const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.use('/', indexRouter);
app.use('/perfil', perfilRouter);
app.use('/carrinho', carrinhoRouter);
app.use('/cadastro', cadastroRouter);
app.use('/product', productRouter);
app.use('/opcoes', opcoesRouter);
app.use('/ajuda', ajudaRouter);
app.use('/createItens', createItensRouter);
app.use('/seeProduto', seeProdutoRouter);
app.use('/createCategoria', createCategoriaRouter);
app.use('/adm', admRouter);
app.use('/', require('./routes/product'));
app.use('/', require('./routes/categoria'));

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
