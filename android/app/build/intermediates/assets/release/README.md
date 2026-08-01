# Maze of Fear

**Maze of Fear**, retro PSX (PlayStation 1) estetiğini modern 3D web teknolojileriyle birleştiren, tarayıcı tabanlı birinci şahıs bir hayatta kalma-korku ve labirent oyunudur. Karanlığın, sisin ve bilinmezliğin hâkim olduğu bu uğursuz dehlizlerde oyuncular, sadece ellerindeki askeri tip taktik el fenerinin zayıf ışığına güvenerek çıkış yolunu bulmaya çalışırlar. Ancak bu labirentte yalnız değilsiniz; her köşede sizi bekleyen gizemler, kilitli kapılar ve gölgelerin arasında fısıldayan korkular var.

### 🕯️ Atmosfer ve Hikaye
Kendinizi nemli duvarlar, sararmış sarmaşıklar ve yoğun, boğucu bir gri sis bulutunun ortasında buluyorsunuz. Havanın kasveti ve uzaktan gelen tekinsiz sesler, labirentin yaşayan bir organizma gibi sizi yutmaya çalıştığını hissettiriyor. Maze of Fear, oyuncuyu gereksiz görsel karmaşadan uzaklaştırarak doğrudan klostrofobik bir hayatta kalma mücadelesinin içine bırakır. Oyundaki amacınız zifiri karanlık labirentlerde ipuçlarını toplamak, anahtarları bulmak, kilitli demir kapıları aşmak ve her adımda azalan enerjinizi (stamina) yöneterek bir sonraki seviyeye geçmektir. Staminanızı dikkatli kullanmalısınız; çünkü karakteriniz yorulduğunda adımları yavaşlar ve karanlığın içindeki tekinsiz varlıklara karşı savunmasız kalır.

### 🛠️ Teknolojik Altyapı ve Tasarım
Oyun, herhangi bir eklentiye ihtiyaç duymadan doğrudan tarayıcı üzerinden 60 FPS akıcılıkla çalışacak şekilde **Three.js** (WebGL kütüphanesi) kullanılarak geliştirilmiştir. Düşük poligonlu (low-poly) 3D modeller, retro piksel filtreli kaplamalar (NearestFilter) ve sis derinliği sayesinde 90'ların sonundaki klasik PlayStation 1 korku oyunlarının (Silent Hill, Resident Evil) o ikonik, pürüzlü görsel tarzı birebir yaşatılır. Elinizde tuttuğunuz mat siyah taktik fener, dinamik spot ışık kaynakları ve gerçek zamanlı gölge hesaplamaları ile labirent duvarlarındaki sarmaşıklara derinlik kazandırır. Oyuncu hareket ettikçe devreye giren dinamik kafa sallanma (head bobbing) ve fare hareketlerine duyarlı el feneri süzülmesi (flashlight sway), oyunun gerçekçiliğini ve klostrofobik hissini zirveye taşır.

---

## 🎮 Nasıl Oynanır?

* **WASD / Yön Tuşları**: Hareket
* **Mouse (Fare)**: Etrafa Bakma (Görüş Açısı)
* **F**: El Fenerini Aç / Kapat
* **Shift**: Koşma (Stamina Tüketir)
* **E / Space**: Etkileşim (Sandıkları açma, anahtarları alma, kapıları kilit açma)
* **M**: Haritayı Aç / Kapat (Eğer harita eşyasını bulduysanız)

---

## 🚀 Özellikler

* **PSX Tarzı Retro Grafikler**: 90'ların korku oyunlarına selam gönderen düşük çözünürlüklü piksel dokular ve loş ışıklandırma.
* **Dinamik Işık ve Gölgeler**: Elinizdeki fenerin açısına göre gerçek zamanlı yön değiştiren karanlık gölgeler.
* **Gelişmiş Koridor Kapıları**: Labirent yollarını tamamen kapatacak şekilde duvarlar arasına enlemesine yerleşen demir parmaklıklı kapılar ve barikatlar.
* **Gelişmiş Hareket Dinamikleri**: Koşarken staminanın tükenmesiyle başlayan yorulma mekaniği, gerçekçi kafa bobbing ve fener sway efektleri.
