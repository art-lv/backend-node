require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// Расширенные настройки CORS для Render
app.use(
    cors({
        origin: "*", // Временно для теста
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логируем все входящие запросы
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log("Headers:", req.headers);
    next();
});

// Проверка переменных окружения при старте
console.log("=== STARTUP CHECK ===");
console.log("EMAIL_USER exists:", !!process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
console.log(
    "EMAIL_USER value:",
    process.env.EMAIL_USER
        ? process.env.EMAIL_USER.substring(0, 5) + "..."
        : "missing",
);
console.log("PORT:", process.env.PORT || 3000);
console.log("=====================");

// Создаем транспортер с расширенными настройками
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Таймауты для Render
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: true,
    logger: true,
});

// Проверяем соединение при старте
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ SMTP CONNECTION ERROR:", error);
        console.error("Error details:", {
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
        });
    } else {
        console.log("✅ SMTP connection verified successfully");
    }
});

// Основной эндпоинт
app.post("/send", async (req, res) => {
    console.log("\n=== NEW REQUEST RECEIVED ===");
    console.log("Time:", new Date().toISOString());
    console.log("Body:", req.body);

    // Устанавливаем таймаут ответа
    req.setTimeout(30000);
    res.setTimeout(30000);

    const { name, phone, email, message } = req.body;

    // Валидация
    if (!name || !phone || !email) {
        console.log("❌ Validation failed: missing fields");
        return res.status(400).json({
            success: false,
            error: "Заполните обязательные поля",
            missing: {
                name: !name,
                phone: !phone,
                email: !email,
            },
        });
    }

    try {
        console.log("📧 Preparing to send email...");
        console.log("To:", process.env.EMAIL_USER);
        console.log("From:", `Form <${process.env.EMAIL_USER}>`);

        const mailOptions = {
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
        };

        console.log("⏳ Sending...");
        const info = await transporter.sendMail(mailOptions);

        console.log("✅ Email sent successfully!");
        console.log("Message ID:", info.messageId);
        console.log("Response:", info.response);

        res.json({
            success: true,
            message: "Письмо отправлено",
            messageId: info.messageId,
        });
    } catch (error) {
        console.error("\n❌ EMAIL ERROR:");
        console.error("Error name:", error.name);
        console.error("Error code:", error.code);
        console.error("Error command:", error.command);
        console.error("Error response:", error.response);
        console.error("Error responseCode:", error.responseCode);
        console.error("Full error:", error);

        // Отправляем детальную ошибку клиенту
        res.status(500).json({
            success: false,
            error: "Ошибка отправки письма",
            details: {
                code: error.code || "unknown",
                message: error.message,
                responseCode: error.responseCode,
                command: error.command,
            },
        });
    }

    console.log("=== REQUEST FINISHED ===\n");
});

// Тестовый эндпоинт для проверки работы сервера
app.get("/test", (req, res) => {
    console.log("✅ Test endpoint hit");
    res.json({
        status: "ok",
        time: new Date().toISOString(),
        env: {
            emailUserSet: !!process.env.EMAIL_USER,
            port: process.env.PORT,
        },
    });
});

// Health check для Render
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy" });
});

// Обработка 404
app.use((req, res) => {
    console.log("❌ 404 Not Found:", req.method, req.path);
    res.status(404).json({ error: "Not found" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("❌ Global error handler:", err);
    res.status(500).json({
        error: "Internal server error",
        message: err.message,
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server started on port ${PORT}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
    console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing server...");
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
