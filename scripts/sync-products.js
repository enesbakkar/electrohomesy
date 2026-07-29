const https = require('https');
const fs = require('fs');
const path = require('path');


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
    if (!val || val.trim() === '' || val === '-' || val === '0' || val === '0.00') return null;
    // Support decimals: 29.99, 100, 40.00
    const clean = val.replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || num === 0 ? null : num;
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

const PRODUCT_FALLBACK_IMAGES = {
    "1": "https://media.kruidvat.nl/medias/sys_master/prd-images/hc9/ha2/34247170949150/prd-front-5178398-1_600x600/prd-front-5178398-1-600x600.jpg",
    "2": "https://images.unsplash.com/photo-1508380702597-707c1b00a9a6?auto=format&fit=crop&w=800&q=80",
    "3": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    "4": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
    "5": "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=800&q=80",
    "6": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
    "7": "https://images.unsplash.com/photo-1517668808822-9eaa03afd2af?auto=format&fit=crop&w=800&q=80",
    "8": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80",
    "9": "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80",
    "10": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",
    "11": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
    "12": "https://images.unsplash.com/photo-1583634648128-3a58222169ff?auto=format&fit=crop&w=800&q=80",
    "13": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "14": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=800&q=80",
    "15": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80",
    "16": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    "17": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80",
    "18": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=800&q=80",
    "19": "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80",
    "20": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
    "21": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "22": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
    "23": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
    "24": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    "25": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
    "26": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    "27": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    "28": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80",
    "29": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    "30": "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?auto=format&fit=crop&w=800&q=80",
    "31": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=800&q=80",
    "32": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    "33": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "34": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    "35": "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80",
    "36": "https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80",
    "37": "https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80",
    "38": "https://images.unsplash.com/photo-1517668808822-9eaa03afd2af?auto=format&fit=crop&w=800&q=80",
    "39": "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80",
    "40": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    "41": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    "42": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80",
    "43": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    "44": "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
    "45": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80",
    "46": "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80",
    "47": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    "48": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    "49": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "50": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    "51": "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    "52": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    "53": "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=800&q=80",
    "54": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    "55": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80",
    "56": "https://images.unsplash.com/photo-1508380702597-707c1b00a9a6?auto=format&fit=crop&w=800&q=80"
};

function getFallbackImage(id) { return ''; }


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
        // Fiyat - Doğrudan Sheets'ten (col[6]=satış, col[7]=indirimli)
        const sellingPrice = parsePrice(row[6]);
        const discountPrice = parsePrice(row[7]);

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
        const mainImage = photos.length > 0 ? photos[0] : '';
        const imagesList = photos.length > 0 ? photos : [];
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
