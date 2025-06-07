// Animação de entrada das seções ao rolar a página
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.16 });

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// Efeito 3D nos cards de skills
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = (-y / 18).toFixed(2);
        const rotateY = (x / 18).toFixed(2);
        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.09)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});