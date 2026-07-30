"""
Script to apply bulletproof price formatting and inline fallback in product.html and public/product.html.
Ensures $29.99 discounted selling price CANNOT be empty under any circumstances.
"""
import os, sys, shutil, re, subprocess

# 1. Update product.html
with open('product.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update renderMasterProductCard price variables and HTML block
old_card_fn = re.search(r'function renderMasterProductCard\(\)\s*\{.*?\n        \}', content, re.DOTALL)

new_price_logic = """        function renderMasterProductCard() {
            const p = detailProduct;
            const card = document.getElementById('productMasterCard');
            const code = p.variants && p.variants.length > 0 && p.variants[0].sku ? p.variants[0].sku : generateProductCode(p.id);
            const url = window.location.href;

            const sellingPrice = p.discount_price ? Number(p.discount_price) : Number(p.base_price);
            const originalPrice = Number(p.base_price);
            const modifier = detailVariant ? (Number(detailVariant.price_modifier) || 0) : 0;
            const finalPrice = sellingPrice + modifier;
            const hasDiscount = p.discount_price && Number(p.discount_price) < Number(p.base_price);
            const savings = hasDiscount ? (originalPrice - Number(p.discount_price)) : 0;

            const p1 = '963';
            const p2 = '959';
            const p3 = '930';
            const p4 = '005';
            const formattedPhone = `+${p1} ${p2} ${p3} ${p4}`;
            const waLink = getWhatsAppInquiryLink(p.title_ar, p.id);
            const youtubeEmbed = getYouTubeEmbedUrl(p.youtube_url);

            const displayFinalPrice = formatSYP(finalPrice) || ('$' + finalPrice);
            const displayOriginalPrice = formatSYP(originalPrice) || ('$' + originalPrice);
            const displaySavings = formatSYP(savings) || ('$' + savings);

            card.innerHTML = `
                <div class="product-grid-layout">
                    <!-- GALLERY & MEDIA (RIGHT IN RTL) -->
                    <div class="product-gallery-col">
                        <div class="product-image-frame">
                            <img id="mainProductImage" src="${p.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${p.title_ar}">
                        </div>

                        ${(p.images && p.images.length > 1) ? `
                            <div class="product-thumbnails-gallery" style="display:flex; gap:10px; overflow-x:auto; padding:6px 2px; margin-top:2px;">
                                ${p.images.map((img, idx) => `
                                    <div class="thumbnail-item ${idx === 0 ? 'active' : ''}" onclick="switchProductMainImage('${img}', this)" style="width:72px; height:72px; border-radius:14px; border:2px solid ${idx === 0 ? 'var(--damascus-green)' : 'var(--border-color)'}; overflow:hidden; cursor:pointer; flex-shrink:0; transition:all 0.2s; background:white;">
                                        <img src="${img}" style="width:100%; height:100%; object-fit:contain;" alt="${p.title_ar} - صورة ${idx+1}">
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        <div class="trust-badges-box">
                            <div class="trust-badge-item">
                                <i class="fa-solid fa-truck-fast"></i>
                                <span>توصيل سريع بدمشق</span>
                            </div>
                            <div class="trust-badge-item">
                                <i class="fa-solid fa-shield-halved"></i>
                                <span>كفالة وجودة 100%</span>
                            </div>
                            <div class="trust-badge-item">
                                <i class="fa-solid fa-hand-holding-dollar"></i>
                                <span>دفع عند الاستلام</span>
                            </div>
                        </div>
                    </div>

                    <!-- DETAILS & BUY PANEL (LEFT IN RTL) -->
                    <div class="product-details-col">
                        <div class="product-meta-header">
                            <div class="meta-tags-group">
                                <span class="cat-pill"><i class="fa-solid fa-tag"></i> ${p.category_name || 'أجهزة منزلية'}</span>
                                <span class="code-pill"><i class="fa-solid fa-barcode"></i> رمز الجهاز: <strong>${code}</strong></span>
                            </div>
                        </div>

                        ${p.variants && p.variants.length > 0 && p.variants[0].brand && p.variants[0].brand !== 'ElectroHome' 
                            ? `<div class="product-detail-brand" style="font-size: 1.35rem; color: var(--damascus-green); text-transform: uppercase; font-weight: 900; letter-spacing: 1px; margin-bottom: 2px;">${p.variants[0].brand}</div>` 
                            : ''}
                        <h1 class="product-main-title" style="margin-top: 5px;">${p.title_ar}</h1>

                        <div class="product-price-container" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin: 15px 0 22px 0;">
                            <div style="display:flex; flex-direction:column; gap:2px;">
                                <span style="font-size:0.85rem; color:#475569; font-weight:700;">سعر البيع الآن:</span>
                                <span class="price-hero-current" id="detailFinalPrice" style="font-size:2.5rem; font-weight:900; color:#073066; display:inline-block; line-height:1.2;">${displayFinalPrice}</span>
                            </div>

                            ${hasDiscount ? `
                                <div style="display:flex; flex-direction:column; gap:2px; margin-right:10px;">
                                    <span style="font-size:0.85rem; color:#94a3b8; font-weight:700;">السعر الأصلي:</span>
                                    <span class="price-hero-old" style="font-size:1.3rem; color:#94a3b8; text-decoration:line-through; font-weight:600;">${displayOriginalPrice}</span>
                                </div>
                                <span class="discount-tag-badge" style="background:rgba(239,68,68,0.1); color:#ef4444; padding:8px 14px; border-radius:12px; font-weight:800; font-size:0.95rem; align-self:flex-end;">🔥 وفر ${displaySavings}</span>
                            ` : ''}
                        </div>

                        <p class="product-description-text">${p.description_ar || ''}</p>

                        ${p.variants && p.variants.length > 0 ? `
                            <div class="variants-section-box">
                                <div class="variants-section-title">
                                    <i class="fa-solid fa-sliders" style="color:var(--damascus-green);"></i>
                                    اختر الماركة والموديل والمواصفات المطلوبة:
                                </div>
                                <div class="variant-cards-grid">
                                    ${p.variants.map(v => {
                                        const isSelected = detailVariant && detailVariant.id === v.id;
                                        const attrs = Object.entries(v.variant_attributes || {}).map(([k, val]) => `${k}: ${val}`).join(' | ');
                                        const modText = v.price_modifier !== 0 ? ` (${v.price_modifier > 0 ? '+' : ''}${formatSYP(v.price_modifier)})` : '';
                                        return `
                                            <div class="variant-card-item ${isSelected ? 'selected' : ''}" onclick="selectMasterVariant(${v.id})">
                                                <div class="variant-card-info">
                                                    <div class="variant-radio"></div>
                                                    <div>
                                                        <strong style="display:block; color:var(--onyx); font-size:0.98rem;">${v.brand}</strong>
                                                        <span style="font-size:0.84rem; color:var(--steel-grey);">${attrs || 'المواصفات القياسية'}</span>
                                                    </div>
                                                </div>
                                                ${modText ? `<span style="font-size:0.88rem; font-weight:800; color:var(--damascus-green);">${modText}</span>` : ''}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="action-buttons-group">
                            <div class="aurora-btn-wrapper">
                                <div class="aurora-glow"></div>
                                <button class="btn-buy-now-hero-aurora" onclick="addMasterProductToCart()">
                                    <i class="fa-solid fa-cart-plus" style="font-size:1.3rem;"></i> إضافة إلى السلة وإتمام الشراء
                                </button>
                            </div>
                            <a href="${waLink}" target="_blank" class="btn-whatsapp-hero">
                                <i class="fa-brands fa-whatsapp" style="font-size:1.4rem;"></i> استفسار مباشر عبر الواتساب
                            </a>
                        </div>

                        <div class="share-bar-container">
                            <span style="font-size:0.88rem; color:var(--steel-grey); font-weight:700;"><i class="fa-solid fa-share-nodes" style="margin-left:6px;"></i> رابط الجهاز المباشر:</span>
                            <button onclick="navigator.clipboard.writeText('${url}').then(()=>alert('تم نسخ رابط الجهاز بنجاح!'))" 
                                    style="background:white; border:1.5px solid var(--border-color); padding:6px 16px; border-radius:20px; font-family:'Cairo',sans-serif; font-size:0.85rem; font-weight:800; cursor:pointer; color:var(--damascus-green); transition:all 0.2s;">
                                <i class="fa-solid fa-copy"></i> نسخ الرابط
                            </button>
                        </div>

                        ${youtubeEmbed ? `
                            <div class="youtube-section" style="margin-top: 30px; border-top: 1.5px solid var(--border-color); padding-top: 20px;">
                                <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--onyx); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fa-solid fa-circle-play" style="color: #ef4444;"></i>
                                    <span>فيديو معاينة المنتج:</span>
                                </h3>
                                <div style="border-radius:18px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.08); margin-top:10px; aspect-ratio: 16/9; width:100%;">
                                    <iframe src="${youtubeEmbed}" title="معاينة الجهاز بالفيديو" style="width:100%; height:100%; border:none;" allowfullscreen></iframe>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }"""

# Extract current function renderMasterProductCard and replace it cleanly
start_idx = content.find('function renderMasterProductCard() {')
end_idx = content.find('function selectMasterVariant(variantId) {')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_price_logic + '\n\n        ' + content[end_idx:]
    print("Replaced renderMasterProductCard cleanly in product.html")

# Bump version to v=14.0.0
content = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=14.0.0', content)

with open('product.html', 'w', encoding='utf-8') as f:
    f.write(content)

# Copy product.html -> public/product.html
shutil.copy('product.html', 'public/product.html')

# Update index.html and public/index.html to v=14.0.0
for htmlfile in ['index.html', 'public/index.html']:
    if os.path.exists(htmlfile):
        with open(htmlfile, 'r', encoding='utf-8') as f:
            c = f.read()
        c = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=14.0.0', c)
        with open(htmlfile, 'w', encoding='utf-8') as f:
            f.write(c)

shutil.copy('index.html', 'public/index.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

print("All files updated & synced to public/ with v=14.0.0 cache busting")
