const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'electrohomesy_db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Simple & Reliable JSON Database Store
let dbData = {
    categories: [],
    products: [],
    product_variants: [],
    orders: [],
    product_requests: [],
    customers: [],
    users: []
};

function loadDatabase() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            dbData = JSON.parse(raw);
            if (!dbData.customers) dbData.customers = [];
        } catch (e) {
            seedInitialData();
        }
    } else {
        seedInitialData();
    }
}

function saveDatabase() {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
}

function seedInitialData() {
    dbData = {
        categories: [
            { id: 1, name_ar: 'المكاوي وأجهزة البخار', slug: 'irons', icon: 'fa-iron' },
            { id: 2, name_ar: 'المكاس والتنظيف', slug: 'vacuums', icon: 'fa-broom' },
            { id: 3, name_ar: 'أجهزة المطبخ والخلاطات', slug: 'kitchen', icon: 'fa-blender' },
            { id: 4, name_ar: 'الأجهزة المنزلية الكبيرة', slug: 'large-appliances', icon: 'fa-tv' }
        ],
        products: [
            {
                id: 1,
                category_id: 1,
                title_ar: 'مكواة بخار ذكية عالية الكفاءة',
                slug: 'smart-steam-iron',
                description_ar: 'مكواة بخار احترافية بقاعدة سيراميك مانعة للالتصاق، نظام ضغط مضاعف لكيّ الأقمشة الثقيلة والخفيفة بسرعة فائقة مع خاصية التنظيف الذاتي.',
                base_price: 185000,
                discount_price: 165000,
                main_image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80',
                youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                is_visible: 1,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                category_id: 2,
                title_ar: 'مكنسة كهربائية سيلكون صامتة بقوة شفط هائلة',
                slug: 'silent-vacuum-cleaner',
                description_ar: 'مكنسة كهربائية فائقة الهدوء مزودة بفلتر HEPA طبي مضاد للحساسية ومحرك توربو لإزالة أصعب الأتربة والغبار من السجاد والأرضيات.',
                base_price: 420000,
                discount_price: 390000,
                main_image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
                youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                is_visible: 1,
                created_at: new Date().toISOString()
            },
            {
                id: 3,
                category_id: 3,
                title_ar: 'خلاط ومحضر طعام متعدد الوظائف 4 في 1',
                slug: 'multi-blender-4in1',
                description_ar: 'محضر طعام متعدد الاستخدامات يشمل خلاط عصائر، مطحنة بهارات، مفرمة لحوم وخفاقة. شفرات فولاذية مقاومة للصدأ مع سرعتين ونظام خفق نبضي.',
                base_price: 275000,
                discount_price: null,
                main_image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
                youtube_url: '',
                is_visible: 1,
                created_at: new Date().toISOString()
            }
        ],
        product_variants: [
            { id: 1, product_id: 1, brand: 'Philips', model_name: 'PerfectCare 7000', variant_attributes: { "اللون": "أزرق ملكي", "القوة": "2400 واط", "سعة الخزان": "300 مل" }, price_modifier: 0, stock_quantity: 15, sku: 'PHI-IRON-01' },
            { id: 2, product_id: 1, brand: 'Tefal', model_name: 'Ultimate Pure', variant_attributes: { "اللون": "أسود ذهبي", "القوة": "3000 واط", "سعة الخزان": "350 مل" }, price_modifier: 35000, stock_quantity: 8, sku: 'TEF-IRON-02' },
            { id: 3, product_id: 2, brand: 'Bosch', model_name: 'ProSilence Series 6', variant_attributes: { "اللون": "أحمر دمشقي", "السعة": "4 لتر", "طول السلك": "9 متر" }, price_modifier: 0, stock_quantity: 10, sku: 'BOS-VAC-01' },
            { id: 4, product_id: 2, brand: 'Samsung', model_name: 'PowerMotion Eco', variant_attributes: { "اللون": "فضي معدني", "السعة": "4.5 لتر", "طول السلك": "10 متر" }, price_modifier: 45000, stock_quantity: 5, sku: 'SAM-VAC-02' },
            { id: 5, product_id: 3, brand: 'Moulinex', model_name: 'DoubleForce', variant_attributes: { "الوعاء": "زجاج مقوى 1.75 لتر", "القوة": "1000 واط" }, price_modifier: 0, stock_quantity: 20, sku: 'MOU-BLN-01' },
            { id: 6, product_id: 3, brand: 'Kenwood', model_name: 'Multipro Express', variant_attributes: { "الوعاء": "بلاستيك غير قابل للكسر 2 لتر", "القوة": "1200 واط" }, price_modifier: 50000, stock_quantity: 12, sku: 'KEN-BLN-02' }
        ],
        orders: [],
        product_requests: [],
        customers: [],
        users: [
            { id: 1, username: 'admin', password: 'admin123' }
        ]
    };
    saveDatabase();
}

loadDatabase();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        try {
            callback(body ? JSON.parse(body) : {});
        } catch (e) {
            callback({});
        }
    });
}

