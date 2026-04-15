const fs = require('fs');
const path = require('path');

async function analyze() {
    console.log('Reading dictionary.json...');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/dictionary.json'), 'utf8'));
    
    // Load journeys to get sample words
    const journeysFile = fs.readFileSync(path.join(__dirname, '../src/lib/journeys.ts'), 'utf8');
    const sampleWords = new Set();
    const wordRegex = /startWord:\s*'([^']+)'|finishWord:\s*'([^']+)'/g;
    let match;
    while ((match = wordRegex.exec(journeysFile)) !== null) {
        const word = (match[1] || match[2]).toLowerCase();
        if (data[word]) sampleWords.add(word);
    }

    console.log(`Analyzing ${sampleWords.size} sample words from journeys...\n`);

    let totalSynonyms = 0;
    let sameLengthSynonyms = 0;
    let totalAntonyms = 0;
    let sameLengthAntonyms = 0;

    sampleWords.forEach(word => {
        const entry = data[word];
        const len = word.length;

        // Synonyms
        const syns = entry.synonyms || [];
        totalSynonyms += syns.length;
        sameLengthSynonyms += syns.filter(s => s.length === len).length;

        // Antonyms
        const ants = entry.antonyms || [];
        totalAntonyms += ants.length;
        sameLengthAntonyms += ants.filter(a => a.length === len).length;
    });

    const synRetention = ((sameLengthSynonyms / totalSynonyms) * 100).toFixed(1);
    const antRetention = ((sameLengthAntonyms / totalAntonyms) * 100).toFixed(1);

    console.log('--- RESULTS (Journey Sample) ---');
    console.log(`Synonyms: ${sameLengthSynonyms} / ${totalSynonyms} (${synRetention}% retained)`);
    console.log(`Antonyms: ${sameLengthAntonyms} / ${totalAntonyms} (${antRetention}% retained)`);

    // Global analysis
    console.log('\n--- GLOBAL ANALYSIS (All Words) ---');
    let gTotalSyn = 0;
    let gSameLenSyn = 0;
    let gTotalAnt = 0;
    let gSameLenAnt = 0;

    Object.keys(data).forEach(word => {
        const entry = data[word];
        const len = word.length;
        
        const syns = entry.synonyms || [];
        gTotalSyn += syns.length;
        gSameLenSyn += syns.filter(s => s.length === len).length;

        const ants = entry.antonyms || [];
        gTotalAnt += ants.length;
        gSameLenAnt += ants.filter(a => a.length === len).length;
    });

    console.log(`Synonyms: ${gSameLenSyn} / ${gTotalSyn} (${((gSameLenSyn/gTotalSyn)*100).toFixed(1)}% retained)`);
    console.log(`Antonyms: ${gSameLenAnt} / ${gTotalAnt} (${((gSameLenAnt/gTotalAnt)*100).toFixed(1)}% retained)`);
}

analyze();
