// Sinhala Unicode words from the pitaka.lk books, for round-trip and regression tests.
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../books')

export function bookWords({ maxFiles = 400 } = {}) {
    const files = []
    for (const book of fs.readdirSync(root)) {
        const dir = path.join(root, book)
        if (!fs.statSync(dir).isDirectory()) continue
        for (const f of fs.readdirSync(dir)) if (f.endsWith('.html') && f !== 'index.html') files.push(path.join(dir, f))
    }
    files.sort()
    const step = Math.max(1, Math.floor(files.length / maxFiles))
    const counts = new Map()
    for (let i = 0; i < files.length; i += step) {
        const html = fs.readFileSync(files[i], 'utf8')
        const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
        for (const w of text.match(/[඀-෿‌‍]+/g) || []) counts.set(w, (counts.get(w) || 0) + 1)
    }
    return counts
}
