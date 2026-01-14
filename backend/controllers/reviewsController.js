const db = require('../config/db_connect');

exports.getAllReviews = async (req, res) => {
    try {
        const [reviews] = await db.execute(`
            SELECT r.*, u.name AS user_name, c.title AS course_title
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN courses c ON r.course_id = c.id
            ORDER BY r.created_at DESC
        `);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCourseReviews = async (req, res) => {
    try {
        const [reviews] = await db.execute(`
            SELECT r.*, u.name as user_name, u.avatar as user_avatar 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.course_id = ? 
            ORDER BY r.created_at DESC`,
            [req.params.courseId]
        );
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createReview = async (req, res) => {
    try {
        const { course_id, rating, content } = req.body;
        const user_id = req.user.id;
        await db.execute(
            'INSERT INTO reviews (user_id, course_id, rating, content) VALUES (?, ?, ?, ?)',
            [user_id, course_id, rating, content]
        );
        res.status(201).json({ message: 'Cảm ơn bạn đã đánh giá!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { rating, content } = req.body;
        await db.execute('UPDATE reviews SET rating = ?, content = ? WHERE id = ?', [rating, content, req.params.id]);
        res.json({ message: 'Đã cập nhật đánh giá' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        await db.execute('DELETE FROM reviews WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa đánh giá' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};