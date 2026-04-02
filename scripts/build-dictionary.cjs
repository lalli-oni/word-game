const fs = require('fs');
const path = require('path');
const WordNet = require('node-wordnet');
const naughty = require('naughty-words');
const subtlex = require('subtlex-word-frequencies');
const crypto = require('crypto');

const wordnet = new WordNet();
const dictionary = {};
const allProfanity = new Set();
const wordRanks = {};

console.log('Loading frequency data...');
subtlex.forEach((item, index) => {
    wordRanks[item.word.toLowerCase()] = index + 1;
});

const DEFAULT_RANK = subtlex.length + 1;

Object.values(naughty).forEach(list => {
    if (Array.isArray(list)) {
        list.forEach(word => allProfanity.add(word.toLowerCase()));
    }
});

function simplePlural(word) {
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
        return word + 'es';
    }
    if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
        return word.slice(0, -1) + 'ies';
    }
    return word + 's';
}

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
    console.log(`Extracted ${lemmas.length} unique lemmas. Processing relations and inflections...`);

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

                    if (res.ptrs) {
                        for (const ptr of res.ptrs) {
                            if (ptr.pointerSymbol === '!') {
                                try {
                                    const antRes = await wordnet.getAsync(ptr.synsetOffset, ptr.pos);
                                    antRes.synonyms.forEach(a => {
                                        const ant = a.toLowerCase();
                                        if (ant !== lemma && !ant.includes('_') && !ant.includes('-')) {
                                            antonyms.add(ant);
                                        }
                                    });
                                } catch (e) {}
                            }
                        }
                    }
                }

                const tags = [];
                if (allProfanity.has(lemma)) {
                    tags.push('profanity');
                }

                const entry = {
                    synonyms: Array.from(synonyms),
                    antonyms: Array.from(antonyms),
                    tags,
                    rank: wordRanks[lemma] || DEFAULT_RANK
                };

                dictionary[lemma] = entry;

                const plural = simplePlural(lemma);
                if (!dictionary[plural]) {
                    dictionary[plural] = {
                        synonyms: entry.synonyms.map(s => simplePlural(s)),
                        antonyms: entry.antonyms.map(a => simplePlural(a)),
                        tags: [...entry.tags],
                        rank: wordRanks[plural] || Math.min(entry.rank + 5000, DEFAULT_RANK)
                    };
                }

            } catch (e) {}
        }));
        
        if (i % 5000 === 0) {
            console.log(`Processed ${i} / ${lemmas.length} words...`);
        }
    }

    const dictionaryContent = JSON.stringify(dictionary);
    const hash = crypto.createHash('md5').update(dictionaryContent).digest('hex');

    const outputPath = path.join(__dirname, '../public/dictionary.json');
    const hashPath = path.join(__dirname, '../public/dictionary.hash');

    fs.writeFileSync(outputPath, dictionaryContent);
    fs.writeFileSync(hashPath, hash);

    console.log(`\nSuccess! Dictionary built with ${Object.keys(dictionary).length} words.`);
    console.log(`Content Hash: ${hash}`);
}

build();
