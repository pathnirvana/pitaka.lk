const fontList = [
    ['un-abhaya', 'අභය'], 
    ['un-abhaya-bold-2019', 'අභය තද'], 
    ['un-malithi', 'මලිති'],
    ['un-alakamanda', 'ආලකමන්‍දා'],
    ['un-bindumathi', 'බින්ඳුමතී'],
    ['un-imanee', 'ඉමාණී'],
    ['un-ganganee', 'ගංඟානී'],
    ['un-derana', 'දෙරණ'],
    ['un-samantha', 'සමන්තා'],
    ['un-sandhyanee', 'සංධ්‍යානී'],
    ['un-basuru', 'බාසුරු'],
    ['un-gurulugomi', 'ගුරුළුගෝමි'],
    ['un-arundathee', 'අරුන්‍දතී'],
    ['un-isiwara', 'ඉසිවර'],
    ['un-rashmi', 'රශ්මි'],
    ['un-davasa', 'දවස'],
    ['un-disapamok', 'දිසාපාමොක්'],
    ['un-indeewaree', 'ඉන්‍දීවරී'],
    ['un-dharanee', 'ධරණී'],
    ['un-rajantha', 'රජන්තා'],
    ['un-gemunu', 'ගැමුණු'],
    //['un-arjuna-2014', 'අර්ජුන'],
    //['un-agni', 'අග්නි'],
]
const getFontFaceStyle = (f) => `@font-face {
        font-family: '${f[0]}'; 
        src: local('###'), url('fonts/${f[0]}.ttf') format('truetype');
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