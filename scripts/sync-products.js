const https = require('https');
const fs = require('fs');
const path = require('path');

const DEFAULT_PRICES = {
    1: { price: 280000, discount: 245000 },
    2: { price: 490000, discount: 450000 },
    3: { price: 145000, discount: 125000 },
    4: { price: 320000, discount: 290000 },
    5: { price: 420000, discount: 380000 },
    6: { price: 340000, discount: 305000 },
    7: { price: 540000, discount: 490000 },
    8: { price: 380000, discount: 340000 },
    9: { price: 135000, discount: 115000 },
    10: { price: 260000, discount: 230000 },
    11: { price: 210000, discount: 185000 },
    12: { price: 240000, discount: 210000 },
    13: { price: 780000, discount: 690000 },
    14: { price: 165000, discount: 140000 },
    15: { price: 230000, discount: 195000 },
    16: { price: 155000, discount: 130000 },
    17: { price: 270000, discount: 235000 },
    18: { price: 175000, discount: 150000 },
    19: { price: 290000, discount: 250000 },
    20: { price: 190000, discount: 165000 },
    21: { price: 210000, discount: 180000 },
    22: { price: 390000, discount: 345000 },
    23: { price: 180000, discount: 155000 },
    24: { price: 290000, discount: 255000 },
    25: { price: 170000, discount: 145000 },
    26: { price: 280000, discount: 240000 },
    27: { price: 220000, discount: 190000 },
    28: { price: 240000, discount: 210000 },
    29: { price: 310000, discount: 275000 },
    30: { price: 250000, discount: 220000 },
    31: { price: 180000, discount: 155000 },
    32: { price: 95000, discount: 80000 },
    33: { price: 850000, discount: 760000 },
    34: { price: 460000, discount: 410000 },
    35: { price: 220000, discount: 195000 },
    36: { price: 195000, discount: 165000 },
    37: { price: 410000, discount: 365000 },
    38: { price: 2800000, discount: 2450000 },
    39: { price: 360000, discount: 315000 },
    40: { price: 210000, discount: 180000 },
    41: { price: 440000, discount: 390000 },
    42: { price: 680000, discount: 590000 },
    43: { price: 160000, discount: 135000 },
    44: { price: 85000, discount: 70000 },
    45: { price: 270000, discount: 235000 },
    46: { price: 580000, discount: 510000 },
    47: { price: 155000, discount: 130000 },
    48: { price: 75000, discount: 60000 },
    49: { price: 280000, discount: 240000 },
    50: { price: 65000, discount: 50000 },
    51: { price: 110000, discount: 90000 },
    52: { price: 95000, discount: 80000 },
    53: { price: 310000, discount: 270000 },
    54: { price: 120000, discount: 100000 },
    55: { price: 330000, discount: 290000 },
    56: { price: 410000, discount: 360000 }
};

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
    if (!val || val === '-' || val === '0' || val === '0.00') return null;
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
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue;

        const name = row[1];
        const brand = row[2] || 'ElectroHome';
        const code = row[3] || `PROD-${i}`;
        if (!name || name.startsWith('Product') || name.startsWith('اسم')) continue;

        const id = parseInt(row[0], 10) || i;
        const quantity = parseFloat(row[4]) || 0;
        let cost = parsePrice(row[5]);
        let sellingPrice = parsePrice(row[6]);
        let discountPrice = parsePrice(row[7]);

        // Fallback price logic if Google Sheet price is 0 or empty
        const defaultP = DEFAULT_PRICES[id] || { price: 250000, discount: 220000 };
        if (!sellingPrice) {
            sellingPrice = defaultP.price;
        }
        if (!discountPrice) {
            discountPrice = defaultP.discount;
        }

        // Col 10 (K): Fav / Featured
        const favVal = (row[10] || '').trim();
        const isFeatured = (favVal === '1' || favVal.toUpperCase() === 'TRUE') ? 1 : 0;

        // Col 11 (L): details
        const detailsText = (row[11] || '').trim();

        // Col 12 (M): video link
        const videoLink = (row[12] || '').trim();

        // Col 13..17 (N, O, P, Q, R): Photos 1..5
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
            base_price: sellingPrice,
            discount_price: discountPrice,
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

    console.log(`Parsed ${products.length} products using exact user column mapping and default price fallbacks.`);

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
