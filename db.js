const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();


// Helper functions for Excel (.xlsx) downloading and unzipping
function downloadXlsxFile(fileUrl, destPath) {
    return new Promise((resolve, reject) => {
        function download(url) {
            https.get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    download(res.headers.location);
                    return;
                }

                let dataChunks = [];
                res.on('data', (chunk) => { dataChunks.push(chunk); });
                res.on('end', () => {
                    const buffer = Buffer.concat(dataChunks);
                    if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
                        const html = buffer.toString();
                        const match = html.match(/href="([^"]+)"/i);
                        if (match) {
                            let nextUrl = match[1].replace(/&amp;/g, '&');
                            if (nextUrl.startsWith('//')) nextUrl = 'https:' + nextUrl;
                            download(nextUrl);
                            return;
                        }
                    }
                    fs.writeFileSync(destPath, buffer);
                    resolve(buffer.length);
                });
            }).on('error', (err) => {
                reject(err);
            });
        }
        download(fileUrl);
    });
}

function unzipXlsx(xlsxPath, destDir) {
    const zipPath = xlsxPath.replace(/\.xlsx$/i, '.zip');
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }
    fs.copyFileSync(xlsxPath, zipPath);
    
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    
    const { execSync } = require('child_process');
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
    
    if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
    }
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
            if (fileMatch) {
                fileId = fileMatch[1];
            }
        }
        if (fileId) {
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
    }
    return link;
}

const isPg = !!process.env.DATABASE_URL;
let pgPool = null;
let sqliteDb = null;

if (isPg) {
    pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('Database: PostgreSQL connection pool initialized.');
} else {
    const dbPath = path.join(__dirname, 'electrohomesy.db');
    sqliteDb = new sqlite3.Database(dbPath);
    console.log(`Database: SQLite database initialized at ${dbPath}`);
}

