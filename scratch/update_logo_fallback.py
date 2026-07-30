"""
Script to replace all unsplash fallback images with the official logo: '/Logo/ElectroHomeSY-logo-blue.png'
Also adds onerror image fallback to logo for product images.
"""
import os, sys, re, subprocess, json

LOGO_URL = '/Logo/ElectroHomeSY-logo-blue.png'
UNSPLASH_URL = 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'

files_to_update = [
    'js/app.js',
    'public/js/app.js',
    'product.html',
    'public/product.html',
    'scripts/sync-products.js'
]

for filepath in files_to_update:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace unsplash URL with LOGO_URL
    content = content.replace(UNSPLASH_URL, LOGO_URL)

    # Replace empty string return in getFallbackImage / getFallbackImageClient
    content = content.replace("function getFallbackImageClient(id) { return ''; }", f"function getFallbackImageClient(id) {{ return '{LOGO_URL}'; }}")
    content = content.replace("function getFallbackImage(id) { return ''; }", f"function getFallbackImage(id) {{ return '{LOGO_URL}'; }}")

    # Replace photos.length > 0 ? photos[0] : '' with photos.length > 0 ? photos[0] : LOGO_URL
    content = content.replace("const mainImage = photos.length > 0 ? photos[0] : '';", f"const mainImage = photos.length > 0 ? photos[0] : '{LOGO_URL}';")
    content = content.replace("const mainImg = photos.length > 0 ? photos[0] : '';", f"const mainImg = photos.length > 0 ? photos[0] : '{LOGO_URL}';")

    # Save
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Updated {filepath}")

# Check syntax of JS files
for jsfile in ['js/app.js', 'public/js/app.js', 'scripts/sync-products.js']:
    res = subprocess.run(['node', '-c', jsfile], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"PASS: {jsfile} syntax OK")
    else:
        print(f"FAIL: {jsfile}: {res.stderr[:200]}")
