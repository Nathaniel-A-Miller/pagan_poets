import fs from 'fs';
import path from 'path';


// Usage: node generate-index.js//


// Since the script runs from inside public/data/, everything is local (.)
const INDEX_PATH = './index.json';
const OUTPUT_PATH = './search-index.json';
const DATA_DIR = './';

// Strips a leading "data/" since the script runs from inside public/data/
function stripDataPrefix(p) {
  return p.replace(/^data\//, '');
}

// Walks every subdirectory of public/data/ and returns a poetMeta entry for any
// folder containing both analysis.json and source.json that isn't already
// represented in index.json. Lets new poet folders be picked up automatically
// without editing index.json by hand.
function discoverUnlistedPoets(indexedPoets) {
  const covered = new Set();
  indexedPoets.forEach(p => {
    if (p.analysis) covered.add(path.dirname(stripDataPrefix(p.analysis)));
    if (p.source) covered.add(path.dirname(stripDataPrefix(p.source)));
  });

  const discovered = [];
  for (const entry of fs.readdirSync(DATA_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = entry.name;
    if (covered.has(dir)) continue;

    const analysisPath = path.join(dir, 'analysis.json');
    const sourcePath = path.join(dir, 'source.json');
    if (!fs.existsSync(analysisPath) || !fs.existsSync(sourcePath)) continue;

    let poetMetaFromSource = {};
    try {
      const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
      poetMetaFromSource = sourceData.poet || {};
    } catch (e) {
      console.warn(`Could not read source.json for auto-discovered folder ${dir}:`, e.message);
    }

    console.log(`Auto-discovered poet folder not in index.json: ${dir}`);
    discovered.push({
      slug: dir,
      name_en: poetMetaFromSource.name_en,
      name_ar: poetMetaFromSource.name_ar,
      tribe: poetMetaFromSource.tribe,
      region: poetMetaFromSource.region,
      chronological_layer: poetMetaFromSource.chronological_layer,
      gender: poetMetaFromSource.gender,
      number_of_lines: poetMetaFromSource.number_of_lines,
      source: `data/${dir}/source.json`,
      analysis: `data/${dir}/analysis.json`,
    });
  }
  return discovered;
}

function generateSearchIndex() {
  console.log('Generating search index...');

  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`Error: Cannot find index.json at ${INDEX_PATH}`);
    return;
  }

  const indexRaw = fs.readFileSync(INDEX_PATH, 'utf-8');
  const poetIndex = JSON.parse(indexRaw);
  const allPoets = poetIndex.concat(discoverUnlistedPoets(poetIndex));
  const searchIndex = {};

  allPoets.forEach(poetMeta => {
    const slug = poetMeta.slug;
    const tokens = new Set();

    // 1. Index metadata
    if (poetMeta.name_en) poetMeta.name_en.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
    if (poetMeta.name_ar) tokens.add(poetMeta.name_ar);
    if (poetMeta.region) poetMeta.region.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
    if (poetMeta.period) poetMeta.period.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
    if (poetMeta.gender) tokens.add(poetMeta.gender.toLowerCase());

    // 2. Index analysis keywords and notes
    try {
      const cleanAnalysisPath = stripDataPrefix(poetMeta.analysis);
      const analysisRaw = fs.readFileSync(path.join(DATA_DIR, cleanAnalysisPath), 'utf-8');
      const analysisData = JSON.parse(analysisRaw);

      analysisData.forEach(item => {
        if (item.error) return;
        if (item.references) {
          item.references.forEach(ref => {
            if (ref.entity_or_term) {
              ref.entity_or_term.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
              tokens.add(ref.entity_or_term);
            }
            if (ref.notes) {
              ref.notes.toLowerCase()
                .replace(/[^\w\s؀-ۿ]/g, '')
                .split(/\s+/)
                .filter(t => t.length > 2)
                .forEach(t => tokens.add(t));
            }
          });
        }
      });
    } catch (e) {
      console.warn(`Could not read analysis file for ${slug}:`, e.message);
    }

    // 3. Index source verses
    try {
      const cleanSourcePath = stripDataPrefix(poetMeta.source);
      const sourceRaw = fs.readFileSync(path.join(DATA_DIR, cleanSourcePath), 'utf-8');
      const sourceData = JSON.parse(sourceRaw);

      if (sourceData.poems) {
        sourceData.poems.forEach(poem => {
          if (poem.verses) {
            poem.verses.forEach(v => {
              v.text.split(/\s+/).forEach(t => tokens.add(t));
            });
          }
        });
      }
    } catch (e) {
      console.warn(`Could not read source file for ${slug}:`, e.message);
    }

    // 4. Map tokens to slug
    tokens.forEach(token => {
      if (!token) return;
      const cleanToken = token.trim().toLowerCase();
      if (!searchIndex[cleanToken]) {
        searchIndex[cleanToken] = [];
      }
      if (!searchIndex[cleanToken].includes(slug)) {
        searchIndex[cleanToken].push(slug);
      }
    });
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(searchIndex, null, 2));
  console.log(`Success! Created search-index.json inside public/data/`);
}

generateSearchIndex();
