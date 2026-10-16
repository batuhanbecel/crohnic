// Yemek veritabanı. Her satır: ad | emoji | etiketler (boşlukla)
// Etiket anlamları foods.ts içindeki TAGS tablosunda.
// Hüküm etiketlerden ve döneme göre hesaplanır, kişisel kayıtlar geldikçe üzerine yazılır.
// Kurallar: her yemek bir kez ve tek kategoride; porsiyon farkı ayrı yemek değildir;
// yalnızca etiketi değişen hazırlık farkları (kabuksuz, laktozsuz, sade…) ayrı satırdır.

export const FOOD_SOURCE = `
# Çorba
Mercimek çorbası|🍲|pure baklagil_az
Ezogelin çorbası|🍲|pure baklagil_az aci_hafif
Yeşil mercimek çorbası|🍲|baklagil lif
Mercimekli bulgur çorbası|🍲|pure baklagil_az lif
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
Mahluta|🍲|pure baklagil_az
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
Bezelye çorbası|🫛|pure baklagil_az
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
Analı kızlı çorbası|🍲|baklagil_az aci_hafif yag_hafif
Kelle paça çorbası|🍲|yag lahana
Lebeniye çorbası|🥣|fermente baklagil_az
Kuru fasulye çorbası|🍲|baklagil
Mantı çorbası|🍲|fermente yag_hafif
Kuzu incik çorbası|🍲|yag_hafif
Yoğurtlu pirinç çorbası|🥣|fermente
Kremalı kabak çorbası|🥣|pure sut
Sebzeli kinoa çorbası|🥣|lif
Tom yum çorbası|🍲|aci asit
Clam chowder|🥣|sut yag
Gulaş çorbası|🍲|aci_hafif yag
Kırmızı biber çorbası|🍲|asit aci_hafif pure
Közlenmiş patlıcan çorbası|🍲|pure yag_hafif
Tatlı patates çorbası|🍠|pure
Kesme çorbası|🍜|fermente baklagil_az
Ovmaç çorbası|🍲|hafif asit
Yüksük çorbası|🍲|fermente baklagil
Malhıta çorbası|🍲|baklagil
Kuskus çorbası|🍲|hafif
Şehriyeli domates çorbası|🍅|asit
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
Steak (az pişmiş)|🥩|yag_hafif cig_hayvansal
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
Çömlek kebabı|🍲|yag lahana
Beyti kebap|🌯|yag aci_hafif fermente
İskender kebap|🍖|yag sut asit fermente
Fırın tavuk kanat|🍗|yag_hafif
Acılı tavuk kanat|🍗|yag aci
Tavuk köfte|🍢|yag_hafif
Tavuk şnitzel|🍗|yag
Tavuk tantuni|🌯|yag aci_hafif
Et tantuni|🌯|yag aci_hafif
Dana incik|🍖|yag_hafif
Dana kaburga|🍖|yag
Tavuklu patates|🍗|yag_hafif
Izgara kuzu ciğer|🍖|yag_hafif
Misket köfte|🧆|yag_hafif
Kızartma içli köfte|🧆|yag aci_hafif kuruyemis
Az pişmiş bonfile|🥩|cig_hayvansal yag_hafif
Etli çiğ köfte|🥩|cig_hayvansal aci lif
Kuzu kelle|🍖|yag
Mumbar dolması|🍖|yag aci_hafif
Haşlanmış dana dil|🍖|yag_hafif
Izgara tavuk ciğer|🍗|yag_hafif
Izgara bıldırcın|🐦|yag_hafif
Fırın ördek|🦆|yag
Fırın kaz|🍗|yag
Tavşan güveç|🍲|yag_hafif lahana
Hindi şiş|🍢|yag_hafif
Fırında hindi but|🍗|yag_hafif
Tavuk külbastı|🍗|yag_hafif
Et külbastı|🥩|yag_hafif
Tavuk çevirme|🍗|yag_hafif
Kuyu kebabı|🍖|yag
Kazan kebabı|🍲|yag
Çoban kavurma|🥩|yag aci_hafif lahana
Mantarlı tavuk sote|🍗|yag_hafif
Fırında tavuk but|🍗|yag
Haşlanmış tavuk but|🍗|yag_hafif
Fırında tavuk göğsü|🍗|hafif
Dana kıyma (yağsız, pişmiş)|🥩|yag_hafif
Sebzeli köfte (fırında)|🧆|yag_hafif
Ciğer sote|🍖|yag_hafif
# Balık & deniz ürünleri
Izgara somon|🐟|hafif
Fırın somon|🐟|hafif
Somon buğulama|🐟|hafif
Somon füme|🐟|islenmis cig_hayvansal
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
Lakerda|🐟|yag_hafif cig_hayvansal
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
İstiridye|🦪|cig_hayvansal
Yengeç|🦀|hafif
Istakoz|🦞|hafif
Sushi (çiğ balık)|🍣|cig_hayvansal
Sushi (pişmiş)|🍣|hafif
Somon sushi roll|🍣|cig_hayvansal
California roll|🍣|yag_hafif
Sashimi|🍣|cig_hayvansal
Tempura|🍤|yag
Balık ekmek|🥙|yag_hafif cig lahana
Kolyoz ızgara|🐟|yag_hafif
Levrek fileto tava|🐟|yag
Çinekop ızgara|🐟|yag_hafif
Zargana tava|🐟|yag
Sudak ızgara|🐟|yag_hafif
Tekir tava|🐟|yag
Dülger ızgara|🐟|yag_hafif
Orfoz buğulama|🐟|yag_hafif
Sinarit ızgara|🐟|yag_hafif
Kefal ızgara|🐟|yag_hafif
Çiğ istiridye|🦪|cig_hayvansal
Deniz mahsullü pilav|🦐|yag_hafif
Çiroz|🐟|islenmis
Uskumru konserve|🥫|yag_hafif
Sardalya konserve|🥫|yag_hafif
Somon tava|🐟|yag
Teriyaki somon|🐟|seker yag_hafif
Hamsikoli|🐟|yag
Midye pilaki|🦪|yag_hafif
Balık buğulama|🐟|hafif
Fırında balık köftesi|🐟|yag_hafif
Somon köftesi|🐟|yag_hafif
Ton balıklı köfte|🐟|yag_hafif
Sardalya buğulama|🐟|yag_hafif
Ahtapot carpaccio|🐙|cig_hayvansal asit
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
Bezelye püresi|🫛|pure baklagil_az
Ispanak püresi|🥬|pure
Sebze püresi|🥣|pure
Buharda brokoli ve havuç|🥦|lahana
Fırın kabak|🥒|hafif
Fırın balkabağı|🎃|hafif
Közlenmiş kabak|🥒|kabuk
Közlenmiş mantar|🍄|lif
Kabak spagetti|🥒|hafif
Zeytinyağlı taze bakla|🫛|baklagil lif kabuk
Zeytinyağlı lahana dolması|🥬|lahana lif
Etli lahana sarması|🥬|lahana yag
Pazı sarması|🥬|lif
Patates mücveri|🥔|yag
Brokoli sote|🥦|lahana lif
Kuşkonmaz sote|🌿|lif yag_hafif
Kremalı mantar|🍄|sut yag
Yer elması yemeği|🥔|lif lahana
Isırgan otu yemeği|🌿|lif
Yoğurtlu fırın patlıcan|🍆|fermente kabuk yag_hafif
Patatesli pırasa|🥬|lahana
Kabak oturtma|🥒|yag_hafif asit
Ayva dolması|🍐|yag_hafif seker
Sebze köftesi|🥕|yag
Haşlanmış Brüksel lahanası|🥬|lahana lif
Fırında brokoli|🥦|lahana yag_hafif
Sebzeli patates püresi|🥔|pure sut_az
Mantarlı patates|🍄|yag_hafif
Fırında kabak çiçeği|🌼|yag_hafif
Zeytinyağlı kabak çiçeği|🌼|yag_hafif
Fırında sebzeli tavuk|🍗|yag_hafif lif
Hellimli sebze ızgara|🧀|sut_az yag_hafif kabuk
Közlenmiş sebze tabağı|🫑|yag_hafif kabuk
Kıymalı biber dolması|🫑|yag kabuk
Kıymalı patlıcan dolması|🍆|yag kabuk
Lahana kapuska|🥬|lahana yag_hafif
Etli kapuska|🥬|lahana yag
Kıymalı kabak dolması|🥒|yag_hafif
Etli patates yemeği|🥔|yag_hafif
Tavuklu patates püresi|🥔|pure sut_az
Tavuklu kabak yemeği|🥒|yag_hafif
Tavuklu havuç yemeği|🥕|yag_hafif
Sütlü kabak|🥒|sut seker
Haşlanmış tatlı patates|🍠|hafif pure
Karnabahar püresi|🥦|pure lahana
Baharatlı patates (fırın)|🥔|yag aci_hafif
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
Kereviz (haşlama)|🥣|hafif
Kale (kıvırcık lahana)|🥬|lahana lif cig
Pak choi|🥬|lahana
Bebek ıspanak|🥬|cig lif
Bebek havuç|🥕|cig lif
Fasulye filizi|🌱|cig lif
Soya filizi|🌱|cig lif
Bambu filizi|🎋|lif
Shiitake mantarı|🍄|lif
İstiridye mantarı|🍄|lif
Kestane mantarı|🍄|lif
Enginar kalbi (konserve)|🌼|lif asit
Kapari|🫒|asit
Kırmızı turp|🌶️|cig lahana
Şalgam|🥔|lahana lif
Pancar (çiğ)|🫚|cig lif
Taze bezelye (haşlama)|🫛|baklagil_az
Buharda havuç|🥕|hafif
Buharda bezelye|🫛|baklagil_az
Buharda yeşil fasulye|🫛|lif
Közlenmiş domates|🍅|asit kabuk
Közlenmiş soğan|🧅|lahana
Kızarmış soğan|🧅|lahana yag
Karamelize soğan|🧅|lahana seker
Isırgan otu (haşlama)|🌿|lif
Ebegümeci|🌿|lif
Radika|🌿|lif cig
Hindiba|🥬|lif cig
Su teresi|🌿|cig
# Bakliyat
Etli kuru fasulye|🫘|baklagil yag_hafif
Zeytinyağlı kuru fasulye|🫘|baklagil
Kuru börülce yemeği|🫘|baklagil
Barbunya pilaki|🫘|baklagil
Etli barbunya|🫘|baklagil yag_hafif
Nohut yemeği|🫘|baklagil
Nohutlu ıspanak|🥬|baklagil lif
Nohut (haşlama)|🫘|baklagil kabuk
Kırmızı mercimek yemeği|🍲|pure baklagil_az
Yeşil mercimek yemeği|🫘|baklagil lif
Mercimek püresi|🍲|pure baklagil_az
Mercimekli bulgur|🍲|baklagil lif
Kırmızı mercimek köftesi|🧆|baklagil_az lif aci cig
Mercimek köftesi (acısız)|🧆|baklagil_az lif cig
Humus|🫘|baklagil_az kuruyemis
Süzme nohut püresi|🫘|pure baklagil_az
Fava|🫘|pure baklagil_az
Fasulye ezmesi|🫘|pure baklagil_az
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
Pastırmalı kuru fasulye|🫘|baklagil islenmis yag
Kavurmalı kuru fasulye|🫘|baklagil yag
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
Bulgur (haşlama)|🌾|lif
Arpa (haşlama)|🌾|lif
Buğday (haşlama)|🌾|lif
Amaranth|🌾|lif
Darı|🌾|lif
Polenta (mısır lapası)|🥣|pure
İrmik lapası|🥣|pure
Pirinç unu lapası|🥣|pure hafif
Yulaf ezmesi (çiğ)|🥣|lif
Nohut makarnası|🍝|baklagil_az
Mercimek makarnası|🍝|baklagil_az
Sushi pirinci|🍚|asit seker
Haşlanmış pirinç (lapa kıvamı)|🍚|hafif pure
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
Tatar böreği|🥟|fermente yag
Sinop mantısı|🥟|fermente yag
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
Ramazan pidesi|🫓|hafif
Trabzon ekmeği|🍞|hafif
Ciabatta|🥖|hafif
Brioche|🍞|seker yag sut_az
Tam buğday lavaş|🫓|lif
Glutensiz lavaş|🫓|hafif
Tam buğday tortilla|🫓|lif
Pirinç ekmeği|🍞|hafif
Ekşi mayalı çavdar ekmeği|🍞|lif fermente
Kepekli bazlama|🫓|lif
Mısır unlu bazlama|🫓|hafif
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
Sucuklu omlet|🍳|islenmis yag aci_hafif
Kaşarlı omlet|🍳|sut_az yag_hafif
Domatesli omlet|🍳|asit yag_hafif
Patatesli omlet|🍳|yag
Hellimli tost|🥪|sut_az yag_hafif
Bazlama tost|🥪|sut_az yag_hafif
Avokadolu yumurta tost|🥑|yag_hafif lif
Ballı yoğurt|🥣|fermente seker
Muzlu yoğurt|🍌|fermente
Corn flakes (sade)|🥣|islenmis
Yulaf gevreği (sade)|🥣|lif
Kakaolu mısır gevreği|🥣|seker katki kafein_hafif
Ballı mısır gevreği|🥣|seker katki
Yumurta beyazı (haşlanmış)|🥚|hafif
Peynirli pankek|🥞|sut_az yag_hafif
Labneli bagel|🥯|sut_az
Somonlu bagel|🥯|cig_hayvansal sut_az
Kahvaltılık krep (peynirli)|🥞|sut_az yag_hafif
Tahinli pekmezli ekmek|🍞|yag kuruyemis seker
Kaymaklı bal ekmek|🍞|sut yag seker
Zeytinli ekmek|🍞|yag_hafif
Pastırmalı tost|🥪|islenmis yag aci_hafif
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
Kavun peynir|🍈|sut_az
Karışık meze tabağı|🍽️|yag fermente asit
Peynir tabağı|🧀|sut yag
Şarküteri tabağı|🥓|islenmis yag
Meyve tabağı|🍉|kabuk
Abugannuş|🍆|kabuk yag_hafif
Mütebbel|🍆|kabuk kuruyemis lahana
Tarator (cevizli)|🥣|kuruyemis lahana fermente
Kabak tarator|🥒|fermente kuruyemis lahana
Kuru cacık|🥒|fermente lahana
Patlıcan söğürme|🍆|kabuk yag_hafif
Köpoğlu|🍆|yag fermente lahana kabuk
Yoğurtlu kızartma|🍆|yag kabuk fermente lahana
Sarımsaklı köz biber|🫑|kabuk lahana yag_hafif
Kuru domates (zeytinyağlı)|🍅|asit yag_hafif
Sıcak humus (pastırmalı)|🫘|baklagil_az kuruyemis islenmis yag
Hamsi marin|🐟|cig_hayvansal asit
Levrek marin|🐟|cig_hayvansal asit
Somon marin|🐟|cig_hayvansal asit
Çiroz salatası|🐟|islenmis asit cig
Muska böreği|🥟|yag sut_az
Kaşarlı mantar|🍄|sut_az yag
Karışık turşu|🥒|fermente asit
Kornişon turşu|🥒|fermente asit
Acur turşusu|🥒|fermente asit
Pancar turşusu|🫚|fermente asit
Kırma zeytin|🫒|yag_hafif asit
Biberli zeytin|🫒|aci_hafif yag_hafif
Zeytin salatası|🫒|yag_hafif asit cig
Arapsaçı (rezene) salatası|🌿|cig lif
Şevketi bostan|🌿|lif yag_hafif
Turp otu salatası|🌿|cig lif lahana
Hardal otu|🌿|lif
Kaya koruğu|🌿|cig lif
Ege otları kavurma|🌿|lif yag_hafif
Kaşık salata|🥗|aci asit cig
Yoğurtlu biber kızartması|🫑|yag kabuk fermente lahana
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
Fuji elma|🍎|kabuk lif
Granny Smith elma|🍏|kabuk lif asit
Starking elma|🍎|kabuk lif
Amasya elması|🍎|kabuk lif
Santa Maria armut|🍐|kabuk lif
Deveci armut|🍐|kabuk lif
Kumkat|🍊|kabuk asit
Bergamot|🍋|asit
Altın kivi|🥝|cekirdek
Sarı kiraz|🍒|kabuk
Karadut|🫐|cekirdek
Beyaz dut|🫐|cekirdek
Taze hurma|🌴|lif
Guava|🍈|cekirdek lif
Yıldız meyvesi|⭐|asit
Rambutan|🍈|hafif
Siyah üzüm|🍇|kabuk cekirdek
Yeşil üzüm|🍇|kabuk
Konserve ananas|🍍|seker asit
Konserve armut|🍐|seker
Konserve mandalina|🍊|seker asit
Goji berry (kuru)|🍒|cekirdek seker
Kuru vişne|🍒|seker asit
Kuru yaban mersini|🫐|seker kabuk
Kuru ananas|🍍|seker
Pişmiş elma (tarçınlı)|🍎|hafif
Muz püresi|🍌|pure
Armut püresi|🍐|pure
Şeftali püresi|🍑|pure
Kayısı kompostosu|🍑|seker
Vişne kompostosu|🍒|seker
Elma kompostosu|🍎|seker
Ayva kompostosu|🍐|seker
Hoşaf|🍇|seker lif
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
Tuzlu badem|🌰|kuruyemis
Wasabi fıstık|🥜|kuruyemis aci
Kokteyl çerez|🥜|kuruyemis yag islenmis
Kavrulmuş mısır çerezi|🌽|yag islenmis
Siyah çekirdek|🌻|cekirdek kuruyemis
Çerez tabağı|🥜|kuruyemis yag
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
Hurma tatlısı|🍯|seker yag
Saray sarması|🍯|seker yag kuruyemis
Fıstık sarma|🍯|seker yag kuruyemis
Dilber dudağı|🍯|seker yag kuruyemis
Vezir parmağı|🍯|seker yag
Hanım göbeği|🍯|seker yag
Kaymaklı ekmek kadayıfı|🍯|seker sut yag
Peynir tatlısı|🧀|seker sut
Lor tatlısı|🍰|seker sut_az
Gül tatlısı|🌹|seker yag
Kaymaklı kayısı tatlısı|🍑|seker sut lif
İncir tatlısı|🍯|seker cekirdek kuruyemis
Tahinli kurabiye|🍪|seker yag kuruyemis
Acıbadem kurabiyesi|🍪|seker kuruyemis
Hindistan cevizli kurabiye|🍪|seker yag lif
Çikolatalı kurabiye|🍪|seker yag kafein_hafif
Kakaolu kek|🍰|seker yag_hafif kafein_hafif
Cevizli kek|🍰|seker yag_hafif kuruyemis
Portakallı kek|🍰|seker yag_hafif
Elmalı kek|🍰|seker yag_hafif
Tarçınlı rulo|🌀|seker yag
Rulo pasta|🍰|seker sut yag
Kestane şekeri|🌰|seker
Paluze|🍮|seker
Kadayıf dolması|🍯|seker yag kuruyemis
Pekmezli helva|🍯|seker yag
Irmik tatlısı (sütlü)|🍮|sut seker
Lokma (laktozsuz)|🍩|seker yag
Muzlu puding|🍮|sut seker
Vanilyalı puding|🍮|sut seker
Karamelli puding|🍮|sut seker
Laktozsuz puding|🍮|seker
Chia puding (meyveli)|🥣|lif cekirdek seker
Çikolatalı sufle|🍫|seker yag sut kafein_hafif
San Sebastian cheesecake|🍰|sut seker yag
Lotuslu cheesecake|🍰|sut seker yag
Frambuazlı tart|🥧|seker yag cekirdek
Limonlu tart|🥧|seker yag asit
Çikolatalı tart|🥧|seker yag kafein_hafif
Pavlova|🍰|seker sut_az
Krep (muzlu)|🥞|seker sut_az
Krep (meyveli)|🥞|seker sut_az
Waffle (meyveli)|🧇|seker yag sut_az
Pankek (ballı)|🥞|seker sut_az
Baklava (cevizli)|🍯|seker yag kuruyemis
Havuç dilimi baklava|🍯|seker yag kuruyemis
Kuru baklava|🍯|seker yag kuruyemis
Soğuk baklava|🍯|seker yag sut kuruyemis
Fıstıklı künefe|🧀|seker yag sut kuruyemis
Kaymaklı dondurma|🍨|sut seker
Çikolatalı dondurma|🍨|sut seker kafein_hafif
Limonlu dondurma|🍨|seker asit
Çilekli dondurma|🍨|sut seker
Fıstıklı dondurma|🍨|sut seker kuruyemis
Magnum Klasik|🍦|sut seker yag
Magnum Badem|🍦|sut seker yag kuruyemis
Cornetto|🍦|sut seker yag katki
Algida Maraş Usulü|🍦|sut seker
Carte d'Or Vanilya|🍨|sut seker katki
Su bazlı dondurma (buzlu)|🍧|seker katki
Pepeçura|🍇|seker
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
Dal (Hint mercimeği)|🍛|pure baklagil_az aci_hafif
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
Poke bowl|🥗|cig cig_hayvansal
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
Karaage (Japon kızarmış tavuk)|🍗|yag
Okonomiyaki|🥞|yag lahana
Takoyaki|🐙|yag
Salatalıklı maki|🍣|asit
Somonlu maki (çiğ)|🍣|cig_hayvansal asit
Pişmiş somonlu sushi|🍣|asit
Unagi don|🍱|seker yag_hafif
Oyakodon|🍱|yag_hafif
Gyudon|🍱|yag seker
Chirashi|🍱|cig_hayvansal asit
Tamago (Japon omleti)|🍳|seker
Mochi|🍡|seker
Mapo tofu|🌶️|aci yag
Ekşi acı çorba (hot and sour)|🍲|aci asit
Dan dan noodle|🍜|aci yag kuruyemis
Char siu|🍖|seker yag
Bao (buharda çörek)|🥟|yag_hafif seker
Japchae|🍜|yag_hafif seker
Tteokbokki|🍢|aci seker
Kimbap|🍙|asit cig
Kimchi jjigae|🍲|aci fermente lahana
Samgyeopsal|🥓|yag
Som tam (papaya salatası)|🥗|cig aci asit
Pad see ew|🍜|yag seker
Khao pad (Tay usulü pilav)|🍛|yag
Mango sticky rice|🥭|seker yag_hafif
Bun cha|🍜|yag seker
Rogan josh|🍛|aci yag
Vindaloo|🍛|aci yag asit
Korma|🍛|yag sut kuruyemis
Aloo gobi|🍛|lahana aci_hafif
Dosa|🫓|fermente yag_hafif
İdli|🍚|fermente hafif
Raita|🥣|fermente cig
Pakora|🧆|yag aci_hafif
Paratha|🫓|yag
Gulab jamun|🍯|seker yag sut
Lassi|🥛|fermente seker
Mango lassi|🥭|fermente seker
Masala chai|🫖|kafein_hafif sut seker
Mansaf|🍖|yag fermente
Kabsa|🍛|yag aci_hafif
Mandi|🍛|yag
Fattoush|🥗|cig lif asit
Manakish (zahterli)|🫓|yag_hafif
Ful medames|🫘|baklagil yag_hafif
Koshari|🍝|baklagil lahana asit
Mujaddara|🍚|baklagil lahana
Maqluba|🍛|yag kabuk
Patatas bravas|🥔|yag aci
Tortilla española|🍳|yag
Croque monsieur|🥪|yag sut islenmis
Quiche lorraine|🥧|yag sut islenmis
Coq au vin|🍗|yag alkol
Beef bourguignon|🍲|yag alkol
Stroganoff|🍲|yag sut
Bratwurst|🌭|islenmis yag
Currywurst|🌭|islenmis yag aci_hafif seker
Pierogi|🥟|yag_hafif sut_az
Pelmeni|🥟|yag
Blini|🥞|yag sut_az
Shepherd's pie|🥧|yag sut_az
İngiliz kahvaltısı|🍳|yag islenmis baklagil
Osso buco|🍖|yag asit
Saltimbocca|🍖|yag islenmis
Carpaccio|🥩|cig_hayvansal yag_hafif
Arancini|🍙|yag sut_az
Spanakopita|🥧|yag lif
Souvlaki|🍢|yag_hafif
Tzatziki|🥒|fermente cig lahana
BBQ kaburga|🍖|yag seker
Corn dog|🌭|islenmis yag
Ceviche|🐟|cig_hayvansal asit aci
Empanada|🥟|yag
Arepa|🫓|yag_hafif
Feijoada|🍲|baklagil yag islenmis
Tamales|🫔|yag aci_hafif
Pozole|🍲|aci yag_hafif kabuk
Tavuklu tajin|🍲|yag_hafif aci_hafif
Jollof pilavı|🍛|aci asit yag_hafif
Hawaii pizza|🍕|yag sut islenmis asit seker
Poutine|🍟|yag sut
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
Nane çayı|🌿|hafif
Lavanta çayı|💜|hafif
Biberiye çayı|🌿|hafif
Kekik çayı|🌿|hafif
Limon otu çayı|🌿|hafif
Ekinezya çayı|🌸|hafif
Tarçın çayı|🟤|hafif
Zerdeçal çayı|🟡|hafif
Rooibos çayı|🍂|hafif
Karanfil çayı|🌰|aci_hafif
Zencefilli limonlu çay|🍋|asit
Kış çayı|🍊|asit
Elmalı hibiskus çayı|🍎|asit
Armutlu hibiskus çayı|🍐|asit
Armut ve elmalı hibiskus çayı|🍐|asit
Elmalı tarçınlı çay|🍎|asit
Portakallı tarçınlı çay|🍊|asit
Orman meyveli çay|🫐|asit
Böğürtlenli çay|🫐|asit
Çilekli meyve çayı|🍓|asit
Vişneli meyve çayı|🍒|asit
Nar çiçeği çayı|🌺|asit
Aronyalı çay|🫐|asit
Mangolu meyve çayı|🥭|asit
Ananaslı meyve çayı|🍍|asit
Şeftalili meyve çayı|🍑|asit
Soğuk demleme meyve çayı|🧊|asit
Beyaz çay|🍵|kafein_hafif
Yasemin çayı|🌼|kafein_hafif
Oolong çayı|🍵|kafein_hafif
Earl Grey çayı|🫖|kafein_hafif
English Breakfast çayı|🫖|kafein_hafif
Limonlu yeşil çay|🍋|kafein_hafif asit
Naneli yeşil çay|🌿|kafein_hafif
Mate çayı|🧉|kafein
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
Cortado|☕|kafein sut_az
Macchiato|☕|kafein sut_az
Latte macchiato|☕|kafein sut
Caramel macchiato|☕|kafein sut seker
Buzlu caramel macchiato|🧋|kafein sut seker
White chocolate mocha|☕|kafein sut seker katki
Vanilyalı latte|☕|kafein sut seker
Buzlu latte|🧋|kafein sut
Buzlu americano|🧋|kafein
Cold brew|🧋|kafein
Ristretto|☕|kafein
Lungo|☕|kafein
Doppio (çift espresso)|☕|kafein
Affogato|🍨|kafein sut seker
Yulaf sütlü latte|☕|kafein
Badem sütlü latte|☕|kafein
Sütlü Türk kahvesi|☕|kafein sut
Damla sakızlı Türk kahvesi|☕|kafein
Dibek kahvesi|☕|kafein
Osmanlı kahvesi|☕|kafein
Menengiç kahvesi|☕|sut yag_hafif
Irish coffee|🥃|kafein alkol seker yag_hafif
Frappé (buzlu, köpüklü)|🥤|kafein sut seker katki
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
Alkolsüz bira|🍺|gazli
Alkolsüz şarap|🍷|seker asit
Hardaliye|🍇|seker fermente
Turşu suyu|🥤|fermente asit aci_hafif
Alkolsüz kokteyl (mocktail)|🍹|seker
Efes Alkolsüz|🍺|gazli
Alkolsüz Radler|🍺|gazli seker
# Alkollü içecekler
Bira|🍺|alkol gazli
Şarap|🍷|alkol
Şampanya|🥂|alkol gazli
Rakı|🥃|alkol
Viski|🥃|alkol
Votka|🥃|alkol
Cin tonik|🍸|alkol gazli
Kokteyl|🍸|alkol seker
Efes Pilsen|🍺|alkol gazli
Efes Malt|🍺|alkol gazli
Efes Light|🍺|alkol gazli
Efes Özel Seri|🍺|alkol gazli
Efes Xtra|🍺|alkol gazli
Efes Draft|🍺|alkol gazli
Bomonti Filtresiz|🍺|alkol gazli fermente
Bomonti Black|🍺|alkol gazli
Tuborg Gold|🍺|alkol gazli
Tuborg Filtresiz|🍺|alkol gazli fermente
Tuborg Amber|🍺|alkol gazli
Carlsberg|🍺|alkol gazli
Miller|🍺|alkol gazli
Beck's|🍺|alkol gazli
Corona Extra|🍺|alkol gazli
Heineken|🍺|alkol gazli
Amsterdam Navigator|🍺|alkol gazli
Skol|🍺|alkol gazli
Budweiser|🍺|alkol gazli
Stella Artois|🍺|alkol gazli
Leffe Blonde|🍺|alkol gazli
Leffe Brune|🍺|alkol gazli
Hoegaarden|🍺|alkol gazli fermente
Guinness|🍺|alkol gazli
Erdinger Weissbier|🍺|alkol gazli fermente
Paulaner Hefe-Weissbier|🍺|alkol gazli fermente
Grimbergen|🍺|alkol gazli
Kronenbourg 1664 Blanc|🍺|alkol gazli
Peroni|🍺|alkol gazli
Duvel|🍺|alkol gazli
Asahi|🍺|alkol gazli
Desperados|🍺|alkol gazli seker
Gara Guzu|🍺|alkol gazli
Lager bira|🍺|alkol gazli
Pilsner|🍺|alkol gazli
IPA|🍺|alkol gazli
Pale ale|🍺|alkol gazli
Stout bira|🍺|alkol gazli
Buğday birası|🍺|alkol gazli fermente
Amber ale|🍺|alkol gazli
Porter bira|🍺|alkol gazli
Siyah bira|🍺|alkol gazli
Radler (meyveli bira)|🍺|alkol gazli seker
Fıçı bira|🍺|alkol gazli
Craft bira|🍺|alkol gazli
Glutensiz bira|🍺|alkol gazli
Elma şarabı (cider)|🍏|alkol gazli seker
Hard seltzer|🫧|alkol gazli
Yeni Rakı|🥃|alkol
Yeni Rakı Ala|🥃|alkol
Yeni Rakı Yeni Seri|🥃|alkol
Tekirdağ Rakısı|🥃|alkol
Tekirdağ Gold Seri|🥃|alkol
Efe Rakı|🥃|alkol
Efe Yaş Üzüm|🥃|alkol
Efe Gold|🥃|alkol
Kulüp Rakı|🥃|alkol
Beylerbeyi Göbek|🥃|alkol
Sarı Zeybek|🥃|alkol
Altınbaş|🥃|alkol
Yaş üzüm rakısı|🥃|alkol
Duble rakı|🥃|alkol
Kırmızı şarap|🍷|alkol
Beyaz şarap|🥂|alkol asit
Roze şarap|🍷|alkol asit
Köpüklü şarap|🥂|alkol gazli
Prosecco|🥂|alkol gazli
Cava|🥂|alkol gazli
Sangria|🍷|alkol seker asit
Sıcak şarap (glühwein)|🍷|alkol seker aci_hafif
Tatlı şarap|🍷|alkol seker
Porto şarabı|🍷|alkol seker
Şeri|🍷|alkol
Öküzgözü|🍷|alkol
Boğazkere|🍷|alkol
Kalecik Karası|🍷|alkol
Papazkarası|🍷|alkol
Narince|🥂|alkol asit
Emir (beyaz şarap)|🥂|alkol asit
Sultaniye (şarap)|🥂|alkol asit
Bornova Misketi|🥂|alkol seker
Cabernet Sauvignon|🍷|alkol
Merlot|🍷|alkol
Syrah (Shiraz)|🍷|alkol
Pinot Noir|🍷|alkol
Malbec|🍷|alkol
Tempranillo|🍷|alkol
Chardonnay|🥂|alkol asit
Sauvignon Blanc|🥂|alkol asit
Pinot Grigio|🥂|alkol asit
Riesling|🥂|alkol asit
Muscat|🥂|alkol seker
Kavaklıdere Yakut|🍷|alkol
Kavaklıdere Çankaya|🥂|alkol asit
Kavaklıdere Angora|🍷|alkol
Villa Doluca|🍷|alkol
Doluca DLC|🍷|alkol
Doluca Kav|🍷|alkol
Tekila|🥃|alkol
Rom|🥃|alkol
Cin|🍸|alkol
Konyak|🥃|alkol
Brendi|🥃|alkol
Uzo|🥃|alkol
Absent|🥃|alkol
Sake|🍶|alkol
Soju|🍶|alkol
Likör|🍸|alkol seker
Baileys|🥃|alkol seker sut
Kahlua|🥃|alkol seker kafein_hafif
Malibu|🥥|alkol seker
Amaretto|🥃|alkol seker
Limoncello|🍋|alkol seker
Cointreau|🍊|alkol seker
Aperol|🍹|alkol seker
Campari|🍹|alkol seker
Jägermeister|🥃|alkol seker
Sambuca|🥃|alkol seker
Jack Daniel's|🥃|alkol
Johnnie Walker Red Label|🥃|alkol
Johnnie Walker Black Label|🥃|alkol
Chivas Regal|🥃|alkol
Jameson|🥃|alkol
Glenfiddich|🥃|alkol
Ballantine's|🥃|alkol
J&B|🥃|alkol
Absolut Vodka|🥃|alkol
Smirnoff|🥃|alkol
Grey Goose|🥃|alkol
İstanblue Votka|🥃|alkol
Gordon's Gin|🍸|alkol
Bombay Sapphire|🍸|alkol
Hendrick's|🍸|alkol
Tanqueray|🍸|alkol
Beefeater|🍸|alkol
Bacardi|🥃|alkol
Captain Morgan|🥃|alkol seker
Havana Club|🥃|alkol
Jose Cuervo|🥃|alkol
Patrón|🥃|alkol
Viski kola|🥃|alkol gazli seker kafein_hafif
Votka portakal|🍹|alkol seker asit
Votka soda|🥃|alkol gazli
Tekila shot|🥃|alkol asit
Mojito|🍹|alkol seker gazli
Margarita|🍸|alkol asit seker
Aperol Spritz|🍹|alkol gazli seker
Negroni|🍸|alkol seker
Moscow Mule|🍹|alkol gazli aci_hafif seker
Piña colada|🍹|alkol seker yag
Cuba libre|🥤|alkol gazli seker kafein_hafif
Bloody Mary|🍅|alkol asit aci
Long Island Iced Tea|🍹|alkol seker kafein_hafif gazli
Martini|🍸|alkol
Espresso martini|🍸|alkol kafein seker
Daiquiri|🍸|alkol asit seker
Whisky sour|🥃|alkol asit seker
Cosmopolitan|🍸|alkol asit seker
Old fashioned|🥃|alkol seker
Caipirinha|🍹|alkol asit seker
Sex on the beach|🍹|alkol seker
# Paketli atıştırmalık & çikolata
Ülker Çikolatalı Gofret|🍫|seker yag katki sut_az
Ülker Albeni|🍫|seker yag katki sut_az
Ülker Halley|🍪|seker yag katki
Ülker Çokoprens|🍪|seker yag katki sut_az
Ülker Dido|🍫|seker yag katki sut_az
Ülker Biskrem|🍪|seker yag katki
Ülker Hanımeller|🍪|seker yag
Ülker Pötibör|🍪|seker yag_hafif
Ülker Kat Kat Tat|🍫|seker yag katki
Ülker Napoliten|🍫|seker sut_az yag_hafif
Ülker Çizi|🧀|yag islenmis
Ülker Krispi|🍘|yag_hafif islenmis
Ülker Laviva|🍫|seker yag katki
Ülker Rondo|🍪|seker yag katki
Ülker Bonibon|🍬|seker katki sut_az
Ülker Çokonat|🍫|seker yag kuruyemis katki
Ülker Probis|🍪|seker yag_hafif
Ülker O'Lala|🧁|seker yag katki
Ülker Dankek|🧁|seker yag katki
Eti Burçak|🍪|lif seker yag_hafif
Eti Karam|🍫|seker yag sut_az kafein_hafif
Eti Cin|🍪|seker yag katki
Eti Browni Intense|🍫|seker yag katki kafein_hafif
Eti Puf|🍪|seker yag katki
Eti Tutku|🍪|seker yag katki
Eti Popkek|🧁|seker yag katki
Eti Crax|🍘|yag islenmis
Eti Benimo|🍪|seker yag katki
Eti Form|🍪|lif seker
Eti Petito|🍪|seker yag_hafif
Eti Canga|🍫|seker yag kuruyemis katki
Eti Wanted|🍫|seker yag kuruyemis katki
Eti Negro|🍪|seker yag katki
Eti Topkek|🧁|seker yag katki
Eti Lifalif|🍪|lif seker kuruyemis
Eti Hoşbeş|🍫|seker yag katki
Eti Sütlü Kremalı Gofret|🍫|seker yag sut_az katki
Şölen Ozmo|🍫|seker yag katki
Şölen Biscolata|🍪|seker yag katki
Şölen Luppo|🍰|seker yag katki
Nestlé Damak|🍫|seker yag kuruyemis sut_az
Nestlé Damak Kare Antep Fıstıklı|🍫|seker yag kuruyemis sut_az
KitKat|🍫|seker yag sut_az katki
Snickers|🍫|seker yag kuruyemis sut_az
Mars|🍫|seker yag sut_az katki
Twix|🍫|seker yag sut_az katki
Bounty|🥥|seker yag lif
M&M's|🍬|seker sut_az katki
M&M's Fıstıklı|🥜|seker kuruyemis sut_az katki
Milka Sütlü Çikolata|🍫|seker sut yag_hafif kafein_hafif
Milka Oreo|🍫|seker sut yag katki
Milka Fındıklı|🍫|seker sut kuruyemis yag_hafif
Toblerone|🍫|seker sut_az kuruyemis
Kinder Bueno|🍫|seker sut yag kuruyemis
Kinder Chocolate|🍫|seker sut yag_hafif
Kinder Joy|🥚|seker sut yag
Kinder Delice|🧁|seker sut yag katki
Kinder Country|🍫|seker sut lif
Ferrero Rocher|🍫|seker yag kuruyemis
Raffaello|🥥|seker yag kuruyemis sut_az
Lion|🍫|seker yag katki sut_az
Lindt Excellence %70|🍫|kafein_hafif yag_hafif
Lindt Excellence %85|🍫|kafein yag_hafif
Ritter Sport|🍫|seker sut yag
Oreo|🍪|seker yag katki
Oreo (kakaolu dolgulu)|🍪|seker yag katki kafein_hafif
Çokokrem|🍫|seker yag kuruyemis
Sarelle|🍫|seker yag kuruyemis
Torku Banada|🍫|seker yag kuruyemis
Tadelle|🍫|seker yag kuruyemis sut_az
Haribo|🍬|seker katki
Haribo Ekşi|🍬|seker katki asit
Mentos|🍬|seker katki
Tic Tac|🍬|seker
Halls|🍬|seker katki
Falım sakız|🍬|tatlandirici
First sakız|🍬|tatlandirici
Vivident sakız|🍬|tatlandirici
Lay's Klasik|🥔|yag katki
Lay's Fırından|🥔|yag_hafif katki
Lay's Yoğurt Mevsim Yeşillikleri|🥔|yag katki sut_az
Ruffles Originals|🥔|yag katki
Ruffles Peynir Soğan|🥔|yag katki lahana
Doritos Nacho Peynirli|🌽|yag katki aci_hafif
Doritos Acı|🌽|yag katki aci
Cheetos|🧀|yag katki islenmis
Pringles Original|🥔|yag katki
Pringles Ekşi Krema Soğan|🥔|yag katki sut_az lahana
Çerezza|🥨|yag katki
Patos|🌽|yag katki
Tortilla cipsi|🌽|yag islenmis
Pretzel|🥨|islenmis
Tuzlu yer fıstığı (paketli)|🥜|kuruyemis yag
Kavrulmuş leblebi|🫘|baklagil_az
Beyaz leblebi|🫘|baklagil_az seker
Fıstıklı leblebi|🫘|baklagil_az kuruyemis
Ballı kavrulmuş badem|🌰|kuruyemis seker
Tuzlu kaju|🥜|kuruyemis yag
Çikolata kaplı badem|🍫|kuruyemis seker sut_az
Çikolata kaplı fındık|🍫|kuruyemis seker sut_az
Hurmalı bar|🍫|lif seker
Yulaflı bisküvi|🍪|lif seker yag_hafif
Tam buğday bisküvi|🍪|lif seker yag_hafif
Kepekli kraker|🍘|lif
Glutensiz bisküvi|🍪|seker yag_hafif
Pirinç patlağı (çikolatalı)|🍘|seker kafein_hafif
Kurutulmuş elma|🍎|lif
Kurutulmuş muz|🍌|seker
Kurutulmuş çilek|🍓|cekirdek seker
# Hazır içecekler
Coca-Cola|🥤|gazli seker kafein_hafif
Coca-Cola Zero|🥤|gazli tatlandirici kafein_hafif
Coca-Cola Light|🥤|gazli tatlandirici kafein_hafif
Pepsi|🥤|gazli seker kafein_hafif
Pepsi Max|🥤|gazli tatlandirici kafein_hafif
Fanta Portakal|🥤|gazli seker katki
Fanta Zero|🥤|gazli tatlandirici katki
Sprite|🥤|gazli seker
Sprite Zero|🥤|gazli tatlandirici
7Up|🥤|gazli seker
Schweppes Tonik|🥤|gazli seker
Schweppes Mandalina|🥤|gazli seker
Schweppes Bitter Lemon|🥤|gazli seker asit
Uludağ Gazoz|🥤|gazli seker
Uludağ Frutti|🥤|gazli seker
Yedigün|🥤|gazli seker katki
Çamlıca Gazoz|🥤|gazli seker
Beypazarı maden suyu|🫧|gazli
Kızılay maden suyu|🫧|gazli
Sırma C|🫧|gazli seker
Meyveli soda|🫧|gazli seker
Limonlu maden suyu|🫧|gazli asit
Lipton Ice Tea Şeftali|🧃|seker kafein_hafif
Lipton Ice Tea Limon|🧃|seker kafein_hafif asit
Lipton Ice Tea Mango|🧃|seker kafein_hafif
Lipton Ice Tea Şekersiz|🧃|tatlandirici kafein_hafif
Fuse Tea Şeftali|🧃|seker kafein_hafif
Fuse Tea Limon|🧃|seker kafein_hafif asit
Cappy Vişne|🧃|seker
Cappy Karışık Meyve|🧃|seker
Cappy Şeftali|🧃|seker
Dimes Portakal|🧃|seker asit
Dimes Vişne|🧃|seker
Meysu|🧃|seker
Elma suyu (şekersiz)|🧃|hafif
Portakal suyu (hazır)|🧃|seker asit
Ananas suyu|🧃|seker asit
Mango nektarı|🧃|seker
Kayısı nektarı|🧃|seker
Karadut suyu|🧃|seker
Üzüm suyu|🧃|seker
Pancar suyu|🧃|hafif
Aloe vera içeceği|🧃|seker
Red Bull|⚡|kafein seker gazli katki
Red Bull Sugarfree|⚡|kafein tatlandirici gazli katki
Monster Energy|⚡|kafein seker gazli katki
Monster Ultra|⚡|kafein tatlandirici gazli katki
Burn|⚡|kafein seker gazli katki
Powerade|🧃|seker katki
Gatorade|🧃|seker katki
Nescafé Xpress|☕|kafein sut seker katki
Nescafé Gold|☕|kafein
Nescafé 2'si 1 arada|☕|kafein seker sut_az katki
Hazır soğuk kahve (kutu)|☕|kafein sut seker katki
Hazır latte (şişe)|☕|kafein sut seker
Sütlü kakao (hazır)|🥛|sut seker kafein_hafif
Çilekli süt|🥛|sut seker katki
Muzlu süt|🥛|sut seker katki
Kakaolu süt|🥛|sut seker kafein_hafif
Laktozsuz kakaolu süt|🥛|seker kafein_hafif
Hazır kefir (sade)|🥛|fermente
Hazır ayran (kutu)|🥛|fermente
Protein içeceği (hazır)|🥛|sut tatlandirici katki
Hindistan cevizi sütü (içecek)|🥥|yag_hafif
Fındık sütü|🥛|kuruyemis
Kaju sütü|🥛|kuruyemis
Elektrolitli su|💧|hafif
Vitaminli su|💧|seker katki
Tonik (sade)|🥤|gazli seker
Zencefilli gazoz (ginger ale)|🥤|gazli seker
# Kafe zincirleri
Starbucks Caffè Americano|☕|kafein
Starbucks Iced Caffè Americano|🧋|kafein
Starbucks Caffè Latte|☕|kafein sut
Starbucks Iced Caffè Latte|🧋|kafein sut
Starbucks Cappuccino|☕|kafein sut
Starbucks Flat White|☕|kafein sut
Starbucks Cortado|☕|kafein sut_az
Starbucks Ristretto Bianco|☕|kafein sut
Starbucks Espresso|☕|kafein
Starbucks Latte Macchiato|☕|kafein sut
Starbucks Caramel Macchiato|☕|kafein sut seker
Starbucks Iced Caramel Macchiato|🧋|kafein sut seker
Starbucks Caffè Mocha|☕|kafein sut seker
Starbucks White Chocolate Mocha|☕|kafein sut seker katki
Starbucks Iced White Chocolate Mocha|🧋|kafein sut seker katki
Starbucks Filtre Kahve|☕|kafein
Starbucks Cold Brew|🧋|kafein
Starbucks Iced Brown Sugar Oat Shaken Espresso|🧋|kafein seker
Starbucks Doubleshot Iced Shaken Espresso|🧋|kafein seker
Starbucks Türk Kahvesi|☕|kafein
Starbucks Chai Tea Latte|🍵|kafein_hafif sut seker aci_hafif
Starbucks Iced Chai Tea Latte|🧋|kafein_hafif sut seker aci_hafif
Starbucks Hot Chocolate|🍫|sut seker kafein_hafif
Starbucks Caramel Frappuccino|🥤|kafein sut seker katki yag_hafif
Starbucks Mocha Frappuccino|🥤|kafein sut seker katki
Starbucks Java Chip Frappuccino|🥤|kafein sut seker katki yag_hafif
Starbucks Espresso Frappuccino|🥤|kafein sut seker katki
Starbucks Strawberries & Cream Frappuccino|🥤|sut seker katki
Starbucks Cool Lime|🍈|kafein_hafif seker asit
Starbucks Very Berry Hibiscus|🌺|kafein_hafif seker
Starbucks Orange Mango|🥭|kafein_hafif seker asit
Starbucks Mango Dragonfruit|🐉|kafein_hafif seker
Starbucks Matcha Latte|🍵|kafein_hafif sut seker
Starbucks Matcha Pistachio Latte|🍵|kafein_hafif sut seker
Starbucks Spanish Cream Matcha Latte|🍵|kafein_hafif sut seker
Starbucks Iced Strawberry Cream Matcha Latte|🧋|kafein_hafif sut seker katki
Starbucks Iced Apple Crumble Matcha Latte|🧋|kafein_hafif sut seker katki
Starbucks Pumpkin Spice Latte|🎃|kafein sut seker aci_hafif
Starbucks Iced Pumpkin Spice Latte|🧋|kafein sut seker aci_hafif
Starbucks Pumpkin Spice Frappuccino|🥤|kafein sut seker katki aci_hafif
Starbucks Pecan Maple Latte|☕|kafein sut seker
Starbucks Toffee Nut Latte|☕|kafein sut seker
Starbucks Earl Grey|🫖|kafein_hafif
Starbucks Mint Blend|🫖|hafif
Starbucks Kruvasan|🥐|yag sut_az
Starbucks Cheesecake|🍰|sut seker yag
Starbucks Brownie|🍫|seker yag sut_az
Starbucks Muffin|🧁|seker yag_hafif katki
Starbucks Cookie|🍪|seker yag
Kahve Dünyası Türk Kahvesi|☕|kafein
Kahve Dünyası Damla Sakızlı Türk Kahvesi|☕|kafein
Kahve Dünyası Dibek Kahvesi|☕|kafein
Kahve Dünyası Latte|☕|kafein sut
Kahve Dünyası Mocha|☕|kafein sut seker
Kahve Dünyası Sıcak Çikolata|☕|sut seker kafein_hafif
Kahve Dünyası Frappe|🥤|kafein sut seker katki
Kahve Dünyası Madlen Çikolata|🍫|seker sut yag
Kahve Dünyası Fıstıklı Çikolata|🍫|seker sut kuruyemis
Kahve Dünyası Kruvasan|🥐|yag sut_az
Espressolab Latte|☕|kafein sut
Espressolab Flat White|☕|kafein sut
Espressolab Iced Latte|🧋|kafein sut
Espressolab Cold Brew|🧋|kafein
Espressolab Mocha|☕|kafein sut seker
Espressolab Caramel Latte|☕|kafein sut seker
Caribou Caramel High Rise|🧋|kafein sut seker katki
Caribou Mocha|☕|kafein sut seker
Caribou Latte|☕|kafein sut
Gloria Jean's Mocha|☕|kafein sut seker
Gloria Jean's Chillers|🥤|kafein sut seker katki
Costa Flat White|☕|kafein sut
Costa Latte|☕|kafein sut
Tim Hortons Double Double|☕|kafein sut seker
Tim Hortons Iced Capp|🧋|kafein sut seker katki
Tim Hortons Timbits|🍩|seker yag katki
Dunkin' Donut|🍩|seker yag katki
Dunkin' Iced Latte|🧋|kafein sut
Dunkin' Boston Kreması Donut|🍩|seker yag sut katki
Simit Sarayı Simit|🥯|kuruyemis
Simit Sarayı Peynirli Poğaça|🥐|yag_hafif sut_az
Simit Sarayı Açma|🥐|yag_hafif
Simit Sarayı Kaşarlı Tost|🥪|sut_az yag_hafif
Simit Sarayı Çay|🍵|kafein_hafif
Mado Maraş Dondurması|🍨|sut seker
Mado Kaymaklı Dondurma|🍨|sut seker
Mado Sütlaç|🍮|sut seker
Mado Baklava|🍯|seker yag kuruyemis
Mado Künefe|🧀|seker yag sut
Mado Kahvaltı Tabağı|🍳|yag sut_az
Big Chefs Serpme Kahvaltı|🍳|yag sut_az
Big Chefs Tavuk Salata|🥗|cig yag_hafif
Pelit Pasta|🍰|seker sut yag
Saray Muhallebicisi Tavuk Göğsü|🍮|sut seker
Saray Muhallebicisi Kazandibi|🍮|sut seker
Hafız Mustafa Baklava|🍯|seker yag kuruyemis
Hafız Mustafa Lokum|🍬|seker
Koska Helva|🍯|seker yag kuruyemis
# Beslenme destekleri
Modulen IBD|🥛|hafif
Ensure|🥛|seker
Ensure Plus|🥛|seker yag_hafif
Fortimel|🥛|seker sut_az
Nutridrink|🥛|seker sut_az
Peptamen|🥛|hafif
PediaSure|🥛|seker
Whey protein tozu|🥛|sut_az katki
İzolat protein tozu|🥛|katki
Bitkisel protein tozu|🥛|baklagil_az katki
Kolajen tozu|🥄|hafif
Kemik suyu tozu|🦴|hafif
# Fast food zincirleri
McDonald's Big Mac|🍔|yag katki sut_az
McDonald's Double Big Mac|🍔|yag katki sut_az
McDonald's Quarter Pounder|🍔|yag katki sut_az
McDonald's Double Quarter Pounder|🍔|yag katki sut_az
McDonald's McRoyal|🍔|yag katki sut_az
McDonald's Max Burger|🍔|yag katki sut_az
McDonald's Milli Burger|🍔|yag katki
McDonald's Daba Daba Burger|🍔|yag katki aci_hafif
McDonald's Köfteburger|🍔|yag katki
McDonald's Double Köfteburger|🍔|yag katki
McDonald's Hamburger|🍔|yag katki
McDonald's Cheeseburger|🍔|yag katki sut_az
McDonald's Double Cheeseburger|🍔|yag katki sut_az
McDonald's McChicken|🍔|yag katki
McDonald's Double McChicken|🍔|yag katki
McDonald's Acılı Tavuk Klasik|🍔|yag katki aci
McDonald's Çıtır Tavuk Ekstra|🍔|yag katki
McDonald's Chicken McNuggets|🍗|yag katki islenmis
McDonald's Acılı Chicken McBites|🍗|yag katki aci
McDonald's Patates Kızartması|🍟|yag
McDonald's Tırtıklı Patates|🍟|yag
McDonald's Çıtır Soğan|🧅|yag lahana
McDonald's McFlurry|🍦|sut seker katki
McDonald's Sundae|🍨|sut seker katki
McDonald's Çuros|🍩|yag seker
McDonald's Donut|🍩|yag seker
McDonald's Cookie|🍪|seker yag
McDonald's Milkshake|🥤|sut seker katki
Burger King Whopper|🍔|yag katki cig lahana
Burger King Double Whopper|🍔|yag katki cig lahana
Burger King Whopper Jr.|🍔|yag katki cig
Burger King Rodeo Whopper|🍔|yag katki lahana
Burger King Plant Based Whopper|🌱|yag katki cig
Burger King Big King|🍔|yag katki sut_az
Burger King King Beef Burger|🍔|yag katki sut_az
Burger King Steakhouse Burger|🍔|yag katki sut_az
Burger King Texas Smokehouse Burger|🍔|yag katki islenmis aci_hafif
Burger King Köfteburger|🍔|yag katki
Burger King Cheeseburger|🍔|yag katki sut_az
Burger King Chicken Royale|🍔|yag katki
Burger King King Chicken|🍔|yag katki
Burger King Crispy Chicken|🍔|yag katki
Burger King Klasik Gurme Tavuk|🍔|yag katki
Burger King Spicy Gurme Tavuk|🍔|yag katki aci
Burger King Tavukburger|🍔|yag katki
Burger King Fish Royale|🐟|yag katki
Burger King Bean Burger|🍔|yag katki baklagil
Burger King Hot Wrap|🌯|yag katki aci_hafif
Burger King King Nuggets|🍗|yag katki islenmis
Burger King Chicken Tenders|🍗|yag katki
Burger King Soğan Halkası|🧅|yag lahana
Burger King Çıtır Peynir|🧀|yag sut_az
Burger King Patates Kızartması|🍟|yag
Burger King Sufle|🍫|seker yag sut_az
Burger King Sundae|🍨|sut seker katki
KFC Zinger Burger|🍔|yag aci katki
KFC Double Zinger Burger|🍔|yag aci katki
KFC Tavuk Burger|🍔|yag katki
KFC Aşırı Burger|🍔|yag katki
KFC Bi Burger|🍔|yag katki
KFC Twister Dürüm|🌯|yag katki cig
KFC Doritos Twister|🌯|yag katki aci_hafif
KFC Çıtır Tavuk But|🍗|yag aci_hafif
KFC Acılı Kanat|🍗|yag aci
KFC Kemiksiz Çıtır|🍗|yag katki
KFC Hot Shots|🍗|yag aci katki
KFC Çıtır Shots|🍗|yag katki
KFC Kova (karışık tavuk)|🍗|yag aci_hafif katki
KFC Coleslaw|🥗|cig lahana yag_hafif
KFC Püre (gravy soslu)|🥔|yag_hafif sut_az katki
KFC Biscuit|🥐|yag sut_az
KFC Patates Kızartması|🍟|yag
Popeyes Klasik Tavuk Sandviç|🍔|yag katki
Popeyes Acılı Tavuk Sandviç|🍔|yag katki aci
Popeyes Tavuk Parçaları|🍗|yag aci_hafif
Popeyes Kemiksiz Tavuk (Tenders)|🍗|yag katki
Popeyes Kanat|🍗|yag aci
Popeyes Cajun Patates|🍟|yag aci_hafif
Popeyes Biscuit|🥐|yag sut_az
Domino's Margarita Pizza|🍕|yag sut_az asit katki
Domino's Karışık Pizza|🍕|yag sut islenmis asit katki
Domino's Sucuksever Pizza|🍕|yag islenmis aci_hafif asit katki
Domino's Mantarsever Pizza|🍕|yag sut_az asit katki
Domino's Extravaganzza Pizza|🍕|yag islenmis sut asit katki lahana
Domino's Bol Malzemos Pizza|🍕|yag islenmis sut asit katki
Domino's Tavuklu Pizza|🍕|yag_hafif sut_az asit katki
Domino's Vegi Pizza|🍕|yag_hafif sut_az asit lif katki
Domino's Dört Peynirli Pizza|🍕|yag sut katki
Domino's New York Pizza|🍕|yag islenmis sut_az asit katki
Domino's Sarımsaklı Ekmek|🥖|yag lahana
Domino's Bol Peynirli Ekmek|🧀|yag sut_az
Domino's Çıtır Tavuk Topları|🍗|yag katki
Domino's Gurme Patates|🍟|yag
Domino's Patso|🥖|yag katki
Domino's Sufle|🍫|seker yag sut_az
Little Caesars Pepperoni Pizza|🍕|yag islenmis sut_az asit katki
Little Caesars Crazy Bread|🥖|yag lahana
Subway Tavuk Teriyaki Sandviç|🥪|seker yag_hafif cig
Subway Ton Balıklı Sandviç|🥪|yag cig
Subway Italian BMT|🥪|islenmis yag cig
Pizza Hut Margarita|🍕|yag sut asit katki
Pizza Hut Süper Süpreme|🍕|yag sut islenmis asit katki
Pizza Hut Pepperoni Lovers|🍕|yag sut islenmis aci_hafif katki
Pizza Hut Karışık|🍕|yag sut islenmis asit katki
Pizza Hut Tavuklu|🍕|yag sut asit katki
Papa John's Margarita|🍕|yag sut asit katki
Papa John's Pepperoni|🍕|yag sut islenmis aci_hafif katki
Papa John's Süper Papa|🍕|yag sut islenmis asit katki
Papa John's Sarımsaklı Sos|🧄|yag lahana katki
Sbarro Pepperoni Pizza|🍕|yag sut islenmis katki
Sbarro Peynirli Pizza|🍕|yag sut katki
Little Caesars Margarita|🍕|yag sut asit katki
Little Caesars Karışık|🍕|yag sut islenmis asit katki
Arby's Roast Beef|🥪|yag islenmis
Arby's Curly Fries|🍟|yag aci_hafif katki
Arby's Tavuk Burger|🍔|yag katki
Carl's Jr. Famous Star|🍔|yag katki
Carl's Jr. Western Bacon|🍔|yag islenmis katki
Shake Shack ShackBurger|🍔|yag sut_az
Shake Shack Patates Kızartması|🍟|yag
Shake Shack Milkshake|🥤|sut seker yag
Taco Bell Crunchy Taco|🌮|yag aci_hafif katki
Taco Bell Burrito|🌯|yag baklagil aci_hafif
McDonald's Egg McMuffin|🥪|yag islenmis
McDonald's Hash Brown|🥔|yag
McDonald's Elmalı Turta|🥧|seker yag
McDonald's Sufle|🍫|seker yag
McDonald's Wrap|🌯|yag katki
McDonald's Tavuk Salata|🥗|cig yag_hafif
McDonald's Sosisli Muffin|🥪|islenmis yag katki
Burger King Mozzarella Stick|🧀|yag sut katki
Burger King Tavuk Salata|🥗|cig yag_hafif
Burger King Gurme Tavuk Dürüm|🌯|yag katki
KFC Tavuk Salata|🥗|cig yag_hafif
KFC Mısır|🌽|kabuk
KFC Sufle|🍫|seker yag
Popeyes Coleslaw|🥬|cig lahana yag
Popeyes Mısır|🌽|kabuk
Subway Köfte Marinara|🥪|yag asit
Subway Tavuk Göğsü Sandviç|🥪|yag_hafif cig
Subway Vejetaryen Sandviç|🥪|cig lif
Subway Steak & Cheese|🥪|yag sut_az
Subway Hindi Füme Sandviç|🥪|islenmis cig
Subway Kurabiye|🍪|seker yag
Usta Dönerci Tavuk Döner Dürüm|🌯|yag
Usta Dönerci Et Döner Dürüm|🌯|yag lahana
Usta Dönerci Porsiyon Tavuk Döner|🍗|yag
Baydöner İskender|🍖|yag sut asit fermente
Baydöner Tavuk Dürüm|🌯|yag
Köfteci Yusuf Köfte|🧆|yag
Köfteci Yusuf Köfte Ekmek|🥖|yag
Komagene Çiğ Köfte Dürüm|🌯|aci cig lif
Komagene Çiğ Köfte (porsiyon)|🥙|aci cig lif
Tavuk Dünyası Çıtır Tavuk|🍗|yag
Tavuk Dünyası Izgara Tavuk|🍗|yag_hafif
Tavuk Dünyası Tavuk Kanat|🍗|yag
Tavuk Dünyası Tavuk Dürüm|🌯|yag
HD İskender|🍖|yag sut asit fermente
Kasap Döner Et Dürüm|🌯|yag lahana
Bereket Döner Tavuk Dürüm|🌯|yag
Çiğköftem Dürüm|🌯|aci cig lif
Simit Sarayı Sandviç|🥪|yag_hafif sut_az
Midyeci Ahmet Midye Dolma|🦪|yag_hafif aci_hafif
Wendy's Dave's Single|🍔|yag katki
Five Guys Burger|🍔|yag
Five Guys Patates|🍟|yag
Chipotle Burrito Bowl|🥗|baklagil aci_hafif lif
Panda Express Orange Chicken|🥡|yag seker
# Sigara & tütün
Sigara|🚬|sigara
Elektronik sigara (vape)|💨|sigara
Isıtılmış tütün (IQOS)|🚬|sigara
Nargile|💨|sigara
Puro|🚬|sigara
Pipo|🚬|sigara
Sarma tütün|🚬|sigara
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
Efes|Efes Pilsen
Tuborg|Tuborg Gold
Bomonti|Bomonti Filtresiz
Corona|Corona Extra
Tekirdağ|Tekirdağ Rakısı
Kırmızı şarap kadehi|Kırmızı şarap
Beyaz şarap kadehi|Beyaz şarap
Glühwein|Sıcak şarap (glühwein)
Cider|Elma şarabı (cider)
Spritz|Aperol Spritz
Jäger|Jägermeister
Gin|Cin
Tequila|Tekila
Whisky|Viski
Vodka|Votka
Rum|Rom
Coca Cola|Coca-Cola
Coke|Coca-Cola
Kola zero|Coca-Cola Zero
Zero kola|Coca-Cola Zero
Redbull|Red Bull
Lays|Lay's Klasik
M&Ms|M&M's
Modulen|Modulen IBD
Protein tozu|Whey protein tozu
Ice tea şeftali|Lipton Ice Tea Şeftali
Fuse tea|Fuse Tea Şeftali
Monster|Monster Energy
Magnum|Magnum Klasik
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
Cool lime|Starbucks Cool Lime
Hibiscus çayı|Hibiskus çayı
Elmalı hibiscus çayı|Elmalı hibiskus çayı
Armutlu hibiscus çayı|Armutlu hibiskus çayı
Armut ve elmalı hibiscus çayı|Armut ve elmalı hibiskus çayı
Elma armut hibiscus|Armut ve elmalı hibiskus çayı
Meyve çayı|Orman meyveli çay
Lemongrass|Limon otu çayı
Ekinezya|Ekinezya çayı
Rooibos|Rooibos çayı
Mate|Mate çayı
Earl Grey|Earl Grey çayı
Cool lime refresha|Starbucks Cool Lime
Very berry hibiscus|Starbucks Very Berry Hibiscus
Berry hibiscus|Starbucks Very Berry Hibiscus
Mango dragonfruit|Starbucks Mango Dragonfruit
Pumpkin spice latte|Starbucks Pumpkin Spice Latte
PSL|Starbucks Pumpkin Spice Latte
Frappuccino|Starbucks Caramel Frappuccino
Java chip|Starbucks Java Chip Frappuccino
Shaken espresso|Starbucks Iced Brown Sugar Oat Shaken Espresso
Big Mac|McDonald's Big Mac
McChicken|McDonald's McChicken
McNuggets|McDonald's Chicken McNuggets
McFlurry|McDonald's McFlurry
Whopper|Burger King Whopper
King Chicken|Burger King King Chicken
Chicken Royale|Burger King Chicken Royale
Zinger|KFC Zinger Burger
Twister|KFC Twister Dürüm
Kova menü|KFC Kova (karışık tavuk)
Marlboro|Sigara
Parliament|Sigara
Camel|Sigara
Winston|Sigara
Kent|Sigara
Lark|Sigara
L&M|Sigara
Chesterfield|Sigara
Davidoff|Sigara
Muratti|Sigara
Tekel 2000|Sigara
Samsun|Sigara
Pall Mall|Sigara
Lucky Strike|Sigara
Rothmans|Sigara
Tütün|Sarma tütün
IQOS|Isıtılmış tütün (IQOS)
Terea|Isıtılmış tütün (IQOS)
Heets|Isıtılmış tütün (IQOS)
Glo|Isıtılmış tütün (IQOS)
E-sigara|Elektronik sigara (vape)
Vape|Elektronik sigara (vape)
Elf bar|Elektronik sigara (vape)
Puff|Elektronik sigara (vape)
`;
