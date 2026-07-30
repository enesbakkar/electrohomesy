import json, sys
sys.stdout.reconfigure(encoding='utf-8')
with open('js/products.json', encoding='utf-8') as f:
    data = json.load(f)
print('Total:', len(data))
for p in data[:6]:
    bp = p.get('base_price')
    dp = p.get('discount_price')
    name = p.get('title_ar', '')[:35]
    print(f"ID={p['id']} fiyat={bp} indirim={dp} | {name}")