const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;
    const method = req.method;

    // API ROUTES
    if (pathname.startsWith('/api/')) {
        // Customer Registration & Login
        if (pathname === '/api/customer/register' && method === 'POST') {
            return parseBody(req, (body) => {
                const { full_name, phone_number, auth_provider } = body;
                if (!phone_number) return sendJson(res, 400, { error: 'رقم الهاتف السوري إجباري للجميع' });

                // Check Syrian phone number format
                const cleanPhone = phone_number.replace(/\s+/g, '');
                const isSyrian = /^(09|\+9639|9639)\d{8}$/.test(cleanPhone);
                if (!isSyrian) {
                    return sendJson(res, 400, { error: 'يرجى إدخال رقم هاتف سوري صحيح (مثال: 0912345678 أو 963912345678+)' });
                }

                let existing = dbData.customers.find(c => c.phone_number === cleanPhone);
                if (!existing) {
                    const newId = dbData.customers.length > 0 ? Math.max(...dbData.customers.map(c => c.id)) + 1 : 1;
                    existing = {
                        id: newId,
                        full_name: full_name || 'عميل إلكتروهومسي',
                        phone_number: cleanPhone,
                        auth_provider: auth_provider || 'phone',
                        created_at: new Date().toISOString()
                    };
                    dbData.customers.push(existing);
                    saveDatabase();
                }

                return sendJson(res, 200, { message: 'تم تسـجيل الدخول بنجاح', customer: existing });
            });
        }

        // 1. Get Categories
        if (pathname === '/api/categories' && method === 'GET') {
            return sendJson(res, 200, dbData.categories);
        }

        // 2. Products List
        if (pathname === '/api/products' && method === 'GET') {
            const category = reqUrl.searchParams.get('category');
            const search = reqUrl.searchParams.get('search');
            const include_hidden = reqUrl.searchParams.get('include_hidden');

            let list = dbData.products;

            if (include_hidden !== 'true') {
                list = list.filter(p => p.is_visible === 1);
            }

            if (category && category !== 'all') {
                const cat = dbData.categories.find(c => c.slug === category);
                if (cat) list = list.filter(p => p.category_id === cat.id);
            }

            if (search) {
                const q = search.toLowerCase();
                list = list.filter(p => p.title_ar.toLowerCase().includes(q) || (p.description_ar && p.description_ar.toLowerCase().includes(q)));
            }

            const result = list.map(p => {
                const cat = dbData.categories.find(c => c.id === p.category_id);
                const variants = dbData.product_variants.filter(v => v.product_id === p.id);
                return { ...p, category_name: cat ? cat.name_ar : '', variants };
            });

            return sendJson(res, 200, result);
        }

        // 3. Single Product
        const prodMatch = pathname.match(/^\/api\/products\/(\d+)$/);
        if (prodMatch && method === 'GET') {
            const id = Number(prodMatch[1]);
            const p = dbData.products.find(item => item.id === id);
            if (!p) return sendJson(res, 404, { error: 'المنتج غير موجود' });

            const cat = dbData.categories.find(c => c.id === p.category_id);
            const variants = dbData.product_variants.filter(v => v.product_id === p.id);
            return sendJson(res, 200, { ...p, category_name: cat ? cat.name_ar : '', variants });
        }

        // 4. Create Product
        if (pathname === '/api/products' && method === 'POST') {
            return parseBody(req, (body) => {
                const { category_id, title_ar, description_ar, base_price, discount_price, main_image, youtube_url, is_visible, variants } = body;
                if (!title_ar || !base_price) return sendJson(res, 400, { error: 'بيانات ناقصة' });

                const newId = dbData.products.length > 0 ? Math.max(...dbData.products.map(p => p.id)) + 1 : 1;
                const newProduct = {
                    id: newId,
                    category_id: Number(category_id) || 1,
                    title_ar,
                    slug: 'prod-' + Date.now(),
                    description_ar,
                    base_price: Number(base_price),
                    discount_price: discount_price ? Number(discount_price) : null,
                    main_image: main_image || '',
                    youtube_url: youtube_url || '',
                    is_visible: is_visible ?? 1,
                    created_at: new Date().toISOString()
                };

                dbData.products.unshift(newProduct);

                if (variants && Array.isArray(variants)) {
                    variants.forEach(v => {
                        const vId = dbData.product_variants.length > 0 ? Math.max(...dbData.product_variants.map(item => item.id)) + 1 : 1;
                        dbData.product_variants.push({
                            id: vId,
                            product_id: newId,
                            brand: v.brand || '',
                            model_name: v.model_name || '',
                            variant_attributes: v.variant_attributes || {},
                            price_modifier: Number(v.price_modifier || 0),
                            stock_quantity: 10,
                            sku: 'SKU-' + Date.now()
                        });
                    });
                }

                saveDatabase();
                return sendJson(res, 201, { message: 'تم الإضافة بنجاح', id: newId });
            });
        }

        // 5. Update Product
        if (prodMatch && method === 'PUT') {
            const id = Number(prodMatch[1]);
            const index = dbData.products.findIndex(p => p.id === id);
            if (index === -1) return sendJson(res, 404, { error: 'Product not found' });

            return parseBody(req, (body) => {
                const { category_id, title_ar, description_ar, base_price, discount_price, main_image, youtube_url, is_visible, variants } = body;
                
                dbData.products[index] = {
                    ...dbData.products[index],
                    category_id: Number(category_id),
                    title_ar,
                    description_ar,
                    base_price: Number(base_price),
                    discount_price: discount_price ? Number(discount_price) : null,
                    main_image,
                    youtube_url,
                    is_visible: is_visible ?? 1
                };

                if (variants && Array.isArray(variants)) {
                    dbData.product_variants = dbData.product_variants.filter(v => v.product_id !== id);
                    variants.forEach(v => {
                        const vId = dbData.product_variants.length > 0 ? Math.max(...dbData.product_variants.map(item => item.id)) + 1 : 1;
                        dbData.product_variants.push({
                            id: vId,
                            product_id: id,
                            brand: v.brand || '',
                            model_name: v.model_name || '',
                            variant_attributes: v.variant_attributes || {},
                            price_modifier: Number(v.price_modifier || 0),
                            stock_quantity: 10,
                            sku: 'SKU-' + Date.now()
                        });
                    });
                }

                saveDatabase();
                return sendJson(res, 200, { message: 'تم التحديث بنجاح' });
            });
        }

        // 6. Toggle Visibility
        const visMatch = pathname.match(/^\/api\/products\/(\d+)\/visibility$/);
        if (visMatch && method === 'PUT') {
            const id = Number(visMatch[1]);
            return parseBody(req, (body) => {
                const p = dbData.products.find(item => item.id === id);
                if (p) {
                    p.is_visible = body.is_visible ? 1 : 0;
                    saveDatabase();
                }
                return sendJson(res, 200, { message: 'تم التغيير' });
            });
        }

        // 7. Delete Product
        if (prodMatch && method === 'DELETE') {
            const id = Number(prodMatch[1]);
            dbData.products = dbData.products.filter(p => p.id !== id);
            dbData.product_variants = dbData.product_variants.filter(v => v.product_id !== id);
            saveDatabase();
            return sendJson(res, 200, { message: 'تم الحذف' });
        }

        // 8. Submit Order (Checks Customer Authentication)
        if (pathname === '/api/orders' && method === 'POST') {
            return parseBody(req, (body) => {
                const { customer_name, customer_phone, delivery_address, payment_method, total_amount, items, customer_id } = body;
                if (!customer_name || !customer_phone || !delivery_address) {
                    return sendJson(res, 400, { error: 'بيانات التوصيل غير مكتملة' });
                }
                const orderId = dbData.orders.length > 0 ? Math.max(...dbData.orders.map(o => o.id)) + 1 : 1001;
                dbData.orders.unshift({ id: orderId, customer_id: customer_id || null, customer_name, customer_phone, delivery_address, payment_method: payment_method || 'cod', total_amount, items, created_at: new Date().toISOString() });
                saveDatabase();
                return sendJson(res, 201, { message: 'تم استلام طلبكم بنجاح! سيتواصل معكم فريق التوصيل قريباً.', order_id: orderId });
            });
        }

        // 9. Get Orders
        if (pathname === '/api/orders' && method === 'GET') {
            return sendJson(res, 200, dbData.orders);
        }

        // 10. Product Requests
        if (pathname === '/api/requests' && method === 'POST') {
            return parseBody(req, (body) => {
                const { customer_name, customer_phone, requested_product, notes } = body;
                const reqId = dbData.product_requests.length > 0 ? Math.max(...dbData.product_requests.map(r => r.id)) + 1 : 1;
                dbData.product_requests.unshift({ id: reqId, customer_name, customer_phone, requested_product, notes: notes || '', created_at: new Date().toISOString() });
                saveDatabase();
                return sendJson(res, 201, { message: 'تم إرسال اقتراحك بنجاح. شكراً لتواصلك مع إلكتروهومسي!' });
            });
        }

        if (pathname === '/api/requests' && method === 'GET') {
            return sendJson(res, 200, dbData.product_requests);
        }

        // 11. Admin Login
        if (pathname === '/api/admin/login' && method === 'POST') {
            return parseBody(req, (body) => {
                const { username, password } = body;
                if (username === 'admin' && password === 'admin123') {
                    return sendJson(res, 200, { message: 'Success', token: 'admin-token-12345' });
                }
                return sendJson(res, 401, { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
            });
        }
    }

    // STATIC FILE SERVING
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : (pathname === '/admin' ? 'admin.html' : pathname));
    let extname = String(path.extname(filePath)).toLowerCase();

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (error, defaultContent) => {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(defaultContent, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            const contentType = MIME_TYPES[extname] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 ElectroHomeSY Server running locally at: http://localhost:${PORT}`);
    console.log(`🔑 Admin Dashboard available at: http://localhost:${PORT}/admin`);
    console.log(`===================================================`);
});
