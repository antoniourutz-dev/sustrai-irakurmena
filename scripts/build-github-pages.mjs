/**
 * Build GitHub Pages under /sustrai-irakurmena/ without modifying the Vercel source.
 * Static assets only: never ship SQL, migrations, tests, .github or environment files.
 * All application code remains first party. Supabase calls still use their own HTTPS URL.
 */
import { readdir, readFile, copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, join, dirname, relative, sep } from 'node:path';

const source = process.cwd();
const output = join(source, '.github-pages-site');
const base = '/sustrai-irakurmena';
const staticDirs = [
  'aditzak','admin','ahozkoa','ariketak','azterketak','fonts',
  'gramatika','habe','icons','idazlanak','irakurmena','ivap',
  'jokoak','mi-espacio'
];
const allowed = new Set([
  '.html','.css','.js','.json','.webmanifest','.svg','.png','.jpg',
  '.jpeg','.webp','.gif','.ico','.woff','.woff2','.ttf','.txt'
]);
const textual = new Set(['.html','.css','.js','.json','.webmanifest','.svg','.txt']);
let processed = 0;
let rewritten = 0;

function prefixRootPaths(contents, path) {
  // Only literal absolute local paths. Never rewrite https:// and protocol-relative URLs.
  // Applies to quoted HTML attributes, CSS strings, JS strings, and JSON values.
  let n = 0;
  let next = contents.replace(/(["'\`])\/(?!\/|sustrai-irakurmena(?:\/|["'\`]))/g, (_full, quote) => {
    n++;
    return quote + base + '/';
  });
  // Also support the unquoted url(/asset) CSS form.
  next = next.replace(/url\(\s*\/(?!\/|sustrai-irakurmena\/)/gi, () => {
    n++;
    return 'url(' + base + '/';
  });
  if (path.endsWith('.html')) {
    next = next.replace(/(\b(?:src|href|action|content)=)\/(?!\/|sustrai-irakurmena\/)/gi, (_full, name) => {
      n++;
      return name + base + '/';
    });
  }
  rewritten += n;
  return next;
}

async function buildFile(path) {
  const ext = extname(path).toLowerCase();
  if (!allowed.has(ext)) return;
  if (path.split(sep).some(part => part.startsWith('.') || part === 'node_modules')) return;
  const target = join(output, path);
  await mkdir(dirname(target), { recursive: true });
  if (textual.has(ext)) {
    const raw = await readFile(join(source, path), 'utf8');
    await writeFile(target, prefixRootPaths(raw, path));
  } else {
    await copyFile(join(source, path), target);
  }
  processed++;
}

async function visit(path) {
  for (const entry of await readdir(join(source, path), { withFileTypes:true })) {
    if (entry.name.startsWith('.')) continue;
    const filename = join(path, entry.name);
    if (entry.isDirectory()) await visit(filename);
    else if (entry.isFile()) await buildFile(filename);
  }
}

await rm(output, { recursive:true, force:true });
await mkdir(output, { recursive:true });
for (const entry of await readdir(source, { withFileTypes:true })) {
  if (entry.isFile()) await buildFile(entry.name);
}
for (const dir of staticDirs) await visit(dir);
await writeFile(join(output, '.nojekyll'), '');

const main = await readFile(join(output, 'index.html'), 'utf8');
const b2 = await readFile(join(output, 'gramatika/ibilbidea/index.html'), 'utf8');
const auth = await readFile(join(output, 'auth.js'), 'utf8');
const sw = await readFile(join(output, 'sw.js'), 'utf8');
const manifest = await readFile(join(output, 'manifest.webmanifest'), 'utf8');

const mustContain = [
  [main, 'href="' + base + '/', 'root links'],
  [b2, base + '/gramatika/ibilbidea/app.js', 'B2 script'],
  [b2, base + '/gramatika/ibilbidea/style.css', 'B2 CSS'],
  [auth, "location.origin+'" + base + "/'", 'authentication redirect'],
  [sw, "'" + base + "/index.html'", 'offline shell'],
  [manifest, base + '/', 'manifest scope']
];
for (const [content, expected, what] of mustContain) {
  if (!content.includes(expected)) throw Error('GitHub Pages path rewrite failed: '+what);
}
const strayRootLinks = [...b2.matchAll(/\b(?:href|src)="\/(?!sustrai-irakurmena\/|\/)/g)];
if (strayRootLinks.length) throw Error('Unprefixed site assets on B2 page');
if (!processed || !rewritten) throw Error('Empty website output');

console.log('GitHub Pages: '+processed+' static files, '+rewritten+' root-relative paths rewritten, base '+base);
console.log('Built at '+relative(source, output));
