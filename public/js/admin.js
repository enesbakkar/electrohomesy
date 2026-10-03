/* ElectroHomeSY - Admin panel (Supabase) */

// Login is password-only: every admin signs in to this one fixed account.
const ADMIN_LOGIN_EMAIL = 'admin@electrohomesy.com';

const CATEGORIES = [
    { id: 1, name: 'المكاوي وأجهزة البخار' },
    { id: 2, name: 'المكانس والتنظيف' },
    { id: 3, name: 'أجهزة المطبخ والطهي' },
    { id: 4, name: 'العناية الشخصية والحلاقة' },
    { id: 5, name: 'الإضاءة والمنزل والأجهزة الطبية' },
    { id: 6, name: 'ماكينات القهوة والكبسولات' }
];

const ORDER_STATUSES = {
    new: 'جديد',
    confirmed: 'مؤكد',
    shipped: 'قيد التوصيل',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
};

const PAYMENT_LABELS = { cash: 'الدفع عند الاستلام', cod: 'الدفع عند الاستلام', shamcash: 'شام كاش' };
const LOW_STOCK_LIMIT = 1;
const REFRESH_INTERVAL_MS = 60 * 1000;
const IMAGE_BUCKET = 'product-images';

let sb = null;
const state = {
    products: [],
    costs: {},
    orders: [],
    requests: [],
    editingId: null,
    editingImages: []
};

