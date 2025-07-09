const express = require("express");
const router = express.Router();
const Categoria = require('../models/Categoria');



router.get("/create", async (req, res) => {
  try {
    const categorias = await Categoria.findAll(); // ou a lógica que você usa pra buscar
    res.render("createItens", { categorias });
  } catch (error) {
    console.error("Erro ao carregar categorias:", error);
    res.status(500).send("Erro ao carregar categorias.");
  }
});

module.exports = router;
