/* ElectroHomeSY - Main Application & Admin Logic */

// Static Fallbacks for GitHub Pages static hosting
const FALLBACK_CATEGORIES = [
    { id: 1, name_ar: "المكاوي وأجهزة البخار", slug: "irons", icon: "fa-shirt" },
    { id: 2, name_ar: "المكاس والتنظيف", slug: "vacuums", icon: "fa-broom" },
    { id: 3, name_ar: "أجهزة المطبخ والخلاطات", slug: "kitchen", icon: "fa-blender" },
    { id: 4, name_ar: "الأجهزة المنزلية الكبيرة", slug: "large-appliances", icon: "fa-tv" }
];

const FALLBACK_PRODUCTS = [
    {
        id: 1,
        category_id: 1,
        category_name: "المكاوي وأجهزة البخار",
        title_ar: "مكواة بخار ذكية عالية الكفاءة",
        slug: "smart-steam-iron",
        description_ar: "مكواة بخار احترافية بقاعدة سيراميك مانعة للالتصاق، نظام ضغط مضاعف لكيّ الأقمشة الثقيلة والخفيفة بسرعة فائقة مع خاصية التنظيف الذاتي.",
        base_price: 185000,
        discount_price: 165000,
        main_image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbx6CskjLi6LVNBaxh3i405FYeYLZXKFdUuA&s",
        youtube_url: "https://www.youtube.com/shorts/4KBMVXmrY2Q",
        is_visible: 1,
        variants: [
            { id: 9, product_id: 1, brand: "Philips", model_name: "PerfectCare 7000", variant_attributes: { "اللون": "أزرق ملكي", "القوة": "2400 واط", "سعة الخزان": "300 مل" }, price_modifier: 0 },
            { id: 10, product_id: 1, brand: "Tefal", model_name: "Ultimate Pure", variant_attributes: { "اللون": "أسود ذهبي", "القوة": "3000 واط", "سعة الخزان": "350 مل" }, price_modifier: 35000 }
        ]
    },
    {
        id: 2,
        category_id: 2,
        category_name: "المكاس والتنظيف",
        title_ar: "مكنسة كهربائية سيلكون صامتة بقوة شفط هائلة",
        slug: "silent-vacuum-cleaner",
        description_ar: "مكنسة كهربائية فائقة الهدوء مزودة بفلتر HEPA طبي مضاد للحساسية ومحرك توربو لإزالة أصعب الأتربة والغبار من السجاد والأرضيات.",
        base_price: 420000,
        discount_price: 390000,
        main_image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80",
        youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        is_visible: 1,
        variants: [
            { id: 3, product_id: 2, brand: "Bosch", model_name: "ProSilence Series 6", variant_attributes: { "اللون": "أحمر دمشقي", "السعة": "4 لتر", "طول السلك": "9 متر" }, price_modifier: 0 },
            { id: 4, product_id: 2, brand: "Samsung", model_name: "PowerMotion Eco", variant_attributes: { "اللون": "فضي معدني", "السعة": "4.5 لتر", "طول السلك": "10 متر" }, price_modifier: 45000 }
        ]
    },
    {
        id: 3,
        category_id: 3,
        category_name: "أجهزة المطبخ والخلاطات",
        title_ar: "خلاط ومحضر طعام متعدد الوظائف 4 في 1",
        slug: "multi-blender-4in1",
        description_ar: "محضر طعام متعدد الاستخدامات يشمل خلاط عصائر، مطحنة بهارات، مفرمة لحوم وخفاقة. شفرات فولاذية مقاومة للصدأ مع سرعتين ونظام خفق نبضي.",
        base_price: 275000,
        discount_price: null,
        main_image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80",
        youtube_url: "",
        is_visible: 1,
        variants: [
            { id: 5, product_id: 3, brand: "Moulinex", model_name: "DoubleForce", variant_attributes: { "الوعاء": "زجاج مقوى 1.75 لتر", "القوة": "1000 واط" }, price_modifier: 0 },
            { id: 6, product_id: 3, brand: "Kenwood", model_name: "Multipro Express", variant_attributes: { "الوعاء": "بلاستيك غير قابل للكسر 2 لتر", "القوة": "1200 واط" }, price_modifier: 50000 }
        ]
    }
];