// Promisified query wrapper supporting both PG and SQLite
function query(text, params = []) {
    return new Promise((resolve, reject) => {
        if (isPg) {
            pgPool.query(text, params, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        } else {
            // Translate SQL text for SQLite compatibility
            let sqliteText = text
                .replace(/id SERIAL PRIMARY KEY/g, 'id INTEGER PRIMARY KEY AUTOINCREMENT')
                .replace(/\$\d+/g, '?'); // Convert $1, $2 to ?

            // Handle RETURNING clause conversion for SQLite
            const returningMatch = sqliteText.match(/returning\s+(\w+|\*)/i);
            if (returningMatch) {
                sqliteText = sqliteText.replace(/returning\s+(\w+|\*)/i, '');
            }

            const isSelect = sqliteText.trim().toLowerCase().startsWith('select');

            if (isSelect) {
                sqliteDb.all(sqliteText, params, (err, rows) => {
                    if (err) return reject(err);
                    resolve({ rows });
                });
            } else {
                sqliteDb.run(sqliteText, params, function(err) {
                    if (err) return reject(err);
                    const mockRow = {};
                    if (returningMatch) {
                        const col = returningMatch[1];
                        if (col === 'id') {
                            mockRow.id = this.lastID;
                        } else {
                            mockRow.id = this.lastID;
                        }
                    }
                    resolve({
                        rows: [mockRow],
                        rowCount: this.changes,
                        lastID: this.lastID
                    });
                });
            }
        }
    });
}

// Setup tables schema
async function initSchema() {
    await query(`
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name_ar TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            icon TEXT
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            category_id INTEGER,
            title_ar TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description_ar TEXT,
            base_price NUMERIC NOT NULL,
            discount_price NUMERIC,
            main_image TEXT,
            youtube_url TEXT,
            is_visible INTEGER DEFAULT 1,
            created_at TEXT
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS product_variants (
            id SERIAL PRIMARY KEY,
            product_id INTEGER,
            brand TEXT NOT NULL,
            model_name TEXT,
            variant_attributes TEXT,
            price_modifier NUMERIC DEFAULT 0,
            stock_quantity INTEGER DEFAULT 10,
            sku TEXT
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS orders (
            id SERIAL PRIMARY KEY,
            customer_id INTEGER,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            payment_method TEXT DEFAULT 'cod',
            total_amount NUMERIC NOT NULL,
            items TEXT,
            created_at TEXT
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS product_requests (
            id SERIAL PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            requested_product TEXT NOT NULL,
            notes TEXT,
            created_at TEXT
        )
    `);

    await query(`
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            full_name TEXT NOT NULL,
            phone_number TEXT NOT NULL UNIQUE,
            auth_provider TEXT DEFAULT 'phone',
            created_at TEXT
        )
    `);
}

// Seed initial database content from JSON if DB is completely empty
async function seedIfEmpty() {
    try {
        const res = await query('SELECT COUNT(*) AS count FROM categories');
        const count = parseInt(res.rows[0].count || res.rows[0]['COUNT(*)'] || 0);
        if (count > 0) {
            console.log('Database: Existing tables found, skipping seeding.');
            return;
        }

        console.log('Database: Empty database detected. Attempting to seed from electrohomesy_db.json...');
        const jsonPath = path.join(__dirname, 'electrohomesy_db.json');
        if (!fs.existsSync(jsonPath)) {
            console.log('Database: Seeding skipped (no json database file found).');
            return;
        }

        const raw = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(raw);

        // 1. Seed categories
        if (data.categories && data.categories.length > 0) {
            for (const cat of data.categories) {
                await query(
                    'INSERT INTO categories (id, name_ar, slug, icon) VALUES ($1, $2, $3, $4)',
                    [cat.id, cat.name_ar, cat.slug, cat.icon]
                );
            }
            console.log(`Database: Seeded ${data.categories.length} categories.`);
        }

        // 2. Seed products
        if (data.products && data.products.length > 0) {
            for (const prod of data.products) {
                await query(
                    'INSERT INTO products (id, category_id, title_ar, slug, description_ar, base_price, discount_price, main_image, youtube_url, is_visible, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                    [
                        prod.id,
                        prod.category_id,
                        prod.title_ar,
                        prod.slug,
                        prod.description_ar,
                        prod.base_price,
                        prod.discount_price,
                        prod.main_image,
                        prod.youtube_url,
                        prod.is_visible,
                        prod.created_at || new Date().toISOString()
                    ]
                );
            }
            console.log(`Database: Seeded ${data.products.length} products.`);
        }

        // 3. Seed variants
        if (data.product_variants && data.product_variants.length > 0) {
            for (const v of data.product_variants) {
                await query(
                    'INSERT INTO product_variants (id, product_id, brand, model_name, variant_attributes, price_modifier, stock_quantity, sku) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [
                        v.id,
                        v.product_id,
                        v.brand,
                        v.model_name,
                        JSON.stringify(v.variant_attributes || {}),
                        v.price_modifier,
                        v.stock_quantity,
                        v.sku
                    ]
                );
            }
            console.log(`Database: Seeded ${data.product_variants.length} product variants.`);
        }

        // 4. Seed customers
        if (data.customers && data.customers.length > 0) {
            for (const c of data.customers) {
                await query(
                    'INSERT INTO customers (id, full_name, phone_number, auth_provider, created_at) VALUES ($1, $2, $3, $4, $5)',
                    [c.id, c.full_name, c.phone_number, c.auth_provider || 'phone', c.created_at || new Date().toISOString()]
                );
            }
            console.log(`Database: Seeded ${data.customers.length} customers.`);
        }

        // 5. Seed orders
        if (data.orders && data.orders.length > 0) {
            for (const o of data.orders) {
                await query(
                    'INSERT INTO orders (id, customer_id, customer_name, customer_phone, delivery_address, payment_method, total_amount, items, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [
                        o.id,
                        o.customer_id,
                        o.customer_name,
                        o.customer_phone,
                        o.delivery_address,
                        o.payment_method || 'cod',
                        o.total_amount,
                        JSON.stringify(o.items || []),
                        o.created_at || new Date().toISOString()
                    ]
                );
            }
            console.log(`Database: Seeded ${data.orders.length} orders.`);
        }

        // 6. Seed requests
        if (data.product_requests && data.product_requests.length > 0) {
            for (const r of data.product_requests) {
                await query(
                    'INSERT INTO product_requests (id, customer_name, customer_phone, requested_product, notes, created_at) VALUES ($1, $2, $3, $4, $5)',
                    [r.id, r.customer_name, r.customer_phone, r.requested_product, r.notes || '', r.created_at || new Date().toISOString()]
                );
            }
            console.log(`Database: Seeded ${data.product_requests.length} product requests.`);
        }

        console.log('Database: Database seeding completed successfully.');
    } catch (err) {
        console.error('Database: Error during table seeding:', err);
    }
}

