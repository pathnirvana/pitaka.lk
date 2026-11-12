// the typed pdf of a book for the tipitaka.lk library (made by library-files.js: meta.typ and content.typ next to this)
#import "meta.typ": *
#import "lib.typ": *

#set document(title: book-title, author: if book-author != "" { book-author } else { () })
#set text(font: (body-font, "Abhaya Uni"), size: body-size, lang: "si", hyphenate: false)
#set text(top-edge: "ascender", bottom-edge: "descender")
#set par(justify: true, leading: 0.32em, spacing: 0.62em)
#show strong: set text(weight: "bold")

#set text(fill: ink)

// ---- pages: 148 x 220 mm, mirrored margins; running heads from the page after a chapter opener
#set page(
  width: 148mm, height: 220mm,
  margin: (inside: 19mm, outside: 14mm, top: 19mm, bottom: 17mm),
  binding: left,
)

#let body-start-page = state("body-start", 100000)
#let running-head-text() = context {
  let p = here().page()
  if counter(page).get().first() < 1 or p < body-start-page.get() or is-blank() { return }
  if query(heading.where(level: 1)).any(h => h.location().page() == p) { return }
  let prev = query(heading.where(level: 1).before(here()))
  let chapter = if prev.len() > 0 { prev.last().body } else { [] }
  let num = counter(page).display()
  set text(size: 0.78em, fill: muted)
  if calc.even(p) {
    grid(columns: (auto, 1fr), gutter: 6pt, num, align(right, book-title))
  } else {
    grid(columns: (1fr, auto), gutter: 6pt, chapter, num)
  }
  v(-4pt)
  line(length: 100%, stroke: 0.4pt + luma(170))
}
// footnotes are numbered from 1 on each page, as in the printed books. The footnote counter runs through the book and
// the number shown is counted from the page's header (laid out first on every page). Resetting the counter in the
// header instead did not converge on pages with many notes (amawathura): numbers restarted in the middle of a page
#let running-head() = { [#metadata(none)<page-head>]; running-head-text() }
// a note whose text moves on to the next page keeps the number of its mark (the page of the mark counts)
#let fn-number(loc) = {
  let head = query(<page-head>).find(h => h.location().page() == loc.page())
  let before = if head == none { 0 } else { counter(footnote).at(head.location()).first() }
  str(counter(footnote).at(loc).first() - before)
}
// fixed-note-marks: a mark takes the room of two digits, so the lines do not change with the number (on a page with
// many notes a paragraph could move back and forth between two pages, its marks 18, 19 there and 1, 2 here)
#set footnote(numbering: n => context {
  let s = fn-number(here())
  if fixed-note-marks { sym.wj; box(width: measure("00").width, s) } else { s }
})
#show footnote.entry: it => if it.note.has("label") and it.note.label == <note-row> { it.note.body } else {
  context { super(fn-number(it.note.location())); it.note.body } }

// ---- headings
#set heading(numbering: none)
#show heading: set text(font: (heading-font, body-font), weight: heading-weight, fill: accent)
#show heading: set par(justify: false)
#show heading: set block(sticky: true)
#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  v(18mm)
  align(center, block(width: 88%, {
    text(size: 1.75em, it.body)
    v(2pt)
    text(size: 0.9em, fill: accent.lighten(30%), "෴")
  }))
  v(8mm)
}
#show heading.where(level: 2): it => block(above: 1.6em, below: 0.9em, width: 100%, align(center, text(size: 1.32em, it.body)))
#show heading.where(level: 3): it => block(above: 1.4em, below: 0.7em, text(size: 1.17em, it.body))
#show heading.where(level: 4): it => block(above: 1.2em, below: 0.6em, text(size: 1.06em, it.body))
#show heading.where(level: 5): set heading(outlined: false, bookmarked: false)
#show heading.where(level: 5): it => block(above: 1em, below: 0.5em, text(size: 1em, fill: ink, it.body))

#show figure.caption: set text(size: 0.85em, fill: muted)
#set enum(indent: 0.4em, spacing: 0.5em)
#set list(indent: 0.4em, spacing: 0.5em)

// footnotes at the page bottom
#set footnote.entry(separator: line(length: 28%, stroke: 0.4pt + luma(150)), gap: 0.4em, indent: 0em)
#show footnote.entry: set text(size: 0.8em)
#show footnote.entry: set par(justify: false, leading: 0.25em)

// ---- title page and the information page (no page numbers)
#set page(header: none, footer: none)
#align(center, {
  v(30mm)
  text(font: (heading-font, body-font), weight: heading-weight, size: 2.3em, fill: accent, book-title)
  if book-subtitle != "" { v(4mm); text(size: 1.15em, book-subtitle) }
  v(10mm)
  text(size: 1.4em, fill: accent.lighten(30%), "෴")
  v(10mm)
  if book-author != "" { text(size: 1.3em, book-author) }
})
#pagebreak()
#{
  set text(size: 0.85em)
  set par(justify: false)
  v(1fr)
  info
  v(8mm)
}

// ---- table of contents: roman page numbers until the main text (library/typst.js switches to 1, 2 ... there)
#let folio = context if not is-blank() { align(center, text(size: 0.78em, fill: muted, counter(page).display())) }
#oddbreak()
#metadata(none)<brk-start>
#set page(numbering: "i", footer: folio)
#{
  show outline.entry.where(level: 1): it => { v(0.5em, weak: true); strong(it) }
  set outline.entry(fill: repeat([.], gap: 0.25em))
  align(center, text(font: (heading-font, body-font), weight: heading-weight, size: 1.6em, fill: accent, "පටුන"))
  v(6mm)
  let toc = outline(title: none, depth: toc-depth, indent: 1.3em)
  if toc-columns > 1 { set text(size: 0.92em); columns(toc-columns, gutter: 7mm, toc) } else { toc }
}

// ---- the book
#oddbreak()
#metadata(none)<brk-start>
#context body-start-page.update(here().page())
#if not has-main { counter(page).update(1) }
#set page(header: running-head(), numbering: if has-main { "i" } else { "1" }, footer: context {
  // chapter openers: the page number at the foot
  let p = here().page()
  if not is-blank() and query(heading.where(level: 1)).any(h => h.location().page() == p) {
    align(center, text(size: 0.78em, fill: muted, counter(page).display()))
  }
})
#include "content.typ"
