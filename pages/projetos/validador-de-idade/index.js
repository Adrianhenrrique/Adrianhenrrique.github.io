var ano = window.document.getElementsByClassName('ano')[0]
var sexo1 = window.document.getElementsByClassName('sexo')[0]
var sexo2 = window.document.getElementsByClassName('sexo')[1]
var resulTxt = window.document.getElementsByClassName('resultado_text')[0]
var img = window.document.getElementsByClassName('img-resul')[0]
let hoje = new Date();
hoje.getFullYear();

function verificar() {
    var anoN = Number(ano.value)
    var idade = hoje.getFullYear() - anoN
    
    if (anoN > hoje.getFullYear()) {
        resulTxt.innerHTML = `O ano ${anoN} é invalido, digite um ano abaixo de ${hoje.getFullYear()}`
        resulTxt.style.color = 'red'
    } else if (idade >= '120') {

        if (sexo1.checked){
            resulTxt.innerHTML = `Este Homen se encontra ao lado da morte, com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/morto.png'
        } else {
            resulTxt.innerHTML = `Está Mulher se encontra ao lado da morte, com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/morto.png'
        }

    } else if (idade <= '3' || idade === '0') {
        
        if (sexo1.checked){
            resulTxt.innerHTML = `Um bebê com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/bebe_0-3.png'
        } else {
            resulTxt.innerHTML = `Uma bebê com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/bebe_0-3.png'
        }
        
    } else if (idade <= '13' || idade === '4') {
        
        if (sexo1.checked){
            resulTxt.innerHTML = `Uma criança com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/criança_3-13_m.png'
        } else {
            resulTxt.innerHTML = `Uma criança com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/criança_3-13_f.png'
        }

    } else if (idade <= '18' || idade === '14') {
        
        if (sexo1.checked){
            resulTxt.innerHTML = `Uma adolecente com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/adolecente_14-18_m.png'
        } else {
            resulTxt.innerHTML = `Uma adolecente com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/adolecente_14-18_f.png'
        }

    } else if (idade >= '50') {
        
        if (sexo1.checked){
            resulTxt.innerHTML = `Um idoso com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/idoso_+50_m.png'
        } else {
            resulTxt.innerHTML = `Uma idosa com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/idoso_+50_f.png'
        }

    } else {
        if (sexo1.checked){
            resulTxt.innerHTML = `Um homen com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/adulto_+18_m.png'
        } else {
            resulTxt.innerHTML = `Uma mulher com <b>${idade}</b> anos`
            resulTxt.style.color = '#000'
            img.style.display = 'inline'
            img.src = './img/adulto_+18_f.png'
        }
    }
}