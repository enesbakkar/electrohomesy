const fs = require('fs');
const path = require('path');

const unzippedDir = 'c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\electrohomesy\\scratch\\unzipped';
const sheetXml = fs.readFileSync(path.join(unzippedDir, 'xl', 'worksheets', 'sheet1.xml'), 'utf8');

console.log('Sheet XML length:', sheetXml.length);

// Let's search for 'rId1', 'rId2', 'rId3' in the XML file
['rId1', 'rId2', 'rId3'].forEach(rId => {
    const idx = sheetXml.indexOf(rId);
    console.log(`Index of ${rId}:`, idx);
    if (idx !== -1) {
        console.log(`Snippet around ${rId}:`);
        console.log(sheetXml.slice(Math.max(0, idx - 100), Math.min(sheetXml.length, idx + 100)));
    }
});

// Let's search for '<hyperlink' tags in general
const count = (sheetXml.match(/<hyperlink/ig) || []).length;
console.log('Count of <hyperlink tags:', count);
if (count > 0) {
    const match = sheetXml.match(/<hyperlink[^>]*>/ig);
    console.log('Sample <hyperlink> tags:', match.slice(0, 5));
}
