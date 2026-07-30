"""
Script to wipe out all unsplash/kruidvat fallback image URLs from sync-products.js, app.js, public/js/app.js, product.html, public/product.html
and replace them strictly with '/Logo/ElectroHomeSY-logo-blue.png'.
"""
import os, sys, re, subprocess

LOGO_URL = '/Logo/ElectroHomeSY-logo-blue.png'

# 1. Clean scripts/sync-products.js
with open('scripts/sync-products.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace PRODUCT_FALLBACK_IMAGES = { ... }; with const PRODUCT_FALLBACK_IMAGES = {};
code = re.sub(r'const PRODUCT_FALLBACK_IMAGES = \{.*?\};', 'const PRODUCT_FALLBACK_IMAGES = {};', code, flags=re.DOTALL)
code = re.sub(r'function getFallbackImage\([^)]*\)\s*\{[^}]*\}', f"function getFallbackImage(id) {{ return '{LOGO_URL}'; }}", code)
code = code.replace("const mainImage = photos.length > 0 ? photos[0] : '';", f"const mainImage = photos.length > 0 ? photos[0] : '{LOGO_URL}';")

with open('scripts/sync-products.js', 'w', encoding='utf-8') as f:
    f.write(code)
print("Cleaned scripts/sync-products.js")


# Helper function to clean app.js / public/js/app.js
def clean_app_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace any unsplash or kruidvat image URLs in content with LOGO_URL
    content = re.sub(r'https://images\.unsplash\.com/[^\s\'"]+', LOGO_URL, content)
    content = re.sub(r'https://media\.kruidvat\.nl/[^\s\'"]+', LOGO_URL, content)

    # Ensure getFallbackImageClient returns LOGO_URL
    content = re.sub(r'function getFallbackImageClient\([^)]*\)\s*\{[^}]*\}', f"function getFallbackImageClient(id) {{ return '{LOGO_URL}'; }}", content)

    # Ensure fallback image in templates uses LOGO_URL and includes onerror fallback
    content = content.replace("p.main_image || ''", f"p.main_image || '{LOGO_URL}'")
    content = content.replace("product.main_image || ''", f"product.main_image || '{LOGO_URL}'")
    content = content.replace("item.main_image || ''", f"item.main_image || '{LOGO_URL}'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned {filepath}")

clean_app_js('js/app.js')
clean_app_js('public/js/app.js')

# Clean product.html & public/product.html
def clean_html(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'https://images\.unsplash\.com/[^\s\'"]+', LOGO_URL, content)
    content = re.sub(r'https://media\.kruidvat\.nl/[^\s\'"]+', LOGO_URL, content)
    content = content.replace("p.main_image || ''", f"p.main_image || '{LOGO_URL}'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Cleaned {filepath}")

clean_html('product.html')
clean_html('public/product.html')

# Check syntax
for jsfile in ['js/app.js', 'public/js/app.js', 'scripts/sync-products.js']:
    res = subprocess.run(['node', '-c', jsfile], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"PASS: {jsfile} syntax OK")
    else:
        print(f"FAIL: {jsfile}: {res.stderr[:200]}")
