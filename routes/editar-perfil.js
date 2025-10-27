const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// GET - mostra o formulário com seções (perfil / segurança / endereço)
router.get('/', (req, res) => {
  res.render('editar-perfil', {
    usuario: req.session.usuario || null,
    status: req.query.status || null,
    msg: req.query.msg || null
  });
});

// POST - atualiza conforme seção enviada (section: 'profile' | 'password' | 'address')
router.post('/', async (req, res) => {
  const usuarioId = req.session.usuario && req.session.usuario.ID;
  const section = req.body.section;

  if (!usuarioId) return res.redirect('/perfil');

  try {
    if (section === 'profile') {
      const { nome, telefone, genero, email } = req.body;
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE Cliente SET nome=?, telefone=?, genero=?, email=? WHERE ID=?',
          [nome, telefone, genero, email, usuarioId],
          (err) => err ? reject(err) : resolve()
        );
      });
      // atualiza sessão
      req.session.usuario = Object.assign({}, req.session.usuario, {
        nome, telefone, genero, email
      });
      return res.redirect('/editar-perfil?status=success&msg=Perfil atualizado');
    }

    if (section === 'password') {
      const { currentPassword, newPassword, newPasswordConfirm } = req.body;
      if (!newPassword || newPassword !== newPasswordConfirm) {
        return res.redirect('/editar-perfil?status=error&msg=As senhas não coincidem');
      }
      // busca hash atual
      const usuarioRow = await new Promise((resolve, reject) => {
        db.query('SELECT senha FROM Cliente WHERE ID=?', [usuarioId], (err, rows) => {
          if (err) return reject(err);
          resolve(rows[0]);
        });
      });
      const match = await bcrypt.compare(currentPassword || '', usuarioRow.senha || '');
      if (!match) return res.redirect('/editar-perfil?status=error&msg=Senha atual incorreta');
      const hashed = await bcrypt.hash(newPassword, 10);
      await new Promise((resolve, reject) => {
        db.query('UPDATE Cliente SET senha=? WHERE ID=?', [hashed, usuarioId], (err) => err ? reject(err) : resolve());
      });
      return res.redirect('/editar-perfil?status=success&msg=Senha alterada com sucesso');
    }

    if (section === 'address') {
      const { estado, cidade, rua, numero, complemento, cep, bairro } = req.body;
      await new Promise((resolve, reject) => {
        db.query(
          'UPDATE Cliente SET estado=?, cidade=?, rua=?, numero=?, complemento=?, cep=?, bairro=? WHERE ID=?',
          [estado, cidade, rua, numero, complemento, cep, bairro, usuarioId],
          (err) => err ? reject(err) : resolve()
        );
      });
      // atualiza sessão
      req.session.usuario = Object.assign({}, req.session.usuario, {
        estado, cidade, rua, numero, complemento, cep, bairro
      });
      return res.redirect('/editar-perfil?status=success&msg=Endereço atualizado');
    }

    // fallback
    return res.redirect('/editar-perfil?status=error&msg=Requisição inválida');
  } catch (err) {
    console.error('[EDITAR-PERFIL] erro:', err);
    return res.redirect('/editar-perfil?status=error&msg=Erro ao salvar');
  }
});

module.exports = router;