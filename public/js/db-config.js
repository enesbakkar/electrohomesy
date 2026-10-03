/* ElectroHomeSY - Veritabanı (Supabase) bağlantı ayarları ve ortak yardımcılar
 *
 * Kurulum: Supabase panelinde Project Settings > API sayfasındaki
 *   - Project URL      -> SUPABASE_URL
 *   - anon public key  -> SUPABASE_ANON_KEY
 * değerlerini aşağıya yapıştırın. (anon key gizli değildir, sitede görünmesi normaldir;
 * güvenliği supabase/schema.sql içindeki RLS kuralları sağlar.)
 *
 * Bu alanlar boş kaldığı sürece site eskisi gibi js/products.json dosyasından çalışır.
 */
window.EHS_CONFIG = {
    SUPABASE_URL: 'https://ynloqxqzmvypgnjqdgri.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubG9xeHF6bXZ5cGduanFkZ3JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NzE4NDQsImV4cCI6MjEwNjU0Nzg0NH0.S8ny7RoEQepvZjxWwTS2XGEtM00NWV4fRwstzpjVy1s',

    // Sipariş geldiğinde e-posta bildirimi gönderen mevcut Google Apps Script.
    // Bildirim istemiyorsanız '' yapın.
    ORDER_EMAIL_WEBHOOK: 'https://script.google.com/macros/s/AKfycbwrM6-bAv-hYJ494X0bSvWoIRp-6vjJ4An226PMUI0k7X21zYZ_iS6xBeePAxdhRecA/exec'
};

const EHS_PUBLIC_PRODUCT_COLUMNS = 'id,category_id,title_ar,brand,sku,description_ar,base_price,discount_price,stock_quantity,images,youtube_url,is_featured,is_visible,sort_order';
const EHS_LOGO_FALLBACK = '/Logo/ElectroHomeSY-logo-blue.png';

function ehsDbConfigured() {
    const c = window.EHS_CONFIG || {};
    return Boolean(c.SUPABASE_URL && c.SUPABASE_ANON_KEY);
}

function ehsDbHeaders(extra) {
    const key = window.EHS_CONFIG.SUPABASE_ANON_KEY;
    return Object.assign({ apikey: key, Authorization: `Bearer ${key}` }, extra || {});
}

// Converts a products table row to the shape the storefront already uses.
function ehsMapDbProduct(row) {
    const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
    const sku = row.sku || `PROD-${row.id}`;
    const brand = row.brand || 'ElectroHome';
    const stock = Number(row.stock_quantity) || 0;
    return {
        id: row.id,
        category_id: row.category_id,
        title_ar: row.title_ar,
        slug: `prod-${sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${row.id}`,
        description_ar: row.description_ar || `جهاز ${row.title_ar} عالي الكفاءة من ماركة ${brand}. الموديل: ${sku}.`,
        base_price: row.base_price !== null ? Number(row.base_price) : null,
        discount_price: row.discount_price !== null && Number(row.discount_price) > 0 ? Number(row.discount_price) : null,
        main_image: images[0] || EHS_LOGO_FALLBACK,
        images,
        youtube_url: row.youtube_url || '',
        is_featured: row.is_featured ? 1 : 0,
        is_visible: row.is_visible ? 1 : 0,
        stock_quantity: stock,
        sku,
        brand,
        variants: [{
            id: row.id * 100,
            product_id: row.id,
            brand,
            model_name: sku,
            variant_attributes: { 'الماركة': brand, 'الموديل': sku },
            price_modifier: 0,
            stock_quantity: stock,
            sku
        }]
    };
}

async function ehsFetchProductsFromDb() {
    const { SUPABASE_URL } = window.EHS_CONFIG;
    const url = `${SUPABASE_URL}/rest/v1/products?select=${EHS_PUBLIC_PRODUCT_COLUMNS}&is_visible=eq.true&order=sort_order.asc,id.asc`;
    const res = await fetch(url, { headers: ehsDbHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`Products request failed: HTTP ${res.status}`);
    const rows = await res.json();
    return rows.map(ehsMapDbProduct);
}

async function ehsFetchProductFromDb(id) {
    const { SUPABASE_URL } = window.EHS_CONFIG;
    const url = `${SUPABASE_URL}/rest/v1/products?select=${EHS_PUBLIC_PRODUCT_COLUMNS}&id=eq.${Number(id)}&is_visible=eq.true`;
    const res = await fetch(url, { headers: ehsDbHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(`Product request failed: HTTP ${res.status}`);
    const rows = await res.json();
    return rows.length ? ehsMapDbProduct(rows[0]) : null;
}

async function ehsInsertRow(table, row) {
    const { SUPABASE_URL } = window.EHS_CONFIG;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: ehsDbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
        body: JSON.stringify(row)
    });
    if (!res.ok) throw new Error(`Insert into ${table} failed: HTTP ${res.status} ${await res.text()}`);
}

function ehsSubmitOrderToDb(order) {
    return ehsInsertRow('orders', {
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        delivery_address: order.delivery_address || '',
        payment_method: order.payment_method || 'cash',
        total_amount: Number(order.total_amount) || 0,
        items: (order.items || []).map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            variant_details: item.variant_details || '',
            unit_price: Number(item.unit_price) || 0,
            quantity: Number(item.quantity) || 1,
            main_image: item.main_image || ''
        }))
    });
}

