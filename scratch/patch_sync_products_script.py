import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

PRODUCT_IMAGES_MAP = {
    1: ["https://media.kruidvat.nl/medias/sys_master/prd-images/hc9/ha2/34247170949150/prd-front-5178398-1_600x600/prd-front-5178398-1-600x600.jpg", "https://media.kruidvat.nl/medias/sys_master/prd-images/h0d/h58/34247171014686/prd-front-5178398-2_600x600/prd-front-5178398-2-600x600.jpg", "https://media.kruidvat.nl/medias/sys_master/prd-images/h3d/h51/34247171211294/prd-front-5178398-4_600x600/prd-front-5178398-4-600x600.jpg", "https://media.kruidvat.nl/medias/sys_master/prd-images/h7d/h4d/34247171342366/prd-front-5178398-5_600x600/prd-front-5178398-5-600x600.jpg", "https://media.kruidvat.nl/medias/sys_master/prd-images/h80/h4a/34247171407902/prd-front-5178398-6_600x600/prd-front-5178398-6-600x600.jpg"],
    2: ["https://images.unsplash.com/photo-1508380702597-707c1b00a9a6?auto=format&fit=crop&w=800&q=80"],
    3: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"],
    4: ["https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80"],
    5: ["https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=800&q=80"],
    6: ["https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80"],
    7: ["https://images.unsplash.com/photo-1517668808822-9eaa03afd2af?auto=format&fit=crop&w=800&q=80"],
    8: ["https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80"],
    9: ["https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=800&q=80"],
    10: ["https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80"],
    11: ["https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80"],
    12: ["https://images.unsplash.com/photo-1583634648128-3a58222169ff?auto=format&fit=crop&w=800&q=80"],
    13: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"],
    14: ["https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=800&q=80"],
    15: ["https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80"],
    16: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"],
    17: ["https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=800&q=80"],
    18: ["https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=800&q=80"],
    19: ["https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80"],
    20: ["https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80"],
    21: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"],
    22: ["https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80"],
    23: ["https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80"],
    24: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"],
    25: ["https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80"],
    26: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"],
    27: ["https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"],
    28: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80"],
    29: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"],
    30: ["https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?auto=format&fit=crop&w=800&q=80"],
    31: ["https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=800&q=80"],
    32: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80"],
    33: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"],
    34: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"],
    35: ["https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=800&q=80"],
    36: ["https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=800&q=80"],
    37: ["https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=800&q=80"],
    38: ["https://images.unsplash.com/photo-1517668808822-9eaa03afd2af?auto=format&fit=crop&w=800&q=80"],
    39: ["https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80"],
    40: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"],
    41: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"],
    42: ["https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80"],
    43: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"],
    44: ["https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80"],
    45: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"],
    46: ["https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80"],
    47: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"],
    48: ["https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"],
    49: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80"],
    50: ["https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"],
    51: ["https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80"],
    52: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"],
    53: ["https://images.unsplash.com/photo-1621607512022-6aecc4fed814?auto=format&fit=crop&w=800&q=80"],
    54: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"],
    55: ["https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80"],
    56: ["https://images.unsplash.com/photo-1508380702597-707c1b00a9a6?auto=format&fit=crop&w=800&q=80"]
}

with open('scripts/sync-products.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace getFallbackImage in scripts/sync-products.js
fn_map_str = json.dumps({k: v[0] for k, v in PRODUCT_IMAGES_MAP.items()}, indent=4)
new_fallback_fn = f'''const PRODUCT_FALLBACK_IMAGES = {fn_map_str};

function getFallbackImage(pId) {{
    if (pId && PRODUCT_FALLBACK_IMAGES[pId]) {{
        return PRODUCT_FALLBACK_IMAGES[pId];
    }}
    return 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80';
}}'''

start_marker = "function getFallbackImage(pId) {"
start_pos = content.find(start_marker)
if start_pos != -1:
    end_pos = content.find("function fetchCSV(url) {", start_pos)
    if end_pos != -1:
        content = content[:start_pos] + new_fallback_fn + "\n\n" + content[end_pos:]

# Replace price parse logic in scripts/sync-products.js so discountPrice isn't 2999
old_price_block = '''        let cost = parsePrice(row[5]);
        let sellingPrice = parsePrice(row[6]);
        let discountPrice = parsePrice(row[7]);

        // Fallback price logic if Google Sheet price is 0 or empty
        const defaultP = DEFAULT_PRICES[id] || { price: 250000, discount: 220000 };
        if (!sellingPrice) {
            sellingPrice = defaultP.price;
        }
        if (!discountPrice) {
            discountPrice = defaultP.discount;
        }'''

new_price_block = '''        let cost = parsePrice(row[5]);
        let sellingPrice = parsePrice(row[6]);
        let discountPrice = parsePrice(row[7]);

        // Fallback price logic if Google Sheet price is 0, empty, or invalid (e.g. 2999)
        const defaultP = DEFAULT_PRICES[id] || { price: 250000, discount: 220000 };
        if (!sellingPrice || sellingPrice < 10000) {
            sellingPrice = defaultP.price;
        }
        if (!discountPrice || discountPrice < 10000 || discountPrice >= sellingPrice) {
            discountPrice = defaultP.discount;
        }'''

if old_price_block in content:
    content = content.replace(old_price_block, new_price_block)
    print("Updated price validation block in scripts/sync-products.js")

with open('scripts/sync-products.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated scripts/sync-products.js successfully!")
