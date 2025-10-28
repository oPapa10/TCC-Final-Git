const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

// Página principal de cadastro de promoção
router.get('/', (req, res) => {
  res.render('cadastrarPromocao');
});

// Cadastrar nova promoção
router.post('/', upload.single('imagem'), (req, res) => {
  const { descricao, produtosIds, valorPromocao, porcentagemPromocao, dataFim, horaFim, minutoFim } = req.body;

  // Determinar a imagem da promoção
  const imagem = req.file
    ? '/uploads/' + req.file.filename
    : (req.body.imagemProdutoSelecionada || '');

  console.log('[PROMOCAO] Dados recebidos:', {
    descricao,
    produtosIds,
    valorPromocao,
    porcentagemPromocao,
    imagem,
    dataFim,
    horaFim,
    minutoFim
  });

  // Validações básicas
  if (!produtosIds || !imagem || (!valorPromocao && !porcentagemPromocao)) {
    console.log('[PROMOCAO] Dados insuficientes');
    return res.status(400).send('Selecione um produto, envie a imagem e informe o valor ou porcentagem!');
  }

  const produtoId = Number(produtosIds);

  // Buscar informações do produto
  db.query('SELECT valor FROM Produto WHERE ID = ?', [produtoId], (err, results) => {
    if (err || !results || !results[0]) {
      console.log('[PROMOCAO] Produto não encontrado:', err);
      return res.status(500).send('Produto não encontrado');
    }

    const valorOriginal = Number(results[0].valor);

    // Tratar valores que podem vir como array
    const valorPromocaoVal = Array.isArray(valorPromocao) ? valorPromocao[0] : valorPromocao;
    const porcentagemPromocaoVal = Array.isArray(porcentagemPromocao) ? porcentagemPromocao[0] : porcentagemPromocao;

    const valorPromocaoNum = valorPromocaoVal ? Number(valorPromocaoVal) : null;
    const porcentagemPromocaoNum = porcentagemPromocaoVal ? Number(porcentagemPromocaoVal) : null;

    console.log('[PROMOCAO] Valores processados:', {
      valorPromocaoNum,
      porcentagemPromocaoNum,
      valorOriginal
    });

    let valorPromo = null;

    // Calcular valor promocional baseado na porcentagem
    if (porcentagemPromocaoNum && porcentagemPromocaoNum > 0) {
      valorPromo = (valorOriginal * (1 - porcentagemPromocaoNum / 100));
      // Garantir que o valor promocional seja pelo menos R$0,01 abaixo do valor original
      if (valorPromo >= (valorOriginal - 0.01)) {
        valorPromo = valorOriginal - 0.01;
      }
      valorPromo = Number(valorPromo.toFixed(2));
      console.log('[PROMOCAO] Valor calculado por porcentagem:', valorPromo);
    }
    // Usar valor promocional direto
    else if (valorPromocaoNum && valorPromocaoNum > 0) {
      // Validar valor promocional
      if (valorPromocaoNum >= valorOriginal) {
        valorPromo = valorOriginal - 0.01;
      } else {
        valorPromo = valorPromocaoNum;
      }
      valorPromo = Number(valorPromo.toFixed(2));
      console.log('[PROMOCAO] Usando valor promocional direto:', valorPromo);
    }

    // Validação final do valor promocional
    if (!valorPromo || isNaN(valorPromo) || valorPromo <= 0 || valorPromo >= valorOriginal) {
      console.log('[PROMOCAO] Valor promocional inválido:', valorPromo);
      return res.status(400).send('Informe um valor promocional válido!');
    }

    // Montar data/hora de término (ou null)
    let dataHoraFim = null;
    if (dataFim && horaFim && minutoFim) {
      dataHoraFim = `${dataFim} ${horaFim}:${minutoFim}:00`;
      console.log('[PROMOCAO] Data/hora fim:', dataHoraFim);
    }

    // Inserir promoção no banco de dados
    db.query(
      'INSERT INTO Promocao (produto_id, descricao, imagem, valor_promocional, data_fim) VALUES (?, ?, ?, ?, ?)',
      [produtoId, descricao || '', imagem, valorPromo, dataHoraFim],
      (err2) => {
        if (err2) {
          console.log('[PROMOCAO] Erro ao cadastrar promoção:', err2);
          return res.status(500).send('Erro ao cadastrar promoção: ' + err2.message);
        }
        console.log('[PROMOCAO] Promoção cadastrada com sucesso!');
        return res.redirect('/cadastrarPromocao');
      }
    );
  });
});

// Listar promoções ativas
router.get('/listar', (req, res) => {
  // Primeiro remove promoções expiradas
  db.query(
    'DELETE FROM Promocao WHERE data_fim IS NOT NULL AND data_fim < NOW()',
    (err) => {
      if (err) {
        console.log('[PROMOCAO] Erro ao remover promoções expiradas:', err);
      }

      // Agora lista as promoções válidas
      db.query(
        `SELECT 
            Promocao.id, 
            Promocao.imagem, 
            Promocao.descricao, 
            Promocao.valor_promocional,
            Promocao.data_fim,
            Produto.nome AS produto_nome
         FROM Promocao
         JOIN Produto ON Promocao.produto_id = Produto.ID
         ORDER BY Promocao.id DESC`,
        (err2, promocoes) => {
          if (err2) {
            console.log('[PROMOCAO] Erro ao listar promoções:', err2);
            return res.status(500).json([]);
          }
          res.json(promocoes || []);
        }
      );
    }
  );
});

// Remover promoção
router.post('/remover/:id', (req, res) => {
  const id = req.params.id;

  db.query('DELETE FROM Promocao WHERE id = ?', [id], (err) => {
    if (err) {
      console.log('[PROMOCAO] Erro ao remover promoção:', err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
});

// Buscar produtos disponíveis para promoção
router.get('/produtos-disponiveis', (req, res) => {
  db.query(
    `SELECT 
        ID, 
        nome, 
        valor, 
        estoque, 
        imagem 
     FROM Produto 
     WHERE estoque > 0 
       AND valor > 0
       AND ID NOT IN (SELECT produto_id FROM Promocao)`, // Evita duplicação
    (err, produtos) => {
      if (err) {
        console.log('[PROMOCAO] Erro ao buscar produtos:', err);
        return res.status(500).json([]);
      }
      res.json(produtos || []);
    }
  );
});

module.exports = router;