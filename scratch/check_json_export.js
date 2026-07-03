const https = require('https');

const url = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:json';

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        // gviz json starts with a wrapper function call, e.g. google.visualization.Query.setResponse({...})
        const match = data.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
        if (match) {
            const jsonObj = JSON.parse(match[1]);
            const rows = jsonObj.table.rows;
            console.log('Sample cell object (Row 1, Column 10 - Image):');
            console.log(JSON.stringify(rows[0].c[10], null, 2));
            console.log('Sample cell object (Row 2, Column 10 - Image):');
            console.log(JSON.stringify(rows[1].c[10], null, 2));
        } else {
            console.log('Failed to match query response.');
            console.log(data.slice(0, 500));
        }
    });
}).on('error', (err) => {
    console.error('Error fetching JSON:', err.message);
});
