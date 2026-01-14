const db = require('../config/db_connect');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'Thiếu các trường bắt buộc: name, email, subject, message.' });
        }

        await db.execute(
            'INSERT INTO contacts (name, email, phone, subject, message, status) VALUES (?, ?, ?, ?, ?, "Mới")',
            [name, email, phone, subject, message]
        );
        res.status(201).json({ message: 'Yêu cầu liên hệ đã được gửi thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllContacts = async (req, res) => {
    try {
        const [contacts] = await db.execute('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getContactById = async (req, res) => {
    try {
        const [contact] = await db.execute('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
        if (contact.length === 0) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
        res.json(contact[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Mới', 'Đã xem', 'Hoàn thành'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }
        await db.execute('UPDATE contacts SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        await db.execute('DELETE FROM contacts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Đã xóa yêu cầu liên hệ' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};