function ehsSubmitRequestToDb(req) {
    return ehsInsertRow('product_requests', {
        customer_name: req.customer_name,
        customer_phone: req.customer_phone,
        requested_product: req.requested_product,
        notes: req.notes || ''
    });
}

// ---------- Visitor statistics (admin panel → الزيارات) ----------
// Stores only: page, product, traffic source, device type and a random visitor id kept in this browser.

function ehsSafeStorage(kind) {
    try { return window[kind]; } catch (e) { return null; }
}

function ehsClassifySource() {
    const params = new URLSearchParams(window.location.search);
    const utm = (params.get('utm_source') || '').toLowerCase();
    const ua = navigator.userAgent || '';
    let refHost = '';
    try { refHost = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (e) {}
    if (refHost === window.location.hostname.replace(/^www\./, '')) refHost = '';

    const byName = name => {
        if (/^(fb|facebook|meta)/.test(name)) return 'facebook';
        if (/^(ig|insta)/.test(name)) return 'instagram';
        if (/^(wa|whatsapp)/.test(name)) return 'whatsapp';
        if (/^(tg|telegram)/.test(name)) return 'telegram';
        if (/google/.test(name)) return 'google';
        if (/tiktok/.test(name)) return 'tiktok';
        return '';
    };

    let source = '';
    if (utm) source = byName(utm) || utm.slice(0, 40);
    else if (params.has('fbclid') || /FBAN|FBAV|FB_IAB/.test(ua)) source = 'facebook';
    else if (/Instagram/.test(ua)) source = 'instagram';
    else if (params.has('gclid')) source = 'google_ads';
    else if (refHost) {
        if (/(^|\.)google\./.test(refHost)) source = 'google';
        else if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(refHost)) source = 'facebook';
        else if (/(^|\.)instagram\.com$/.test(refHost)) source = 'instagram';
        else if (/(^|\.)(whatsapp\.com|wa\.me)$/.test(refHost)) source = 'whatsapp';
        else if (/(^|\.)(t\.me|telegram\.org)$/.test(refHost)) source = 'telegram';
        else if (/(^|\.)bing\.com$/.test(refHost)) source = 'bing';
        else if (/(^|\.)(yandex\.\w+|duckduckgo\.com|yahoo\.com)$/.test(refHost)) source = 'other_search';
        else if (/(^|\.)(youtube\.com|youtu\.be)$/.test(refHost)) source = 'youtube';
        else if (/(^|\.)tiktok\.com$/.test(refHost)) source = 'tiktok';
        else if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(refHost)) source = 'twitter';
        else source = 'other_site';
    } else source = 'direct';

    return {
        source,
        referrer_host: refHost.slice(0, 120),
        utm_source: utm.slice(0, 80),
        utm_campaign: (params.get('utm_campaign') || '').slice(0, 120)
    };
}

function ehsTrackingDisabled() {
    const ua = navigator.userAgent || '';
    if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit/i.test(ua)) return true;
    const local = ehsSafeStorage('localStorage');
    try { if (local && local.getItem('ehs_is_admin') === '1') return true; } catch (e) {}
    return !ehsDbConfigured();
}

// The first page of a visit decides where the visit came from; later pages reuse it.
function ehsSessionSource() {
    const session = ehsSafeStorage('sessionStorage');
    try {
        const saved = session && session.getItem('ehs_source');
        if (saved) return JSON.parse(saved);
    } catch (e) {}
    const info = ehsClassifySource();
    try { if (session) session.setItem('ehs_source', JSON.stringify(info)); } catch (e) {}
    return info;
}

function ehsVisitorId() {
    const local = ehsSafeStorage('localStorage');
    try {
        let id = local && local.getItem('ehs_vid');
        if (!id) {
            id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2));
            if (local) local.setItem('ehs_vid', id);
        }
        return id.slice(0, 64);
    } catch (e) {
        return '';
    }
}

function ehsTrack(eventType, details) {
    try {
        if (ehsTrackingDisabled()) return;
        const ua = navigator.userAgent || '';
        const device = /iPad|Tablet/i.test(ua) ? 'tablet' : (/Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop');
        const row = Object.assign({
            event_type: eventType,
            page_type: 'other',
            path: (window.location.pathname + window.location.search).slice(0, 300),
            product_id: null,
            device,
            visitor_id: ehsVisitorId()
        }, ehsSessionSource(), details || {});
        const { SUPABASE_URL } = window.EHS_CONFIG;
        fetch(`${SUPABASE_URL}/rest/v1/page_events`, {
            method: 'POST',
            keepalive: true,
            headers: ehsDbHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
            body: JSON.stringify(row)
        }).catch(() => {});
    } catch (e) {
        // statistics must never break the shop
    }
}

function ehsTrackPageView() {
    const path = window.location.pathname;
    const productMatch = path.match(/^\/p\/(\d+)/);
    const queryId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
    if (productMatch || (/product\.html$/.test(path) && queryId)) {
        ehsTrack('view', { page_type: 'product', product_id: productMatch ? Number(productMatch[1]) : queryId });
    } else if (/^\/c\//.test(path)) {
        ehsTrack('view', { page_type: 'category' });
    } else if (path === '/' || path === '/index.html') {
        ehsTrack('view', { page_type: 'home' });
    } else {
        ehsTrack('view', { page_type: 'other' });
    }
}
