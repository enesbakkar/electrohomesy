/* ElectroHomeSY - Main Application & Admin Logic */

// Global State
let allProducts = [];
let allCategories = [];
let cart = JSON.parse(localStorage.getItem('electro_cart') || '[]');
let currentCustomer = JSON.parse(localStorage.getItem('electro_customer') || 'null');
let selectedPaymentMethod = 'cod';
let currentSelectedProduct = null;
let currentSelectedVariant = null;

// Utility: Format currency in Syrian Pounds (ل.س)
function formatSYP(amount) {
    if (amount === null || amount === undefined) return '';
    return Number(amount).toLocaleString('ar-SY') + ' ل.س';
}

// Utility: Convert YouTube link to embed format
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
}

// Utility: Generate WhatsApp Quick Inquiry Link (+963 959 930 005)
function getWhatsAppInquiryLink(productTitle) {
    const phone = '963959930005';
    const msg = `السلام عليكم\nهل متوفر هذا الصنف؟\n*${productTitle}*`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// Modal Utilities
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

// Initialize Application on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if on Customer Storefront
    if (document.getElementById('productsGrid')) {
        initStorefront();
    }
});

function initStorefront() {
    updateCartBadge();
    updateUserAuthUI();
    fetchCategories();
    fetchProducts('all');

    // Search listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            renderProducts(allProducts.filter(p => 
                p.title_ar.toLowerCase().includes(query) || 
                (p.description_ar && p.description_ar.toLowerCase().includes(query))
            ));
        });
    }

    // Modal Triggers
    document.getElementById('btnOpenCart')?.addEventListener('click', () => renderCartModal());
    document.getElementById('btnOpenRequestModal')?.addEventListener('click', () => openModal('requestModal'));
    document.getElementById('btnSectionRequest')?.addEventListener('click', () => openModal('requestModal'));
    document.getElementById('btnHeroContact')?.addEventListener('click', () => openModal('requestModal'));

    // Forms
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckoutSubmit);
    document.getElementById('productRequestForm')?.addEventListener('submit', handleRequestSubmit);
    document.getElementById('customerAuthForm')?.addEventListener('submit', handleCustomerAuthSubmit);
}

// User Auth UI State Updates
function updateUserAuthUI() {
    const btnText = document.getElementById('userAuthBtnText');
    const btn = document.getElementById('btnUserAuth');
    if (currentCustomer) {
        if (btnText) btnText.innerText = currentCustomer.full_name.split(' ')[0] || 'حسابي';
        if (btn) btn.classList.add('active-user');
        
        // Auto fill checkout fields if available
        const custNameInput = document.getElementById('custName');
        const custPhoneInput = document.getElementById('custPhone');
        if (custNameInput && !custNameInput.value) custNameInput.value = currentCustomer.full_name;
        if (custPhoneInput && !custPhoneInput.value) custPhoneInput.value = currentCustomer.phone_number;
    } else {
        if (btnText) btnText.innerText = 'تسجيل الدخول';
        if (btn) btn.classList.remove('active-user');
    }
}

function openUserAuthModal() {
    if (currentCustomer) {
        if (confirm(`أهلاً بك يا ${currentCustomer.full_name}!\nهل ترغب بتسجيل الخروج من حسابك؟`)) {
            currentCustomer = null;
            localStorage.removeItem('electro_customer');
            updateUserAuthUI();
        }
    } else {
        openModal('userAuthModal');
    }
}

// Customer Auth Submit
async function handleCustomerAuthSubmit(e) {
    e.preventDefault();
    const full_name = document.getElementById('authCustName').value.trim();
    const phone_number = document.getElementById('authCustPhone').value.trim();

    try {
        const res = await fetch('/api/customer/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, phone_number, auth_provider: 'phone' })
        });
        const data = await res.json();
        if (res.ok) {
            currentCustomer = data.customer;
            localStorage.setItem('electro_customer', JSON.stringify(currentCustomer));
            updateUserAuthUI();
            closeModal('userAuthModal');
            alert(`أهلاً بك يا ${currentCustomer.full_name}! تم تسجيل حسابك بنجاح.`);
        } else {
            alert(data.error || 'فشل تسجيل الحساب');
        }
    } catch (err) {
        alert('حدث خطأ بالاتصال مع الخادم');
    }
}

