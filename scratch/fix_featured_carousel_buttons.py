"""
Script to fix featured carousel cards:
1) Change button text from "إضافة للسلة" to "عرض التفاصيل"
2) Set href to productUrl and target="_blank" so clicking opens product page in a new tab
"""
import os, sys, shutil, re, subprocess

def fix_featured_carousel(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start_fn = content.find('function renderFeaturedCarousel() {')
    end_fn = content.find('let cols = 3;')

    if start_fn != -1 and end_fn != -1:
        new_carousel_render = """function renderFeaturedCarousel() {
    const track = document.getElementById('featuredCarouselTrack');
    const indicators = document.getElementById('featuredCarouselIndicators');
    const container = document.getElementById('featuredCarouselContainer');
    if (!track || !indicators || !container) return;

    featuredCarouselProducts = allProducts.filter(p => p.is_featured === 1);
    
    if (featuredCarouselProducts.length === 0) {
        featuredCarouselProducts = allProducts.slice(0, 5);
    }

    if (featuredCarouselProducts.length === 0) {
        const hs = document.querySelector('.hero-section');
        if (hs) hs.style.display = 'none';
        return;
    } else {
        const hs = document.querySelector('.hero-section');
        if (hs) hs.style.display = 'block';
    }

    track.innerHTML = featuredCarouselProducts.map(p => {
        const finalPrice = p.discount_price ? p.discount_price : p.base_price;
        const discountTag = p.discount_price && p.discount_price < p.base_price 
            ? `<div class="discount-tag">خصم ${Math.round((1 - p.discount_price/p.base_price)*100)}%</div>` 
            : '';
        const productUrl = typeof getProductUrl === 'function' ? getProductUrl(p.id) : `product.html?id=${p.id}`;

        return `
            <div class="carousel-slide">
                <div class="featured-product-card">
                    ${discountTag}
                    <a href="${productUrl}" target="_blank" rel="noopener" class="product-thumb-wrapper" style="cursor:pointer; text-align:center; display:block;">
                        <img class="product-thumb" src="${p.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${p.title_ar}">
                    </a>
                    <a href="${productUrl}" target="_blank" rel="noopener" class="product-title" style="text-decoration:none;">${p.title_ar}</a>
                    <div class="product-price-box">
                        <span class="current-price">${formatSYP(finalPrice)}</span>
                        ${p.discount_price && p.discount_price < p.base_price ? `<span class="old-price">${formatSYP(p.base_price)}</span>` : ''}
                    </div>
                    <a href="${productUrl}" target="_blank" rel="noopener" class="btn-add-cart" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
                        <i class="fa-solid fa-eye"></i> عرض التفاصيل
                    </a>
                </div>
            </div>
        `;
    }).join('');

    """
        content = content[:start_fn] + new_carousel_render + content[end_fn:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated renderFeaturedCarousel in {filepath}")

fix_featured_carousel('js/app.js')
fix_featured_carousel('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
