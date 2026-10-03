
function renderCategoriesPage() {
    const container = document.getElementById('categoriesSectionContent');
    if (!container) return;

    const descriptions = {
        'irons': 'مكاوي بخار، أجهزة كوي عمودية ومستلزمات العناية بالملابس',
        'vacuums': 'مكانس برميلية، مكانس لاسلكية ومعدات التنظيف البخارية',
        'kitchen': 'خلاطات، معالجات طعام، قلايات بدون زيت وغلايات ماء',
        'personal-care': 'ماكينات حلاقة، تشذيب اللحية ومجففات الشعر العالمية',
        'home-living': 'مصابيح طوارئ، موازين حرارة، كشافات وأجهزة منزلية وطبية',
        'coffee-machines': 'ماكينات إسبريسو، دولسي غوستو، تاسيمو وتقطير القهوة'
    };

    let html = `
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="width: 65px; height: 65px; background: rgba(0, 122, 61, 0.08); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 1.5px solid rgba(0, 122, 61, 0.18);">
                <i class="fa-solid fa-layer-group" style="font-size: 1.9rem; color: var(--damascus-green);"></i>
            </div>
            <h2 style="font-size: 1.65rem; font-weight: 900; color: var(--onyx); margin-bottom: 6px;">أصناف وتصنيفات الأجهزة</h2>
            <p style="font-size: 0.95rem; color: var(--steel-grey);">انقر على أي صنف لتصفح الأجهزة والموديلات المتوفرة لدينا في دمشق</p>
        </div>

        <div class="categories-page-grid">
    `;

    (allCategories || FALLBACK_CATEGORIES).forEach(cat => {
        const count = filterProductsByCategory(allProducts || [], cat.slug).length;
        const desc = descriptions[cat.slug] || 'تصفح أحدث الأجهزة والموديلات المتوفرة';

        html += `
            <div class="category-page-card" onclick="selectCategoryFromPage('${cat.slug}')">
                <div class="cat-card-icon-box">
                    <i class="fa-solid ${cat.icon || 'fa-tag'}"></i>
                </div>
                <div class="cat-card-info">
                    <h3 class="cat-card-title">${cat.name_ar}</h3>
                    <p class="cat-card-desc">${desc}</p>
                    <span class="cat-card-badge"><i class="fa-solid fa-box-archive"></i> ${count > 0 ? `${count} جهازاً متوفراً` : 'قريباً'}</span>
                </div>
                <div class="cat-card-arrow">
                    <i class="fa-solid fa-chevron-left"></i>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function selectCategoryFromPage(slug) {
    showView('home');
    const matchingBtn = document.querySelector(`.cat-tab[data-category="${slug}"]`);
    filterCategory(slug, matchingBtn);
}


/* ElectroHomeSY - Main Application & Admin Logic */

let featuredCarouselIndex = 0;
let featuredCarouselTimer = null;
let featuredCarouselProducts = [];
let featuredCarouselDotsCount = 0;

// Static Fallbacks for GitHub Pages static hosting
const FALLBACK_CATEGORIES = [
    { id: 1, name_ar: 'المكاوي وأجهزة البخار', slug: 'irons', icon: 'fa-shirt' },
    { id: 2, name_ar: 'المكانس والتنظيف', slug: 'vacuums', icon: 'fa-broom' },
    { id: 3, name_ar: 'أجهزة المطبخ والطهي', slug: 'kitchen', icon: 'fa-blender' },
    { id: 4, name_ar: 'العناية الشخصية والحلاقة', slug: 'personal-care', icon: 'fa-scissors' },
    { id: 5, name_ar: 'الإضاءة والمنزل والأجهزة الطبية', slug: 'home-living', icon: 'fa-lightbulb' },
    { id: 6, name_ar: 'ماكينات القهوة والكبسولات', slug: 'coffee-machines', icon: 'fa-mug-hot' }
];

// Last-resort product list if both the database and products.json are unreachable.
// Intentionally empty: the old hardcoded list had outdated prices in Syrian pounds shown as dollars.
const FALLBACK_PRODUCTS = [];

// Global State — products are loaded async from the database (or products.json)
let allProducts = [];
let allCategories = [...FALLBACK_CATEGORIES];
let cart = JSON.parse(localStorage.getItem('electro_cart') || '[]');
let currentCustomer = JSON.parse(localStorage.getItem('electro_customer') || 'null');
let selectedPaymentMethod = 'cod';
let currentSelectedProduct = null;
let currentSelectedVariant = null;
let currentView = 'home';
let featuredCarouselHasSlides = true;

// Utility: Format currency in Syrian Pounds (ل.س)
function formatSYP(amount) {
    if (amount === null || amount === undefined || amount === '') return '';
    const n = Number(amount);
    if (isNaN(n)) return '';
    const formatted = n % 1 !== 0 ? n.toFixed(2) : n.toLocaleString('en-US');
    return '$' + formatted;
}

// Utility: Generate unique product code  e.g. EHS-001
function showCustomSuccessModal(title, message, btnText = 'متابعة التسوق 🛍️', onConfirm = null) {
    const oldModal = document.getElementById('customSuccessModalWrapper');
    if (oldModal) oldModal.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'customSuccessModalWrapper';
    wrapper.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeInOverlay 0.3s ease-out forwards;
    `;

    wrapper.innerHTML = `
        <div style="
            background: #ffffff;
            border-radius: 28px;
            max-width: 480px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(226, 232, 240, 0.8);
            transform: scale(0.85);
            opacity: 0;
            animation: modalScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
        ">
            <div style="
                width: 84px;
                height: 84px;
                background: #dcfce7;
                color: #16a34a;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px auto;
                font-size: 2.6rem;
                box-shadow: 0 0 0 10px rgba(220, 252, 231, 0.5);
                animation: pulseIcon 2s infinite;
            ">
                <i class="fa-solid fa-circle-check"></i>
            </div>

            <h3 style="
                font-size: 1.55rem;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 12px 0;
                line-height: 1.3;
            ">${title}</h3>

            <p style="
                font-size: 1rem;
                color: #475569;
                line-height: 1.65;
                margin: 0 0 26px 0;
            ">${message}</p>

            <button type="button" id="btnCustomSuccessOk" style="
                width: 100%;
                background: linear-gradient(135deg, #1e3a8a, #2563eb);
                color: #ffffff;
                border: none;
                padding: 16px;
                font-size: 1.1rem;
                font-weight: 700;
                border-radius: 16px;
                cursor: pointer;
                box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <span>${btnText}</span>
            </button>
        </div>

        <style>
            @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalScaleUp {
                from { opacity: 0; transform: scale(0.85); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes pulseIcon {
                0% { box-shadow: 0 0 0 0 rgba(220, 252, 231, 0.7); }
                70% { box-shadow: 0 0 0 18px rgba(220, 252, 231, 0); }
                100% { box-shadow: 0 0 0 0 rgba(220, 252, 231, 0); }
            }
        </style>
    `;

    document.body.appendChild(wrapper);

    document.getElementById('btnCustomSuccessOk')?.addEventListener('click', () => {
        wrapper.remove();
        if (typeof onConfirm === 'function') onConfirm();
    });
}

function validateSyrianPhoneNumber(phone) {
    if (!phone) return false;
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    const syrianRegex = /^(\+?9639|09|9639|009639)\d{8}$/;
    const generalRegex = /^\+?[0-9]{9,15}$/;
    return syrianRegex.test(clean) || generalRegex.test(clean);
}

function generateProductCode(id) {
    return 'EHS-' + String(id).padStart(3, '0');
}

// Utility: Get product page URL
function getProductUrl(id) {
    return `/p/${id}/`;
}

// Utility: Convert YouTube link to embed format
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
}

// Utility: Get cookie value
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

// Utility: Generate WhatsApp Quick Inquiry Link (+963 959 930 005)
function getWhatsAppInquiryLink(productTitle, productId) {
    const parts = ['963', '959', '930', '005'];
    const phone = parts.join('');
    let msg = `السلام عليكم\nهل متوفر هذا الصنف؟\n*${productTitle}*`;
    if (productId) {
        const productUrl = window.location.origin + getProductUrl(productId);
        msg += `\nالرابط: ${productUrl}`;
    }
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

// Robust Initialization Handling readyState
function checkAndInit() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && window.innerWidth <= 768) searchInput.placeholder = 'ابحث عن جهاز أو ماركة...';

    if (document.getElementById('productsGrid')) {
        initStorefront();
    } else if (searchInput) {
        // Pages without the product grid (product page): send the search to the store
        searchInput.addEventListener('keydown', e => {
            const q = searchInput.value.trim();
            if (e.key === 'Enter' && q) window.location.href = '/?q=' + encodeURIComponent(q);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
} else {
    checkAndInit();
}

function initStorefront() {
    // Dynamic obfuscated phone values
    const p1 = '963';
    const p2 = '959';
    const p3 = '930';
    const p4 = '005';
    const fullPhone = p1 + p2 + p3 + p4;
    
    const waFloating = document.getElementById('wa-floating-link');
    if (waFloating) {
        waFloating.href = `https://wa.me/${fullPhone}?text=${encodeURIComponent('السلام عليكم\nهل متوفر هذا الصنف؟')}`;
    }
    
    const waDisplay = document.getElementById('whatsapp-number-display');
    if (waDisplay) {
        waDisplay.textContent = `+${p1} ${p2} ${p3} ${p4}`;
    }

    updateCartBadge();
    updateUserAuthUI();
    
    // Show category tabs immediately, loading skeleton for products
    renderCategoryTabs(allCategories);
    renderLoadingSkeleton();

    // Load categories immediately from fallback (static hosting)
    allCategories = [...FALLBACK_CATEGORIES];
    renderCategoryTabs(allCategories);

    // Load products immediately from products.json then upgrade from Google Sheets
    fetchProducts('all');

    // Search listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (currentView !== 'home') window.location.hash = '';
            document.querySelectorAll('.cat-tab, .drawer-cat-item').forEach(b => b.classList.toggle('active', b.dataset.category === 'all'));
            renderProducts(allProducts.filter(p =>
                p.title_ar.toLowerCase().includes(query) ||
                (p.brand && p.brand.toLowerCase().includes(query)) ||
                (p.sku && p.sku.toLowerCase().includes(query)) ||
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

    // Toggle active class on mobile bottom nav based on hash & handle SPA view switching
    const updateBottomNavActiveState = () => {
        const hash = window.location.hash;
        
        if (hash === '#cart-section' || hash === '#cart') {
            showView('cart');
            renderCartPage();
        } else if (hash === '#account-section' || hash === '#account') {
            showView('account');
            renderAccountPage();
        } else if (hash === '#categories-section' || hash === '#categories') {
            showView('categories');
            renderCategoriesPage();
        } else {
            showView('home');
            const anchor = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
            if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
        }

        document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item').forEach(item => {
            const href = item.getAttribute('href');
            if (href === '#' || href === '/' || href === '') {
                if (!hash || hash === '#' || hash === '#/') {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            } else if (href === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };
    window.addEventListener('hashchange', updateBottomNavActiveState);
    updateBottomNavActiveState();
}

// User Auth UI State Updates
function updateUserAuthUI() {
    const btnText = document.getElementById('userAuthBtnText');
    const btn = document.getElementById('btnUserAuth');
    if (currentCustomer) {
        if (btnText) btnText.innerText = (currentCustomer.full_name || '').split(' ')[0] || 'حسابي';
        if (btn) btn.classList.add('active-user');
        
        const custNameInput = document.getElementById('custName');
        const custPhoneInput = document.getElementById('custPhone');
        if (custNameInput && !custNameInput.value) custNameInput.value = currentCustomer.full_name;
        if (custPhoneInput && !custPhoneInput.value) custPhoneInput.value = currentCustomer.phone_number;
    } else {
        if (btnText) btnText.innerText = 'حسابي';
        if (btn) btn.classList.remove('active-user');
    }
}

let cameFromCheckout = false;

function openUserAuthModal() {
    if (!document.getElementById('productsGrid')) {
        window.location.href = '/#account-section';
    } else {
        window.location.hash = '#account-section';
    }
}

// Inline Account Page Rendering
function renderAccountPage() {
    const container = document.getElementById('accountSectionContent');
    if (!container) return;

    if (!currentCustomer) {
        // Show login / registration form inline
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="/Logo/ElectroHomeSY-logo-blue.png" alt="ElectroHomeSY" style="height: 55px; margin-bottom: 8px; object-fit: contain;">
                <h3 style="font-size: 1.5rem; font-weight: 900; color: var(--onyx); margin-bottom: 5px;">حفظ بياناتي</h3>
                <p style="color: var(--steel-grey); font-size: 0.9rem; margin-top: 2px;">احفظ اسمك ورقم هاتفك على هذا الجهاز ليتم تعبئتها تلقائياً عند الطلب.</p>
            </div>

            <form id="customerAuthFormInline">
                <div class="form-group" style="margin-bottom: 12px;">
                    <label style="font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; display: block; color: var(--onyx); text-align: right;">الاسم الكامل <span style="color:var(--spark-red)">*</span></label>
                    <input type="text" id="authCustName" class="form-control" placeholder="أدخل اسمك الكريم" required style="padding: 11px; font-size: 0.95rem; border-radius: 12px;">
                </div>
                <div class="form-group" style="margin-bottom: 18px;">
                    <label style="font-size: 0.85rem; font-weight: 700; margin-bottom: 4px; display: block; color: var(--onyx); text-align: right;">رقم الهاتف السوري <span style="color:var(--spark-red)">*</span></label>
                    <input type="tel" id="authCustPhone" class="form-control" placeholder="مثال: 0912345678" required style="padding: 11px; font-size: 0.95rem; border-radius: 12px;">
                </div>

                <button type="submit" class="btn-primary" style="width: 100%; justify-content: center; padding: 13px; font-size: 1rem; margin-bottom: 15px; border-radius: 14px; background: var(--spark-red); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.25);">
                    <i class="fa-solid fa-floppy-disk"></i> حفظ البيانات
                </button>
            </form>

        `;

        // Wire inline form submit listener
        document.getElementById('customerAuthFormInline')?.addEventListener('submit', handleCustomerAuthSubmit);
    } else {
        // Show profile details card
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="width: 80px; height: 80px; background: var(--fog-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <i class="fa-solid fa-circle-user" style="font-size: 4.5rem; color: var(--damascus-green);"></i>
                </div>
                <h3 style="font-size: 1.5rem; font-weight: 800; color: var(--onyx); margin-bottom: 4px;">${currentCustomer.full_name}</h3>
                <p style="font-size: 1rem; color: var(--steel-grey); font-family: monospace;">${currentCustomer.phone_number}</p>
            </div>
            
            <div style="border-top: 1px solid var(--border-color); padding-top: 20px; display: flex; flex-direction: column; gap: 14px;">
                <div style="background: rgba(0,122,61,0.06); border: 1px solid rgba(0,122,61,0.12); padding: 16px; border-radius: 14px; display: flex; align-items: center; gap: 12px; text-align: right;">
                    <i class="fa-solid fa-shield-halved" style="font-size: 1.4rem; color: var(--damascus-green);"></i>
                    <div>
                        <strong style="display: block; font-size: 0.95rem; color: var(--onyx); margin-bottom: 2px;">بياناتك محفوظة على هذا الجهاز</strong>
                        <span style="font-size: 0.82rem; color: var(--steel-grey);">سيتم تعبئة الاسم ورقم الهاتف تلقائياً عند إتمام الطلب</span>
                    </div>
                </div>
                
                <button type="button" onclick="handleLogout()" class="btn-secondary" style="width: 100%; justify-content: center; padding: 13px; font-size: 1.02rem; color: var(--spark-red); border: 1.5px solid var(--spark-red); background: #fff; border-radius: 14px; margin-top: 15px; cursor: pointer; transition: all 0.2s;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> حذف البيانات المحفوظة
                </button>
            </div>
        `;
    }
}

function handleLogout() {
    if (confirm('هل تريد حذف الاسم ورقم الهاتف المحفوظين على هذا الجهاز؟')) {
        currentCustomer = null;
        localStorage.removeItem('electro_customer');
        updateUserAuthUI();
        renderAccountPage();
    }
}

// Customer Auth Submit
async function handleCustomerAuthSubmit(e) {
    e.preventDefault();
    const full_name = document.getElementById('authCustName').value.trim();
    const phone_number = document.getElementById('authCustPhone').value.trim();

    if (!full_name) {
        alert('⚠️ يرجى إدخال اسمك الكريم!');
        return;
    }
    if (!validateSyrianPhoneNumber(phone_number)) {
        alert('⚠️ يرجى إدخال رقم هاتف محمول صحيح! (مثال: 0959930005 أو 963959930005+)');
        return;
    }

    currentCustomer = { id: Date.now(), full_name, phone_number };
        localStorage.setItem('electro_customer', JSON.stringify(currentCustomer));
    updateUserAuthUI();
    
    if (cameFromCheckout) {
        cameFromCheckout = false;
        window.location.hash = '#cart-section';
    } else {
        renderAccountPage();
    }
    alert(`أهلاً بك يا ${currentCustomer.full_name}! تم حفظ بياناتك.`);
}

function openMobileCategoryDrawer() {
    document.getElementById('mobileCategoryDrawerBackdrop')?.classList.add('active');
    document.getElementById('mobileCategoryDrawer')?.classList.add('active');
}

function closeMobileCategoryDrawer() {
    document.getElementById('mobileCategoryDrawerBackdrop')?.classList.remove('active');
    document.getElementById('mobileCategoryDrawer')?.classList.remove('active');
}

function renderCategoryTabs(categories) {
    const tabsContainer = document.getElementById('categoryTabs');
    const drawerList = document.getElementById('drawerCategoryList');

    if (!categories || categories.length === 0) categories = FALLBACK_CATEGORIES;

    // Horizontal Pills
    if (tabsContainer) {
        let pillsHtml = `<button class="cat-tab active" data-category="all" onclick="filterCategory('all', this)"><i class="fa-solid fa-border-all"></i> كافة المنتجات</button>`;
        categories.forEach(cat => {
            pillsHtml += `
                <button class="cat-tab" data-category="${cat.slug}" onclick="filterCategory('${cat.slug}', this)">
                    <i class="fa-solid ${cat.icon || 'fa-tag'}"></i> ${cat.name_ar}
                </button>
            `;
        });
        tabsContainer.innerHTML = pillsHtml;
    }

    // Mobile Sidebar Drawer List
    if (drawerList) {
        let drawerHtml = `
            <div class="drawer-cat-item active" data-category="all" onclick="filterCategory('all', this)">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-border-all" style="color:#2563eb;"></i>
                    <span>كافة المنتجات</span>
                </div>
                <i class="fa-solid fa-chevron-left" style="font-size:0.85rem; opacity:0.6;"></i>
            </div>
        `;
        categories.forEach(cat => {
            drawerHtml += `
                <div class="drawer-cat-item" data-category="${cat.slug}" onclick="filterCategory('${cat.slug}', this)">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid ${cat.icon || 'fa-tag'}" style="color:#2563eb;"></i>
                        <span>${cat.name_ar}</span>
                    </div>
                    <i class="fa-solid fa-chevron-left" style="font-size:0.85rem; opacity:0.6;"></i>
                </div>
            `;
        });
        drawerList.innerHTML = drawerHtml;
    }
}

function filterCategory(slug, btn) {
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.drawer-cat-item').forEach(b => b.classList.remove('active'));

    if (btn) btn.classList.add('active');

    const matchingDrawerItem = document.querySelector(`.drawer-cat-item[data-category="${slug}"]`);
    if (matchingDrawerItem) matchingDrawerItem.classList.add('active');
    const matchingPillItem = document.querySelector(`.cat-tab[data-category="${slug}"]`);
    if (matchingPillItem) matchingPillItem.classList.add('active');

    renderProducts(filterProductsByCategory(allProducts, slug));

    closeMobileCategoryDrawer();

    const targetEl = document.getElementById('productsGrid') || document.getElementById('products-section');
    if (targetEl) {
        const yOffset = -70; 
        const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

function renderLoadingSkeleton() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // Create glassmorphic backdrop-blur overlay wrapper
    grid.innerHTML = `
        <div id="cart-loader-overlay" style="
            grid-column: 1 / -1;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 380px;
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 28px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
            margin: 10px auto;
            width: 100%;
        ">
            <div class="cart-loader">
                <div class="items-container">
                    <div id="item-mobile" class="item"></div>
                    <div id="item-laptop" class="item"></div>
                    <div id="item-tab" class="item"></div>
                    <div id="item-headphone" class="item"></div>
                    <div id="item-mixer" class="item"></div>
                </div>
                <div id="cart-icon"></div>
                <div class="loading-text">
                    جاري تحميل الأجهزة والمنتجات<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                </div>
            </div>
        </div>
    `;

    // Inject CSS for the loader if it does not exist yet
    if (!document.getElementById('cart-loader-styles')) {
        const style = document.createElement('style');
        style.id = 'cart-loader-styles';
        style.textContent = `
            .cart-loader {
              --loader-scale: 1;
              position: relative;
              width: 160px;
              height: 180px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-end;
              transform: scale(var(--loader-scale));
              transform-origin: center center;
            }
            @media (max-width: 768px) {
              .cart-loader { --loader-scale: 0.85; }
            }
            @media (max-width: 480px) {
              .cart-loader { --loader-scale: 0.7; }
            }
            .items-container {
              position: absolute;
              top: 20px;
              left: 0;
              width: 100%;
              height: 100px;
              z-index: 1;
            }
            .item {
              position: absolute;
              opacity: 0;
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              animation: drop-item 4s cubic-bezier(0.3, 0, 0.5, 1) infinite;
            }
            #item-mobile {
              top: -15px;
              left: 58px;
              width: 20px;
              height: 32px;
              --end-rot: -15deg;
              animation-delay: 0.05s;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 36' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='2' y='2' width='20' height='32' rx='3' fill='%233b82f6'/%3E%3Crect x='4' y='4' width='16' height='25' rx='1' fill='%23eff6ff'/%3E%3Ccircle cx='12' cy='31.5' r='1.5' fill='%23eff6ff'/%3E%3C/svg%3E");
            }
            #item-laptop {
              top: -10px;
              left: 70px;
              width: 35px;
              height: 26px;
              --end-rot: 10deg;
              animation-delay: 0.8s;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 40 30' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='6' y='4' width='28' height='18' rx='1' fill='%2364748b'/%3E%3Crect x='8' y='6' width='24' height='14' fill='%23cbd5e1'/%3E%3Cpolygon points='2,24 38,24 40,28 0,28' fill='%23334155' stroke-linejoin='round'/%3E%3C/svg%3E");
            }
            #item-tab {
              top: -20px;
              left: 85px;
              width: 24px;
              height: 32px;
              --end-rot: 25deg;
              animation-delay: 1.6s;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 32 40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='2' y='2' width='28' height='36' rx='2' fill='%23a855f7'/%3E%3Crect x='4' y='4' width='24' height='32' fill='%23faf5ff'/%3E%3C/svg%3E");
            }
            #item-headphone {
              top: -15px;
              left: 58px;
              width: 28px;
              height: 28px;
              --end-rot: -5deg;
              animation-delay: 2.4s;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 6 16 C 6 4, 26 4, 26 16' fill='none' stroke='%23ef4444' stroke-width='4'/%3E%3Crect x='2' y='14' width='8' height='14' rx='4' fill='%23ef4444'/%3E%3Crect x='22' y='14' width='8' height='14' rx='4' fill='%23ef4444'/%3E%3C/svg%3E");
            }
            #item-mixer {
              top: -25px;
              left: 75px;
              width: 26px;
              height: 34px;
              --end-rot: 5deg;
              animation-delay: 3.2s;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 32 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 8 20 L 24 20 L 28 36 L 4 36 Z' fill='%2314b8a6' stroke-linejoin='round'/%3E%3Ccircle cx='16' cy='28' r='4' fill='%23ccfbf1'/%3E%3Cpolygon points='10,20 22,20 24,8 8,8' fill='%23cbd5e1'/%3E%3Crect x='6' y='4' width='20' height='4' rx='2' fill='%230f766e'/%3E%3Cpath d='M 8 10 L 3 10 L 3 18 L 8 18' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linejoin='round'/%3E%3C/svg%3E");
            }
            #cart-icon {
              position: relative;
              z-index: 2;
              width: 140px;
              height: 120px;
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 140 120' width='140' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23334155' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='35' y1='90' x2='110' y2='90' /%3E%3Cline x1='40' y1='90' x2='50' y2='70' /%3E%3Cpolyline points='10,15 25,15 40,30' /%3E%3Cline x1='40' y1='30' x2='50' y2='70' /%3E%3Cline x1='68' y1='30' x2='71' y2='70' /%3E%3Cline x1='96' y1='30' x2='93' y2='70' /%3E%3Cline x1='125' y1='30' x2='115' y2='70' /%3E%3Cline x1='40' y1='30' x2='125' y2='30' /%3E%3Cline x1='43' y1='43' x2='122' y2='43' /%3E%3Cline x1='47' y1='57' x2='118' y2='57' /%3E%3Cline x1='50' y1='70' x2='115' y2='70' /%3E%3Ccircle cx='45' cy='105' r='8' /%3E%3Ccircle cx='105' cy='105' r='8' /%3E%3C/g%3E%3C/svg%3E");
              animation: cart-bounce 0.8s ease-in-out infinite;
              animation-delay: 0.2s;
            }
            .loading-text {
              margin-top: 10px;
              font-size: 16px;
              font-weight: 700;
              color: var(--onyx);
              letter-spacing: 0.5px;
              white-space: nowrap;
              font-family: 'Cairo', sans-serif;
            }
            .dot {
              display: inline-block;
              animation: wave 1.5s infinite;
            }
            .dot:nth-child(1) { animation-delay: 0s; }
            .dot:nth-child(2) { animation-delay: 0.1s; }
            .dot:nth-child(3) { animation-delay: 0.2s; }
            @keyframes drop-item {
              0% { transform: translateY(-20px) scale(0.8) rotate(0deg); opacity: 0; }
              10% { opacity: 1; transform: translateY(20px) scale(1) rotate(calc(var(--end-rot) / 2)); }
              25% { transform: translateY(55px) scale(1) rotate(var(--end-rot)); opacity: 1; }
              35%, 100% { transform: translateY(75px) scale(0.9) rotate(var(--end-rot)); opacity: 0; }
            }
            @keyframes cart-bounce {
              0%, 100% { transform: translateY(0); }
              40% { transform: translateY(2.5px); }
              60% { transform: translateY(0); }
            }
            @keyframes wave {
              0%, 60%, 100% { transform: translateY(0); }
              30% { transform: translateY(-3px); }
            }
        `;
        document.head.appendChild(style);
    }
}

function isProductOutOfStock(product) {
    if (!product) return true;
    const stock = product.stock_quantity !== undefined ? product.stock_quantity
        : (product.variants && product.variants[0] ? product.variants[0].stock_quantity : undefined);
    return stock !== undefined && stock !== null && Number(stock) <= 0;
}

function getProductSellingPrice(product) {
    return Number(product.discount_price) > 0 ? Number(product.discount_price) : Number(product.base_price || 0);
}

function getCategoryNameById(categoryId) {
    const names = {
        1: 'المكاوي وأجهزة البخار',
        2: 'المكانس والتنظيف',
        3: 'أجهزة المطبخ والطهي',
        4: 'العناية الشخصية والحلاقة',
        5: 'الإضاءة والمنزل والأجهزة الطبية',
        6: 'ماكينات القهوة والكبسولات'
    };
    return names[categoryId] || 'عام';
}

const CATEGORY_SLUG_TO_ID = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'personal-care': 4, 'home-living': 5, 'coffee-machines': 6 };

function filterProductsByCategory(products, categorySlug) {
    if (categorySlug === 'all') return products;
    const catId = CATEGORY_SLUG_TO_ID[categorySlug];
    return catId ? products.filter(p => p.category_id === catId) : products;
}

async function fetchProducts(categorySlug = 'all') {
    renderLoadingSkeleton();
    try {
        const products = await loadAllProducts();
        allProducts = products;
        const filtered = filterProductsByCategory(products, categorySlug);
        renderProducts(filtered.length > 0 ? filtered : products);
        renderFeaturedCarousel();
        if (currentView === 'cart') renderCartPage();
        if (currentView === 'categories') renderCategoriesPage();
        const initialQuery = new URLSearchParams(window.location.search).get('q');
        const searchBox = document.getElementById('searchInput');
        if (initialQuery && searchBox && !searchBox.value) {
            searchBox.value = initialQuery;
            searchBox.dispatchEvent(new Event('input'));
        }
        return filtered.length > 0 ? filtered : products;
    } catch (err) {
        console.error('All product sources failed:', err);
        allProducts = [];
        renderFeaturedCarousel();
        const grid = document.getElementById('productsGrid');
        if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--steel-grey);">
            <i class="fa-solid fa-wifi" style="font-size: 3rem; margin-bottom: 15px;"></i>
            <p style="font-size: 1.1rem;">تعذر تحميل المنتجات، يرجى تحديث الصفحة أو التواصل معنا عبر الواتساب.</p>
        </div>`;
        return [];
    }
}

// Product sources, in order: admin panel database (Supabase) -> static products.json
async function loadAllProducts() {
    if (typeof ehsDbConfigured === 'function' && ehsDbConfigured()) {
        try {
            const dbProducts = await ehsFetchProductsFromDb();
            if (dbProducts.length > 0) return dbProducts;
        } catch (dbErr) {
            console.warn('Database products load failed, falling back to products.json:', dbErr);
        }
    }
    const jsonRes = await fetch('./js/products.json?t=' + Date.now());
    if (!jsonRes.ok) throw new Error(`products.json HTTP ${jsonRes.status}`);
    const products = await jsonRes.json();
    if (!products || products.length === 0) throw new Error('products.json is empty');
    return products;
}

// Render Products Grid - Cards open product page in new tab
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--steel-grey);">
            <i class="fa-solid fa-box-open" style="font-size: 3.5rem; margin-bottom: 15px;"></i>
            <p style="font-size: 1.1rem;">لا توجد منتجات متوفرة حالياً في هذا التصنيف.</p>
        </div>`;
        return;
    }

    grid.innerHTML = products.map(p => {
        const priceToShow = p.discount_price ? p.discount_price : p.base_price;
        const hasDiscount = p.discount_price && p.discount_price < p.base_price;
        const waLink = getWhatsAppInquiryLink(p.title_ar, p.id);
        const productUrl = getProductUrl(p.id);
        const outOfStock = isProductOutOfStock(p);

        return `
            <div class="product-card${outOfStock ? ' is-out-of-stock' : ''}">
                ${outOfStock
                    ? `<span class="badge-trendyol-bestseller" style="background:#64748b;">نفدت الكمية</span>`
                    : (hasDiscount ? `<span class="discount-tag">🔥 عروض خـاصة</span>` : '')}
                
                <a href="${productUrl}" target="_blank" rel="noopener">
                    <img src="${p.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${p.title_ar}" class="product-thumb" style="cursor: pointer;" loading="lazy" onerror="this.onerror=null; this.src='/Logo/ElectroHomeSY-logo-blue.png';">
                </a>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span class="product-category-name">
                        ${getCategoryNameById(p.category_id)}
                        ${p.variants && p.variants.length > 0 && p.variants[0].brand && p.variants[0].brand !== 'ElectroHome' 
                            ? `· ${p.variants[0].brand}` 
                            : ''}
                    </span>
                </div>

                <a href="${productUrl}" target="_blank" rel="noopener" style="text-decoration:none; color:inherit;">
                    <h4 class="product-title" style="cursor: pointer;">${p.title_ar}</h4>
                </a>
                
                <div class="product-price-box">
                    <span class="current-price">${formatSYP(priceToShow)}</span>
                    ${hasDiscount ? `<span class="old-price">${formatSYP(p.base_price)}</span>` : ''}
                </div>

                <div class="product-card-actions">
                    <a href="${productUrl}" target="_blank" rel="noopener" class="btn-add-cart" style="text-decoration:none; text-align:center;">
                        <i class="fa-solid fa-bag-shopping"></i> التفاصيل
                    </a>
                    <a href="${waLink}" target="_blank" class="btn-whatsapp-icon-only" title="تواصل سريع عبر الواتساب">
                        <i class="fa-brands fa-whatsapp"></i>
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// Open Product Detail Modal with Static Fallback
function openProductDetail(productId) {
    currentSelectedProduct = allProducts.find(p => p.id === productId) || null;
    
    if (currentSelectedProduct) {
        currentSelectedVariant = currentSelectedProduct.variants && currentSelectedProduct.variants.length > 0 ? currentSelectedProduct.variants[0] : null;
        renderModalContent();
        openModal('productModal');
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
    const waLink = getWhatsAppInquiryLink(product.title_ar, product.id);

    body.innerHTML = `
        <div>
            <img src="${product.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${product.title_ar}" style="width:100%; border-radius:20px; box-shadow:0 12px 30px rgba(0,0,0,0.12);">
            
            ${youtubeEmbed ? `
                <div class="youtube-embed-box">
                    <iframe src="${youtubeEmbed}" title="معاينة الجهاز بالفيديو" allowfullscreen></iframe>
                </div>
            ` : ''}
        </div>
        <div>
            <span style="background:rgba(0,122,61,0.12); color:var(--damascus-green); padding:5px 14px; border-radius:20px; font-size:0.88rem; font-weight:800;">${product.category_name || 'منتج مضمون'}</span>
            ${product.variants && product.variants.length > 0 && product.variants[0].brand && product.variants[0].brand !== 'ElectroHome' 
                ? `<div style="font-size: 0.95rem; color: var(--steel-grey); text-transform: uppercase; font-weight: 700; margin-top: 15px; letter-spacing: 0.5px;">${product.variants[0].brand}</div>` 
                : ''}
            <h2 style="font-size:1.8rem; font-weight:900; margin:${product.variants && product.variants.length > 0 && product.variants[0].brand && product.variants[0].brand !== 'ElectroHome' ? '5px' : '15px'} 0 10px 0;">${product.title_ar}</h2>
            
            <div style="font-size:2rem; font-weight:900; color:var(--damascus-green); margin-bottom:15px;" id="modalPrice">
                ${formatSYP(finalPrice)}
            </div>

            <p style="color:var(--steel-grey); line-height:1.8; margin-bottom:20px; font-size:1.02rem;">${product.description_ar || ''}</p>

            ${product.variants && product.variants.length > 0 ? `
                <div class="variant-selector-box">
                    <div class="variant-title">اختر الماركة والموديل والمواصفات:</div>
                    <div class="variant-options">
                        ${product.variants.map((v) => {
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

function showView(viewName) {
    const isHome = !['cart', 'account', 'categories'].includes(viewName);
    const setDisplay = (el, visible) => { if (el) el.style.display = visible ? 'block' : 'none'; };

    // The hero carousel is hidden on mobile by design (see style.css); it also stays hidden when there is nothing to show
    const hero = document.querySelector('.hero-section');
    setDisplay(hero, isHome && window.innerWidth > 768 && featuredCarouselHasSlides);
    setDisplay(document.querySelector('.benefits-section'), isHome);
    setDisplay(document.getElementById('products-section'), isHome);
    setDisplay(document.getElementById('custom-request-section'), isHome);
    setDisplay(document.getElementById('cart-section'), viewName === 'cart');
    setDisplay(document.getElementById('account-section'), viewName === 'account');
    setDisplay(document.getElementById('categories-section'), viewName === 'categories');
    currentView = isHome ? 'home' : viewName;

    if (!isHome) window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Brings the saved cart in line with the current catalogue: prices follow the admin panel,
// and products that were removed, hidden or sold out are dropped. Returns the removed item names.
function syncCartWithProducts() {
    if (!Array.isArray(cart) || !allProducts || allProducts.length === 0) return [];
    const removed = [];
    cart = cart.filter(item => {
        const product = allProducts.find(p => p.id === item.product_id);
        if (!product || isProductOutOfStock(product)) {
            removed.push(item.product_name);
            return false;
        }
        const modifier = product.variants && item.variant_id
            ? Number((product.variants.find(v => v.id === item.variant_id) || {}).price_modifier) || 0
            : 0;
        item.unit_price = getProductSellingPrice(product) + modifier;
        item.product_name = product.title_ar;
        item.main_image = product.main_image || item.main_image;
        return true;
    });
    localStorage.setItem('electro_cart', JSON.stringify(cart));
    updateCartBadge();
    return removed;
}

function renderCartPage() {
    const list = document.getElementById('cartItemsList');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    if (!list || !totalPriceEl) return;

    const removedItems = syncCartWithProducts();

    const removedNotice = removedItems.length
        ? `<p style="background:#fef3c7; color:#92400e; padding:10px 14px; border-radius:12px; font-size:0.9rem; margin-bottom:12px;">تمت إزالة منتجات لم تعد متوفرة من السلة: ${removedItems.join('، ')}</p>`
        : '';

    if (!cart || cart.length === 0) {
        list.innerHTML = removedNotice + `<p style="text-align:center; padding:35px; color:var(--steel-grey); font-size:1.05rem; font-family:'Cairo',sans-serif;">السلة فارغة حالياً. أضف بعض المنتجات للتسوق!</p>`;
        totalPriceEl.innerText = formatSYP(0);
        return;
    }

    let total = 0;
    list.innerHTML = removedNotice + cart.map((item, index) => {
        const itemPrice = Number(item.unit_price) || 0;
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-product-item">
                <div class="cart-product-image-wrapper" style="width:60px; height:60px; border-radius:12px; border:1px solid var(--border-color); background:#ffffff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                    <img src="${item.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${item.product_name}" style="max-width:100%; max-height:100%; object-fit:contain; padding:4px;" onerror="this.onerror=null; this.src='/Logo/ElectroHomeSY-logo-blue.png';">
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

function renderCartModal() {
    if (!document.getElementById('productsGrid')) {
        window.location.href = '/#cart-section';
    } else {
        window.location.hash = '#cart-section';
    }
}

function changeQty(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        renderCartPage();
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartPage();
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method-card').forEach(card => {
        if (card.dataset.method === method) card.classList.add('selected');
        else card.classList.remove('selected');
    });
}

// Checkout Submit - Enforces Customer Login Requirement

// Helper: Send order email notification & record in Google Sheets (Rich HTML & 100% Arabic)
async function sendOrderEmailNotification(orderData) {
    const itemsFormattedText = (orderData.items || []).map((item, idx) => {
        const pLink = `https://electrohomesy.com/product.html?id=${item.product_id}`;
        return `${idx + 1}. ${item.product_name} (${item.variant_details || 'افتراضي'}) | الكمية: ${item.quantity} | السعر: $${((item.unit_price || 0) * item.quantity).toFixed(2)}\nرابط المنتج: ${pLink}`;
    }).join('\n\n');

    const htmlItemsFormatted = (orderData.items || []).map((item, idx) => {
        const pLink = `https://electrohomesy.com/product.html?id=${item.product_id}`;
        return `
        <div style="padding: 12px; margin-bottom: 10px; background: #f8fafc; border-radius: 8px; border-right: 4px solid #2563eb;">
            <div style="font-weight: bold; font-size: 15px; color: #0f172a;">${idx + 1}. ${item.product_name}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">المواصفات: ${item.variant_details || 'افتراضي'}</div>
            <div style="font-size: 14px; font-weight: bold; color: #16a34a; margin-top: 4px;">الكمية: ${item.quantity} | السعر الإجمالي: $${((item.unit_price || 0) * item.quantity).toFixed(2)}</div>
            <div style="margin-top: 6px;">
                <a href="${pLink}" target="_blank" style="display: inline-block; padding: 6px 14px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold;">🔗 فتح صفحة المنتج للمعاينة</a>
            </div>
        </div>
        `;
    }).join('');

    const payload = {
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address || 'دمشق',
        payment_method: orderData.payment_method === 'cash' ? 'الدفع عند الاستلام' : orderData.payment_method,
        total_amount: (orderData.total_amount || 0).toFixed(2),
        items: itemsFormattedText,
        html_items: htmlItemsFormatted,
        date: new Date().toLocaleString('ar-SY')
    };

    const webhook = window.EHS_CONFIG ? window.EHS_CONFIG.ORDER_EMAIL_WEBHOOK : '';
    if (!webhook) return;
    try {
        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
        console.log('Order notification sent in Arabic HTML with product links!');
    } catch (e) {
        console.warn('Google Sheets Webhook Notice:', e);
    }
}

// Helper: Send special product request email notification & record in Google Sheets
async function sendProductRequestEmailNotification(reqData) {
    const htmlItems = `
    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; border-right: 4px solid #ef4444;">
        <div style="font-weight: bold; font-size: 15px; color: #0f172a;">الجهاز المطلوب: ${reqData.requested_product}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">ملاحظات الزبون: ${reqData.notes || 'لا يوجد'}</div>
    </div>
    `;

    const payload = {
        customer_name: reqData.customer_name,
        customer_phone: reqData.customer_phone,
        delivery_address: 'طلب جهاز خاص',
        payment_method: 'طلب جهاز خاص',
        total_amount: '0.00',
        items: `طلب جهاز خاص: ${reqData.requested_product}\nملاحظات: ${reqData.notes || 'لا يوجد'}`,
        html_items: htmlItems,
        date: new Date().toLocaleString('ar-SY')
    };

    const webhook = window.EHS_CONFIG ? window.EHS_CONFIG.ORDER_EMAIL_WEBHOOK : '';
    if (!webhook) return;
    try {
        await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        });
    } catch (e) {}
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const removedBeforeCheckout = syncCartWithProducts();
    if (removedBeforeCheckout.length) {
        renderCartPage();
        alert('⚠️ تمت إزالة منتجات لم تعد متوفرة من السلة، يرجى مراجعة الطلب قبل الإرسال.');
        return;
    }
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    const nameInput = document.getElementById('custName');
    const phoneInput = document.getElementById('custPhone');
    const addressInput = document.getElementById('custAddress');

    const customer_name = (nameInput ? nameInput.value.trim() : '') || (currentCustomer ? currentCustomer.full_name : '');
    const customer_phone = (phoneInput ? phoneInput.value.trim() : '') || (currentCustomer ? currentCustomer.phone_number : '');
    const delivery_address = (addressInput ? addressInput.value.trim() : '') || 'دمشق';

    if (!customer_name) {
        alert('⚠️ يرجى إدخال اسمك الكريم لإتمام الطلب!');
        if (nameInput) nameInput.focus();
        return;
    }

    if (!validateSyrianPhoneNumber(customer_phone)) {
        alert('⚠️ يرجى إدخال رقم هاتف محمول صحيح للتواصل عند التسليم! (مثال: 0959930005 أو 963959930005+)');
        if (phoneInput) phoneInput.focus();
        return;
    }

    if (!delivery_address) {
        alert('⚠️ يرجى إدخال عنوان التوصيل بالتفصيل في دمشق!');
        if (addressInput) addressInput.focus();
        return;
    }

    const total_amount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const orderPayload = {
        customer_id: currentCustomer ? currentCustomer.id : null,
        customer_name,
        customer_phone,
        delivery_address,
        payment_method: typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : 'cash',
        total_amount,
        items: [...cart]
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...';
    }

    // Save the order to the admin panel database, then send the e-mail notification
    if (typeof ehsDbConfigured === 'function' && ehsDbConfigured()) {
        try {
            await ehsSubmitOrderToDb(orderPayload);
        } catch (err) {
            // The e-mail notification below still delivers the order
            console.error('Order save failed:', err);
        }
    }
    await sendOrderEmailNotification(orderPayload);

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
    }

    cart = [];
    saveCart();
    window.location.hash = '';

    showCustomSuccessModal(
        '🎉 تم استلام طلبكم بنجاح!',
        'شكراً لثقتكم بمتجر ElectroHomeSY. تم توثيق بيانات الطلب بنجاح وسيتواصل معكم فريق المبيعات قريباً لتأكيد التوصيل في دمشق.',
        'متابعة التسوق 🛍️',
        () => { showView('home'); }
    );
}

async function handleRequestSubmit(e) {
    e.preventDefault();
    const customer_name = document.getElementById('reqName').value.trim();
    const customer_phone = document.getElementById('reqPhone').value.trim();
    const requested_product = document.getElementById('reqProduct').value.trim();
    const notes = document.getElementById('reqNotes').value.trim();

    if (!validateSyrianPhoneNumber(customer_phone)) {
        alert('⚠️ يرجى إدخال رقم هاتف محمول صحيح للتواصل معك! (مثال: 0959930005 أو 963959930005+)');
        return;
    }

    const reqPayload = { customer_name, customer_phone, requested_product, notes };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...';
    }

    if (typeof ehsDbConfigured === 'function' && ehsDbConfigured()) {
        try {
            await ehsSubmitRequestToDb(reqPayload);
        } catch (err) {
            console.error('Product request save failed:', err);
        }
    }
    await sendProductRequestEmailNotification(reqPayload);

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
    }

    document.getElementById('productRequestForm').reset();
    closeModal('requestModal');

    showCustomSuccessModal(
        '✨ تم استلام طلبك الخاص بنجاح!',
        'تم تسجيل طلب الجهاز والتفاصيل بنجاح. وسيقوم فريق إلكتروهومسي بتوفير الجهاز والتواصل معكم بأسرع وقت.',
        'تم، شكراً 👍'
    );
}

// Featured Carousel Functions
function renderFeaturedCarousel() {
    const track = document.getElementById('featuredCarouselTrack');
    const indicators = document.getElementById('featuredCarouselIndicators');
    const container = document.getElementById('featuredCarouselContainer');
    if (!track || !indicators || !container) return;

    featuredCarouselProducts = allProducts.filter(p => p.is_featured === 1);
    
    if (featuredCarouselProducts.length === 0) {
        featuredCarouselProducts = allProducts.slice(0, 5);
    }

    featuredCarouselHasSlides = featuredCarouselProducts.length > 0;
    const hs = document.querySelector('.hero-section');
    if (hs) hs.style.display = (currentView === 'home' && window.innerWidth > 768 && featuredCarouselHasSlides) ? 'block' : 'none';
    if (!featuredCarouselHasSlides) return;

    track.innerHTML = featuredCarouselProducts.map(p => {
        const finalPrice = p.discount_price ? p.discount_price : p.base_price;
        const discountTag = p.discount_price && p.discount_price < p.base_price 
            ? `<div class="discount-tag">خصم ${Math.round((1 - p.discount_price/p.base_price)*100)}%</div>` 
            : '';
        const productUrl = getProductUrl(p.id);

        return `
            <div class="carousel-slide">
                <div class="featured-product-card">
                    ${discountTag}
                    <a href="${productUrl}" target="_blank" rel="noopener" class="product-thumb-wrapper" style="cursor:pointer; text-align:center; display:block;">
                        <img class="product-thumb" src="${p.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${p.title_ar}" onerror="this.onerror=null; this.src='/Logo/ElectroHomeSY-logo-blue.png';">
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

    let cols = 3;
    if (window.innerWidth <= 576) cols = 1;
    else if (window.innerWidth <= 992) cols = 2;

    const maxIndex = Math.max(0, featuredCarouselProducts.length - cols);
    
    // Render indicator dots
    const dotsCount = maxIndex + 1;
    indicators.innerHTML = '';
    if (dotsCount > 1) {
        for (let i = 0; i < dotsCount; i++) {
            indicators.innerHTML += `<div class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToFeaturedSlide(${i})"></div>`;
        }
    }

    featuredCarouselIndex = 0;
    track.style.transform = 'translateX(0px)';

    featuredCarouselDotsCount = dotsCount;
    startFeaturedAutoSlide(dotsCount);

    // Pause on hover (listeners are attached once; the dot count is read at event time)
    if (!container.dataset.hoverBound) {
        container.dataset.hoverBound = '1';
        container.addEventListener('mouseenter', () => stopFeaturedAutoSlide());
        container.addEventListener('mouseleave', () => startFeaturedAutoSlide(featuredCarouselDotsCount));
    }
}

// Re-layout the carousel (and hero visibility) when the screen size crosses a breakpoint
let featuredResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(featuredResizeTimer);
    featuredResizeTimer = setTimeout(() => {
        if (!document.getElementById('featuredCarouselTrack') || !allProducts.length) return;
        renderFeaturedCarousel();
    }, 250);
});

