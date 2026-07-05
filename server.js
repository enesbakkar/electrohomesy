const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not defined in production!');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_sign_key_123456';
const PUBLIC_DIR = path.join(__dirname, 'public');

// Middlewares
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['https://electrohomesy.com', 'http://localhost:5000', 'http://localhost:5050'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate Limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 10,
    message: { error: 'محاولات دخول كثيرة جداً، يرجى المحاولة لاحقاً بعد 15 دقيقة' }
});

const submissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { error: 'طلب مفرط، يرجى المحاولة لاحقاً بعد 15 دقيقة' }
});

// Double Submit Cookie CSRF Protection Middleware
function csrfMiddleware(req, res, next) {
    let token = req.cookies.csrf_token;
    if (!token) {
        token = crypto.randomBytes(24).toString('hex');
        res.cookie('csrf_token', token, {
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
        });
        req.cookies.csrf_token = token;
    }

    const stateModifyingMethods = ['POST', 'PUT', 'DELETE'];
    if (stateModifyingMethods.includes(req.method)) {
        const clientToken = req.headers['x-csrf-token'];
        if (!clientToken || clientToken !== req.cookies.csrf_token) {
            return res.status(403).json({ error: 'انتهت صلاحية الجلسة الأمنية (CSRF Verification Failed)' });
        }
    }
    next();
}

app.use(csrfMiddleware);

