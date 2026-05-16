# Elite Net — Google Play Store Listing (2026 Compliant)

## App Details
- **Package name:** com.elitenet.vpn
- **Category:** Tools
- **Content rating:** Everyone
- **Privacy Policy:** https://sites.google.com/view/elite-loot-policy/
- **Target SDK:** 34 (Android 14)
- **Data Safety:** No personal data collected, no data shared with third parties

---

## App Name
Elite Net VPN: Safe & Private

## Short Description (80 chars)
Fast, secure, and private VPN for safe browsing and data protection with global servers.

---

## Full Description (English)

Elite Net VPN is your ultimate solution for online privacy and cybersecurity. Our app provides a secure tunnel for your data using high-end encryption protocols.

**Why choose Elite Net?**

🔒 High-Speed Servers
Access global content with zero buffering. Our optimized international servers deliver stable, fast connections wherever you are.

🛡️ Data Privacy
We protect your personal information from hackers and surveillance. A strict no-logs policy ensures your browsing history stays yours alone.

📶 Secure WiFi
Stay safe on public networks with our advanced firewall technology. Whether at a café, airport, or hotel — your connection is always encrypted.

🌍 Global Access
Connect to premium server locations worldwide. Smart Route technology automatically selects the fastest available server for your location.

🔔 Smart Notifications
Receive timely alerts about your daily session availability and connection status.

Experience the best security tools and enjoy a private internet experience today.

---

## Full Description (Arabic / العربية)

تطبيق Elite Net هو المزود الرسمي لخدمات النفق الآمن (Secure Tunneling) المشفرة. تم تطوير هذا التطبيق ليكون الوكيل المعتمد لتأمين اتصالات الإنترنت وحماية البيانات من التجسس والاختراق، مع الالتزام الكامل بمعايير الأمن السيبراني الدولية.

**لماذا يعتبر Elite Net هو الخيار المعتمد؟**

🔐 بروتوكولات التوكيل (Proxy Protocols)
نستخدم سيرفرات مخصصة فائقة السرعة تعمل كوكيل رسمي لتوجيه بياناتك بعيداً عن أعين المتطفلين.

🔑 تشفير معتمد (Certified Encryption)
جميع البيانات تمر عبر طبقة تشفير AES-256، وهي المعيار العالمي لحماية المعلومات الحساسة.

🕵️ حماية الهوية
يعمل التطبيق كدرع حماية (Shield) يخفي عنوان الـ IP الخاص بك ويستبدله بعناوين وكلاء رسميين من مختلف دول العالم.

⚡ دعم فني وتحديثات
نلتزم بتحديث السيرفرات يومياً لضمان استقرار الخدمة وسرعة الاتصال.

**المميزات التقنية:**
- اتصال بضغطة واحدة: واجهة مستخدم بسيطة واحترافية
- لا يوجد تتبع: سياسة خصوصية صارمة تمنع تسجيل أي بيانات شخصية
- تجاوز الحجب: الوصول إلى المحتوى العالمي بأمان وسهولة

Elite Net — شريكك الرسمي لإنترنت آمن وحر.

---

## Data Safety Section (Google Play Console)

Fill in the Data Safety form exactly as follows:

| Question | Answer |
|----------|--------|
| Does your app collect or share any of the required user data types? | No |
| Is all of the user data collected by your app encrypted in transit? | Yes |
| Do you provide a way for users to request that their data is deleted? | Yes |

**No data types to declare** — the app uses AsyncStorage only for local session timing.
The VPN tunnel routes traffic but does not log, store, or transmit user data.

---

## Permissions Declaration

Only these permissions are used (explain each in the Play Console):

| Permission | Reason shown to user |
|-----------|----------------------|
| `INTERNET` | Required to establish the VPN tunnel and connect to servers |
| `FOREGROUND_SERVICE` | Keeps the VPN connection active while you use other apps |
| `POST_NOTIFICATIONS` | Sends daily reminders about your free session availability |

**No location, contacts, camera, microphone, or storage permissions are requested.**

---

## VPN Permission Disclosure (Required by Google Play since 2022)

The following text must appear in the app before requesting VPN permission.
It is already implemented in `VpnConsentDialog.tsx`.

> "Elite Net uses the Android VPN Service API to create an encrypted tunnel
> for your internet traffic. This routes your data through our secure servers
> to protect your privacy. We do not log, sell, or share your browsing data.
> This permission is required for the VPN to function."

---

## Release Notes (v1.0.0)
- Initial release
- 2-hour daily free internet session with reward system
- Premium Matte Black & Gold glassmorphism UI
- Smart push notifications at 9 AM daily
- Strict no-logs privacy policy
