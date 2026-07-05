const https = require('https');
const fs = require('fs');
const path = require('path');

// Parses CSV text, handling quoted fields
function parseCSV(text) {
    const lines = text.split(/\r?\n/);
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const row = [];
        let inQuotes = false;
        let currentCell = '';
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(currentCell.trim());
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        row.push(currentCell.trim());
        rows.push(row);
    }
    return rows;
}

function parsePrice(val) {
    if (!val || val === '-') return null;
    const clean = val.replace(/[^\d]/g, '');
    return clean ? parseInt(clean, 10) : null;
}

function getGoogleDriveDirectLink(link) {
    if (!link) return '';
    if (link.includes('drive.google.com')) {
        let fileId = '';
        const idMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) {
            fileId = idMatch[1];
        } else {
            const fileMatch = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch) fileId = fileMatch[1];
        }
        if (fileId) return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    return link;
}

function getCategoryId(categoryName, name) {
    const text = (categoryName || name || '').trim().toLowerCase();
    if (text.includes('مكواة') || text.includes('بخار') || text.includes('iron')) return 1;
    if (text.includes('مكنسة') || text.includes('تنظيف') || text.includes('vacuum') || text.includes('مكاس') || text.includes('مكنس')) return 2;
    if (text.includes('مطبخ') || text.includes('خلاط') || text.includes('غلاية') || text.includes('blender') || text.includes('kettle') || text.includes('microwave') || text.includes('شعر')) return 3;
    return 4;
}

function getFallbackImage(categoryId) {
    const placeholders = {
        1: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        2: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
        3: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
        4: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'
    };
    return placeholders[categoryId] || placeholders[4];
}

function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        function get(targetUrl) {
            https.get(targetUrl, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    if (redirectUrl.startsWith('//')) redirectUrl = 'https:' + redirectUrl;
                    get(redirectUrl);
                    return;
                }
                if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => resolve(data));
            }).on('error', reject);
        }
        get(url);
    });
}

async function generateProductsJson() {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv';
    console.log('Fetching Google Sheets data...');
    const csvData = await fetchCSV(sheetUrl);
    const rows = parseCSV(csvData);
    if (rows.length < 2) throw new Error('CSV is empty or invalid');

    const products = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 4) continue;
        const name = row[1];
        const brand = row[2] ? row[2].trim() : '';
        const code = row[3];
        if (!name || !code) continue;

        const id = parseInt(row[0], 10) || i;
        const quantity = parseFloat(row[4]) || 0;
        const cost = parsePrice(row[5]);
        const sellingPrice = parsePrice(row[6]);
        const discountPrice = parsePrice(row[7]);
        const categoryName = row[9] || '';
        let imageLink = row[10] || '';
        const videoLink = row[11] || '';
        const isFeatured = row[12] && row[12].trim().toUpperCase() === 'TRUE' ? 1 : 0;

        imageLink = getGoogleDriveDirectLink(imageLink);
        const categoryId = getCategoryId(categoryName, name);
        let finalImage = imageLink;
        if (!finalImage || (!finalImage.startsWith('http://') && !finalImage.startsWith('https://'))) {
            finalImage = getFallbackImage(categoryId);
        }

        products.push({
            id,
            category_id: categoryId,
            title_ar: name,
            slug: `prod-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id}`,
            description_ar: `جهاز كهربائي ذكي عالي الكفاءة. الموديل: ${code}. متوفر حالياً بالمخزون بكمية ${Math.round(quantity)} قطعة.`,
            base_price: sellingPrice || cost || 0,
            discount_price: discountPrice,
            main_image: finalImage,
            youtube_url: videoLink,
            is_visible: 1,
            stock_quantity: Math.round(quantity),
            sku: code,
            brand: brand || 'ElectroHome',
            is_featured: isFeatured
        });
    }

    console.log(`Parsed ${products.length} products from Google Sheets.`);

    const jsonContent = JSON.stringify(products, null, 2);
    const outputPaths = [
        path.join(__dirname, '..', 'public', 'js', 'products.json'),
        path.join(__dirname, '..', 'js', 'products.json')
    ];
    for (const outPath of outputPaths) {
        const dir = path.dirname(outPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outPath, jsonContent, 'utf8');
        console.log(`Written: ${outPath}`);
    }
    console.log('Done.');
}

generateProductsJson().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
