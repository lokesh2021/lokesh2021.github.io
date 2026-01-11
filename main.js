/**
 * Lokesh B M Portfolio
 * Interactive JavaScript for PostHog-inspired design
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initNavigation();
    initScrollAnimations();
    initParallaxBlobs();
    initTypewriter();
    initBackToTop();
    initHoverEffects();
    initFloatingGames();
});

/**
 * Navigation Module
 * Handles mobile menu toggle and smooth scrolling
 */
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');
    
    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 100;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add shadow on scroll
        if (currentScroll > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.boxShadow = 'none';
        }
        
        // Hide/show on scroll direction
        if (currentScroll > lastScroll && currentScroll > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });
    
    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        const scrollPos = window.pageYOffset + 200;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

/**
 * Scroll Animations Module
 * Intersection Observer for fade-in animations
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.section-header, .timeline-item, .skill-category, .project-card, ' +
        '.about-text, .about-visual, .pitch-card, .contact-card'
    );
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
        observer.observe(el);
    });
    
    // Special animation for timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        });
    }, { threshold: 0.2 });
    
    timelineItems.forEach(item => {
        timelineObserver.observe(item);
    });
}

/**
 * Parallax Blobs Module
 * Subtle mouse movement effect on gradient blobs
 */
function initParallaxBlobs() {
    const blobs = document.querySelectorAll('.gradient-blob');
    
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        blobs.forEach((blob, index) => {
            const speed = (index + 1) * 20;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            
            blob.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
}

/**
 * Typewriter Effect Module
 * Animated typing for hero section
 */
function initTypewriter() {
    const roles = [
        'Backend Engineer',
        'Go Developer',
        'System Designer',
        'Problem Solver'
    ];
    
    const titleSub = document.querySelector('.title-sub');
    if (!titleSub) return;
    
    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentRole = roles[0];
    
    function type() {
        currentRole = roles[roleIndex];
        
        if (isDeleting) {
            charIndex--;
        } else {
            charIndex++;
        }
        
        titleSub.textContent = currentRole.substring(0, charIndex);
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentRole.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typeSpeed = 500; // Pause before next word
        }
        
        setTimeout(type, typeSpeed);
    }
    
    // Start after initial animation
    setTimeout(type, 1500);
}

/**
 * Floating Games Button Module
 */
function initFloatingGames() {
    const floatingGames = document.getElementById('floatingGames');
    const gamesToggle = document.getElementById('gamesToggle');
    
    if (!floatingGames || !gamesToggle) return;
    
    // Toggle menu on button click
    gamesToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        floatingGames.classList.toggle('open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!floatingGames.contains(e.target)) {
            floatingGames.classList.remove('open');
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            floatingGames.classList.remove('open');
        }
    });
    
    // Show/hide based on scroll (hide at very top)
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll < 100) {
            floatingGames.style.opacity = '0';
            floatingGames.style.pointerEvents = 'none';
        } else {
            floatingGames.style.opacity = '1';
            floatingGames.style.pointerEvents = 'auto';
        }
        
        lastScroll = currentScroll;
    });
    
    // Initial state
    if (window.pageYOffset < 100) {
        floatingGames.style.opacity = '0';
        floatingGames.style.pointerEvents = 'none';
    }
}

/**
 * Back to Top Button Module
 */
function initBackToTop() {
    const backToTopBtn = document.querySelector('.back-to-top');
    
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Show/hide based on scroll
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.pointerEvents = 'auto';
            } else {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.pointerEvents = 'none';
            }
        });
    }
}

/**
 * Hover Effects Module
 * Enhanced interactive hover states
 */
function initHoverEffects() {
    // Magnetic effect for buttons
    const magneticElements = document.querySelectorAll('.btn-primary, .contact-card, .skill-category');
    
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            this.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });
        
        el.addEventListener('mouseleave', function() {
            this.style.transform = 'translate(0, 0)';
        });
    });
    
    // Tilt effect for profile card
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        profileCard.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        profileCard.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    }
    
    // Glow effect for tech icons
    const techIcons = document.querySelectorAll('.floating-tech');
    techIcons.forEach(icon => {
        icon.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 0 30px rgba(247, 166, 0, 0.4)';
            this.style.transform = 'translateY(-15px) scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
            this.style.transform = '';
        });
    });
}

/**
 * Stats Counter Animation
 * Animate numbers when they come into view
 */
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const finalValue = target.textContent;
                const numValue = parseInt(finalValue.replace(/\D/g, ''));
                const suffix = finalValue.replace(/[0-9]/g, '');
                
                let current = 0;
                const increment = numValue / 50;
                const duration = 1500;
                const stepTime = duration / 50;
                
                const counter = setInterval(() => {
                    current += increment;
                    if (current >= numValue) {
                        target.textContent = finalValue;
                        clearInterval(counter);
                    } else {
                        target.textContent = Math.floor(current) + suffix;
                    }
                }, stepTime);
                
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => observer.observe(stat));
}

// Initialize stats animation after page load
window.addEventListener('load', animateStats);

/**
 * Code Block Syntax Highlighting Enhancement
 * Add line numbers and copy functionality
 */
function initCodeBlock() {
    const codeBlock = document.querySelector('.code-content code');
    if (!codeBlock) return;
    
    // Add line numbers
    const lines = codeBlock.innerHTML.split('\n');
    const numberedLines = lines.map((line, index) => {
        return `<span class="line-number">${index + 1}</span>${line}`;
    }).join('\n');
    
    codeBlock.innerHTML = numberedLines;
}

// Easter egg: Konami code
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        activateEasterEgg();
    }
});

function activateEasterEgg() {
    const colors = ['#f7a600', '#f54e00', '#1d4aff', '#b25aff', '#00c4b4', '#f560b6'];
    
    // Create confetti effect
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}vw;
            top: -10px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            z-index: 9999;
            pointer-events: none;
            animation: fall ${2 + Math.random() * 3}s linear forwards;
        `;
        document.body.appendChild(confetti);
        
        setTimeout(() => confetti.remove(), 5000);
    }
    
    // Add keyframe animation if not exists
    if (!document.querySelector('#confetti-style')) {
        const style = document.createElement('style');
        style.id = 'confetti-style';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) rotate(720deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('🦔 You found the easter egg! Welcome, fellow hacker!');
}

/**
 * Performance optimization: Debounce scroll events
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll-heavy operations
window.addEventListener('scroll', debounce(() => {
    // Any additional scroll-based updates
}, 10));

/**
 * Preload critical images
 */
function preloadImages() {
    const images = [
        'images/profile1.jpg',
        'images/newsio.png',
        'images/portitem1.png'
    ];
    
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Preload on idle
if ('requestIdleCallback' in window) {
    requestIdleCallback(preloadImages);
} else {
    setTimeout(preloadImages, 1000);
}
