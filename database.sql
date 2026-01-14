-- ============================================
-- HỆ THỐNG QUẢN LÝ GIÁO DỤC HHT ACADEMY ENTERPRISE
-- PHIÊN BẢN 6.0 - ĐA CHUYÊN NGÀNH & TÍCH HỢP AI HUB
-- TỔNG CỘNG: 25 BẢNG ĐẦY ĐỦ QUAN HỆ
-- ============================================

CREATE DATABASE IF NOT EXISTS hht_academy_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE hht_academy_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. HỆ THỐNG TỔ CHỨC (ORGANIZATION)
DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE, -- Khoa CNTT, Khoa Kinh tế...
    description TEXT,
    code VARCHAR(20) UNIQUE, -- IT, MKT, BIZ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. HỆ THỐNG NGƯỜI DÙNG & PHÂN QUYỀN
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL, 
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'teacher', 'admin', 'manager') DEFAULT 'student',
    dept_id INT,
    avatar VARCHAR(500),
    phone VARCHAR(20),
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. CHI TIẾT GIẢNG VIÊN (TEACHER MODULE)
DROP TABLE IF EXISTS teacher_details;
CREATE TABLE teacher_details (
    user_id INT PRIMARY KEY,
    specialty VARCHAR(255),
    degree VARCHAR(100), -- Thạc sĩ, Tiến sĩ, Giáo sư
    bio TEXT,
    experience_years INT DEFAULT 0,
    hourly_rate DECIMAL(15,2) DEFAULT 0,
    base_salary DECIMAL(15,2) DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_students INT DEFAULT 0,
    social_links JSON, -- Lưu Facebook, LinkedIn, GitHub
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS teacher_skills;
CREATE TABLE teacher_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS teacher_availability;
CREATE TABLE teacher_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    start_time TIME,
    end_time TIME,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. HỆ THỐNG AI HUB PRO (NEW FEATURE)
DROP TABLE IF EXISTS ai_services;
CREATE TABLE ai_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL, -- Gemini Pro, ChatGPT 4o, Perplexity Pro
    category_id INT, -- Liên kết với chuyên ngành học
    official_url VARCHAR(255),
    logo_url VARCHAR(255),
    description TEXT,
    is_premium BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS ai_credentials;
CREATE TABLE ai_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    login_user VARCHAR(255), -- Email tài khoản Pro
    login_pass VARCHAR(255), -- Mật khẩu tài khoản Pro
    api_key TEXT, -- API Key nếu dùng tích hợp trực tiếp
    account_status ENUM('active', 'expired', 'limit_reached') DEFAULT 'active',
    shared_to_roles JSON, -- ['teacher', 'student'] 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES ai_services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS ai_prompts;
CREATE TABLE ai_prompts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    category_id INT,
    title VARCHAR(255),
    prompt_text TEXT, -- Đoạn prompt mẫu tối ưu
    FOREIGN KEY (service_id) REFERENCES ai_services(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. LỚP HỌC & KHÓA HỌC (LMS CORE)
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) DEFAULT 0,
    image VARCHAR(500),
    instructor_id INT,
    category_id INT,
    level ENUM('Basic', 'Intermediate', 'Advanced', 'University') DEFAULT 'University',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS chapters;
CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    order_index INT DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS lessons;
CREATE TABLE lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    type ENUM('video', 'document', 'quiz', 'lab') DEFAULT 'video',
    content TEXT,
    video_url VARCHAR(255),
    attachment_url VARCHAR(255),
    order_index INT DEFAULT 0,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. QUẢN LÝ SINH VIÊN (ACADEMIC)
DROP TABLE IF EXISTS enrollments;
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress_percent INT DEFAULT 0,
    status ENUM('active', 'completed', 'dropped') DEFAULT 'active',
    final_grade DECIMAL(4,2),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS progress;
CREATE TABLE progress (
    user_id INT NOT NULL,
    lesson_id INT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lesson_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. BÀI TẬP & ĐIỂM SỐ (ASSESSMENTS)
DROP TABLE IF EXISTS assignments;
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    title VARCHAR(255),
    description TEXT,
    due_date DATETIME,
    max_score INT DEFAULT 10,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS submissions;
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT,
    student_id INT,
    file_url VARCHAR(500),
    submission_text TEXT,
    score DECIMAL(4,2),
    teacher_feedback TEXT,
    status ENUM('pending', 'graded', 'resubmit') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. TÀI CHÍNH & THANH TOÁN
DROP TABLE IF EXISTS teacher_earnings;
CREATE TABLE teacher_earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT,
    course_id INT,
    amount DECIMAL(15,2),
    type ENUM('salary', 'commission', 'bonus') DEFAULT 'commission',
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    payment_date DATETIME,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB;

DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    amount DECIMAL(15,2),
    payment_method VARCHAR(50),
    status ENUM('pending', 'success', 'failed') DEFAULT 'success',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. TƯƠNG TÁC & PHẢN HỒI
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    course_id INT,
    rating TINYINT CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    type ENUM('system', 'academic', 'payment') DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TABLE IF EXISTS contacts;
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    subject VARCHAR(255),
    message TEXT,
    status ENUM('new', 'read', 'replied') DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. QUẢN LÝ PHÂN CÔNG (COURSE ASSIGNMENTS)
DROP TABLE IF EXISTS course_assignments;
CREATE TABLE course_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    teacher_id INT,
    role ENUM('primary', 'assistant') DEFAULT 'primary',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ============================================

-- Departments
INSERT INTO departments (name, code, description) VALUES 
('Khoa Công nghệ thông tin', 'IT', 'Đào tạo kỹ sư phần mềm, AI, và An ninh mạng'),
('Khoa Marketing & Truyền thông', 'MKT', 'Đào tạo chuyên gia Marketing Digital, PR'),
('Khoa Kinh tế & Tài chính', 'BIZ', 'Quản trị kinh doanh và Tài chính ngân hàng');

-- Categories
INSERT INTO categories (name, description, icon) VALUES 
('Lập trình Web', 'Fullstack, React, Node.js', 'fa-code'),
('AI & Data Science', 'Machine Learning, Deep Learning', 'fa-robot'),
('Digital Marketing', 'SEO, Ads, Content Strategy', 'fa-bullhorn');

-- Users
INSERT INTO users (name, email, password, role, dept_id) VALUES 
('Admin Hệ Thống', 'admin@hht.edu.vn', '123456', 'admin', 1),
('TS. Nguyễn Văn A', 'teacher_a@hht.edu.vn', '123456', 'teacher', 1),
('ThS. Trần Thị B', 'teacher_b@hht.edu.vn', '123456', 'teacher', 2),
('Sinh viên Nguyễn Văn C', 'student_c@gmail.com', '123456', 'student', 1);

-- AI Services
INSERT INTO ai_services (service_name, category_id, official_url, description) VALUES 
('Gemini 1.5 Pro', 1, 'https://gemini.google.com/', 'AI mạnh mẽ nhất từ Google cho nghiên cứu và code.'),
('Perplexity AI Pro', 2, 'https://www.perplexity.ai/', 'Công cụ tìm kiếm thông minh trích dẫn nguồn cho Marketing.'),
('ChatGPT Plus (4o)', 1, 'https://chat.openai.com/', 'Hỗ trợ đa năng cho giảng dạy và lập trình.');

-- AI Credentials (Shared Accounts)
INSERT INTO ai_credentials (service_id, login_user, login_pass, shared_to_roles) VALUES 
(1, 'premium_gemini@hht.edu.vn', 'HhtPass2026', '["teacher", "admin"]'),
(2, 'marketing_ai@hht.edu.vn', 'MktPass2026', '["teacher", "student"]');

-- AI Prompts
INSERT INTO ai_prompts (service_id, category_id, title, prompt_text) VALUES 
(1, 1, 'Prompt cho Giảng viên CNTT', 'Hãy đóng vai chuyên gia lập trình, hãy tạo lộ trình học ReactJS cho sinh viên năm 2...'),
(2, 2, 'Prompt Nghiên cứu thị trường', 'Dựa trên dữ liệu thực tế, hãy phân tích 5 xu hướng Marketing tại VN năm nay...');

-- Teacher Details
INSERT INTO teacher_details (user_id, specialty, degree, experience_years, rating) VALUES 
(2, 'AI & Software Engineering', 'Tiến sĩ', 15, 4.9),
(3, 'Branding & Digital Marketing', 'Thạc sĩ', 8, 4.7);

-- Courses
INSERT INTO courses (title, description, price, instructor_id, category_id, level, is_published) VALUES 
('Lập trình Web Thực chiến', 'Học từ HTML đến React/NodeJS', 1500000, 2, 1, 'University', TRUE),
('Nghiên cứu thị trường với AI', 'Ứng dụng Perplexity vào Marketing', 900000, 3, 3, 'University', TRUE);

-- Chapters & Lessons
INSERT INTO chapters (course_id, title, order_index) VALUES (1, 'Chương 1: Kiến trúc Web hiện đại', 1);
INSERT INTO lessons (chapter_id, title, type, content) VALUES (1, 'Bài 1: Tổng quan về Client-Server', 'video', 'Nội dung video bài giảng...');