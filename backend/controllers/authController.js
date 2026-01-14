const db = require('../config/db_connect');// Kết nối đến database (Note CTuấn)
const jwt = require('jsonwebtoken');// Thư viện tạo và xác thực JWT (Note CTuấn)
const bcrypt = require('bcryptjs');// Thư viện mã hóa mật khẩu (Note CTuấn)
const nodemailer = require('nodemailer');// Thư viện gửi email (Note CTuấn)

const JWT_SECRET = process.env.JWT_SECRET || 'hht_academy_secret_key_2024';

// Cấu hình gửi mail (Đặt ở ngoài cùng để tái sử dụng)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nguyencongtuan2612@gmail.com',
        pass: 'abwysjawqqmhvtbn'
    }
});

const validateRegistrationData = (name, email, password) => {
    // ... logic validation cũ ...
    const nameRegex = /\d/;
    if (nameRegex.test(name)) return { valid: false, message: 'Tên không được chứa ký tự số.' };
    if (name.trim() !== name) return { valid: false, message: 'Tên không được chứa khoảng trắng thừa.' };

    const emailParts = email.split('@');
    if (emailParts.length !== 2) return { valid: false, message: 'Định dạng email không hợp lệ.' };

    const minLength = 6;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

    if (password.length < minLength) return { valid: false, message: 'Mật khẩu phải có tối thiểu 6 ký tự.' };
    if (!uppercaseRegex.test(password)) return { valid: false, message: 'Mật khẩu phải chứa ít nhất 1 ký tự viết hoa.' };
    if (!lowercaseRegex.test(password)) return { valid: false, message: 'Mật khẩu phải chứa ít nhất 1 ký tự viết thường.' };
    if (!specialCharRegex.test(password)) return { valid: false, message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%...).' };

    return { valid: true };
};

// Hàm xác định role dựa trên email
const determineUserRole = (email, currentRole) => {
    const lowerEmail = email.toLowerCase();

    // Quy tắc phân loại role
    const teacherPatterns = [
        'teacher', 'giangvien', 'gv_', 'gv.', 'giáo viên',
        'instructor', 'lecturer', 'trainer', 'faculty'
    ];

    const adminPatterns = [
        'admin', 'administrator', 'superadmin',
        'quanly', 'manager', 'moderator'
    ];

    // Kiểm tra admin trước (ưu tiên cao nhất)
    for (const pattern of adminPatterns) {
        if (lowerEmail.includes(pattern)) {
            return 'admin';
        }
    }

    // Kiểm tra teacher
    for (const pattern of teacherPatterns) {
        if (lowerEmail.includes(pattern)) {
            return 'teacher';
        }
    }

    // Kiểm tra domain đặc biệt
    if (lowerEmail.endsWith('@hht.edu.vn')) {
        return 'teacher'; // Mặc định email @hht.edu.vn là giáo viên
    }

    if (lowerEmail.endsWith('@admin.hht.edu.vn')) {
        return 'admin';
    }

    // Giữ nguyên role từ database nếu không khớp pattern nào
    return currentRole || 'student';
};

exports.register = async (req, res) => {
    try {
        // Lấy email từ request người dùng gửi lên
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
        }

        const validation = validateRegistrationData(name, email, password);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        const hashedPassword = password; // Lưu ý: nên mã hóa password thực tế

        // Xác định role khi đăng ký dựa trên email
        const userRole = determineUserRole(email, 'student');

        await db.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, userRole]  // Dùng role đã xác định
        );

        const mailOptions = {
            from: '"HHT Academy" <no-reply@hht.edu.vn>',
            to: email,
            subject: userRole === 'teacher'
                ? 'Chào mừng Giảng viên đến với HHT Academy!'
                : 'Chào mừng bạn đến với HHT Academy!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #000000ff; text-align: center;">Xin chào ${name}!</h2>
                    <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>HHT Academy</strong>.</p>
                    <p>Tài khoản của bạn đã được tạo thành công với:</p>
                    <ul>
                        <li>Email: <strong>${email}</strong></li>
                        <li>Vai trò: <strong>${userRole === 'teacher' ? 'Giảng viên' : userRole === 'admin' ? 'Quản trị viên' : 'Học viên'}</strong></li>
                    </ul>
                    ${userRole === 'teacher'
                    ? '<p>Bạn có thể truy cập trang dành cho giảng viên để quản lý khóa học và sử dụng các công cụ AI hỗ trợ giảng dạy.</p>'
                    : '<p>Bây giờ bạn có thể đăng nhập và bắt đầu hành trình học tập ngay hôm nay.</p>'
                }
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="http://127.0.0.1:5500/frontend/login.html" style="background-color: #000000ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đăng Nhập Ngay</a>
                    </div>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Lỗi gửi email:", emailError);
        }

        res.status(201).json({
            message: 'Đăng ký thành công! Vui lòng kiểm tra email của bạn.',
            role: userRole
        });

    } catch (error) {
        console.error("Lỗi đăng ký:", error);
        res.status(500).json({ message: 'Lỗi server khi xử lý đăng ký.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu!' });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        const user = users[0];
        let isMatch = false;

        // So sánh mật khẩu (không mã hóa)
        if (user.password === password) {
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng!' });
        }

        // Xác định role dựa trên email (ưu tiên cao hơn role trong database)
        const determinedRole = determineUserRole(email, user.role);

        // Nếu role khác với database, cập nhật lại database
        if (determinedRole !== user.role) {
            await db.execute('UPDATE users SET role = ? WHERE id = ?', [determinedRole, user.id]);
            user.role = determinedRole; // Cập nhật role cho response
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Đăng nhập thành công!',
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ message: 'Lỗi server khi xử lý đăng nhập.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await db.execute('SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?', [userId]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const user = users[0];

        // Xác định lại role khi lấy thông tin user (để đảm bảo nhất quán)
        const determinedRole = determineUserRole(user.email, user.role);

        // Trả về role đã xác định
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: determinedRole,
            avatar: user.avatar,
            created_at: user.created_at
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

// Hàm helper để debug/troubleshoot
exports.debugRoleAssignment = (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp email' });
    }

    const role = determineUserRole(email, 'student');

    res.json({
        email: email,
        determined_role: role,
        patterns_matched: {
            teacher: determineUserRole(email, 'student') === 'teacher',
            admin: determineUserRole(email, 'student') === 'admin',
            student: determineUserRole(email, 'student') === 'student'
        }
    });
};