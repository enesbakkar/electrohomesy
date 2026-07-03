const https = require('https');
const fs = require('fs');

const url = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/export?format=xlsx';
const dest = 'c:\\Users\\enesb\\OneDrive\\Belgeler\\software_projects\\electrohomesy\\scratch\\sheet.xlsx';

const file = fs.createWriteStream(dest);

https.get(url, (res) => {
    res.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log('XLSX downloaded successfully to:', dest);
    });
}).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Error downloading XLSX:', err.message);
});
