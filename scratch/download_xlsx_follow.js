const https = require('https');
const fs = require('fs');
const url = require('url');

const dest = 'c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\electrohomesy\\scratch\\sheet.xlsx';

function downloadFile(fileUrl) {
    console.log('Fetching:', fileUrl);
    https.get(fileUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`Redirected to: ${res.headers.location}`);
            downloadFile(res.headers.location);
            return;
        }

        let dataChunks = [];
        res.on('data', (chunk) => { dataChunks.push(chunk); });
        res.on('end', () => {
            const buffer = Buffer.concat(dataChunks);
            if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
                // If it still returned HTML, check if there's a meta redirect or a link
                const html = buffer.toString();
                const match = html.match(/href="([^"]+)"/i);
                if (match) {
                    let nextUrl = match[1].replace(/&amp;/g, '&');
                    if (nextUrl.startsWith('//')) nextUrl = 'https:' + nextUrl;
                    console.log(`HTML Redirect Link Found: ${nextUrl}`);
                    downloadFile(nextUrl);
                    return;
                }
            }

            fs.writeFileSync(dest, buffer);
            console.log('File written. Size:', buffer.length, 'bytes');
        });
    }).on('error', (err) => {
        console.error('Download error:', err.message);
    });
}

downloadFile('https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/export?format=xlsx');