// ---------- helpers ----------

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function money(value) {
    if (value === null || value === undefined || value === '') return '—';
    return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numOrNull(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function formatDate(iso) {
    return new Date(iso).toLocaleString('ar-SY-u-nu-latn', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function categoryName(id) {
    const cat = CATEGORIES.find(c => c.id === Number(id));
    return cat ? cat.name : '—';
}

function sellingPrice(p) {
    const discount = Number(p.discount_price);
    return discount > 0 ? discount : Number(p.base_price) || 0;
}

function driveToDirect(link) {
    if (!link || !link.includes('drive.google.com')) return link;
    const m = link.match(/[?&]id=([a-zA-Z0-9_-]+)/) || link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    return m ? `https://lh3.googleusercontent.com/d/${m[1]}` : link;
}

function whatsappLink(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.startsWith('09')) digits = '963' + digits.slice(1);
    return `https://wa.me/${digits}`;
}

let toastTimer = null;
function toast(message, isError = false) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.toggle('error', isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, isError ? 5000 : 2200);
}

function fail(err, context) {
    console.error(context, err);
    toast(`${context}: ${err.message || err}`, true);
}

function downloadCsv(filename, rows) {
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
}

// ---------- auth ----------

function showView(id) {
    ['setupView', 'loginView', 'appView'].forEach(v => { $('#' + v).hidden = v !== id; });
}

async function init() {
    if (!ehsDbConfigured() || !window.supabase) {
        showView('setupView');
        return;
    }
    sb = window.supabase.createClient(EHS_CONFIG.SUPABASE_URL, EHS_CONFIG.SUPABASE_ANON_KEY);

    $('#loginForm').addEventListener('submit', handleLogin);
    $('#logoutBtn').addEventListener('click', async () => {
        await sb.auth.signOut();
        location.reload();
    });

    const { data } = await sb.auth.getSession();
    if (data.session) {
        await enterApp(data.session);
    } else {
        showView('loginView');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = $('#loginBtn');
    const errEl = $('#loginError');
    errEl.hidden = true;
    btn.disabled = true;
    const { data, error } = await sb.auth.signInWithPassword({
        email: ADMIN_LOGIN_EMAIL,
        password: $('#loginPassword').value
    });
    btn.disabled = false;
    if (error) {
        errEl.textContent = 'كلمة المرور غير صحيحة.';
        errEl.hidden = false;
        return;
    }
    await enterApp(data.session);
}

async function enterApp(session) {
    const { data: adminRow, error } = await sb.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle();
    if (error || !adminRow) {
        await sb.auth.signOut();
        showView('loginView');
        const errEl = $('#loginError');
        errEl.textContent = 'هذا الحساب لا يملك صلاحية الإدارة.';
        errEl.hidden = false;
        return;
    }
    showView('appView');
    // this browser belongs to the shop owner: keep its visits out of the statistics
    try { localStorage.setItem('ehs_is_admin', '1'); } catch (e) {}
    setupUi();
    await loadAll();
    setInterval(() => loadOrdersAndRequests().catch(() => {}), REFRESH_INTERVAL_MS);
}

// ---------- data ----------

async function loadAll() {
    await Promise.all([loadProducts(), loadOrdersAndRequests()]);
}

async function loadProducts() {
    const [productsRes, costsRes] = await Promise.all([
        sb.from('products').select('*').order('sort_order', { ascending: true }).order('id', { ascending: true }),
        sb.from('product_costs').select('*')
    ]);
    if (productsRes.error) return fail(productsRes.error, 'تعذر تحميل المنتجات');
    if (costsRes.error) return fail(costsRes.error, 'تعذر تحميل التكاليف');
    state.products = productsRes.data;
    state.costs = Object.fromEntries(costsRes.data.map(c => [c.product_id, Number(c.cost_price)]));
    renderProducts();
    renderDashboard();
}

async function loadOrdersAndRequests() {
    const [ordersRes, requestsRes] = await Promise.all([
        sb.from('orders').select('*').order('created_at', { ascending: false }),
        sb.from('product_requests').select('*').order('created_at', { ascending: false })
    ]);
    if (ordersRes.error) return fail(ordersRes.error, 'تعذر تحميل الطلبات');
    if (requestsRes.error) return fail(requestsRes.error, 'تعذر تحميل الطلبات الخاصة');
    state.orders = ordersRes.data;
    state.requests = requestsRes.data;
    renderOrders();
    renderRequests();
    renderDashboard();
    renderBadges();
}

async function updateProduct(id, fields) {
    const { error } = await sb.from('products').update(fields).eq('id', id);
    if (error) throw error;
    const p = state.products.find(x => x.id === id);
    if (p) Object.assign(p, fields);
}

async function saveCost(id, cost) {
    const { error } = await sb.from('product_costs').upsert({ product_id: id, cost_price: cost ?? 0 });
    if (error) throw error;
    state.costs[id] = cost ?? 0;
}

// ---------- UI setup ----------

function setupUi() {
    $$('.nav-item[data-tab]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    $('#refreshBtn').addEventListener('click', () => loadAll().then(() => toast('تم التحديث')));

    const catOptions = CATEGORIES.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    $('#productCategoryFilter').innerHTML = `<option value="all">كل الأصناف</option>${catOptions}`;
    $('#productCategorySelect').innerHTML = catOptions;
    $('#orderStatusFilter').innerHTML = `<option value="all">كل الحالات</option>` +
        Object.entries(ORDER_STATUSES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');

    $('#productSearch').addEventListener('input', renderProducts);
    $('#productCategoryFilter').addEventListener('change', renderProducts);
    $('#productVisibilityFilter').addEventListener('change', renderProducts);
    $('#orderSearch').addEventListener('input', renderOrders);
    $('#orderStatusFilter').addEventListener('change', renderOrders);

    $('#addProductBtn').addEventListener('click', () => openProductDialog(null));
    $('#productsTable tbody').addEventListener('change', handleProductCellChange);
    $('#productsTable tbody').addEventListener('click', e => {
        const btn = e.target.closest('[data-edit]');
        if (btn) openProductDialog(Number(btn.dataset.edit));
    });

    $('#productForm').addEventListener('submit', handleProductSave);
    $$('#productDialog [data-close]').forEach(b => b.addEventListener('click', () => $('#productDialog').close()));
    $('#deleteProductBtn').addEventListener('click', handleProductDelete);
    $('#addImageUrlBtn').addEventListener('click', addImageFromInput);
    $('#imageUrlInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); addImageFromInput(); }
    });
    $('#imageFileInput').addEventListener('change', handleImageUpload);
    $('#imagesList').addEventListener('click', handleImageTileClick);

    $('#ordersList').addEventListener('change', handleOrderChange);
    $('#ordersList').addEventListener('click', handleOrderClick);
    $('#requestsList').addEventListener('click', handleRequestClick);
    $('#recentOrders').addEventListener('click', e => {
        const row = e.target.closest('[data-goto-order]');
        if (row) { switchTab('orders'); expandOrder(Number(row.dataset.gotoOrder)); }
    });

    $('#passwordForm').addEventListener('submit', handlePasswordChange);
    $('#importBtn').addEventListener('click', importFromProductsJson);
    $('#analyticsRange').addEventListener('click', e => {
        const btn = e.target.closest('[data-days]');
        if (!btn) return;
        $$('#analyticsRange [data-days]').forEach(b => b.classList.toggle('active', b === btn));
        analyticsDays = Number(btn.dataset.days);
        loadAnalytics();
    });
    $('#shareLinks').addEventListener('click', e => {
        const btn = e.target.closest('[data-copy]');
        if (!btn) return;
        const input = btn.parentElement.querySelector('input');
        input.select();
        (navigator.clipboard ? navigator.clipboard.writeText(input.value) : Promise.reject())
            .then(() => toast('تم نسخ الرابط'))
            .catch(() => { document.execCommand('copy'); toast('تم نسخ الرابط'); });
    });
    $('#exportProductsBtn').addEventListener('click', exportProducts);
    $('#exportOrdersBtn').addEventListener('click', exportOrders);
}

function switchTab(tab) {
    $$('.nav-item[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.tab').forEach(t => { t.hidden = t.id !== `tab-${tab}`; });
    if (tab === 'analytics') loadAnalytics();
    window.scrollTo(0, 0);
}

function renderBadges() {
    const newOrders = state.orders.filter(o => o.status === 'new').length;
    const openRequests = state.requests.filter(r => !r.is_done).length;
    $('#newOrdersBadge').textContent = newOrders;
    $('#newOrdersBadge').hidden = newOrders === 0;
    $('#newRequestsBadge').textContent = openRequests;
    $('#newRequestsBadge').hidden = openRequests === 0;
    document.title = newOrders ? `(${newOrders}) لوحة إدارة إلكتروهومسي` : 'لوحة إدارة إلكتروهومسي';
}

// ---------- dashboard ----------

function renderDashboard() {
    const products = state.products;
    const visible = products.filter(p => p.is_visible);
    const outOfStock = visible.filter(p => Number(p.stock_quantity) <= 0);
    const activeOrders = state.orders.filter(o => o.status !== 'cancelled');
    const newOrders = state.orders.filter(o => o.status === 'new');
    const now = new Date();
    const monthOrders = activeOrders.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthRevenue = monthOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
    const stockValue = products.reduce((s, p) => s + sellingPrice(p) * Math.max(0, Number(p.stock_quantity) || 0), 0);
    const stockCost = products.reduce((s, p) => s + (state.costs[p.id] || 0) * Math.max(0, Number(p.stock_quantity) || 0), 0);

    const stats = [
        { label: 'طلبات جديدة', value: newOrders.length, sub: 'بانتظار التأكيد', highlight: newOrders.length > 0 },
        { label: 'مبيعات هذا الشهر', value: money(monthRevenue), sub: `${monthOrders.length} طلب (بدون الملغاة)` },
        { label: 'إجمالي الطلبات', value: state.orders.length, sub: `${activeOrders.length} فعّال` },
        { label: 'المنتجات', value: products.length, sub: `${visible.length} ظاهر في المتجر` },
        { label: 'نفد من المخزون', value: outOfStock.length, sub: 'من المنتجات الظاهرة', highlight: outOfStock.length > 0 },
        { label: 'قيمة المخزون', value: money(stockValue), sub: stockCost ? `التكلفة: ${money(stockCost)}` : 'بسعر البيع' }
    ];
    $('#statsGrid').innerHTML = stats.map(s => `
        <div class="stat ${s.highlight ? 'highlight' : ''}">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-sub">${esc(s.sub)}</div>
        </div>`).join('');

    const recent = state.orders.slice(0, 6);
    $('#recentOrders').innerHTML = recent.length ? `<div class="mini-list">${recent.map(o => `
        <div class="mini-row" data-goto-order="${o.id}" style="cursor:pointer">
            <span><b>#${o.id}</b> · <span dir="auto">${esc(o.customer_name)}</span> · <span class="meta">${formatDate(o.created_at)}</span></span>
            <span><span class="pill pill-${o.status}">${ORDER_STATUSES[o.status]}</span> <b class="num">${money(o.total_amount)}</b></span>
        </div>`).join('')}</div>` : '<div class="empty">لا توجد طلبات بعد.</div>';

    const low = products.filter(p => p.is_visible && Number(p.stock_quantity) <= LOW_STOCK_LIMIT)
        .sort((a, b) => a.stock_quantity - b.stock_quantity);
    $('#lowStock').innerHTML = low.length ? `<div class="mini-list">${low.map(p => `
        <div class="mini-row">
            <span dir="auto">${esc(p.title_ar)}</span>
            <span class="num ${p.stock_quantity <= 0 ? 'stock-out' : ''}">${p.stock_quantity} قطعة</span>
        </div>`).join('')}</div>` : '<div class="empty">جميع المنتجات متوفرة بكمية كافية.</div>';
}

// ---------- products ----------

function filteredProducts() {
    const q = $('#productSearch').value.trim().toLowerCase();
    const cat = $('#productCategoryFilter').value;
    const vis = $('#productVisibilityFilter').value;
    return state.products.filter(p => {
        if (cat !== 'all' && Number(p.category_id) !== Number(cat)) return false;
        if (vis === 'visible' && !p.is_visible) return false;
        if (vis === 'hidden' && p.is_visible) return false;
        if (vis === 'out' && Number(p.stock_quantity) > 0) return false;
        if (vis === 'featured' && !p.is_featured) return false;
        if (q) {
            const hay = `${p.title_ar} ${p.brand} ${p.sku} ${p.id}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

function profitHtml(p) {
    const cost = state.costs[p.id];
    if (!cost) return '<span class="meta">—</span>';
    const profit = sellingPrice(p) - cost;
    return `<span class="num ${profit >= 0 ? 'profit-pos' : 'profit-neg'}">${money(profit)}</span>`;
}

function renderProducts() {
    const list = filteredProducts();
    $('#productsCount').textContent = `(${list.length} / ${state.products.length})`;
    const tbody = $('#productsTable tbody');
    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="empty">${state.products.length ? 'لا توجد منتجات مطابقة للبحث.' : 'لا توجد منتجات بعد. أضف منتجاً جديداً أو استورد المنتجات الحالية من الإعدادات.'}</td></tr>`;
        return;
    }
    tbody.innerHTML = list.map(p => {
        const img = (p.images && p.images[0]) || EHS_LOGO_FALLBACK;
        const cost = state.costs[p.id];
        return `
        <tr data-id="${p.id}" class="${p.is_visible ? '' : 'is-hidden'}">
            <td><img class="thumb" src="${esc(img)}" alt="" loading="lazy" onerror="this.src='${EHS_LOGO_FALLBACK}'"></td>
            <td>
                <div class="name" dir="auto">${esc(p.title_ar)}</div>
                <div class="meta">#${p.id} · ${esc(p.brand)} · ${esc(p.sku)}</div>
            </td>
            <td class="meta">${esc(categoryName(p.category_id))}</td>
            <td><input class="cell" type="number" min="0" step="0.01" data-field="base_price" value="${p.base_price ?? ''}"></td>
            <td><input class="cell" type="number" min="0" step="0.01" data-field="discount_price" value="${p.discount_price ?? ''}" placeholder="—"></td>
            <td><input class="cell" type="number" min="0" step="0.01" data-field="cost_price" value="${cost || ''}" placeholder="—"></td>
            <td data-profit>${profitHtml(p)}</td>
            <td><input class="cell ${Number(p.stock_quantity) <= 0 ? 'stock-out' : ''}" type="number" min="0" step="1" data-field="stock_quantity" value="${p.stock_quantity}"></td>
            <td><label class="switch"><input type="checkbox" data-field="is_featured" ${p.is_featured ? 'checked' : ''}><span></span></label></td>
            <td><label class="switch"><input type="checkbox" data-field="is_visible" ${p.is_visible ? 'checked' : ''}><span></span></label></td>
            <td><button class="btn btn-sm" data-edit="${p.id}"><i class="fa-solid fa-pen"></i> تعديل</button></td>
        </tr>`;
    }).join('');
}

async function handleProductCellChange(e) {
    const input = e.target.closest('[data-field]');
    if (!input) return;
    const row = input.closest('tr');
    const id = Number(row.dataset.id);
    const field = input.dataset.field;
    const product = state.products.find(p => p.id === id);

    try {
        if (field === 'cost_price') {
            await saveCost(id, numOrNull(input.value));
        } else if (field === 'is_featured' || field === 'is_visible') {
            await updateProduct(id, { [field]: input.checked });
            row.classList.toggle('is-hidden', !product.is_visible);
        } else if (field === 'stock_quantity') {
            const qty = Math.max(0, parseInt(input.value, 10) || 0);
            await updateProduct(id, { stock_quantity: qty });
            input.value = qty;
            input.classList.toggle('stock-out', qty <= 0);
        } else {
            const value = numOrNull(input.value);
            if (field === 'base_price' && !(value > 0)) {
                input.value = product.base_price ?? '';
                return toast('سعر البيع لا يمكن أن يكون فارغاً أو صفراً', true);
            }
            await updateProduct(id, { [field]: field === 'discount_price' && !(value > 0) ? null : value });
        }
        row.querySelector('[data-profit]').innerHTML = profitHtml(product);
        input.classList.add('saved');
        setTimeout(() => input.classList.remove('saved'), 1200);
        renderDashboard();
        toast('تم الحفظ');
    } catch (err) {
        fail(err, 'تعذر الحفظ');
    }
}

function openProductDialog(id) {
    const form = $('#productForm');
    form.reset();
    state.editingId = id;
    const p = id ? state.products.find(x => x.id === id) : null;
    $('#productDialogTitle').textContent = p ? `تعديل المنتج (#${p.id})` : 'منتج جديد';
    $('#deleteProductBtn').hidden = !p;

    const values = p || { category_id: 3, stock_quantity: 1, sort_order: 0, is_visible: true, is_featured: false };
    for (const el of form.elements) {
        if (!el.name) continue;
        if (el.type === 'checkbox') el.checked = Boolean(values[el.name]);
        else if (el.name === 'cost_price') el.value = p && state.costs[p.id] ? state.costs[p.id] : '';
        else el.value = values[el.name] ?? '';
    }
    state.editingImages = p && Array.isArray(p.images) ? [...p.images] : [];
    renderImages();
    $('#productDialog').showModal();
}

function renderImages() {
    const list = state.editingImages;
    $('#imagesList').innerHTML = list.length ? list.map((url, i) => `
        <div class="image-tile">
            ${i === 0 ? '<span class="main-tag">رئيسية</span>' : ''}
            <img src="${esc(url)}" alt="" onerror="this.style.opacity=0.3">
            <div class="tile-actions">
                <button type="button" class="icon-btn" data-img-move="${i}" data-dir="-1" title="تقديم" ${i === 0 ? 'disabled' : ''}><i class="fa-solid fa-arrow-right"></i></button>
                <button type="button" class="icon-btn" data-img-remove="${i}" title="إزالة"><i class="fa-solid fa-trash"></i></button>
                <button type="button" class="icon-btn" data-img-move="${i}" data-dir="1" title="تأخير" ${i === list.length - 1 ? 'disabled' : ''}><i class="fa-solid fa-arrow-left"></i></button>
            </div>
        </div>`).join('') : '<div class="meta">لا توجد صور — سيظهر الشعار في المتجر.</div>';
}

function handleImageTileClick(e) {
    const remove = e.target.closest('[data-img-remove]');
    const move = e.target.closest('[data-img-move]');
    if (remove) {
        state.editingImages.splice(Number(remove.dataset.imgRemove), 1);
    } else if (move) {
        const i = Number(move.dataset.imgMove);
        const j = i + Number(move.dataset.dir);
        const imgs = state.editingImages;
        [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    } else {
        return;
    }
    renderImages();
}

function addImageFromInput() {
    const input = $('#imageUrlInput');
    const url = driveToDirect(input.value.trim());
    if (!/^https?:\/\//.test(url)) return toast('أدخل رابط صورة صحيح', true);
    if (!state.editingImages.includes(url)) state.editingImages.push(url);
    input.value = '';
    renderImages();
}

async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        toast(`جاري الرفع: ${file.name}`);
        const { error } = await sb.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (error) { fail(error, 'تعذر رفع الصورة'); continue; }
        const { data } = sb.storage.from(IMAGE_BUCKET).getPublicUrl(path);
        state.editingImages.push(data.publicUrl);
        renderImages();
    }
    if (files.length) toast('تم رفع الصورة');
}

async function handleProductSave(e) {
    e.preventDefault();
    const form = e.target;
    const f = Object.fromEntries(new FormData(form).entries());
    const basePrice = numOrNull(f.base_price);
    if (!(basePrice > 0)) return toast('أدخل سعر البيع', true);
    const discount = numOrNull(f.discount_price);

    const fields = {
        title_ar: f.title_ar.trim(),
        brand: (f.brand || '').trim(),
        sku: (f.sku || '').trim(),
        category_id: Number(f.category_id),
        stock_quantity: Math.max(0, parseInt(f.stock_quantity, 10) || 0),
        base_price: basePrice,
        discount_price: discount > 0 ? discount : null,
        sort_order: parseInt(f.sort_order, 10) || 0,
        description_ar: (f.description_ar || '').trim(),
        youtube_url: (f.youtube_url || '').trim(),
        is_visible: form.elements.is_visible.checked,
        is_featured: form.elements.is_featured.checked,
        images: state.editingImages
    };
    const cost = numOrNull(f.cost_price);

    const btn = $('#saveProductBtn');
    btn.disabled = true;
    try {
        let id = state.editingId;
        if (id) {
            await updateProduct(id, fields);
        } else {
            const { data, error } = await sb.from('products').insert(fields).select().single();
            if (error) throw error;
            id = data.id;
            state.products.push(data);
        }
        if (cost !== null || state.costs[id]) await saveCost(id, cost);
        $('#productDialog').close();
        renderProducts();
        renderDashboard();
        toast('تم حفظ المنتج');
    } catch (err) {
        fail(err, 'تعذر حفظ المنتج');
    } finally {
        btn.disabled = false;
    }
}

async function handleProductDelete() {
    const id = state.editingId;
    const p = state.products.find(x => x.id === id);
    if (!p || !confirm(`هل تريد حذف "${p.title_ar}" نهائياً؟\n\nإذا أردت إخفاءه من المتجر فقط، ألغِ تفعيل "ظاهر في المتجر" بدلاً من الحذف.`)) return;
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) return fail(error, 'تعذر الحذف');
    state.products = state.products.filter(x => x.id !== id);
    delete state.costs[id];
    $('#productDialog').close();
    renderProducts();
    renderDashboard();
    toast('تم حذف المنتج');
}

// ---------- orders ----------

function filteredOrders() {
    const q = $('#orderSearch').value.trim().toLowerCase();
    const status = $('#orderStatusFilter').value;
    return state.orders.filter(o => {
        if (status !== 'all' && o.status !== status) return false;
        if (q) {
            const hay = `${o.id} ${o.customer_name} ${o.customer_phone} ${o.delivery_address}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

function orderItemHtml(item) {
    const product = state.products.find(p => p.id === Number(item.product_id));
    const lineTotal = (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
    let warn = '';
    if (!product) {
        warn = '<div class="price-warn"><i class="fa-solid fa-triangle-exclamation"></i> المنتج لم يعد موجوداً</div>';
    } else if (Math.abs(sellingPrice(product) - Number(item.unit_price)) > 0.009) {
        warn = `<div class="price-warn"><i class="fa-solid fa-triangle-exclamation"></i> السعر الحالي ${money(sellingPrice(product))} — يختلف عن سعر الطلب</div>`;
    }
    return `
        <div class="order-item">
            <img src="${esc(item.main_image || (product && product.images && product.images[0]) || EHS_LOGO_FALLBACK)}" alt="" onerror="this.src='${EHS_LOGO_FALLBACK}'">
            <div class="grow">
                <div dir="auto"><b>${esc(item.product_name)}</b></div>
                <div class="meta">${product ? `#${product.id} · ${esc(product.sku)} · المخزون: ${product.stock_quantity}` : ''}</div>
                ${warn}
            </div>
            <div class="num">${esc(item.quantity)} × ${money(item.unit_price)}<br><b>${money(lineTotal)}</b></div>
        </div>`;
}

function renderOrders() {
    const list = filteredOrders();
    $('#ordersCount').textContent = `(${list.length})`;
    const openIds = new Set($$('.order[data-open="1"]').map(el => Number(el.dataset.id)));
    $('#ordersList').innerHTML = list.length ? list.map(o => {
        const items = Array.isArray(o.items) ? o.items : [];
        const itemCount = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
        const open = openIds.has(o.id);
        return `
        <div class="order status-${o.status}" data-id="${o.id}" data-open="${open ? 1 : 0}">
            <div class="order-head" data-toggle>
                <span class="order-id">#${o.id}</span>
                <span class="order-customer"><b dir="auto">${esc(o.customer_name)}</b><span class="meta">${esc(o.customer_phone)} · ${formatDate(o.created_at)}</span></span>
                <span class="meta">${itemCount} قطعة</span>
                <span class="pill pill-${o.status}">${ORDER_STATUSES[o.status]}</span>
                <span class="order-total num">${money(o.total_amount)}</span>
                <i class="fa-solid fa-chevron-${open ? 'up' : 'down'} meta"></i>
            </div>
            <div class="order-body" ${open ? '' : 'hidden'}>
                <div class="order-items">${items.map(orderItemHtml).join('') || '<div class="meta">لا توجد معلومات عن المنتجات</div>'}</div>
                <div class="order-side">
                    <div><div class="meta">العنوان</div><div dir="auto">${esc(o.delivery_address) || '—'}</div></div>
                    <div><div class="meta">الدفع</div><div>${esc(PAYMENT_LABELS[o.payment_method] || o.payment_method)}</div></div>
                    <div class="contact-row">
                        <a class="btn btn-sm" href="${whatsappLink(o.customer_phone)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> واتساب</a>
                        <a class="btn btn-sm" href="tel:${esc(o.customer_phone)}"><i class="fa-solid fa-phone"></i> اتصال</a>
                    </div>
                    <label>الحالة
                        <select data-order-status>
                            ${Object.entries(ORDER_STATUSES).map(([k, v]) => `<option value="${k}" ${k === o.status ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                    </label>
                    <label>ملاحظة (تظهر لك فقط)
                        <textarea rows="2" data-order-note dir="auto">${esc(o.admin_note)}</textarea>
                    </label>
                    <button class="btn btn-sm btn-danger-ghost" data-order-delete><i class="fa-solid fa-trash"></i> حذف الطلب</button>
                </div>
            </div>
        </div>`;
    }).join('') : `<div class="panel empty">${state.orders.length ? 'لا توجد طلبات مطابقة.' : 'لم تصل أي طلبات بعد.'}</div>`;
}

function expandOrder(id) {
    const el = $(`.order[data-id="${id}"]`);
    if (!el) return;
    el.dataset.open = '1';
    $('.order-body', el).hidden = false;
    el.scrollIntoView({ block: 'center' });
}

function handleOrderClick(e) {
    const orderEl = e.target.closest('.order');
    if (!orderEl) return;
    const id = Number(orderEl.dataset.id);
    if (e.target.closest('[data-toggle]')) {
        const open = orderEl.dataset.open !== '1';
        orderEl.dataset.open = open ? '1' : '0';
        $('.order-body', orderEl).hidden = !open;
        const icon = $('.order-head .fa-solid:last-child', orderEl);
        icon.className = `fa-solid fa-chevron-${open ? 'up' : 'down'} meta`;
    } else if (e.target.closest('[data-order-delete]')) {
        deleteOrder(id);
    }
}

async function handleOrderChange(e) {
    const orderEl = e.target.closest('.order');
    if (!orderEl) return;
    const id = Number(orderEl.dataset.id);
    const order = state.orders.find(o => o.id === id);

    if (e.target.matches('[data-order-status]')) {
        const status = e.target.value;
        const wasPending = order.status === 'new';
        const { error } = await sb.from('orders').update({ status }).eq('id', id);
        if (error) { e.target.value = order.status; return fail(error, 'تعذر تحديث الحالة'); }
        order.status = status;
        toast(`الطلب #${id}: ${ORDER_STATUSES[status]}`);
        if (wasPending && (status === 'confirmed' || status === 'shipped' || status === 'delivered')) {
            await offerStockDeduction(order);
        }
        renderOrders();
        expandOrder(id);
        renderDashboard();
        renderBadges();
    } else if (e.target.matches('[data-order-note]')) {
        const admin_note = e.target.value;
        const { error } = await sb.from('orders').update({ admin_note }).eq('id', id);
        if (error) return fail(error, 'تعذر حفظ الملاحظة');
        order.admin_note = admin_note;
        toast('تم حفظ الملاحظة');
    }
}

async function offerStockDeduction(order) {
    const lines = (order.items || [])
        .map(i => ({ item: i, product: state.products.find(p => p.id === Number(i.product_id)) }))
        .filter(x => x.product);
    if (!lines.length) return;
    const summary = lines.map(x => `• ${x.product.title_ar}: ${x.product.stock_quantity} → ${Math.max(0, x.product.stock_quantity - (Number(x.item.quantity) || 0))}`).join('\n');
    if (!confirm(`هل تريد خصم منتجات هذا الطلب من المخزون؟\n\n${summary}`)) return;
    try {
        for (const { item, product } of lines) {
            await updateProduct(product.id, { stock_quantity: Math.max(0, product.stock_quantity - (Number(item.quantity) || 0)) });
        }
        renderProducts();
        toast('تم تحديث المخزون');
    } catch (err) {
        fail(err, 'تعذر تحديث المخزون');
    }
}

async function deleteOrder(id) {
    if (!confirm(`هل تريد حذف الطلب رقم #${id} نهائياً؟`)) return;
    const { error } = await sb.from('orders').delete().eq('id', id);
    if (error) return fail(error, 'تعذر الحذف');
    state.orders = state.orders.filter(o => o.id !== id);
    renderOrders();
    renderDashboard();
    renderBadges();
    toast('تم حذف الطلب');
}

// ---------- product requests ----------

function renderRequests() {
    const list = state.requests;
    $('#requestsList').innerHTML = list.length ? list.map(r => `
        <div class="order ${r.is_done ? '' : 'status-new'}" data-id="${r.id}">
            <div class="order-head">
                <span class="order-customer">
                    <b dir="auto">${esc(r.requested_product)}</b>
                    <span class="meta" dir="auto">${esc(r.customer_name)} · ${esc(r.customer_phone)} · ${formatDate(r.created_at)}</span>
                    ${r.notes ? `<span class="meta" dir="auto">ملاحظات: ${esc(r.notes)}</span>` : ''}
                </span>
                <a class="btn btn-sm" href="${whatsappLink(r.customer_phone)}" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i></a>
                <button class="btn btn-sm" data-request-done>${r.is_done ? 'إعادة فتح' : '<i class="fa-solid fa-check"></i> تم'}</button>
                <button class="icon-btn" data-request-delete title="حذف"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('') : '<div class="panel empty">لا توجد طلبات خاصة بعد.</div>';
}

async function handleRequestClick(e) {
    const el = e.target.closest('.order');
    if (!el) return;
    const id = Number(el.dataset.id);
    const req = state.requests.find(r => r.id === id);
    if (e.target.closest('[data-request-done]')) {
        const { error } = await sb.from('product_requests').update({ is_done: !req.is_done }).eq('id', id);
        if (error) return fail(error, 'تعذر التحديث');
        req.is_done = !req.is_done;
    } else if (e.target.closest('[data-request-delete]')) {
        if (!confirm('هل تريد حذف هذا الطلب؟')) return;
        const { error } = await sb.from('product_requests').delete().eq('id', id);
        if (error) return fail(error, 'تعذر الحذف');
        state.requests = state.requests.filter(r => r.id !== id);
    } else {
        return;
    }
    renderRequests();
    renderBadges();
}

// ---------- visitor statistics ----------

const SOURCE_LABELS = {
    google: 'بحث Google',
    google_ads: 'إعلانات Google',
    facebook: 'فيسبوك',
    instagram: 'إنستغرام',
    whatsapp: 'واتساب',
    telegram: 'تيليغرام',
    tiktok: 'تيك توك',
    youtube: 'يوتيوب',
    twitter: 'X / تويتر',
    bing: 'بحث Bing',
    other_search: 'محركات بحث أخرى',
    other_site: 'مواقع أخرى',
    direct: 'مباشر أو واتساب'
};
const DEVICE_LABELS = { mobile: 'موبايل', tablet: 'تابلت', desktop: 'كمبيوتر' };
let analyticsDays = 7;
let lastDaily = [];
let chartResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(chartResizeTimer);
    chartResizeTimer = setTimeout(() => { if (lastDaily.length && !$('#tab-analytics').hidden) renderDailyChart(lastDaily); }, 200);
});

async function loadAnalytics() {
    $('#analyticsStats').innerHTML = '<div class="empty">جاري التحميل...</div>';
    const { data, error } = await sb.rpc('analytics_summary', { days: analyticsDays });
    if (error) return fail(error, 'تعذر تحميل الإحصائيات');
    renderAnalytics(data);
}

function hbarList(rows, labelOf, valueKey = 'views') {
    if (!rows.length) return '<div class="empty">لا توجد بيانات بعد.</div>';
    const max = Math.max(...rows.map(r => r[valueKey]), 1);
    return rows.map(r => `
        <div class="hbar-row" title="${esc(labelOf(r))}: ${r[valueKey]}">
            <span class="hbar-label">${esc(labelOf(r))}</span>
            <span class="hbar-track"><span class="hbar-fill" style="width:${(r[valueKey] / max * 100).toFixed(1)}%"></span></span>
            <span class="hbar-value">${r[valueKey]}</span>
        </div>`).join('');
}

function renderDailyChart(days) {
    const box = $('#analyticsDaily');
    if (!days.length) { box.innerHTML = ''; return; }
    const W = Math.max(320, Math.round(box.clientWidth || 760)), H = 220, padL = 34, padB = 26, padT = 10;
    const max = Math.max(...days.map(d => d.views), 1);
    const step = Math.ceil(max / 4) || 1;
    const top = step * 4;
    const plotW = W - padL, plotH = H - padB - padT;
    const slot = plotW / days.length;
    const barW = Math.max(2, Math.min(28, slot - 2));
    const y = v => padT + plotH - (v / top) * plotH;
    const labelEvery = Math.ceil(days.length / 10);

    let grid = '';
    for (let v = 0; v <= top; v += step) {
        grid += `<line class="grid-line" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"></line>
                 <text class="axis-label" x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    }
    const bars = days.map((d, i) => {
        const x = padL + i * slot + (slot - barW) / 2;
        const h = Math.max(0, y(0) - y(d.views));
        const r = Math.min(4, barW / 2, h);
        // bar anchored to the baseline with a rounded data end
        const path = h > 0
            ? `M${x},${y(0)} V${y(0) - h + r} Q${x},${y(0) - h} ${x + r},${y(0) - h} H${x + barW - r} Q${x + barW},${y(0) - h} ${x + barW},${y(0) - h + r} V${y(0)} Z`
            : '';
        const label = i % labelEvery === 0
            ? `<text class="axis-label" x="${x + barW / 2}" y="${H - 8}" text-anchor="middle">${d.day.slice(5).replace('-', '/')}</text>` : '';
        return `<g class="bar-group" data-i="${i}">
            ${path ? `<path class="bar" d="${path}"></path>` : ''}
            <rect class="bar-hit" x="${padL + i * slot}" y="${padT}" width="${slot}" height="${plotH}"></rect>
            ${label}
        </g>`;
    }).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="الزيارات اليومية">${grid}${bars}</svg>`;

    const tip = $('#chartTooltip');
    box.querySelectorAll('.bar-group').forEach(g => {
        const d = days[Number(g.dataset.i)];
        g.addEventListener('mousemove', e => {
            tip.innerHTML = `<b>${d.day}</b><br>${d.views} زيارة · ${d.visitors} زائر`;
            tip.hidden = false;
            tip.style.left = (e.clientX + 12) + 'px';
            tip.style.top = (e.clientY - 40) + 'px';
            g.querySelector('.bar')?.classList.add('is-hover');
        });
        g.addEventListener('mouseleave', () => {
            tip.hidden = true;
            g.querySelector('.bar')?.classList.remove('is-hover');
        });
    });
}

function renderAnalytics(d) {
    const conversion = d.visitors ? (d.orders / d.visitors * 100) : 0;
    const stats = [
        { label: 'الزوار', value: d.visitors, sub: 'أشخاص مختلفون (تقريباً)' },
        { label: 'الزيارات', value: d.views, sub: 'عدد مرات فتح الصفحات' },
        { label: 'مشاهدات المنتجات', value: d.product_views, sub: 'فتح صفحة منتج' },
        { label: 'أضيف إلى السلة', value: d.add_to_cart, sub: 'مرات الإضافة' },
        { label: 'الطلبات', value: d.orders, sub: d.visitors ? `${conversion.toFixed(1)}% من الزوار` : 'بدون الملغاة' }
    ];
    $('#analyticsStats').innerHTML = stats.map(s => `
        <div class="stat">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-sub">${esc(s.sub)}</div>
        </div>`).join('');

    lastDaily = d.daily || [];
    renderDailyChart(lastDaily);
    $('#analyticsSources').innerHTML = hbarList(d.sources || [], r => SOURCE_LABELS[r.source] || r.source);
    $('#analyticsDevices').innerHTML = hbarList(d.devices || [], r => DEVICE_LABELS[r.device] || r.device);
    $('#analyticsReferrers').innerHTML = hbarList(d.referrers || [], r => r.host);
    $('#analyticsCampaigns').innerHTML = (d.campaigns || []).length
        ? hbarList(d.campaigns, r => [r.source, r.campaign].filter(Boolean).join(' / '))
        : '<div class="empty">لم تصل زيارات من روابط الحملات بعد.</div>';

    const rows = (d.products || []).map(r => {
        const p = state.products.find(x => x.id === r.product_id);
        return `<tr>
            <td><div class="name" dir="auto">${esc(p ? p.title_ar : `#${r.product_id}`)}</div>${p ? '' : '<div class="meta">منتج محذوف</div>'}</td>
            <td class="num">${r.views}</td>
            <td class="num">${r.add_to_cart}</td>
        </tr>`;
    }).join('');
    $('#analyticsProducts tbody').innerHTML = rows || '<tr><td colspan="3" class="empty">لا توجد مشاهدات بعد.</td></tr>';

    const base = 'https://electrohomesy.com/';
    const links = [['فيسبوك', 'facebook'], ['إنستغرام', 'instagram'], ['واتساب', 'whatsapp'], ['تيليغرام', 'telegram']];
    $('#shareLinks').innerHTML = links.map(([label, src]) => `
        <div class="share-link-row">
            <b>${label}</b>
            <input type="text" readonly value="${base}?utm_source=${src}">
            <button type="button" class="btn btn-sm" data-copy>نسخ</button>
        </div>`).join('');
}

// ---------- settings ----------

async function handlePasswordChange(e) {
    e.preventDefault();
    const input = $('#newPassword');
    const { error } = await sb.auth.updateUser({ password: input.value });
    if (error) return fail(error, 'تعذر تغيير كلمة المرور');
    input.value = '';
    toast('تم تغيير كلمة المرور');
}

async function importFromProductsJson() {
    const btn = $('#importBtn');
    btn.disabled = true;
    try {
        const res = await fetch('/js/products.json?t=' + Date.now());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const legacy = await res.json();
        const existing = new Set(state.products.map(p => p.id));
        const rows = legacy.filter(p => !existing.has(p.id)).map(p => ({
            id: p.id,
            category_id: p.category_id || 3,
            title_ar: p.title_ar,
            brand: p.brand || '',
            sku: p.sku || '',
            description_ar: p.description_ar || '',
            base_price: p.base_price,
            discount_price: Number(p.discount_price) > 0 ? p.discount_price : null,
            stock_quantity: Number(p.stock_quantity) || 0,
            images: (p.images || []).filter(u => u && !u.startsWith('/Logo')),
            youtube_url: p.youtube_url || '',
            is_featured: Boolean(p.is_featured),
            is_visible: p.is_visible !== 0
        }));
        if (!rows.length) {
            toast('لا توجد منتجات جديدة للاستيراد — جميعها موجودة');
            return;
        }
        if (!confirm(`سيتم استيراد ${rows.length} منتج. هل تريد المتابعة؟`)) return;
        const { error } = await sb.from('products').insert(rows);
        if (error) throw error;
        const { error: seqError } = await sb.rpc('sync_products_id_seq');
        if (seqError) throw seqError;
        await loadProducts();
        toast(`تم استيراد ${rows.length} منتج`);
    } catch (err) {
        fail(err, 'فشل الاستيراد');
    } finally {
        btn.disabled = false;
    }
}

function exportProducts() {
    const header = ['id', 'title_ar', 'brand', 'sku', 'category', 'base_price', 'discount_price', 'cost_price', 'stock_quantity', 'is_visible', 'is_featured', 'images', 'youtube_url', 'description_ar'];
    const rows = state.products.map(p => [
        p.id, p.title_ar, p.brand, p.sku, categoryName(p.category_id), p.base_price, p.discount_price ?? '',
        state.costs[p.id] ?? '', p.stock_quantity, p.is_visible ? 1 : 0, p.is_featured ? 1 : 0,
        (p.images || []).join(' | '), p.youtube_url, p.description_ar
    ]);
    downloadCsv(`products-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
}

function exportOrders() {
    const header = ['id', 'date', 'status', 'customer_name', 'customer_phone', 'delivery_address', 'payment_method', 'total_amount', 'items', 'admin_note'];
    const rows = state.orders.map(o => [
        o.id, formatDate(o.created_at), ORDER_STATUSES[o.status], o.customer_name, o.customer_phone, o.delivery_address,
        o.payment_method, o.total_amount,
        (o.items || []).map(i => `${i.product_name} x${i.quantity} @${i.unit_price}`).join(' | '), o.admin_note
    ]);
    downloadCsv(`orders-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
}

init();
