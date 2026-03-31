const fs = require('fs');
const path = require('path');
const WordNet = require('node-wordnet');
const naughty = require('naughty-words');
const subtlex = require('subtlex-word-frequencies');

const wordnet = new WordNet();
const dictionary = {};
const allProfanity = new Set();
const wordRanks = {};

console.log('Loading frequency data...');
subtlex.forEach((item, index) => {
    wordRanks[item.word.toLowerCase()] = index + 1;
});

// Max rank + 1 for words not in SUBTLEX
const DEFAULT_RANK = subtlex.length + 1;

// Collect all English profanity
Object.values(naughty).forEach(list => {
    if (Array.isArray(list)) {
        list.forEach(word => allProfanity.add(word.toLowerCase()));
    }
});

async function build() {
    console.log('Building dictionary from WordNet DB files...');
    
    const dictPath = path.join(__dirname, '../node_modules/wordnet-db/dict');
    const indexFiles = ['index.adj', 'index.adv', 'index.noun', 'index.verb'];
    
    const allLemmas = new Set();

    for (const file of indexFiles) {
        console.log(`Reading ${file}...`);
        const filePath = path.join(dictPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach(line => {
            if (line.startsWith('  ')) return;
            const parts = line.split(' ');
            const lemma = parts[0];
            if (lemma && lemma.length >= 2 && !lemma.includes('_') && !lemma.includes('-')) {
                allLemmas.add(lemma.toLowerCase());
            }
        });
    }

    const lemmas = Array.from(allLemmas);
    console.log(`Extracted ${lemmas.length} unique lemmas. Processing relations and ranks...`);

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
                }

                const tags = [];
                if (allProfanity.has(lemma)) {
                    tags.push('profanity');
                }

                dictionary[lemma] = {
                    synonyms: Array.from(synonyms),
                    antonyms: Array.from(antonyms),
                    tags,
                    rank: wordRanks[lemma] || DEFAULT_RANK
                };
            } catch (e) {}
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
