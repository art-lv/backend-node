require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.post("/send", async (req, res) => {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email) {
        return res.status(400).json({
            success: false,
            error: "Заполните обязательные поля",
        });
    }

    try {
        await transporter.sendMail({
            from: `Form <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "Новая заявка с сайта",
            text: `Имя: ${name}\nТелефон: ${phone}\nEmail: ${email}\nСообщение: ${message}`,
        });

        res.json({ success: true, message: "Письмо отправлено" });
    } catch (error) {
        console.error("Email error:", error);
        res.status(500).json({
            success: false,
            error: "Ошибка отправки письма",
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
