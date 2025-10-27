const express = require('express');
const router = express.Router();

console.log('[ROUTES] carregando routes/logout.js');

// POST /logout (quando o router é montado em app.use('/logout', ...), o caminho final é /logout)
router.post('/', (req, res) => {
  console.log(`[LOGOUT] POST /logout - sessão existe? ${!!req.session}`);
  req.session.destroy(err => {
    if (err) {
      console.error('[LOGOUT] erro ao destruir sessão:', err);
      return res.redirect('/perfil');
    }
    res.clearCookie('connect.sid');
    console.log('[LOGOUT] sessão destruida (POST). redirecionando para /perfil');
    res.redirect('/perfil');
  });
});

// GET /logout (suporte quando usuário acessa via link)
router.get('/', (req, res) => {
  console.log(`[LOGOUT] GET /logout - sessão existe? ${!!req.session}`);
  req.session.destroy(err => {
    if (err) {
      console.error('[LOGOUT] erro ao destruir sessão (GET):', err);
      return res.redirect('/perfil');
    }
    res.clearCookie('connect.sid');
    console.log('[LOGOUT] sessão destruida (GET). redirecionando para /perfil');
    res.redirect('/perfil');
  });
});

module.exports = router;