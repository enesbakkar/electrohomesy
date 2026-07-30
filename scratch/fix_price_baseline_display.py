"""
Script to fix product page price container layout so $29.99 selling price is 100% visible on the same baseline as its label, matching card display.
"""
import os, sys, shutil, re, subprocess

# 1. Update price container in product.html
with open('product.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_price_block = re.search(r'<div class="product-price-container".*?</div>\s*</div>', content, re.DOTALL)
if old_price_block:
    print("Found old price block in product.html")

new_price_block = """<div class="product-price-container" style="display: flex; align-items: baseline; gap: 14px; margin: 18px 0 24px 0; flex-wrap: wrap;">
                            <div style="display: flex; align-items: baseline; gap: 8px;">
                                <span style="font-size: 0.95rem; color: #475569; font-weight: 700;">سعر البيع الآن:</span>
                                <span class="price-hero-current" id="detailFinalPrice" style="font-size: 2.5rem; font-weight: 900; color: #073066; display: inline-block;">
                                    ${formatSYP(finalPrice)}
                                </span>
                            </div>

                            ${hasDiscount ? `
                                <div style="display: flex; align-items: baseline; gap: 6px; margin-right: 8px;">
                                    <span style="font-size: 0.88rem; color: #94a3b8; font-weight: 600;">السعر الأصلي:</span>
                                    <span class="price-hero-old" style="font-size: 1.3rem; color: #94a3b8; text-decoration: line-through; font-weight: 600;">
                                        ${formatSYP(p.base_price)}
                                    </span>
                                </div>
                                <span class="discount-tag-badge" style="background: #fee2e2; color: #ef4444; padding: 6px 14px; border-radius: 12px; font-weight: 800; font-size: 0.95rem;">
                                    🔥 وفر ${formatSYP(p.base_price - p.discount_price)}
                                </span>
                            ` : ''}
                        </div>"""

content = re.sub(r'<div class="product-price-container".*?</div>\s*</div>', new_price_block, content, flags=re.DOTALL)
content = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=12.0.0', content)

with open('product.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated product.html")

# 2. Copy product.html to public/product.html
shutil.copy('product.html', 'public/product.html')
print("Copied product.html -> public/product.html")

# 3. Update index.html and public/index.html cache-busting to v=12.0.0
for htmlfile in ['index.html', 'public/index.html']:
    if os.path.exists(htmlfile):
        with open(htmlfile, 'r', encoding='utf-8') as f:
            c = f.read()
        c = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=12.0.0', c)
        with open(htmlfile, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Updated {htmlfile}")

# 4. Sync public JS/JSON files
shutil.copy('index.html', 'public/index.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')
print("Synced all public/ files")

# Verify syntax of app.js
res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
