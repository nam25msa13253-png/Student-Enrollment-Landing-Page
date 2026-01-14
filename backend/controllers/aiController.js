const db = require('../config/db_connect');

// ============================================
// 1. PUBLIC ROUTES (CHO GIẢNG VIÊN/HỌC VIÊN)
// ============================================

// [QUAN TRỌNG] Hàm lấy danh sách Categories (Sửa lỗi crash server)
exports.getAiCategories = async (req, res) => {
    try {
        const query = 'SELECT * FROM categories ORDER BY id ASC';
        const [results] = await db.execute(query);
        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Error in getAiCategories:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// [QUAN TRỌNG] Hàm lấy Services gom nhóm theo Categories (Sửa lỗi crash server)
exports.getAiServicesByCategories = async (req, res) => {
    try {
        // Lấy categories
        const [categories] = await db.execute('SELECT * FROM categories');
        // Lấy tất cả services
        const [services] = await db.execute('SELECT * FROM ai_services');

        // Ghép data thủ công trong JS
        const data = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            services: services.filter(s => s.category_id === cat.id)
        }));

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error in getAiServicesByCategories:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy danh sách AI services theo Category (Có thông tin đăng nhập)
exports.getAiServices = async (req, res) => {
    try {
        const { category_id } = req.query;

        if (!category_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu category_id'
            });
        }

        const query = `
            SELECT 
                s.id,
                s.service_name AS name,
                c.name AS category,
                s.official_url AS url,
                s.logo_url AS icon,
                s.description,
                s.is_premium,
                cred.login_user AS email,
                cred.login_pass AS password,
                cred.api_key,
                p.prompt_text AS prompt
            FROM ai_services s
            LEFT JOIN categories c ON s.category_id = c.id
            LEFT JOIN ai_credentials cred ON s.id = cred.service_id
            LEFT JOIN ai_prompts p ON s.id = p.service_id
            WHERE s.category_id = ?
        `;

        const [results] = await db.execute(query, [category_id]);

        const formattedData = results.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            url: item.url,
            icon: item.icon,
            description: item.description,
            is_premium: item.is_premium,
            credentials: {
                email: item.email,
                password: item.password,
                api_key: item.api_key
            },
            prompt: item.prompt
        }));

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error in getAiServices:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server: ' + error.message
        });
    }
};

// Tìm kiếm AI services
exports.searchAiServices = async (req, res) => {
    try {
        const { keyword } = req.query;
        const searchTerm = `%${keyword}%`;

        const query = `
            SELECT s.*, c.name as category_name 
            FROM ai_services s
            LEFT JOIN categories c ON s.category_id = c.id
            WHERE s.service_name LIKE ? OR s.description LIKE ?
        `;

        const [results] = await db.execute(query, [searchTerm, searchTerm]);
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy services theo premium status
exports.getPremiumAiServices = async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM ai_services WHERE is_premium = 1');
        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// ============================================
// 2. ADMIN ROUTES (QUẢN LÝ)
// ============================================

// Lấy tất cả AI services
exports.getAllAiServices = async (req, res) => {
    try {
        const query = `
            SELECT s.*, c.name as category_name 
            FROM ai_services s
            LEFT JOIN categories c ON s.category_id = c.id
            ORDER BY s.id ASC
        `;
        const [results] = await db.execute(query);
        res.json({ success: true, data: results, total: results.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy services phân trang
exports.getAiServicesPaginated = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const [count] = await db.execute('SELECT COUNT(*) as total FROM ai_services');
        const [results] = await db.execute('SELECT * FROM ai_services LIMIT ? OFFSET ?', [parseInt(limit), parseInt(offset)]);
        res.json({ success: true, data: results, pagination: { total: count[0].total } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy AI service theo ID
exports.getAiServiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const [results] = await db.execute('SELECT * FROM ai_services WHERE id = ?', [id]);
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        res.json({ success: true, data: results[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Tạo AI service mới
exports.createAiService = async (req, res) => {
    try {
        const { service_name, category_id, official_url, logo_url, description, is_premium } = req.body;
        const query = `INSERT INTO ai_services (service_name, category_id, official_url, logo_url, description, is_premium) VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(query, [service_name, category_id, official_url, logo_url, description, is_premium || 0]);
        res.status(201).json({ success: true, message: 'Tạo thành công', data: { id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Cập nhật AI service
exports.updateAiService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service_name, category_id, official_url, logo_url, description, is_premium } = req.body;
        const query = `UPDATE ai_services SET service_name=?, category_id=?, official_url=?, logo_url=?, description=?, is_premium=? WHERE id=?`;
        await db.execute(query, [service_name, category_id, official_url, logo_url, description, is_premium, id]);
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Xóa AI service
exports.deleteAiService = async (req, res) => {
    try {
        await db.execute('DELETE FROM ai_services WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};