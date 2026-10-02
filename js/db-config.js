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