// Google Auth Mock (Mandatory Syrian Phone prompt)
function handleGoogleAuthMock() {
    const name = prompt('أدخل اسمك المسجل في حساب Google:');
    if (!name) return;
    
    const phone = prompt('يرجى إدخال رقم هاتفك السوري (مطلوب دائماً لربط الحساب بالشحن):');
    if (!phone) {
        alert('رقم الهاتف السوري إجباري لإتمام تسجيل الحساب!');
        return;
    }

    fetch('/api/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, phone_number: phone, auth_provider: 'google' })
    }).then(r => r.json()).then(data => {
        if (data.customer) {
            currentCustomer = data.customer;
            localStorage.setItem('electro_customer', JSON.stringify(currentCustomer));
            updateUserAuthUI();
            closeModal('userAuthModal');
            alert(`أهلاً بك يا ${currentCustomer.full_name}! تم ربط حساب Google برقم هاتفك بنجاح.`);
        } else {
            alert(data.error || 'حدث خطأ في التسجيل');
        }
    }).catch(() => alert('خطأ بالاتصال'));
}

// Fetch Categories
async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        allCategories = await res.json();
        const tabsContainer = document.getElementById('categoryTabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = `<button class="cat-tab active" data-category="all" onclick="filterCategory('all', this)"><i class="fa-solid fa-border-all"></i> كافة المنتجات</button>`;
            allCategories.forEach(cat => {
                tabsContainer.innerHTML += `
                    <button class="cat-tab" data-category="${cat.slug}" onclick="filterCategory('${cat.slug}', this)">
                        <i class="fa-solid ${cat.icon || 'fa-tag'}"></i> ${cat.name_ar}
                    </button>
                `;
            });
        }
    } catch (e) {
        console.error('Error fetching categories:', e);
    }
}

// Fetch Products
async function fetchProducts(categorySlug) {
    try {
        const res = await fetch(`/api/products?category=${categorySlug}`);
        allProducts = await res.json();
        renderProducts(allProducts);
    } catch (e) {
        console.error('Error fetching products:', e);
    }
}

function filterCategory(slug, btn) {
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    fetchProducts(slug);
}

// Render Products Grid with Image & Title Clickability
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--steel-grey);">
            <i class="fa-solid fa-box-open" style="font-size: 3.5rem; margin-bottom: 15px;"></i>
            <p style="font-size: 1.1rem;">لا توجد منتجات متوفرة حالياً في هذا التصنيف.</p>
        </div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const priceToShow = p.discount_price ? p.discount_price : p.base_price;
        const hasDiscount = p.discount_price && p.discount_price < p.base_price;
        const waLink = getWhatsAppInquiryLink(p.title_ar);
        
        return `
            <div class="product-card">
                ${hasDiscount ? `<span class="discount-tag">تخفيض خاص</span>` : ''}
                <img src="${p.main_image || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'}" alt="${p.title_ar}" class="product-thumb" style="cursor: pointer;" onclick="openProductDetail(${p.id})">
                <span class="product-category-name">${p.category_name || 'أجهزة منزلية'}</span>
                <h4 class="product-title" style="cursor: pointer;" onclick="openProductDetail(${p.id})">${p.title_ar}</h4>
                
                <div class="product-price-box">
                    <span class="current-price">${formatSYP(priceToShow)}</span>
                    ${hasDiscount ? `<span class="old-price">${formatSYP(p.base_price)}</span>` : ''}
                </div>

                <div class="product-card-actions">
                    <button class="btn-add-cart" onclick="openProductDetail(${p.id})">
                        <i class="fa-solid fa-bag-shopping"></i> التفاصيل والشراء
                    </button>
                    <a href="${waLink}" target="_blank" class="btn-whatsapp-direct" style="justify-content: center; width: 100%;">
                        <i class="fa-brands fa-whatsapp"></i> استفسار سـريع عبر الواتساب
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Open Product Detail Modal
async function openProductDetail(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`);
        const product = await res.json();
        currentSelectedProduct = product;
        currentSelectedVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;

        renderModalContent();
        openModal('productModal');
    } catch (e) {
        alert('حدث خطأ أثناء تحميل تفاصيل المنتج');
    }
}

