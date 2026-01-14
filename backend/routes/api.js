const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const courseController = require('../controllers/courseController');
const userController = require('../controllers/userController');
const teacherController = require('../controllers/teacherController');
const aiController = require('../controllers/aiController');
const lessonController = require('../controllers/lessonController');
const contactController = require('../controllers/contactController');
const reviewsController = require('../controllers/reviewsController');
const notificationController = require('../controllers/notificationController');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({
            success: false,
            message: 'Thiếu Token xác thực'
        });
    }

    try {
        const cleanToken = token.replace('Bearer ', '');
        req.user = jwt.verify(cleanToken, process.env.JWT_SECRET || 'hht_academy_secret_key_2024');
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Token hết hạn hoặc không hợp lệ'
        });
    }
};

// ============================================
// MIDDLEWARE - PHÂN QUYỀN
// ============================================
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }
        next();
    };
};

// ============================================
// 1. AUTHENTICATION ROUTES
// ============================================
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);

// ============================================
// 2. COURSE ROUTES
// ============================================
router.get('/courses', courseController.getAllCourses);
router.get('/courses/search', courseController.searchCourses);
router.get('/courses/:id', courseController.getCourseById);
router.get('/courses/:id/curriculum', courseController.getCurriculum);
router.get('/stats', verifyToken, authorize(['admin']), courseController.getStats);

// Protected routes - require authentication
router.post('/courses', verifyToken, authorize(['teacher', 'admin']), courseController.createCourse);
router.put('/courses/:id', verifyToken, authorize(['teacher', 'admin']), courseController.updateCourse);
router.delete('/courses/:id', verifyToken, authorize(['admin']), courseController.deleteCourse);

// ============================================
// 3. TEACHER ROUTES (NÂNG CẤP MỚI)
// ============================================
// Public routes (không cần auth)
router.get('/teachers/public', teacherController.getAllTeachers);
router.get('/teachers/search', teacherController.searchTeachers);
router.get('/teachers/:id/public', teacherController.getTeacherDetails);
router.get('/teachers/:id/reviews', teacherController.getTeacherReviews);

// Protected routes (cần auth)
router.get('/teachers', verifyToken, authorize(['admin']), teacherController.getAllTeachers);
router.get('/teachers/:id', verifyToken, authorize(['admin', 'teacher']), teacherController.getTeacherDetails);
router.put('/teachers/:id/details', verifyToken, authorize(['admin', 'teacher']), teacherController.updateTeacherDetails);
router.put('/teachers/:id/password', verifyToken, authorize(['admin', 'teacher']), teacherController.updateTeacherPassword);

// Teacher earnings & statistics
router.get('/teachers/:id/earnings', verifyToken, authorize(['admin', 'teacher']), teacherController.getTeacherEarnings);
router.get('/teachers/:id/statistics', verifyToken, authorize(['admin', 'teacher']), teacherController.getTeacherStatistics);
router.get('/teachers/:id/schedule', verifyToken, authorize(['admin', 'teacher']), teacherController.getTeacherSchedule);

// Teacher reviews (students can add reviews)
router.post('/teachers/reviews', verifyToken, authorize(['student']), teacherController.addTeacherReview);

// Admin only routes
router.get('/teachers/:id/export', verifyToken, authorize(['admin']), teacherController.exportTeacherData);
router.delete('/teachers/:id', verifyToken, authorize(['admin']), teacherController.deleteTeacher);
router.get('/stats/teachers', verifyToken, authorize(['admin']), teacherController.getTeachersStats);

// ============================================
// 4. AI SERVICES ROUTES (THÊM MỚI HOÀN CHỈNH)
// ============================================
// Public routes (không cần auth)
router.get('/ai/services', aiController.getAiServices); // Lấy services theo category_id
router.get('/ai/services/categories', aiController.getAiCategories); // Lấy danh sách categories
router.get('/ai/services/by-categories', aiController.getAiServicesByCategories); // Lấy services theo nhóm categories
router.get('/ai/services/search', aiController.searchAiServices); // Tìm kiếm services
router.get('/ai/services/premium', aiController.getPremiumAiServices); // Lấy premium services

// Protected routes (admin only)
router.get('/ai/all-services', verifyToken, authorize(['admin']), aiController.getAllAiServices);
router.get('/ai/all-services/paginated', verifyToken, authorize(['admin']), aiController.getAiServicesPaginated);
router.get('/ai/services/:id', verifyToken, authorize(['admin']), aiController.getAiServiceById);
router.post('/ai/services', verifyToken, authorize(['admin']), aiController.createAiService);
router.put('/ai/services/:id', verifyToken, authorize(['admin']), aiController.updateAiService);
router.delete('/ai/services/:id', verifyToken, authorize(['admin']), aiController.deleteAiService);
// ============================================
// 5. CHAPTER & LESSON ROUTES
// ============================================
// Chapter routes
router.post('/chapters', verifyToken, authorize(['teacher', 'admin']), lessonController.createChapter);
router.put('/chapters/:id', verifyToken, authorize(['teacher', 'admin']), lessonController.updateChapter);
router.delete('/chapters/:id', verifyToken, authorize(['teacher', 'admin']), lessonController.deleteChapter);

