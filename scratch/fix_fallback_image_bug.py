import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace getFallbackImageClient implementation
    old_fn = '''function getFallbackImageClient(categoryId) {
    const placeholders = {
        1: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', // irons
        2: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80', // vacuums
        3: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80', // kitchen
        4: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'  // large-appliances
    };
    return placeholders[categoryId] || placeholders[4];
}'''

    new_fn = '''function getFallbackImageClient(pId) {
    if (pId) {
        return `/asset/images/products/prod_${pId}.jpg`;
    }
    return 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80';
}'''

    if old_fn in content:
        content = content.replace(old_fn, new_fn)
        print(f"Replaced getFallbackImageClient in {filepath}")

    # 2. Replace mainImage fallback call inside fetchProductsFromGoogleSheetsClient
    old_main_img = "const mainImage = photos.length > 0 ? photos[0] : getFallbackImageClient(categoryId);"
    new_main_img = "const mainImage = photos.length > 0 ? photos[0] : getFallbackImageClient(id);"

    if old_main_img in content:
        content = content.replace(old_main_img, new_main_img)
        print(f"Replaced getFallbackImageClient call in {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('js/app.js')
fix_file('public/js/app.js')
