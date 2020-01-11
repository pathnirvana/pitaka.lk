const fontList = [
    ['UN-Abhaya', 'අභය'], 
    ['UN-Abhaya-bold-2019', 'අභය තද'], 
    ['UN-Malithi', 'මලිති'],
    ['UN-Alakamanda', 'ආලකමන්‍දා'],
    ['UN-Bindumathi', 'බින්ඳුමතී'],
    ['UN-Imanee', 'ඉමාණී'],
    ['UN-Ganganee', 'ගංඟානී'],
    ['UN-Derana', 'දෙරණ'],
    ['UN-Samantha', 'සමන්තා'],
    ['UN-Sandhyanee', 'සංධ්‍යානී'],
    ['UN-Basuru', 'බාසුරු'],
    ['UN-Gurulugomi', 'ගුරුළුගෝමි'],
    ['UN-Arundathee', 'අරුන්‍දතී'],
    ['UN-Isiwara', 'ඉසිවර'],
    ['UN-Rashmi', 'රශ්මි'],
    ['UN-Davasa', 'දවස'],
    ['UN-Disapamok', 'දිසාපාමොක්'],
    ['UN-Indeewaree', 'ඉන්‍දීවරී'],
    ['UN-Dharanee', 'ධරණී'],
    ['UN-Rajantha', 'රජන්තා'],
    ['UN-Gemunu', 'ගැමුණු'],
    //['UN-Arjuna-2014', 'අර්ජුන'],
    //['UN-Agni', 'අග්නි'],
]
const getFontFaceStyle = (f) => `@font-face {
        font-family: '${f[0]}'; 
        src: local('###'), url('./fonts/${f[0]}.ttf') format('truetype');
        font-weight: normal;
    }`;

const setFontFace = (fontName) => {
    document.body.style.fontFamily = fontName
    Array.from(document.getElementsByClassName('apply-font')).forEach(e => e.style.fontFamily = fontName)
    location.hash = "#id-" + fontName // only for the download fonts page
}

const topContElem = document.getElementById('top-contents')
const active = topContElem.getAttribute('active')
topContElem.innerHTML = `<div class="top-title">පිටක.lk සිංහල යුනිකේත අකුරු මෘදුකාංග</div>
    <div class="menu">
        <a class="menu-item ${active != 1 || 'active'}" href="fm_to_unicode.htm">යුනිකේත පරිවර්තකය</a>
        <a class="menu-item ${active != 2 || 'active'}" href="pali_bandi.htm">පාලි බැඳි අකුරු</a>
        <a class="menu-item ${active != 3 || 'active'}" href="download_unicode.htm">අකුරු මුහුණත් ලබාගන්න</a>
    </div>
    <div style="text-align: center; padding: 5px; background-color: lightyellow; ">
        <span>Font එක තෝරන්න</span>
        <select class="apply-font" onchange="setFontFace(this.value)" id="font-select" style="font-size: 1.5rem;"></select>
    </div>`;

document.getElementById("font-face").innerHTML = fontList.map(getFontFaceStyle).join('\n')
document.getElementById('font-select').innerHTML = 
    fontList.map(f => `<option style="font-family: '${f[0]}';" value="${f[0]}">${f[1]}</option>`).join('\n')

document.getElementById('bottom-bar').innerHTML = `
    <div>© 2020 පිටක.lk - Path Nirvana (<a href="https://www.facebook.com/pitaka.lk">facebook.com/pitaka.lk</a>)</div>		
    <div style="color: rgb(160, 1, 1)">Report any conversion errors to pathnirvana @ gmail.com</div>`

setFontFace('un-abhaya')