const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/export?format=html';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('HTML Data Length:', data.length);
        
        // Let's search for some hyperlinks inside the HTML data
        const matches = data.match(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>(.*?)<\/a>/g);
        if (matches) {
            console.log(`Found ${matches.length} hyperlinks. Here are the first 10:`);
            matches.slice(0, 10).forEach((m, idx) => {
                console.log(`${idx + 1}: ${m}`);
            });
        } else {
            console.log('No hyperlinks found in the HTML export.');
        }
    });
}).on('error', (err) => {
    console.error('Error fetching HTML export:', err.message);
});
