"""
Fix the duplicate PRODUCT_FALLBACK_IMAGES const in js/app.js (and public/js/app.js).
Then update FALLBACK_PRODUCTS with current products.json data.
"""
import sys, json, subprocess, re
sys.stdout.reconfigure(encoding='utf-8')

def fix_app_js(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # Find all PRODUCT_FALLBACK_IMAGES const declarations
    indices = [i for i, l in enumerate(lines) if 'const PRODUCT_FALLBACK_IMAGES' in l]
    print(f"{path}: PRODUCT_FALLBACK_IMAGES at lines {[i+1 for i in indices]}")
    
    if len(indices) >= 2:
        # Keep the FIRST one (it has real product image URLs from actual CDN)
        # Remove the SECOND one (and everything in its braces)
        second_start = indices[1]
        # Find matching closing brace
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
        print(f"Removing second PRODUCT_FALLBACK_IMAGES from lines {second_start+1} to {second_end+2}")
        
        # Also remove the function getFallbackImageClient that follows if duplicated
        # Check if there's a duplicate getFallbackImageClient too
        next_line_after = second_end + 1
        # Skip blank lines
        while next_line_after < len(lines) and lines[next_line_after].strip() == '':
            next_line_after += 1
        
        # Remove from second_start to second_end (inclusive), keeping blank line before
        remove_start = second_start
        if remove_start > 0 and lines[remove_start - 1].strip() == '':
            remove_start -= 1
        
        new_lines = lines[:remove_start] + lines[second_end + 1:]
        content = '\n'.join(new_lines)
    
    # Also fix any duplicate getFallbackImageClient functions
    get_fb_indices = []
    lines2 = content.split('\n')
    for i, l in enumerate(lines2):
        if 'function getFallbackImageClient(' in l:
            get_fb_indices.append(i)
    
    print(f"getFallbackImageClient at lines: {[i+1 for i in get_fb_indices]}")
    
    if len(get_fb_indices) >= 2:
        # Remove the second one
        second_start = get_fb_indices[1]
        second_end = second_start
        brace_depth = 0
        found_open = False
        while second_end < len(lines2):
            for ch in lines2[second_end]:
                if ch == '{':
                    brace_depth += 1
                    found_open = True
                elif ch == '}':
                    brace_depth -= 1
            if found_open and brace_depth <= 0:
                break
            second_end += 1
        
        remove_start = second_start
        if remove_start > 0 and lines2[remove_start - 1].strip() == '':
            remove_start -= 1
        
        lines2 = lines2[:remove_start] + lines2[second_end + 1:]
        content = '\n'.join(lines2)
        print(f"Removed duplicate getFallbackImageClient")
    
    return content

# --- Process both files ---
for path in ['js/app.js', 'public/js/app.js']:
    content = fix_app_js(path)
    
    # Now update FALLBACK_PRODUCTS with current products.json
    with open('js/products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    lines = content.split('\n')
    
    # Find FALLBACK_PRODUCTS start and end
    fb_start = None
    for i, l in enumerate(lines):
        if l.strip() == 'const FALLBACK_PRODUCTS = [':
            fb_start = i
            break
    
    if fb_start is not None:
        # Find end of FALLBACK_PRODUCTS array
        fb_end = fb_start
        brace_depth = 0
        found_open = False
        while fb_end < len(lines):
            for ch in lines[fb_end]:
                if ch == '[':
                    brace_depth += 1
                    found_open = True
                elif ch == ']':
                    brace_depth -= 1
            if found_open and brace_depth <= 0:
                break
            fb_end += 1
        
        print(f"{path}: Replacing FALLBACK_PRODUCTS from line {fb_start+1} to {fb_end+2}")
        
        new_fb = 'const FALLBACK_PRODUCTS = ' + json.dumps(products, ensure_ascii=False, indent=4) + ';'
        
        # Replace
        before = '\n'.join(lines[:fb_start])
        after = '\n'.join(lines[fb_end + 1:])
        content = before + '\n' + new_fb + '\n' + after
    
    # Write back
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Written {path}")
    
    # Syntax check
    res = subprocess.run(['node', '-c', path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"PASS: {path} syntax OK!")
    else:
        print(f"FAIL: {path}: {res.stderr[:300]}")
    print()
