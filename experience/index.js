import arrowBackPick from '../src/arrow-left-pink.svg';

const arrowBackImg = document.querySelector('') 

arrowBackImg.addEventListener("mouseover", alteractionImage);

function alteractionImage () {
    arrowBackImg.setAttribute('src', arrowBackPick)
}