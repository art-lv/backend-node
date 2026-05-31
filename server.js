require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(express.json());
app.use(cors());

// Проверка env
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

// Настройка SMTP
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },

    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
});

// Проверяем SMTP при запуске
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ SMTP VERIFY ERROR:");
        console.error(error);
    } else {
        console.log("✅ SMTP READY");
    }
});

// Тестовый эндпоинт
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        time: new Date().toISOString(),
    });
});

// Отправка формы
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
            from: `"Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            cc: email,
            subject: `Новая заявка: ${name}`,
            text: `
Имя: ${name}
Телефон: ${phone}
Email: ${email}
Сообщение: ${message || "-"}
            `.trim(),
        });

        console.log(`✅ Email sent from ${email}`);

        res.json({
            success: true,
            message: "Заявка отправлена!",
        });
    } catch (error) {
        console.error("❌ SENDMAIL ERROR");
        console.error("Code:", error.code);
        console.error("Command:", error.command);
        console.error("Message:", error.message);
        console.error(error);

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
