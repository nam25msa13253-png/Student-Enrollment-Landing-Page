const db = require('../config/db_connect');
const bcrypt = require('bcryptjs');

// 1. Lấy tất cả người dùng (Học viên)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, name, email, role, avatar, created_at FROM users WHERE role = "student" ORDER BY id DESC LIMIT 300');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Lấy chi tiết một người dùng
exports.getUserById = async (req, res) => {
    try {
        const [user] = await db.execute('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?', [req.params.id]);
        if (user.length === 0) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        res.json(user[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Tạo người dùng mới
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });

        const [exists] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (exists.length > 0) return res.status(400).json({ message: 'Email đã tồn tại!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'student']);

        res.status(201).json({ message: 'Cấp tài khoản thành công!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 4. Cập nhật thông tin người dùng (Khắc phục lỗi dòng 104)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, role } = req.body;
        await db.execute('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, req.params.id]);
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 5. Cập nhật quyền hạn
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        res.json({ message: 'Đã cập nhật quyền hạn!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 6. Xóa người dùng
exports.deleteUser = async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa người dùng vĩnh viễn!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 7. Cập nhật Profile cá nhân
exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        await db.execute('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [name, avatar, req.user.id]);
        res.json({ message: 'Cập nhật thông tin thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 8. Đổi mật khẩu
exports.updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);

        // Hỗ trợ cả plain text (cho demo) và bcrypt
        let isMatch = (oldPassword === users[0].password);
        if (!isMatch) isMatch = await bcrypt.compare(oldPassword, users[0].password);

        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};