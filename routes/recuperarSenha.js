const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true para 465, false para 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('Transporter verify error:', err);
  } else {
    console.log('Transporter pronto para envio de e-mails');
  }
});

// GET form solicitar e-mail
router.get('/recuperar-senha', (req, res) => {
  res.render('recuperar-senha', { usuario: req.session.usuario });
});

// POST solicitar link
router.post('/recuperar-senha', (req, res) => {
  const email = req.body.email;
  db.query('SELECT ID, nome FROM Cliente WHERE email = ?', [email], (err, users) => {
    if (err || !users || users.length === 0) {
      // resposta genérica para segurança
      return res.render('recuperar-senha', { usuario: req.session.usuario, mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções.' });
    }
    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hora

    db.query('INSERT INTO password_resets (cliente_id, token, expires) VALUES (?, ?, ?)', [user.ID, token, new Date(expires)], (err2) => {
      if (err2) return res.status(500).send('Erro interno');

      const link = `${req.protocol}://${req.get('host')}/recuperar-senha/${token}`;
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"Loja Motos" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Redefinição de senha',
        text: `Olá ${user.nome || ''},\n\nClique no link para redefinir sua senha:\n\n${link}\n\nO link expira em 1 hora.\n\nSe você não solicitou, ignore.`
      };

      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error('Erro ao enviar e-mail de recuperação:', mailErr);
          // opcional: mostrar mensagem amigável ao usuário
          return res.render('recuperar-senha', { usuario: req.session.usuario, mensagem: 'Erro ao enviar o e-mail. Tente novamente mais tarde.' });
        }
        console.log('E-mail de recuperação enviado:', info && info.response);
        return res.render('recuperar-senha', { usuario: req.session.usuario, mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções.' });
      });
    });
  });
});

// GET formulário via token
router.get('/recuperar-senha/:token', (req, res) => {
  const token = req.params.token;
  db.query('SELECT pr.*, c.email FROM password_resets pr JOIN Cliente c ON pr.cliente_id = c.ID WHERE pr.token = ? AND pr.expires > NOW()', [token], (err, rows) => {
    if (err || !rows || rows.length === 0) {
      return res.render('redefinir-senha', { usuario: req.session.usuario, mensagem: 'Link inválido ou expirado.', token: null });
    }
    res.render('redefinir-senha', { usuario: req.session.usuario, mensagem: null, token });
  });
});

// POST redefinir senha
router.post('/recuperar-senha/:token', async (req, res) => {
  const token = req.params.token;
  const { senha, confirmar } = req.body;
  if (!senha || senha !== confirmar) {
    return res.render('redefinir-senha', { usuario: req.session.usuario, mensagem: 'Senhas não coincidem.', token });
  }

  db.query('SELECT pr.*, c.ID as clienteId FROM password_resets pr JOIN Cliente c ON pr.cliente_id = c.ID WHERE pr.token = ? AND pr.expires > NOW()', [token], async (err, rows) => {
    if (err || !rows || rows.length === 0) {
      return res.render('redefinir-senha', { usuario: req.session.usuario, mensagem: 'Link inválido ou expirado.', token: null });
    }
    const clienteId = rows[0].clienteId;
    try {
      const hash = await bcrypt.hash(senha, 10);
      db.query('UPDATE Cliente SET senha = ? WHERE ID = ?', [hash, clienteId], (err2) => {
        if (err2) return res.status(500).send('Erro ao atualizar senha');

        // remove tokens
        db.query('DELETE FROM password_resets WHERE cliente_id = ?', [clienteId], () => {
          res.render('redefinir-senha', { usuario: req.session.usuario, mensagem: 'Senha alterada com sucesso. Faça login.', token: null });
        });
      });
    } catch(e) {
      return res.status(500).send('Erro interno');
    }
  });
});

module.exports = router;