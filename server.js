require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors({
  origin: ["https://guialar.net", "https://www.guialar.net"],
  methods: ["GET", "POST"]
}));

app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    mensagem: "API Guia Lar ativa."
  });
});

app.post("/enviar-orcamento", async (req, res) => {
  try {
    const {
      email,
      largura,
      altura,
      area,
      preco,
      pdfBase64,
      nomeFicheiro
    } = req.body;

    if (!email || !largura || !altura || !pdfBase64) {
      return res.status(400).json({
        mensagem: "Faltam dados obrigatórios."
      });
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValido) {
      return res.status(400).json({
        mensagem: "Email inválido."
      });
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();

    await transporter.sendMail({
      from: `"Guia Lar" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: "O seu orçamento - Guia Lar",
      text:
        `Olá,\n\n` +
        `Segue em anexo o seu orçamento.\n\n` +
        `Resumo do pedido:\n` +
        `Largura: ${Number(largura).toFixed(2)} m\n` +
        `Altura: ${Number(altura).toFixed(2)} m\n` +
        `Área: ${Number(area).toFixed(2)} m²\n` +
        `Preço estimado: ${Number(preco).toFixed(2)} €\n\n` +
        `Obrigado,\nGuia Lar`,
      attachments: [
        {
          filename: nomeFicheiro || "orcamento-guia-lar.pdf",
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    return res.json({
      mensagem: "PDF gerado e enviado com sucesso para o seu email."
    });

  } catch (error) {
    console.error("Erro ao enviar orçamento:", error);

    return res.status(500).json({
      mensagem: "Erro ao enviar o email."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ativo na porta ${PORT}`);
});
