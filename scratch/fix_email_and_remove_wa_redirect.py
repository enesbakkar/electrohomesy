"""
Script to fix order email sending and remove automatic WhatsApp redirect/corrupted message.
"""
import os, sys, shutil, re, subprocess

def update_email_and_checkout_logic(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replacement for sendOrderEmailNotification and sendProductRequestEmailNotification
    new_email_helpers = """// Helper: Send order email notification to electrohomesy@gmail.com
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
            "طريقة الدفع": orderData.payment_method === 'cash' ? 'الدفع عند الاستلام (COD)' : orderData.payment_method,
            "المبلغ الإجمالي": `$${(orderData.total_amount || 0).toFixed(2)}`,
            "تفاصيل المنتجات": itemsFormatted,
            "تاريخ الطلب": new Date().toLocaleString()
        };

        const res = await fetch('https://formsubmit.co/ajax/electrohomesy@gmail.com', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const resData = await res.json();
        console.log('FormSubmit Email Result:', resData);
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

        const res = await fetch('https://formsubmit.co/ajax/electrohomesy@gmail.com', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const resData = await res.json();
        console.log('FormSubmit Request Email Result:', resData);
    } catch (err) {
        console.warn('FormSubmit request email notice:', err);
    }
}"""

    # Replacement for handleCheckoutSubmit
    new_checkout_fn = """async function handleCheckoutSubmit(e) {
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

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب وإشعار البريد...';
    }

    // 1. AWAIT email notification to electrohomesy@gmail.com
    await sendOrderEmailNotification(orderPayload);

    // 2. Also attempt backend order recording if server exists
    try {
        await fetch('/api/orders', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCookie('csrf_token')
            },
            body: JSON.stringify(orderPayload)
        });
    } catch (err) {}

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
    }

    alert('✅ تم إرسال طلبكم بنجاح!\\n\\nتم تحويل وتوثيق تفاصيل الطلب بالكامل إلى بريد المتجر (electrohomesy@gmail.com). سيتواصل معكم فريق المبيعات قريباً لتأكيد التوصيل في دمشق.');

    cart = [];
    saveCart();
    window.location.hash = '';
}"""

    # Replacement for handleRequestSubmit
    new_request_fn = """async function handleRequestSubmit(e) {
    e.preventDefault();
    const customer_name = document.getElementById('reqName').value.trim();
    const customer_phone = document.getElementById('reqPhone').value.trim();
    const requested_product = document.getElementById('reqProduct').value.trim();
    const notes = document.getElementById('reqNotes').value.trim();

    const reqPayload = { customer_name, customer_phone, requested_product, notes };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...';
    }

    await sendProductRequestEmailNotification(reqPayload);

    try {
        await fetch('/api/requests', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCookie('csrf_token')
            },
            body: JSON.stringify({ customer_name, customer_phone, requested_product, notes })
        });
    } catch (e) {}

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
    }

    alert('✅ تم إرسال طلبكم بنجاح إلى بريد المتجر وسنقوم بتوفير الجهاز والتواصل معكم بأسرع وقت!');
    document.getElementById('productRequestForm').reset();
    closeModal('requestModal');
}"""

    start_helpers = content.find('// Helper: Send order email notification')
    start_checkout = content.find('async function handleCheckoutSubmit(e) {')
    start_request = content.find('async function handleRequestSubmit(e) {')
    end_request = content.find('// Featured Carousel Functions')

    if start_helpers != -1 and end_request != -1:
        content = content[:start_helpers] + new_email_helpers + '\n\n' + new_checkout_fn + '\n\n' + new_request_fn + '\n\n' + content[end_request:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated email sending and checkout flow in {filepath}")

update_email_and_checkout_logic('js/app.js')
update_email_and_checkout_logic('public/js/app.js')

# Copy to public/
shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
