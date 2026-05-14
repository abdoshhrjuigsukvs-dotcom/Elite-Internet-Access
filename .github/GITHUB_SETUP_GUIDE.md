# Elite Net — GitHub Setup Guide
# كيفية رفع المشروع على GitHub واستخراج APK تلقائياً

---

## الخطوة 1 — إنشاء حساب GitHub

اذهب إلى: https://github.com/signup
أنشئ حساب مجاني إذا لم يكن لديك واحد.

---

## الخطوة 2 — إنشاء Repository جديد

1. اذهب إلى: https://github.com/new
2. اختر اسماً مثل: `elite-net-vpn`
3. اجعله **Private** (خاص)
4. اضغط **Create repository**
5. احتفظ بالرابط مثل: `https://github.com/yourusername/elite-net-vpn`

---

## الخطوة 3 — إعداد Secrets (بيانات سرية)

هذه البيانات يجب إضافتها في GitHub ليتمكن الـ Workflow من البناء.

اذهب إلى:
```
Your Repository → Settings → Secrets and variables → Actions → New repository secret
```

### Secrets المطلوبة:

---

### 🔐 KEYSTORE_BASE64
ملف التوقيع (Keystore) مرمز بـ base64.

**كيفية الإنشاء (مرة واحدة فقط):**

إذا كان لديك جهاز Linux أو Mac:
```bash
keytool -genkey -v \
  -keystore elite-net-release.keystore \
  -alias elite-net \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Elite Net, OU=App, O=EliteNet, L=Cairo, S=Cairo, C=EG"

# ثم حوّله لـ base64:
base64 -i elite-net-release.keystore | tr -d '\n'
```

إذا لم يكن لديك جهاز، استخدم هذا الموقع لتوليد Keystore:
https://keystore-generator.com
ثم حوّله لـ base64 هنا: https://www.base64encode.org (اختر binary)

**قيمة الـ Secret:** النص الناتج من base64 (سلسلة طويلة جداً)

---

### 🔐 KEYSTORE_PASSWORD
كلمة السر التي اخترتها عند إنشاء الـ Keystore

**مثال:** `MyStrongPassword123!`

---

### 🔐 KEY_PASSWORD
كلمة السر للـ Key (عادةً نفس KEYSTORE_PASSWORD)

**مثال:** `MyStrongPassword123!`

---

### 🔐 GOOGLE_SERVICES_JSON
محتوى ملف `google-services.json` من Firebase.

**كيفية الحصول عليه:**
1. اذهب إلى: https://console.firebase.google.com
2. اختر مشروع **elite-loot**
3. Project Settings → Your apps → Add Android app
4. Package name: `com.elitenet.vpn`
5. اضغط Download google-services.json
6. افتح الملف بأي محرر نصوص
7. انسخ كامل المحتوى وضعه كقيمة لهذا الـ Secret

**مثال على الشكل (ابدأ بـ {):**
```json
{
  "project_info": { ... },
  "client": [ ... ]
}
```

---

### 🔐 V2RAY_AAR_BASE64
ملف V2RayCore AAR مرمز بـ base64.

**كيفية الحصول عليه:**
1. اذهب إلى: https://github.com/2dust/v2rayNG/releases
2. حمّل ملف `v2ray-core.aar` من أحدث إصدار
3. حوّله لـ base64:
   - على Linux/Mac: `base64 -i v2ray-core.aar | tr -d '\n'`
   - على موقع: https://www.base64encode.org (اختر binary file)

> إذا لم تضف هذا الـ Secret، سيحاول الـ Workflow تحميله تلقائياً من الإنترنت.
> هذا أبطأ لكنه يعمل إذا كان الرابط متاحاً.

---

### 🔐 VPN_SERVER_HOST
عنوان سيرفر VPN الخاص بك

**مثال:** `vpn.your-domain.com` أو `192.168.1.1`

> إذا لم يكن لديك سيرفر بعد، اترك هذا الـ Secret فارغاً.
> سيتم بناء التطبيق بدون اتصال فعلي بالـ VPN
> (الواجهة ستعمل بالكامل).

---

### 🔐 VPN_SERVER_PORT
رقم منفذ السيرفر

**مثال:** `443`

---

### 🔐 VPN_UUID
UUID الخاص بالـ VMess على سيرفرك

**مثال:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

### 🔐 VPN_WS_PATH
مسار الـ WebSocket على السيرفر

**مثال:** `/elite` أو `/ws` أو `/`

---

## الخطوة 4 — رفع المشروع على GitHub

بما أنك لا تملك كمبيوتر، استخدم **Replit Git integration**:

### من Replit:
1. في Replit، اضغط على أيقونة **Git** في الشريط الجانبي الأيسر
2. اضغط **Connect to GitHub**
3. اختر الـ Repository الذي أنشأته في الخطوة 2
4. اضغط **Push** لرفع الكود

### أو عبر GitHub.com مباشرة:
1. اذهب إلى Repository الخاص بك
2. اضغط **Add file** → **Upload files**
3. ارفع مجلدات المشروع

---

## الخطوة 5 — تشغيل الـ Build

بعد رفع الكود، الـ Workflow يبدأ تلقائياً. يمكنك أيضاً تشغيله يدوياً:

1. اذهب إلى Repository → **Actions**
2. اختر **Build Signed APK**
3. اضغط **Run workflow** → **Run workflow**

---

## الخطوة 6 — تحميل الـ APK

بعد اكتمال الـ Build (15-30 دقيقة):

### طريقة 1 — من Releases:
1. اذهب إلى Repository → **Releases**
2. ستجد Release جديد اسمه `Elite Net v1.0.0 (Build #1)`
3. اضغط على ملف `EliteNet-*-release.apk` لتحميله مباشرة

### طريقة 2 — من Artifacts:
1. اذهب إلى Repository → Actions → آخر Run
2. اسكرول للأسفل حتى قسم **Artifacts**
3. اضغط **EliteNet-Release-APK** لتحميل الـ ZIP

---

## الخطوة 7 — تثبيت الـ APK على الهاتف

1. حمّل ملف الـ APK على هاتفك
2. اذهب إلى **الإعدادات** → **الأمان** → **تثبيت تطبيقات غير معروفة**
3. السماح للتطبيق الذي تستخدمه للتحميل (متصفح، إدارة ملفات، إلخ)
4. افتح ملف الـ APK واضغط **تثبيت**

---

## ملاحظات مهمة

- الـ Build يعمل **مجاناً** بحد **2000 دقيقة شهرياً** على GitHub Free
- كل دفع (push) جديد يشغّل Build جديد تلقائياً
- يمكنك تغيير أي كود ثم رفعه وسيتم بناء APK جديد
- احتفظ بـ Keystore في مكان آمن — ستحتاجه لتحديثات التطبيق مستقبلاً
