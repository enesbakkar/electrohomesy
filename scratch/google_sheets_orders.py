"""
Script to update js/app.js and public/js/app.js with Google Sheets orders webhook support.
"""
import os, sys, shutil, re, subprocess

def update_google_sheets_orders(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add global GOOGLE_SHEETS_ORDERS_WEBHOOK definition if missing
    webhook_def = """// Google Sheets Orders Webhook Endpoint (Google Apps Script Web App URL)
window.GOOGLE_SHEETS_ORDERS_WEBHOOK = window.GOOGLE_SHEETS_ORDERS_WEBHOOK || '';"""

    if 'GOOGLE_SHEETS_ORDERS_WEBHOOK' not in content:
        content = webhook_def + '\n\n' + content

    new_email_helpers = """// Helper: Send order email notification & record in Google Sheets
async function sendOrderEmailNotification(orderData) {
    const itemsFormatted = (orderData.items || []).map((item, idx) => 
        `${idx + 1}. ${item.product_name} (${item.variant_details || 'افتراضي'}) - العدد: ${item.quantity} - السعر: $${((item.unit_price || 0) * item.quantity).toFixed(2)}`
    ).join('\\n');

    const payload = {
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        delivery_address: orderData.delivery_address || 'دمشق',
        payment_method: orderData.payment_method === 'cash' ? 'الدفع عند الاستلام' : orderData.payment_method,
        total_amount: orderData.total_amount || 0,
        items: itemsFormatted,
        date: new Date().toLocaleString('ar-SY')
    };

    // 1. Post directly to Google Sheets Webhook if configured
    if (window.GOOGLE_SHEETS_ORDERS_WEBHOOK && window.GOOGLE_SHEETS_ORDERS_WEBHOOK.includes('script.google.com')) {
        try {
            await fetch(window.GOOGLE_SHEETS_ORDERS_WEBHOOK, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            console.log('Order sent to Google Sheets Webhook');
        } catch (e) {
            console.warn('Google Sheets Webhook Notice:', e);
        }
    }

    // 2. Secondary Web API backup
    try {
        await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
                access_key: "b890a887-f831-4a41-b1e7-814d2417743d",
                subject: `📦 طلب جديد من متجر ElectroHomeSY - ${orderData.customer_name}`,
                from_name: "ElectroHomeSY Store",
                to_email: "electrohomesy@gmail.com",
                name: orderData.customer_name,
                phone: orderData.customer_phone,
                address: orderData.delivery_address,
                message: `الاسم: ${orderData.customer_name}\\nالهاتف: ${orderData.customer_phone}\\nالعنوان: ${orderData.delivery_address}\\nالمبلغ الإجمالي: $${(orderData.total_amount||0).toFixed(2)}\\n\\nالمنتجات:\\n${itemsFormatted}`
            })
        });
    } catch (e) {}
}

// Helper: Send special product request email notification & record in Google Sheets
async function sendProductRequestEmailNotification(reqData) {
    const payload = {
        customer_name: reqData.customer_name,
        customer_phone: reqData.customer_phone,
        requested_product: reqData.requested_product,
        notes: reqData.notes || 'لا يوجد',
        date: new Date().toLocaleString('ar-SY')
    };

    if (window.GOOGLE_SHEETS_ORDERS_WEBHOOK && window.GOOGLE_SHEETS_ORDERS_WEBHOOK.includes('script.google.com')) {
        try {
            await fetch(window.GOOGLE_SHEETS_ORDERS_WEBHOOK, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (e) {}
    }

    try {
        await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({
                access_key: "b890a887-f831-4a41-b1e7-814d2417743d",
                subject: `🔔 طلب جهاز خاص من متجر ElectroHomeSY - ${reqData.customer_name}`,
                from_name: "ElectroHomeSY Store",
                to_email: "electrohomesy@gmail.com",
                name: reqData.customer_name,
                phone: reqData.customer_phone,
                message: `اسم الزبون: ${reqData.customer_name}\\nرقم الهاتف: ${reqData.customer_phone}\\nالجهاز المطلوب: ${reqData.requested_product}\\nملاحظات: ${reqData.notes || 'لا يوجد'}`
            })
        });
    } catch (e) {}
}"""

    start_helpers = content.find('// Helper: Send order email notification')
    start_checkout = content.find('async function handleCheckoutSubmit(e) {')

    if start_helpers != -1 and start_checkout != -1:
        content = content[:start_helpers] + new_email_helpers + '\n\n' + content[start_checkout:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated Google Sheets integration in {filepath}")

update_google_sheets_orders('js/app.js')
update_google_sheets_orders('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
