"""
Script to format order emails with rich HTML, product links, and 100% Arabic text.
"""
import os, sys, shutil, re, subprocess

def update_email_html(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    webhook_url = "https://script.google.com/macros/s/AKfycbwrM6-bAv-hYJ494X0bSvWoIRp-6vjJ4An226PMUI0k7X21zYZ_iS6xBeePAxdhRecA/exec"

    new_email_helpers = f"""// Helper: Send order email notification & record in Google Sheets (Rich HTML & 100% Arabic)
async function sendOrderEmailNotification(orderData) {{
    const itemsFormattedText = (orderData.items || []).map((item, idx) => {{
        const pLink = `https://electrohomesy.com/product.html?id=${{item.product_id}}`;
        return `${{idx + 1}}. ${{item.product_name}} (${{item.variant_details || 'افتراضي'}}) | الكمية: ${{item.quantity}} | السعر: $${{((item.unit_price || 0) * item.quantity).toFixed(2)}}\\nرابط المنتج: ${{pLink}}`;
    }}).join('\\n\\n');

    const htmlItemsFormatted = (orderData.items || []).map((item, idx) => {{
        const pLink = `https://electrohomesy.com/product.html?id=${{item.product_id}}`;
        return `
        <div style="padding: 12px; margin-bottom: 10px; background: #f8fafc; border-radius: 8px; border-right: 4px solid #2563eb;">
            <div style="font-weight: bold; font-size: 15px; color: #0f172a;">${{idx + 1}}. ${{item.product_name}}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">المواصفات: ${{item.variant_details || 'افتراضي'}}</div>
            <div style="font-size: 14px; font-weight: bold; color: #16a34a; margin-top: 4px;">الكمية: ${{item.quantity}} | السعر الإجمالي: $${{((item.unit_price || 0) * item.quantity).toFixed(2)}}</div>
            <div style="margin-top: 6px;">
                <a href="${{pLink}}" target="_blank" style="display: inline-block; padding: 6px 14px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: bold;">🔗 فتح صفحة المنتج للمعاينة</a>
            </div>
        </div>
        `;
    }}).join('');

    const payload = {{
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address || 'دمشق',
        payment_method: orderData.payment_method === 'cash' ? 'الدفع عند الاستلام' : orderData.payment_method,
        total_amount: (orderData.total_amount || 0).toFixed(2),
        items: itemsFormattedText,
        html_items: htmlItemsFormatted,
        date: new Date().toLocaleString('ar-SY')
    }};

    try {{
        await fetch('{webhook_url}', {{
            method: 'POST',
            headers: {{ 'Content-Type': 'text/plain' }},
            body: JSON.stringify(payload)
        }});
        console.log('Order notification sent in Arabic HTML with product links!');
    }} catch (e) {{
        console.warn('Google Sheets Webhook Notice:', e);
    }}
}}

// Helper: Send special product request email notification & record in Google Sheets
async function sendProductRequestEmailNotification(reqData) {{
    const htmlItems = `
    <div style="padding: 12px; background: #f8fafc; border-radius: 8px; border-right: 4px solid #ef4444;">
        <div style="font-weight: bold; font-size: 15px; color: #0f172a;">الجهاز المطلوب: ${{reqData.requested_product}}</div>
        <div style="font-size: 13px; color: #64748b; margin-top: 4px;">ملاحظات الزبون: ${{reqData.notes || 'لا يوجد'}}</div>
    </div>
    `;

    const payload = {{
        customer_name: reqData.customer_name,
        customer_phone: reqData.customer_phone,
        delivery_address: 'طلب جهاز خاص',
        payment_method: 'طلب جهاز خاص',
        total_amount: '0.00',
        items: `طلب جهاز خاص: ${{reqData.requested_product}}\\nملاحظات: ${{reqData.notes || 'لا يوجد'}}`,
        html_items: htmlItems,
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
        print(f"Updated HTML email payload & product links in {filepath}")

update_email_html('js/app.js')
update_email_html('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
