const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// credenciais solicitadas
const ADMIN_USER = 'CenterMotosADM19052005';
const ADMIN_PLAIN_PASS = 'C@19052005M';

// hash em memória (gera no startup)
const ADMIN_PASS_HASH = bcrypt.hashSync(ADMIN_PLAIN_PASS, 10);

// middleware para checar autenticação admin
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminAuthenticated) return next();
  // redireciona para login e preserva a url de retorno se fornecida
  const redirectTo = encodeURIComponent(req.originalUrl || '/');
  return res.redirect('/admin/login?redirect=' + redirectTo);
}

/* rotas de login/logout */
router.get('/login', (req, res) => {
  res.render('admin-login', { mensagem: null });
});

router.post('/login', (req, res) => {
  const { usuario, senha } = req.body || {};
  if (!usuario || !senha) return res.render('admin-login', { mensagem: 'Usuário e senha são obrigatórios.' });

  if (usuario !== ADMIN_USER) {
    return res.render('admin-login', { mensagem: 'Usuário ou senha incorretos.' });
  }

  const ok = bcrypt.compareSync(senha, ADMIN_PASS_HASH);
  if (!ok) return res.render('admin-login', { mensagem: 'Usuário ou senha incorretos.' });

  // sucesso
  req.session.adminAuthenticated = true;
  req.session.adminUser = ADMIN_USER;
  // sempre levar para a área administrativa após login (a menos que exista um redirect explícito)
  const redirect = req.query.redirect ? decodeURIComponent(req.query.redirect) : '/centerrmotos4asda88a4admsdada4a4ADM';
  return res.redirect(redirect);
});

router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        console.error('[ADMIN-LOGOUT] erro ao destruir sessão:', err);
        // forçar limpeza parcial
        req.session = null;
        res.clearCookie('connect.sid');
        return res.redirect('/admin/login');
      }
      res.clearCookie('connect.sid');
      return res.redirect('/admin/login');
    });
  } else {
    return res.redirect('/admin/login');
  }
});

module.exports = { router, requireAdmin };