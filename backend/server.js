const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình CORS để Frontend gọi được API
app.use(cors({
    origin: '*', // Trong môi trường dev để * cho tiện, production nên giới hạn domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware parse JSON
app.use(express.json());

// Import Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Route trang chủ (Health check)
app.get('/', (req, res) => {
    res.send('🚀 Backend HHT Academy Enterprise đang chạy ổn định!');
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📡 API Endpoint: http://localhost:${PORT}/api`);
    console.log(`=============================================`);
}); 