// Admin JWT Cookie Auth Middleware
function requireAdmin(req, res, next) {
    const token = req.cookies.admin_token;
    if (!token) {
        return res.status(401).json({ error: 'غير مصرح للوصول للوحة الإدارة' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' });
    }
}

// Server-side Input Validation Helper
function validateSyrianPhone(phone) {
    const clean = (phone || '').replace(/\s+/g, '');
    return /^(09|\+9639|9639)\d{8}$/.test(clean);
}

function validateBody(schema) {
    return (req, res, next) => {
        for (const [key, rules] of Object.entries(schema)) {
            const value = req.body[key];
            if (rules.required && (value === undefined || value === null || value === '')) {
                return res.status(400).json({ error: `الحقل ${key} إجباري` });
            }
            if (rules.type === 'number' && value !== undefined && value !== null) {
                const num = Number(value);
                if (isNaN(num)) {
                    return res.status(400).json({ error: `الحقل ${key} يجب أن يكون رقماً` });
                }
                if (rules.positive && num <= 0) {
                    return res.status(400).json({ error: `الحقل ${key} يجب أن يكون قيمة موجبة` });
                }
            }
            if (rules.phone && value) {
                if (!validateSyrianPhone(value)) {
                    return res.status(400).json({ error: 'يرجى إدخال رقم هاتف سوري صحيح (مثال: 0912345678 أو 963912345678+)' });
                }
            }
        }
        next();
    };
}

// Validation Schemas
const customerSchema = {
    phone_number: { required: true, phone: true }
};

const orderSchema = {
    customer_name: { required: true },
    customer_phone: { required: true, phone: true },
    delivery_address: { required: true },
    total_amount: { required: true, type: 'number', positive: true }
};

const requestSchema = {
    customer_name: { required: true },
    customer_phone: { required: true },
    requested_product: { required: true }
};

const productSchema = {
    title_ar: { required: true },
    base_price: { required: true, type: 'number', positive: true }
};

// API ROUTES

// 1. Customer Registration
app.post('/api/customer/register', submissionLimiter, validateBody(customerSchema), async (req, res) => {
    const { full_name, phone_number, auth_provider } = req.body;
    const cleanPhone = phone_number.replace(/\s+/g, '');

    try {
        const existing = await db.query('SELECT * FROM customers WHERE phone_number = $1', [cleanPhone]);
        let customer;
        if (existing.rows.length > 0) {
            customer = existing.rows[0];
        } else {
            const insertRes = await db.query(
                'INSERT INTO customers (full_name, phone_number, auth_provider, created_at) VALUES ($1, $2, $3, $4) RETURNING id',
                [full_name || 'عميل إلكتروهومسي', cleanPhone, auth_provider || 'phone', new Date().toISOString()]
            );
            const newId = insertRes.rows[0].id;
            customer = {
                id: newId,
                full_name: full_name || 'عميل إلكتروهومسي',
                phone_number: cleanPhone,
                auth_provider: auth_provider || 'phone'
            };
        }
        res.json({ message: 'تم تسـجيل الدخول بنجاح', customer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 2. Get Categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 3. Products List (Dynamic search and visibility)
app.get('/api/products', async (req, res) => {
    const { category, search, include_hidden } = req.query;

    try {
        let sql = 'SELECT p.*, c.name_ar as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE 1=1';
        const params = [];

        if (include_hidden !== 'true') {
            sql += ' AND p.is_visible = 1';
        }

        if (category && category !== 'all') {
            params.push(category);
            sql += ` AND c.slug = $${params.length}`;
        }

        if (search) {
            params.push(`%${search.toLowerCase()}%`);
            sql += ` AND (LOWER(p.title_ar) LIKE $${params.length} OR LOWER(p.description_ar) LIKE $${params.length})`;
        }

        sql += ' ORDER BY p.id DESC';

        const result = await db.query(sql, params);
        const products = result.rows;

        if (products.length > 0) {
            const productIds = products.map(p => p.id);
            const placeholders = productIds.map((_, index) => `$${index + 1}`).join(', ');
            const variantsSql = `SELECT * FROM product_variants WHERE product_id IN (${placeholders})`;
            const variantsResult = await db.query(variantsSql, productIds);
            const variants = variantsResult.rows;

            const variantsMap = {};
            for (const v of variants) {
                try {
                    v.variant_attributes = typeof v.variant_attributes === 'string' ? JSON.parse(v.variant_attributes) : v.variant_attributes;
                } catch (e) {
                    v.variant_attributes = {};
                }
                if (!variantsMap[v.product_id]) {
                    variantsMap[v.product_id] = [];
                }
                variantsMap[v.product_id].push(v);
            }

            for (const p of products) {
                p.variants = variantsMap[p.id] || [];
            }
        }
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 4. Single Product Details
app.get('/api/products/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'معرف المنتج غير صحيح' });

    try {
        const result = await db.query(
            'SELECT p.*, c.name_ar as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'المنتج غير موجود' });
        }
        const product = result.rows[0];
        const vResult = await db.query('SELECT * FROM product_variants WHERE product_id = $1', [id]);
        product.variants = vResult.rows.map(v => {
            try {
                v.variant_attributes = typeof v.variant_attributes === 'string' ? JSON.parse(v.variant_attributes) : v.variant_attributes;
            } catch (e) {
                v.variant_attributes = {};
            }
            return v;
        });
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 5. Create Product (Admin Only)
app.post('/api/products', requireAdmin, validateBody(productSchema), async (req, res) => {
    const { category_id, title_ar, description_ar, base_price, discount_price, main_image, youtube_url, is_visible, variants } = req.body;

    try {
        const insertRes = await db.query(
            'INSERT INTO products (category_id, title_ar, slug, description_ar, base_price, discount_price, main_image, youtube_url, is_visible, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
            [
                Number(category_id) || 1,
                title_ar,
                'prod-' + Date.now(),
                description_ar || '',
                Number(base_price),
                discount_price ? Number(discount_price) : null,
                main_image || '',
                youtube_url || '',
                is_visible !== undefined ? Number(is_visible) : 1,
                new Date().toISOString()
            ]
        );
        const newProductId = insertRes.rows[0].id;

        if (variants && Array.isArray(variants)) {
            for (const v of variants) {
                await db.query(
                    'INSERT INTO product_variants (product_id, brand, model_name, variant_attributes, price_modifier, stock_quantity, sku) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [
                        newProductId,
                        v.brand || '',
                        v.model_name || '',
                        JSON.stringify(v.variant_attributes || {}),
                        Number(v.price_modifier || 0),
                        v.stock_quantity !== undefined ? Number(v.stock_quantity) : 10,
                        v.sku || 'SKU-' + Date.now()
                    ]
                );
            }
        }
        res.status(201).json({ message: 'تم الإضافة بنجاح', id: newProductId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 6. Update Product (Admin Only)
app.put('/api/products/:id', requireAdmin, validateBody(productSchema), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'معرف المنتج غير صحيح' });

    const { category_id, title_ar, description_ar, base_price, discount_price, main_image, youtube_url, is_visible, variants } = req.body;

    try {
        const check = await db.query('SELECT id FROM products WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'المنتج غير موجود' });

        await db.query(
            'UPDATE products SET category_id = $1, title_ar = $2, description_ar = $3, base_price = $4, discount_price = $5, main_image = $6, youtube_url = $7, is_visible = $8 WHERE id = $9',
            [
                Number(category_id),
                title_ar,
                description_ar,
                Number(base_price),
                discount_price ? Number(discount_price) : null,
                main_image,
                youtube_url,
                is_visible !== undefined ? Number(is_visible) : 1,
                id
            ]
        );

        if (variants && Array.isArray(variants)) {
            await db.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
            for (const v of variants) {
                await db.query(
                    'INSERT INTO product_variants (product_id, brand, model_name, variant_attributes, price_modifier, stock_quantity, sku) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [
                        id,
                        v.brand || '',
                        v.model_name || '',
                        JSON.stringify(v.variant_attributes || {}),
                        Number(v.price_modifier || 0),
                        v.stock_quantity !== undefined ? Number(v.stock_quantity) : 10,
                        v.sku || 'SKU-' + Date.now()
                    ]
                );
            }
        }
        res.json({ message: 'تم التحديث بنجاح' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 7. Toggle Product Visibility (Admin Only)
app.put('/api/products/:id/visibility', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'معرف المنتج غير صحيح' });
    const { is_visible } = req.body;

    try {
        await db.query('UPDATE products SET is_visible = $1 WHERE id = $2', [is_visible ? 1 : 0, id]);
        res.json({ message: 'تم تغيير حالة الظهور' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 8. Delete Product (Admin Only)
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'معرف المنتج غير صحيح' });

    try {
        await db.query('DELETE FROM products WHERE id = $1', [id]);
        await db.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
        res.json({ message: 'تم الحذف بنجاح' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 9. Submit Order
app.post('/api/orders', submissionLimiter, validateBody(orderSchema), async (req, res) => {
    const { customer_name, customer_phone, delivery_address, payment_method, total_amount, items, customer_id } = req.body;

    try {
        const insertRes = await db.query(
            'INSERT INTO orders (customer_id, customer_name, customer_phone, delivery_address, payment_method, total_amount, items, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
            [
                customer_id || null,
                customer_name,
                customer_phone,
                delivery_address,
                payment_method || 'cod',
                total_amount,
                JSON.stringify(items || []),
                new Date().toISOString()
            ]
        );
        res.status(201).json({ message: 'تم استلام طلبكم بنجاح! سيتواصل معكم فريق التوصيل قريباً.', order_id: insertRes.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 10. Get Orders (Admin Only)
app.get('/api/orders', requireAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM orders ORDER BY id DESC');
        const orders = result.rows.map(o => {
            try {
                o.items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
            } catch (e) {
                o.items = [];
            }
            return o;
        });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 11. Submit Product Suggestion Request
app.post('/api/requests', submissionLimiter, validateBody(requestSchema), async (req, res) => {
    const { customer_name, customer_phone, requested_product, notes } = req.body;

    try {
        await db.query(
            'INSERT INTO product_requests (customer_name, customer_phone, requested_product, notes, created_at) VALUES ($1, $2, $3, $4, $5)',
            [customer_name, customer_phone, requested_product, notes || '', new Date().toISOString()]
        );
        res.status(201).json({ message: 'تم إرسال اقتراحك بنجاح. شكراً لتواصلك مع إلكتروهومسي!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 12. Get Suggestions List (Admin Only)
app.get('/api/requests', requireAdmin, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM product_requests ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'خطأ داخلي في الخادم' });
    }
});

// 13. Admin Login (Secure environment auth with JWT cookies)
app.post('/api/admin/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedHash = process.env.ADMIN_PASSWORD_HASH;

    if (username === expectedUsername && expectedHash && bcrypt.compareSync(password, expectedHash)) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        return res.json({ message: 'Success' });
    }
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

// 14. Admin Verify Auth Status
app.get('/api/admin/verify', requireAdmin, (req, res) => {
    res.json({ authenticated: true });
});

// 15. Admin Logout (Clear HttpOnly cookie)
app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ message: 'Logged out successfully' });
});

// 16. Admin Force Excel Sync
app.post('/api/admin/sync', requireAdmin, async (req, res) => {
    try {
        console.log('Admin triggered manual Excel sync...');
        const count = await db.syncGoogleSheets();
        res.json({ success: true, count });
    } catch (err) {
        console.error('Manual Excel sync failed:', err.message);
        res.status(500).json({ error: 'فشلت عملية مزامنة البيانات: ' + err.message });
    }
});


// Serve Static Assets & SPA Routing
app.use(express.static(PUBLIC_DIR));

// Page routes mapping
app.get('/admin', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'admin.html'));
});

app.get('/product.html', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'product.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
    console.log(`===================================================`);
    console.log(`🚀 ElectroHomeSY Server running locally at: http://localhost:${PORT}`);
    console.log(`🔑 Admin Dashboard available at: http://localhost:${PORT}/admin`);
    console.log(`===================================================`);

    // Initial Google Sheets product synchronization
    try {
        await db.syncGoogleSheets();
    } catch (e) {
        console.error('Initial Google Sheets product synchronization failed on start:', e.message);
    }

    // Background Google Sheets product synchronization every 60 seconds
    setInterval(async () => {
        try {
            console.log('Running scheduled background Google Sheets sync...');
            await db.syncGoogleSheets();
        } catch (e) {
            console.error('Scheduled background Google Sheets sync failed:', e.message);
        }
    }, 60 * 1000);
});
