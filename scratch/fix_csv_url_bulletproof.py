"""
Script to fix fetchProductsFromGoogleSheetsClient and guarantee product display with robust fallbacks
"""
import os, sys, shutil, re, subprocess

def fix_google_sheets_client_fetch(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_fetch_function = """async function fetchProductsFromGoogleSheetsClient(categorySlug) {
    let rawCsvText = '';

    const urls = [
        'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv&gid=0&t=' + Date.now(),
        'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/export?format=csv&gid=0&t=' + Date.now()
    ];

    for (const url of urls) {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                if (text && text.length > 500 && text.includes(',')) {
                    rawCsvText = text;
                    break;
                }
            }
        } catch (e) {
            console.warn('Failed URL:', url, e);
        }
    }

    if (rawCsvText) {
        try {
            const rows = parseCSVClient(rawCsvText);
            if (rows.length >= 2) {
                const products = [];
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length < 3) continue;

                    const name = (row[1] || row[2] || '').trim();
                    const brand = (row[2] || 'ElectroHome').trim();
                    const code = (row[3] || `PROD-${i}`).trim();

                    if (!name || name.startsWith('Product') || name.startsWith('اسم') || name === '-') continue;

                    const id = parseInt(row[0], 10) || i;
                    const quantity = parseFloat(row[4]) || 10;
                    let cost = parsePriceClient(row[5]);
                    let sellingPrice = parsePriceClient(row[6]);
                    let discountPrice = parsePriceClient(row[7]);

                    const favVal = (row[10] || '').trim();
                    const isFeatured = (favVal === '1' || favVal.toUpperCase() === 'TRUE') ? 1 : 0;
                    const detailsText = (row[11] || '').trim();
                    const videoLink = (row[12] || '').trim();

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
                        base_price: sellingPrice || cost || 29.99,
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

                if (products.length > 0) {
                    allProducts = products;
                    isGoogleSheetsDataLoaded = true;
                    if (categorySlug === 'all') return products;
                    const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'personal-care': 4, 'home-living': 5, 'coffee-machines': 6 };
                    const catId = catMap[categorySlug];
                    return catId ? products.filter(p => p.category_id === catId) : products;
                }
            }
        } catch (parseErr) {
            console.error('Error parsing Google Sheets CSV:', parseErr);
        }
    }

    // Fallback 1: Local products.json file
    try {
        const jsonRes = await fetch('./js/products.json?v=25.0.0');
        if (jsonRes.ok) {
            const products = await jsonRes.json();
            allProducts = products;
            isGoogleSheetsDataLoaded = true;
            if (categorySlug === 'all') return products;
            const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'personal-care': 4, 'home-living': 5, 'coffee-machines': 6 };
            const catId = catMap[categorySlug];
            return catId ? products.filter(p => p.category_id === catId) : products;
        }
    } catch (jsonErr) {
        console.warn('Local products.json fallback failed:', jsonErr);
    }

    // Fallback 2: Hardcoded FALLBACK_PRODUCTS
    if (typeof FALLBACK_PRODUCTS !== 'undefined' && FALLBACK_PRODUCTS.length > 0) {
        allProducts = FALLBACK_PRODUCTS.filter(p => p.is_visible);
    }
    return allProducts;
}"""

    start_fn = content.find('async function fetchProductsFromGoogleSheetsClient(')
    end_fn = content.find('// Render Products Grid - Cards open product page in new tab')
    if end_fn == -1: end_fn = content.find('function renderProducts(')

    if start_fn != -1 and end_fn != -1:
        content = content[:start_fn] + new_fetch_function + '\n\n' + content[end_fn:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed fetchProductsFromGoogleSheetsClient in {filepath}")

fix_google_sheets_client_fetch('js/app.js')
fix_google_sheets_client_fetch('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
