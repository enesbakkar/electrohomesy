import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

client_parser_code = '''
const DEFAULT_PRICES_CLIENT = {
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

async function fetchProductsFromGoogleSheetsClient(categorySlug) {
    try {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv&t=' + Date.now();
        const res = await fetch(sheetUrl);
        if (!res.ok) throw new Error('Failed to fetch from Google Sheets directly');
        const text = await res.text();
        const rows = parseCSVClient(text);
        if (rows.length < 2) throw new Error('Empty CSV');

        const products = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 3) continue;

            const name = (row[1] || row[2] || '').trim();
            const brand = (row[2] || 'ElectroHome').trim();
            const code = (row[3] || `PROD-${i}`).trim();
            if (!name || name.startsWith('Product') || name.startswith?.('اسم')) continue;

            const id = parseInt(row[0], 10) || i;
            const quantity = parseFloat(row[4]) || 0;
            let cost = parsePriceClient(row[5]);
            let sellingPrice = parsePriceClient(row[6]);
            let discountPrice = parsePriceClient(row[7]);

            // Price fallback if Google Sheet price is 0 or empty
            const defaultP = DEFAULT_PRICES_CLIENT[id] || { price: 250000, discount: 220000 };
            if (!sellingPrice || sellingPrice === 0) {
                sellingPrice = defaultP.price;
            }
            if (!discountPrice || discountPrice === 0) {
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
                let imgUrl = getGoogleDriveDirectLinkClient((row[cIdx] || '').trim());
                if (imgUrl && imgUrl.startsWith('http') && !photos.includes(imgUrl)) {
                    photos.push(imgUrl);
                }
            }

            const categoryId = getCategoryIdFromSheetClient(name, brand);
            const mainImage = photos.length > 0 ? photos[0] : getFallbackImageClient(categoryId);
            const imagesList = photos.length > 0 ? photos : [mainImage];
            const description = (detailsText && !detailsText.startsWith('http')) ? detailsText : `جهاز ${name} عالي الكفاءة من ماركة ${brand}. الموديل: ${code}.`;

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
                is_visible: 1,
                is_featured: isFeatured,
                variants: [
                    { id: id * 100, product_id: id, brand: brand || 'ElectroHome', model_name: code, variant_attributes: { "الماركة": brand, "الموديل": code }, price_modifier: 0, stock_quantity: Math.round(quantity) || 10, sku: code }
                ]
            });
        }

        allProducts = products;
        isGoogleSheetsDataLoaded = true;

        if (categorySlug === 'all') {
            return products;
        } else {
            const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'personal-care': 4, 'home-living': 5 };
            const catId = catMap[categorySlug];
            return products.filter(p => p.category_id === catId);
        }
    } catch (sheetErr) {
        console.warn('Failed to fetch direct CSV, falling back to pre-compiled products.json:', sheetErr);
        try {
            const jsonRes = await fetch('./js/products.json');
            if (!jsonRes.ok) throw new Error('Static products.json not found');
            const products = await jsonRes.json();
            allProducts = products;
            isGoogleSheetsDataLoaded = true;

            if (categorySlug === 'all') {
                return products;
            } else {
                const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'personal-care': 4, 'home-living': 5 };
                const catId = catMap[categorySlug];
                return products.filter(p => p.category_id === catId);
            }
        } catch (jsonErr) {
            console.error('Static products.json fallback also failed:', jsonErr);
            throw jsonErr;
        }
    }
}
'''

def patch_app_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start_marker = "async function fetchProductsFromGoogleSheetsClient(categorySlug) {"
    end_marker = "function parseCSVClient(text) {"

    start_pos = content.find(start_marker)
    end_pos = content.find(end_marker)

    if start_pos != -1 and end_pos != -1:
        new_content = content[:start_pos] + client_parser_code + "\n\n" + content[end_pos:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully patched client parser in {filepath}!")
    else:
        print(f"Error: Markers not found in {filepath}. Start: {start_pos}, End: {end_pos}")

patch_app_js('js/app.js')
patch_app_js('public/js/app.js')
