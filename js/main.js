document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 0) {
            header.classList.add('shadow-lg');
            header.classList.remove('shadow-md');
        } else {
            header.classList.remove('shadow-lg');
            header.classList.add('shadow-md');
        }
    });

    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
        const submitBtn = contactForm.querySelector('button');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                const inputs = contactForm.querySelectorAll('input');
                let isValid = true;

                inputs.forEach(input => {
                    if (input.value.trim() === '') {
                        isValid = false;
                        input.style.borderColor = 'red';
                    } else {
                        input.style.borderColor = '#e5e7eb';
                    }
                });

                if (isValid) {
                    console.log('Cảm ơn bạn! Chúng tôi đã nhận được thông tin và sẽ liên hệ sớm nhất.');
                    contactForm.reset();
                } else {

                    console.error('Vui lòng điền đầy đủ các trường thông tin bắt buộc.');

                }
            });
        }
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });
});