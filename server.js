const express = require("express");
const cors = require("cors");

const app = express();

// разрешаем JSON
app.use(express.json());

// разрешаем CORS (пока открыто, для тестового норм)
app.use(cors());

// POST endpoint формы
app.post("/send", (req, res) => {
    const { name, phone, email, message } = req.body;

    // простая проверка
    if (!name || !phone || !email || !message) {
        return res.status(400).json({
            success: false,
            message: "Empty fields",
        });
    }

    console.log("NEW FORM:", req.body);

    res.json({
        success: true,
    });
});

// ВАЖНО: порт для Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server started on port", PORT);
});
