const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/perfil');
  });
});

module.exports = router;