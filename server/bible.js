const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

const DATA_DIR = path.join(__dirname, 'data', 'bible');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

/**
 * Parse buffer file XML format Zefania menjadi struktur JSON sederhana:
 * { name, code, books: [ { name, chapters: [ [verse1, verse2, ...], ... ] } ] }
 */
function parseZefaniaXml(xmlString) {
  const doc = parser.parse(xmlString);
  const root = doc.XMLBIBLE;
  if (!root) throw new Error('Format XML tidak dikenali (bukan Zefania XML / tag XMLBIBLE tidak ditemukan)');

  let bookNodes = root.BIBLEBOOK;
  if (!Array.isArray(bookNodes)) bookNodes = [bookNodes];

  const books = bookNodes.map((bookNode) => {
    let chapterNodes = bookNode.CHAPTER;
    if (!Array.isArray(chapterNodes)) chapterNodes = [chapterNodes];

    const chapters = chapterNodes.map((chNode) => {
      let versNodes = chNode.VERS;
      if (!versNodes) return [];
      if (!Array.isArray(versNodes)) versNodes = [versNodes];

      // Urutkan berdasarkan nomor ayat, isi array index 0 = ayat 1, dst.
      const maxV = Math.max(...versNodes.map((v) => parseInt(v['@_vnumber'], 10)));
      const verses = new Array(maxV).fill('');
      versNodes.forEach((v) => {
        const idx = parseInt(v['@_vnumber'], 10) - 1;
        const text = typeof v === 'object' ? (v['#text'] ?? '') : String(v);
        verses[idx] = String(text).trim();
      });
      return verses;
    });

    return {
      name: bookNode['@_bname'],
      chapters,
    };
  });

  return { books };
}

function savedTranslationsIndexPath() {
  return path.join(DATA_DIR, '_index.json');
}

function loadIndex() {
  const p = savedTranslationsIndexPath();
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function saveIndex(index) {
  fs.writeFileSync(savedTranslationsIndexPath(), JSON.stringify(index, null, 2));
}

/** Simpan hasil parse ke disk, terdaftar dengan kode singkat (mis. "TB") */
function saveTranslation(code, name, parsedData) {
  const filePath = path.join(DATA_DIR, `${code}.json`);
  fs.writeFileSync(filePath, JSON.stringify(parsedData));

  const index = loadIndex().filter((t) => t.code !== code);
  index.push({ code, name, bookCount: parsedData.books.length });
  saveIndex(index);
}

function listTranslations() {
  return loadIndex();
}

function loadTranslation(code) {
  const filePath = path.join(DATA_DIR, `${code}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function listBooks(code) {
  const data = loadTranslation(code);
  if (!data) return null;
  return data.books.map((b) => ({ name: b.name, chapterCount: b.chapters.length }));
}

function getVerses(code, bookName, chapter, verseFrom, verseTo) {
  const data = loadTranslation(code);
  if (!data) return null;
  const book = data.books.find((b) => b.name.toLowerCase() === bookName.toLowerCase());
  if (!book) return null;
  const chapterVerses = book.chapters[chapter - 1];
  if (!chapterVerses) return null;

  const from = verseFrom || 1;
  const to = verseTo || from;
  const result = [];
  for (let v = from; v <= to; v++) {
    if (chapterVerses[v - 1]) {
      result.push({ verse: v, text: chapterVerses[v - 1] });
    }
  }
  return result;
}

module.exports = {
  parseZefaniaXml,
  saveTranslation,
  listTranslations,
  listBooks,
  getVerses,
};