function renderModalContent() {
    const product = currentSelectedProduct;
    const body = document.getElementById('productModalBody');
    if (!product || !body) return;

    const basePrice = product.discount_price ? product.discount_price : product.base_price;
    const priceModifier = currentSelectedVariant ? currentSelectedVariant.price_modifier : 0;
    const finalPrice = basePrice + priceModifier;
    const youtubeEmbed = getYouTubeEmbedUrl(product.youtube_url);
    const waLink = getWhatsAppInquiryLink(product.title_ar);

    body.innerHTML = `
        <div>
            <img src="${product.main_image || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'}" alt="${product.title_ar}" style="width:100%; border-radius:20px; box-shadow:0 12px 30px rgba(0,0,0,0.12);">
            
            ${youtubeEmbed ? `
                <div class="youtube-embed-box">
                    <iframe src="${youtubeEmbed}" title="معاينة الجهاز بالفيديو" allowfullscreen></iframe>
                </div>
            ` : ''}
        </div>
        <div>
            <span style="background:rgba(0,122,61,0.12); color:var(--damascus-green); padding:5px 14px; border-radius:20px; font-size:0.88rem; font-weight:800;">${product.category_name || 'منتج مضمون'}</span>
            <h2 style="font-size:1.8rem; font-weight:900; margin:15px 0 10px 0;">${product.title_ar}</h2>
            
            <div style="font-size:2rem; font-weight:900; color:var(--damascus-green); margin-bottom:15px;" id="modalPrice">
                ${formatSYP(finalPrice)}
            </div>

            <p style="color:var(--steel-grey); line-height:1.8; margin-bottom:20px; font-size:1.02rem;">${product.description_ar || ''}</p>

            ${product.variants && product.variants.length > 0 ? `
                <div class="variant-selector-box">
                    <div class="variant-title">اختر الماركة والموديل والمواصفات:</div>
                    <div class="variant-options">
                        ${product.variants.map((v, idx) => {
                            const isSelected = currentSelectedVariant && currentSelectedVariant.id === v.id;
                            const attrs = Object.entries(v.variant_attributes || {}).map(([k, val]) => `${k}: ${val}`).join(' | ');
                            return `
                                <button class="variant-opt-btn ${isSelected ? 'selected' : ''}" onclick="selectVariant(${v.id})">
                                    <strong>${v.brand} ${v.model_name}</strong> ${attrs ? `(${attrs})` : ''}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}

            <div style="display:flex; flex-direction:column; gap:12px; margin-top:30px;">
                <button class="btn-primary" style="justify-content:center; padding:16px; font-size:1.1rem;" onclick="addToCartCurrentProduct()">
                    <i class="fa-solid fa-cart-plus"></i> إضافة إلى السلة وإتمام الشراء
                </button>
                <a href="${waLink}" target="_blank" class="btn-whatsapp-direct" style="justify-content:center; padding:14px; font-size:1rem;">
                    <i class="fa-brands fa-whatsapp" style="font-size:1.3rem;"></i> إستفسار مباشر عبر الواتساب (+963 959 930 005)
                </a>
            </div>
        </div>
    `;
}

function selectVariant(variantId) {
    if (!currentSelectedProduct) return;
    currentSelectedVariant = currentSelectedProduct.variants.find(v => v.id === variantId);
    renderModalContent();
}

// Cart Logic
function addToCartCurrentProduct() {
    if (!currentSelectedProduct) return;

    const basePrice = currentSelectedProduct.discount_price ? currentSelectedProduct.discount_price : currentSelectedProduct.base_price;
    const priceModifier = currentSelectedVariant ? currentSelectedVariant.price_modifier : 0;
    const unitPrice = basePrice + priceModifier;

    const variantDetails = currentSelectedVariant 
        ? `${currentSelectedVariant.brand} ${currentSelectedVariant.model_name} ` + Object.entries(currentSelectedVariant.variant_attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'افتراضي';

    const cartItem = {
        product_id: currentSelectedProduct.id,
        variant_id: currentSelectedVariant ? currentSelectedVariant.id : null,
        product_name: currentSelectedProduct.title_ar,
        variant_details: variantDetails,
        unit_price: unitPrice,
        quantity: 1
    };

    const existingIndex = cart.findIndex(ci => ci.product_id === cartItem.product_id && ci.variant_id === cartItem.variant_id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push(cartItem);
    }

    saveCart();
    closeModal('productModal');
    renderCartModal();
    openModal('cartModal');
}

function saveCart() {
    localStorage.setItem('electro_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    if (badge) {
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.innerText = totalQty;
    }
}

function renderCartModal() {
    const list = document.getElementById('cartItemsList');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    if (!list || !totalPriceEl) return;

    if (cart.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding:35px; color:var(--steel-grey); font-size:1.05rem;">السلة فارغة حالياً. أضف بعض المنتجات للتسوق!</p>`;
        totalPriceEl.innerText = formatSYP(0);
        openModal('cartModal');
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, index) => {
        const itemTotal = item.unit_price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-item-row">
                <div>
                    <strong style="display:block; color:var(--onyx); font-size:1.05rem;">${item.product_name}</strong>
                    <span style="font-size:0.88rem; color:var(--steel-grey);">${item.variant_details}</span>
                    <div style="font-size:1rem; color:var(--damascus-green); font-weight:800; margin-top:4px;">${formatSYP(item.unit_price)} × ${item.quantity} = ${formatSYP(itemTotal)}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <button type="button" onclick="changeQty(${index}, -1)" style="width:30px; height:30px; border-radius:50%; border:1px solid var(--border-color); background:#fff; cursor:pointer; font-weight:bold;">-</button>
                    <span style="font-weight:bold; font-size:1.1rem;">${item.quantity}</span>
                    <button type="button" onclick="changeQty(${index}, 1)" style="width:30px; height:30px; border-radius:50%; border:1px solid var(--border-color); background:#fff; cursor:pointer; font-weight:bold;">+</button>
                    <button type="button" onclick="removeFromCart(${index})" style="color:var(--spark-red); background:none; border:none; cursor:pointer; margin-right:12px; font-size:1.1rem;"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
        `;
    }).join('');

    totalPriceEl.innerText = formatSYP(total);

    // Auto populate customer details if logged in
    updateUserAuthUI();
    openModal('cartModal');
}

function changeQty(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        renderCartModal();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartModal();
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method-card').forEach(card => {
        if (card.dataset.method === method) card.classList.add('selected');
        else card.classList.remove('selected');
    });
}

// Checkout Submit - Enforces Customer Login Requirement
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    // MANDATORY CUSTOMER ACCOUNT CHECK
    if (!currentCustomer) {
        alert('⚠️ يرجى تسجيل الدخول أو إنشاء حساب جديد أولاً لإتمام طلبكم بنجاح!');
        closeModal('cartModal');
        openModal('userAuthModal');
        return;
    }

    const customer_name = document.getElementById('custName').value.trim() || currentCustomer.full_name;
    const customer_phone = document.getElementById('custPhone').value.trim() || currentCustomer.phone_number;
    const delivery_address = document.getElementById('custAddress').value.trim();

    const total_amount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: currentCustomer.id,
                customer_name,
                customer_phone,
                delivery_address,
                payment_method: selectedPaymentMethod,
                total_amount,
                items: cart
            })
        });

        const data = await res.json();
        if (res.ok) {
            alert(data.message || 'تم إرسال طلبكم بنجاح!');
            cart = [];
            saveCart();
            closeModal('cartModal');
        } else {
            alert(data.error || 'حدث خطأ أثناء تنفيذ الطلب');
        }
    } catch (e) {
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// Product Request Submit
async function handleRequestSubmit(e) {
    e.preventDefault();
    const customer_name = document.getElementById('reqName').value.trim();
    const customer_phone = document.getElementById('reqPhone').value.trim();
    const requested_product = document.getElementById('reqProduct').value.trim();
    const notes = document.getElementById('reqNotes').value.trim();

    try {
        const res = await fetch('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_name, customer_phone, requested_product, notes })
        });
        const data = await res.json();
        if (res.ok) {
            alert(data.message || 'تم إرسال طلبكم بنجاح');
            document.getElementById('productRequestForm').reset();
            closeModal('requestModal');
        } else {
            alert(data.error || 'حدث خطأ');
        }
    } catch (e) {
        alert('خطأ في الاتصال بالخادم');
    }
}

/* ==========================================
   ADMIN DASHBOARD FUNCTIONALITY (100% Arabic RTL)
   ========================================== */

let adminProducts = [];

document.getElementById('adminLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('adminUser').value;
    const password = document.getElementById('adminPass').value;

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            sessionStorage.setItem('adminToken', data.token);
            document.getElementById('adminLoginOverlay').style.display = 'none';
            loadAdminData();
        } else {
            alert(data.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    } catch (err) {
        alert('حدث خطأ أثناء الاتصال بالخادم');
    }
});

function logoutAdmin() {
    sessionStorage.removeItem('adminToken');
    location.reload();
}

function switchAdminTab(tabId, el) {
    document.querySelectorAll('.admin-nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');

    document.getElementById('productsTab').style.display = 'none';
    document.getElementById('ordersTab').style.display = 'none';
    document.getElementById('requestsTab').style.display = 'none';

    document.getElementById(tabId).style.display = 'block';
}

async function loadAdminData() {
    fetchAdminProducts();
    fetchAdminOrders();
    fetchAdminRequests();
}

async function fetchAdminProducts() {
    try {
        const res = await fetch('/api/products?include_hidden=true');
        adminProducts = await res.json();
        const tbody = document.getElementById('adminProductsTableBody');
        if (!tbody) return;

        tbody.innerHTML = adminProducts.map(p => `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td><img src="${p.main_image || ''}" style="width:48px; height:48px; object-fit:cover; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1);"></td>
                <td><strong style="color:var(--onyx); font-size:1.05rem;">${p.title_ar}</strong></td>
                <td><span style="background:#f1f5f9; padding:4px 10px; border-radius:12px; font-weight:700; font-size:0.88rem;">${p.category_name || 'عام'}</span></td>
                <td><strong style="color:var(--damascus-green); font-size:1.1rem;">${formatSYP(p.base_price)}</strong></td>
                <td><span class="badge-status" style="background:#e0f2fe; color:#0369a1;">${p.variants ? p.variants.length : 0} تنوعات</span></td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${p.is_visible ? 'checked' : ''} onchange="toggleVisibility(${p.id}, this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
                <td>
                    <button class="btn-admin-act btn-admin-edit" title="تعديل" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-admin-act btn-admin-delete" title="حذف" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash-can"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        console.error('Admin fetch products error:', e);
    }
}

async function toggleVisibility(id, isVisible) {
    try {
        await fetch(`/api/products/${id}/visibility`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_visible: isVisible })
        });
    } catch (e) {
        alert('فشل تغيير حالة الظهور');
    }
}

async function deleteProduct(id) {
    if (!confirm('هل أنت تأكد من رغبتك بحذف هذا الجهاز نهائياً من المخزون؟')) return;
    try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchAdminProducts();
    } catch (e) {
        alert('فشل حذف الجهاز');
    }
}

