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

function getCategoryId(name, brand) {
    const text = ((name || '') + ' ' + (brand || '')).trim().toLowerCase();
    if (text.includes('مكواة') || text.includes('بخار') || text.includes('iron') || text.includes('فيليدا')) return 1;
    if (text.includes('مكنسة') || text.includes('تنظيف') || text.includes('vacuum') || text.includes('مكاس') || text.includes('مكنس')) return 2;
    if (text.includes('شعر') || text.includes('حلاقة') || text.includes('قص') || text.includes('تشذيب') || text.includes('مجفف') || text.includes('براون') || text.includes('كاريرا') || text.includes('روفنتا')) return 4;
    if (text.includes('طاولة') || text.includes('إضاءة') || text.includes('مصباح') || text.includes('ساعة') || text.includes('كاشف') || text.includes('حرارة') || text.includes('استنشاق') || text.includes('ريموت') || text.includes('شمعة') || text.includes('ستارة') || text.includes('كشاف')) return 5;
    return 3; // kitchen
}

function getFallbackImage(pId) {
    return `/asset/images/products/prod_${pId}.jpg`;
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
    console.log('Fetching Google Sheets CSV data...');
    const csvData = await fetchCSV(sheetUrl);
    const rows = parseCSV(csvData);
    if (rows.length < 2) throw new Error('CSV is empty or invalid');

    const products = [];
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue;

        const name = row[2] || row[3] || '';
        const brand = row[3] || row[2] || 'ElectroHome';
        const code = row[4] || row[9] || `PROD-${i}`;
        if (!name || name.startsWith('Product') || name.startsWith('اسم')) continue;

        const id = parseInt(row[0], 10) || (i - 1);
        const quantity = parseFloat(row[5]) || 0;
        const cost = parsePrice(row[6]);
        const sellingPrice = parsePrice(row[7]);
        const discountPrice = parsePrice(row[8]);

        // K (col 10): Fav / Featured
        const favVal = (row[10] || '').trim();
        const isFeatured = (favVal === '1' || favVal.toLowerCase() === 'true') ? 1 : 0;

        // L (col 11): details
        const detailsText = (row[11] || '').trim();

        // M (col 12): video link
        const videoLink = (row[12] || '').trim();

        // N, O, P, Q, R (cols 13..17): Photos 1..5
        const photos = [];
        for (let cIdx = 13; cIdx <= 17; cIdx++) {
            let imgUrl = getGoogleDriveDirectLink((row[cIdx] || '').trim());
            if (imgUrl && imgUrl.startsWith('http') && !photos.includes(imgUrl)) {
                photos.push(imgUrl);
            }
        }

        const categoryId = getCategoryId(name, brand);
        const mainImage = photos.length > 0 ? photos[0] : getFallbackImage(id);
        const imagesList = photos.length > 0 ? photos : [mainImage];
        const description = (detailsText && !detailsText.startsWith('http')) ? detailsText : `جهاز ${name} عالي الكفاءة من ماركة ${brand}. الموديل: ${code}.`;

        const variants = [
            {
                id,
                product_id: id,
                brand: brand,
                model_name: code,
                variant_attributes: { "الماركة": brand, "الموديل": code },
                price_modifier: 0,
                stock_quantity: Math.round(quantity) || 10,
                sku: code
            }
        ];

        products.push({
            id,
            category_id: categoryId,
            title_ar: name,
            slug: `prod-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id}`,
            description_ar: description,
            base_price: sellingPrice || cost || 250000,
            discount_price: discountPrice || null,
            main_image: mainImage,
            images: imagesList,
            youtube_url: videoLink,
            is_featured: isFeatured,
            is_visible: 1,
            stock_quantity: Math.round(quantity) || 10,
            sku: code,
            brand: brand,
            variants: variants
        });
    }

    console.log(`Parsed ${products.length} products using exact user column mapping.`);

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
