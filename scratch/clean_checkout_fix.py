"""
Clean python script to update handleCheckoutSubmit in app.js and public/js/app.js
"""
import os, sys, shutil, re

def fix_app(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace broken handleCheckoutSubmit block cleanly
    start = content.find('async function handleCheckoutSubmit(e) {')
    end = content.find('// Product Request Submit')

    if start != -1 and end != -1:
        new_fn = """async function handleCheckoutSubmit(e) {
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
        alert('⚠️ يرجى إدخال رقم هاتف محمول صحيح للتواصل عند التسليم! (مثال: 0959930005 أو 963959930005+)');
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
    let waMsg = '📦 *طلب جديد من متجر ElectroHomeSY*\\n\\n';
    waMsg += '👤 *الاسم:* ' + customer_name + '\\n';
    waMsg += '📞 *الهاتف:* ' + customer_phone + '\\n';
    waMsg += '📍 *العنوان:* ' + delivery_address + '\\n';
    waMsg += '💰 *الإجمالي:* $' + total_amount.toFixed(2) + '\\n\\n';
    waMsg += '🛒 *المنتجات المطلوبة:*\\n';
    cart.forEach((item, idx) => {
        waMsg += (idx + 1) + '. ' + item.product_name + ' (' + (item.variant_details || 'افتراضي') + ') × ' + item.quantity + ' = $' + (item.unit_price * item.quantity).toFixed(2) + '\\n';
    });

    const waUrl = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(waMsg);

    alert('✅ تم إرسال الطلب وإشعارات التفاصيل بنجاح! سيتم فتح الواتساب الآن لتأكيد التوصيل السريع في دمشق.');
    window.open(waUrl, '_blank');

    cart = [];
    saveCart();
    window.location.hash = '';
}

"""
        content = content[:start] + new_fn + content[end:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

fix_app('js/app.js')
fix_app('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')
print("Synced all public files")
