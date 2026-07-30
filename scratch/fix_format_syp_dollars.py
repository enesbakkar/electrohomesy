"""
Script to fix formatSYP across js/app.js and public/js/app.js
Replaces ar-SY locale formatting with clean en-US formatting so numbers are always Western digits in dollars ($40, $29.99).
"""
import os, sys, re, subprocess

def fix_format_syp(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define clean formatSYP implementation
    old_fn_regex = r'function formatSYP\(amount\)\s*\{[^}]*\}'
    new_fn = """function formatSYP(amount) {
    if (amount === null || amount === undefined || amount === '') return '';
    const n = Number(amount);
    if (isNaN(n)) return '';
    const formatted = n % 1 !== 0 ? n.toFixed(2) : n.toLocaleString('en-US');
    return '$' + formatted;
}"""

    content = re.sub(old_fn_regex, new_fn, content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated formatSYP in {filepath}")

fix_format_syp('js/app.js')
fix_format_syp('public/js/app.js')

# Check syntax
for jsfile in ['js/app.js', 'public/js/app.js']:
    res = subprocess.run(['node', '-c', jsfile], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"PASS: {jsfile} syntax OK")
    else:
        print(f"FAIL: {jsfile}: {res.stderr[:200]}")
