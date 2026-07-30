"""
Fix app.js:
1. Remove duplicate fetchProductsFromGoogleSheetsClient (second copy at line ~2325)
2. Extract missing initialization functions from b4503c4 version
3. Append them to current app.js
"""
import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# --- Read current js/app.js ---
with open('js/app.js', 'r', encoding='utf-8') as f:
    current = f.read()

# --- Read old version (b4503c4) ---
with open('scratch/app_b4503c4.js', 'r', encoding='utf-8') as f:
    old = f.read()
old_lines = old.split('\n')

# ============================================================
# Step 1: Remove the SECOND duplicate fetchProductsFromGoogleSheetsClient
# ============================================================
# The first one is at ~line 2098, second at ~2325 in current js/app.js
cur_lines = current.split('\n')

# Find all occurrences of 'async function fetchProductsFromGoogleSheetsClient'
indices = [i for i, l in enumerate(cur_lines) if 'async function fetchProductsFromGoogleSheetsClient(categorySlug)' in l]
print(f"Found fetchProductsFromGoogleSheetsClient at lines: {[i+1 for i in indices]}")

if len(indices) >= 2:
    # Remove the second occurrence
    second_start = indices[1]
    # Find end of the second function (next function definition at same indent level)
    second_end = second_start + 1
    brace_depth = 0
    found_opening = False
    while second_end < len(cur_lines):
        line = cur_lines[second_end]
        for ch in line:
            if ch == '{':
                brace_depth += 1
                found_opening = True
            elif ch == '}':
                brace_depth -= 1
        if found_opening and brace_depth <= 0:
            break
        second_end += 1

    print(f"Removing second fetchProductsFromGoogleSheetsClient from lines {second_start+1} to {second_end+1}")
    # Remove the duplicate (include the blank line before it)
    if second_start > 0 and cur_lines[second_start - 1].strip() == '':
        del cur_lines[second_start - 1:second_end + 1]
    else:
        del cur_lines[second_start:second_end + 1]

current = '\n'.join(cur_lines)
print("Removed duplicate fetchProductsFromGoogleSheetsClient")

# ============================================================
# Step 2: Extract missing initialization code from old version
# ============================================================
# Extract from line containing 'function checkAndInit' to end of file
check_init_start = None
for i, line in enumerate(old_lines):
    if '// Robust Initialization Handling readyState' in line or 'function checkAndInit(' in line:
        check_init_start = i
        break

if check_init_start is None:
    print("ERROR: Could not find checkAndInit in old version!")
    sys.exit(1)

print(f"Found checkAndInit block at line {check_init_start+1} in old version")

# Extract from checkAndInit to end but EXCLUDE anything that duplicates current functions
# Key functions already in current app.js that we should NOT add from old:
already_present = [
    'async function fetchProductsFromGoogleSheetsClient',
    'function parseCSVClient',
    'function parsePriceClient',
    'function getCategoryIdFromSheetClient',
    'function getProductImageClient',
    'function getFallbackImageClient',
    'function getCategoryNameById',
    'function getGoogleDriveDirectLinkClient',
    'const DEFAULT_PRICES_CLIENT',
    'const PRODUCT_FALLBACK_IMAGES',
    'function renderProducts(',
    'function renderModalContent',
    'function renderCartPage',
    'function renderCartModal',
    'function renderFeaturedCarousel',
    'function moveFeaturedCarousel',
    'function goToFeaturedSlide',
    'function startFeaturedAutoSlide',
    'function stopFeaturedAutoSlide',
]

# Check what the current app.js is missing vs old version
missing_funcs = []
for i, line in enumerate(old_lines):
    stripped = line.strip()
    is_func_start = (stripped.startswith('function ') or stripped.startswith('async function ') or
                     stripped.startswith('const ') and '=' in stripped)
    # Check if it's already in current
    if is_func_start:
        func_name_match = re.match(r'(?:async\s+)?function\s+(\w+)', stripped)
        if func_name_match:
            fname = func_name_match.group(1)
            if fname not in current:
                missing_funcs.append(fname)

print(f"Functions in old version NOT in current: {missing_funcs}")

