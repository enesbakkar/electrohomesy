"""
1) Remove all fallback/placeholder images from app.js:
   - PRODUCT_FALLBACK_IMAGES const -> keep but return ''
   - getFallbackImageClient -> return ''
   - mainImage fallback in fetchProductsFromGoogleSheetsClient -> ''
   - FALLBACK_PRODUCTS: clear all main_image and images that are not from Google Drive

2) Change € to $ in formatSYP

3) Same changes in public/js/app.js
"""
import sys, subprocess, re, json
sys.stdout.reconfigure(encoding='utf-8')

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # --- 1) Change € to $ in formatSYP ---
    content = content.replace("return formatted + ' €';", "return '$' + formatted;")
    content = content.replace("return Number(amount).toLocaleString('ar-SY') + ' ل.س';",
                              "const n=Number(amount); if(isNaN(n)) return ''; const fmt=n%1!==0?n.toFixed(2):n.toLocaleString('en-US'); return '$'+fmt;")
    print(f"{path}: Updated currency to $")

    # --- 2) Make getFallbackImageClient return '' ---
    content = re.sub(
        r'function getFallbackImageClient\([^)]*\)\s*\{[^}]*\}',
        "function getFallbackImageClient(id) { return ''; }",
        content
    )
    print(f"{path}: getFallbackImageClient -> returns ''")

    # --- 3) Remove Unsplash/kruidvat fallback in fetchProductsFromGoogleSheetsClient ---
    # Line: const mainImage = photos.length > 0 ? photos[0] : getFallbackImageClient(id);
    content = re.sub(
        r'const mainImage = photos\.length > 0 \? photos\[0\] : getFallbackImageClient\(id\);',
        "const mainImage = photos.length > 0 ? photos[0] : '';",
        content
    )
    # Line: const imagesList = photos.length > 0 ? photos : [mainImage];
    content = re.sub(
        r'const imagesList = photos\.length > 0 \? photos : \[mainImage\];',
        "const imagesList = photos.length > 0 ? photos : [];",
        content
    )
    print(f"{path}: Removed getFallbackImageClient from mainImage")

    # --- 4) Strip fake images from FALLBACK_PRODUCTS ---
    # Find FALLBACK_PRODUCTS JSON array and clean images
    fb_match = re.search(r'const FALLBACK_PRODUCTS = (\[.*?\]);', content, re.DOTALL)
    if fb_match:
        try:
            products = json.loads(fb_match.group(1))
            for p in products:
                # Only keep Google Drive images
                def is_gdrive(url):
                    return url and ('drive.google.com' in url or 'lh3.googleusercontent.com' in url)

                # Clear main_image if it's not from Google Drive
                if not is_gdrive(p.get('main_image', '')):
                    p['main_image'] = ''
                # Filter images list
                p['images'] = [img for img in p.get('images', []) if is_gdrive(img)]

            new_fb = 'const FALLBACK_PRODUCTS = ' + json.dumps(products, ensure_ascii=False, indent=4) + ';'
            content = content[:fb_match.start()] + new_fb + content[fb_match.end():]
            print(f"{path}: Cleared non-Google-Drive images from FALLBACK_PRODUCTS")
        except Exception as e:
            print(f"{path}: FALLBACK_PRODUCTS parse error: {e}")
    else:
        print(f"{path}: FALLBACK_PRODUCTS not found")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    res = subprocess.run(['node', '-c', path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"{path}: PASS syntax OK!\n")
    else:
        print(f"{path}: FAIL: {res.stderr[:300]}\n")

fix('js/app.js')
fix('public/js/app.js')

# --- Fix sync-products.js too ---
with open('scripts/sync-products.js', 'r', encoding='utf-8') as f:
    sc = f.read()

# getFallbackImage -> return ''
sc = re.sub(
    r'function getFallbackImage\([^)]*\)\s*\{[^}]*\}',
    "function getFallbackImage(id) { return ''; }",
    sc
)
# mainImage fallback
sc = sc.replace(
    "const mainImage = photos.length > 0 ? photos[0] : getFallbackImage(id);",
    "const mainImage = photos.length > 0 ? photos[0] : '';"
)
sc = sc.replace(
    "const imagesList = photos.length > 0 ? photos : [mainImage];",
    "const imagesList = photos.length > 0 ? photos : [];"
)

with open('scripts/sync-products.js', 'w', encoding='utf-8') as f:
    f.write(sc)

res = subprocess.run(['node', '-c', 'scripts/sync-products.js'], capture_output=True, text=True)
print(f"sync-products.js: {'PASS' if res.returncode == 0 else 'FAIL: ' + res.stderr[:200]}")
