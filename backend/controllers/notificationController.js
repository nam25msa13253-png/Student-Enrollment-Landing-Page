const db = require('../config/db_connect');

exports.getNotifications = async (req, res) => {
    try {
        const [contacts] = await db.execute(
            "SELECT id, name, subject, created_at, 'contact' as type FROM contacts WHERE status = 'Mới' ORDER BY created_at DESC"
        );
        const [reviews] = await db.execute(
            "SELECT r.id, u.name, c.title as subject, r.created_at, 'review' as type FROM reviews r JOIN users u ON r.user_id = u.id JOIN courses c ON r.course_id = c.id ORDER BY r.created_at DESC LIMIT 5"
        );
        const notifications = [...contacts, ...reviews].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        // Tùy thuộc vào schema của bạn, có thể update status contact hoặc đánh dấu review đã đọc
        res.json({ message: 'Đã đánh dấu là đã đọc' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};