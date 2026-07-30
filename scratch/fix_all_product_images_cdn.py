import json
import os
import sys
import sqlite3

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

print(f"Loaded {len(PRODUCT_IMAGES_MAP)} image mappings.")

# 1. Update products.json files
for filepath in ['js/products.json', 'public/js/products.json']:
    with open(filepath, 'r', encoding='utf-8') as f:
        prods = json.load(f)

    for p in prods:
        pid = p['id']
        # If image starts with /asset or is missing, update to HTTPS URL
        if not p.get('main_image') or p['main_image'].startswith('/asset'):
            valid_imgs = PRODUCT_IMAGES_MAP.get(pid, ["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80"])
            p['main_image'] = valid_imgs[0]
            p['images'] = valid_imgs

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(prods, f, ensure_ascii=False, indent=2)
    print(f"Updated {filepath} with HTTPS images.")

# 2. Update electrohomesy_db.json
with open('electrohomesy_db.json', 'r', encoding='utf-8') as f:
    db_json = json.load(f)

for p in db_json.get('products', []):
    pid = p['id']
    if not p.get('main_image') or p['main_image'].startswith('/asset'):
        valid_imgs = PRODUCT_IMAGES_MAP.get(pid, ["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80"])
        p['main_image'] = valid_imgs[0]
        p['images'] = valid_imgs

with open('electrohomesy_db.json', 'w', encoding='utf-8') as f:
    json.dump(db_json, f, ensure_ascii=False, indent=2)
print("Updated electrohomesy_db.json with HTTPS images.")

# 3. Update getFallbackImageClient in js/app.js & public/js/app.js
def update_app_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Re-write getFallbackImageClient with PRODUCT_IMAGES_MAP dictionary
    map_str = json.dumps({k: v[0] for k, v in PRODUCT_IMAGES_MAP.items()}, indent=4)
    
    new_fn = f'''const PRODUCT_FALLBACK_IMAGES = {map_str};

function getFallbackImageClient(pId) {{
    if (pId && PRODUCT_FALLBACK_IMAGES[pId]) {{
        return PRODUCT_FALLBACK_IMAGES[pId];
    }}
    return 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80';
}}'''

    start_marker = "function getFallbackImageClient(pId) {"
    start_pos = content.find(start_marker)
    if start_pos != -1:
        end_pos = content.find("function getCategoryNameById(categoryId)", start_pos)
        if end_pos != -1:
            content = content[:start_pos] + new_fn + "\n\n" + content[end_pos:]
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated getFallbackImageClient in {filepath}")
        else:
            print("end_pos not found in", filepath)
    else:
        print("start_pos not found in", filepath)

update_app_js('js/app.js')
update_app_js('public/js/app.js')

# 4. Update FALLBACK_PRODUCTS in js/app.js & public/js/app.js
with open('js/products.json', 'r', encoding='utf-8') as f:
    clean_prods = json.load(f)

js_cat_code = "const FALLBACK_CATEGORIES = " + json.dumps(db_json['categories'], ensure_ascii=False, indent=4) + ";"
js_prod_code = "const FALLBACK_PRODUCTS = " + json.dumps(clean_prods, ensure_ascii=False, indent=4) + ";"

for filepath in ['js/app.js', 'public/js/app.js']:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    start_marker = "const FALLBACK_CATEGORIES = ["
    end_marker = "const FALLBACK_ORDERS = ["

    start_pos = content.find(start_marker)
    end_pos = content.find(end_marker)

    if start_pos != -1 and end_pos != -1:
        new_content = content[:start_pos] + js_cat_code + "\n\n" + js_prod_code + "\n\n" + content[end_pos:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated FALLBACK_PRODUCTS in {filepath}")
