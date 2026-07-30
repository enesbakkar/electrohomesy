"""
Script to add email notifications to electrohomesy@gmail.com upon order checkout and product requests.
"""
import os, sys, shutil, re, subprocess

def update_app_js(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add email notification helpers if not present
    email_helpers = """
// Helper: Send order email notification to electrohomesy@gmail.com
async function sendOrderEmailNotification(orderData) {
    try {
        const itemsFormatted = (orderData.items || []).map((item, idx) => 
            `${idx + 1}. ${item.product_name} (${item.variant_details || 'افتراضي'}) - العدد: ${item.quantity} - السعر: $${((item.unit_price || 0) * item.quantity).toFixed(2)}`
        ).join('\\n');

        const payload = {
            _subject: `📦 طلب جديد من متجر ElectroHomeSY - ${orderData.customer_name}`,
            _captcha: "false",
            _template: "table",
            "اسم الزبون": orderData.customer_name,
            "رقم الهاتف": orderData.customer_phone,
            "عنوان التوصيل": orderData.delivery_address || 'دمشق وريفها',
            "طريقة الدفع": orderData.payment_method === 'cash' ? 'الدفع عند الاستلام' : orderData.payment_method,
            "المبلغ الإجمالي": `$${(orderData.total_amount || 0).toFixed(2)}`,
            "تفاصيل المنتجات": itemsFormatted,
            "تاريخ الطلب": new Date().toLocaleString()
        };

        await fetch('https://formsubmit.co/ajax/electrohomesy@gmail.com', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn('FormSubmit email notice:', err);
    }
}

// Helper: Send special product request email notification to electrohomesy@gmail.com
async function sendProductRequestEmailNotification(reqData) {
    try {
        const payload = {
            _subject: `🔔 طلب جهاز خاص من متجر ElectroHomeSY - ${reqData.customer_name}`,
            _captcha: "false",
            _template: "table",
            "اسم الزبون": reqData.customer_name,
            "رقم الهاتف": reqData.customer_phone,
            "الجهاز المطلوب": reqData.requested_product,
            "ملاحظات إضافية": reqData.notes || 'لا يوجد',
            "تاريخ الطلب": new Date().toLocaleString()
        };

        await fetch('https://formsubmit.co/ajax/electrohomesy@gmail.com', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn('FormSubmit request email notice:', err);
    }
}
"""

    if 'sendOrderEmailNotification' not in content:
        # Insert before handleCheckoutSubmit
        content = content.replace('async function handleCheckoutSubmit(e) {', email_helpers + '\nasync function handleCheckoutSubmit(e) {')

    # Update handleCheckoutSubmit to trigger sendOrderEmailNotification
    old_checkout = """    const customer_name = document.getElementById('custName').value.trim() || currentCustomer.full_name;
    const customer_phone = document.getElementById('custPhone').value.trim() || currentCustomer.phone_number;
    const delivery_address = document.getElementById('custAddress').value.trim();
    const total_amount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);"""

    new_checkout = """    const customer_name = document.getElementById('custName').value.trim() || currentCustomer.full_name;
    const customer_phone = document.getElementById('custPhone').value.trim() || currentCustomer.phone_number;
    const delivery_address = document.getElementById('custAddress').value.trim();
    const total_amount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const orderPayload = {
        customer_id: currentCustomer.id,
        customer_name,
        customer_phone,
        delivery_address,
        payment_method: selectedPaymentMethod,
        total_amount,
        items: [...cart]
    };

    // Send instant email notification to electrohomesy@gmail.com
    sendOrderEmailNotification(orderPayload);"""

    if 'sendOrderEmailNotification(orderPayload)' not in content:
        content = content.replace(old_checkout, new_checkout)

    # Update handleRequestSubmit to trigger sendProductRequestEmailNotification
    old_req = """    try {
        await fetch('/api/requests', {"""

    new_req = """    const reqPayload = { customer_name, customer_phone, requested_product, notes };
    sendProductRequestEmailNotification(reqPayload);

    try {
        await fetch('/api/requests', {"""

    if 'sendProductRequestEmailNotification(reqPayload)' not in content:
        content = content.replace(old_req, new_req)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated email notification logic in {filepath}")

update_app_js('js/app.js')
update_app_js('public/js/app.js')

# Check syntax
res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
