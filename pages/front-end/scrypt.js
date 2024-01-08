let menu_open = 0;
var menu = document.querySelector('.menu-mobile');

const botao = document.querySelector('.btn-menu');
botao.addEventListener('click', function() {
    if (menu_open === 0) {
        menu.style.right = '0px';
        menu_open++;
    } else {
        if (menu_open === 1) {
            menu.style.right = '-100%';
            menu_open--;
        }
    }
});