function startFeaturedAutoSlide(dotsCount) {
    stopFeaturedAutoSlide();
    if (dotsCount <= 1) return;
    featuredCarouselTimer = setInterval(() => {
        moveFeaturedCarousel(1);
    }, 3500);
}

function stopFeaturedAutoSlide() {
    if (featuredCarouselTimer) {
        clearInterval(featuredCarouselTimer);
        featuredCarouselTimer = null;
    }
}

function moveFeaturedCarousel(dir) {
    const track = document.getElementById('featuredCarouselTrack');
    if (!track || featuredCarouselProducts.length === 0) return;

    let cols = 3;
    if (window.innerWidth <= 576) cols = 1;
    else if (window.innerWidth <= 992) cols = 2;

    const maxIndex = Math.max(0, featuredCarouselProducts.length - cols);
    if (maxIndex === 0) return;

    featuredCarouselIndex += dir;
    if (featuredCarouselIndex > maxIndex) {
        featuredCarouselIndex = 0;
    } else if (featuredCarouselIndex < 0) {
        featuredCarouselIndex = maxIndex;
    }

    goToFeaturedSlide(featuredCarouselIndex);
}

function goToFeaturedSlide(index) {
    const track = document.getElementById('featuredCarouselTrack');
    const dots = document.querySelectorAll('.carousel-dot');
    if (!track) return;

    featuredCarouselIndex = index;

    const cardWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width : 0;
    const translateVal = featuredCarouselIndex * (cardWidth + 20);

    track.style.transform = `translateX(${translateVal}px)`;

    dots.forEach((dot, i) => {
        if (i === index) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}




function switchProductMainImage(el) {
    if (!el) return;
    const imgUrl = el.getAttribute('data-img') || (typeof el === 'string' ? el : '');
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg && imgUrl) {
        mainImg.style.transition = 'opacity 0.2s ease-in-out';
        mainImg.style.opacity = '0.4';
        mainImg.src = imgUrl;
        setTimeout(() => { mainImg.style.opacity = '1'; }, 120);
    }
    document.querySelectorAll('.thumbnail-item').forEach(item => {
        item.classList.remove('active');
        item.style.borderColor = 'var(--border-color)';
        item.style.boxShadow = 'none';
    });
    if (el && el.classList) {
        el.classList.add('active');
        el.style.borderColor = 'var(--damascus-green)';
        el.style.boxShadow = '0 4px 14px rgba(0, 122, 61, 0.3)';
    }
}
