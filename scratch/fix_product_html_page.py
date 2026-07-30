import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def patch_product_html(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update app.js script tag version
    content = content.replace('/js/app.js?v=3.2.0', '/js/app.js?v=5.0.0')
    content = content.replace('/js/app.js?v=4.0.0', '/js/app.js?v=5.0.0')

    # 2. Fix initDetailPage logic
    old_init = '''            try {
                const res = await fetch(`/api/products/${id}`);
                if (!res.ok) throw new Error();
                detailProduct = await res.json();
            } catch (e) {
                try {
                    detailProduct = await fetchProductDetailsFromGoogleSheetsClient(id);
                } catch (sheetErr) {
                    console.error('Client Google Sheets details fallback failed:', sheetErr);
                    detailProduct = FALLBACK_PRODUCTS.find(p => p.id === id) || null;
                }
            }'''

    new_init = '''            try {
                const res = await fetch('/js/products.json');
                if (res.ok) {
                    const list = await res.json();
                    detailProduct = list.find(p => p.id === id);
                }
            } catch (e) {}

            if (!detailProduct && typeof FALLBACK_PRODUCTS !== 'undefined') {
                detailProduct = FALLBACK_PRODUCTS.find(p => p.id === id) || null;
            }'''

    if old_init in content:
        content = content.replace(old_init, new_init)
        print(f"Patched initDetailPage in {filepath}")
    else:
        print(f"old_init block not found in {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath} to v=5.0.0")

patch_product_html('product.html')
patch_product_html('public/product.html')
