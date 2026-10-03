#!/usr/bin/env node
/*
 * ElectroHomeSY - builds search-engine friendly static pages from the product database.
 *
 *   /p/<id>/index.html   one page per visible product (pre-rendered content + Product structured data)
 *   /c/<slug>/index.html one page per non-empty category
 *   /sitemap.xml, /robots.txt
 *   index.html           static product list + category links between <!-- SEO:... --> markers
 *   js/products.json     refreshed fallback catalogue
 *
 * The pages still load the normal scripts, so visitors get live prices and the cart as usual;
 * the pre-rendered HTML is what search engines (and slow connections) see first.
 *
 * Usage:  node scripts/build-seo.js                 (reads products from Supabase, see js/db-config.js)
 *         node scripts/build-seo.js --input rows.json   (products table rows from a file, for testing)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = 'https://electrohomesy.com';
const REPO = path.join(__dirname, '..');
const OUTPUT_ROOTS = [REPO, path.join(REPO, 'public')]; // GitHub Pages serves the repo root; public/ mirrors it
const LOGO = '/Logo/ElectroHomeSY-logo-blue.png';
const PHONE = '+963959930005';

const CATEGORIES = {
    1: { slug: 'irons', name: 'المكاوي وأجهزة البخار', h1: 'مكاوي بخار وأجهزة كي الملابس في دمشق',
         intro: 'تشكيلة من مكاوي البخار ومولدات البخار وأجهزة كي الملابس من ماركات عالمية، مع توصيل سريع داخل دمشق وريفها والدفع عند الاستلام.' },
    2: { slug: 'vacuums', name: 'المكانس والتنظيف', h1: 'مكانس كهربائية وأجهزة تنظيف في دمشق',
         intro: 'مكانس كهربائية يدوية وعصوية ولاسلكية وممسحات بخار لتنظيف المنزل بسهولة، بأسعار مناسبة وتوصيل إلى باب المنزل في دمشق.' },
    3: { slug: 'kitchen', name: 'أجهزة المطبخ والطهي', h1: 'أجهزة مطبخ كهربائية في دمشق: خلاطات، غلايات، شوايات وأكثر',
         intro: 'خلاطات وغلايات ماء ومحمصات خبز وشوايات كهربائية وماكينات وافل وأفران ميكروويف من ماركات موثوقة، مع التوصيل والدفع عند الاستلام.' },
    4: { slug: 'personal-care', name: 'العناية الشخصية والحلاقة', h1: 'ماكينات حلاقة وتشذيب ومجففات شعر في دمشق',
         intro: 'ماكينات حلاقة كهربائية وماكينات قص الشعر وتشذيب اللحية ومجففات الشعر من فيليبس وبراون وروفنتا وغيرها، أصلية ومضمونة مع توصيل سريع في دمشق.' },
    5: { slug: 'home-living', name: 'الإضاءة والمنزل والأجهزة الطبية', h1: 'إضاءة LED وأجهزة منزلية وطبية في دمشق',
         intro: 'مصابيح طاولة LED وإضاءة زينة وكشافات وساعات حائط وموازين حرارة وأجهزة استنشاق، بأسعار مناسبة وتوصيل داخل دمشق وريفها.' },
    6: { slug: 'coffee-machines', name: 'ماكينات القهوة والكبسولات', h1: 'ماكينات قهوة وكبسولات في دمشق: إسبريسو، دولسي غوستو، تاسيمو',
         intro: 'ماكينات إسبريسو أوتوماتيكية وماكينات كبسولات دولسي غوستو وتاسيمو وماكينات قهوة فلتر، أصلية مع توصيل سريع في دمشق والدفع عند الاستلام.' }
};

// ---------- helpers ----------

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function jsonLd(data) {
    return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function money(n) {
    const v = Number(n);
    return '$' + (v % 1 !== 0 ? v.toFixed(2) : v.toLocaleString('en-US'));
}

function truncate(text, max) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    return t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function absoluteUrl(url) {
    if (!url) return SITE + LOGO;
    return url.startsWith('http') ? url : SITE + url;
}

function replaceBetween(html, name, content) {
    const start = `<!-- SEO:${name}:START -->`;
    const end = `<!-- SEO:${name}:END -->`;
    const a = html.indexOf(start);
    const b = html.indexOf(end);
    if (a === -1 || b === -1 || b < a) throw new Error(`Marker SEO:${name} not found`);
    return html.slice(0, a + start.length) + '\n' + content + '\n' + html.slice(b);
}

function writeEverywhere(relPath, content) {
    for (const root of OUTPUT_ROOTS) {
        const file = path.join(root, relPath);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, content, 'utf8');
    }
}

// db-config.js is the single place that knows the database and how rows map to products
function loadDbConfig() {
    const code = fs.readFileSync(path.join(REPO, 'js', 'db-config.js'), 'utf8');
    const context = { window: {}, fetch: globalThis.fetch, console };
    vm.createContext(context);
    vm.runInContext(code, context);
    // top-level const bindings are not properties of the context object, so read them by name
    const columns = vm.runInContext('EHS_PUBLIC_PRODUCT_COLUMNS', context);
    return { config: context.window.EHS_CONFIG, mapRow: context.ehsMapDbProduct, columns };
}

async function loadRows(db) {
    const inputFlag = process.argv.indexOf('--input');
    if (inputFlag !== -1) return JSON.parse(fs.readFileSync(process.argv[inputFlag + 1], 'utf8'));

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = db.config;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Database is not configured in js/db-config.js');
    const url = `${SUPABASE_URL}/rest/v1/products?select=${db.columns},updated_at&is_visible=eq.true&order=sort_order.asc,id.asc`;
    const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    if (!res.ok) throw new Error(`Products request failed: HTTP ${res.status} ${await res.text()}`);
    return res.json();
}

function sellingPrice(p) {
    return Number(p.discount_price) > 0 ? Number(p.discount_price) : Number(p.base_price || 0);
}

function inStock(p) {
    return Number(p.stock_quantity) > 0;
}

function productUrl(p) {
    return `/p/${p.id}/`;
}

function productCard(p) {
    const price = sellingPrice(p);
    const hasDiscount = Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.base_price);
    const cat = CATEGORIES[p.category_id];
    return `<div class="product-card${inStock(p) ? '' : ' is-out-of-stock'}">
    ${inStock(p) ? (hasDiscount ? '<span class="discount-tag">🔥 عروض خـاصة</span>' : '') : '<span class="badge-trendyol-bestseller" style="background:#64748b;">نفدت الكمية</span>'}
    <a href="${productUrl(p)}"><img src="${esc(p.main_image)}" alt="${esc(p.title_ar)}" class="product-thumb" loading="lazy" onerror="this.onerror=null; this.src='${LOGO}';"></a>
    <span class="product-category-name">${esc(cat ? cat.name : '')}${p.brand && p.brand !== 'ElectroHome' ? ` · ${esc(p.brand)}` : ''}</span>
    <a href="${productUrl(p)}" style="text-decoration:none; color:inherit;"><h3 class="product-title">${esc(p.title_ar)}</h3></a>
    <div class="product-price-box"><span class="current-price">${money(price)}</span>${hasDiscount ? `<span class="old-price">${money(p.base_price)}</span>` : ''}</div>
    <div class="product-card-actions"><a href="${productUrl(p)}" class="btn-add-cart" style="text-decoration:none; text-align:center;">التفاصيل</a></div>
</div>`;
}

function categoryLinks(categoriesInUse) {
    return categoriesInUse.map(c => `<li><a href="/c/${c.slug}/">${esc(c.name)}</a></li>`).join('\n');
}

// ---------- page builders ----------

function buildProductPage(template, p) {
    const cat = CATEGORIES[p.category_id] || CATEGORIES[5];
    const price = sellingPrice(p);
    const brand = p.brand && p.brand !== 'ElectroHome' ? p.brand : '';
    const url = SITE + productUrl(p);
    const title = `${p.title_ar}${brand ? ` | ${brand}` : ''} - السعر في دمشق | إلكتروهومسي`;
    const details = String(p.description_ar || '').trim().replace(/[.。!؟?]*$/, '');
    const description = truncate(`${p.title_ar}${brand ? ` من ${brand}` : ''} بسعر ${money(price)} في دمشق وريفها. ${details ? details + '. ' : ''}توصيل سريع والدفع عند الاستلام أو عبر شام كاش.`, 300);
    const images = (p.images && p.images.length ? p.images : [LOGO]).map(absoluteUrl);

    const structured = [
        {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: p.title_ar,
            description: p.description_ar,
            image: images,
            sku: p.sku,
            mpn: p.sku,
            category: cat.name,
            ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
            offers: {
                '@type': 'Offer',
                url,
                priceCurrency: 'USD',
                price: price.toFixed(2),
                availability: inStock(p) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                itemCondition: 'https://schema.org/NewCondition',
                seller: { '@type': 'Organization', name: 'ElectroHomeSY إلكتروهومسي' }
            }
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE + '/' },
                { '@type': 'ListItem', position: 2, name: cat.name, item: `${SITE}/c/${cat.slug}/` },
                { '@type': 'ListItem', position: 3, name: p.title_ar, item: url }
            ]
        }
    ];

    const head = `<title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="product">
    <meta property="og:site_name" content="إلكتروهومسي ElectroHomeSY">
    <meta property="og:locale" content="ar_SY">
    <meta property="og:title" content="${esc(p.title_ar)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${esc(images[0])}">
    <meta property="product:price:amount" content="${price.toFixed(2)}">
    <meta property="product:price:currency" content="USD">
    <meta name="twitter:card" content="summary_large_image">
    ${structured.map(jsonLd).join('\n    ')}`;

    const body = `<div class="product-grid-layout">
                <div class="product-gallery-col">
                    <div class="product-image-frame"><img src="${esc(p.main_image)}" alt="${esc(p.title_ar)}" onerror="this.onerror=null; this.src='${LOGO}';"></div>
                </div>
                <div class="product-details-col">
                    ${brand ? `<div class="product-detail-brand" style="font-size:1.2rem; color:var(--damascus-green); font-weight:900;">${esc(brand)}</div>` : ''}
                    <h1 class="product-main-title">${esc(p.title_ar)}</h1>
                    <p style="font-size:2rem; font-weight:900; color:#073066;">${money(price)}${Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.base_price) ? ` <del style="font-size:1.1rem; color:#94a3b8;">${money(p.base_price)}</del>` : ''}</p>
                    <p>${inStock(p) ? 'متوفر — توصيل سريع في دمشق وريفها والدفع عند الاستلام.' : 'نفدت الكمية حالياً — تواصل معنا عبر الواتساب.'}</p>
                    <p class="product-description-text">${esc(p.description_ar)}</p>
                    <p>رمز الجهاز: <strong>${esc(p.sku)}</strong> · الصنف: <a href="/c/${cat.slug}/">${esc(cat.name)}</a></p>
                </div>
            </div>`;

    return replaceBetween(replaceBetween(template, 'HEAD', '    ' + head + '\n    '), 'BODY', body)
        .replace('<span class="breadcrumb-current" id="breadCat">أجهزة منزلية</span>',
                 `<a href="/c/${cat.slug}/" class="breadcrumb-current" id="breadCat">${esc(cat.name)}</a>`);
}

function buildCategoryPage(cat, products, categoriesInUse) {
    const url = `${SITE}/c/${cat.slug}/`;
    const title = `${cat.h1} | إلكتروهومسي`;
    const description = truncate(`${cat.intro} ${products.slice(0, 4).map(p => p.title_ar).join('، ')}.`, 300);
    const structured = [
        {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: cat.h1,
            url,
            mainEntity: {
                '@type': 'ItemList',
                itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + productUrl(p), name: p.title_ar }))
            }
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE + '/' },
                { '@type': 'ListItem', position: 2, name: cat.name, item: url }
            ]
        }
    ];

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="إلكتروهومسي ElectroHomeSY">
    <meta property="og:locale" content="ar_SY">
    <meta property="og:title" content="${esc(cat.h1)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${esc(absoluteUrl(products[0] && products[0].main_image))}">
    ${structured.map(jsonLd).join('\n    ')}
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="/css/style.css?v=36.0.0">
</head>
<body>
    <header>
        <div class="container header-container">
            <div class="nav-wrapper">
                <a href="/" class="brand-logo"><img src="${LOGO}" alt="إلكتروهومسي ElectroHomeSY" class="main-logo-img"></a>
                <div class="header-search">
                    <input type="text" id="searchInput" placeholder="ابحث عن مكواة، مكنسة، خلاط، أو أجهزة مطبخ...">
                    <i class="fa-solid fa-magnifying-glass"></i>
                </div>
                <div class="nav-actions">
                    <a href="/" class="nav-btn" style="text-decoration:none;"><i class="fa-solid fa-store"></i><span>المتجر</span></a>
                    <a href="/#cart-section" class="nav-btn nav-btn-cart" style="text-decoration:none;">
                        <i class="fa-solid fa-basket-shopping"></i><span>السلة</span><span class="cart-badge" id="cartCount">0</span>
                    </a>
                </div>
            </div>
        </div>
    </header>

    <main class="container" style="padding-top: 20px;">
        <nav class="breadcrumb-bar" style="display:flex; gap:8px; font-size:0.9rem; color:var(--steel-grey); margin-bottom:14px;">
            <a href="/" style="color:inherit;">الرئيسية</a> <span>›</span> <span style="color:var(--damascus-green); font-weight:700;">${esc(cat.name)}</span>
        </nav>
        <h1 class="section-title category-page-title">${esc(cat.h1)}</h1>
        <p class="category-page-intro">${esc(cat.intro)}</p>

        <div class="category-tabs-sticky-bar">
            <div class="category-tabs">
                <a class="cat-tab" href="/" style="text-decoration:none;">كافة المنتجات</a>
                ${categoriesInUse.map(c => `<a class="cat-tab${c.slug === cat.slug ? ' active' : ''}" href="/c/${c.slug}/" style="text-decoration:none;">${esc(c.name)}</a>`).join('\n                ')}
            </div>
        </div>

        <div class="products-grid">
            ${products.map(productCard).join('\n            ')}
        </div>
    </main>

    <footer>
        <div class="container">
            <div class="footer-grid">
                <div class="footer-brand-col">
                    <p class="footer-brand-desc">إلكتروهومسي ElectroHomeSY - أجهزة منزلية وكهربائية أصلية في دمشق مع التوصيل والدفع عند الاستلام.</p>
                </div>
                <div class="footer-links-col">
                    <h4 class="footer-col-title">الأصناف</h4>
                    <ul class="footer-links">${categoryLinks(categoriesInUse)}</ul>
                </div>
                <div class="footer-contact-col">
                    <h4 class="footer-col-title">تواصل معنا</h4>
                    <ul class="footer-contact-list">
                        <li><i class="fa-solid fa-location-dot"></i> دمشق، سوريا</li>
                        <li><i class="fa-brands fa-whatsapp"></i> <a href="https://wa.me/963959930005" dir="ltr" style="color:inherit;">+963 959 930 005</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </footer>

    <nav class="mobile-bottom-nav">
        <a href="/" class="mobile-nav-item"><i class="fa-solid fa-house"></i><span>الرئيسية</span></a>
        <a href="/#categories-section" class="mobile-nav-item active"><i class="fa-solid fa-layer-group"></i><span>الأصناف</span></a>
        <a href="/#cart-section" class="mobile-nav-item"><i class="fa-solid fa-basket-shopping"></i><span>السلة</span></a>
        <a href="/#account-section" class="mobile-nav-item"><i class="fa-solid fa-user"></i><span>حسابي</span></a>
    </nav>

    <script src="/js/db-config.js?v=2.0.0"></script>
    <script src="/js/app.js?v=37.0.0"></script>
</body>
</html>
`;
}

function buildSitemap(products, categoriesInUse) {
    const today = new Date().toISOString().slice(0, 10);
    const entries = [
        { loc: SITE + '/', lastmod: today, priority: '1.0' },
        ...categoriesInUse.map(c => ({ loc: `${SITE}/c/${c.slug}/`, lastmod: today, priority: '0.8' })),
        ...products.map(p => ({ loc: SITE + productUrl(p), lastmod: (p.updated_at || today).slice(0, 10), priority: '0.7' }))
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url><loc>${e.loc}</loc><lastmod>${e.lastmod}</lastmod><priority>${e.priority}</priority></url>`).join('\n')}
</urlset>
`;
}

const ROBOTS = `User-agent: *
Allow: /
Disallow: /admin.html

Sitemap: ${SITE}/sitemap.xml
`;

// ---------- main ----------

async function main() {
    const db = loadDbConfig();
    const rows = await loadRows(db);
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('No products returned; refusing to overwrite pages');

    const products = rows.map(row => ({ ...db.mapRow(row), updated_at: row.updated_at, category_id: row.category_id }));
    const categoriesInUse = Object.entries(CATEGORIES)
        .filter(([id]) => products.some(p => p.category_id === Number(id)))
        .map(([, c]) => c);

    // Product pages (and removal of pages for products that are gone or hidden)
    const template = fs.readFileSync(path.join(REPO, 'product.html'), 'utf8');
    const keepIds = new Set(products.map(p => String(p.id)));
    for (const root of OUTPUT_ROOTS) {
        const dir = path.join(root, 'p');
        if (!fs.existsSync(dir)) continue;
        for (const entry of fs.readdirSync(dir)) {
            if (!keepIds.has(entry)) fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
        }
    }
    for (const p of products) writeEverywhere(`p/${p.id}/index.html`, buildProductPage(template, p));

    // Category pages
    const slugsInUse = new Set(categoriesInUse.map(c => c.slug));
    for (const root of OUTPUT_ROOTS) {
        const dir = path.join(root, 'c');
        if (!fs.existsSync(dir)) continue;
        for (const entry of fs.readdirSync(dir)) {
            if (!slugsInUse.has(entry)) fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
        }
    }
    for (const [id, cat] of Object.entries(CATEGORIES)) {
        const list = products.filter(p => p.category_id === Number(id));
        if (list.length) writeEverywhere(`c/${cat.slug}/index.html`, buildCategoryPage(cat, list, categoriesInUse));
    }

    // Home page: static product list for crawlers (the script replaces it on load) + category links
    let home = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
    home = replaceBetween(home, 'PRODUCTS', products.map(productCard).join('\n'));
    home = replaceBetween(home, 'CATEGORY-LINKS', categoryLinks(categoriesInUse));
    writeEverywhere('index.html', home);

    writeEverywhere('sitemap.xml', buildSitemap(products, categoriesInUse));
    writeEverywhere('robots.txt', ROBOTS);

    // Fallback catalogue used when the database cannot be reached
    const fallback = products.map(({ updated_at, ...p }) => p);
    writeEverywhere('js/products.json', JSON.stringify(fallback, null, 2) + '\n');

    console.log(`Built ${products.length} product pages, ${categoriesInUse.length} category pages, sitemap with ${1 + categoriesInUse.length + products.length} URLs.`);
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
