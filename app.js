var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var perfilRouter = require('./routes/perfil');
var carrinhoRouter = require('./routes/carrinho');
var cadastroRouter = require('./routes/cadastro');  
var productRouter = require('./routes/product');
var opcoesRouter = require('./routes/opcoes');
var ajudaRouter = require('./routes/ajuda');
var seeProdutoRouter = require('./routes/seeProduto');
var createCategoria = require('./routes/createCategoria');
var createItens = require('./routes/createItens');
var adm = require('./routes/adm');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/perfil', perfilRouter);
app.use('/carrinho', carrinhoRouter);
app.use('/cadastro', cadastroRouter);
app.use('/product', productRouter);
app.use('/opcoes', opcoesRouter);
app.use('/ajuda', ajudaRouter);
app.use('/createItens', createItens);
app.use('/seeProduto', seeProdutoRouter);
app.use('/createCategoria', createCategoria);
app.use('/adm', adm);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
