const db = require('../config/db_connect');

const teacherController = {
    // ============================================
    // 1. LẤY TẤT CẢ GIÁO VIÊN (ĐÃ SỬA)
    // ============================================
    getAllTeachers: async (req, res) => {
        try {
            // Query đã sửa: thay td.subject bằng td.specialty
            let query = `
                SELECT 
                    u.id, u.name, u.email, u.phone, u.avatar, u.created_at,
                    td.specialty, td.experience_years, td.qualification,
                    td.rating, td.total_students, td.is_featured, td.bio,
                    COUNT(DISTINCT c.id) as total_courses,
                    COUNT(DISTINCT l.id) as total_lessons
                FROM users u
                LEFT JOIN teacher_details td ON u.id = td.user_id
                LEFT JOIN courses c ON u.id = c.instructor_id
                LEFT JOIN lessons l ON c.id = l.course_id
                WHERE u.role = 'teacher' OR u.role = 'admin'
                GROUP BY u.id, td.id
                ORDER BY u.created_at DESC
            `;

            const [teachers] = await db.execute(query);

            res.json({
                success: true,
                count: teachers.length,
                data: teachers
            });
        } catch (error) {
            console.error('Error in getAllTeachers:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy danh sách giáo viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 2. TÌM KIẾM GIÁO VIÊN (ĐÃ SỬA)
    // ============================================
    searchTeachers: async (req, res) => {
        try {
            const { keyword, subject, min_rating } = req.query;

            let query = `
                SELECT 
                    u.id, u.name, u.email, u.avatar,
                    td.specialty, td.rating, td.total_students, td.experience_years,
                    COUNT(DISTINCT c.id) as total_courses
                FROM users u
                JOIN teacher_details td ON u.id = td.user_id
                LEFT JOIN courses c ON u.id = c.instructor_id
                WHERE (u.role = 'teacher' OR u.role = 'admin')
            `;

            const params = [];

            if (keyword) {
                query += ` AND (u.name LIKE ? OR u.email LIKE ? OR td.bio LIKE ?)`;
                params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
            }

            // Sửa: dùng specialty thay cho subject
            if (subject) {
                query += ` AND td.specialty = ?`;
                params.push(subject);
            }

            if (min_rating) {
                query += ` AND td.rating >= ?`;
                params.push(parseFloat(min_rating));
            }

            query += ` GROUP BY u.id, td.id ORDER BY td.rating DESC`;

            const [teachers] = await db.execute(query, params);

            res.json({
                success: true,
                count: teachers.length,
                data: teachers
            });
        } catch (error) {
            console.error('Error in searchTeachers:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi tìm kiếm giáo viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 3. LẤY CHI TIẾT GIÁO VIÊN (ĐÃ SỬA)
    // ============================================
    getTeacherDetails: async (req, res) => {
        try {
            const { id } = req.params;

            // Lấy thông tin cơ bản - sửa query
            const [teacherInfo] = await db.execute(`
                SELECT 
                    u.*,
                    td.*,
                    (SELECT COUNT(*) FROM courses WHERE instructor_id = u.id) as total_courses,
                    (SELECT COUNT(*) FROM lessons l 
                     JOIN courses c ON l.course_id = c.id 
                     WHERE c.instructor_id = u.id) as total_lessons,
                    (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e
                     JOIN courses c ON e.course_id = c.id
                     WHERE c.instructor_id = u.id) as total_students
                FROM users u
                LEFT JOIN teacher_details td ON u.id = td.user_id
                WHERE u.id = ? AND (u.role = 'teacher' OR u.role = 'admin')
            `, [id]);

            if (teacherInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy giáo viên'
                });
            }

            // Lấy danh sách khóa học
            const [courses] = await db.execute(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT l.id) as lesson_count,
                    COUNT(DISTINCT e.id) as enrollment_count,
                    AVG(r.rating) as avg_rating
                FROM courses c
                LEFT JOIN lessons l ON c.id = l.course_id
                LEFT JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN reviews r ON c.id = r.course_id
                WHERE c.instructor_id = ?
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `, [id]);

            // Lấy thống kê đơn giản hóa
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT c.id) as total_courses,
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT e.user_id) as total_students,
                    AVG(r.rating) as avg_rating
                FROM users u
                LEFT JOIN courses c ON u.id = c.instructor_id
                LEFT JOIN lessons l ON c.id = l.course_id
                LEFT JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN reviews r ON c.id = r.course_id
                WHERE u.id = ?
            `, [id]);

            // Lấy lịch giảng dạy (nếu có bảng teacher_schedules)
            let schedule = [];
            try {
                const [scheduleData] = await db.execute(`
                    SELECT * FROM teacher_schedules
                    WHERE teacher_id = ? 
                    AND schedule_date >= CURDATE()
                    ORDER BY schedule_date, start_time
                `, [id]);
                schedule = scheduleData;
            } catch (scheduleError) {
                // Bảng teacher_schedules có thể không tồn tại, bỏ qua
                console.log('Teacher schedule table might not exist:', scheduleError.message);
            }

            res.json({
                success: true,
                data: {
                    info: teacherInfo[0],
                    courses: courses,
                    stats: stats[0] || {},
                    schedule: schedule
                }
            });
        } catch (error) {
            console.error('Error in getTeacherDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy chi tiết giáo viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 4. CẬP NHẬT THÔNG TIN GIÁO VIÊN (ĐÃ SỬA)
    // ============================================
    updateTeacherDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name, email, phone, bio,
                specialty, experience_years, // Sửa: dùng specialty thay cho subject
                qualification, is_featured
            } = req.body;

            // Kiểm tra quyền
            if (req.user.id != id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền cập nhật thông tin này'
                });
            }

            // Cập nhật bảng users
            await db.execute(`
                UPDATE users 
                SET name = COALESCE(?, name), 
                    email = COALESCE(?, email), 
                    phone = COALESCE(?, phone), 
                    bio = COALESCE(?, bio), 
                    updated_at = NOW()
                WHERE id = ?
            `, [name, email, phone, bio, id]);

            // Cập nhật hoặc tạo teacher_details
            const [existingDetails] = await db.execute(
                'SELECT * FROM teacher_details WHERE user_id = ?',
                [id]
            );

            if (existingDetails.length > 0) {
                await db.execute(`
                    UPDATE teacher_details 
                    SET specialty = COALESCE(?, specialty), 
                        experience_years = COALESCE(?, experience_years), 
                        qualification = COALESCE(?, qualification), 
                        is_featured = COALESCE(?, is_featured), 
                        updated_at = NOW()
                    WHERE user_id = ?
                `, [specialty, experience_years, qualification, is_featured, id]);
            } else {
                await db.execute(`
                    INSERT INTO teacher_details 
                    (user_id, specialty, experience_years, qualification, is_featured)
                    VALUES (?, ?, ?, ?, ?)
                `, [id, specialty, experience_years, qualification, is_featured]);
            }

            // Lấy lại thông tin sau khi cập nhật
            const [updatedTeacher] = await db.execute(`
                SELECT u.*, td.* FROM users u
                LEFT JOIN teacher_details td ON u.id = td.user_id
                WHERE u.id = ?
            `, [id]);

            res.json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: updatedTeacher[0]
            });

        } catch (error) {
            console.error('Error in updateTeacherDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi cập nhật thông tin giáo viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 5. CẬP NHẬT MẬT KHẨU
    // ============================================
    updateTeacherPassword: async (req, res) => {
        try {
            const { id } = req.params;
            const { current_password, new_password } = req.body;

            // Kiểm tra quyền
            if (req.user.id != id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền thay đổi mật khẩu'
                });
            }

            // Lấy mật khẩu hiện tại từ database
            const [user] = await db.execute(
                'SELECT password FROM users WHERE id = ?',
                [id]
            );

            if (user.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }

            // Kiểm tra mật khẩu hiện tại (không dùng bcrypt - giữ nguyên logic cũ)
            const isValid = (current_password === user[0].password); // So sánh trực tiếp

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng'
                });
            }

            // Cập nhật mật khẩu mới (lưu trực tiếp, không hash)
            await db.execute(
                'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
                [new_password, id]
            );

            res.json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });
        } catch (error) {
            console.error('Error in updateTeacherPassword:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi đổi mật khẩu',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 6. LẤY THU NHẬP GIÁO VIÊN (ĐƠN GIẢN HÓA)
    // ============================================
    getTeacherEarnings: async (req, res) => {
        try {
            const { id } = req.params;

            // Kiểm tra quyền
            if (req.user.id != id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền xem thu nhập'
                });
            }

            // Tổng thu nhập đơn giản
            const [earnings] = await db.execute(`
                SELECT 
                    'total_earnings' as type,
                    IFNULL(SUM(te.amount), 0) as amount,
                    COUNT(te.id) as count
                FROM teacher_earnings te
                WHERE te.teacher_id = ? 
                AND te.payment_status = 'paid'
                UNION ALL
                SELECT 
                    'pending_earnings' as type,
                    IFNULL(SUM(te.amount), 0) as amount,
                    COUNT(te.id) as count
                FROM teacher_earnings te
                WHERE te.teacher_id = ? 
                AND te.payment_status = 'pending'
            `, [id, id]);

            res.json({
                success: true,
                data: earnings
            });
        } catch (error) {
            console.error('Error in getTeacherEarnings:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thông tin thu nhập',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 7. LẤY THỐNG KÊ GIÁO VIÊN (ĐƠN GIẢN)
    // ============================================
    getTeacherStatistics: async (req, res) => {
        try {
            const { id } = req.params;

            // Tổng quan đơn giản
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT c.id) as total_courses,
                    COUNT(DISTINCT l.id) as total_lessons,
                    COUNT(DISTINCT e.user_id) as total_students,
                    AVG(r.rating) as avg_rating,
                    COUNT(DISTINCT r.id) as total_reviews
                FROM users u
                LEFT JOIN courses c ON u.id = c.instructor_id
                LEFT JOIN lessons l ON c.id = l.course_id
                LEFT JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN reviews r ON c.id = r.course_id
                WHERE u.id = ?
            `, [id]);

            res.json({
                success: true,
                data: stats[0] || {}
            });
        } catch (error) {
            console.error('Error in getTeacherStatistics:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thống kê giáo viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 8. LẤY LỊCH GIẢNG DẠY (TÙY CHỌN)
    // ============================================
    getTeacherSchedule: async (req, res) => {
        try {
            const { id } = req.params;

            // Kiểm tra bảng teacher_schedules có tồn tại không
            try {
                const [schedule] = await db.execute(`
                    SELECT * FROM teacher_schedules
                    WHERE teacher_id = ?
                    ORDER BY schedule_date, start_time
                    LIMIT 50
                `, [id]);

                res.json({
                    success: true,
                    data: schedule
                });
            } catch (tableError) {
                // Bảng không tồn tại, trả về mảng rỗng
                res.json({
                    success: true,
                    data: [],
                    message: 'Chức năng lịch giảng dạy chưa được thiết lập'
                });
            }
        } catch (error) {
            console.error('Error in getTeacherSchedule:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy lịch giảng dạy',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 9. THÊM ĐÁNH GIÁ CHO GIÁO VIÊN (TÙY CHỌN)
    // ============================================
    addTeacherReview: async (req, res) => {
        try {
            const { teacher_id, rating, comment } = req.body;
            const student_id = req.user.id;

            // Kiểm tra bảng teacher_reviews có tồn tại
            try {
                await db.execute(`
                    INSERT INTO teacher_reviews 
                    (teacher_id, student_id, rating, comment, created_at)
                    VALUES (?, ?, ?, ?, NOW())
                `, [teacher_id, student_id, rating, comment]);

                res.json({
                    success: true,
                    message: 'Đã thêm đánh giá thành công'
                });
            } catch (tableError) {
                res.status(400).json({
                    success: false,
                    message: 'Chức năng đánh giá chưa được thiết lập'
                });
            }
        } catch (error) {
            console.error('Error in addTeacherReview:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi thêm đánh giá',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 10. LẤY ĐÁNH GIÁ CỦA GIÁO VIÊN (TÙY CHỌN)
    // ============================================
    getTeacherReviews: async (req, res) => {
        try {
            const { id } = req.params;

            try {
                const [reviews] = await db.execute(`
                    SELECT 
                        tr.*,
                        u.name as student_name,
                        u.avatar as student_avatar
                    FROM teacher_reviews tr
                    JOIN users u ON tr.student_id = u.id
                    WHERE tr.teacher_id = ?
                    ORDER BY tr.created_at DESC
                    LIMIT 50
                `, [id]);

                res.json({
                    success: true,
                    data: reviews
                });
            } catch (tableError) {
                res.json({
                    success: true,
                    data: [],
                    message: 'Chưa có đánh giá nào'
                });
            }
        } catch (error) {
            console.error('Error in getTeacherReviews:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy đánh giá',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 11. XUẤT DỮ LIỆU GIÁO VIÊN (JSON)
    // ============================================
    exportTeacherData: async (req, res) => {
        try {
            const { id } = req.params;

            // Lấy thông tin giáo viên
            const [teacherInfo] = await db.execute(`
                SELECT 
                    u.*,
                    td.*
                FROM users u
                LEFT JOIN teacher_details td ON u.id = td.user_id
                WHERE u.id = ?
            `, [id]);

            if (teacherInfo.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy giáo viên'
                });
            }

            // Lấy danh sách khóa học
            const [courses] = await db.execute(`
                SELECT * FROM courses 
                WHERE instructor_id = ?
                ORDER BY created_at DESC
            `, [id]);

            const exportData = {
                teacher_info: teacherInfo[0],
                courses: courses,
                export_date: new Date().toISOString()
            };

            res.json({
                success: true,
                data: exportData,
                message: 'Xuất dữ liệu thành công'
            });
        } catch (error) {
            console.error('Error in exportTeacherData:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi xuất dữ liệu',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 12. XÓA GIÁO VIÊN (ADMIN ONLY)
    // ============================================
    deleteTeacher: async (req, res) => {
        try {
            const { id } = req.params;

            // Chỉ admin mới được xóa
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ quản trị viên mới có quyền xóa giáo viên'
                });
            }

            // Kiểm tra giáo viên có tồn tại
            const [teacher] = await db.execute(
                'SELECT * FROM users WHERE id = ? AND role = "teacher"',
                [id]
            );

            if (teacher.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy giáo viên'
                });
            }

            // Xóa (cascade nếu có foreign key)
            await db.execute('DELETE FROM users WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Xóa giáo viên thành công'
            });
        } catch (error) {
            console.error('Error in deleteTeacher:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi xóa giáo viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 13. THỐNG KÊ TẤT CẢ GIÁO VIÊN (đơn giản)
    // ============================================
    getTeachersStats: async (req, res) => {
        try {
            // Chỉ admin mới được xem
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Chỉ quản trị viên mới có quyền xem thống kê'
                });
            }

            // Tổng quan đơn giản
            const [stats] = await db.execute(`
                SELECT 
                    COUNT(DISTINCT u.id) as total_teachers,
                    AVG(td.rating) as avg_rating,
                    SUM(td.total_students) as total_students,
                    SUM(td.total_courses) as total_courses
                FROM users u
                LEFT JOIN teacher_details td ON u.id = td.user_id
                WHERE u.role = 'teacher'
            `);

            // Top 5 giáo viên
            const [topTeachers] = await db.execute(`
                SELECT 
                    u.id, u.name, u.avatar, u.email,
                    td.rating, td.total_students, td.specialty
                FROM users u
                LEFT JOIN teacher_details td ON u.id = td.user_id
                WHERE u.role = 'teacher'
                ORDER BY td.rating DESC
                LIMIT 5
            `);

            res.json({
                success: true,
                data: {
                    overview: stats[0] || {},
                    top_teachers: topTeachers
                }
            });
        } catch (error) {
            console.error('Error in getTeachersStats:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thống kê giảng viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // ============================================
    // 14. TẠO/HOẶC CẬP NHẬT TEACHER_DETAILS
    // ============================================
    upsertTeacherDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const { specialty, experience_years, qualification, bio, is_featured } = req.body;

            // Kiểm tra quyền
            if (req.user.id != id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Không có quyền cập nhật thông tin'
                });
            }

            // Kiểm tra user có phải là teacher không
            const [user] = await db.execute(
                'SELECT role FROM users WHERE id = ?',
                [id]
            );

            if (user.length === 0 || (user[0].role !== 'teacher' && user[0].role !== 'admin')) {
                return res.status(400).json({
                    success: false,
                    message: 'Người dùng không phải là giáo viên'
                });
            }

            // Kiểm tra bảng teacher_details có tồn tại không
            try {
                await db.execute('SELECT 1 FROM teacher_details LIMIT 1');
            } catch (error) {
                // Tạo bảng nếu chưa tồn tại
                await db.execute(`
                    CREATE TABLE IF NOT EXISTS teacher_details (
                        id INT PRIMARY KEY AUTO_INCREMENT,
                        user_id INT NOT NULL,
                        specialty VARCHAR(255),
                        experience_years INT DEFAULT 0,
                        qualification VARCHAR(255),
                        rating DECIMAL(3,2) DEFAULT 0.00,
                        total_students INT DEFAULT 0,
                        is_featured BOOLEAN DEFAULT FALSE,
                        bio TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE KEY unique_user (user_id)
                    )
                `);
            }

            // Kiểm tra đã có thông tin chưa
            const [existing] = await db.execute(
                'SELECT id FROM teacher_details WHERE user_id = ?',
                [id]
            );

            if (existing.length > 0) {
                // Cập nhật
                await db.execute(`
                    UPDATE teacher_details 
                    SET specialty = ?, experience_years = ?, qualification = ?, 
                        bio = ?, is_featured = ?, updated_at = NOW()
                    WHERE user_id = ?
                `, [specialty, experience_years, qualification, bio, is_featured, id]);
            } else {
                // Tạo mới
                await db.execute(`
                    INSERT INTO teacher_details 
                    (user_id, specialty, experience_years, qualification, bio, is_featured)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [id, specialty, experience_years, qualification, bio, is_featured]);
            }

            res.json({
                success: true,
                message: 'Cập nhật thông tin giáo viên thành công'
            });
        } catch (error) {
            console.error('Error in upsertTeacherDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi server khi cập nhật thông tin giáo viên',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = teacherController;