"""
Remove DEFAULT_PRICES_CLIENT and price fallback override from app.js.
Prices will come ONLY from Google Sheets, no hardcoded overrides.
Also fix parsePriceClient to support decimal prices (e.g. 29.99, 40.00).
"""
import sys, subprocess, re
sys.stdout.reconfigure(encoding='utf-8')

def fix(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\n')

    # --- 1) Remove DEFAULT_PRICES_CLIENT block ---
    dpc_start = None
    dpc_end = None
    for i, l in enumerate(lines):
        if 'const DEFAULT_PRICES_CLIENT = {' in l:
            dpc_start = i
        if dpc_start and i > dpc_start and l.strip() == '};':
            dpc_end = i
            break

    if dpc_start and dpc_end:
        print(f"{path}: Removing DEFAULT_PRICES_CLIENT lines {dpc_start+1}-{dpc_end+1}")
        # Remove block + surrounding blank lines
        while dpc_start > 0 and lines[dpc_start-1].strip() == '':
            dpc_start -= 1
        lines = lines[:dpc_start] + lines[dpc_end+1:]
    else:
        print(f"{path}: DEFAULT_PRICES_CLIENT not found or already removed")

    content = '\n'.join(lines)

    # --- 2) Remove price fallback block in fetchProductsFromGoogleSheetsClient ---
    # Remove lines:
    #   // Price fallback if Google Sheet price is 0 or empty
    #   const defaultP = DEFAULT_PRICES_CLIENT[id] || { price: 250000, discount: 220000 };
    #   if (!sellingPrice || sellingPrice === 0) {
    #       sellingPrice = defaultP.price;
    #   }
    #   if (!discountPrice || discountPrice === 0) {
    #       discountPrice = defaultP.discount;
    #   }
    fallback_pattern = re.compile(
        r'\n\s+// Price fallback if Google Sheet price.*?'
        r'if \(!discountPrice \|\| discountPrice === 0\) \{\s*\n\s+discountPrice = defaultP\.discount;\s*\n\s+\}',
        re.DOTALL
    )
    content, count = re.subn(fallback_pattern, '', content)
    print(f"{path}: Removed {count} price fallback block(s)")

    # --- 3) Fix parsePriceClient to support decimals ---
    old_parse = r"""function parsePriceClient(val) {
    if (!val || val === '-') return null;
    const clean = val.replace(/[^\d]/g, '');
    return clean ? parseInt(clean, 10) : null;
}"""
    new_parse = r"""function parsePriceClient(val) {
    if (!val || val === '-' || val.trim() === '' || val.trim() === '0') return null;
    // Support decimals like 29.99, 100.00 and integers
    const clean = val.replace(/[^\d.]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) || num === 0 ? null : num;
}"""
    if old_parse in content:
        content = content.replace(old_parse, new_parse)
        print(f"{path}: Updated parsePriceClient to support decimals")
    else:
        # Try regex fallback
        content = re.sub(
            r'function parsePriceClient\(val\) \{[^}]+\}',
            new_parse,
            content,
            count=1
        )
        print(f"{path}: parsePriceClient updated via regex")

    # --- 4) Fix formatSYP to show numbers cleanly (no 'ل.س' suffix override needed) ---
    # formatSYP already uses number formatting — keep it, just make it handle decimals too
    old_format = 'return Number(amount).toLocaleString(\'ar-SY\') + \' ل.س\';'
    new_format = """const n = Number(amount);
    if (isNaN(n)) return '';
    // Show as decimal if needed (e.g. 29.99), otherwise as integer
    const formatted = n % 1 !== 0 ? n.toFixed(2) : n.toLocaleString('ar-SY');
    return formatted + ' €';"""
    if old_format in content:
        content = content.replace(old_format, new_format)
        print(f"{path}: Updated formatSYP to show € and support decimals")

    # Write back
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

    # Syntax check
    res = subprocess.run(['node', '-c', path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"{path}: PASS syntax OK!\n")
    else:
        print(f"{path}: FAIL: {res.stderr[:300]}\n")

fix('js/app.js')
fix('public/js/app.js')
