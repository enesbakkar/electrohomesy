"""
Script to fix cart item price calculation and auto-repair any $0 price items in cart.
"""
import os, sys, shutil, re, subprocess

def update_cart_logic_in_app(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update addToCartCurrentProduct
    start_add = content.find('function addToCartCurrentProduct() {')
    end_add = content.find('function saveCart() {')
    
    if start_add != -1 and end_add != -1:
        new_add_fn = """function addToCartCurrentProduct() {
    if (!currentSelectedProduct) return;

    const basePrice = currentSelectedProduct.discount_price ? Number(currentSelectedProduct.discount_price) : Number(currentSelectedProduct.base_price || 0);
    const priceModifier = currentSelectedVariant ? (Number(currentSelectedVariant.price_modifier) || 0) : 0;
    let unitPrice = basePrice + priceModifier;
    if (!unitPrice || unitPrice <= 0) unitPrice = Number(currentSelectedProduct.base_price || 0);

    const variantDetails = currentSelectedVariant 
        ? `${currentSelectedVariant.brand} ${currentSelectedVariant.model_name} ` + Object.entries(currentSelectedVariant.variant_attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'افتراضي';

    const cartItem = {
        product_id: currentSelectedProduct.id,
        variant_id: currentSelectedVariant ? currentSelectedVariant.id : null,
        product_name: currentSelectedProduct.title_ar,
        variant_details: variantDetails,
        unit_price: unitPrice,
        main_image: currentSelectedProduct.main_image || '/Logo/ElectroHomeSY-logo-blue.png',
        quantity: 1
    };

    const existingIndex = cart.findIndex(ci => ci.product_id === cartItem.product_id && ci.variant_id === cartItem.variant_id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
        if (!cart[existingIndex].unit_price || cart[existingIndex].unit_price <= 0) {
            cart[existingIndex].unit_price = unitPrice;
        }
    } else {
        cart.push(cartItem);
    }

    saveCart();
    closeModal('productModal');
    window.location.hash = '#cart-section';
}

"""
        content = content[:start_add] + new_add_fn + content[end_add:]
        print(f"Updated addToCartCurrentProduct in {filepath}")

    # 2. Update renderCartPage
    start_render = content.find('function renderCartPage() {')
    end_render = content.find('function renderCartModal() {')

    if start_render != -1 and end_render != -1:
        new_render_fn = """function renderCartPage() {
    const list = document.getElementById('cartItemsList');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    if (!list || !totalPriceEl) return;

    // Auto-repair any 0 price items in cart
    if (Array.isArray(cart)) {
        cart.forEach(item => {
            if (!item.unit_price || Number(item.unit_price) <= 0) {
                const found = (allProducts || []).find(p => p.id === item.product_id);
                if (found) {
                    item.unit_price = Number(found.discount_price || found.base_price || 0);
                }
            }
        });
    }

    if (!cart || cart.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding:35px; color:var(--steel-grey); font-size:1.05rem; font-family:'Cairo',sans-serif;">السلة فارغة حالياً. أضف بعض المنتجات للتسوق!</p>`;
        totalPriceEl.innerText = formatSYP(0);
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, index) => {
        const itemPrice = Number(item.unit_price) || 0;
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-product-item">
                <div class="cart-product-image-wrapper" style="width:60px; height:60px; border-radius:12px; border:1px solid var(--border-color); background:#ffffff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                    <img src="${item.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${item.product_name}" style="max-width:100%; max-height:100%; object-fit:contain; padding:4px;">
                </div>
                <div class="cart-product-details">
                    <span class="cart-product-title">${item.product_name}</span>
                    <span class="cart-product-subtitle">${item.variant_details || 'افتراضي'}</span>
                </div>
                <div class="cart-qty-selector">
                    <button type="button" class="cart-qty-btn" onclick="changeQty(${index}, -1)">
                        <svg fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" stroke="#47484b" d="M20 12L4 12"></path>
                        </svg>
                    </button>
                    <label class="cart-qty-label">${item.quantity}</label>
                    <button type="button" class="cart-qty-btn" onclick="changeQty(${index}, 1)">
                        <svg fill="none" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linejoin="round" stroke-linecap="round" stroke-width="2.5" stroke="#47484b" d="M12 4V20M20 12H4"></path>
                        </svg>
                    </button>
                </div>
                <div class="cart-product-price-wrapper">
                    <label class="cart-product-price">${formatSYP(itemTotal)}</label>
                </div>
                <div class="cart-product-delete-btn">
                    <button type="button" onclick="removeFromCart(${index})" style="color:var(--spark-red); background:none; border:none; cursor:pointer; font-size:1.15rem; display:flex; align-items:center; justify-content:center; padding: 4px;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    totalPriceEl.innerText = formatSYP(total);
    updateUserAuthUI();
}

"""
        content = content[:start_render] + new_render_fn + content[end_render:]
        print(f"Updated renderCartPage in {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

update_cart_logic_in_app('js/app.js')
update_cart_logic_in_app('public/js/app.js')

# Update addMasterProductToCart in product.html
def update_product_html(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start = content.find('function addMasterProductToCart() {')
    end = content.find('// Check and Init Product Detail Page')
    if end == -1: end = content.find('initDetailPage();')

    if start != -1 and end != -1:
        new_add_master = """function addMasterProductToCart() {
            if (!detailProduct) return;
            const basePrice = detailProduct.discount_price ? Number(detailProduct.discount_price) : Number(detailProduct.base_price || 0);
            const modifier = detailVariant ? (Number(detailVariant.price_modifier) || 0) : 0;
            let unitPrice = basePrice + modifier;
            if (!unitPrice || unitPrice <= 0) unitPrice = Number(detailProduct.base_price || 0);

            const variantDetails = detailVariant
                ? `${detailVariant.brand} ${detailVariant.model_name} ` + Object.entries(detailVariant.variant_attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')
                : 'افتراضي';

            const cartItem = {
                product_id: detailProduct.id,
                variant_id: detailVariant ? detailVariant.id : null,
                product_name: detailProduct.title_ar,
                variant_details: variantDetails,
                unit_price: unitPrice,
                main_image: detailProduct.main_image || '/Logo/ElectroHomeSY-logo-blue.png',
                quantity: 1
            };

            const idx = cart.findIndex(ci => ci.product_id === cartItem.product_id && ci.variant_id === cartItem.variant_id);
            if (idx > -1) {
                cart[idx].quantity += 1;
                if (!cart[idx].unit_price || cart[idx].unit_price <= 0) {
                    cart[idx].unit_price = unitPrice;
                }
            } else {
                cart.push(cartItem);
            }

            saveCart();
            window.location.href = 'index.html#cart-section';
        }

        """
        content = content[:start] + new_add_master + content[end:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated addMasterProductToCart in {filepath}")

update_product_html('product.html')
update_product_html('public/product.html')

# Sync public files
shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
