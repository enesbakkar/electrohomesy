const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5K760yqK8c2D3q5YpLwzY6vV-l1F5c6L8G3m0/pubhtml'; // Wait, let's use the spreadsheet ID URL
const docUrl = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/pubhtml';

https.get(docUrl, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('PubHTML Status Code:', res.statusCode);
        console.log('PubHTML Content Length:', data.length);
        if (data.includes('ثلاجة')) {
            console.log('Success! Found product text "ثلاجة" in PubHTML.');
            const matches = data.match(/href="([^"]*)"/g);
            if (matches) {
                console.log(`Found ${matches.length} links. Here are some:`);
                console.log(matches.slice(0, 10));
            }
        } else {
            console.log('Did not find sheet content in PubHTML. Maybe login required.');
            console.log(data.slice(0, 500));
        }
    });
}).on('error', (err) => {
    console.error('Error fetching PubHTML:', err.message);
});
