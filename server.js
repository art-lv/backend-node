require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const dns = require("dns");

// ВАЖНО: отключаем IPv6, форсируем IPv4
dns.setDefaultResultOrder("ipv4first");

const app = express();

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

console.log("=== STARTUP CHECK ===");
console.log("EMAIL_USER set:", !!process.env.EMAIL_USER);
console.log("EMAIL_PASS set:", !!process.env.EMAIL_PASS);
console.log("DNS order:", dns.getDefaultResultOrder());
console.log("=====================");

// Настройка транспортера с явным указанием хоста и порта
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587, // Используем 587 вместо 465
    secure: false, // false для 587, true для 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    debug: true,
    logger: true,
    tls: {
        rejectUnauthorized: false, // Временно для диагностики
    },
});

// Проверка соединения
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ SMTP VERIFY ERROR:", error);
    } else {
        console.log("✅ SMTP ready to send");
    }
});

app.post("/send", async (req, res) => {
    console.log("\n=== NEW REQUEST ===");
    console.log("Body:", req.body);

    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email) {
        return res.status(400).json({
            success: false,
            error: "Заполните обязательные поля",
        });
    }

    try {
        console.log("📧 Sending email...");

        const info = await transporter.sendMail({
            from: `"Contact Form" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "Новая заявка с сайта",
            text: `Имя: ${name}\nТелефон: ${phone}\nEmail: ${email}\nСообщение: ${message || "нет"}`,
            html: `
                <h3>Новая заявка</h3>
                <p><strong>Имя:</strong> ${name}</p>
                <p><strong>Телефон:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Сообщение:</strong> ${message || "нет"}</p>
            `,
        });

        console.log("✅ Email sent:", info.messageId);
        res.json({ success: true, message: "Письмо отправлено" });
    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Ошибка отправки",
            details: error.code,
        });
    }
});

app.get("/test", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server on port ${PORT}`);
});
