const fs = require('fs');
const path = require('path');
const WordNet = require('node-wordnet');
const naughty = require('naughty-words');

const wordnet = new WordNet();
const dictionary = {};
const allProfanity = new Set();

// Collect all English profanity
Object.values(naughty).forEach(list => {
    if (Array.isArray(list)) {
        list.forEach(word => allProfanity.add(word.toLowerCase()));
    }
});

async function build() {
    console.log('Building dictionary from WordNet DB files...');
    
    // WordNet DB paths
    const dictPath = path.join(__dirname, '../node_modules/wordnet-db/dict');
    const indexFiles = ['index.adj', 'index.adv', 'index.noun', 'index.verb'];
    
    const allLemmas = new Set();

    for (const file of indexFiles) {
        console.log(`Reading ${file}...`);
        const filePath = path.join(dictPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach(line => {
            if (line.startsWith('  ')) return; // Skip header
            const parts = line.split(' ');
            const lemma = parts[0];
            if (lemma && lemma.length >= 2 && !lemma.includes('_') && !lemma.includes('-')) {
                allLemmas.add(lemma.toLowerCase());
            }
        });
    }

    const lemmas = Array.from(allLemmas);
    console.log(`Extracted ${lemmas.length} unique lemmas. Processing relations...`);

    const batchSize = 500;
    for (let i = 0; i < lemmas.length; i += batchSize) {
        const batch = lemmas.slice(i, i + batchSize);
        await Promise.all(batch.map(async (lemma) => {
            try {
                const results = await wordnet.lookupAsync(lemma);
                const synonyms = new Set();
                const antonyms = new Set();

                for (const res of results) {
                    res.synonyms.forEach(s => {
                        const syn = s.toLowerCase();
                        if (syn !== lemma && !syn.includes('_') && !syn.includes('-')) {
                            synonyms.add(syn);
                        }
                    });
                    
                    // Note: Antonyms in node-wordnet require follow-up lookups for ptrs
                    // For now, we'll focus on synonyms to keep the build time reasonable.
                }

                const tags = [];
                if (allProfanity.has(lemma)) {
                    tags.push('profanity');
                }

                dictionary[lemma] = {
                    synonyms: Array.from(synonyms),
                    antonyms: Array.from(antonyms),
                    tags
                };
            } catch (e) {
                // Ignore individual lookup errors
            }
        }));
        
        if (i % 5000 === 0) {
            console.log(`Processed ${i} / ${lemmas.length} words...`);
        }
    }

    const outputPath = path.join(__dirname, '../public/dictionary.json');
    fs.writeFileSync(outputPath, JSON.stringify(dictionary));
    console.log(`\nSuccess! Dictionary built with ${Object.keys(dictionary).length} words.`);
    console.log(`Saved to ${outputPath}`);
}

build();
