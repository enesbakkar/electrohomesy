"""
Script to plug the live Google Apps Script Web App URL into app.js and public/js/app.js
"""
import os, sys, shutil, re, subprocess

def update_google_script_app(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    webhook_url = "https://script.google.com/macros/s/AKfycbwrM6-bAv-hYJ494X0bSvWoIRp-6vjJ4An226PMUI0k7X21zYZ_iS6xBeePAxdhRecA/exec"

    # Define window.GOOGLE_SHEETS_ORDERS_WEBHOOK
    if 'window.GOOGLE_SHEETS_ORDERS_WEBHOOK' in content:
        content = re.sub(
            r"window\.GOOGLE_SHEETS_ORDERS_WEBHOOK\s*=\s*.*?;",
            f"window.GOOGLE_SHEETS_ORDERS_WEBHOOK = '{webhook_url}';",
            content
        )
    else:
        content = f"window.GOOGLE_SHEETS_ORDERS_WEBHOOK = '{webhook_url}';\n\n" + content

    new_email_helpers = f"""// Helper: Send order email notification & record in Google Sheets
async function sendOrderEmailNotification(orderData) {{
    const itemsFormatted = (orderData.items || []).map((item, idx) => 
        `${{idx + 1}}. ${{item.product_name}} (${{item.variant_details || 'افتراضي'}}) - العدد: ${{item.quantity}} - السعر: $${{((item.unit_price || 0) * item.quantity).toFixed(2)}}`
    ).join('\\n');

    const payload = {{
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address || 'دمشق',
        payment_method: orderData.payment_method === 'cash' ? 'الدفع عند الاستلام' : orderData.payment_method,
        total_amount: orderData.total_amount || 0,
        items: itemsFormatted,
        date: new Date().toLocaleString('ar-SY')
    }};

    try {{
        await fetch('{webhook_url}', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'text/plain' }},
            body: JSON.stringify(payload)
        }});
        console.log('Order successfully logged to Google Sheets and sent via Gmail!');
    }} catch (e) {{
        console.warn('Google Sheets Webhook Notice:', e);
    }}
}}

// Helper: Send special product request email notification & record in Google Sheets
async function sendProductRequestEmailNotification(reqData) {{
    const payload = {{
        customer_name: reqData.customer_name,
        customer_phone: reqData.customer_phone,
        delivery_address: 'طلب جهاز خاص',
        payment_method: 'طلب جهاز خاص',
        total_amount: 0,
        items: `طلب جهاز خاص: ${{reqData.requested_product}}\\nملاحظات: ${{reqData.notes || 'لا يوجد'}}`,
        date: new Date().toLocaleString('ar-SY')
    }};

    try {{
        await fetch('{webhook_url}', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'text/plain' }},
            body: JSON.stringify(payload)
        }});
    }} catch (e) {{}}
}}"""

    start_helpers = content.find('// Helper: Send order email notification')
    start_checkout = content.find('async function handleCheckoutSubmit(e) {')

    if start_helpers != -1 and start_checkout != -1:
        content = content[:start_helpers] + new_email_helpers + '\n\n' + content[start_checkout:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated live Google Apps Script endpoint in {filepath}")

update_google_script_app('js/app.js')
update_google_script_app('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
