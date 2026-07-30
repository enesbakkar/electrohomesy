"""
Script to replace ugly native alerts with a modern glassmorphic success modal.
"""
import os, sys, shutil, re, subprocess

def update_success_modal(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add showCustomSuccessModal if missing
    modal_code = """function showCustomSuccessModal(title, message, btnText = 'متابعة التسوق 🛍️', onConfirm = null) {
    const oldModal = document.getElementById('customSuccessModalWrapper');
    if (oldModal) oldModal.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'customSuccessModalWrapper';
    wrapper.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeInOverlay 0.3s ease-out forwards;
    `;

    wrapper.innerHTML = `
        <div style="
            background: #ffffff;
            border-radius: 28px;
            max-width: 480px;
            width: 100%;
            padding: 36px 28px;
            text-align: center;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid rgba(226, 232, 240, 0.8);
            transform: scale(0.85);
            opacity: 0;
            animation: modalScaleUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            font-family: 'Cairo', sans-serif;
            direction: rtl;
        ">
            <div style="
                width: 84px;
                height: 84px;
                background: #dcfce7;
                color: #16a34a;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px auto;
                font-size: 2.6rem;
                box-shadow: 0 0 0 10px rgba(220, 252, 231, 0.5);
                animation: pulseIcon 2s infinite;
            ">
                <i class="fa-solid fa-circle-check"></i>
            </div>

            <h3 style="
                font-size: 1.55rem;
                font-weight: 800;
                color: #0f172a;
                margin: 0 0 12px 0;
                line-height: 1.3;
            ">${title}</h3>

            <p style="
                font-size: 1rem;
                color: #475569;
                line-height: 1.65;
                margin: 0 0 26px 0;
            ">${message}</p>

            <button type="button" id="btnCustomSuccessOk" style="
                width: 100%;
                background: linear-gradient(135deg, #1e3a8a, #2563eb);
                color: #ffffff;
                border: none;
                padding: 16px;
                font-size: 1.1rem;
                font-weight: 700;
                border-radius: 16px;
                cursor: pointer;
                box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <span>${btnText}</span>
            </button>
        </div>

        <style>
            @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes modalScaleUp {
                from { opacity: 0; transform: scale(0.85); }
                to { opacity: 1; transform: scale(1); }
            }
            @keyframes pulseIcon {
                0% { box-shadow: 0 0 0 0 rgba(220, 252, 231, 0.7); }
                70% { box-shadow: 0 0 0 18px rgba(220, 252, 231, 0); }
                100% { box-shadow: 0 0 0 0 rgba(220, 252, 231, 0); }
            }
        </style>
    `;

    document.body.appendChild(wrapper);

    document.getElementById('btnCustomSuccessOk')?.addEventListener('click', () => {
        wrapper.remove();
        if (typeof onConfirm === 'function') onConfirm();
    });
}"""

    if 'function showCustomSuccessModal' not in content:
        content = content.replace('function validateSyrianPhoneNumber', modal_code + '\n\nfunction validateSyrianPhoneNumber')

    # Update handleCheckoutSubmit logic to call showCustomSuccessModal
    new_checkout = """async function handleCheckoutSubmit(e) {
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
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إرسال الطلب...';
    }

    // AWAIT email & Google Sheets notification
    await sendOrderEmailNotification(orderPayload);

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

    cart = [];
    saveCart();
    window.location.hash = '';

    showCustomSuccessModal(
        '🎉 تم استلام طلبكم بنجاح!',
        'شكراً لثقتكم بمتجر ElectroHomeSY. تم توثيق بيانات الطلب بنجاح وسيتواصل معكم فريق المبيعات قريباً لتأكيد التوصيل في دمشق.',
        'متابعة التسوق 🛍️',
        () => { showView('home'); }
    );
}"""

    # Update handleRequestSubmit logic to call showCustomSuccessModal
    new_request = """async function handleRequestSubmit(e) {
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

    document.getElementById('productRequestForm').reset();
    closeModal('requestModal');

    showCustomSuccessModal(
        '✨ تم استلام طلبك الخاص بنجاح!',
        'تم تسجيل طلب الجهاز والتفاصيل بنجاح. وسيقوم فريق إلكتروهومسي بتوفير الجهاز والتواصل معكم بأسرع وقت.',
        'تم، شكراً 👍'
    );
}"""

    start_checkout = content.find('async function handleCheckoutSubmit(e) {')
    start_request = content.find('async function handleRequestSubmit(e) {')
    end_request = content.find('// Featured Carousel Functions')

    if start_checkout != -1 and end_request != -1:
        content = content[:start_checkout] + new_checkout + '\n\n' + new_request + '\n\n' + content[end_request:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated custom success modal in {filepath}")

update_success_modal('js/app.js')
update_success_modal('public/js/app.js')

shutil.copy('index.html', 'public/index.html')
shutil.copy('product.html', 'public/product.html')
shutil.copy('js/app.js', 'public/js/app.js')
shutil.copy('js/products.json', 'public/js/products.json')

res = subprocess.run(['node', '-c', 'js/app.js'], capture_output=True, text=True)
print(f"js/app.js syntax: {'OK' if res.returncode == 0 else res.stderr[:200]}")
