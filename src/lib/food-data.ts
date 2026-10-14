// Yemek veritabanı. Her satır: ad | emoji | etiketler (boşlukla)
// Etiket anlamları foods.ts içindeki TAGS tablosunda.
// Hüküm etiketlerden ve döneme göre hesaplanır, kişisel kayıtlar geldikçe üzerine yazılır.
// Kurallar: her yemek bir kez ve tek kategoride; porsiyon farkı ayrı yemek değildir;
// yalnızca etiketi değişen hazırlık farkları (kabuksuz, laktozsuz, sade…) ayrı satırdır.

export const FOOD_SOURCE = `
# Çorba
Mercimek çorbası|🍲|pure
Ezogelin çorbası|🍲|pure aci_hafif
Yeşil mercimek çorbası|🍲|baklagil lif
Mercimekli bulgur çorbası|🍲|pure lif
Süzme sebze çorbası|🥕|hafif
Sebze çorbası (parçalı)|🥕|lif
Tavuk suyu çorba|🍜|hafif
Sebzeli tavuk çorbası|🍲|hafif
Terbiyeli tavuk çorbası|🍲|hafif sut_az
Kremalı tavuk çorbası|🍲|sut yag_hafif
Tavuklu şehriye çorbası|🍜|hafif
Tavuklu pirinç çorbası|🍚|hafif
Kemik suyu|🦴|hafif
Şehriye çorbası|🍜|hafif
Sebzeli şehriye çorbası|🍜|hafif
Pirinç çorbası|🍚|hafif
Un çorbası|🥣|hafif yag_hafif
Erişte çorbası|🍜|hafif
Bulgur çorbası|🥣|lif
Yayla çorbası|🥣|fermente
Düğün çorbası|🥣|fermente yag_hafif
Sultan çorbası|🥣|fermente yag_hafif
Ayran aşı çorbası|🥣|fermente lif
Avşar çorbası|🥣|fermente baklagil
Lebeniye|🥣|fermente baklagil
Toyga çorbası|🥣|fermente baklagil
Tutmaç çorbası|🥣|fermente baklagil
Tarhana çorbası|🥣|fermente asit aci_hafif
Arabaşı çorbası|🍲|aci asit yag_hafif
Analı kızlı|🍲|baklagil aci
Mahluta|🍲|pure baklagil
Nohut çorbası|🍲|baklagil
Börülce çorbası|🍲|baklagil
Yarma çorbası|🥣|lif fermente
Dövme çorbası|🥣|lif baklagil
Domates çorbası|🍅|asit
Kremalı domates çorbası|🍅|asit sut
Mantar çorbası|🍄|sut lif
Kremalı mantar çorbası|🍄|sut yag lif
Brokoli çorbası|🥦|lahana pure
Kremalı brokoli çorbası|🥦|lahana pure sut
Karnabahar çorbası|🥦|lahana pure
Balkabağı çorbası|🎃|pure
Patates çorbası|🥔|pure sut_az
Pırasalı patates çorbası|🥔|pure lahana
Havuç çorbası|🥕|pure
Zencefilli havuç çorbası|🥕|pure aci_hafif
Kabak çorbası|🥒|pure
Kabak çiçeği çorbası|🌼|pure
Kereviz çorbası|🥣|pure
Bezelye çorbası|🫛|pure baklagil
Ispanak çorbası|🥬|pure lif
Kuşkonmaz çorbası|🌱|pure sut_az
Enginar çorbası|🌼|pure
Bamya çorbası|🍲|lif cekirdek asit
Mısır çorbası|🌽|kabuk sut_az
Sütlü mısır çorbası|🌽|sut kabuk
Lahana çorbası|🥬|lahana lif
Karalahana çorbası|🥬|lahana lif baklagil
Pırasa çorbası|🥬|lahana
Soğan çorbası|🧅|lahana yag sut_az
Kuzu etli sebze çorbası|🍲|yag_hafif lif
Ekşili köfte çorbası|🍲|asit yag_hafif
İşkembe çorbası|🍲|yag lahana
Kelle paça|🍲|yag lahana
Paça çorbası|🍲|yag
Beyran|🍲|yag aci lahana
Balık çorbası|🐟|hafif
Hamsi çorbası|🐟|yag_hafif
Pancar çorbası (borş)|🫜|lif asit
Miso çorbası|🍜|fermente
Ramen|🍜|yag_hafif aci_hafif
Pho|🍜|aci_hafif
Tavuklu noodle çorbası|🍜|hafif
Wonton çorbası|🥟|hafif
Tom yum|🍲|aci asit
Tom kha gai|🍲|aci_hafif yag
Gazpacho|🍅|cig asit
Minestrone|🥣|baklagil lif asit
Fransız soğan çorbası|🧅|lahana yag sut_az
Hazır çorba (paket)|🥣|katki
Yuvalama|🍲|fermente baklagil yag_hafif

# Et & tavuk
Izgara tavuk göğsü|🍗|hafif
Haşlanmış tavuk|🍗|hafif
Fırın tavuk|🍗|hafif
Tavuk but (derisiz)|🍗|yag_hafif
Tavuk incik (derisiz)|🍗|hafif
Fırında tavuk baget|🍗|yag_hafif
Tavuk pirzola|🍗|yag_hafif
Tavuk kanat|🍗|yag
Tavuk şiş|🍢|yag_hafif
Tavuk çöp şiş|🍢|yag_hafif aci_hafif
Tavuk sote|🥘|yag_hafif aci_hafif asit
Tavuk kavurma|🍗|yag aci_hafif
Tavuk haşlama sebzeli|🍲|hafif
Tavuk güveç|🍲|asit yag_hafif
Tavuklu bezelye|🍲|yag_hafif baklagil
Tavuk ciğer sote|🍗|yag_hafif
Tavuk taşkebabı|🍲|yag_hafif asit
Kremalı tavuk|🍗|sut yag
Mantarlı tavuk|🍗|yag_hafif lif
Köri soslu tavuk|🍛|aci sut yag
Tavuk schnitzel|🍗|yag
Kızarmış tavuk|🍗|yag
Tavuk nugget|🍗|yag katki
Çerkez tavuğu|🍗|kuruyemis yag lahana
Piliç çevirme|🍗|yag
Izgara hindi|🦃|hafif
Fırında hindi göğsü|🦃|hafif
Haşlanmış hindi|🦃|hafif
Hindi köfte|🧆|hafif
Hindi füme|🦃|islenmis
Izgara köfte|🧆|yag_hafif
İnegöl köfte|🧆|yag_hafif
Akçaabat köfte|🧆|yag aci_hafif
Tekirdağ köfte|🧆|yag aci_hafif
Islama köfte|🧆|yag aci_hafif
Kadınbudu köfte|🧆|yag
İzmir köfte|🧆|yag asit
Dalyan köfte|🧆|yag_hafif
Kuru köfte|🧆|yag
Sulu köfte|🍲|asit yag_hafif
Fırında köfte patates|🧆|yag_hafif asit
İçli köfte|🧆|yag kuruyemis
Haşlama içli köfte|🧆|kuruyemis lif
Çiğ köfte|🌯|aci cig lif
Kuzu pirzola|🍖|yag
Kuzu şiş|🍢|yag
Kuzu tandır|🍖|yag
Kuzu incik|🍖|yag
Kuzu kapama|🍖|yag
Kuzu güveç|🍲|yag asit
Kuzu kol fırın|🍖|yag
Kuzu çevirme|🍖|yag
Kuzu haşlama|🍲|yag_hafif
Dana bonfile|🥩|hafif
Antrikot|🥩|yag_hafif
Biftek|🥩|yag_hafif
Steak (az pişmiş)|🥩|yag_hafif
Rosto|🥩|yag_hafif
Rosto dana (ince dilim)|🥩|hafif
Haşlama et|🍲|yag_hafif
Et haşlama sebzeli|🍲|hafif
Et sote|🥘|yag_hafif aci_hafif asit
Dana yahni|🍲|yag_hafif asit
Tas kebabı|🍲|yag_hafif
Orman kebabı|🍲|yag_hafif lif
Hünkar beğendi|🍖|yag sut
Ali nazik|🍖|yag fermente lahana
İskender|🍖|yag fermente asit
Adana kebap|🍢|yag aci
Urfa kebap|🍢|yag
Beyti|🌯|yag aci
Şiş kebap|🍢|yag_hafif
Patlıcan kebabı|🍆|yag kabuk
Testi kebabı|🍲|yag lahana
Çökertme kebabı|🍖|yag sut_az
Kağıt kebabı|🍖|yag_hafif
Fırın kebabı|🍖|yag
Cağ kebabı|🍢|yag
Tokat kebabı|🍖|yag kabuk
Bursa kebabı (pideli)|🍖|yag fermente asit
Kebap tabağı|🍖|yag aci_hafif
Elbasan tava|🍲|sut yag
Etli nohut|🍲|baklagil yag_hafif
Etli bamya|🍲|yag_hafif lif
Kavurma|🍖|yag
Sac kavurma|🍳|yag aci_hafif
Kavurma (konserve)|🥫|islenmis yag
Kavurmalı yumurta|🍳|yag
Ciğer tava|🍖|yag
Ciğer şiş|🍢|yag_hafif aci_hafif
Arnavut ciğeri|🍖|yag aci lahana
Böbrek ızgara|🍢|yag_hafif
Uykuluk|🍢|yag
Kelle|🍖|yag
Beyin haşlama|🍖|yag_hafif
Dil (haşlama)|🍖|yag
Kokoreç|🌯|yag aci
Bumbar dolması|🌭|yag aci
Et döner|🥙|yag islenmis
Tavuk döner|🥙|yag
Döner tabak|🍖|yag
Sucuk|🌭|islenmis yag aci
Pastırma|🥓|islenmis aci lahana
Salam|🥓|islenmis katki
Hindi salam|🍖|islenmis
Sosis|🌭|islenmis katki
Jambon|🥓|islenmis
Dana jambon|🍖|islenmis
Füme et|🥓|islenmis yag
Bacon|🥓|islenmis yag
Tantuni|🌯|yag aci
Izgara burger köftesi (ekmeksiz)|🥩|yag_hafif
Kuzu kaburga|🍖|yag
Kaburga dolması|🍖|yag kuruyemis
Çöp şiş|🍢|yag
Fıstıklı kebap|🍢|yag kuruyemis
Tirit|🍖|yag fermente
Şırdan|🍖|yag aci

# Balık & deniz ürünleri
Izgara somon|🐟|hafif
Fırın somon|🐟|hafif
Somon buğulama|🐟|hafif
Somon füme|🐟|islenmis
Buğulama levrek|🐟|hafif
Izgara levrek|🐟|hafif
Fırın levrek|🐟|hafif
Izgara çipura|🐟|hafif
Fırın çipura|🐟|hafif
Fırın mezgit|🐟|hafif
Mezgit tava|🐟|yag
Haşlanmış balık|🐟|hafif
Balık buğulama sebzeli|🐟|hafif
Kalkan ızgara|🐟|hafif
Kalkan tava|🐟|yag
Dil balığı|🐟|hafif
Morina (fırın)|🐟|hafif
Alabalık ızgara|🐟|hafif
Fırın alabalık|🐟|hafif
Ton balığı (suda)|🐟|hafif
Ton balığı (yağlı)|🐟|yag_hafif
Ton balığı ızgara|🐟|hafif
Uskumru ızgara|🐟|yag_hafif
Uskumru buğulama|🐟|yag_hafif
Hamsi tava|🐟|yag
Hamsi buğulama|🐟|yag_hafif
Hamsili pilav|🐟|yag_hafif
Palamut ızgara|🐟|yag_hafif
Lüfer ızgara|🐟|yag_hafif
Sardalya ızgara|🐟|yag_hafif
Barbunya tava|🐟|yag
İstavrit tava|🐟|yag
Çinekop tava|🐟|yag
Kılıç şiş|🍢|yag_hafif
Balık şiş|🍢|hafif
Balık köftesi|🐟|yag
Lakerda|🐟|yag_hafif
Fish and chips|🐟|yag
Kalamar tava|🦑|yag
Kalamar ızgara|🦑|kabuk
Ahtapot ızgara|🐙|kabuk
Ahtapot salatası|🐙|cig asit
Karides (haşlama)|🦐|hafif
Izgara karides|🦐|hafif
Karides tava|🦐|yag
Tereyağlı karides|🦐|yag sut_az
Karides güveç|🦐|yag sut_az aci
Midye dolma|🦪|aci_hafif
Midye tava|🦪|yag
Midye buğulama|🦪|hafif
İstiridye|🦪|hafif
Yengeç|🦀|hafif
Istakoz|🦞|hafif
Sushi (çiğ balık)|🍣|hafif
Sushi (pişmiş)|🍣|hafif
Somon sushi roll|🍣|hafif
California roll|🍣|yag_hafif
Sashimi|🍣|hafif
Tempura|🍤|yag
Balık ekmek|🥙|yag_hafif cig lahana

# Sebze yemekleri
Zeytinyağlı taze fasulye|🫛|lif
Etli taze fasulye|🫛|lif yag_hafif
Zeytinyağlı enginar|🌼|lif
Enginar dolması|🌼|lif
Zeytinyağlı pırasa|🥬|lahana lif
Etli pırasa|🍲|lahana yag_hafif
Zeytinyağlı kereviz|🥕|lif
Zeytinyağlı bamya|🌿|lif cekirdek
Zeytinyağlı börülce|🫘|baklagil kabuk
Zeytinyağlı kabak|🥒|hafif yag_hafif
Zeytinyağlı patlıcan|🍆|yag kabuk
Zeytinyağlı lahana|🥬|lahana lif
Zeytinyağlı karnabahar|🥦|lahana
Zeytinyağlı brokoli|🥦|lahana lif
Zeytinyağlı havuç|🥕|hafif yag_hafif
Zeytinyağlı semizotu|🌿|lif
Zeytinyağlı biber dolması|🫑|kabuk kuruyemis
Etli biber dolması|🫑|kabuk
Etli kabak dolması|🥒|hafif
Kabak dolması (zeytinyağlı)|🥒|hafif yag_hafif
Domates dolması|🍅|asit yag_hafif
Patlıcan dolması|🍆|kabuk yag
Kuru patlıcan dolması|🍆|kabuk aci yag_hafif
Kabak çiçeği dolması|🌼|hafif yag_hafif
Mantar dolması|🍄|lif yag_hafif
Yaprak sarma|🍃|lif
Etli yaprak sarma|🍃|lif yag_hafif
Lahana sarması|🥬|lahana lif
Karalahana sarması|🥬|lahana lif
Ispanak yemeği|🥬|lif
Kıymalı ıspanak|🥬|yag_hafif lif
Ispanaklı yumurta|🥬|lif yag_hafif
Pazı yemeği|🥬|lif
Semizotu yemeği|🌿|lif
Ebegümeci yemeği|🌿|lif
Kabak sote (kabuksuz)|🥒|hafif
Etli kabak|🥒|yag_hafif
Patatesli kabak|🥒|hafif
Kabak mücver|🥒|yag lahana
Fırın mücver|🥒|yag_hafif lahana
Kabak graten|🥒|sut yag_hafif
Patlıcan musakka|🍆|yag kabuk asit
Kabak musakka|🥒|yag_hafif asit
Karnıyarık|🍆|yag kabuk
İmam bayıldı|🍆|yag lahana
Patlıcan kızartma|🍆|yag kabuk
Kabak kızartma|🥒|yag
Biber kızartma|🫑|yag kabuk
Şakşuka|🍆|yag asit kabuk
Patlıcan oturtma|🍆|yag kabuk asit
Beğendi (patlıcan püresi)|🍆|sut yag_hafif
Türlü|🥘|lif lahana asit
Sebze güveç|🥘|lif yag_hafif
Fırın sebze|🥕|lif
Sebze sote|🥘|yag_hafif lif
Ratatouille|🍆|asit kabuk yag_hafif
Patates yemeği|🥔|hafif
Etli patates|🥔|yag_hafif
Patates oturtma|🥔|yag_hafif asit
Patates püresi|🥔|sut_az
Sütsüz patates püresi|🥔|hafif
Fırın patates|🥔|kabuk
Fırın patates (kabuksuz)|🥔|hafif
Fırında sebzeli patates|🥔|yag_hafif lif
Patates graten|🥔|sut yag
Patates köftesi|🥔|yag_hafif
Patates kızartması|🍟|yag
Elma dilim patates|🍟|yag
Tatlı patates (fırın)|🍠|hafif
Tatlı patates püresi|🍠|pure
Bezelye yemeği|🫛|baklagil kabuk
Etli bezelye|🍲|baklagil yag_hafif
Karnabahar kızartması|🥦|lahana yag
Fırın karnabahar|🥦|lahana yag_hafif
Karnabahar graten|🥦|lahana sut yag_hafif
Etli karnabahar|🥦|lahana yag_hafif
Etli lahana|🥬|lahana yag_hafif
Kapuska|🥬|lahana
Mantar sote|🍄|lif yag_hafif
Pancar yemeği|🫜|lif
Şalgam yemeği|🫜|lif lahana
Turp otu yemeği|🥬|lif lahana
Pırasa köftesi|🥬|lahana yag
Kereviz püresi|🥕|pure
Balkabağı püresi|🎃|pure
Havuç püresi|🥕|pure
Kabak püresi|🥒|pure
Bezelye püresi|🫛|pure baklagil
Ispanak püresi|🥬|pure
Sebze püresi|🥣|pure
Buharda brokoli ve havuç|🥦|lahana
Fırın kabak|🥒|hafif
Fırın balkabağı|🎃|hafif
Közlenmiş kabak|🥒|kabuk
Közlenmiş mantar|🍄|lif
Kabak spagetti|🥒|hafif

# Sebze & yeşillik
Haşlanmış patates|🥔|hafif
Haşlanmış havuç|🥕|hafif
Haşlanmış kabak|🥒|hafif
Havuç (çiğ)|🥕|cig lif
Salatalık|🥒|cig kabuk
Salatalık (kabuksuz)|🥒|cig
Domates|🍅|cig asit kabuk
Soyulmuş domates|🍅|asit
Kiraz domates|🍅|cig asit kabuk
Marul|🥬|cig
Göbek marul|🥬|cig
Kıvırcık marul|🥬|cig lif
Roka|🌿|cig lif
Tere|🌿|cig lif
Semizotu (çiğ)|🌿|cig lif
Ispanak (çiğ)|🥬|cig lif
Ispanak (haşlama)|🥬|lif
Maydanoz|🌿|cig lif
Dereotu|🌿|cig
Taze nane|🌿|hafif
Taze fesleğen|🌿|hafif
Taze kişniş|🌿|hafif
Taze soğan|🧅|cig lahana
Kuru soğan|🧅|lahana
Mor soğan|🧅|cig lahana
Sarımsak|🧄|lahana
Yeşil biber (çiğ)|🫑|cig kabuk
Kırmızı biber (çiğ)|🫑|cig kabuk
Sivri biber|🌶️|cig kabuk aci_hafif
Acı biber|🌶️|aci kabuk
Közlenmiş biber|🫑|kabuk
Közlenmiş kırmızı biber (kabuksuz)|🫑|hafif
Fırın biber|🌶️|kabuk
Közlenmiş patlıcan|🍆|kabuk
Beyaz lahana|🥬|cig lahana lif
Kırmızı lahana|🥬|cig lahana lif
Karalahana|🥬|lahana lif
Brüksel lahanası|🥬|lahana lif
Brokoli (buharda)|🥦|lahana lif
Karnabahar (haşlama)|🥦|lahana lif
Kuşkonmaz (uçları, haşlama)|🌿|hafif
Kuşkonmaz (ızgara)|🌱|lif
Pırasa (haşlama)|🥬|lahana
Kereviz sapı|🥬|cig lif
Enginar (haşlama)|🌼|lif
Taze fasulye (haşlama)|🫛|lif
Bamya|🌿|lif cekirdek
Bezelye|🫛|baklagil kabuk
Mısır (haşlama)|🌽|lif kabuk
Mısır (konserve)|🌽|lif kabuk
Mantar (çiğ)|🍄|cig lif
Pancar (haşlama)|🫜|lif
Turp|🫜|cig lahana
Yer elması (haşlama)|🥔|lahana

# Bakliyat
Etli kuru fasulye|🫘|baklagil yag_hafif
Zeytinyağlı kuru fasulye|🫘|baklagil
Kuru börülce yemeği|🫘|baklagil
Barbunya pilaki|🫘|baklagil
Etli barbunya|🫘|baklagil yag_hafif
Nohut yemeği|🫘|baklagil
Nohutlu ıspanak|🥬|baklagil lif
Nohut (haşlama)|🫘|baklagil kabuk
Kırmızı mercimek yemeği|🍲|pure
Yeşil mercimek yemeği|🫘|baklagil lif
Mercimek püresi|🍲|pure
Mercimekli bulgur|🍲|baklagil lif
Kırmızı mercimek köftesi|🧆|pure aci cig
Mercimek köftesi (acısız)|🧆|pure cig
Humus|🫘|baklagil kuruyemis
Süzme nohut püresi|🫘|pure baklagil
Fava|🫘|pure baklagil
Fasulye ezmesi|🫘|pure baklagil
Falafel|🧆|baklagil yag
Bakla|🫛|baklagil kabuk
Maş fasulyesi|🫘|baklagil
Siyah fasulye|🫘|baklagil kabuk
Kırmızı fasulye (konserve)|🥫|baklagil kabuk
Bezelye (konserve)|🥫|baklagil
Edamame|🫛|baklagil kabuk
Soya kıyması|🫘|baklagil
Tofu|🧈|hafif
Tempeh|🫘|fermente baklagil

# Pilav & tahıl
Pirinç pilavı|🍚|hafif
Sade beyaz pirinç|🍚|hafif
Pirinç lapası|🍚|pure
Tereyağlı pilav|🍚|yag_hafif
Şehriyeli pilav|🍚|hafif
Arpa şehriye|🍝|hafif
Havuçlu pilav|🥕|hafif
Sebzeli pilav|🍚|lif
Tavuklu pilav|🍚|hafif
Etli pilav|🍚|yag_hafif
Özbek pilavı|🍚|yag kabuk lif
Nohutlu pilav|🍚|baklagil
Bezelyeli pilav|🍚|baklagil
Mantarlı pilav|🍄|lif
Patlıcanlı pilav|🍆|yag kabuk
İç pilav|🍚|kuruyemis yag_hafif
Perde pilavı|🍚|kuruyemis yag
Basmati pirinç|🍚|hafif
Jasmine pirinç|🍚|hafif
Esmer pirinç|🍚|lif
Siyah pirinç|🍚|lif
Bulgur pilavı|🍚|lif
Domatesli bulgur pilavı|🍚|lif asit
Firik pilavı|🌾|lif
Keşkek|🍲|lif yag_hafif
Kinoa|🍚|lif
Karabuğday|🍚|lif
Kuskus|🍚|hafif
Bulgur köftesi|🧆|lif aci_hafif
Risotto|🍚|sut_az yag_hafif
Mantarlı risotto|🍚|sut_az lif
Paella|🥘|asit yag_hafif
Kızarmış pilav (fried rice)|🍚|yag

# Makarna & mantı
Sade makarna|🍝|hafif
Tereyağlı makarna|🍝|yag_hafif
Domates soslu makarna|🍝|asit
Fesleğenli makarna|🍝|asit
Bolonez makarna|🍝|asit yag_hafif
Kıymalı makarna|🍝|yag_hafif asit
Kremalı makarna|🍝|sut yag
Kremalı mantarlı makarna|🍝|sut yag lif
Alfredo makarna|🍝|sut yag
Pesto makarna|🍝|yag kuruyemis lahana
Arabiata makarna|🍝|aci asit
Carbonara|🍝|yag sut_az islenmis
Spagetti aglio olio|🍝|yag lahana aci_hafif
Ton balıklı makarna|🍝|yag_hafif
Tavuklu makarna|🍝|yag_hafif
Deniz mahsullü makarna|🍝|yag_hafif asit
Peynirli makarna|🍝|sut_az yag_hafif
Mac and cheese|🧀|sut yag
Fırın makarna|🍝|sut yag_hafif
Lazanya|🍝|sut yag asit
Tam buğday makarna|🍝|lif
Glutensiz makarna|🍝|hafif
Ravioli|🥟|sut_az yag_hafif
Tortellini|🥟|sut_az yag_hafif
Gnocchi|🥔|hafif
Erişte|🍝|hafif
Mercimekli erişte|🍜|baklagil
Mantı|🥟|fermente lahana aci_hafif yag_hafif
Mantı (yoğurtsuz, sossuz)|🥟|hafif
Hingel|🥟|fermente yag lahana
Pirinç eriştesi|🍜|hafif
Udon|🍜|hafif
Yaki udon|🍜|yag_hafif
Soba|🍜|lif
Noodle (sebzeli)|🍜|yag_hafif lahana
Hazır noodle|🍜|katki yag aci_hafif

# Hamur işi & börek
Börek (peynirli)|🥐|yag sut_az
Börek (kıymalı)|🥐|yag
Börek (ıspanaklı)|🥐|yag lif
Patatesli börek|🥧|yag_hafif
Pırasalı börek|🥧|lahana yag_hafif
Su böreği (peynirli)|🥧|yag_hafif sut_az
Su böreği (kıymalı)|🥧|yag
Kol böreği|🥐|yag
Sigara böreği|🥐|yag sut_az
Paçanga böreği|🥧|islenmis yag
Talaş böreği|🥧|yag
Puf böreği|🥧|yag
Çiğ börek|🥟|yag
Kayseri yağlaması|🫓|yag fermente asit
Gözleme (peynirli)|🫓|yag_hafif sut_az
Gözleme (patatesli)|🫓|yag_hafif
Gözleme (ıspanaklı)|🫓|yag_hafif lif
Gözleme (kıymalı)|🫓|yag_hafif
Lahmacun|🫓|aci_hafif cig yag_hafif
Kıymalı pide|🫓|yag
Kuşbaşılı pide|🫓|yag
Kaşarlı pide|🫓|yag sut_az
Peynirli pide (az yağlı)|🫓|sut_az yag_hafif
Sucuklu pide|🫓|islenmis yag aci_hafif
Ispanaklı pide|🫓|yag_hafif lif
Karışık pide|🫓|yag islenmis
Yumurtalı pide|🫓|yag_hafif
Etli ekmek|🫓|yag
Pişi|🫓|yag
Katmer|🫓|yag seker
Poğaça (sade)|🥐|yag
Poğaça (peynirli)|🥐|yag_hafif sut_az
Poğaça (zeytinli)|🥐|yag
Dereotlu poğaça|🥐|yag_hafif
Açma|🥐|yag seker
Çörek|🥐|yag seker
Tahinli çörek|🥐|kuruyemis seker yag
Ay çöreği|🥐|kuruyemis seker yag
Kruvasan|🥐|yag
Çikolatalı kruvasan|🥐|yag seker
Boyoz|🥐|yag
Kete|🥐|yag
Simit|🥯|kuruyemis

# Ekmek
Beyaz ekmek|🍞|hafif
Köy ekmeği|🍞|lif
Ekşi mayalı ekmek|🍞|hafif
Baget ekmek|🥖|hafif
Tam buğday ekmeği|🍞|lif
Çavdar ekmeği|🍞|lif
Kepekli ekmek|🍞|lif
Yulaf ekmeği|🍞|lif
Tohumlu ekmek|🍞|lif kuruyemis
Glutensiz ekmek|🍞|hafif
Mısır ekmeği|🌽|lif
Pide (sade)|🫓|hafif
Bazlama|🫓|hafif
Lavaş|🫓|hafif
Yufka|🫓|hafif
Tandır ekmeği|🫓|hafif
Pita ekmeği|🫓|hafif
Tortilla|🫓|hafif
Bagel|🥯|hafif
Hamburger ekmeği|🍞|hafif
Sandviç ekmeği|🍞|hafif
Tost ekmeği|🍞|hafif
Ekmek kızartması|🍞|hafif
Galeta|🍘|hafif
Grissini|🥖|hafif

# Kahvaltı
Haşlanmış yumurta|🥚|hafif
Rafadan yumurta|🥚|hafif
Poşe yumurta|🥚|hafif
Fırın yumurta|🥚|hafif
Sahanda yumurta|🍳|yag_hafif
Tereyağlı yumurta|🍳|yag
Sade omlet|🍳|yag_hafif
Yumurta beyazı omlet|🍳|hafif
Peynirli omlet|🍳|yag_hafif sut_az
Lor peynirli omlet|🍳|hafif sut_az
Mantarlı omlet|🍳|yag_hafif lif
Ispanaklı omlet|🍳|lif yag_hafif
Sebzeli omlet|🍳|yag_hafif lif
Patatesli yumurta|🍳|yag_hafif
Kayganak|🍳|yag_hafif
Yumurtalı ekmek|🍞|yag
Fransız tostu|🍞|yag sut_az seker
Menemen|🍳|asit yag_hafif
Soğanlı menemen|🍳|asit lahana yag_hafif
Peynirli menemen|🍳|asit sut_az
Çılbır|🍳|fermente aci_hafif yag_hafif
Sucuklu yumurta|🍳|islenmis yag aci
Pastırmalı yumurta|🍳|islenmis yag aci
Mıhlama (kuymak)|🧀|yag sut_az
Siyah zeytin|🫒|yag_hafif
Yeşil zeytin|🫒|yag_hafif
Zeytin ezmesi|🫒|yag_hafif
Zeytinyağı + kekik|🫒|yag_hafif
Tereyağı|🧈|yag_hafif
Kaymak|🥛|yag sut
Bal|🍯|seker
Bal kaymak|🍯|yag sut seker
Reçel|🍓|seker
Pekmez|🍯|seker
Tahin|🥜|kuruyemis yag
Tahin pekmez|🥜|kuruyemis seker
Fıstık ezmesi|🥜|kuruyemis yag
Fındık kreması|🍫|seker yag kuruyemis
Domates salatalık söğüş|🥗|cig kabuk
Serpme kahvaltı|🍳|yag_hafif sut_az kabuk
Simit + beyaz peynir|🥯|kuruyemis sut_az
Kaşarlı tost|🥪|sut_az yag_hafif
Karışık tost|🥪|islenmis sut_az yag_hafif
Sucuklu tost|🥪|islenmis aci yag
Avokadolu tost|🥑|yag_hafif
Peynirli sandviç|🥪|sut_az
Hindi füme sandviç|🥪|islenmis
Tahinli ekmek|🍞|yag_hafif kuruyemis
Yulaf lapası|🥣|pure
Sütlü yulaf lapası|🥣|pure sut
Muzlu yulaf lapası|🥣|pure
Elmalı yulaf|🥣|pure
Overnight oats|🥣|sut lif
Chia puding|🥣|lif cekirdek
Granola|🥣|lif kuruyemis seker
Yoğurtlu granola|🥣|lif kuruyemis fermente
Müsli|🥣|lif kuruyemis
Mısır gevreği|🥣|seker katki
Muz ezmesi|🍌|pure
Pankek|🥞|yag_hafif seker
Pankek (muzlu, yulaflı)|🥞|hafif
Krep|🥞|yag_hafif sut_az
Waffle|🧇|yag seker

# Süt ürünleri & peynir
Beyaz peynir|🧀|sut_az
Beyaz peynir (tam yağlı)|🧀|sut_az yag_hafif
Light beyaz peynir|🧀|sut_az
Ezine peyniri|🧀|sut_az
Lor peyniri|🧀|sut_az
Çökelek|🧀|sut_az
Süzme peynir|🧀|sut_az
Kaşar peyniri|🧀|sut_az
Eski kaşar|🧀|sut_az
Tulum peyniri|🧀|sut_az yag_hafif
Örgü peyniri|🧀|sut_az
Dil peyniri|🧀|sut_az
Çerkez peyniri|🧀|sut_az
Otlu peynir|🧀|sut_az lahana
Hellim (ızgara)|🧀|sut_az yag_hafif
Keçi peyniri|🧀|sut_az
Laktozsuz peynir|🧀|hafif
Labne|🧀|sut
Krem peynir|🧀|sut yag_hafif
Ricotta|🧀|sut
Mozzarella|🧀|sut_az
Feta|🧀|sut_az
Parmesan|🧀|sut_az
Gravyer|🧀|sut_az
Cheddar|🧀|sut_az
Rokfor|🧀|sut_az fermente
Brie|🧀|sut_az yag
Sade yoğurt|🥛|fermente
Süzme yoğurt|🥛|fermente
Manda yoğurdu|🥛|fermente yag_hafif
Keçi yoğurdu|🥛|fermente
Kaymaklı yoğurt|🥛|fermente yag_hafif
Laktozsuz yoğurt|🥛|hafif
Probiyotik yoğurt|🥛|fermente
Meyveli yoğurt|🥛|fermente seker
Kefir|🥛|fermente
Laktozsuz kefir|🥛|fermente
Kefir (meyveli)|🥛|fermente seker
Krema (sıvı)|🥛|sut yag

# Salata & mezeler
Çoban salata|🥗|cig kabuk lahana
Mevsim salata|🥗|cig
Marul salatası|🥬|cig
Roka salatası|🥗|cig lif
Ispanak salatası|🥬|cig lif
Gavurdağı salatası|🥗|cig kuruyemis aci
Beyaz lahana salatası|🥬|cig lahana lif
Kırmızı lahana salatası|🥬|cig lahana lif
Semizotu salatası|🌿|cig lif
Mantar salatası|🍄|cig lif
Haşlanmış sebze salatası|🥗|hafif
Pancar salatası|🫜|lif
Patates salatası|🥔|asit lahana
Makarna salatası|🥗|asit cig
Kuskus salatası|🥗|lif cig
Kinoa salatası|🥗|lif cig
Mercimek salatası|🥗|baklagil cig
Nohut salatası|🥗|baklagil cig
Börülce salatası|🫘|baklagil cig
Piyaz|🫘|baklagil cig lahana
Ton balıklı salata|🥗|cig
Tavuklu salata|🥗|cig
Somon salatası|🥗|cig
Yumurta salatası|🥚|yag_hafif
Hellim salatası|🧀|cig sut_az
Sezar salata|🥗|cig sut yag
Yunan salatası|🥗|cig kabuk sut_az
Caprese|🍅|asit sut_az
Waldorf salatası|🥗|cig kuruyemis yag
Coleslaw|🥬|lahana cig yag
Avokado salatası|🥑|cig yag_hafif
Guacamole|🥑|yag_hafif cig asit
Kısır|🥗|lif aci cig
Tabule|🥗|lif cig asit
Rus salatası|🥗|yag islenmis
Deniz börülcesi|🌿|lif asit
Yoğurtlu semizotu|🌿|fermente lif
Haydari|🥛|fermente lahana
Cacık|🥒|fermente kabuk lahana
Atom|🌶️|fermente aci yag
Yoğurtlu havuç|🥕|fermente
Yoğurtlu kabak|🥒|fermente
Yoğurtlu ıspanak|🥬|fermente lif
Yoğurtlu pancar|🫜|fermente lif
Havuç tarator|🥕|fermente kuruyemis lahana
Acılı ezme|🌶️|aci cig asit
Muhammara|🌶️|kuruyemis aci
Babagannuş|🍆|kabuk lahana
Patlıcan salatası|🍆|kabuk lahana asit
Girit ezmesi|🧀|sut_az kuruyemis
Tarama|🐟|yag
Topik|🧆|baklagil yag
Turşu|🥒|fermente asit
Salatalık turşusu|🥒|asit fermente
Biber turşusu|🫑|asit aci fermente
Lahana turşusu|🥬|fermente lahana asit
Kimchi|🥬|fermente aci lahana

# Meyve
Olgun muz|🍌|hafif
Ham muz|🍌|lif
Kabuksuz elma|🍏|hafif
Kabuklu elma|🍎|kabuk
Elma püresi|🍮|hafif
Haşlanmış elma|🍮|hafif
Fırın elma|🍎|pure
Armut|🍐|kabuk lif
Armut (kabuksuz)|🍐|lif
Haşlanmış armut|🍐|hafif
Ayva (çiğ)|🍐|lif
Ayva (pişmiş)|🍐|hafif
Kavun|🍈|hafif
Karpuz|🍉|seker
Şeftali|🍑|kabuk
Şeftali (kabuksuz)|🍑|hafif
Konserve şeftali|🍑|seker
Nektarin|🍑|kabuk
Kayısı|🍑|lif
Kayısı (kabuksuz)|🍑|hafif
Erik|🫐|kabuk lif
Yeşil erik|🟢|asit kabuk
Mürdüm eriği|🟣|lif kabuk
Kiraz|🍒|kabuk
Vişne|🍒|kabuk asit
Üzüm|🍇|kabuk seker
Çekirdeksiz üzüm|🍇|kabuk
Çilek|🍓|cekirdek
Ahududu|🫐|cekirdek lif
Böğürtlen|🫐|cekirdek lif
Yaban mersini|🫐|kabuk
Frenk üzümü|🍇|cekirdek asit
Dut|🫐|cekirdek
Kivi|🥝|cekirdek lif
İncir|🫐|cekirdek lif
Nar|🍎|cekirdek
Portakal|🍊|asit lif
Mandalina|🍊|asit lif
Greyfurt|🍊|asit
Pomelo|🍊|asit
Limon|🍋|asit
Ananas|🍍|asit lif
Mango|🥭|hafif
Papaya|🥭|hafif
Liçi|🍈|hafif
Ejder meyvesi|🐉|cekirdek
Çarkıfelek meyvesi|🟣|cekirdek asit
Yenidünya|🍑|lif
Trabzon hurması|🍊|lif
Muşmula|🟤|lif
Kızılcık|🔴|asit
Avokado|🥑|yag_hafif
Hindistan cevizi|🥥|lif yag
Hurma|🌴|seker lif
Kuru kayısı|🍑|lif seker
Kuru incir|🫐|lif seker cekirdek
Kuru üzüm|🍇|lif seker kabuk
Kuru erik|🫐|lif seker
Kuru dut|🫐|lif seker
Kuru kızılcık|🔴|seker
Kuru mango|🥭|seker lif
Meyve kompostosu|🍮|hafif seker
Meyve salatası|🍓|kabuk cekirdek
Meyve püresi (bebek)|🍎|pure

# Kuruyemiş & atıştırmalık
Karışık kuruyemiş|🥜|kuruyemis yag_hafif
Badem|🥜|kuruyemis
Ceviz|🌰|kuruyemis
Fındık|🌰|kuruyemis
Antep fıstığı|🥜|kuruyemis
Yer fıstığı|🥜|kuruyemis
Kaju|🥜|kuruyemis
Ay çekirdeği|🌻|kuruyemis kabuk
Kabak çekirdeği|🎃|kuruyemis kabuk
Leblebi|🫘|baklagil
Chia tohumu|🌱|lif cekirdek
Keten tohumu|🌱|lif cekirdek
Susam|🌱|kuruyemis
Badem ezmesi|🌰|kuruyemis
Kuru dut + ceviz|🫐|kuruyemis lif
Haşlanmış kestane|🌰|lif
Kestane kebap|🌰|lif
Mısır (köz)|🌽|lif kabuk
Patlamış mısır|🍿|lif kabuk
Cips|🥔|yag aci katki
Mısır cipsi|🌽|yag islenmis
Sebze cipsi|🥕|yag
Muz cipsi|🍌|yag seker
Elma cipsi|🍎|seker
Kraker (sade)|🍘|hafif
Kraker (tam tahıllı)|🍘|lif
Çubuk kraker|🥨|hafif
Simit kraker|🥨|hafif
Peynirli kraker|🧀|sut_az yag_hafif
Pirinç patlağı|🍘|hafif
Galeta unu kurabiyesi|🍪|yag_hafif seker
Bisküvi (sade)|🍪|seker yag_hafif
Kek (sade)|🍰|seker yag_hafif
Paketli kek|🧁|seker yag katki
Gofret|🍫|seker yag katki
Çikolata (sütlü)|🍫|seker sut yag_hafif kafein_hafif
Bitter çikolata|🍫|kafein_hafif yag_hafif
Çikolatalı bar|🍫|seker yag kuruyemis katki
Protein bar|🍫|tatlandirici kuruyemis katki
Granola bar|🍫|kuruyemis seker lif
Kuru meyve bar|🍫|lif seker
Enerji topu (hurmalı)|🟤|lif kuruyemis seker
Pestil|🍑|seker lif
Lokum|🍬|seker
Fındıklı lokum|🍬|seker kuruyemis
Jelibon|🍬|seker katki
Şekersiz sakız|🍬|tatlandirici
Şekersiz şeker|🍬|tatlandirici

# Tatlı
Sütlaç|🍮|sut seker
Fırın sütlaç|🍮|sut seker
Muhallebi|🍮|sut seker
Laktozsuz muhallebi|🍮|seker
Su muhallebisi|🍮|seker
Sakızlı muhallebi|🥛|sut seker
Pirinç muhallebisi|🍚|sut seker
Kazandibi|🍮|sut seker
Tavuk göğsü (tatlı)|🍮|sut seker
Keşkül|🍮|sut seker kuruyemis
Güllaç|🍮|sut seker kuruyemis
Supangle|🍫|sut seker kafein_hafif
Puding|🍮|sut seker katki
Çikolatalı puding|🍫|sut seker kafein_hafif
Sütlü irmik|🥣|sut seker
Fırın irmik tatlısı|🍰|sut seker
Muzlu süt tatlısı|🍌|sut seker
Sütlü nuriye|🍯|sut seker yag kuruyemis
Laz böreği|🥧|sut seker yag
Magnolia|🍮|sut seker yag
Panna cotta|🍮|sut yag seker
Krem karamel|🍮|sut seker
Çikolatalı mus|🍫|sut yag seker kafein_hafif
Zerde|🍚|seker
Aşure|🥣|baklagil lif seker kuruyemis
İrmik helvası|🍮|seker yag_hafif
Un helvası|🍮|seker yag
Tahin helvası|🥜|kuruyemis seker yag
Pişmaniye|🍬|seker yag
Cezerye|🥕|seker kuruyemis
Cevizli sucuk|🍇|seker kuruyemis
Baklava|🍯|seker yag kuruyemis
Fıstıklı baklava|🍯|seker yag kuruyemis
Şöbiyet|🍯|seker yag kuruyemis
Sarığı burma|🍯|seker yag kuruyemis
Bülbül yuvası|🍯|seker yag kuruyemis
Kadayıf|🍯|seker yag kuruyemis
Burma kadayıf|🍯|seker yag kuruyemis
Ekmek kadayıfı|🍯|seker sut yag
Künefe|🧀|seker yag sut_az
Kemalpaşa tatlısı|🍯|seker sut_az
Höşmerim|🍯|seker sut_az yag
Höşmerim (laktozsuz)|🍯|seker
Revani|🍰|seker
Şekerpare|🍪|seker yag
Kalburabastı|🍪|seker yag kuruyemis
Lokma|🍩|seker yag
Tulumba|🍩|seker yag
Halka tatlısı|🍩|seker yag
Kabak tatlısı|🎃|seker kuruyemis
Kabak tatlısı (cevizsiz)|🎃|seker
Ayva tatlısı|🍐|seker
Profiterol|🍮|sut seker yag kafein_hafif
Ekler|🍮|sut seker yag
Trileçe|🍰|sut seker
Cheesecake|🍰|sut seker yag
Cheesecake (frambuazlı)|🍰|sut yag seker cekirdek
Tiramisu|🍰|sut seker kafein
Brownie|🍫|seker yag kafein_hafif
Sufle|🍫|seker yag sut kafein_hafif
Çikolatalı pasta|🎂|seker yag sut kafein_hafif
Meyveli pasta|🎂|seker sut cekirdek
Yaş pasta|🎂|seker sut yag
Mozaik pasta|🍫|yag seker sut_az
Sade pandispanya|🍰|seker
Muzlu kek|🍰|seker yag_hafif
Havuçlu kek|🥕|seker yag kuruyemis
Limonlu kek|🍋|seker yag_hafif asit
Islak kek|🍫|seker yag sut_az
Muffin|🧁|seker yag
Cupcake|🧁|seker yag sut
Elmalı tart|🥧|yag seker
Meyveli tart|🥧|yag seker sut cekirdek
Makaron|🍬|seker kuruyemis
Kurabiye|🍪|seker yag_hafif
Un kurabiyesi|🍪|seker yag
Cevizli kurabiye|🍪|seker yag kuruyemis
Elmalı kurabiye|🍪|yag seker
Donut|🍩|seker yag
Churros|🥖|seker yag
Waffle (çikolatalı)|🧇|yag seker sut_az
Krep (çikolatalı)|🥞|yag seker sut_az
Dondurma (sütlü)|🍨|sut seker yag_hafif
Maraş dondurması|🍨|sut seker
Dondurma (laktozsuz)|🍨|seker
Şekersiz dondurma|🍨|sut tatlandirici
Sorbe (meyveli dondurma)|🍧|seker
Frozen yoğurt|🍨|fermente seker
Jöle|🍮|seker
Pamuk şeker|🍭|seker katki
Şekersiz tatlı (tatlandırıcılı)|🍬|tatlandirici

# Fast food & sokak lezzetleri
Hamburger|🍔|yag islenmis
Cheeseburger|🍔|yag islenmis sut
Double burger|🍔|yag islenmis
Tavuk burger|🍔|yag
Islak hamburger|🍔|yag lahana asit
Hot dog|🌭|islenmis yag
Tavuk wrap|🌯|yag_hafif cig
Tavuk dürüm (sade)|🌯|hafif yag_hafif
Tavuk döner dürüm|🌯|yag
Dürüm döner|🌯|yag lahana
Kebab dürüm|🌯|yag aci
Çiğ köfte dürüm|🌯|aci cig lif
Falafel dürüm|🌯|baklagil yag cig
Kokoreç dürüm|🌯|yag aci
Shawarma|🥙|yag lahana
Köfte ekmek|🥖|yag_hafif
Sucuk ekmek|🥖|islenmis yag aci
Kumru|🥪|islenmis yag sut_az
Ayvalık tostu|🥪|islenmis yag sut_az
Patso|🍟|islenmis yag
Kumpir|🥔|yag sut_az islenmis kabuk
Pilav üstü tavuk|🍚|yag_hafif
Pilav üstü nohut|🍚|baklagil
Club sandviç|🥪|islenmis yag_hafif cig
Tavuklu sandviç|🥪|yag_hafif
Ton balıklı sandviç|🥪|yag_hafif
Soğan halkası|🧅|yag lahana
Mozzarella stick|🧀|yag sut_az
Pizza (margherita)|🍕|yag sut_az asit
Pizza (peynirli)|🍕|sut_az yag
Pizza (karışık)|🍕|yag sut islenmis asit
Pizza (sucuklu)|🍕|yag islenmis aci asit
Pizza (tavuklu)|🍕|asit sut_az yag_hafif
Pizza (vejetaryen)|🍕|asit sut_az lif
Calzone|🥟|yag sut_az
Mikrodalga yemek|🍱|katki yag_hafif

# Dünya mutfağı
Taco|🌮|aci yag cig
Burrito|🌯|baklagil aci yag
Nachos|🧀|yag sut aci
Quesadilla|🧀|sut yag_hafif
Fajita|🌮|aci_hafif lif
Enchilada|🌯|aci baklagil sut_az
Chili con carne|🌶️|baklagil aci yag
Köri (sebzeli)|🍛|aci baklagil
Tavuk tikka masala|🍛|aci sut yag
Butter chicken|🍛|sut yag aci_hafif
Palak paneer|🍛|sut lif aci_hafif
Chana masala|🍛|baklagil aci
Dal (Hint mercimeği)|🍛|pure aci_hafif
Biryani|🍛|aci yag_hafif
Samosa|🥟|yag baklagil aci_hafif
Naan|🫓|hafif sut_az
Thai yeşil köri|🍛|aci yag sut_az
Massaman köri|🍛|aci_hafif yag kuruyemis
Pad thai|🍜|kuruyemis aci yag_hafif
Tavuk satay|🍢|kuruyemis aci_hafif
Yaz rulosu (pirinç kağıdı)|🥗|cig
Spring roll|🥟|yag lahana
Banh mi|🥖|cig islenmis aci_hafif
Teriyaki tavuk|🍗|seker
Kung pao tavuk|🥡|aci kuruyemis yag
Tatlı ekşi tavuk|🥡|yag seker asit
Pekin ördeği|🦆|yag seker
Chow mein|🍜|yag lahana
Dim sum|🥟|yag_hafif
Gyoza|🥟|yag_hafif lahana
Poke bowl|🥗|cig
Onigiri|🍙|hafif
Yakitori|🍢|seker yag_hafif
Tonkatsu|🍖|yag
Katsu curry|🍛|yag aci_hafif
Bibimbap|🍚|aci cig
Bulgogi|🥩|seker yag_hafif
Kore kızarmış tavuk|🍗|yag aci_hafif seker
Bruschetta|🍅|cig asit lahana
Focaccia|🫓|yag_hafif
Shakshuka (domatesli yumurta)|🍳|asit aci_hafif yag_hafif
Musakka (Yunan)|🍆|yag sut kabuk

# Soslar & baharat
Ketçap|🍅|asit seker
Mayonez|🥚|yag
Hardal|🟡|aci
Acı sos|🌶️|aci
Barbekü sosu|🍖|seker asit aci_hafif
Soya sosu|🥢|hafif
Teriyaki sos|🥣|seker
Sweet chili|🌶️|seker aci_hafif
Sriracha|🌶️|aci
Worcestershire|🥣|asit
Domates sosu|🍅|asit
Domates salçası|🍅|asit
Biber salçası|🌶️|aci asit
Beşamel sos|🥛|sut yag
Ranch sos|🥣|sut yag
Pesto|🌿|yag kuruyemis lahana
Tahin sos|🥣|yag kuruyemis
Yoğurtlu sos|🥣|fermente
Sarımsaklı yoğurt|🥛|fermente lahana
Tereyağlı sos|🧈|yag
Zeytinyağı|🫒|yag_hafif
Ayçiçek yağı|🌻|yag_hafif
Margarin|🧈|yag katki
Zeytinyağlı limon sos|🍋|asit yag_hafif
Limon suyu|🍋|asit
Sirke|🫙|asit
Nar ekşisi|🍷|asit
Hindistan cevizi sütü|🥥|yag
Tuz|🧂|hafif
Toz şeker|🍬|seker
Tatlandırıcı (stevia, sukraloz)|🍬|tatlandirici
Karabiber|⚫|aci_hafif
Pul biber|🌶️|aci
Isot|🌶️|aci
Tatlı toz biber|🌶️|hafif
Köri baharatı|🍛|aci_hafif
Kimyon|🟤|hafif
Zerdeçal|🟡|hafif
Zencefil|🫚|hafif
Tarçın|🟤|hafif
Kekik|🌿|hafif
Kuru nane|🌿|hafif
Sumak|🌿|asit

# İçecek
Su|💧|hafif
Limonlu su|🍋|asit
Maden suyu|🫧|gazli
Limonlu soda|🫧|gazli asit
Ayran|🥛|fermente
Süt|🥛|sut
Laktozsuz süt|🥛|hafif
Tarçınlı süt|🥛|sut
Ballı süt|🥛|sut seker
Badem sütü|🥛|katki
Yulaf sütü|🥛|hafif
Soya sütü|🥛|baklagil
Pirinç sütü|🥛|hafif
Çay|🍵|kafein_hafif
Açık çay|🍵|kafein_hafif
Yeşil çay|🍵|kafein_hafif
Matcha|🍵|kafein
Papatya çayı|🌼|hafif
Nane limon|🌿|hafif
Rezene çayı|🌿|hafif
Zencefil çayı|🫚|hafif
Ihlamur|🍃|hafif
Adaçayı|🌿|hafif
Melisa çayı|🌿|hafif
Bitki çayı (karışık)|🌿|hafif
Kuşburnu çayı|🌹|asit
Hibiskus çayı|🌺|asit
Elma çayı (hazır toz)|🍎|seker katki
Türk kahvesi|☕|kafein
Kahve (filtre)|☕|kafein
Kahve (sütlü filtre)|☕|kafein sut
Hazır kahve (granül)|☕|kafein
3'ü 1 arada kahve|☕|kafein seker sut_az katki
Espresso|☕|kafein
Americano|☕|kafein
Latte|☕|kafein sut
Laktozsuz latte|☕|kafein
Cappuccino|☕|kafein sut
Flat white|☕|kafein sut
Mocha|☕|kafein sut seker
Soğuk kahve|🧋|kafein sut seker
Kafeinsiz kahve|☕|kafein_hafif
Chai latte|🍵|kafein_hafif sut seker aci_hafif
Sıcak çikolata|☕|sut seker kafein_hafif
Salep|☕|sut seker
Boza|🥤|fermente seker
Şalgam suyu|🥤|fermente aci asit
Şerbet|🍹|seker
Kombucha|🫖|fermente gazli kafein_hafif asit
Taze portakal suyu|🍊|asit seker
Elma suyu|🧃|seker
Vişne suyu|🍒|asit seker
Şeftali suyu|🍑|seker
Nar suyu|🍷|asit seker
Havuç suyu|🥕|hafif
Domates suyu|🍅|asit
Hazır meyve suyu|🧃|seker
Hindistan cevizi suyu|🥥|hafif
Limonata|🍋|asit seker
Smoothie (muzlu)|🥤|seker
Smoothie (çilekli)|🥤|seker cekirdek
Yeşil smoothie|🥬|lif cig
Milkshake|🥤|sut seker yag
Protein shake|🥤|sut tatlandirici
Bubble tea|🧋|seker sut kafein_hafif katki
Ice tea|🧃|seker kafein_hafif
Kola|🥤|gazli seker kafein_hafif
Diyet kola|🥤|gazli tatlandirici kafein_hafif
Gazoz|🥤|gazli seker
Enerji içeceği|⚡|kafein seker gazli katki
Spor içeceği|🧃|seker
ORS (elektrolit)|🧃|hafif
Bira|🍺|alkol gazli
Alkolsüz bira|🍺|gazli
Şarap|🍷|alkol
Alkolsüz şarap|🍷|seker asit
Şampanya|🥂|alkol gazli
Rakı|🥃|alkol
Viski|🥃|alkol
Votka|🥃|alkol
Cin tonik|🍸|alkol gazli
Kokteyl|🍸|alkol seker
`;

