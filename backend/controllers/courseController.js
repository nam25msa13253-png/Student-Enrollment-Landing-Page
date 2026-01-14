const db = require('../config/db_connect');

exports.getAllCourses = async (req, res) => {
    try {
        const query = `
            SELECT c.*, u.name as instructor_name, 
            (SELECT COUNT(*) FROM lessons l JOIN chapters ch ON l.chapter_id = ch.id WHERE ch.course_id = c.id) as lesson_count
            FROM courses c 
            LEFT JOIN users u ON c.instructor_id = u.id 
            ORDER BY c.created_at DESC
        `;
        const [courses] = await db.execute(query);
        res.json(courses);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCourseById = async (req, res) => {
    try {
        const [courses] = await db.execute(`SELECT * FROM courses WHERE id = ?`, [req.params.id]);
        if (courses.length === 0) return res.status(404).json({ message: 'Không tìm thấy khóa học' });
        res.json(courses[0]);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createCourse = async (req, res) => {
    try {
        const { title, price, image, description, category_id } = req.body;
        await db.execute(`INSERT INTO courses (title, description, price, image, instructor_id, category_id) VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, price, image, req.user.id, category_id || 1]);
        res.status(201).json({ message: 'Tạo khóa học thành công' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateCourse = async (req, res) => {
    try {
        const { title, price, image, description } = req.body;
        await db.execute(`UPDATE courses SET title=?, price=?, image=?, description=? WHERE id=?`,
            [title, price, image, description, req.params.id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteCourse = async (req, res) => {
    try {
        await db.execute(`DELETE FROM courses WHERE id=?`, [req.params.id]);
        res.json({ message: 'Đã xóa khóa học' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// Enrollment Management
exports.getAllEnrollments = async (req, res) => {
    try {
        const [list] = await db.execute(`
            SELECT e.*, u.name as student_name, c.title as course_title 
            FROM enrollments e 
            JOIN users u ON e.user_id = u.id 
            JOIN courses c ON e.course_id = c.id
            ORDER BY e.enrollment_date DESC
        `);
        res.json(list);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMyEnrollments = async (req, res) => {
    try {
        const [list] = await db.execute('SELECT e.*, c.title, c.image FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ?', [req.user.id]);
        res.json(list);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createEnrollment = async (req, res) => {
    try {
        const { course_id, price_paid } = req.body;
        await db.execute('INSERT INTO enrollments (user_id, course_id, price_paid, status) VALUES (?, ?, ?, "active")', [req.user.id, course_id, price_paid]);
        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateEnrollmentStatus = async (req, res) => {
    try {
        await db.execute('UPDATE enrollments SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ message: 'Cập nhật thành công' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// Stats
exports.getStats = async (req, res) => {
    try {
        const [[u]] = await db.execute('SELECT COUNT(*) as total FROM users WHERE role="student"');
        const [[c]] = await db.execute('SELECT COUNT(*) as total FROM courses');
        const [[r]] = await db.execute('SELECT SUM(price_paid) as total FROM enrollments WHERE status="active"');
        res.json({ students: u.total, courses: c.total, revenue: r.total || 0 });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getRevenueStats = async (req, res) => {
    try {
        const [data] = await db.execute('SELECT DATE_FORMAT(enrollment_date, "%Y-%m") as month, SUM(price_paid) as total FROM enrollments GROUP BY month');
        res.json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getEnrollmentStats = async (req, res) => {
    try {
        const [data] = await db.execute('SELECT c.title, COUNT(e.id) as count FROM courses c LEFT JOIN enrollments e ON c.id = e.course_id GROUP BY c.id');
        res.json(data);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// Categories
exports.getAllCategories = async (req, res) => {
    try {
        const [cats] = await db.execute('SELECT * FROM categories');
        res.json(cats);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCoursesByCategory = async (req, res) => {
    try {
        const [list] = await db.execute('SELECT * FROM courses WHERE category_id = ?', [req.params.id]);
        res.json(list);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createCategory = async (req, res) => {
    try {
        await db.execute('INSERT INTO categories (name, description) VALUES (?, ?)', [req.body.name, req.body.description]);
        res.status(201).json({ message: 'Đã thêm danh mục' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateCategory = async (req, res) => {
    try {
        await db.execute('UPDATE categories SET name=?, description=? WHERE id=?', [req.body.name, req.body.description, req.params.id]);
        res.json({ message: 'Đã cập nhật' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteCategory = async (req, res) => {
    try {
        await db.execute('DELETE FROM categories WHERE id=?', [req.params.id]);
        res.json({ message: 'Đã xóa' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.searchCourses = async (req, res) => {
    try {
        const term = `%${req.query.keyword}%`;
        const [courses] = await db.execute(`SELECT * FROM courses WHERE title LIKE ?`, [term]);
        res.json(courses);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCurriculum = async (req, res) => {
    try {
        const [chapters] = await db.execute('SELECT * FROM chapters WHERE course_id = ? ORDER BY order_index', [req.params.id]);
        for (let chap of chapters) {
            const [lessons] = await db.execute('SELECT * FROM lessons WHERE chapter_id = ? ORDER BY order_index', [chap.id]);
            chap.lessons = lessons;
        }
        res.json(chapters);
    } catch (e) { res.status(500).json({ message: e.message }); }
};