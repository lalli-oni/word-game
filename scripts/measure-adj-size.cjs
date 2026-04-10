const fs = require('fs');
const path = require('path');

function isOneLetterDifferent(w1, w2) {
    if (w1.length !== w2.length) return false;
    let diffs = 0;
    for (let i = 0; i < w1.length; i++) {
        if (w1[i] !== w2[i]) diffs++;
        if (diffs > 1) return false;
    }
    return diffs === 1;
}

function isAnagram(w1, w2) {
    if (w1.length !== w2.length || w1 === w2) return false;
    return w1.split('').sort().join('') === w2.split('').sort().join('');
}

async function measure() {
    console.log('Reading dictionary.json...');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/dictionary.json'), 'utf8'));
    const allWords = Object.keys(data);
    
    // Sort words by rank to find the top 20,000
    const sortedWords = allWords.sort((a, b) => data[a].rank - data[b].rank);
    const topWords = sortedWords.slice(0, 20000);
    const topSet = new Set(topWords);
    
    console.log(`Calculating adjacency for top ${topWords.length} words...`);
    
    // Group words by length for faster comparison
    const byLength = {};
    allWords.forEach(w => {
        if (!byLength[w.length]) byLength[w.length] = [];
        byLength[w.length].push(w);
    });
    
    let totalAdjacencies = 0;
    let addedCharCount = 0;

    topWords.forEach((word, i) => {
        const neighbors = [];
        const sameLength = byLength[word.length] || [];
        
        for (const candidate of sameLength) {
            if (isOneLetterDifferent(word, candidate) || isAnagram(word, candidate)) {
                neighbors.push(candidate);
            }
        }
        
        totalAdjacencies += neighbors.length;
        // Estimate JSON overhead: "n":["word1","word2",...]
        // Each word + quotes + comma + some overhead
        addedCharCount += JSON.stringify(neighbors).length + 5; 

        if (i % 5000 === 0) console.log(`Processed ${i} words...`);
    });

    const originalSize = fs.statSync(path.join(__dirname, '../public/dictionary.json')).size;
    const overheadMB = (addedCharCount / (1024 * 1024)).toFixed(2);
    
    console.log('\n--- RESULTS ---');
    console.log(`Original Size: ${(originalSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Estimated Overhead for Top 20k: ${overheadMB} MB`);
    console.log(`Total Neighbor Connections: ${totalAdjacencies}`);
    console.log(`Average Neighbors per word: ${(totalAdjacencies / topWords.length).toFixed(1)}`);
}

measure();