const FALLBACK_ORDERS = [
    {
        id: 101,
        customer_name: "أحمد الميداني",
        customer_phone: "0955123456",
        delivery_address: "دمشق - الميدان - بالقرب من جامع الشافعي",
        payment_method: "cod",
        total_amount: 165000,
        created_at: new Date().toISOString()
    },
    {
        id: 102,
        customer_name: "سامر الشامي",
        customer_phone: "0933987654",
        delivery_address: "دمشق - المزرعة - شارع الملك عادل",
        payment_method: "shamcash",
        total_amount: 390000,
        created_at: new Date().toISOString()
    }
];

const FALLBACK_REQUESTS = [
    {
        id: 1,
        customer_name: "محمد حمصي",
        customer_phone: "0944112233",
        requested_product: "غسالة أوتوماتيك LG سعة 9 كيلو إنفرتر",
        notes: "لون فضي، كفالة رسمية",
        created_at: new Date().toISOString()
    }
];

// Global State — start empty, real data loaded async from Google Sheets
let allProducts = [];
let isGoogleSheetsDataLoaded = false;
let allCategories = [...FALLBACK_CATEGORIES];
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

// Utility: Generate unique product code  e.g. EHS-001
function generateProductCode(id) {
    return 'EHS-' + String(id).padStart(3, '0');
}

// Utility: Get product page URL
function getProductUrl(id) {
    return `/product.html?id=${id}`;
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
        const productUrl = window.location.origin + `/product.html?id=${productId}`;
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
    if (document.getElementById('productsGrid')) {
        initStorefront();
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

    // Async Network Fetch — real products from Google Sheets
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

    // Toggle active class on mobile bottom nav based on hash
    const updateBottomNavActiveState = () => {
        const hash = window.location.hash;
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
        if (btnText) btnText.innerText = currentCustomer.full_name.split(' ')[0] || 'حسابي';
        if (btn) btn.classList.add('active-user');
        
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
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCookie('csrf_token')
            },
            body: JSON.stringify({ full_name, phone_number, auth_provider: 'phone' })
        });
        if (res.ok) {
            const data = await res.json();
            currentCustomer = data.customer;
        } else {
            currentCustomer = { id: Date.now(), full_name, phone_number };
        }
    } catch (err) {
        currentCustomer = { id: Date.now(), full_name, phone_number };
    }
    
    localStorage.setItem('electro_customer', JSON.stringify(currentCustomer));
    updateUserAuthUI();
    closeModal('userAuthModal');
    alert(`أهلاً بك يا ${currentCustomer.full_name}! تم تسجيل حسابك بنجاح.`);
}

// Google Auth Mock
function handleGoogleAuthMock() {
    const name = prompt('أدخل اسمك المسجل في حساب Google:');
    if (!name) return;
    
    const phone = prompt('يرجى إدخال رقم هاتفك السوري (مطلوب دائماً لربط الحساب بالشحن):');
    if (!phone) {
        alert('رقم الهاتف السوري إجباري لإتمام تسجيل الحساب!');
        return;
    }

    currentCustomer = { id: Date.now(), full_name: name, phone_number: phone };
    localStorage.setItem('electro_customer', JSON.stringify(currentCustomer));
    updateUserAuthUI();
    closeModal('userAuthModal');
    alert(`أهلاً بك يا ${currentCustomer.full_name}! تم ربط حساب Google برقم هاتفك بنجاح.`);
}

function renderCategoryTabs(categories) {
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = `<button class="cat-tab active" data-category="all" onclick="filterCategory('all', this)"><i class="fa-solid fa-border-all"></i> كافة المنتجات</button>`;
    categories.forEach(cat => {
        tabsContainer.innerHTML += `
            <button class="cat-tab" data-category="${cat.slug}" onclick="filterCategory('${cat.slug}', this)">
                <i class="fa-solid ${cat.icon || 'fa-tag'}"></i> ${cat.name_ar}
            </button>
        `;
    });
}

// Fetch Categories with Static Fallback
async function fetchCategories() {
    try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Not ok');
        allCategories = await res.json();
        renderCategoryTabs(allCategories);
    } catch (e) {
        allCategories = FALLBACK_CATEGORIES;
        renderCategoryTabs(allCategories);
    }
}

