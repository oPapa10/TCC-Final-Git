const express = require('express');
const router = express.Router();
const { QrCodePix } = require('qrcode-pix');
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer({ dest: 'uploads/comprovantes/' });

// Substitua pela sua chave PIX real
const CHAVE_PIX = '11147464952';
const NOME_RECEBEDOR = 'Ruan Borges da Silveira';
const CIDADE_RECEBEDOR = 'Balneário Gaivota';

router.get('/', (req, res) => {
    // Pegue os dados do pedido do carrinho ou query (exemplo simplificado)
    const { valor, descricao } = req.query;
    if (!valor) return res.redirect('/carrinho');

    const qrCodePix = QrCodePix({
        version: '01',
        key: CHAVE_PIX,
        name: NOME_RECEBEDOR,
        city: CIDADE_RECEBEDOR,
        value: Number(valor),
        message: descricao || 'Pagamento Loja Motos'
    });

    qrCodePix.base64().then(qrCodeImage => {
        res.render('pagamento', {
            valor,
            descricao,
            payload: qrCodePix.payload(),
            qrCodeImage
        });
    });
});

// Rota para receber comprovante
router.post('/comprovante', upload.single('comprovante'), async (req, res) => {
    const { valor, descricao } = req.body;
    const usuario = req.session.usuario; // ou pegue do pedido
    const comprovantePath = req.file ? req.file.path : null;

    // Envie e-mail para o usuário (exemplo com Gmail)
    if (usuario && usuario.email && comprovantePath) {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'borgesruan051@gmail.com',
                pass: 'dsmq vykv july ydpd'
            }
        });

        await transporter.sendMail({
            from: '"Loja Motos" borgesruan051@gmail.com',
            to: usuario.email,
            subject: 'Comprovante de Pagamento Recebido',
            text: `Recebemos seu comprovante de pagamento no valor de R$ ${valor}. Em breve seu pedido será processado.`,
            attachments: [
                {
                    filename: req.file.originalname,
                    path: comprovantePath
                }
            ]
        });
    }

    res.render('pagamento-confirmado', { valor, descricao });
});

module.exports = router;