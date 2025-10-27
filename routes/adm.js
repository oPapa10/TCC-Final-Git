const express = require('express');
const path = require('path');
const router = express.Router();
const { requireAdmin } = require('./adminAuth'); // exige que adminAuth.js exista

//Rota para home - protegida
router.get('/', requireAdmin, (req, res) => {
  res.render('adm');
});

module.exports = router;