# ============================================================
# Step 3: Extract the initialization block from old version
# ============================================================
# We need specifically: checkAndInit, initStorefront, fetchCategories, fetchProducts,
# filterCategory, renderCategoryTabs, renderLoadingSkeleton, showView, 
# handleCheckoutSubmit, handleRequestSubmit, handleCustomerAuthSubmit,
# handleLogout, handleGoogleAuthMock, renderAccountPage, updateCartBadge, updateUserAuthUI,
# addToCart, removeFromCart, updateCartItemQty, selectPaymentMethod, openModal, closeModal,
# openProductDetails, formatSYP, getCookie, etc.

# The safest approach: extract all function definitions from old that are NOT in current
extracted_funcs = []
i = old_start = check_init_start
while i < len(old_lines):
    line = old_lines[i]
    stripped = line.strip()
    
    # Check if this line starts a function definition
    func_match = re.match(r'^(?:async\s+)?function\s+(\w+)|^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(', stripped)
    if func_match:
        fname = func_match.group(1) or func_match.group(2)
        # Check if this function is already in current app.js
        func_exists = any(pat in current for pat in [
            f'function {fname}(',
            f'async function {fname}(',
        ])
        
        if func_exists and fname != 'checkAndInit' and fname != 'initStorefront':
            # Skip this function
            i += 1
            continue
    i += 1

# Simpler approach: just take everything from 'checkAndInit' to end of old file
init_block = '\n'.join(old_lines[check_init_start:])

# But we need to avoid duplicating renderProducts, renderCartPage, renderFeaturedCarousel
# These are already in current. So let's use a different strategy:
# Only add the functions that are truly missing.

# Actually, let's check which functions from old are completely absent from current:
def extract_functions_from_text(text):
    """Extract function names and their source blocks from JS text."""
    funcs = {}
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r'^(async\s+)?function\s+(\w+)\s*\(', line.strip())
        if m:
            fname = m.group(2)
            start = i
            brace_depth = 0
            found_open = False
            while i < len(lines):
                for ch in lines[i]:
                    if ch == '{':
                        brace_depth += 1
                        found_open = True
                    elif ch == '}':
                        brace_depth -= 1
                if found_open and brace_depth <= 0:
                    break
                i += 1
            end = i
            funcs[fname] = '\n'.join(lines[start:end+1])
        i += 1
    return funcs

old_funcs = extract_functions_from_text(old)
cur_funcs = extract_functions_from_text(current)

missing = {k: v for k, v in old_funcs.items() if k not in cur_funcs}
print(f"\nFunctions in old but NOT in current app.js ({len(missing)}):")
for k in sorted(missing.keys()):
    print(f"  - {k}")

# ============================================================
# Step 4: Build the new content
# ============================================================
# Append the initialization block (checkAndInit + initStorefront + missing functions)
# Get the init-only block (not function bodies, just the orchestration)
init_only_lines = []
i = check_init_start
while i < len(old_lines):
    line = old_lines[i]
    init_only_lines.append(line)
    i += 1

init_code = '\n'.join(init_only_lines)

# Remove any functions that already exist in current
for fname, fbody in cur_funcs.items():
    # Simple approach: skip this since we'd need to do complex replacements
    pass

# Instead, use the missing functions list
missing_code = '\n\n'.join(missing.values())

# Final assembly: current + missing funcs + init block (only the actual init calls, not all funcs)
# Extract ONLY the init block without function bodies that are duplicates
# Simple marker: take from checkAndInit line to just before renderCategoryTabs definition
cat_tab_line = None
for j, line in enumerate(old_lines[check_init_start:], start=check_init_start):
    if line.startswith('function renderCategoryTabs('):
        cat_tab_line = j
        break

if cat_tab_line:
    pure_init_block = '\n'.join(old_lines[check_init_start:cat_tab_line])
    remaining_missing_block = '\n\n'.join(v for k, v in missing.items() if k != 'renderCategoryTabs')
    new_content = current.rstrip() + '\n\n\n// ===== INITIALIZATION =====\n\n' + pure_init_block + '\n\n' + '\n\n'.join(v for k, v in missing.items()) + '\n'
else:
    new_content = current.rstrip() + '\n\n\n// ===== INITIALIZATION =====\n\n' + init_code + '\n'

# Write back
with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("\nWritten js/app.js and public/js/app.js")

import subprocess
for path in ['js/app.js', 'public/js/app.js']:
    res = subprocess.run(['node', '-c', path], capture_output=True, text=True)
    if res.returncode == 0:
        print(f"PASS: {path} syntax OK")
    else:
        print(f"FAIL: {path}: {res.stderr[:200]}")
