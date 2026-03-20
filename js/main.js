/* ORO Solution — oro-solution.com — main.js */
'use strict';

/* ── Mobile nav toggle ── */
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        const open = navMenu.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });

    // Close on nav link click (mobile)
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

/* ── Scroll-based nav shadow ── */
const siteNav = document.querySelector('.site-nav');
if (siteNav) {
    const onScroll = () => {
        siteNav.style.boxShadow = window.scrollY > 10
            ? '0 4px 24px rgba(15, 23, 42, 0.1)'
            : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
}

/* ── Intersection Observer — fade-in on scroll ── */
const observerOptions = {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
};
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll(
    '.solution-card, .why-card, .eco-feature-card, .signal-item, .cta-card'
).forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

/* ── Add fade-in CSS dynamically ── */
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .fade-in.visible {
        opacity: 1;
        transform: none;
    }
`;
document.head.appendChild(style);

/* ── Smooth anchor scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
