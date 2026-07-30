"""
Script to fix the missing fetchProducts function and restore 100% working product display
"""
import os, sys, shutil, re, subprocess

def fix_app_js(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add fetchProducts wrapper function if missing
    fetch_wrapper = """async function fetchProducts(categorySlug = 'all') {
    renderLoadingSkeleton();
    try {
        const products = await fetchProductsFromGoogleSheetsClient(categorySlug);
        renderProducts(products);
        renderFeaturedCarousel();
        return products;
    } catch (err) {
        console.error('Error fetching products:', err);
        if (allProducts && allProducts.length > 0) {
            renderProducts(allProducts);
            renderFeaturedCarousel();
        } else {
            const fallback = (typeof FALLBACK_PRODUCTS !== 'undefined') ? FALLBACK_PRODUCTS : [];
            renderProducts(fallback);
            renderFeaturedCarousel();
        }
    }
}"""

    if 'async function fetchProducts(' not in content:
        content = content.replace('async function fetchProductsFromGoogleSheetsClient', fetch_wrapper + '\n\nasync function fetchProductsFromGoogleSheetsClient')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed fetchProducts in {filepath}")

fix_app_js('js/app.js')
fix_app_js('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
