// Repository check. Runs in CI and locally (`npm run check`), no dependencies.
// It guards what a release must never lose: a parseable manifest and app declaration (a raw apostrophe in the
// single-quoted robutler:widget meta drops the whole declaration with no error), the entry pin, a served folder
// that holds only what should be served, and the platform copy rules for user-facing text.
import fs from 'node:fs';

const fail = [];
const read = (p) => fs.readFileSync(p, 'utf8');
const must = (cond, msg) => { if (!cond) fail.push(msg); };

const rj = JSON.parse(read('robutler.json'));
must(typeof rj.widgetType === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(rj.widgetType), 'robutler.json must name a kebab-case widgetType');
must(rj.sourcePath === 'app' && rj.build === null, 'robutler.json must name sourcePath app and no build');

const manifest = JSON.parse(read('app/widget.json'));
must(manifest._meta && manifest._meta.ui && manifest._meta.ui.resourceUri === './index.html', 'app/widget.json must name ./index.html as its entry');
for (const f of fs.readdirSync('app')) must(!/^(README|NOTICE|LICENSE|robutler\.json|package(-lock)?\.json|node_modules|test|\.)/i.test(f), `app/${f} would be served; keep repository files at the root`);

const html = read('app/index.html');
const meta = html.match(/name="robutler:widget" content='([^']*)'/);
must(!!meta, 'robutler:widget meta not found');
if (meta) {
  const decl = JSON.parse(meta[1]);
  must(typeof decl.title === 'string' && decl.title.length > 0, 'the app declaration needs a title');
}
must(/app\.js\?v=\d+/.test(html), 'entry pin app.js?v=N missing');

// User-facing copy: index.html text and README. No "widget" outside code identifiers, no em-dash, no emoji.
const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '')
  .replace(/<meta[^>]*>/g, (m) => (/robutler:widget"/.test(m) ? (meta ? meta[1] : '') : ''));
must(!/widget/i.test(visible.replace(/robutler:widget/g, '')), 'user-facing text in index.html says "widget"');
for (const [name, text] of [['index.html', visible], ['README.md', read('README.md')]]) {
  must(!/—/.test(text), `${name} has an em-dash`);
  must(!/\p{Extended_Pictographic}/u.test(text), `${name} has an emoji`);
}

if (fail.length) { console.error(fail.map((f) => 'FAIL ' + f).join('\n')); process.exit(1); }
console.log('check ok');
