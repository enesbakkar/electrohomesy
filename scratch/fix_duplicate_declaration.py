import os
import sys
import subprocess

sys.stdout.reconfigure(encoding='utf-8')

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find first and second occurrence of 'const PRODUCT_FALLBACK_IMAGES = {'
    target = 'const PRODUCT_FALLBACK_IMAGES = {'
    first_idx = content.find(target)
    second_idx = content.find(target, first_idx + len(target))

    if first_idx != -1 and second_idx != -1:
        # Find where second block ends (before getFallbackImageClient)
        fn_idx = content.find('function getFallbackImageClient(pId) {', second_idx)
        if fn_idx != -1:
            content = content[:second_idx] + content[fn_idx:]
            print(f"Removed duplicate declaration from {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

clean_file('js/app.js')
clean_file('public/js/app.js')

# Verify with node -c
for path in ['js/app.js', 'public/js/app.js']:
    res = subprocess.run(['node', '-c', path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"PASS: {path} has 0 syntax errors!")
    else:
        print(f"FAIL: {path} syntax error: {res.stderr}")
