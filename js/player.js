const courseData = {
    id: 1,
    title: "ReactJS Từ Con Số 0 Đến Đi Làm",
    progress: 25,
    chapters: [
        {
            title: "Chương 1: Tổng quan & Cài đặt",
            lessons: [
                { id: 1, title: "1. Giới thiệu khóa học", type: "video", videoId: "Ke90Tje7VS0", duration: "05:20", isCompleted: true },
                { id: 2, title: "2. Cài đặt Node.js & VS Code", type: "video", videoId: "8dWL3wF_OMw", duration: "12:45", isCompleted: true },
                { id: 3, title: "3. Tạo dự án React đầu tiên", type: "video", videoId: "SqcY0GlETPk", duration: "15:30", isCompleted: false }
            ]
        },
        {
            title: "Chương 2: JSX & Components",
            lessons: [
                { id: 4, title: "4. JSX là gì?", type: "video", videoId: "7fPXI_MnBOY", duration: "08:15", isCompleted: false },
                { id: 5, title: "5. Component & Props", type: "video", videoId: "Digj8005k3s", duration: "20:00", isCompleted: false },
                { id: 6, title: "6. Bài tập thực hành số 1", type: "exercise", videoId: "", duration: "30:00", isCompleted: false }
            ]
        }
    ]
};

let currentLessonId = 1;

document.addEventListener('DOMContentLoaded', () => {
    renderSidebar();
    loadLesson(currentLessonId);

    document.getElementById('btn-prev').addEventListener('click', () => changeLesson('prev'));
    document.getElementById('btn-next').addEventListener('click', () => changeLesson('next'));
    document.getElementById('btn-mark-done').addEventListener('click', toggleCompletion);
});

function renderSidebar() {
    const sidebar = document.getElementById('curriculum-list');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');

    progressText.innerText = `${courseData.progress}% hoàn thành`;
    progressBar.style.width = `${courseData.progress}%`;

    sidebar.innerHTML = '';

    courseData.chapters.forEach((chapter, index) => {
        const chapterHtml = `
            <div class="mb-4">
                <h3 class="font-bold text-gray-700 px-4 py-2 bg-gray-100 text-sm uppercase">
                    ${chapter.title}
                </h3>
                <ul class="flex flex-col">
                    ${chapter.lessons.map(lesson => `
                        <li class="lesson-item border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors ${lesson.id === currentLessonId ? 'bg-blue-100 border-l-4 border-blue-600' : ''}" 
                            onclick="loadLesson(${lesson.id})">
                            <div class="flex items-center gap-3 px-4 py-3">
                                <div class="min-w-[20px]">
                                    ${lesson.isCompleted
                ? '<i class="ph-fill ph-check-circle text-green-500 text-lg"></i>'
                : '<i class="ph ph-circle text-gray-300 text-lg"></i>'}
                                </div>
                                <div class="flex-1">
                                    <p class="text-sm font-medium ${lesson.id === currentLessonId ? 'text-blue-800' : 'text-gray-600'}">
                                        ${lesson.title}
                                    </p>
                                    <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                        <i class="ph-fill ph-play-circle"></i> ${lesson.duration}
                                    </div>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
        sidebar.insertAdjacentHTML('beforeend', chapterHtml);
    });
}

function loadLesson(id) {
    currentLessonId = id;

    const allLessons = courseData.chapters.flatMap(c => c.lessons);
    const lesson = allLessons.find(l => l.id === id);

    if (!lesson) return;

    document.getElementById('lesson-title').innerText = lesson.title;

    const videoContainer = document.getElementById('video-container');
    if (lesson.type === 'video') {
        videoContainer.innerHTML = `
            <iframe class="w-full h-full" 
                src="https://www.youtube.com/embed/${lesson.videoId}?autoplay=1" 
                title="${lesson.title}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else {
        videoContainer.innerHTML = `
            <div class="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white">
                <i class="ph-duotone ph-code text-6xl mb-4"></i>
                <h3 class="text-2xl font-bold">Bài tập thực hành</h3>
                <p class="mt-2 text-gray-400">Vui lòng tải xuống tài liệu đính kèm để làm bài tập.</p>
                <button class="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold transition-colors">
                    <i class="ph-bold ph-download-simple"></i> Tải đề bài
                </button>
            </div>
        `;
    }

    const btnMark = document.getElementById('btn-mark-done');
    if (lesson.isCompleted) {
        btnMark.innerHTML = '<i class="ph-bold ph-check"></i> Đã hoàn thành';
        btnMark.classList.add('bg-green-600', 'hover:bg-green-700');
        btnMark.classList.remove('bg-gray-200', 'text-gray-600', 'hover:bg-gray-300');
        btnMark.classList.add('text-white');
    } else {
        btnMark.innerHTML = 'Đánh dấu hoàn thành';
        btnMark.classList.remove('bg-green-600', 'hover:bg-green-700', 'text-white');
        btnMark.classList.add('bg-gray-200', 'text-gray-600', 'hover:bg-gray-300');
    }

    renderSidebar();
}

function changeLesson(direction) {
    const allLessons = courseData.chapters.flatMap(c => c.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLessonId);

    let newIndex = currentIndex;
    if (direction === 'next' && currentIndex < allLessons.length - 1) {
        newIndex++;
    } else if (direction === 'prev' && currentIndex > 0) {
        newIndex--;
    }

    if (newIndex !== currentIndex) {
        loadLesson(allLessons[newIndex].id);
    }
}

function toggleCompletion() {
    const allLessons = courseData.chapters.flatMap(c => c.lessons);
    const lesson = allLessons.find(l => l.id === currentLessonId);

    if (lesson) {
        lesson.isCompleted = !lesson.isCompleted;

        const completedCount = allLessons.filter(l => l.isCompleted).length;
        courseData.progress = Math.round((completedCount / allLessons.length) * 100);

        loadLesson(currentLessonId);
    }
}