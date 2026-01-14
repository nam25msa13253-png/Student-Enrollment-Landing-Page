const db = require('../config/db_connect');

// 1. Cập nhật tiến độ học tập
exports.updateProgress = async (req, res) => {
    try {
        const { lesson_id, is_completed } = req.body;
        const user_id = req.user.id;
        await db.execute(`
            INSERT INTO progress (user_id, lesson_id, is_completed) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE is_completed = ?, last_viewed = NOW()`,
            [user_id, lesson_id, is_completed, is_completed]
        );
        res.json({ success: true, message: 'Đã cập nhật tiến độ' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Lấy tiến độ học tập
exports.getProgress = async (req, res) => {
    try {
        const [progress] = await db.execute(`
            SELECT p.* FROM progress p
            JOIN lessons l ON p.lesson_id = l.id
            JOIN chapters c ON l.chapter_id = c.id
            WHERE p.user_id = ? AND c.course_id = ?`,
            [req.user.id, req.params.courseId]
        );
        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. Lấy lộ trình học tập
exports.getCurriculum = async (req, res) => {
    try {
        const [chapters] = await db.execute('SELECT * FROM chapters WHERE course_id = ? ORDER BY order_index ASC', [req.params.id || req.params.courseId]);
        for (let chapter of chapters) {
            const [lessons] = await db.execute('SELECT * FROM lessons WHERE chapter_id = ? ORDER BY order_index ASC', [chapter.id]);
            chapter.lessons = lessons;
        }
        res.json(chapters);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 4. Quản lý Chương (Chapters)
exports.createChapter = async (req, res) => {
    try {
        await db.execute('INSERT INTO chapters (course_id, title) VALUES (?, ?)', [req.body.course_id, req.body.title]);
        res.status(201).json({ message: 'Thêm chương thành công' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateChapter = async (req, res) => {
    try {
        await db.execute('UPDATE chapters SET title = ? WHERE id = ?', [req.body.title, req.params.id]);
        res.json({ message: 'Cập nhật chương thành công' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteChapter = async (req, res) => {
    try {
        await db.execute('DELETE FROM chapters WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa chương' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. Quản lý Bài học (Lessons)
exports.createLesson = async (req, res) => {
    try {
        const { chapter_id, title, type, video_id, duration, content } = req.body;
        await db.execute('INSERT INTO lessons (chapter_id, title, type, video_id, duration, content) VALUES (?, ?, ?, ?, ?, ?)',
            [chapter_id, title, type, video_id, duration, content]);
        res.status(201).json({ message: 'Thêm bài học thành công' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateLesson = async (req, res) => {
    try {
        const { title, type, video_id, duration, content } = req.body;
        await db.execute('UPDATE lessons SET title=?, type=?, video_id=?, duration=?, content=? WHERE id=?',
            [title, type, video_id, duration, content, req.params.id]);
        res.json({ message: 'Cập nhật bài học thành công' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteLesson = async (req, res) => {
    try {
        await db.execute('DELETE FROM lessons WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa bài học' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};