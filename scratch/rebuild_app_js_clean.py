import json
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

# 1. Find where FALLBACK_PRODUCTS starts (line 41, index 40)
fb_start = None
for i, line in enumerate(lines):
    if line.strip() == 'const FALLBACK_PRODUCTS = [':
        fb_start = i
        break

# 2. Find where PRODUCT_FALLBACK_IMAGES starts
pfb_start = None
for i, line in enumerate(lines):
    if 'const PRODUCT_FALLBACK_IMAGES = {' in line:
        pfb_start = i
        break

print(f'FALLBACK_PRODUCTS starts at line {fb_start + 1}')
print(f'PRODUCT_FALLBACK_IMAGES starts at line {pfb_start + 1}')

# 3. Load products.json to embed minimal FALLBACK_PRODUCTS
with open('js/products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Replace the entire block from FALLBACK_PRODUCTS to PRODUCT_FALLBACK_IMAGES
# with just the categories and a minimal fallback
new_fallback_block = """const FALLBACK_CATEGORIES = [
    {"id": 1, "name_ar": "المكاوي وأجهزة البخار", "slug": "irons", "icon": "fa-shirt"},
    {"id": 2, "name_ar": "المكانس والتنظيف", "slug": "vacuums", "icon": "fa-broom"},
    {"id": 3, "name_ar": "أجهزة المطبخ والطهي", "slug": "kitchen", "icon": "fa-blender"},
    {"id": 4, "name_ar": "العناية الشخصية والحلاقة", "slug": "personal-care", "icon": "fa-scissors"},
    {"id": 5, "name_ar": "الإضاءة والمنزل والأجهزة الطبية", "slug": "home-living", "icon": "fa-lightbulb"}
];

const FALLBACK_PRODUCTS = """ + json.dumps(products, ensure_ascii=False, indent=4) + ";"

# Replace the block from FALLBACK_CATEGORIES (line 8, index 7) to PRODUCT_FALLBACK_IMAGES
cat_start = None
for i, line in enumerate(lines):
    if line.strip() == 'const FALLBACK_CATEGORIES = [':
        cat_start = i
        break

if cat_start is not None and pfb_start is not None:
    before = '\n'.join(lines[:cat_start])
    after = '\n'.join(lines[pfb_start:])
    new_content = before + '\n' + new_fallback_block + '\n\n' + after
    
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    with open('public/js/app.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Written js/app.js and public/js/app.js with clean FALLBACK_PRODUCTS')
    
    # Verify syntax
    for path in ['js/app.js', 'public/js/app.js']:
        res = subprocess.run(['node', '-c', path], capture_output=True, text=True)
        if res.returncode == 0:
            print(f'PASS: {path} has 0 syntax errors!')
        else:
            print(f'FAIL: {path}: {res.stderr}')
else:
    print(f'ERROR: could not find markers. cat_start={cat_start}, pfb_start={pfb_start}')