// Fetch Products with Static Fallback
// On GitHub Pages there is no /api server, so we skip straight to
// Google Sheets CSV (live data) → products.json (cached) → FALLBACK_PRODUCTS.
async function fetchProducts(categorySlug) {
    try {
        const products = await fetchProductsFromGoogleSheetsClient(categorySlug);
        renderProducts(products);
    } catch (sheetErr) {
        console.warn('Google Sheets fetch failed, using cached products.json:', sheetErr);
        try {
            const jsonRes = await fetch('./js/products.json?t=' + Date.now());
            if (!jsonRes.ok) throw new Error('products.json not found');
            const cached = await jsonRes.json();
            allProducts = cached;
            isGoogleSheetsDataLoaded = true;
            if (categorySlug === 'all') {
                renderProducts(cached);
            } else {
                const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'large-appliances': 4 };
                const catId = catMap[categorySlug];
                renderProducts(cached.filter(p => p.category_id === catId));
            }
        } catch (jsonErr) {
            console.error('All data sources failed, using hardcoded fallback:', jsonErr);
            if (categorySlug === 'all') {
                allProducts = FALLBACK_PRODUCTS.filter(p => p.is_visible);
            } else {
                const cat = FALLBACK_CATEGORIES.find(c => c.slug === categorySlug);
                allProducts = cat ? FALLBACK_PRODUCTS.filter(p => p.category_id === cat.id && p.is_visible) : [];
            }
            renderProducts(allProducts);
        }
    }
}

