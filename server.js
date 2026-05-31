require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

// НАСТРОЙКА ПОЧТЫ
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    family: 4,

    connectionTimeout: 60000, // 60 секунд на подключение
    socketTimeout: 60000, // 60 секунд на ожидание
});

// Тестовый эндпоинт
app.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

// Эндпоинт на отправку письма
app.post("/send", async (req, res) => {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email) {
        return res.status(400).json({
            success: false,
            error: "Заполните обязательные поля",
        });
    }

    try {
        // Письмо владельцу
        await transporter.sendMail({
            from: `"Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            cc: email, // Копия пользователю (по ТЗ)
            subject: `Новая заявка: ${name}`,
            text: `
Имя: ${name}
Телефон: ${phone}
Email: ${email}
Сообщение: ${message}
            `.trim(),
        });

        res.json({
            success: true,
            message: "Заявка отправлена!",
        });
    } catch (error) {
        console.error("❌ Email error:", error.code, error.message);

        res.status(500).json({
            success: false,
            error: "Ошибка отправки",
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
