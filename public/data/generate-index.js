import fs from 'fs';
import path from 'path';


//
Usage 
node generate-index.js
//


// Since the script runs from inside public/data/, everything is local (.)
const INDEX_PATH = './index.json'; 
const OUTPUT_PATH = './search-index.json';
const DATA_DIR = './'; 

function generateSearchIndex() {
  console.log('Generating search index...');
  
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`Error: Cannot find index.json at ${INDEX_PATH}`);
    return;
  }

  const indexRaw = fs.readFileSync(INDEX_PATH, 'utf-8');
  const poetIndex = JSON.parse(indexRaw);
  const searchIndex = {};

  poetIndex.forEach(poetMeta => {
    const slug = poetMeta.slug;
    const tokens = new Set();

    // 1. Index metadata
    if (poetMeta.name_en) poetMeta.name_en.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
    if (poetMeta.name_ar) tokens.add(poetMeta.name_ar);
    if (poetMeta.region) poetMeta.region.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));
    if (poetMeta.period) poetMeta.period.toLowerCase().split(/\s+/).forEach(t => tokens.add(t));

    // 2. Index analysis keywords and notes
    try {
      // Stripping "data/" from path since we are already inside it
      const cleanAnalysisPath = poetMeta.analysis.replace(/^data\//, '');
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
                .replace(/[^\w\s\u0600-\u06FF]/g, '')
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
      const cleanSourcePath = poetMeta.source.replace(/^data\//, '');
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