// Self-initialization sequence
async function init() {
    try {
        await initSchema();
        await seedIfEmpty();
    } catch (err) {
        console.error('Database: Setup error:', err);
    }
}

init();

function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to fetch sheet: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

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

function getCategoryIdFromSheet(categoryName, productName) {
    if (!categoryName) {
        return getCategoryIdFromName(productName);
    }
    const clean = categoryName.trim().toLowerCase();
    if (clean.includes('مكواة') || clean.includes('بخار') || clean.includes('iron') || clean.includes('ملابس')) {
        return 1; // irons
    }
    if (clean.includes('مكنسة') || clean.includes('تنظيف') || clean.includes('vacuum') || clean.includes('مكاس') || clean.includes('مكنس')) {
        return 2; // vacuums
    }
    if (clean.includes('مطبخ') || clean.includes('خلاط') || clean.includes('غلاية') || clean.includes('blender') || clean.includes('kettle') || clean.includes('microwave') || clean.includes('طعام') || clean.includes('شعر')) {
        return 3; // kitchen
    }
    if (clean.includes('كبير') || clean.includes('ثلاجة') || clean.includes('غسالة') || clean.includes('تلفزيون') || clean.includes('مكيف')) {
        return 4; // large-appliances
    }
    return getCategoryIdFromName(productName);
}

function getCategoryIdFromName(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('مكواة') || lowerName.includes('بخار') || lowerName.includes('iron')) {
        return 1; // irons
    }
    if (lowerName.includes('مكنسة') || lowerName.includes('تنظيف') || lowerName.includes('vacuum') || lowerName.includes('broom')) {
        return 2; // vacuums
    }
    if (lowerName.includes('ميكروويف') || lowerName.includes('خلاط') || lowerName.includes('غلاية') || lowerName.includes('blender') || lowerName.includes('kettle') || lowerName.includes('microwave') || lowerName.includes('شعر')) {
        return 3; // kitchen
    }
    return 4; // large-appliances
}

function getFallbackImage(categoryId) {
    const placeholders = {
        1: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', // irons
        2: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80', // vacuums
        3: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80', // kitchen
        4: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'  // large-appliances
    };
    return placeholders[categoryId] || placeholders[4];
}

function getProductImage(imageLink, categoryId) {
    if (!imageLink) {
        return getFallbackImage(categoryId);
    }
    if (imageLink.startsWith('http://') || imageLink.startsWith('https://') || imageLink.startsWith('/')) {
        return imageLink;
    }
    try {
        const localPath1 = path.join(__dirname, 'public', imageLink);
        const localPath2 = path.join(__dirname, 'public', 'asset', imageLink);
        if (fs.existsSync(localPath1)) {
            return '/' + imageLink;
        }
        if (fs.existsSync(localPath2)) {
            return '/asset/' + imageLink;
        }
    } catch (e) {}
    return getFallbackImage(categoryId);
}

let isSyncInProgress = false;

