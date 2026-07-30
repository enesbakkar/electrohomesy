/* ElectroHomeSY - Main Application & Admin Logic */

let featuredCarouselIndex = 0;
let featuredCarouselTimer = null;
let featuredCarouselProducts = [];

// Static Fallbacks for GitHub Pages static hosting
const FALLBACK_CATEGORIES = [
    {
        "id": 1,
        "name_ar": "المكاوي وأجهزة البخار",
        "slug": "irons",
        "icon": "fa-shirt"
    },
    {
        "id": 2,
        "name_ar": "المكانس والتنظيف",
        "slug": "vacuums",
        "icon": "fa-broom"
    },
    {
        "id": 3,
        "name_ar": "أجهزة المطبخ والطهي",
        "slug": "kitchen",
        "icon": "fa-blender"
    },
    {
        "id": 4,
        "name_ar": "العناية الشخصية والحلاقة",
        "slug": "personal-care",
        "icon": "fa-scissors"
    },
    {
        "id": 5,
        "name_ar": "الإضاءة والمنزل والأجهزة الطبية",
        "slug": "home-living",
        "icon": "fa-lightbulb"
    }
];

const FALLBACK_PRODUCTS = [
    {
        "id": 1,
        "category_id": 4,
        "title_ar": "فيليبس ماكينة قص الشعر سلسلة 3000",
        "slug": "prod-ph-hc3000-1",
        "description_ar": "ماكينة قص شعر لاسلكية مع إعدادات طول متعددة",
        "base_price": 280000,
        "discount_price": 245000,
        "main_image": "",
        "images": [],
        "youtube_url": "https://www.youtube.com/watch?v=Afk3jznDe6o",
        "is_featured": 1,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "PH-HC3000",
        "brand": "Philips",
        "variants": [
            {
                "id": 1,
                "product_id": 1,
                "brand": "Philips",
                "model_name": "PH-HC3000",
                "variant_attributes": {
                    "الماركة": "Philips",
                    "الموديل": "PH-HC3000"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "PH-HC3000"
            }
        ]
    },
    {
        "id": 2,
        "category_id": 4,
        "title_ar": "براون سلسلة 5 ماكينة حلاقة كهربائية 51-M1000s",
        "slug": "prod-51-m1000s-2",
        "description_ar": "ماكينة حلاقة كهربائية للرجال للاستخدام الجاف والرطب",
        "base_price": 490000,
        "discount_price": 450000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "51-M1000s",
        "brand": "Braun",
        "variants": [
            {
                "id": 2,
                "product_id": 2,
                "brand": "Braun",
                "model_name": "51-M1000s",
                "variant_attributes": {
                    "الماركة": "Braun",
                    "الموديل": "51-M1000s"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "51-M1000s"
            }
        ]
    },
    {
        "id": 3,
        "category_id": 5,
        "title_ar": "ليفارنو هوم مصباح طاولة LED مع خاصية اللمس",
        "slug": "prod-lv-tl-01-3",
        "description_ar": "مصباح طاولة يعمل باللمس مع مستويات إضاءة قابلة للضبط",
        "base_price": 145000,
        "discount_price": 125000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 1,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-TL-01",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 3,
                "product_id": 3,
                "brand": "LIVARNO home",
                "model_name": "LV-TL-01",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-TL-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-TL-01"
            }
        ]
    },
    {
        "id": 4,
        "category_id": 4,
        "title_ar": "كاريرا ماكينة تشذيب متعددة الوظائف",
        "slug": "prod-cr-mg-01-4",
        "description_ar": "ماكينة تشذيب متعددة الاستخدامات لشعر الوجه والجسم",
        "base_price": 320000,
        "discount_price": 290000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "CR-MG-01",
        "brand": "CARRERA",
        "variants": [
            {
                "id": 4,
                "product_id": 4,
                "brand": "CARRERA",
                "model_name": "CR-MG-01",
                "variant_attributes": {
                    "الماركة": "CARRERA",
                    "الموديل": "CR-MG-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "CR-MG-01"
            }
        ]
    },
    {
        "id": 5,
        "category_id": 4,
        "title_ar": "براون ماكينة حلاقة الجسم سلسلة 5",
        "slug": "prod-br-bg5-5",
        "description_ar": "ماكينة حلاقة وتشذيب شعر الجسم للبشرة الحساسة",
        "base_price": 420000,
        "discount_price": 380000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "BR-BG5",
        "brand": "Braun",
        "variants": [
            {
                "id": 5,
                "product_id": 5,
                "brand": "Braun",
                "model_name": "BR-BG5",
                "variant_attributes": {
                    "الماركة": "Braun",
                    "الموديل": "BR-BG5"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "BR-BG5"
            }
        ]
    },
    {
        "id": 6,
        "category_id": 4,
        "title_ar": "كاريرا ماكينة تشذيب متعددة الوظائف (صندوق آخر)",
        "slug": "prod-cr-mg-02-6",
        "description_ar": "ماكينة تشذيب متعددة الاستخدامات للعناية الشخصية",
        "base_price": 340000,
        "discount_price": 305000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "CR-MG-02",
        "brand": "CARRERA",
        "variants": [
            {
                "id": 6,
                "product_id": 6,
                "brand": "CARRERA",
                "model_name": "CR-MG-02",
                "variant_attributes": {
                    "الماركة": "CARRERA",
                    "الموديل": "CR-MG-02"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "CR-MG-02"
            }
        ]
    },
    {
        "id": 7,
        "category_id": 3,
        "title_ar": "كروبس نستله دولسي غوستو بيكولو XS ماكينة قهوة",
        "slug": "prod-kp1a08-7",
        "description_ar": "ماكينة إعداد القهوة بالكبسولات بتصميم مدمج وسريع",
        "base_price": 540000,
        "discount_price": 490000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "KP1A08",
        "brand": "Krups",
        "variants": [
            {
                "id": 7,
                "product_id": 7,
                "brand": "Krups",
                "model_name": "KP1A08",
                "variant_attributes": {
                    "الماركة": "Krups",
                    "الموديل": "KP1A08"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "KP1A08"
            }
        ]
    },
    {
        "id": 8,
        "category_id": 4,
        "title_ar": "براون ماكينة حلاقة شاملة سلسلة 3 / 8 في 1",
        "slug": "prod-br-aio3-8",
        "description_ar": "طقم حلاقة وتصفيف شامل 8 في 1 للحد من اللحية والشعر",
        "base_price": 380000,
        "discount_price": 340000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "BR-AIO3",
        "brand": "Braun",
        "variants": [
            {
                "id": 8,
                "product_id": 8,
                "brand": "Braun",
                "model_name": "BR-AIO3",
                "variant_attributes": {
                    "الماركة": "Braun",
                    "الموديل": "BR-AIO3"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "BR-AIO3"
            }
        ]
    },
    {
        "id": 9,
        "category_id": 5,
        "title_ar": "ليفارنو هوم ساعة حائط لاسلكية",
        "slug": "prod-lv-wc-01-9",
        "description_ar": "ساعة حائط لاسلكية بتعديل تلقائي ودقيق للوقت",
        "base_price": 135000,
        "discount_price": 115000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-WC-01",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 9,
                "product_id": 9,
                "brand": "LIVARNO home",
                "model_name": "LV-WC-01",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-WC-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-WC-01"
            }
        ]
    },
    {
        "id": 10,
        "category_id": 3,
        "title_ar": "سيلفر كريست ماكينة وافل مزدوجة",
        "slug": "prod-sc-dw-01-10",
        "description_ar": "جهاز إعداد الوافل المزدوج بطلاء غير لاصق",
        "base_price": 260000,
        "discount_price": 230000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SC-DW-01",
        "brand": "SilverCrest",
        "variants": [
            {
                "id": 10,
                "product_id": 10,
                "brand": "SilverCrest",
                "model_name": "SC-DW-01",
                "variant_attributes": {
                    "الماركة": "SilverCrest",
                    "الموديل": "SC-DW-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SC-DW-01"
            }
        ]
    },
    {
        "id": 11,
        "category_id": 3,
        "title_ar": "سويتش أون ماكينة سموثي للتنقل",
        "slug": "prod-so-sm-01-11",
        "description_ar": "خلاط سموثي محمول مع كوب مزود بغطاء للتنقل",
        "base_price": 210000,
        "discount_price": 185000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 1,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-SM-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 11,
                "product_id": 11,
                "brand": "Switch On",
                "model_name": "SO-SM-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-SM-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-SM-01"
            }
        ]
    },
    {
        "id": 12,
        "category_id": 3,
        "title_ar": "تيفال محمصة خبز",
        "slug": "prod-tf-ts-01-12",
        "description_ar": "محمصة خبز توستر بفتحتين ومستويات تحمير متعددة",
        "base_price": 240000,
        "discount_price": 210000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "TF-TS-01",
        "brand": "Tefal",
        "variants": [
            {
                "id": 12,
                "product_id": 12,
                "brand": "Tefal",
                "model_name": "TF-TS-01",
                "variant_attributes": {
                    "الماركة": "Tefal",
                    "الموديل": "TF-TS-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "TF-TS-01"
            }
        ]
    },
    {
        "id": 13,
        "category_id": 1,
        "title_ar": "فيليبس بخار ومكواة HI5920",
        "slug": "prod-hi5920-13",
        "description_ar": "مكواة بخار قوية مع خزان ماء كبير لكي سريع",
        "base_price": 780000,
        "discount_price": 690000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "HI5920",
        "brand": "Philips",
        "variants": [
            {
                "id": 13,
                "product_id": 13,
                "brand": "Philips",
                "model_name": "HI5920",
                "variant_attributes": {
                    "الماركة": "Philips",
                    "الموديل": "HI5920"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "HI5920"
            }
        ]
    },
    {
        "id": 14,
        "category_id": 3,
        "title_ar": "سويتش أون غلاية ماء كهربائية - أسود",
        "slug": "prod-so-kt-01-14",
        "description_ar": "غلاية ماء كهربائية سريعة التسخين باللون الأسود",
        "base_price": 165000,
        "discount_price": 140000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-KT-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 14,
                "product_id": 14,
                "brand": "Switch On",
                "model_name": "SO-KT-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-KT-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-KT-01"
            }
        ]
    },
    {
        "id": 15,
        "category_id": 3,
        "title_ar": "سويتش أون طقم خلاط يدوي",
        "slug": "prod-so-hb-01-15",
        "description_ar": "طقم خلاط يدوي مع ملحقات للفرم والخفق",
        "base_price": 230000,
        "discount_price": 195000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 1,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-HB-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 15,
                "product_id": 15,
                "brand": "Switch On",
                "model_name": "SO-HB-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-HB-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-HB-01"
            }
        ]
    },
    {
        "id": 16,
        "category_id": 5,
        "title_ar": "دكتور سنست ميزان حرارة بالأشعة تحت الحمراء 2 في 1",
        "slug": "prod-ds-th-01-16",
        "description_ar": "ميزان حرارة إلكتروني بدون تلامس لقياس الحرارة",
        "base_price": 155000,
        "discount_price": 130000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "DS-TH-01",
        "brand": "Dr. Senst",
        "variants": [
            {
                "id": 16,
                "product_id": 16,
                "brand": "Dr. Senst",
                "model_name": "DS-TH-01",
                "variant_attributes": {
                    "الماركة": "Dr. Senst",
                    "الموديل": "DS-TH-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "DS-TH-01"
            }
        ]
    },
    {
        "id": 17,
        "category_id": 3,
        "title_ar": "سيلفر كريست ماكينة وافل مزدوجة (صندوق آخر)",
        "slug": "prod-sc-dw-02-17",
        "description_ar": "جهاز صانع وافل مزدوج سريع التحضير",
        "base_price": 270000,
        "discount_price": 235000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SC-DW-02",
        "brand": "SilverCrest",
        "variants": [
            {
                "id": 17,
                "product_id": 17,
                "brand": "SilverCrest",
                "model_name": "SC-DW-02",
                "variant_attributes": {
                    "الماركة": "SilverCrest",
                    "الموديل": "SC-DW-02"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SC-DW-02"
            }
        ]
    },
    {
        "id": 18,
        "category_id": 3,
        "title_ar": "سويتش أون غلاية ماء كهربائية - خشبية/بيج",
        "slug": "prod-so-kt-02-18",
        "description_ar": "غلاية ماء كهربائية بتصميم خشبي وبيج أنيق",
        "base_price": 175000,
        "discount_price": 150000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-KT-02",
        "brand": "Switch On",
        "variants": [
            {
                "id": 18,
                "product_id": 18,
                "brand": "Switch On",
                "model_name": "SO-KT-02",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-KT-02"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-KT-02"
            }
        ]
    },
    {
        "id": 19,
        "category_id": 4,
        "title_ar": "فيليبس ماكينة قص الشعر (صندوق آخر)",
        "slug": "prod-ph-hc3001-19",
        "description_ar": "ماكينة قص الشعر الكهربائية من فيليبس",
        "base_price": 290000,
        "discount_price": 250000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "PH-HC3001",
        "brand": "Philips",
        "variants": [
            {
                "id": 19,
                "product_id": 19,
                "brand": "Philips",
                "model_name": "PH-HC3001",
                "variant_attributes": {
                    "الماركة": "Philips",
                    "الموديل": "PH-HC3001"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "PH-HC3001"
            }
        ]
    },
    {
        "id": 20,
        "category_id": 3,
        "title_ar": "سويتش أون شواية تلامس صغيرة",
        "slug": "prod-so-cg-01-20",
        "description_ar": "شواية تلامس صغيرة مدمجة لتحضير السندويشات",
        "base_price": 190000,
        "discount_price": 165000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-CG-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 20,
                "product_id": 20,
                "brand": "Switch On",
                "model_name": "SO-CG-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-CG-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-CG-01"
            }
        ]
    },
    {
        "id": 21,
        "category_id": 5,
        "title_ar": "باركسايد كاشف متعدد الأغراض PMFD A3",
        "slug": "prod-pmfd-a3-21",
        "description_ar": "جهاز كشف متعدد الاستخدامات للمعادن والكابلات بالجدران",
        "base_price": 210000,
        "discount_price": 180000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "PMFD A3",
        "brand": "Parkside",
        "variants": [
            {
                "id": 21,
                "product_id": 21,
                "brand": "Parkside",
                "model_name": "PMFD A3",
                "variant_attributes": {
                    "الماركة": "Parkside",
                    "الموديل": "PMFD A3"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "PMFD A3"
            }
        ]
    },
    {
        "id": 22,
        "category_id": 3,
        "title_ar": "سيلفر كريست شواية تلامس كبيرة",
        "slug": "prod-sc-cg-02-22",
        "description_ar": "شواية تلامس كهربائية كبيرة مع ألواح غير لاصقة",
        "base_price": 390000,
        "discount_price": 345000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SC-CG-02",
        "brand": "SilverCrest",
        "variants": [
            {
                "id": 22,
                "product_id": 22,
                "brand": "SilverCrest",
                "model_name": "SC-CG-02",
                "variant_attributes": {
                    "الماركة": "SilverCrest",
                    "الموديل": "SC-CG-02"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SC-CG-02"
            }
        ]
    },
    {
        "id": 23,
        "category_id": 3,
        "title_ar": "سيفيرين لوح تسخين طبخ فردي",
        "slug": "prod-sv-hp-01-23",
        "description_ar": "موقد كهربائي مفرد للطبخ والتسخين السريع",
        "base_price": 180000,
        "discount_price": 155000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SV-HP-01",
        "brand": "Severin",
        "variants": [
            {
                "id": 23,
                "product_id": 23,
                "brand": "Severin",
                "model_name": "SV-HP-01",
                "variant_attributes": {
                    "الماركة": "Severin",
                    "الموديل": "SV-HP-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SV-HP-01"
            }
        ]
    },
    {
        "id": 24,
        "category_id": 3,
        "title_ar": "كروبس ماكينة قهوة فلتر F30908",
        "slug": "prod-f30908-24",
        "description_ar": "ماكينة تحضير القهوة المفلترة بتصميم كلاسيكي",
        "base_price": 290000,
        "discount_price": 255000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "F30908",
        "brand": "Krups",
        "variants": [
            {
                "id": 24,
                "product_id": 24,
                "brand": "Krups",
                "model_name": "F30908",
                "variant_attributes": {
                    "الماركة": "Krups",
                    "الموديل": "F30908"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "F30908"
            }
        ]
    },
    {
        "id": 25,
        "category_id": 3,
        "title_ar": "سويتش أون صانع سندويشات",
        "slug": "prod-so-sw-01-25",
        "description_ar": "جهاز تحضير السندويشات والمحمصة بطلاء غير لاصق",
        "base_price": 170000,
        "discount_price": 145000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-SW-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 25,
                "product_id": 25,
                "brand": "Switch On",
                "model_name": "SO-SW-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-SW-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-SW-01"
            }
        ]
    },
    {
        "id": 26,
        "category_id": 3,
        "title_ar": "سويتش أون ماكينة قهوة فلتر مع ترمس حراري",
        "slug": "prod-so-cm-01-26",
        "description_ar": "ماكينة قهوة فلتر مزودة بإبريق حراري حافظ للحرارة",
        "base_price": 280000,
        "discount_price": 240000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-CM-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 26,
                "product_id": 26,
                "brand": "Switch On",
                "model_name": "SO-CM-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-CM-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-CM-01"
            }
        ]
    },
    {
        "id": 27,
        "category_id": 3,
        "title_ar": "سيلفر كريست مبشرة خضروات كهربائية",
        "slug": "prod-sc-gr-01-27",
        "description_ar": "مبشرة وتقطاعة خضروات كهربائية بشفرات متعددة",
        "base_price": 220000,
        "discount_price": 190000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SC-GR-01",
        "brand": "SilverCrest",
        "variants": [
            {
                "id": 27,
                "product_id": 27,
                "brand": "SilverCrest",
                "model_name": "SC-GR-01",
                "variant_attributes": {
                    "الماركة": "SilverCrest",
                    "الموديل": "SC-GR-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SC-GR-01"
            }
        ]
    },
    {
        "id": 28,
        "category_id": 2,
        "title_ar": "سويتش أون مكنسة كهربائية يدوية للتنظيف الجاف والرطب",
        "slug": "prod-so-hv-01-28",
        "description_ar": "مكنسة يدوية لاسلكية لشفط السوائل والغبار",
        "base_price": 240000,
        "discount_price": 210000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-HV-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 28,
                "product_id": 28,
                "brand": "Switch On",
                "model_name": "SO-HV-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-HV-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-HV-01"
            }
        ]
    },
    {
        "id": 29,
        "category_id": 4,
        "title_ar": "روفنتا x كارل لاغرفيلد مجفف شعر ستوديو دراي",
        "slug": "prod-rw-hd-01-29",
        "description_ar": "مجفف شعر احترافي بتصميم خاص وقوة تجفيف عالية",
        "base_price": 310000,
        "discount_price": 275000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "RW-HD-01",
        "brand": "Rowenta",
        "variants": [
            {
                "id": 29,
                "product_id": 29,
                "brand": "Rowenta",
                "model_name": "RW-HD-01",
                "variant_attributes": {
                    "الماركة": "Rowenta",
                    "الموديل": "RW-HD-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "RW-HD-01"
            }
        ]
    },
    {
        "id": 30,
        "category_id": 3,
        "title_ar": "بوش خلاط يدوي كليفر ميكس 300 واط",
        "slug": "prod-bs-cm300-30",
        "description_ar": "خلاط يدوي خفيف الوزن بقوة 300 واط لإعداد الأطعمة",
        "base_price": 250000,
        "discount_price": 220000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "BS-CM300",
        "brand": "Bosch",
        "variants": [
            {
                "id": 30,
                "product_id": 30,
                "brand": "Bosch",
                "model_name": "BS-CM300",
                "variant_attributes": {
                    "الماركة": "Bosch",
                    "الموديل": "BS-CM300"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "BS-CM300"
            }
        ]
    },
    {
        "id": 31,
        "category_id": 3,
        "title_ar": "سويتش أون غلاية ماء - سوداء مع خشب",
        "slug": "prod-so-kt-03-31",
        "description_ar": "غلاية ماء كهربائية باللون الأسود ولمسات خشبية",
        "base_price": 180000,
        "discount_price": 155000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-KT-03",
        "brand": "Switch On",
        "variants": [
            {
                "id": 31,
                "product_id": 31,
                "brand": "Switch On",
                "model_name": "SO-KT-03",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-KT-03"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-KT-03"
            }
        ]
    },
    {
        "id": 32,
        "category_id": 5,
        "title_ar": "ون فور أول ريموت كنترول بديل لتلفزيون سامسونج",
        "slug": "prod-ofa-urc-01-32",
        "description_ar": "جهاز تحكم عن بعد بديل وشامل لتلفزيونات سامسونج",
        "base_price": 95000,
        "discount_price": 80000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "OFA-URC-01",
        "brand": "One For All",
        "variants": [
            {
                "id": 32,
                "product_id": 32,
                "brand": "One For All",
                "model_name": "OFA-URC-01",
                "variant_attributes": {
                    "الماركة": "One For All",
                    "الموديل": "OFA-URC-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "OFA-URC-01"
            }
        ]
    },
    {
        "id": 33,
        "category_id": 1,
        "title_ar": "فيليبس مولد بخار ومكواة سلسلة 2000",
        "slug": "prod-ph-sg2000-33",
        "description_ar": "مولد بخار قوي لكي الملابس وإزالة التجاعيد",
        "base_price": 850000,
        "discount_price": 760000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "PH-SG2000",
        "brand": "Philips",
        "variants": [
            {
                "id": 33,
                "product_id": 33,
                "brand": "Philips",
                "model_name": "PH-SG2000",
                "variant_attributes": {
                    "الماركة": "Philips",
                    "الموديل": "PH-SG2000"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "PH-SG2000"
            }
        ]
    },
    {
        "id": 34,
        "category_id": 3,
        "title_ar": "بوش تاسيمو ماكينة قهوة صديقة للأناقة",
        "slug": "prod-bs-tas-01-34",
        "description_ar": "ماكينة تحضير المشروبات والقهوة بالكبسولات التلقائية",
        "base_price": 460000,
        "discount_price": 410000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "BS-TAS-01",
        "brand": "Bosch",
        "variants": [
            {
                "id": 34,
                "product_id": 34,
                "brand": "Bosch",
                "model_name": "BS-TAS-01",
                "variant_attributes": {
                    "الماركة": "Bosch",
                    "الموديل": "BS-TAS-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "BS-TAS-01"
            }
        ]
    },
    {
        "id": 35,
        "category_id": 3,
        "title_ar": "سويتش أون نافورة شوكولاتة كهربائية",
        "slug": "prod-so-cf-01-35",
        "description_ar": "نافورة شوكولاتة كهربائية للحفلات والحلويات",
        "base_price": 220000,
        "discount_price": 195000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SO-CF-01",
        "brand": "Switch On",
        "variants": [
            {
                "id": 35,
                "product_id": 35,
                "brand": "Switch On",
                "model_name": "SO-CF-01",
                "variant_attributes": {
                    "الماركة": "Switch On",
                    "الموديل": "SO-CF-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SO-CF-01"
            }
        ]
    },
    {
        "id": 36,
        "category_id": 3,
        "title_ar": "سيلفر كريست صانع فشار ومحمصة لوز",
        "slug": "prod-sc-pm-01-36",
        "description_ar": "جهاز إعداد الفشار وتحميص المكسرات بالهواء الساخن",
        "base_price": 195000,
        "discount_price": 165000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SC-PM-01",
        "brand": "SilverCrest",
        "variants": [
            {
                "id": 36,
                "product_id": 36,
                "brand": "SilverCrest",
                "model_name": "SC-PM-01",
                "variant_attributes": {
                    "الماركة": "SilverCrest",
                    "الموديل": "SC-PM-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SC-PM-01"
            }
        ]
    },
    {
        "id": 37,
        "category_id": 4,
        "title_ar": "براون ماكينة تشذيب اللحية سلسلة 5",
        "slug": "prod-br-bt5-37",
        "description_ar": "ماكينة تشذيب اللحية بدقة عالية مع قرص تعديل الطول",
        "base_price": 410000,
        "discount_price": 365000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "BR-BT5",
        "brand": "Braun",
        "variants": [
            {
                "id": 37,
                "product_id": 37,
                "brand": "Braun",
                "model_name": "BR-BT5",
                "variant_attributes": {
                    "الماركة": "Braun",
                    "الموديل": "BR-BT5"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "BR-BT5"
            }
        ]
    },
    {
        "id": 38,
        "category_id": 3,
        "title_ar": "فيليبس ماكينة إسبريسو أوتوماتيكية بالكامل سلسلة 800",
        "slug": "prod-ph-ep800-38",
        "description_ar": "ماكينة إسبريسو أوتوماتيكية بالكامل لتحضير القهوة",
        "base_price": 2800000,
        "discount_price": 2450000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "PH-EP800",
        "brand": "Philips",
        "variants": [
            {
                "id": 38,
                "product_id": 38,
                "brand": "Philips",
                "model_name": "PH-EP800",
                "variant_attributes": {
                    "الماركة": "Philips",
                    "الموديل": "PH-EP800"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "PH-EP800"
            }
        ]
    },
    {
        "id": 39,
        "category_id": 3,
        "title_ar": "سيلفر كريست شواية راكليت",
        "slug": "prod-sc-rg-01-39",
        "description_ar": "شواية راكليت كهربائية للجبن والمشويات مع مقالي",
        "base_price": 360000,
        "discount_price": 315000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SC-RG-01",
        "brand": "SilverCrest",
        "variants": [
            {
                "id": 39,
                "product_id": 39,
                "brand": "SilverCrest",
                "model_name": "SC-RG-01",
                "variant_attributes": {
                    "الماركة": "SilverCrest",
                    "الموديل": "SC-RG-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SC-RG-01"
            }
        ]
    },
    {
        "id": 40,
        "category_id": 4,
        "title_ar": "روفنتا مجفف شعر شاين إكسبرس",
        "slug": "prod-rw-hd-02-40",
        "description_ar": "مجفف شعر صغير وسريع بإنبعاث أيوني لمعان الشعر",
        "base_price": 210000,
        "discount_price": 180000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "RW-HD-02",
        "brand": "Rowenta",
        "variants": [
            {
                "id": 40,
                "product_id": 40,
                "brand": "Rowenta",
                "model_name": "RW-HD-02",
                "variant_attributes": {
                    "الماركة": "Rowenta",
                    "الموديل": "RW-HD-02"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "RW-HD-02"
            }
        ]
    },
    {
        "id": 41,
        "category_id": 1,
        "title_ar": "فيليدا ممسحة بخار ستيم بلس",
        "slug": "prod-vl-sp-01-41",
        "description_ar": "ممسحة بخار لتنظيف وتعقيم الأرضيا�� بدون كيميائيات",
        "base_price": 440000,
        "discount_price": 390000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "VL-SP-01",
        "brand": "Vileda",
        "variants": [
            {
                "id": 41,
                "product_id": 41,
                "brand": "Vileda",
                "model_name": "VL-SP-01",
                "variant_attributes": {
                    "الماركة": "Vileda",
                    "الموديل": "VL-SP-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "VL-SP-01"
            }
        ]
    },
    {
        "id": 42,
        "category_id": 3,
        "title_ar": "سيلفر كريست فرن ميكروويف",
        "slug": "prod-sc-mw-01-42",
        "description_ar": "فرن ميكروويف متعدد المستويات للتسخين والطهي",
        "base_price": 680000,
        "discount_price": 590000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SC-MW-01",
        "brand": "SilverCrest",
        "variants": [
            {
                "id": 42,
                "product_id": 42,
                "brand": "SilverCrest",
                "model_name": "SC-MW-01",
                "variant_attributes": {
                    "الماركة": "SilverCrest",
                    "الموديل": "SC-MW-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SC-MW-01"
            }
        ]
    },
    {
        "id": 43,
        "category_id": 5,
        "title_ar": "ليفارنو هوم مصباح حائط خارجي LED يعمل بالبطارية",
        "slug": "prod-lv-wl-01-43",
        "description_ar": "مصباح جداري خارجي يعمل بالبطارية مع مستشعر حركة",
        "base_price": 160000,
        "discount_price": 135000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-WL-01",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 43,
                "product_id": 43,
                "brand": "LIVARNO home",
                "model_name": "LV-WL-01",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-WL-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-WL-01"
            }
        ]
    },
    {
        "id": 44,
        "category_id": 5,
        "title_ar": "ليفارنو هوم شمعة LED من الشمع الحقيقي في زجاج",
        "slug": "prod-lv-cl-01-44",
        "description_ar": "شمعة LED ديكورية مصنوعة من الشمع الحقيقي بوعاء زجاجي",
        "base_price": 85000,
        "discount_price": 70000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-CL-01",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 44,
                "product_id": 44,
                "brand": "LIVARNO home",
                "model_name": "LV-CL-01",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-CL-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-CL-01"
            }
        ]
    },
    {
        "id": 45,
        "category_id": 5,
        "title_ar": "فاينبيرجر جهاز استنشاق ضاغط للعلاج التنفسي",
        "slug": "prod-wb-in-01-45",
        "description_ar": "جهاز استنشاق ضاغط لعلاج أمراض الجهاز التنفسي",
        "base_price": 270000,
        "discount_price": 235000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "WB-IN-01",
        "brand": "Weinberger",
        "variants": [
            {
                "id": 45,
                "product_id": 45,
                "brand": "Weinberger",
                "model_name": "WB-IN-01",
                "variant_attributes": {
                    "الماركة": "Weinberger",
                    "الموديل": "WB-IN-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "WB-IN-01"
            }
        ]
    },
    {
        "id": 46,
        "category_id": 2,
        "title_ar": "سيفيرين مكنسة كهربائية 2 في 1 يدوية وعصوية",
        "slug": "prod-sv-vc-01-46",
        "description_ar": "مكنسة كهربائية 2 في 1 تعمل كمكنسة عصوية ويدوية",
        "base_price": 580000,
        "discount_price": 510000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "SV-VC-01",
        "brand": "Severin",
        "variants": [
            {
                "id": 46,
                "product_id": 46,
                "brand": "Severin",
                "model_name": "SV-VC-01",
                "variant_attributes": {
                    "الماركة": "Severin",
                    "الموديل": "SV-VC-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "SV-VC-01"
            }
        ]
    },
    {
        "id": 47,
        "category_id": 5,
        "title_ar": "ليفارنو هوم مصباح طاولة LED باللمس (صندوق بطول مختلف)",
        "slug": "prod-lv-tl-02-47",
        "description_ar": "مصباح طاولة LED باللمس بتصميم طول مختلف",
        "base_price": 155000,
        "discount_price": 130000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-TL-02",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 47,
                "product_id": 47,
                "brand": "LIVARNO home",
                "model_name": "LV-TL-02",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-TL-02"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-TL-02"
            }
        ]
    },
    {
        "id": 48,
        "category_id": 5,
        "title_ar": "سلسلة إضاءة LED من ليفارنو هوم",
        "slug": "prod-lv-sl-01-48",
        "description_ar": "حبل إضاءة LED ديكوري للمناسبات والديكور",
        "base_price": 75000,
        "discount_price": 60000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-SL-01",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 48,
                "product_id": 48,
                "brand": "LIVARNO home",
                "model_name": "LV-SL-01",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-SL-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-SL-01"
            }
        ]
    },
    {
        "id": 49,
        "category_id": 5,
        "title_ar": "كشاف بناء LED من باركسايد",
        "slug": "prod-ps-sl-01-49",
        "description_ar": "كشاف إضاءة LED قوي ومقاوم للصدمات للمواقع والأعمال",
        "base_price": 280000,
        "discount_price": 240000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "PS-SL-01",
        "brand": "Parkside",
        "variants": [
            {
                "id": 49,
                "product_id": 49,
                "brand": "Parkside",
                "model_name": "PS-SL-01",
                "variant_attributes": {
                    "الماركة": "Parkside",
                    "الموديل": "PS-SL-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "PS-SL-01"
            }
        ]
    },
    {
        "id": 50,
        "category_id": 5,
        "title_ar": "سلسلة إضاءة LED من ليفوبو",
        "slug": "prod-lb-sl-01-50",
        "description_ar": "شريط إضاءة LED موفر للطاقة للديكور الداخلي",
        "base_price": 65000,
        "discount_price": 50000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LB-SL-01",
        "brand": "LIVOBO",
        "variants": [
            {
                "id": 50,
                "product_id": 50,
                "brand": "LIVOBO",
                "model_name": "LB-SL-01",
                "variant_attributes": {
                    "الماركة": "LIVOBO",
                    "الموديل": "LB-SL-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LB-SL-01"
            }
        ]
    },
    {
        "id": 51,
        "category_id": 5,
        "title_ar": "ستارة إضاءة LED من ليفارنو هوم",
        "slug": "prod-lv-lc-01-51",
        "description_ar": "ستارة ضوئية LED مع مؤثرات إضاءة متعددة للزينة",
        "base_price": 110000,
        "discount_price": 90000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-LC-01",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 51,
                "product_id": 51,
                "brand": "LIVARNO home",
                "model_name": "LV-LC-01",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-LC-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-LC-01"
            }
        ]
    },
    {
        "id": 52,
        "category_id": 5,
        "title_ar": "مصباح طاولة LED أساسي من ليفارنو هوم",
        "slug": "prod-lv-tl-03-52",
        "description_ar": "مصباح طاولة LED أساسي وإضاءة مريحة للعين",
        "base_price": 95000,
        "discount_price": 80000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LV-TL-03",
        "brand": "LIVARNO home",
        "variants": [
            {
                "id": 52,
                "product_id": 52,
                "brand": "LIVARNO home",
                "model_name": "LV-TL-03",
                "variant_attributes": {
                    "الماركة": "LIVARNO home",
                    "الموديل": "LV-TL-03"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LV-TL-03"
            }
        ]
    },
    {
        "id": 53,
        "category_id": 4,
        "title_ar": "ماكينة تشذيب الجسم سلسلة 3 من براون (BG3)",
        "slug": "prod-br-bg3-53",
        "description_ar": "ماكينة تشذيب شعر الجسم للرجال مع أمشاط حماية",
        "base_price": 310000,
        "discount_price": 270000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "BR-BG3",
        "brand": "Braun",
        "variants": [
            {
                "id": 53,
                "product_id": 53,
                "brand": "Braun",
                "model_name": "BR-BG3",
                "variant_attributes": {
                    "الماركة": "Braun",
                    "الموديل": "BR-BG3"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "BR-BG3"
            }
        ]
    },
    {
        "id": 54,
        "category_id": 5,
        "title_ar": "مصباح طاولة LED لاسلكي يعمل بالبطارية من ليفوبو",
        "slug": "prod-lb-tl-01-54",
        "description_ar": "مصباح طاولة LED محمول يعمل بالبطارية القابلة للشحن",
        "base_price": 120000,
        "discount_price": 100000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "LB-TL-01",
        "brand": "LIVOBO",
        "variants": [
            {
                "id": 54,
                "product_id": 54,
                "brand": "LIVOBO",
                "model_name": "LB-TL-01",
                "variant_attributes": {
                    "الماركة": "LIVOBO",
                    "الموديل": "LB-TL-01"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "LB-TL-01"
            }
        ]
    },
    {
        "id": 55,
        "category_id": 4,
        "title_ar": "ماكينة تشذيب شاملة 6 في 1 من فيليبس سلسلة 3000",
        "slug": "prod-ph-aio3000-55",
        "description_ar": "طقم حلاقة وتصفيف 6 في 1 للوجه والشعر",
        "base_price": 330000,
        "discount_price": 290000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "PH-AIO3000",
        "brand": "Philips",
        "variants": [
            {
                "id": 55,
                "product_id": 55,
                "brand": "Philips",
                "model_name": "PH-AIO3000",
                "variant_attributes": {
                    "الماركة": "Philips",
                    "الموديل": "PH-AIO3000"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "PH-AIO3000"
            }
        ]
    },
    {
        "id": 56,
        "category_id": 4,
        "title_ar": "ماكينة حلاقة كهربائية دوارة سلسلة 1000 من فيليبس S1141",
        "slug": "prod-s1141-56",
        "description_ar": "ماكينة حلاقة دوارة بحركات مرنة لقص شعر الوجه بسلاسة",
        "base_price": 410000,
        "discount_price": 360000,
        "main_image": "",
        "images": [],
        "youtube_url": "",
        "is_featured": 0,
        "is_visible": 1,
        "stock_quantity": 1,
        "sku": "S1141",
        "brand": "Philips",
        "variants": [
            {
                "id": 56,
                "product_id": 56,
                "brand": "Philips",
                "model_name": "S1141",
                "variant_attributes": {
                    "الماركة": "Philips",
                    "الموديل": "S1141"
                },
                "price_modifier": 0,
                "stock_quantity": 1,
                "sku": "S1141"
            }
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
    if (amount === null || amount === undefined || amount === '') return '';
    const n = Number(amount);
    if (isNaN(n)) return '';
    const formatted = n % 1 !== 0 ? n.toFixed(2) : n.toLocaleString('en-US');
    return '$' + formatted;
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

    // Toggle active class on mobile bottom nav based on hash & handle SPA view switching
    const updateBottomNavActiveState = () => {
        const hash = window.location.hash;
        
        if (hash === '#cart-section') {
            showView('cart');
            renderCartPage();
        } else if (hash === '#account-section') {
            showView('account');
            renderAccountPage();
        } else {
            showView('home');
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

let cameFromCheckout = false;

function openUserAuthModal() {
    if (window.location.pathname.includes('product.html')) {
        window.location.href = 'index.html#account-section';
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
                <h3 style="font-size: 1.5rem; font-weight: 900; color: var(--onyx); margin-bottom: 5px;">تسجيل الدخول / إنشاء حساب</h3>
                <p style="color: var(--steel-grey); font-size: 0.9rem; margin-top: 2px;">أدخل بياناتك لإتمام طلبك في دمشق بنجاح.</p>
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
                    <i class="fa-solid fa-right-to-bracket"></i> تسجيل الدخول برقم الهاتف
                </button>
            </form>

            <div style="text-align: center; margin: 15px 0; position: relative;">
                <span style="background: var(--white); padding: 0 10px; color: var(--steel-grey); font-size: 0.8rem; position: relative; z-index: 1;">أو الدخول بواسطة</span>
                <div style="position: absolute; top: 50%; left:0; right:0; height:1px; background:var(--border-color); z-index:0;"></div>
            </div>

            <button type="button" onclick="handleGoogleAuthMock()" class="btn-secondary" style="width: 100%; justify-content: center; padding: 12px; font-size: 0.92rem; color: var(--onyx); border: 1.5px solid var(--border-color); background: #fff; border-radius: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer;">
                <i class="fa-brands fa-google" style="color: #ea4335; font-size: 1.1rem; margin-left: 6px;"></i> الدخول باستخدام Google
            </button>
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
                        <strong style="display: block; font-size: 0.95rem; color: var(--onyx); margin-bottom: 2px;">حساب موثق وآمن</strong>
                        <span style="font-size: 0.82rem; color: var(--steel-grey);">بياناتك مشفرة ومحفوظة لتسهيل الطلب في دمشق</span>
                    </div>
                </div>
                
                <button type="button" onclick="handleLogout()" class="btn-secondary" style="width: 100%; justify-content: center; padding: 13px; font-size: 1.02rem; color: var(--spark-red); border: 1.5px solid var(--spark-red); background: #fff; border-radius: 14px; margin-top: 15px; cursor: pointer; transition: all 0.2s;">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> تسجيل الخروج من الحساب
                </button>
            </div>
        `;
    }
}

function handleLogout() {
    if (confirm('هل أنت متأكد من رغبتك في تسجيل الخروج؟')) {
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
    
    if (cameFromCheckout) {
        cameFromCheckout = false;
        window.location.hash = '#cart-section';
    } else {
        renderAccountPage();
    }
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
    
    if (cameFromCheckout) {
        cameFromCheckout = false;
        window.location.hash = '#cart-section';
    } else {
        renderAccountPage();
    }
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
        renderFeaturedCarousel();
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
            renderFeaturedCarousel();
        } catch (jsonErr) {
            console.error('All data sources failed, using hardcoded fallback:', jsonErr);
            if (categorySlug === 'all') {
                allProducts = FALLBACK_PRODUCTS.filter(p => p.is_visible);
            } else {
                const cat = FALLBACK_CATEGORIES.find(c => c.slug === categorySlug);
                allProducts = cat ? FALLBACK_PRODUCTS.filter(p => p.category_id === cat.id && p.is_visible) : [];
            }
            renderProducts(allProducts);
            renderFeaturedCarousel();
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
    if (!val || val === '-' || val.trim() === '' || val.trim() === '0') return null;
    // Support decimals like 29.99, 100.00 and integers
    const clean = val.replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || num === 0 ? null : num;
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

const PRODUCT_FALLBACK_IMAGES = {
    "1": "/Logo/ElectroHomeSY-logo-blue.png",
    "2": "/Logo/ElectroHomeSY-logo-blue.png",
    "3": "/Logo/ElectroHomeSY-logo-blue.png",
    "4": "/Logo/ElectroHomeSY-logo-blue.png",
    "5": "/Logo/ElectroHomeSY-logo-blue.png",
    "6": "/Logo/ElectroHomeSY-logo-blue.png",
    "7": "/Logo/ElectroHomeSY-logo-blue.png",
    "8": "/Logo/ElectroHomeSY-logo-blue.png",
    "9": "/Logo/ElectroHomeSY-logo-blue.png",
    "10": "/Logo/ElectroHomeSY-logo-blue.png",
    "11": "/Logo/ElectroHomeSY-logo-blue.png",
    "12": "/Logo/ElectroHomeSY-logo-blue.png",
    "13": "/Logo/ElectroHomeSY-logo-blue.png",
    "14": "/Logo/ElectroHomeSY-logo-blue.png",
    "15": "/Logo/ElectroHomeSY-logo-blue.png",
    "16": "/Logo/ElectroHomeSY-logo-blue.png",
    "17": "/Logo/ElectroHomeSY-logo-blue.png",
    "18": "/Logo/ElectroHomeSY-logo-blue.png",
    "19": "/Logo/ElectroHomeSY-logo-blue.png",
    "20": "/Logo/ElectroHomeSY-logo-blue.png",
    "21": "/Logo/ElectroHomeSY-logo-blue.png",
    "22": "/Logo/ElectroHomeSY-logo-blue.png",
    "23": "/Logo/ElectroHomeSY-logo-blue.png",
    "24": "/Logo/ElectroHomeSY-logo-blue.png",
    "25": "/Logo/ElectroHomeSY-logo-blue.png",
    "26": "/Logo/ElectroHomeSY-logo-blue.png",
    "27": "/Logo/ElectroHomeSY-logo-blue.png",
    "28": "/Logo/ElectroHomeSY-logo-blue.png",
    "29": "/Logo/ElectroHomeSY-logo-blue.png",
    "30": "/Logo/ElectroHomeSY-logo-blue.png",
    "31": "/Logo/ElectroHomeSY-logo-blue.png",
    "32": "/Logo/ElectroHomeSY-logo-blue.png",
    "33": "/Logo/ElectroHomeSY-logo-blue.png",
    "34": "/Logo/ElectroHomeSY-logo-blue.png",
    "35": "/Logo/ElectroHomeSY-logo-blue.png",
    "36": "/Logo/ElectroHomeSY-logo-blue.png",
    "37": "/Logo/ElectroHomeSY-logo-blue.png",
    "38": "/Logo/ElectroHomeSY-logo-blue.png",
    "39": "/Logo/ElectroHomeSY-logo-blue.png",
    "40": "/Logo/ElectroHomeSY-logo-blue.png",
    "41": "/Logo/ElectroHomeSY-logo-blue.png",
    "42": "/Logo/ElectroHomeSY-logo-blue.png",
    "43": "/Logo/ElectroHomeSY-logo-blue.png",
    "44": "/Logo/ElectroHomeSY-logo-blue.png",
    "45": "/Logo/ElectroHomeSY-logo-blue.png",
    "46": "/Logo/ElectroHomeSY-logo-blue.png",
    "47": "/Logo/ElectroHomeSY-logo-blue.png",
    "48": "/Logo/ElectroHomeSY-logo-blue.png",
    "49": "/Logo/ElectroHomeSY-logo-blue.png",
    "50": "/Logo/ElectroHomeSY-logo-blue.png",
    "51": "/Logo/ElectroHomeSY-logo-blue.png",
    "52": "/Logo/ElectroHomeSY-logo-blue.png",
    "53": "/Logo/ElectroHomeSY-logo-blue.png",
    "54": "/Logo/ElectroHomeSY-logo-blue.png",
    "55": "/Logo/ElectroHomeSY-logo-blue.png",
    "56": "/Logo/ElectroHomeSY-logo-blue.png"
};

function getFallbackImageClient(id) { return '/Logo/ElectroHomeSY-logo-blue.png'; }


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
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv&t=' + Date.now();
        const res = await fetch(sheetUrl);
        if (!res.ok) throw new Error('Failed to fetch from Google Sheets directly');
        const text = await res.text();
        const rows = parseCSVClient(text);
        if (rows.length < 2) throw new Error('Empty CSV');

        const products = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 3) continue;

            const name = (row[1] || row[2] || '').trim();
            const brand = (row[2] || 'ElectroHome').trim();
            const code = (row[3] || `PROD-${i}`).trim();
            if (!name || name.startsWith('Product') || name.startswith?.('اسم')) continue;

            const id = parseInt(row[0], 10) || i;
            const quantity = parseFloat(row[4]) || 0;
            let cost = parsePriceClient(row[5]);
            let sellingPrice = parsePriceClient(row[6]);
            let discountPrice = parsePriceClient(row[7]);

            // Col 10 (K): Fav / Featured
            const favVal = (row[10] || '').trim();
            const isFeatured = (favVal === '1' || favVal.toUpperCase() === 'TRUE') ? 1 : 0;

            // Col 11 (L): details
            const detailsText = (row[11] || '').trim();

            // Col 12 (M): video link
            const videoLink = (row[12] || '').trim();

            // Col 13..17 (N, O, P, Q, R): Photos 1..5
            const photos = [];
            for (let cIdx = 13; cIdx <= 17; cIdx++) {
                let imgUrl = getGoogleDriveDirectLinkClient((row[cIdx] || '').trim());
                if (imgUrl && imgUrl.startsWith('http') && !photos.includes(imgUrl)) {
                    photos.push(imgUrl);
                }
            }

            const categoryId = getCategoryIdFromSheetClient(name, brand);
            const mainImage = photos.length > 0 ? photos[0] : '/Logo/ElectroHomeSY-logo-blue.png';
            const imagesList = photos.length > 0 ? photos : [];
            const description = (detailsText && !detailsText.startsWith('http')) ? detailsText : `جهاز ${name} عالي الكفاءة من ماركة ${brand}. الموديل: ${code}.`;

            products.push({
                id,
                category_id: categoryId,
                title_ar: name,
                slug: `prod-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${id}`,
                description_ar: description,
                base_price: sellingPrice,
                discount_price: discountPrice,
                main_image: mainImage,
                images: imagesList,
                youtube_url: videoLink,
                is_visible: 1,
                is_featured: isFeatured,
                variants: [
                    { id: id * 100, product_id: id, brand: brand || 'ElectroHome', model_name: code, variant_attributes: { "الماركة": brand, "الموديل": code }, price_modifier: 0, stock_quantity: Math.round(quantity) || 10, sku: code }
                ]
            });
        }

        allProducts = products;
        isGoogleSheetsDataLoaded = true;

        if (categorySlug === 'all') {
            return products;
        } else {
            const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'personal-care': 4, 'home-living': 5 };
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
                const catMap = { 'irons': 1, 'vacuums': 2, 'kitchen': 3, 'personal-care': 4, 'home-living': 5 };
                const catId = catMap[categorySlug];
                return products.filter(p => p.category_id === catId);
            }
        } catch (jsonErr) {
            console.error('Static products.json fallback also failed:', jsonErr);
            throw jsonErr;
        }
    }
}


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
    if (!val || val === '-' || val.trim() === '' || val.trim() === '0') return null;
    // Support decimals like 29.99, 100.00 and integers
    const clean = val.replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || num === 0 ? null : num;
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
                    <img src="${p.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${p.title_ar}" class="product-thumb" style="cursor: pointer;">
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
        main_image: currentSelectedProduct.main_image,
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
    const hero = document.querySelector('.hero-section');
    const products = document.getElementById('products-section');
    const customRequest = document.getElementById('custom-request-section');
    const cartSec = document.getElementById('cart-section');
    const accountSec = document.getElementById('account-section');

    if (viewName === 'cart') {
        if (hero) hero.style.display = 'none';
        if (products) products.style.display = 'none';
        if (customRequest) customRequest.style.display = 'none';
        if (cartSec) cartSec.style.display = 'block';
        if (accountSec) accountSec.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'account') {
        if (hero) hero.style.display = 'none';
        if (products) products.style.display = 'none';
        if (customRequest) customRequest.style.display = 'none';
        if (cartSec) cartSec.style.display = 'none';
        if (accountSec) accountSec.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        if (hero) {
            if (window.innerWidth <= 768) {
                hero.style.display = 'none';
            } else {
                hero.style.display = 'block';
            }
        }
        if (products) products.style.display = 'block';
        if (customRequest) customRequest.style.display = 'block';
        if (cartSec) cartSec.style.display = 'none';
        if (accountSec) accountSec.style.display = 'none';
    }
}

function renderCartPage() {
    const list = document.getElementById('cartItemsList');
    const totalPriceEl = document.getElementById('cartTotalPrice');
    if (!list || !totalPriceEl) return;

    if (cart.length === 0) {
        list.innerHTML = `<p style="text-align:center; padding:35px; color:var(--steel-grey); font-size:1.05rem; font-family:'Cairo',sans-serif;">السلة فارغة حالياً. أضف بعض المنتجات للتسوق!</p>`;
        totalPriceEl.innerText = formatSYP(0);
        return;
    }

    let total = 0;
    list.innerHTML = cart.map((item, index) => {
        const itemTotal = item.unit_price * item.quantity;
        total += itemTotal;
        return `
            <div class="cart-product-item">
                <div class="cart-product-image-wrapper" style="width:60px; height:60px; border-radius:12px; border:1px solid var(--border-color); background:#ffffff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                    <img src="${item.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${item.product_name}" style="max-width:100%; max-height:100%; object-fit:contain; padding:4px;">
                </div>
                <div class="cart-product-details">
                    <span class="cart-product-title">${item.product_name}</span>
                    <span class="cart-product-subtitle">${item.variant_details}</span>
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
    if (window.location.pathname.includes('product.html')) {
        window.location.href = 'index.html#cart-section';
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

// Helper: Send order email notification to electrohomesy@gmail.com
async function sendOrderEmailNotification(orderData) {
    try {
        const itemsFormatted = (orderData.items || []).map((item, idx) => 
            `${idx + 1}. ${item.product_name} (${item.variant_details || 'افتراضي'}) - العدد: ${item.quantity} - السعر: $${((item.unit_price || 0) * item.quantity).toFixed(2)}`
        ).join('\n');

        const payload = {
            _subject: `📦 طلب جديد من متجر ElectroHomeSY - ${orderData.customer_name}`,
            _captcha: "false",
            _template: "table",
            "اسم الزبون": orderData.customer_name,
            "رقم الهاتف": orderData.customer_phone,
            "عنوان التوصيل": orderData.delivery_address || 'دمشق وريفها',
            "طريقة الدفع": orderData.payment_method === 'cash' ? 'الدفع عند الاستلام' : orderData.payment_method,
            "المبلغ الإجمالي": `$${(orderData.total_amount || 0).toFixed(2)}`,
            "تفاصيل المنتجات": itemsFormatted,
            "تاريخ الطلب": new Date().toLocaleString()
        };

        await fetch('https://formsubmit.co/ajax/electrohomesy@gmail.com', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn('FormSubmit email notice:', err);
    }
}

// Helper: Send special product request email notification to electrohomesy@gmail.com
async function sendProductRequestEmailNotification(reqData) {
    try {
        const payload = {
            _subject: `🔔 طلب جهاز خاص من متجر ElectroHomeSY - ${reqData.customer_name}`,
            _captcha: "false",
            _template: "table",
            "اسم الزبون": reqData.customer_name,
            "رقم الهاتف": reqData.customer_phone,
            "الجهاز المطلوب": reqData.requested_product,
            "ملاحظات إضافية": reqData.notes || 'لا يوجد',
            "تاريخ الطلب": new Date().toLocaleString()
        };

        await fetch('https://formsubmit.co/ajax/electrohomesy@gmail.com', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn('FormSubmit request email notice:', err);
    }
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    if (!currentCustomer) {
        alert('⚠️ يرجى تسجيل الدخول أو إنشاء حساب جديد أولاً لإتمام طلبكم بنجاح!');
        cameFromCheckout = true;
        openUserAuthModal();
        return;
    }

    const customer_name = document.getElementById('custName').value.trim() || currentCustomer.full_name;
    const customer_phone = document.getElementById('custPhone').value.trim() || currentCustomer.phone_number;
    const delivery_address = document.getElementById('custAddress').value.trim();
    const total_amount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const orderPayload = {
        customer_id: currentCustomer.id,
        customer_name,
        customer_phone,
        delivery_address,
        payment_method: selectedPaymentMethod,
        total_amount,
        items: [...cart]
    };

    // Send instant email notification to electrohomesy@gmail.com
    sendOrderEmailNotification(orderPayload);

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
    window.location.hash = '';
}

// Product Request Submit
async function handleRequestSubmit(e) {
    e.preventDefault();
    const customer_name = document.getElementById('reqName').value.trim();
    const customer_phone = document.getElementById('reqPhone').value.trim();
    const requested_product = document.getElementById('reqProduct').value.trim();
    const notes = document.getElementById('reqNotes').value.trim();

    const reqPayload = { customer_name, customer_phone, requested_product, notes };
    sendProductRequestEmailNotification(reqPayload);

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

// Featured Carousel Functions
function renderFeaturedCarousel() {
    const track = document.getElementById('featuredCarouselTrack');
    const indicators = document.getElementById('featuredCarouselIndicators');
    const container = document.getElementById('featuredCarouselContainer');
    if (!track || !indicators || !container) return;

    // Filter featured products
    featuredCarouselProducts = allProducts.filter(p => p.is_featured === 1);
    
    // If no featured products, display fallback top products or hide carousel
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

    // Render slides
    track.innerHTML = featuredCarouselProducts.map(p => {
        const finalPrice = p.discount_price ? p.discount_price : p.base_price;
        const discountTag = p.discount_price && p.discount_price < p.base_price 
            ? `<div class="discount-tag">خصم ${Math.round((1 - p.discount_price/p.base_price)*100)}%</div>` 
            : '';
        return `
            <div class="carousel-slide">
                <div class="featured-product-card">
                    ${discountTag}
                    <div class="product-thumb-wrapper" onclick="window.location.href='product.html?id=${p.id}'" style="cursor:pointer; text-align:center;">
                        <img class="product-thumb" src="${p.main_image || '/Logo/ElectroHomeSY-logo-blue.png'}" alt="${p.title_ar}">
                    </div>
                    <a href="product.html?id=${p.id}" class="product-title">${p.title_ar}</a>
                    <div class="product-price-box">
                        <span class="current-price">${formatSYP(finalPrice)}</span>
                        ${p.discount_price && p.discount_price < p.base_price ? `<span class="old-price">${formatSYP(p.base_price)}</span>` : ''}
                    </div>
                    <button class="btn-add-cart" onclick="addCart(${p.id})">
                        <i class="fa-solid fa-basket-shopping"></i> إضافة للسلة
                    </button>
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

    // Start auto slide
    startFeaturedAutoSlide(dotsCount);

    // Pause on hover
    container.addEventListener('mouseenter', () => stopFeaturedAutoSlide());
    container.addEventListener('mouseleave', () => startFeaturedAutoSlide(dotsCount));
}

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