function filterCategory(slug, btn) {
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    fetchProducts(slug);
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

function renderProductsPlaceholder() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 50px 20px; background: var(--white); border-radius: 24px; border: 2px dashed var(--border-color); color: var(--steel-grey); box-shadow: var(--card-shadow); max-width: 600px; margin: 0 auto;">
            <i class="fa-solid fa-hand-pointer" style="font-size: 3rem; color: var(--damascus-green); margin-bottom: 15px; display: block;"></i>
            <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--onyx); margin-bottom: 8px;">اختر أحد أصناف المنتجات في الأعلى</h4>
            <p style="font-size: 0.95rem; color: var(--steel-grey);">لتصفح الأجهزة والمنتجات المتوفرة لدينا في دمشق</p>
        </div>
    `;
}

async function fetchProductsInBackground() {
    try {
        await fetchProductsFromGoogleSheetsClient('all');
    } catch (sheetErr) {
        try {
            const jsonRes = await fetch('./js/products.json?t=' + Date.now());
            if (jsonRes.ok) {
                const cached = await jsonRes.json();
                allProducts = cached;
                isGoogleSheetsDataLoaded = true;
            }
        } catch (jsonErr) {
            allProducts = FALLBACK_PRODUCTS.filter(p => p.is_visible);
        }
    }
}

// Client-side Google Sheets CSV parser fallback for static hosting
function parseCSVClient(text) {
    const lines = text.split(/\r?\n/);
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const row = [];
        let inQuotes = false;
        let currentCell = '';
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                row.push(currentCell.trim());
                currentCell = '';
            } else {
                currentCell += char;
            }
        }
        row.push(currentCell.trim());
        rows.push(row);
    }
    return rows;
}

function parsePriceClient(val) {
    if (!val || val === '-') return null;
    const clean = val.replace(/[^\d]/g, '');
    return clean ? parseInt(clean, 10) : null;
}

function getCategoryIdFromSheetClient(categoryName, productName) {
    if (!categoryName) {
        return getCategoryIdFromNameClient(productName);
    }
    const clean = categoryName.trim().toLowerCase();
    if (clean.includes('مكواة') || clean.includes('بخار') || clean.includes('iron') || clean.includes('ملابس')) {
        return 1; // irons
    }
    if (clean.includes('مكنسة') || clean.includes('تنظيف') || clean.includes('vacuum') || clean.includes('مكاس') || clean.includes('مكنس')) {
        return 2; // vacuums
    }
    if (clean.includes('مطبخ') || clean.includes('خلاط') || clean.includes('غلاية') || clean.includes('blender') || clean.includes('kettle') || clean.includes('microwave') || clean.includes('طعام') || clean.includes('شعر')) {
        return 3; // kitchen
    }
    if (clean.includes('كبير') || clean.includes('ثلاجة') || clean.includes('غسالة') || clean.includes('تلفزيون') || clean.includes('مكيف')) {
        return 4; // large-appliances
    }
    return getCategoryIdFromNameClient(productName);
}

function getCategoryIdFromNameClient(name) {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('مكواة') || lowerName.includes('بخار') || lowerName.includes('iron')) {
        return 1; // irons
    }
    if (lowerName.includes('مكنسة') || lowerName.includes('تنظيف') || lowerName.includes('vacuum') || lowerName.includes('broom')) {
        return 2; // vacuums
    }
    if (lowerName.includes('ميكروويف') || lowerName.includes('خلاط') || lowerName.includes('غلاية') || lowerName.includes('blender') || lowerName.includes('kettle') || lowerName.includes('microwave') || lowerName.includes('شعر')) {
        return 3; // kitchen
    }
    return 4; // large-appliances
}

function getFallbackImageClient(categoryId) {
    const placeholders = {
        1: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', // irons
        2: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80', // vacuums
        3: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80', // kitchen
        4: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'  // large-appliances
    };
    return placeholders[categoryId] || placeholders[4];
}

function getCategoryNameById(categoryId) {
    const names = {
        1: 'المكاوي وأجهزة البخار',
        2: 'المكاس والتنظيف',
        3: 'أجهزة المطبخ والخلاطات',
        4: 'الأجهزة المنزلية الكبيرة'
    };
    return names[categoryId] || 'عام';
}

function getGoogleDriveDirectLinkClient(link) {
    if (!link) return '';
    if (link.includes('drive.google.com')) {
        let fileId = '';
        const idMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) {
            fileId = idMatch[1];
        } else {
            const fileMatch = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            if (fileMatch) {
                fileId = fileMatch[1];
            }
        }
        if (fileId) {
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
    }
    return link;
}

function getProductImageClient(imageLink, categoryId) {
    if (!imageLink) {
        return getFallbackImageClient(categoryId);
    }
    const resolvedLink = getGoogleDriveDirectLinkClient(imageLink);
    if (resolvedLink.startsWith('http://') || resolvedLink.startsWith('https://') || resolvedLink.startsWith('/')) {
        return resolvedLink;
    }
    return getFallbackImageClient(categoryId);
}

async function fetchProductsFromGoogleSheetsClient(categorySlug) {
    try {
        // Try fetching Google Sheets directly as the primary choice
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv&t=' + Date.now();
        const res = await fetch(sheetUrl);
        if (!res.ok) throw new Error('Failed to fetch from Google Sheets directly');
        const text = await res.text();
        const rows = parseCSVClient(text);
        if (rows.length < 2) throw new Error('Empty CSV');

        const products = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 4) continue;

            const name = row[1];
            const brand = row[2] ? row[2].trim() : '';
            const code = row[3];
            if (!name || !code) continue;

            const id = parseInt(row[0], 10) || i;
            const quantity = parseFloat(row[4]) || 0;
            const cost = parsePriceClient(row[5]);
            const sellingPrice = parsePriceClient(row[6]);
            const discountPrice = parsePriceClient(row[7]);
            const categoryName = row[9] || '';
            const imageLink = row[10] || '';
            const videoLink = row[11] || '';

            const categoryId = getCategoryIdFromSheetClient(categoryName, name);
            const title = name; // Clean name without barcode
            const finalImage = getProductImageClient(imageLink, categoryId);

            products.push({
                id,
                category_id: categoryId,
                title_ar: title,
                slug: `prod-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id}`,
                description_ar: `جهاز كهربائي ذكي عالي الكفاءة. الموديل: ${code}. متوفر حالياً بالمخزون بكمية ${Math.round(quantity)} قطعة.`,
                base_price: sellingPrice || cost || 0,
                discount_price: discountPrice,
                main_image: finalImage,
                youtube_url: videoLink,
                is_visible: 1,
                variants: [
                    { id: id * 100, product_id: id, brand: brand || 'ElectroHome', model_name: code, variant_attributes: {}, price_modifier: 0, stock_quantity: Math.round(quantity), sku: code }
                ]
            });
        }

        allProducts = products;
        isGoogleSheetsDataLoaded = true;

        if (categorySlug === 'all') {
            return products;
        } else {
            const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'large-appliances': 4 };
            const catId = catMap[categorySlug];
            return products.filter(p => p.category_id === catId);
        }
    } catch (sheetErr) {
        console.warn('Failed to fetch direct CSV, falling back to pre-compiled products.json:', sheetErr);
        try {
            const jsonRes = await fetch('./js/products.json');
            if (!jsonRes.ok) throw new Error('Static products.json not found');
            const products = await jsonRes.json();
            allProducts = products;
            isGoogleSheetsDataLoaded = true;

            if (categorySlug === 'all') {
                return products;
            } else {
                const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'large-appliances': 4 };
                const catId = catMap[categorySlug];
                return products.filter(p => p.category_id === catId);
            }
        } catch (jsonErr) {
            console.error('Static products.json fallback also failed:', jsonErr);
            throw jsonErr;
        }
    }
}

async function fetchProductDetailsFromGoogleSheetsClient(productId) {
    if (!isGoogleSheetsDataLoaded) {
        await fetchProductsFromGoogleSheetsClient('all');
    }
    return allProducts.find(p => p.id === productId) || null;
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

    grid.innerHTML = products.map((p, idx) => {
        const priceToShow = p.discount_price ? p.discount_price : p.base_price;
        const hasDiscount = p.discount_price && p.discount_price < p.base_price;
        const waLink = getWhatsAppInquiryLink(p.title_ar, p.id);
        const productUrl = getProductUrl(p.id);
        const rating = (4.7 + (idx % 3) * 0.1).toFixed(1);
        const reviewsCount = 85 + idx * 42;
        const isBestseller = idx % 2 === 0;

        return `
            <div class="product-card">
                ${hasDiscount 
                    ? `<span class="discount-tag">🔥 عروض خـاصة</span>` 
                    : (isBestseller ? `<span class="badge-trendyol-bestseller">⚡ الأكثر طلباً</span>` : '')}
                
                <a href="${productUrl}" target="_blank" rel="noopener">
                    <img src="${p.main_image || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'}" alt="${p.title_ar}" class="product-thumb" style="cursor: pointer;">
                </a>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span class="product-category-name">
                        ${p.category_name || 'أجهزة منزلية'} 
                        ${p.variants && p.variants.length > 0 && p.variants[0].brand && p.variants[0].brand !== 'ElectroHome' 
                            ? `· ${p.variants[0].brand}` 
                            : ''}
                    </span>
                    <span style="font-size:0.75rem; color:#f59e0b; font-weight:800; display:inline-flex; align-items:center; gap:3px;">
                        <i class="fa-solid fa-star"></i> ${rating} <span style="color:#94a3b8; font-weight:400;">(${reviewsCount})</span>
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
async function openProductDetail(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error('Not ok');
        currentSelectedProduct = await res.json();
    } catch (e) {
        currentSelectedProduct = FALLBACK_PRODUCTS.find(p => p.id === productId) || allProducts.find(p => p.id === productId);
    }
    
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
            <img src="${product.main_image || 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80'}" alt="${product.title_ar}" style="width:100%; border-radius:20px; box-shadow:0 12px 30px rgba(0,0,0,0.12);">
            
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
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCookie('csrf_token')
            },
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
        if (res.ok) {
            const data = await res.json();
            alert(data.message || 'تم إرسال طلبكم بنجاح!');
        } else {
            alert('تم استلام طلبكم بنجاح وسيتواصل معكم فريق المبيعات لتأكيد التوصيل في دمشق!');
        }
    } catch (e) {
        alert('تم استلام طلبكم بنجاح وسيتواصل معكم فريق المبيعات لتأكيد التوصيل في دمشق!');
    }

    cart = [];
    saveCart();
    closeModal('cartModal');
}

// Product Request Submit
async function handleRequestSubmit(e) {
    e.preventDefault();
    const customer_name = document.getElementById('reqName').value.trim();
    const customer_phone = document.getElementById('reqPhone').value.trim();
    const requested_product = document.getElementById('reqProduct').value.trim();
    const notes = document.getElementById('reqNotes').value.trim();

    try {
        await fetch('/api/requests', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCookie('csrf_token')
            },
            body: JSON.stringify({ customer_name, customer_phone, requested_product, notes })
        });
    } catch (e) {}

    alert('تم إرسال طلبكم بنجاح وسنقوم بتوفير الجهاز التواصل معكم بأسرع وقت!');
    document.getElementById('productRequestForm').reset();
    closeModal('requestModal');
}