// Add / Edit Product Dynamic Variant Rows
function addVariantRow(data = {}) {
    const container = document.getElementById('variantsContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'variant-row';
    div.style.cssText = 'display:grid; grid-template-columns: 1fr 1fr 1fr 1fr auto; gap:12px; margin-bottom:12px; background:#fff; padding:12px; border-radius:12px; border:1px solid var(--border-color); align-items:center;';
    
    const attrStr = data.variant_attributes ? JSON.stringify(data.variant_attributes) : '{"اللون":"أسود"}';

    div.innerHTML = `
        <input type="text" class="form-control v-brand" placeholder="الماركة (مثال: Philips)" value="${data.brand || ''}" required>
        <input type="text" class="form-control v-model" placeholder="الموديل (مثال: GC4909)" value="${data.model_name || ''}">
        <input type="text" class="form-control v-attrs" placeholder='JSON الخصائص' value='${attrStr}'>
        <input type="number" class="form-control v-price" placeholder="فارق السعر (+/- ل.س)" value="${data.price_modifier || 0}">
        <button type="button" onclick="this.parentElement.remove()" style="color:var(--spark-red); background:none; border:none; font-size:1.3rem; cursor:pointer;" title="إزالة"><i class="fa-solid fa-circle-xmark"></i></button>
    `;
    container.appendChild(div);
}

function openAddProductModal() {
    document.getElementById('adminProductModalTitle').innerText = 'إضافة جهاز جديد للمتجر';
    document.getElementById('editProductId').value = '';
    document.getElementById('adminProductForm').reset();
    document.getElementById('variantsContainer').innerHTML = '';
    addVariantRow();
    openModal('adminProductModal');
}

function editProduct(id) {
    const p = adminProducts.find(item => item.id === id);
    if (!p) return;

    document.getElementById('adminProductModalTitle').innerText = 'تعديل الجهاز #' + p.id;
    document.getElementById('editProductId').value = p.id;
    document.getElementById('pTitleAr').value = p.title_ar;
    document.getElementById('pCategory').value = p.category_id || 1;
    document.getElementById('pDescAr').value = p.description_ar || '';
    document.getElementById('pBasePrice').value = p.base_price;
    document.getElementById('pDiscountPrice').value = p.discount_price || '';
    document.getElementById('pMainImage').value = p.main_image || '';
    document.getElementById('pYoutubeUrl').value = p.youtube_url || '';

    const container = document.getElementById('variantsContainer');
    container.innerHTML = '';
    if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => addVariantRow(v));
    } else {
        addVariantRow();
    }

    openModal('adminProductModal');
}

