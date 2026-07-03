const fs = require('fs');
const path = require('path');

const unzippedDir = 'c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\electrohomesy\\scratch\\unzipped';

function parseXMLData() {
    const sheetXml = fs.readFileSync(path.join(unzippedDir, 'xl', 'worksheets', 'sheet1.xml'), 'utf8');
    const relsXml = fs.readFileSync(path.join(unzippedDir, 'xl', 'worksheets', '_rels', 'sheet1.xml.rels'), 'utf8');
    const sharedStringsXml = fs.readFileSync(path.join(unzippedDir, 'xl', 'sharedStrings.xml'), 'utf8');

    // 1. Parse Shared Strings
    // Shared strings are inside <si><t>Text</t></si> or <si><t xml:space="preserve">Text</t></si>
    const sharedStrings = [];
    const siRegex = /<si>[\s\S]*?<\/si>/g;
    let siMatch;
    while ((siMatch = siRegex.exec(sharedStringsXml)) !== null) {
        const siContent = siMatch[0];
        const tMatch = siContent.match(/<t[^>]*>([\s\S]*?)<\/t>/);
        sharedStrings.push(tMatch ? tMatch[1] : '');
    }
    console.log(`Parsed ${sharedStrings.length} shared strings.`);

    // 2. Parse Relationships (hyperlinks)
    // <Relationship Id="rId1" Type="..." Target="URL" .../>
    const rels = {};
    const relRegex = /<Relationship\s+Id="([^"]+)"\s+Type="[^"]+hyperlink"\s+Target="([^"]+)"/g;
    let relMatch;
    while ((relMatch = relRegex.exec(relsXml)) !== null) {
        rels[relMatch[1]] = relMatch[2];
    }
    console.log(`Parsed ${Object.keys(rels).length} hyperlink relationships.`);

    // 3. Parse Sheet Hyperlink Map
    // <hyperlink ref="K3" r:id="rId1"/>
    const cellHyperlinks = {};
    const hyperlinkRegex = /<hyperlink\s+ref="([^"]+)"\s+r:id="([^"]+)"/g;
    let hyperlinkMatch;
    while ((hyperlinkMatch = hyperlinkRegex.exec(sheetXml)) !== null) {
        const cellRef = hyperlinkMatch[1]; // e.g. "K3"
        const rId = hyperlinkMatch[2]; // e.g. "rId1"
        if (rels[rId]) {
            cellHyperlinks[cellRef] = rels[rId];
        }
    }
    console.log(`Mapped ${Object.keys(cellHyperlinks).length} cell hyperlinks.`);

    // 4. Parse Rows and Cells
    // Let's parse cells in each row
    const rows = [];
    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
        const rowContent = rowMatch[0];
        const rowNumMatch = rowContent.match(/r="(\d+)"/);
        const rowNum = rowNumMatch ? parseInt(rowNumMatch[1], 10) : (rows.length + 1);

        // Get all cells in this row: <c r="A1" ...>
        const cellRegex = /<c\s+r="([A-Z]+)(\d+)"\s*(?:s="[^"]*")?\s*(?:t="([^"]*)")?>([\s\S]*?)<\/c>/g;
        let cellMatch;
        const rowCells = {};
        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
            const colLetter = cellMatch[1]; // e.g. "A"
            const cellType = cellMatch[3] || ''; // e.g. "s" (string) or empty (number)
            const vMatch = cellMatch[4].match(/<v>([\s\S]*?)<\/v>/);
            const rawVal = vMatch ? vMatch[1] : '';

            let finalVal = '';
            if (cellType === 's') { // Shared string index
                const idx = parseInt(rawVal, 10);
                finalVal = sharedStrings[idx] || '';
            } else {
                finalVal = rawVal;
            }

            // Check if there is a hyperlink for this cell
            const cellRef = `${colLetter}${rowNum}`;
            const link = cellHyperlinks[cellRef] || '';

            rowCells[colLetter] = {
                value: finalVal,
                link: link
            };
        }
        rows.push({
            rowNum: rowNum,
            cells: rowCells
        });
    }

    console.log(`Parsed ${rows.length} rows from sheet1.xml.`);
    
    // Log sample rows (Row 2 and Row 3)
    console.log('Row 3:', JSON.stringify(rows[2], null, 2));
    console.log('Row 4:', JSON.stringify(rows[3], null, 2));
}

try {
    parseXMLData();
} catch (e) {
    console.error('Error:', e.stack);
}