// Lesson routes
router.post('/lessons', verifyToken, authorize(['teacher', 'admin']), lessonController.createLesson);
router.put('/lessons/:id', verifyToken, authorize(['teacher', 'admin']), lessonController.updateLesson);
router.delete('/lessons/:id', verifyToken, authorize(['teacher', 'admin']), lessonController.deleteLesson);

// Student progress
router.post('/progress', verifyToken, authorize(['student']), lessonController.updateProgress);
router.get('/progress/:courseId', verifyToken, authorize(['student', 'teacher', 'admin']), lessonController.getProgress);

// ============================================
// 6. USER MANAGEMENT ROUTES
// ============================================
router.get('/users', verifyToken, authorize(['admin']), userController.getAllUsers);
router.get('/users/:id', verifyToken, authorize(['admin']), userController.getUserById);
router.post('/users', verifyToken, authorize(['admin']), userController.createUser);
router.put('/users/:id', verifyToken, authorize(['admin']), userController.updateUser);
router.put('/users/:id/role', verifyToken, authorize(['admin']), userController.updateUserRole);
router.delete('/users/:id', verifyToken, authorize(['admin']), userController.deleteUser);

// User profile
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/profile/password', verifyToken, userController.updatePassword);

// ============================================
// 7. ENROLLMENT ROUTES
// ============================================
router.get('/enrollments', verifyToken, authorize(['admin']), courseController.getAllEnrollments);
router.get('/enrollments/my-courses', verifyToken, authorize(['student']), courseController.getMyEnrollments);
router.post('/enrollments', verifyToken, authorize(['student']), courseController.createEnrollment);
router.put('/enrollments/:id/status', verifyToken, authorize(['admin', 'teacher']), courseController.updateEnrollmentStatus);

// ============================================
// 8. REVIEW ROUTES
// ============================================
router.get('/reviews', reviewsController.getAllReviews);
router.get('/reviews/course/:courseId', reviewsController.getCourseReviews);
router.post('/reviews', verifyToken, authorize(['student']), reviewsController.createReview);
router.put('/reviews/:id', verifyToken, authorize(['admin']), reviewsController.updateReview);
router.delete('/reviews/:id', verifyToken, authorize(['admin']), reviewsController.deleteReview);

// ============================================
// 9. CONTACT ROUTES
// ============================================
router.post('/contacts', contactController.submitContact);
router.get('/contacts', verifyToken, authorize(['admin']), contactController.getAllContacts);
router.get('/contacts/:id', verifyToken, authorize(['admin']), contactController.getContactById);
router.put('/contacts/:id/status', verifyToken, authorize(['admin']), contactController.updateContactStatus);
router.delete('/contacts/:id', verifyToken, authorize(['admin']), contactController.deleteContact);

// ============================================
// 10. NOTIFICATION ROUTES
// ============================================
router.get('/notifications', verifyToken, authorize(['admin']), notificationController.getNotifications);
router.put('/notifications/:id/read', verifyToken, authorize(['admin']), notificationController.markAsRead);
router.delete('/notifications/:id', verifyToken, authorize(['admin']), notificationController.deleteNotification);

// ============================================
// 11. DASHBOARD & STATISTICS ROUTES
// ============================================
router.get('/stats', verifyToken, authorize(['admin']), courseController.getStats);
router.get('/stats/revenue', verifyToken, authorize(['admin']), courseController.getRevenueStats);
router.get('/stats/enrollments', verifyToken, authorize(['admin']), courseController.getEnrollmentStats);

// ============================================
// 12. CATEGORY ROUTES
// ============================================
router.get('/categories', courseController.getAllCategories);
router.get('/categories/:id/courses', courseController.getCoursesByCategory);
router.post('/categories', verifyToken, authorize(['admin']), courseController.createCategory);
router.put('/categories/:id', verifyToken, authorize(['admin']), courseController.updateCategory);
router.delete('/categories/:id', verifyToken, authorize(['admin']), courseController.deleteCategory);

// ============================================
// 13. HEALTH CHECK & SYSTEM INFO
// ============================================
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'HHT Academy API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        endpoints: {
            auth: ['/register', '/login', '/me'],
            courses: ['/courses', '/courses/:id', '/courses/search'],
            teachers: ['/teachers', '/teachers/:id', '/teachers/:id/earnings'],
            ai_services: ['/ai/services', '/ai/all-services', '/ai/services/search'],
            users: ['/users (admin only)'],
            enrollments: ['/enrollments'],
            reviews: ['/reviews'],
            contacts: ['/contacts'],
            notifications: ['/notifications (admin only)'],
            stats: ['/stats (admin only)']
        }
    });
});

// ============================================
// 14. ERROR HANDLING
// ============================================
// 404 handler
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        requested_url: req.originalUrl,
        method: req.method
    });
});

// Error handler
router.use((err, req, res, next) => {
    console.error('API Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = router;