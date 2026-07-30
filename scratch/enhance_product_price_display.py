"""
Script to synchronize product.html and public/product.html
and enhance the price container to explicitly label:
- Current Selling Price (سعر البيع الآن: $29.99)
- Original Price (السعر السابق: $40)
- Savings Badge (🔥 وفر $10.01)
"""
import os, sys, shutil, re, subprocess

# 1. First copy product.html to public/product.html
shutil.copy('product.html', 'public/product.html')
print("Copied product.html -> public/product.html")

# 2. Update price rendering in product.html and public/product.html
price_container_old = """                        <div class="product-price-container">
                            <span class="price-hero-current" id="detailFinalPrice">${formatSYP(finalPrice)}</span>
                            ${hasDiscount ? `
                                <span class="price-hero-old" style="margin-right: 10px;">${formatSYP(p.base_price)}</span>
                                <span class="discount-tag-badge">🔥 وفر ${formatSYP(p.base_price - p.discount_price)}</span>
                            ` : ''}
                        </div>"""

price_container_new = """                        <div class="product-price-container" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin: 15px 0 22px 0;">
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <span style="font-size:0.82rem; color:var(--steel-grey); font-weight:700;">سعر البيع الآن:</span>
                                <span class="price-hero-current" id="detailFinalPrice" style="font-size:2.4rem; font-weight:900; color:var(--damascus-green);">${formatSYP(finalPrice)}</span>
                            </div>

                            ${hasDiscount ? `
                                <div style="display:flex; flex-direction:column; gap:2px; margin-right:10px;">
                                    <span style="font-size:0.82rem; color:#94a3b8; font-weight:700;">السعر الأصلي:</span>
                                    <span class="price-hero-old" style="font-size:1.3rem; color:#94a3b8; text-decoration:line-through; font-weight:600;">${formatSYP(p.base_price)}</span>
                                </div>
                                <span class="discount-tag-badge" style="background:rgba(239,68,68,0.1); color:#ef4444; padding:8px 14px; border-radius:12px; font-weight:800; font-size:0.95rem; align-self:flex-end;">🔥 وفر ${formatSYP(p.base_price - p.discount_price)}</span>
                            ` : ''}
                        </div>"""

for htmlfile in ['product.html', 'public/product.html']:
    with open(htmlfile, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace(price_container_old, price_container_new)

    # Update app.js cache busting to v=11.0.0
    content = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=11.0.0', content)

    with open(htmlfile, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {htmlfile}")

# Update index.html and public/index.html cache busting version to v=11.0.0
for indexfile in ['index.html', 'public/index.html']:
    if os.path.exists(indexfile):
        with open(indexfile, 'r', encoding='utf-8') as f:
            content = f.read()
        content = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=11.0.0', content)
        with open(indexfile, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {indexfile}")

# Copy index.html -> public/index.html to keep 100% in sync
shutil.copy('index.html', 'public/index.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')
print("Synced files to public/")
