"""
Script to sync files to public/ and update cache busting version to v=15.0.0
"""
import os, sys, shutil, re

for htmlfile in ['index.html', 'public/index.html', 'product.html', 'public/product.html']:
    if os.path.exists(htmlfile):
        with open(htmlfile, 'r', encoding='utf-8') as f:
            c = f.read()
        c = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=15.0.0', c)
        with open(htmlfile, 'w', encoding='utf-8') as f:
            f.write(c)

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

print("Synced all core files to public/ with v=15.0.0")
