// Kiểm tra authentication khi vào teacher.html
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }

    // Kiểm tra role teacher hoặc admin
    if (user.role !== 'teacher' && user.role !== 'admin') {
        alert('Chỉ giảng viên và admin mới có quyền truy cập trang này');
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// Gọi checkAuth khi trang teacher.html tải
if (window.location.pathname.includes('teacher.html')) {
    document.addEventListener('DOMContentLoaded', checkAuth);
}