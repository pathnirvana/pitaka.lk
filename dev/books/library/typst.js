/**
 * the book html (after load.js) as Typst markup, for library/book.typ
 * every ascii punctuation mark is escaped, so the text never turns into markup; the structure is made with function
 * calls (#strong[], #gatha[], #table() ...) defined in book.typ
 */

const esc = (s) => s.replace(/[!-\/:-@\[-`{-~]/g, '\\$&');
const ws = (s) => s.replace(/[\s ]+/g, ' ');
const str = (s) => JSON.stringify(s); // a typst string literal (same escapes as json)
const has = (el, c) => el.classList && el.classList.contains(c);
// ---- vertical table headers: a table whose header words do not fit its columns sets its one-column header cells
// vertically, as the printed books do. The width of a Sinhala word in em (Abhaya Uni bold, measured in typst): a
// consonant 0.72 (one that follows a ZWJ joins the one before it), a vowel sign that takes room 0.4-1
const TEXT_WIDTH = 326; // pt, the 115 mm text column of library/book.typ
const SIGN_EM = { '\u0dcf': 0.4, '\u0dd0': 0.35, '\u0dd1': 0.35, '\u0dd9': 0.5, '\u0dda': 0.5, '\u0ddb': 0.9, '\u0ddc': 0.9, '\u0ddd': 0.9, '\u0dde': 0.9, '\u0ddf': 0.4, '\u0d82': 0.45, '\u0d83': 0.4 };
function wordEm(w) {
    let em = 0, prev = '';
    for (const c of w) {
        if (/[\u0d85-\u0dc6]/.test(c)) em += prev == '\u200d' ? 0.15 : 0.72;
        else if (SIGN_EM[c]) em += SIGN_EM[c];
        else if (!/[\u0d80-\u0dff\u200b-\u200d]/.test(c)) em += 0.55; // digits, latin, punctuation
        prev = c;
    }
    return em;
}
// the text size of library/lib.typ booktable (in pt, body 10.5pt)
const tableSize = (cols) => 10.5 * (cols > 16 ? 0.62 : cols > 10 ? 0.72 : cols > 5 ? 0.82 : 0.9);
function verticalHead(headCells, cols) {
    if (cols < 5) return false;
    const room = 0.9 * TEXT_WIDTH / cols - 0.7 * tableSize(cols); // a column less its inset, the first column is often wider
    return headCells.some(td => td.textContent.split(/[\s\u00a0]+/).some(w => wordEm(w) * tableSize(cols) > room));
}
const BLOCK = new Set(['P', 'DIV', 'TABLE', 'OL', 'UL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'FIGURE', 'HR', 'BLOCKQUOTE', 'TBODY', 'THEAD']);

// ---- inline content
function inl(node) {
    let out = '';
    for (const n of node.childNodes) {
        if (n.nodeType == 3) { out += esc(ws(n.textContent)); continue; }
        if (n.nodeType != 1) continue;
        const t = n.tagName, inner = () => inl(n);
        if (has(n, 'fn')) out += `#fn[${inl(n).trim()}]`;
        else if (has(n, 'pg')) out += `#metadata(${str(n.dataset.page)})<p${n.dataset.page}>`;
        else if (has(n, 'li-num')) out += inner();
        else if (t == 'B' || t == 'STRONG') out += wrap('strong', inner());
        else if (t == 'I' || t == 'EM') out += wrap('emph', inner());
        else if (t == 'SUP' || has(n, 'gatha-number')) out += wrap('super', inner());
        else if (t == 'SUB') out += wrap('sub', inner());
        else if (t == 'BR') out += '#linebreak()';
        else if (t == 'IMG') out += img(n);
        else if (BLOCK.has(t)) out += ' ' + inner() + ' '; // a block inside a paragraph or a cell (rare): keep its text
        else out += inner(); // span, font, a, u ...
    }
    return out;
}
// an empty or space-only body stays as it is (#strong[ ] would be an error in nothing)
const wrap = (fn, body) => body.trim() ? `#${fn}[${body}]` : body;
const img = (el) => el.dataset.file ? `#image(${str(el.dataset.file)}, width: 100%)` : '';

// ---- blocks
function blocks(parent) {
    const out = [];
    let pending = ''; // page anchors and loose text before the next block
    for (const n of parent.childNodes) {
        if (n.nodeType == 3) { if (n.textContent.trim()) out.push(esc(ws(n.textContent)).trim()); continue; }
        if (n.nodeType != 1) continue;
        if (has(n, 'pg')) { pending += `#metadata(${str(n.dataset.page)})<p${n.dataset.page}>`; continue; }
        const b = block(n);
        if (b == null) continue;
        out.push(pending ? `${pending}\n${b}` : b);
        pending = '';
    }
    if (pending) out.push(pending);
    return out.join('\n\n');
}

function block(n) {
    const t = n.tagName;
    if (/^H[1-6]$/.test(t)) {
        const level = Math.min(Number(t[1]), 5);
        const h = `#heading(level: ${level})[${inl(n).trim()}] <${n.id}>`;
        // the main text (chapter 1) starts on a right-hand page with page 1, the pages before it have roman numbers
        return n.dataset.main ? `#oddbreak()\n#set page(numbering: "1")\n#counter(page).update(1)\n#metadata(none)<brk-start>\n${h}` : h;
    }
    if (t == 'P') {
        const body = inl(n).trim();
        if (!body) return null;
        if (has(n, 'footnote')) return `#tablenote[${body}]`;
        if (has(n, 'centered')) return `#align(center)[${body}]`;
        return body;
    }
    if (t == 'DIV' || t == 'BLOCKQUOTE' || t == 'FIGURE') {
        if (has(n, 'image-placeholder')) return figure(n);
        const body = blocks(n);
        if (!body.trim()) return null;
        if (has(n, 'gatha')) return `#gatha[${body}]`;
        if (has(n, 'subhead')) return `#subhead[${body}]`;
        if (has(n, 'centered')) return `#align(center)[${body}]`;
        if (has(n, 'largefont')) return `#text(size: 1.15em)[${body}]`;
        if (t == 'BLOCKQUOTE') return `#quote(block: true)[${body}]`;
        return body;
    }
    if (t == 'OL' || t == 'UL') return list(n);
    if (t == 'TABLE') return table(n);
    if (t == 'HR') return '#rule()';
    if (t == 'IMG') return img(n) || null;
    if (t == 'SPAN' && has(n, 'fn')) return inl({ childNodes: [n] });
    const body = inl(n).trim(); // stray inline element at the top level
    return body || null;
}

function figure(n) {
    const im = n.querySelector('img'), label = n.querySelector('.img-label, figcaption');
    if (!im || !im.dataset.file) return null;
    return `#bookfigure(${str(im.dataset.file)}, [${label ? inl(label).trim() : ''}])`;
}

function list(n) {
    const items = [...n.children].filter(li => li.tagName == 'LI');
    if (has(n, 'enum')) { // the marker is part of the text: <span class="li-num">1.</span>
        return `#enumtext(${items.map(li => {
            const num = li.querySelector(':scope > .li-num');
            const c = li.cloneNode(true); c.querySelector(':scope > .li-num')?.remove();
            return `([${num ? inl(num).trim() : ''}], [${itemBody(c)}])`;
        }).join(', ')})`;
    }
    const fn = n.tagName == 'OL' ? `enum(start: ${Number(n.getAttribute('start')) || 1}, ` : 'list(';
    return `#${fn}${items.map(li => `[${itemBody(li)}]`).join(', ')})`;
}
// a list item has inline content, paragraphs or nested lists
const itemBody = (li) => [...li.childNodes].some(c => c.nodeType == 1 && BLOCK.has(c.tagName)) ? blocks(li) : inl(li).trim();

// ---- tables: the column count from the cell grid (rowspan, colspan); header rows repeat on each page
// header: the rows of a <thead>, or the leading rows that are all <th>; vertical: the header cells are set vertically
function tableShape(n) {
    const rows = [...n.querySelectorAll('tr')].filter(tr => tr.closest('table') === n);
    const grid = [];
    let cols = 0;
    rows.forEach((tr, r) => {
        grid[r] = grid[r] || [];
        let c = 0;
        for (const cell of tr.children) {
            while (grid[r][c]) c++;
            const rs = Math.max(1, Number(cell.getAttribute('rowspan')) || 1), cs = Math.max(1, Number(cell.getAttribute('colspan')) || 1);
            for (let i = 0; i < rs; i++) for (let j = 0; j < cs; j++) (grid[r + i] = grid[r + i] || [])[c + j] = true;
            c += cs;
        }
        cols = Math.max(cols, grid[r].length);
    });
    let head = rows.filter(tr => tr.parentElement.tagName == 'THEAD').length;
    if (!head) while (head < rows.length - 1 && [...rows[head].children].every(td => td.tagName == 'TH')) head++;
    const headCells = rows.slice(0, head).flatMap(tr => [...tr.children]).filter(td => (Number(td.getAttribute('colspan')) || 1) == 1);
    return { rows, cols, head, headCells, vertical: verticalHead(headCells, cols) };
}

function table(n) {
    const { rows, cols, head, vertical } = tableShape(n);
    if (!rows.length) return null;
    const cell = (td, inHead) => {
        const rs = Number(td.getAttribute('rowspan')) || 1, cs = Number(td.getAttribute('colspan')) || 1;
        const body = [...td.childNodes].some(c => c.nodeType == 1 && BLOCK.has(c.tagName)) ? blocks(td) : inl(td).trim();
        // a wide table sets its one-column header cells vertically, as the printed books do
        const vert = inHead && cs == 1 && vertical && body;
        const args = [rs > 1 && `rowspan: ${rs}`, cs > 1 && `colspan: ${cs}`, td.tagName == 'TH' && 'th: true', vert && 'vert: true'].filter(Boolean);
        return args.length ? `tcell(${args.join(', ')})[${body}]` : `[${body}]`;
    };
    const rowText = (tr) => [...tr.children].map(td => cell(td, rows.indexOf(tr) < head)).join(', ');
    const headPart = head ? `table.header(${rows.slice(0, head).map(rowText).join(',\n  ')}),\n  ` : '';
    const body = rows.slice(head).map(rowText).filter(s => s).join(',\n  ');
    return `#booktable(${cols}, ${rows.length}, ${headPart}${body})`;
}

/** the content of a whole book: front matter (before the first heading) and the rest */
function toTypst(doc) {
    return blocks(doc.body) + '\n';
}

module.exports = { toTypst, esc, str, tableShape };