// Eski ya da kısa adlar → listedeki yemek. Birleştirilen eski kayıtlar bunlarla
// eşleşmeye devam eder; arama da bu adları tanır.
export const ALIAS_SOURCE = `
# eski adlar (birleştirilen ya da yeniden adlandırılan kayıtlar)
Kayseri mantısı|Mantı
Mantı (dondurulmuş)|Mantı
Su böreği|Su böreği (peynirli)
Börek (sokak)|Börek (peynirli)
Kıymalı patates|Etli patates
Kıymalı bezelye|Etli bezelye
Etli ıspanak|Kıymalı ıspanak
Kokoreç (yarım)|Kokoreç
Lüfer|Lüfer ızgara
Zeytinyağlı barbunya|Barbunya pilaki
Kuru fasulye pilaki|Zeytinyağlı kuru fasulye
Kabak yemeği|Zeytinyağlı kabak
Buharda kabak|Haşlanmış kabak
Güveç|Sebze güveç
Kuşkonmaz (uçları)|Kuşkonmaz (uçları, haşlama)
Hünkar beğendi (sadece beğendi)|Beğendi (patlıcan püresi)
Patates haşlama ezme|Sütsüz patates püresi
Haşlanmış patatesli kahvaltı|Haşlanmış patates
Yasemin pilavı (sade)|Jasmine pirinç
Penne arrabbiata|Arabiata makarna
Peynirli gözleme (sacda)|Gözleme (peynirli)
Peynirli poğaça (sade)|Poğaça (peynirli)
Pişi (sade)|Pişi
Haşlanmış yumurta (2)|Haşlanmış yumurta
Kahvaltılık gevrek (şekerli)|Mısır gevreği
Kahvaltılık sucuk|Sucuk
Ezme|Acılı ezme
Şakşuka (soğuk)|Şakşuka
Soslu patlıcan|Şakşuka
Fava (meze)|Fava
Humus (meze)|Humus
Yeşil salata (sade)|Marul salatası
Fasulye salatası|Piyaz
Fasulye piyazı|Piyaz
Patates salatası (sade)|Patates salatası
Zeytinyağlı yaprak sarma (meze)|Yaprak sarma
Avokado (yarım)|Avokado
Muz (yarım, olgun)|Olgun muz
Kavun (olgun)|Kavun
Karpuz (çekirdeksiz)|Karpuz
Tuzlu kraker|Kraker (sade)
Pirinç krakeri|Pirinç patlağı
Pirinç keki|Pirinç patlağı
Petibör bisküvi|Bisküvi (sade)
Çiğ badem|Badem
Kavrulmuş fındık|Fındık
Tuzlu fıstık|Yer fıstığı
Ceviz içi (az)|Ceviz
Galeta (sade)|Galeta
Yulaf bar|Granola bar
Yoğurt (tatlı atıştırmalık)|Meyveli yoğurt
Haşlanmış mısır (az)|Mısır (haşlama)
Pop kek|Paketli kek
Haşlanmış elma tatlısı|Haşlanmış elma
Muhallebi (laktozsuz sütle)|Laktozsuz muhallebi
Lokum (sade)|Lokum
Meyveli jöle|Jöle
Midye (sokak)|Midye dolma
Simit + peynir|Simit + beyaz peynir
Izgara tavuk wrap|Tavuk wrap
Islak burger|Islak hamburger
Chicken wings|Tavuk kanat
Gyro|Et döner
Tavuk teriyaki bowl|Teriyaki tavuk
Kefir (içecek)|Kefir
Kemik suyu (içecek)|Kemik suyu
Ilık su|Su
Soda|Maden suyu
Sade soda|Maden suyu
Ev yapımı limonata (az şekerli)|Limonata
# yaygın kısa adlar ve eş anlamlılar
Kırmızı mercimek çorbası|Mercimek çorbası
Sulu köfte çorbası|Sulu köfte
Mercimek köftesi|Kırmızı mercimek köftesi
Muz|Olgun muz
Elma|Kabuklu elma
Yumurta|Haşlanmış yumurta
Peynir|Beyaz peynir
Kaşar|Kaşar peyniri
Yoğurt|Sade yoğurt
Yunan yoğurdu|Süzme yoğurt
Ekmek|Beyaz ekmek
Francala|Beyaz ekmek
Pilav|Pirinç pilavı
Makarna|Sade makarna
Spagetti|Sade makarna
Köfte|Izgara köfte
Ekmek arası köfte|Köfte ekmek
Döner|Et döner
Zurna dürüm|Dürüm döner
Kahve|Kahve (filtre)
Nescafe|Hazır kahve (granül)
Frappe|Soğuk kahve
Pizza|Pizza (margherita)
Börek|Börek (peynirli)
Poğaça|Poğaça (sade)
Gözleme|Gözleme (peynirli)
Pide|Kıymalı pide
Tost|Kaşarlı tost
Peynirli tost|Kaşarlı tost
Sosisli sandviç|Hot dog
Hummus|Humus
Pilaki|Barbunya pilaki
Patlıcan ezmesi|Patlıcan salatası
Mücver|Kabak mücver
Kaygana|Kayganak
Kuymak|Mıhlama (kuymak)
Mumbar|Bumbar dolması
Moussaka|Patlıcan musakka
Frambuaz|Ahududu
Nutella|Fındık kreması
Kakaolu fındık kreması|Fındık kreması
Tavuk göğsü tatlısı|Tavuk göğsü (tatlı)
Tavuk göğsü|Izgara tavuk göğsü
Somon|Izgara somon
Ton balığı|Ton balığı (suda)
Kuru fasulye|Etli kuru fasulye
Nohut|Nohut yemeği
Taze fasulye|Zeytinyağlı taze fasulye
Salata|Mevsim salata
Hoşmerim|Höşmerim
`;