async function syncGoogleSheets() {
    if (isSyncInProgress) {
        console.log('Database: Excel sync is already in progress, skipping.');
        return 0;
    }
    isSyncInProgress = true;
    try {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv';
        console.log('Database: Starting Google Sheets product sync...');
        
        let useXlsx = false;
        let products = [];

        try {
            const scratchDir = path.join(__dirname, 'scratch');
            const tempXlsx = path.join(scratchDir, 'sheet.xlsx');
            const tempUnzipped = path.join(scratchDir, 'unzipped');
            
            if (!fs.existsSync(scratchDir)) {
                fs.mkdirSync(scratchDir, { recursive: true });
            }
            
            await downloadXlsxFile('https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/export?format=xlsx', tempXlsx);
            unzipXlsx(tempXlsx, tempUnzipped);
            useXlsx = true;
            console.log('Database: Downloaded and unzipped XLSX sheet.');
        } catch (e) {
            console.warn('Database: XLSX extraction failed, falling back to CSV sync:', e.message);
            useXlsx = false;
        }

        try {
            if (useXlsx) {
                try {
                    const tempUnzipped = path.join(__dirname, 'scratch', 'unzipped');
                    const sheetXml = fs.readFileSync(path.join(tempUnzipped, 'xl', 'worksheets', 'sheet1.xml'), 'utf8');
                    const relsXml = fs.readFileSync(path.join(tempUnzipped, 'xl', 'worksheets', '_rels', 'sheet1.xml.rels'), 'utf8');
                    const sharedStringsXml = fs.readFileSync(path.join(tempUnzipped, 'xl', 'sharedStrings.xml'), 'utf8');

                    // 1. Parse Shared Strings
                    const sharedStrings = [];
                    const siRegex = /<si>[\s\S]*?<\/si>/g;
                    let siMatch;
                    while ((siMatch = siRegex.exec(sharedStringsXml)) !== null) {
                        const tMatch = siMatch[0].match(/<t[^>]*>([\s\S]*?)<\/t>/);
                        sharedStrings.push(tMatch ? tMatch[1] : '');
                    }

                    // 2. Parse Relationships (hyperlinks)
                    const rels = {};
                    const relRegex = /<Relationship\s+Id="([^"]+)"\s+Type="[^"]+hyperlink"\s+Target="([^"]+)"/g;
                    let relMatch;
                    while ((relMatch = relRegex.exec(relsXml)) !== null) {
                        rels[relMatch[1]] = relMatch[2];
                    }

                    // 3. Parse Sheet Hyperlink Map
                    const cellHyperlinks = {};
                    const hyperlinkRegex = /<hyperlink\s+([^>]*?)\/>/g;
                    let hyperlinkMatch;
                    while ((hyperlinkMatch = hyperlinkRegex.exec(sheetXml)) !== null) {
                        const attrs = hyperlinkMatch[1];
                        const refMatch = attrs.match(/ref="([^"]+)"/);
                        const idMatch = attrs.match(/r:id="([^"]+)"/);
                        if (refMatch && idMatch) {
                            const cellRef = refMatch[1];
                            const rId = idMatch[1];
                            if (rels[rId]) {
                                cellHyperlinks[cellRef] = rels[rId];
                            }
                        }
                    }

                    // 4. Parse Rows and Cells
                    const rows = [];
                    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
                    let rowMatch;
                    while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
                        const rowContent = rowMatch[0];
                        const rowNumMatch = rowContent.match(/r="(\d+)"/);
                        const rowNum = rowNumMatch ? parseInt(rowNumMatch[1], 10) : (rows.length + 1);

                        const cellRegex = /<c\s+r="([A-Z]+)(\d+)"\s*(?:s="[^"]*")?\s*(?:t="([^"]*)")?>([\s\S]*?)<\/c>/g;
                        let cellMatch;
                        const rowCells = {};
                        while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                            const colLetter = cellMatch[1];
                            const cellType = cellMatch[3] || '';
                            const vMatch = cellMatch[4].match(/<v>([\s\S]*?)<\/v>/);
                            const rawVal = vMatch ? vMatch[1] : '';

                            let finalVal = '';
                            if (cellType === 's') {
                                const idx = parseInt(rawVal, 10);
                                finalVal = sharedStrings[idx] || '';
                            } else {
                                finalVal = rawVal;
                            }
                            rowCells[colLetter] = finalVal;
                        }
                        rows.push({ rowNum, cells: rowCells });
                    }

                    // Compile products from rows
                    for (const r of rows) {
                        if (r.rowNum < 3) continue;
                        const cells = r.cells;
                        
                        const name = cells.B || '';
                        const brand = cells.C ? cells.C.trim() : '';
                        const code = cells.D || '';
                        if (!name || !code) continue;

                        const id = parseInt(cells.A, 10) || r.rowNum;
                        const quantity = parseFloat(cells.E) || 0;
                        const cost = parsePrice(cells.F);
                        const sellingPrice = parsePrice(cells.G);
                        const discountPrice = parsePrice(cells.H);
                        const categoryName = cells.J || '';
                        
                        // Column K holds image - check hyperlink first, otherwise raw text
                        const cellRefK = `K${r.rowNum}`;
                        let imageLink = cellHyperlinks[cellRefK] || cells.K || '';
                        imageLink = getGoogleDriveDirectLink(imageLink);

                        // Column L holds video - check hyperlink first, otherwise raw text
                        const cellRefL = `L${r.rowNum}`;
                        const videoLink = cellHyperlinks[cellRefL] || cells.L || '';

                        const categoryId = getCategoryIdFromSheet(categoryName, name);
                        const finalImage = getProductImage(imageLink, categoryId);

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
                            brand: brand || 'ElectroHome'
                        });
                    }
                    console.log(`Database: Parsed ${products.length} products from XLSX successfully.`);
                } catch (xlsxParseErr) {
                    console.error('Database: Error parsing XLSX, falling back to CSV:', xlsxParseErr.message);
                    useXlsx = false;
                    products = [];
                }
            }

            if (!useXlsx) {
                const csvData = await fetchCSV(sheetUrl);
                const csvRows = parseCSV(csvData);
                if (csvRows.length < 2) {
                    throw new Error('Google Sheets returned empty or invalid CSV data');
                }

                for (let i = 1; i < csvRows.length; i++) {
                    const row = csvRows[i];
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
                    const imageLink = row[10] || '';
                    const videoLink = row[11] || '';

                    const categoryId = getCategoryIdFromSheet(categoryName, name);
                    const title = name;
                    const finalImage = getProductImage(imageLink, categoryId);

                    products.push({
                        id,
                        category_id: categoryId,
                        title_ar: title,
                        slug: `prod-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id}`,
                        description_ar: `جهاز كهربائي ذكي عالي الكفاءة. الموديل: ${code}. متوفر حالياً بالمخزون بكمية ${Math.round(quantity)} قطعة.`,
                        base_price: sellingPrice || cost || 0,
                        discount_price: discountPrice,
                        main_image: finalImage,
                        youtube_url: videoLink,
                        is_visible: 1,
                        stock_quantity: Math.round(quantity),
                        sku: code,
                        brand: brand || 'ElectroHome'
                    });
                }
            }

            if (products.length === 0) {
                throw new Error('No valid products parsed from Google Sheets');
            }

            // Run DB operations inside transaction
            await query('BEGIN');
            try {
                await query('DELETE FROM product_variants');
                await query('DELETE FROM products');

                for (const p of products) {
                    await query(
                        'INSERT INTO products (id, category_id, title_ar, slug, description_ar, base_price, discount_price, main_image, youtube_url, is_visible, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                        [p.id, p.category_id, p.title_ar, p.slug, p.description_ar, p.base_price, p.discount_price, p.main_image, p.youtube_url, p.is_visible, new Date().toISOString()]
                    );

                    await query(
                        'INSERT INTO product_variants (product_id, brand, model_name, variant_attributes, price_modifier, stock_quantity, sku) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                        [p.id, p.brand, p.sku, '{}', 0, p.stock_quantity, p.sku]
                    );
                }
                await query('COMMIT');
                console.log(`Database: Successfully synchronized ${products.length} products and variants from Google Sheets.`);

                // Write static JSON file to public and source paths for client direct sync
                try {
                    const jsonContent = JSON.stringify(products, null, 2);
                    const paths = [
                        path.join(__dirname, 'js', 'products.json'),
                        path.join(__dirname, 'public', 'js', 'products.json')
                    ];
                    for (const pPath of paths) {
                        const dir = path.dirname(pPath);
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir, { recursive: true });
                        }
                        fs.writeFileSync(pPath, jsonContent, 'utf8');
                        console.log(`Database: Wrote static products sync to ${pPath}`);
                    }
                } catch (jsonErr) {
                    console.error('Database: Failed to write static JSON file:', jsonErr.message);
                }

                return products.length;
            } catch (dbErr) {
                await query('ROLLBACK');
                throw dbErr;
            }
        } catch (err) {
            console.error('Database: Google Sheets sync failed:', err.message);
            throw err;
        }
    } finally {
        isSyncInProgress = false;
    }
}

module.exports = {
    query,
    isPg,
    syncGoogleSheets
};
