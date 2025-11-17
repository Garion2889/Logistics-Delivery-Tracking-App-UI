const fs = require('fs').promises;
const path = require('path');

const root = path.resolve(__dirname, '..');
const uiDir = path.join(root, 'src', 'components', 'ui');
const srcDir = path.join(root, 'src');
const exts = ['.ts', '.tsx', '.js', '.jsx'];

async function listUiFiles() {
  const entries = await fs.readdir(uiDir, { withFileTypes: true });
  return entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(n => exts.some(x => n.endsWith(x)));
}

async function listSourceFiles(dir) {
  let results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      results = results.concat(await listSourceFiles(full));
    } else if (exts.some(x => e.name.endsWith(x))) {
      results.push(full);
    }
  }
  return results;
}

async function countReferences(basenames, files) {
  const counts = {};
  for (const b of basenames) counts[b] = 0;

  for (const f of files) {
    const content = await fs.readFile(f, 'utf8');
    for (const b of basenames) {
      let c = 0;
      if (content.includes(`/ui/${b}`)) c += content.split(`/ui/${b}`).length - 1;
      if (content.includes(`components/ui/${b}`)) c += content.split(`components/ui/${b}`).length - 1;
      if (content.includes(`./ui/${b}`)) c += content.split(`./ui/${b}`).length - 1;
      counts[b] += c;
    }
  }
  return counts;
}

(async function main(){
  try {
    const uiFiles = await listUiFiles();
    const basenames = uiFiles.map(f => f.replace(/\.(ts|tsx|js|jsx)$/, ''));
    const srcFiles = await listSourceFiles(srcDir);
    const counts = await countReferences(basenames, srcFiles);

    const unused = Object.entries(counts).filter(([k,v]) => v === 0).map(([k]) => {
      const orig = uiFiles.find(f => f.startsWith(k));
      return orig || (k + '.tsx');
    });

    const report = { totalUiFiles: uiFiles.length, uiFiles, counts, unused };
    console.log(JSON.stringify(report, null, 2));
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
