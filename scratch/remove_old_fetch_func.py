"""
Remove the second (old/wrong) fetchProductsFromGoogleSheetsClient from js/app.js and public/js/app.js
The second one at ~line 3041 uses wrong column mapping and overwrites the correct first one.
"""
import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

def remove_second_fetch_func(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find all occurrences
    indices = [i for i, l in enumerate(lines) if 'async function fetchProductsFromGoogleSheetsClient(categorySlug)' in l]
    print(f"{path}: found at lines {[i+1 for i in indices]}")
    
    if len(indices) < 2:
        print(f"  -> Only one occurrence, nothing to remove.")
        return
    
    # Remove the SECOND one
    second_start = indices[1]
    
    # Find the end of the function by counting braces
    second_end = second_start
    brace_depth = 0
    found_open = False
    while second_end < len(lines):
        for ch in lines[second_end]:
            if ch == '{':
                brace_depth += 1
                found_open = True
            elif ch == '}':
                brace_depth -= 1
        if found_open and brace_depth <= 0:
            break
        second_end += 1
    
    print(f"  -> Removing second occurrence: lines {second_start+1} to {second_end+1}")
    
    # Remove the block, also strip the blank line before it
    remove_start = second_start
    while remove_start > 0 and lines[remove_start - 1].strip() == '':
        remove_start -= 1
    
    new_lines = lines[:remove_start] + lines[second_end + 1:]
    
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    # Verify syntax
    res = subprocess.run(['node', '-c', path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"  -> PASS: {path} syntax OK!")
    else:
        print(f"  -> FAIL: {path}: {res.stderr[:200]}")

remove_second_fetch_func('js/app.js')
remove_second_fetch_func('public/js/app.js')
