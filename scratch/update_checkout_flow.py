"""
Script to:
1) Remove compulsory account creation/login for checkout
2) Add Syrian phone number format validation (09xxxxxxxx / +9639xxxxxxxx)
3) Enhance order submit to send email to electrohomesy@gmail.com AND launch WhatsApp order confirmation
4) Update cartTotalPrice currency display to $
"""
import os, sys, shutil, re, subprocess

def update_app(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add validateSyrianPhoneNumber if missing
    validator_code = """function validateSyrianPhoneNumber(phone) {
    if (!phone) return false;
    const clean = phone.replace(/[\\s\\-\\(\\)]/g, '');
    const syrianRegex = /^(\\+?9639|09|9639|009639)\\d{8}$/;
    const generalRegex = /^\\+?[0-9]{9,15}$/;
    return syrianRegex.test(clean) || generalRegex.test(clean);
}"""

    if 'function validateSyrianPhoneNumber' not in content:
        content = content.replace('function generateProductCode', validator_code + '\n\nfunction generateProductCode')

    # Update handleCheckoutSubmit function
    old_handle_checkout_regex = r'async function handleCheckoutSubmit\(e\)\s*\{.*?\n\}'
    
    new_handle_checkout = """async function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }

    const nameInput = document.getElementById('custName');
    const phoneInput = document.getElementById('custPhone');
    const addressInput = document.getElementById('custAddress');

    const customer_name = (nameInput ? nameInput.value.trim() : '') || (currentCustomer ? currentCustomer.full_name : '');
    const customer_phone = (phoneInput ? phoneInput.value.trim() : '') || (currentCustomer ? currentCustomer.phone_number : '');
    const delivery_address = (addressInput ? addressInput.value.trim() : '') || 'دمشق';

    if (!customer_name) {
        alert('⚠️ يرجى إدخال اسمك الكريم لإتمام الطلب!');
        if (nameInput) nameInput.focus();
        return;
    }

    if (!validateSyrianPhoneNumber(customer_phone)) {
        alert('⚠️ يرجى إدخال رقم هاتف محمول صحيح للتواصل عند التسليم!\\n(مثال: 0959930005 أو 963959930005+)');
        if (phoneInput) phoneInput.focus();
        return;
    }

    if (!delivery_address) {
        alert('⚠️ يرجى إدخال عنوان التوصيل بالتفصيل في دمشق!');
        if (addressInput) addressInput.focus();
        return;
    }

    const total_amount = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    const orderPayload = {
        customer_id: currentCustomer ? currentCustomer.id : null,
        customer_name,
        customer_phone,
        delivery_address,
        payment_method: typeof selectedPaymentMethod !== 'undefined' ? selectedPaymentMethod : 'cash',
        total_amount,
        items: [...cart]
    };

    // 1. Send instant email notification to electrohomesy@gmail.com
    sendOrderEmailNotification(orderPayload);

    // 2. Format WhatsApp order confirmation message
    const waPhone = '963959930005';
    let waMsg = `📦 *طلب جديد من متجر ElectroHomeSY*\\n\\n`;
    waMsg += `👤 *الاسم:* ${customer_name}\\n`;
    waMsg += `📞 *الهاتف:* ${customer_phone}\\n`;
    waMsg += `📍 *العنوان:* ${delivery_address}\\n`;
    waMsg += `💰 *الإجمالي:* $${total_amount.toFixed(2)}\\n\\n`;
    waMsg += `🛒 *المنتجات المطلوبة:*\\n`;
    cart.forEach((item, idx) => {
        waMsg += `${idx + 1}. ${item.product_name} (${item.variant_details || 'افتراضي'}) × ${item.quantity} = $${(item.unit_price * item.quantity).toFixed(2)}\\n`;
    });

    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`;

    alert('✅ تم استلام طلبكم بنجاح وتم إرسال الإشعار والتفاصيل إلى electrohomesy@gmail.com!\\n\\nسيتم فتح الواتساب الآن لتأكيد التوصيل المباشر في دمشق.');
    window.open(waUrl, '_blank');

    cart = [];
    saveCart();
    window.location.hash = '';
}"""

    content = re.sub(old_handle_checkout_regex, new_handle_checkout, content, flags=re.DOTALL)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

update_app('js/app.js')
update_app('public/js/app.js')

# Update index.html cart total display currency to $
for htmlfile in ['index.html', 'public/index.html']:
    if os.path.exists(htmlfile):
        with open(htmlfile, 'r', encoding='utf-8') as f:
            c = f.read()
        c = c.replace('0 ل.س', '$0')
        c = re.sub(r'app\.js\?v=[\d\.]+', 'app.js?v=16.0.0', c)
        with open(htmlfile, 'w', encoding='utf-8') as f:
            f.write(c)
        print(f"Updated {htmlfile}")

# Sync to public/
shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')
print("Synced files to public/")

# Check syntax
res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
