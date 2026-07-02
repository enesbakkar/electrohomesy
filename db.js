const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

module.exports = {
    query,
    isPg
};
