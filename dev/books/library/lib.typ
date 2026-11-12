// the functions content.typ uses for the parts of a book (made from the html classes by library/typst.js)
#import "meta.typ": *

#let ink = rgb("#3a2a1a")
#let accent = rgb("#7a3b12")
#let muted = luma(110)

// ---- the parts of the books (from the html classes)
#let gatha(body) = block(inset: (left: 1.6em), above: 0.85em, below: 0.85em, {
  set par(justify: false, spacing: 0.3em)
  set text(font: (verse-font, body-font))
  body
})
#let subhead(body) = block(above: 1.1em, below: 0.5em, sticky: true, text(weight: "bold", fill: accent, size: 1.05em, body))
#let tablenote(body) = text(size: 0.85em, fill: muted, body)
#let rule() = align(center, line(length: 30%, stroke: 0.5pt + luma(150)))
#let bookfigure(file, caption) = figure(image(file, width: 100%), caption: if caption != [] { caption } else { none }, supplement: none, numbering: none)
#let enumtext(..items) = block(above: 0.6em, below: 0.6em, grid(columns: (2.2em, 1fr), row-gutter: 0.5em,
  ..items.pos().map(((num, body)) => (text(fill: accent, num), body)).flatten()))

// ---- notes. fn: a footnote, or with note-columns (books.json pdf.noteColumns, for books of many short notes) the
// notes of a page set in rows of note-columns columns: the first mark of a row carries a footnote with the row (one
// footnote per row, so typst keeps each row with the line of its first mark). A note wider than a column gets a row
// of its own. Marks and notes are numbered from 1 on each page
#let note-width = 326pt // the text column of book.typ
#let note-gutter = 8pt
// the rows of a page's notes: (first, count) pairs
#let note-rows(notes) = {
  let colw = (note-width - note-gutter * (note-columns - 1)) / note-columns - 6pt
  let fits(m) = measure(text(size: 0.8em, m.value)).width <= colw
  let rows = ()
  let i = 0
  while i < notes.len() {
    let n = 1
    if fits(notes.at(i)) {
      while n < note-columns and i + n < notes.len() and fits(notes.at(i + n)) { n += 1 }
    }
    rows.push((i, n))
    i += n
  }
  rows
}
#let note-row(notes, first, n) = {
  let cells = range(first, first + n).map(k => [#super(str(k + 1))#notes.at(k).value])
  let cols = if n == 1 and measure(text(size: 0.8em, notes.at(first).value)).width > (note-width - note-gutter * (note-columns - 1)) / note-columns - 6pt { 1 } else { note-columns }
  grid(columns: (1fr,) * cols, column-gutter: note-gutter, ..cells)
}
// the notes of the page: a range of all the notes, from the note counter at this page's header to the next page's
// (page-head: book.typ), so a mark does not look through every note of the book
#let note-count = counter("note")
#let fn(body) = if note-columns <= 1 { footnote(body) } else [#note-count.step()#metadata(body)<note>#context {
  let p = here().page()
  let heads = query(<page-head>)
  let head = heads.find(h => h.location().page() == p)
  let next = heads.find(h => h.location().page() == p + 1)
  let all = query(<note>)
  let start = if head == none { 0 } else { note-count.at(head.location()).first() }
  let end = if next == none { all.len() } else { note-count.at(next.location()).first() }
  let i = note-count.get().first() - 1 - start
  let notes = all.slice(start, calc.max(start, end))
  let mark = super(str(i + 1))
  if fixed-note-marks { sym.wj; box(width: measure(super("00")).width, mark) } else { mark }
  if i >= 0 and i < notes.len() {
    let row = note-rows(notes).find(r => r.at(0) == i)
    // the footnote counter is not shown here: kept at 1 so its value cannot keep the layout from settling
    if row != none [#counter(footnote).update(0)#footnote(numbering: n => "", note-row(notes, ..row))<note-row>]
  }
}]

// tables: thin rules, smaller text for wide tables, landscape pages for the widest
// vert: a header cell of a wide table, set vertically (bottom to top) like the printed books
#let tcell(th: false, vert: false, ..args) = {
  let body = args.pos().at(0, default: [])
  if th { body = strong(body) }
  if vert { table.cell(..args.named(), align: center + bottom, rotate(-90deg, reflow: true, align(left + horizon, body))) }
  else { table.cell(..args.named(), body) }
}
#let booktable(cols, nrows, ..cells) = {
  let size = if cols > 16 { 0.62em } else if cols > 10 { 0.72em } else if cols > 5 { 0.82em } else { 0.9em }
  let t = {
    set text(size: size)
    set par(justify: false, leading: 0.25em, spacing: 0.35em)
    table(columns: cols, stroke: 0.4pt + luma(140), inset: (x: 0.35em, y: 0.3em), align: left + horizon, ..cells)
  }
  if cols > 18 { page(flipped: true, header: none, align(center + horizon, t)) } else { block(above: 0.9em, below: 0.9em, align(center, t)) }
}


// a break to the next right-hand page; the blank page it may leave gets no running head or page number (is-blank)
#let oddbreak() = [#metadata(none)<brk-end>#pagebreak(to: "odd", weak: true)]
#let is-blank() = {
  let p = here().page()
  query(<brk-end>).any(m => m.location().page() < p and query(selector(<brk-start>).after(m.location())).any(s => s.location().page() > p))
}