document.getElementById('adminProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const title_ar = document.getElementById('pTitleAr').value;
    const category_id = Number(document.getElementById('pCategory').value);
    const description_ar = document.getElementById('pDescAr').value;
    const base_price = Number(document.getElementById('pBasePrice').value);
    const discount_price = document.getElementById('pDiscountPrice').value ? Number(document.getElementById('pDiscountPrice').value) : null;
    const main_image = document.getElementById('pMainImage').value;
    const youtube_url = document.getElementById('pYoutubeUrl').value;

    const variantRows = document.querySelectorAll('.variant-row');
    const variants = Array.from(variantRows).map(row => {
        let attrs = {};
        try { attrs = JSON.parse(row.querySelector('.v-attrs').value); } catch(e) { attrs = {}; }
        return {
            brand: row.querySelector('.v-brand').value,
            model_name: row.querySelector('.v-model').value,
            variant_attributes: attrs,
            price_modifier: Number(row.querySelector('.v-price').value || 0)
        };
    });

    const payload = { category_id, title_ar, description_ar, base_price, discount_price, main_image, youtube_url, is_visible: 1, variants };
    
    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/products/${id}` : '/api/products';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal('adminProductModal');
            fetchAdminProducts();
        } else {
            alert('خطأ أثناء حفظ الجهاز');
        }
    } catch (err) {
        alert('خطأ بالاتصال مع الخادم');
    }
});

async function fetchAdminOrders() {
    try {
        const res = await fetch('/api/orders');
        const orders = await res.json();
        const tbody = document.getElementById('adminOrdersTableBody');
        if (!tbody) return;

        tbody.innerHTML = orders.map(o => `
            <tr>
                <td><strong style="color:var(--damascus-green)">#ORD-${o.id}</strong></td>
                <td><strong>${o.customer_name}</strong></td>
                <td><a href="tel:${o.customer_phone}" style="color:var(--onyx); font-weight:700;">${o.customer_phone}</a></td>
                <td>${o.delivery_address}</td>
                <td><span class="badge-status" style="background:#fef3c7; color:#d97706;">${o.payment_method === 'cod' ? 'الدفع عند الاستلام (COD)' : 'شام كاش (ShamCash)'}</span></td>
                <td><strong style="color:var(--damascus-green); font-size:1.1rem;">${formatSYP(o.total_amount)}</strong></td>
                <td>${new Date(o.created_at).toLocaleDateString('ar-SY')}</td>
            </tr>
        `).join('');
    } catch (e) {}
}

async function fetchAdminRequests() {
    try {
        const res = await fetch('/api/requests');
        const reqs = await res.json();
        const tbody = document.getElementById('adminRequestsTableBody');
        if (!tbody) return;

        tbody.innerHTML = reqs.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td><strong>${r.customer_name}</strong></td>
                <td>${r.customer_phone}</td>
                <td style="color:var(--damascus-green); font-weight:800; font-size:1.05rem;">${r.requested_product}</td>
                <td>${r.notes || '-'}</td>
                <td>${new Date(r.created_at).toLocaleDateString('ar-SY')}</td>
            </tr>
        `).join('');
    } catch (e) {}
}
