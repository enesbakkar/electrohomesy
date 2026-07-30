"""
Script to test parsing the live Google Sheets CSV in Node
"""
import urllib.request, json

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

url = 'https://docs.google.com/spreadsheets/d/1hioi7V5yDDsOmm5_StTI3b8poxnCsgMQXP30lC75PRI/gviz/tq?tqx=out:csv&gid=0'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as res:
    text = res.read().decode('utf-8')
    rows = parseCSVClient(text)
    print(f"Total CSV Rows: {len(rows)}")
    
    parsed_products = []
    for i in range(1, len(rows)):
        row = rows[i]
        if len(row) < 3: continue
        name = (row[1] if len(row) > 1 else '').strip()
        brand = (row[2] if len(row) > 2 else 'ElectroHome').strip()
        code = (row[3] if len(row) > 3 else f'PROD-{i}').strip()
        
        if not name or name.startswith('Product') or name.startswith('اسم') or name == '-': continue
        
        sellingPrice = row[6] if len(row) > 6 else ''
        discountPrice = row[7] if len(row) > 7 else ''
        parsed_products.append({'id': i, 'name': name, 'brand': brand, 'code': code, 'sellingPrice': sellingPrice, 'discountPrice': discountPrice})
    
    print(f"Parsed {len(parsed_products)} valid products!")
    for p in parsed_products[:5]:
        print(p)
