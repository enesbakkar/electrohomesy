const fs = require('fs');
const zlib = require('zlib');

const zipBuffer = fs.readFileSync('c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\electrohomesy\\scratch\\sheet.xlsx');

function extractFileFromZip(zipBuf, targetPath) {
    let offset = 0;
    while (offset < zipBuf.length - 30) {
        // Search for Local File Header Signature: PK\x03\x04
        if (zipBuf.readUInt32LE(offset) !== 0x04034b50) {
            offset++;
            continue;
        }

        const compressionMethod = zipBuf.readUInt16LE(offset + 8);
        const compressedSize = zipBuf.readUInt32LE(offset + 18);
        const uncompressedSize = zipBuf.readUInt32LE(offset + 22);
        const fileNameLength = zipBuf.readUInt16LE(offset + 26);
        const extraFieldLength = zipBuf.readUInt16LE(offset + 28);

        const fileName = zipBuf.toString('utf8', offset + 30, offset + 30 + fileNameLength);
        if (fileName === targetPath) {
            const dataOffset = offset + 30 + fileNameLength + extraFieldLength;
            const compressedData = zipBuf.slice(dataOffset, dataOffset + compressedSize);

            if (compressionMethod === 8) { // Deflate
                return zlib.inflateRawSync(compressedData);
            } else if (compressionMethod === 0) { // Store
                return compressedData;
            } else {
                throw new Error(`Unsupported compression method: ${compressionMethod}`);
            }
        }

        offset += 30 + fileNameLength + extraFieldLength + compressedSize;
    }
    return null;
}

try {
    const rels = extractFileFromZip(zipBuffer, 'xl/worksheets/_rels/sheet1.xml.rels');
    console.log('Rels extracted! Length:', rels ? rels.length : null);
    if (rels) {
        console.log(rels.toString('utf8').slice(0, 300));
    }
} catch (e) {
    console.error('Error:', e.message);
}
