"""
Script to fetch the latest Google Sheet data, compile products.json, and guarantee instant product loading.
"""
import urllib.request, json, os, shutil, re

url = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv&gid=0'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

def parseCSVClient(text):
    lines = text.splitlines()
    rows = []
    for line in lines:
        line = line.strip()
        if not line: continue
        row = []
        inQuotes = False
        currentCell = ""
        for char in line:
            if char == '"':
                inQuotes = not inQuotes
            elif char == ',' and not inQuotes:
                row.append(currentCell.strip())
                currentCell = ""
            else:
                currentCell += char
        row.append(currentCell.strip())
        rows.append(row)
    return rows

def parsePriceClient(val):
    if not val or val == '-' or val.strip() == '' or val.strip() == '0': return None
    clean = re.sub(r'[^\d.]', '', val)
    try:
        num = float(clean)
        return None if num == 0 else num
    except:
        return None

def getCategoryIdFromSheetClient(name, brand):
    cleanName = (name or '').lower()
    cleanCat = (brand or '').lower()
    if 'قهوة' in cleanName or 'إسبريسو' in cleanName or 'اسبريسو' in cleanName or 'دولسي' in cleanName or 'تاسيمو' in cleanName:
        return 6
    if 'مكواة' in cleanName or 'بخار' in cleanName or 'iron' in cleanName:
        return 1
    if 'مكنسة' in cleanName or 'تنظيف' in cleanName or 'vacuum' in cleanName:
        return 2
    if any(k in cleanName for k in ['وافل', 'سموثي', 'خلاط', 'محمصة', 'غلاية', 'شواية', 'لوح تسخين', 'سندويش', 'مبشرة', 'ميكروويف', 'فرن', 'فشار', 'شوكولاتة']):
        return 3
    if any(k in cleanName for k in ['حلاقة', 'قص الشعر', 'تشذيب', 'مجفف شعر', 'ستوديو دراي', 'شاين إكسبرس']):
        return 4
    return 5

try:
    with urllib.request.urlopen(req) as res:
        text = res.read().decode('utf-8')
        rows = parseCSVClient(text)
        print(f"Downloaded {len(rows)} CSV rows from Google Sheets")

        products = []
        for i in range(1, len(rows)):
            row = rows[i]
            if len(row) < 3: continue
            name = (row[1] if len(row) > 1 else '').strip()
            brand = (row[2] if len(row) > 2 else 'ElectroHome').strip()
            code = (row[3] if len(row) > 3 else f'PROD-{i}').strip()

            if not name or name.startswith('Product') or name.startswith('اسم') or name == '-': continue

            id_num = int(row[0]) if (len(row) > 0 and row[0].isdigit()) else i
            quantity = float(row[4]) if (len(row) > 4 and row[4].replace('.','',1).isdigit()) else 10
            cost = parsePriceClient(row[5] if len(row) > 5 else '')
            sellingPrice = parsePriceClient(row[6] if len(row) > 6 else '')
            discountPrice = parsePriceClient(row[7] if len(row) > 7 else '')

            favVal = (row[10] if len(row) > 10 else '').strip()
            isFeatured = 1 if (favVal == '1' or favVal.upper() == 'TRUE') else 0
            detailsText = (row[11] if len(row) > 11 else '').strip()
            videoLink = (row[12] if len(row) > 12 else '').strip()

            photos = []
            for cIdx in range(13, min(18, len(row))):
                imgUrl = row[cIdx].strip()
                if 'drive.google.com' in imgUrl:
                    m = re.search(r'[?&]id=([a-zA-Z0-9_-]+)', imgUrl) or re.search(r'/file/d/([a-zA-Z0-9_-]+)', imgUrl)
                    if m: imgUrl = f"https://lh3.googleusercontent.com/d/{m.group(1)}"
                if imgUrl.startswith('http') and imgUrl not in photos:
                    photos.append(imgUrl)

            categoryId = getCategoryIdFromSheetClient(name, brand)
            mainImage = photos[0] if photos else '/Logo/ElectroHomeSY-logo-blue.png'
            imagesList = photos if photos else [mainImage]
            description = detailsText if (detailsText and not detailsText.startswith('http')) else f"جهاز {name} عالي الكفاءة من ماركة {brand}. الموديل: {code}."

            products.append({
                "id": id_num,
                "category_id": categoryId,
                "title_ar": name,
                "slug": f"prod-{code.lower()}-{id_num}",
                "description_ar": description,
                "base_price": sellingPrice or cost or 29.99,
                "discount_price": discountPrice,
                "main_image": mainImage,
                "images": imagesList,
                "youtube_url": videoLink,
                "is_visible": 1,
                "is_featured": isFeatured,
                "variants": [
                    {
                        "id": id_num * 100,
                        "product_id": id_num,
                        "brand": brand or "ElectroHome",
                        "model_name": code,
                        "variant_attributes": { "الماركة": brand, "الموديل": code },
                        "price_modifier": 0,
                        "stock_quantity": int(quantity) if quantity else 10,
                        "sku": code
                    }
                ]
            })

        print(f"Compiled {len(products)} products from Google Sheets!")

        # Write to js/products.json and public/js/products.json
        with open('js/products.json', 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        with open('public/js/products.json', 'w', encoding='utf-8') as f:
            json.dump(products, f, ensure_ascii=False, indent=2)
        print("Updated js/products.json and public/js/products.json with latest Google Sheets data!")

except Exception as err:
    print(f"Error fetching/parsing Google Sheets: {err}")
