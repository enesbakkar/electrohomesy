const fs = require('fs');
const path = require('path');

const unzippedDir = 'c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\electrohomesy\\scratch\\unzipped';
const sheetXml = fs.readFileSync(path.join(unzippedDir, 'xl', 'worksheets', 'sheet1.xml'), 'utf8');
const sharedStringsXml = fs.readFileSync(path.join(unzippedDir, 'xl', 'sharedStrings.xml'), 'utf8');

const sharedStrings = [];
const siRegex = /<si>[\s\S]*?<\/si>/g;
let siMatch;
while ((siMatch = siRegex.exec(sharedStringsXml)) !== null) {
    const tMatch = siMatch[0].match(/<t[^>]*>([\s\S]*?)<\/t>/);
    sharedStrings.push(tMatch ? tMatch[1] : '');
}

const rows = [];
const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
let rowMatch;
while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[0];
    const rowNumMatch = rowContent.match(/r="(\d+)"/);
    const rowNum = parseInt(rowNumMatch[1], 10);

    const cellRegex = /<c\s+r="([A-Z]+)(\d+)"\s*(?:s="[^"]*")?\s*(?:t="([^"]*)")?>([\s\S]*?)<\/c>/g;
    let cellMatch;
    const rowCells = {};
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const colLetter = cellMatch[1];
        const cellType = cellMatch[3] || '';
        const vMatch = cellMatch[4].match(/<v>([\s\S]*?)<\/v>/);
        const rawVal = vMatch ? vMatch[1] : '';

        let finalVal = '';
        if (cellType === 's') {
            const idx = parseInt(rawVal, 10);
            finalVal = sharedStrings[idx] || '';
        } else {
            finalVal = rawVal;
        }
        rowCells[colLetter] = finalVal;
    }
    rows.push({ rowNum, cells: rowCells });
}

console.log('Non-empty Rows for Images/Videos:');
console.log('Row | Product | Image Col (K) | Video Col (L)');
console.log('--------------------------------------------');
rows.forEach(r => {
    if (r.cells.K || r.cells.L) {
        console.log(`${r.rowNum} | ${r.cells.B || ''} | ${r.cells.K || ''} | ${r.cells.L || ''}`);
    }
});
