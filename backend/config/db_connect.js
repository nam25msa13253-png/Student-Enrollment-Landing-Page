const mysql = require('mysql2');
// Sử dụng mysql2 để kết nối MySQL (Note CTuấn)
require('dotenv').config();
// Sử dụng dotenv để quản lý biến môi trường (Note CTuấn)


const pool = mysql.createPool({ // Tạo kết nối pool đến database (Note CTuấn)
    host: process.env.DB_HOST || 'localhost',//Lấy host từ biến môi trường hoặc mặc định là localhost (Note CTuấn)
    user: process.env.DB_USER || 'root', //Lấy user từ biến môi trường hoặc mặc định là root (Note CTuấn)
    password: process.env.DB_PASSWORD || '',//Lấy password từ biến môi trường hoặc mặc định là rỗng (Note CTuấn)
    database: process.env.DB_NAME || 'hht_academy_db',//Lấy tên database từ biến môi trường hoặc mặc định là hht_academy_db (Note CTuấn)
    waitForConnections: true, //Chờ kết nối nếu không có kết nối sẵn có (Note CTuấn)
    connectionLimit: 20,//Giới hạn số kết nối tối đa trong pool là 20 (Note CTuấn)
    queueLimit: 0//Không giới hạn hàng đợi kết nối (Note CTuấn)
});


const db = pool.promise(); // Sử dụng promise để hỗ trợ async/await (Note CTuấn)


const testConnection = async () => { //Hàm kiểm tra kết nối đến database (Note CTuấn)
    try {
        const connection = await db.getConnection(); //Lấy kết nối từ pool (Note CTuấn)
        console.log(' KẾT NỐI ĐẾN DATABASE THÀNH CÔNG!'); //Thông báo kết nối thành công (Note CTuấn)
        connection.release();//Giải phóng kết nối sau khi kiểm tra (Note CTuấn)
    } catch (error) {//Nếu có lỗi xảy ra trong quá trình kết nối (Note CTuấn)
        console.error(' KẾT NỐI THẤT BẠI:', error.message); //Thông báo lỗi kết nối (Note CTuấn)
        console.error('--> Hãy kiểm tra lại file .env và chắc chắn MySQL đang chạy (XAMPP/MySQL Workbench).'); //Gợi ý kiểm tra file .env và trạng thái MySQL (Note CTuấn)
    }
};

testConnection();

module.exports = db;