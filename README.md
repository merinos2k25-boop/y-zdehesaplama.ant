# 📱 Yüzde Hesaplayıcı (Mobil Uyumlu)

Hızlı, hassas, mouse tekerleği / tambur kaydırma hissi veren, **her yüzde adımında mekanik tık tık sesi çıkaran ve haptik titreşim geri bildirimi veren** tek ekran mobil web uygulaması.

---

## ✨ Özellikler

1. **Tek Ekrana Tam Sığan Arayüz (Kaydırma Gerektirmez)**:
   - Tüm bölümler (TL Tutarı, Yüzde Çarkı ve Toplam Sonuçlar) ekranı aşağı kaydırmaya gerek kalmadan aynı anda ekranda görünür.
   - `100dvh` mobil viewport ve safe-area uyumluluğu.

2. **Standart & Akıcı Tipografi**:
   - Sistem fontları (Apple San Francisco, Google Roboto, Segoe UI standart sistem font ailesi) kullanılarak sade, hızlı ve yerel uygulama hissi.
   - Sayıların titremesini önleyen `tabular-nums` hizalaması.

3. **Koyu ve Açık Tema Desteği**:
   - Üst menüde ses ve titreşim butonlarının yanında **Güneş / Ay (Koyu & Açık Tema)** butonu.
   - Seçilen tema tercihi `localStorage` ile otomatik hatırlanır.

4. **1 - 100 Arası Tekerlek (Wheel / Drum Picker)**:
   - iOS / Android tambur seçici tarzında 3D kavisli tambur görünümü.
   - Fare tekerleği veya parmakla akıcı kaydırma ve merkeze kilitlenme (snap).
   - **Tık Tık Sesi**: Web Audio API ile sıfır gecikmeli mekanik ses sentezi.
   - **Titreşim**: `navigator.vibrate` ile dokunsal geri bildirim.
   - `%1`, `%10`, `%18 (KDV)`, `%20`, `%50`, `%100` hızlı kısayolları.

5. **Anlık Sonuç Ekranı**:
   - **Yüzde Payı**: Örneğin `1.000 ₺` nin `%20` si = `200,00 ₺` (Tek tıkla panoya kopyalama).
   - **Tutar + %**: Eklendiğinde toplam tutar (KDV / Zam = `1.200,00 ₺`).
   - **Tutar - %**: İndirildiğinde net tutar (İskonto / İndirim = `800,00 ₺`).

---

## 🚀 Vercel'e Aktarma (Canlıya Alma)

- **GitHub ile**: Bu klasördeki dosyaları GitHub deponuza yükleyip [vercel.com](https://vercel.com) üzerinden projeyi bağlayarak tek tıkla canlıya alabilirsiniz (`vercel.json` hazırdır).
- **Vercel CLI ile**: Terminalden `cd C:\Users\Hakan\.gemini\antigravity\scratch\yuzde-hesaplayici` ve `vercel` komutunu çalıştırmanız yeterlidir.
