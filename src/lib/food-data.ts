// Yemek veritabanı. Her satır: ad | emoji | etiketler (boşlukla)
// Etiket anlamları foods.ts içindeki TAGS tablosunda.
// Hüküm etiketlerden ve döneme göre hesaplanır, kişisel kayıtlar geldikçe üzerine yazılır.

export const FOOD_SOURCE = `
# Çorba
Mercimek çorbası|🍲|pure
Süzme sebze çorbası|🥕|hafif
Tavuk suyu çorba|🍜|hafif
Kemik suyu|🦴|hafif
Şehriye çorbası|🍜|hafif
Pirinç çorbası|🍚|hafif
Yayla çorbası|🥣|fermente
Düğün çorbası|🥣|fermente yag_hafif
Ezogelin çorbası|🍲|pure aci
Tarhana çorbası|🥣|fermente asit aci
Domates çorbası|🍅|asit
Kremalı domates çorbası|🍅|asit sut
Mantar çorbası|🍄|sut lif
Kremalı mantar çorbası|🍄|sut yag lif
Brokoli çorbası|🥦|lahana pure
Balkabağı çorbası|🎃|pure
Patates çorbası|🥔|pure sut_az
Havuç çorbası|🥕|pure
Kabak çorbası|🥒|pure
İşkembe çorbası|🍲|yag lahana
Kelle paça|🍲|yag lahana
Paça çorbası|🍲|yag
Beyran|🍲|yag aci lahana
Toyga çorbası|🥣|fermente baklagil
Analı kızlı|🍲|baklagil aci
Tutmaç çorbası|🥣|fermente baklagil
Yeşil mercimek çorbası|🍲|baklagil lif
Nohut çorbası|🍲|baklagil
Lahana çorbası|🥬|lahana lif
Pırasa çorbası|🥬|lahana
Soğan çorbası|🧅|lahana sut_az
Balık çorbası|🐟|hafif
Miso çorbası|🍜|fermente
Ramen|🍜|yag_hafif aci
Tom yum|🍲|aci asit
Gazpacho|🍅|cig asit
Minestrone|🥣|baklagil lif asit

# Et & tavuk
Izgara tavuk göğsü|🍗|hafif
Haşlanmış tavuk|🍗|hafif
Fırın tavuk|🍗|hafif
Tavuk but (derisiz)|🍗|yag_hafif
Tavuk kanat|🍗|yag
Tavuk şiş|🍢|yag_hafif
Tavuk sote|🥘|yag_hafif aci
Tavuk haşlama sebzeli|🍲|hafif
Kremalı tavuk|🍗|sut yag
Köri soslu tavuk|🍛|aci sut yag
Tavuk schnitzel|🍗|yag
Kızarmış tavuk|🍗|yag
Tavuk nugget|🍗|yag katki
Hindi füme|🦃|islenmis
Izgara hindi|🦃|hafif
Izgara köfte|🧆|yag_hafif
İnegöl köfte|🧆|yag_hafif
Kadınbudu köfte|🧆|yag
İzmir köfte|🧆|yag asit
Sulu köfte|🍲|asit
Dalyan köfte|🧆|yag_hafif
İçli köfte|🧆|yag kuruyemis
Çiğ köfte|🌯|aci cig lif
Kuzu pirzola|🍖|yag
Kuzu tandır|🍖|yag
Kuzu incik|🍖|yag
Dana bonfile|🥩|hafif
Antrikot|🥩|yag_hafif
Biftek|🥩|yag_hafif
Rosto|🥩|yag_hafif
Haşlama et|🍲|yag_hafif
Et sote|🥘|yag_hafif aci
Tas kebabı|🍲|yag_hafif
Orman kebabı|🍲|yag_hafif lif
Hünkar beğendi|🍖|yag sut
Ali nazik|🍖|yag fermente
İskender|🍖|yag sut
Adana kebap|🍢|yag aci
Urfa kebap|🍢|yag
Beyti|🌯|yag aci
Şiş kebap|🍢|yag_hafif
Patlıcan kebabı|🍆|yag kabuk
Testi kebabı|🍲|yag lahana
Kuzu şiş|🍢|yag
Ciğer tava|🍖|yag
Arnavut ciğeri|🍖|yag aci lahana
Kokoreç|🌯|yag aci
Et döner|🥙|yag islenmis
Tavuk döner|🥙|yag
Dürüm döner|🌯|yag lahana
Kavurma|🍖|yag
Kuru köfte|🧆|yag
Mantı|🥟|fermente lahana aci
Kayseri mantısı|🥟|fermente lahana aci
Hingel|🥟|sut yag
Su böreği|🥧|yag_hafif sut_az
Sucuk|🌭|islenmis yag aci
Pastırma|🥓|islenmis aci lahana
Salam|🥓|islenmis katki
Sosis|🌭|islenmis katki
Jambon|🥓|islenmis
Kavurmalı yumurta|🍳|yag
Hamburger|🍔|yag islenmis
Cheeseburger|🍔|yag islenmis sut
Izgara burger köftesi (ekmeksiz)|🥩|yag_hafif
Tantuni|🌯|yag aci
Kumpir|🥔|yag sut islenmis
Lahmacun|🫓|aci cig
Kıymalı pide|🫓|yag
Kuşbaşılı pide|🫓|yag
Kaşarlı pide|🫓|yag sut_az
Karışık pide|🫓|yag islenmis
Etli ekmek|🫓|yag
Gözleme (peynirli)|🫓|yag_hafif sut_az
Gözleme (patatesli)|🫓|yag_hafif
Gözleme (ıspanaklı)|🫓|yag_hafif lif

# Balık & deniz ürünleri
Izgara somon|🐟|hafif
Fırın somon|🐟|hafif
Buğulama levrek|🐟|hafif
Izgara levrek|🐟|hafif
Izgara çipura|🐟|hafif
Fırın mezgit|🐟|hafif
Haşlanmış balık|🐟|hafif
Balık buğulama sebzeli|🐟|hafif
Ton balığı (suda)|🐟|hafif
Ton balığı (yağlı)|🐟|yag_hafif
Uskumru ızgara|🐟|yag_hafif
Hamsi tava|🐟|yag
Hamsi buğulama|🐟|yag_hafif
Palamut ızgara|🐟|yag_hafif
Lüfer|🐟|yag_hafif
Sardalya ızgara|🐟|yag_hafif
Kalamar tava|🦑|yag
Karides güveç|🦐|yag sut_az aci
Izgara karides|🦐|hafif
Midye dolma|🦪|aci
Midye tava|🦪|yag
Balık ekmek|🥙|yag_hafif cig lahana
Fish and chips|🐟|yag
Sushi (çiğ balık)|🍣|hafif
Sushi (pişmiş)|🍣|hafif
Sashimi|🍣|hafif
Somon füme|🐟|islenmis
Ahtapot salatası|🐙|cig asit
Balık köftesi|🐟|yag

# Sebze yemekleri
Zeytinyağlı taze fasulye|🫛|lif
Etli taze fasulye|🫛|lif yag_hafif
Zeytinyağlı barbunya|🫘|baklagil
Zeytinyağlı enginar|🌼|lif
Zeytinyağlı pırasa|🥬|lahana lif
Zeytinyağlı kereviz|🥕|lif
Zeytinyağlı bamya|🌿|lif cekirdek
Zeytinyağlı biber dolması|🫑|kabuk kuruyemis
Etli biber dolması|🫑|kabuk
Etli kabak dolması|🥒|hafif
Yaprak sarma|🍃|lif
Etli yaprak sarma|🍃|lif yag_hafif
Lahana sarması|🥬|lahana lif
Ispanak yemeği|🥬|lif
Ispanaklı yumurta|🥬|lif yag_hafif
Pazı yemeği|🥬|lif
Kabak yemeği|🥒|hafif
Kabak mücver|🥒|yag lahana
Kabak sote (kabuksuz)|🥒|hafif
Patlıcan musakka|🍆|yag kabuk asit
Karnıyarık|🍆|yag kabuk
İmam bayıldı|🍆|yag lahana
Patlıcan kızartma|🍆|yag kabuk
Közlenmiş patlıcan|🍆|kabuk
Şakşuka|🍆|yag asit kabuk
Türlü|🥘|lif lahana asit
Güveç|🥘|lif yag_hafif
Fırın sebze|🥕|lif
Haşlanmış havuç|🥕|hafif
Haşlanmış kabak|🥒|hafif
Haşlanmış patates|🥔|hafif
Patates püresi|🥔|sut_az
Sütsüz patates püresi|🥔|hafif
Fırın patates|🥔|hafif
Tatlı patates (fırın)|🍠|hafif
Patates kızartması|🍟|yag
Elma dilim patates|🍟|yag
Patates oturtma|🥔|yag_hafif asit
Brokoli (buharda)|🥦|lahana lif
Karnabahar (haşlama)|🥦|lahana lif
Karnabahar kızartması|🥦|lahana yag
Brüksel lahanası|🥬|lahana lif
Kuşkonmaz (uçları)|🌿|hafif
Mantar sote|🍄|lif yag_hafif
Mısır (haşlama)|🌽|lif kabuk
Bezelye|🫛|baklagil kabuk
Bezelye yemeği|🫛|baklagil kabuk
Enginar dolması|🌼|lif
Kereviz püresi|🥕|pure
Pancar (haşlama)|🫜|lif
Şalgam yemeği|🫜|lif lahana
Kapuska|🥬|lahana
Hünkar beğendi (sadece beğendi)|🍆|sut yag kabuk

# Bakliyat
Etli kuru fasulye|🫘|baklagil yag_hafif
Zeytinyağlı kuru fasulye|🫘|baklagil
Nohut yemeği|🫘|baklagil
Humus|🫘|baklagil kuruyemis
Falafel|🧆|baklagil yag
Yeşil mercimek yemeği|🫘|baklagil lif
Kırmızı mercimek köftesi|🧆|pure aci cig
Mercimek köftesi (acısız)|🧆|pure cig
Börülce salatası|🫘|baklagil cig
Barbunya pilaki|🫘|baklagil
Fava|🫘|pure baklagil
Bakla|🫛|baklagil kabuk
Edamame|🫛|baklagil kabuk
Soya kıyması|🫘|baklagil
Tofu|🧈|hafif
Tempeh|🫘|fermente baklagil

# Pilav, makarna & hamur işi
Pirinç pilavı|🍚|hafif
Sade beyaz pirinç|🍚|hafif
Tereyağlı pilav|🍚|yag_hafif
Şehriyeli pilav|🍚|hafif
Nohutlu pilav|🍚|baklagil
İç pilav|🍚|kuruyemis yag_hafif
Perde pilavı|🍚|kuruyemis yag
Bulgur pilavı|🍚|lif
Domatesli bulgur pilavı|🍚|lif asit
Esmer pirinç|🍚|lif
Kinoa|🍚|lif
Karabuğday|🍚|lif
Kuskus|🍚|hafif
Arpa şehriye|🍝|hafif
Sade makarna|🍝|hafif
Tereyağlı makarna|🍝|yag_hafif
Domates soslu makarna|🍝|asit
Bolonez makarna|🍝|asit yag_hafif
Kremalı makarna|🍝|sut yag
Alfredo makarna|🍝|sut yag
Pesto makarna|🍝|yag kuruyemis lahana
Arabiata makarna|🍝|aci asit
Carbonara|🍝|yag sut_az islenmis
Tam buğday makarna|🍝|lif
Fırın makarna|🍝|sut yag_hafif
Lazanya|🍝|sut yag asit
Erişte|🍝|hafif
Mantı (yoğurtsuz, sossuz)|🥟|hafif
Ravioli|🥟|sut_az yag_hafif
Gnocchi|🥔|hafif
Risotto|🍚|sut_az yag_hafif
Mantarlı risotto|🍚|sut_az lif
Paella|🥘|asit yag_hafif
Pad thai|🍜|kuruyemis aci yag_hafif
Kızarmış pilav (fried rice)|🍚|yag
Noodle (sebzeli)|🍜|yag_hafif lahana
Pizza (margherita)|🍕|yag sut_az asit
Pizza (karışık)|🍕|yag sut islenmis asit
Pizza (sucuklu)|🍕|yag islenmis aci asit
Börek (peynirli)|🥐|yag sut_az
Börek (kıymalı)|🥐|yag
Börek (ıspanaklı)|🥐|yag lif
Kol böreği|🥐|yag
Sigara böreği|🥐|yag sut_az
Su böreği (peynirli)|🥧|yag_hafif sut_az
Poğaça (sade)|🥐|yag
Poğaça (zeytinli)|🥐|yag
Açma|🥐|yag seker
Çörek|🥐|yag seker
Kruvasan|🥐|yag
Çikolatalı kruvasan|🥐|yag seker
Simit|🥯|kuruyemis

# Kahvaltı
Haşlanmış yumurta|🥚|hafif
Rafadan yumurta|🥚|hafif
Poşe yumurta|🥚|hafif
Sade omlet|🍳|yag_hafif
Peynirli omlet|🍳|yag_hafif sut_az
Mantarlı omlet|🍳|yag_hafif lif
Sahanda yumurta|🍳|yag_hafif
Çılbır|🍳|fermente aci
Menemen|🍳|asit yag_hafif
Soğanlı menemen|🍳|asit lahana yag_hafif
Sucuklu yumurta|🍳|islenmis yag aci
Pastırmalı yumurta|🍳|islenmis yag aci
Beyaz peynir|🧀|sut_az
Lor peyniri|🧀|sut_az
Çökelek|🧀|sut_az
Kaşar peyniri|🧀|sut_az
Eski kaşar|🧀|sut_az
Tulum peyniri|🧀|sut_az yag_hafif
Labne|🧀|sut
Krem peynir|🧀|sut yag_hafif
Örgü peyniri|🧀|sut_az
Hellim (ızgara)|🧀|sut_az yag_hafif
Mozzarella|🧀|sut_az
Parmesan|🧀|sut_az
Keçi peyniri|🧀|sut_az
Siyah zeytin|🫒|yag_hafif
Yeşil zeytin|🫒|yag_hafif
Zeytin ezmesi|🫒|yag_hafif
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
Avokado|🥑|yag_hafif
Avokadolu tost|🥑|yag_hafif
Kaşarlı tost|🥪|sut_az yag_hafif
Karışık tost|🥪|islenmis sut_az yag_hafif
Sucuklu tost|🥪|islenmis aci yag
Beyaz ekmek|🍞|hafif
Ekşi mayalı ekmek|🍞|hafif
Tam buğday ekmeği|🍞|lif
Çavdar ekmeği|🍞|lif
Kepekli ekmek|🍞|lif
Tohumlu ekmek|🍞|lif kuruyemis
Glutensiz ekmek|🍞|hafif
Lavaş|🫓|hafif
Yufka|🫓|hafif
Bazlama|🫓|hafif
Pişi|🫓|yag
Galeta|🍘|hafif
Grissini|🥖|hafif
Pirinç patlağı|🍘|hafif
Yulaf lapası|🥣|pure
Sütlü yulaf lapası|🥣|pure sut
Granola|🥣|lif kuruyemis seker
Müsli|🥣|lif kuruyemis
Mısır gevreği|🥣|seker katki
Pankek|🥞|yag_hafif seker
Krep|🥞|yag_hafif sut_az
Waffle|🧇|yag seker
Sade yoğurt|🥛|fermente
Laktozsuz yoğurt|🥛|hafif
Süzme yoğurt|🥛|fermente
Meyveli yoğurt|🥛|fermente seker
Kefir|🥛|fermente

# Salata & mezeler
Çoban salata|🥗|cig kabuk lahana
Mevsim salata|🥗|cig
Roka salatası|🥗|cig lif
Gavurdağı salatası|🥗|cig kuruyemis aci
Sezar salata|🥗|cig sut yag
Ton balıklı salata|🥗|cig
Tavuklu salata|🥗|cig
Patates salatası|🥔|asit
Makarna salatası|🥗|asit cig
Kısır|🥗|lif aci cig
Tabule|🥗|lif cig asit
Piyaz|🫘|baklagil cig lahana
Rus salatası|🥗|yag islenmis
Haydari|🥛|fermente lahana
Cacık|🥒|fermente kabuk lahana
Atom|🌶️|fermente aci yag
Ezme|🌶️|aci cig asit
Acılı ezme|🌶️|aci cig asit
Muhammara|🌶️|kuruyemis aci
Babagannuş|🍆|kabuk lahana
Patlıcan salatası|🍆|kabuk lahana asit
Şakşuka (soğuk)|🍆|yag asit kabuk
Fava (meze)|🫘|pure baklagil
Humus (meze)|🫘|baklagil kuruyemis
Deniz börülcesi|🌿|lif asit
Turşu|🥒|fermente asit
Lahana turşusu|🥬|fermente lahana asit
Közlenmiş biber|🫑|kabuk
Közlenmiş kırmızı biber (kabuksuz)|🫑|hafif
Yoğurtlu semizotu|🌿|fermente lif
Avokado salatası|🥑|cig yag_hafif
Havuç tarator|🥕|fermente kuruyemis lahana
Salatalık (kabuksuz)|🥒|cig
Salatalık|🥒|cig kabuk
Domates|🍅|cig asit kabuk
Soyulmuş domates|🍅|asit
Marul|🥬|cig
Göbek marul|🥬|cig
Kıvırcık marul|🥬|cig lif
Roka|🌿|cig lif
Maydanoz|🌿|cig lif
Dereotu|🌿|cig
Taze soğan|🧅|cig lahana
Kuru soğan|🧅|lahana
Sarımsak|🧄|lahana
Kırmızı lahana|🥬|cig lahana lif
Turp|🫜|cig lahana
Ispanak salatası|🥬|cig lif

# Meyve
Olgun muz|🍌|hafif
Ham muz|🍌|lif
Kabuksuz elma|🍏|hafif
Kabuklu elma|🍎|kabuk
Elma püresi|🍮|hafif
Haşlanmış elma|🍮|hafif
Armut (kabuksuz)|🍐|lif
Armut|🍐|kabuk lif
Ayva (pişmiş)|🍐|hafif
Kavun|🍈|hafif
Karpuz|🍉|seker
Şeftali (kabuksuz)|🍑|hafif
Şeftali|🍑|kabuk
Kayısı|🍑|lif
Erik|🫐|kabuk lif
Kiraz|🍒|kabuk
Vişne|🍒|kabuk asit
Üzüm|🍇|kabuk seker
Çekirdeksiz üzüm|🍇|kabuk
Çilek|🍓|cekirdek
Ahududu|🫐|cekirdek lif
Böğürtlen|🫐|cekirdek lif
Yaban mersini|🫐|kabuk
Kivi|🥝|cekirdek lif
İncir|🫐|cekirdek lif
Nar|🍎|cekirdek
Portakal|🍊|asit lif
Mandalina|🍊|asit lif
Greyfurt|🍊|asit
Limon|🍋|asit
Ananas|🍍|asit lif
Mango|🥭|hafif
Papaya|🥭|hafif
Avokado (yarım)|🥑|yag_hafif
Hindistan cevizi|🥥|lif yag
Hurma|🌴|seker lif
Kuru kayısı|🍑|lif seker
Kuru incir|🫐|lif seker cekirdek
Kuru üzüm|🍇|lif seker kabuk
Kuru erik|🫐|lif seker
Meyve kompostosu|🍮|hafif seker
Meyve salatası|🍓|kabuk cekirdek

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
Patlamış mısır|🍿|lif kabuk
Cips|🥔|yag aci katki
Tuzlu kraker|🍘|hafif
Kraker (tam tahıllı)|🍘|lif
Pirinç krakeri|🍘|hafif
Galeta unu kurabiyesi|🍪|yag_hafif seker
Protein bar|🍫|tatlandirici kuruyemis katki
Granola bar|🍫|kuruyemis seker lif
Bisküvi (sade)|🍪|seker yag_hafif
Petibör bisküvi|🍪|seker
Kek (sade)|🍰|seker yag_hafif
Çikolata (sütlü)|🍫|seker sut yag_hafif kafein_hafif
Bitter çikolata|🍫|kafein_hafif yag_hafif
Gofret|🍫|seker yag katki
Şekersiz sakız|🍬|tatlandirici
Şekersiz şeker|🍬|tatlandirici
Jelibon|🍬|seker katki
Lokum|🍬|seker
Fındıklı lokum|🍬|seker kuruyemis
Pestil|🍑|seker lif
Kuru meyve bar|🍫|lif seker

# Tatlı
Sütlaç|🍮|sut seker
Fırın sütlaç|🍮|sut seker
Muhallebi|🍮|sut seker
Laktozsuz muhallebi|🍮|seker
Kazandibi|🍮|sut seker
Tavuk göğsü (tatlı)|🍮|sut seker
Keşkül|🍮|sut seker kuruyemis
Supangle|🍫|sut seker kafein_hafif
Puding|🍮|sut seker katki
İrmik helvası|🍮|seker yag_hafif
Un helvası|🍮|seker yag
Tahin helvası|🥜|kuruyemis seker yag
Revani|🍰|seker
Şekerpare|🍪|seker yag
Baklava|🍯|seker yag kuruyemis
Fıstıklı baklava|🍯|seker yag kuruyemis
Kadayıf|🍯|seker yag kuruyemis
Künefe|🧀|seker yag sut_az
Güllaç|🍮|sut seker kuruyemis
Aşure|🥣|baklagil lif seker kuruyemis
Kabak tatlısı|🎃|seker kuruyemis
Ayva tatlısı|🍐|seker
Lokma|🍩|seker yag
Tulumba|🍩|seker yag
Profiterol|🍮|sut seker yag kafein_hafif
Trileçe|🍰|sut seker
Cheesecake|🍰|sut seker yag
Tiramisu|🍰|sut seker kafein
Brownie|🍫|seker yag kafein_hafif
Çikolatalı pasta|🎂|seker yag sut kafein_hafif
Meyveli pasta|🎂|seker sut cekirdek
Yaş pasta|🎂|seker sut yag
Kurabiye|🍪|seker yag_hafif
Un kurabiyesi|🍪|seker yag
Cevizli kurabiye|🍪|seker yag kuruyemis
Donut|🍩|seker yag
Sufle|🍫|seker yag sut kafein_hafif
Dondurma (sütlü)|🍨|sut seker yag_hafif
Sorbe (meyveli dondurma)|🍧|seker
Maraş dondurması|🍨|sut seker
Şekersiz dondurma|🍨|sut tatlandirici
Haşlanmış elma tatlısı|🍮|hafif seker
Jöle|🍮|seker
Muzlu süt tatlısı|🍌|sut seker

# Fast food & dünya mutfağı
Tavuk burger|🍔|yag
Tavuk wrap|🌯|yag_hafif cig
Falafel dürüm|🌯|baklagil yag cig
Hot dog|🌭|islenmis yag
Taco|🌮|aci yag cig
Burrito|🌯|baklagil aci yag
Nachos|🧀|yag sut aci
Quesadilla|🧀|sut yag_hafif
Köri (sebzeli)|🍛|aci baklagil
Tavuk tikka masala|🍛|aci sut yag
Butter chicken|🍛|sut yag aci_hafif
Biryani|🍛|aci yag_hafif
Teriyaki tavuk|🍗|seker
Kung pao tavuk|🥡|aci kuruyemis yag
Tatlı ekşi tavuk|🥡|yag seker asit
Dim sum|🥟|yag_hafif
Spring roll|🥟|yag lahana
Poke bowl|🥗|cig hafif
Bibimbap|🍚|aci cig
Shawarma|🥙|yag lahana
Kebab dürüm|🌯|yag aci
Club sandviç|🥪|islenmis yag_hafif cig
Tavuklu sandviç|🥪|yag_hafif
Ton balıklı sandviç|🥪|yag_hafif
Islak hamburger|🍔|yag lahana asit
Midye (sokak)|🦪|aci
Kumru|🥪|islenmis yag sut_az
Börek (sokak)|🥐|yag
Mısır (köz)|🌽|lif kabuk
Kestane kebap|🌰|lif
Simit + peynir|🥯|kuruyemis sut_az
Pilav üstü tavuk|🍚|yag_hafif
Pilav üstü nohut|🍚|baklagil
Çiğ köfte dürüm|🌯|aci cig lif

# Soslar & çeşniler
Ketçap|🍅|asit seker
Mayonez|🥚|yag
Hardal|🟡|aci
Acı sos|🌶️|aci
Barbekü sosu|🍖|seker asit aci_hafif
Soya sosu|🥢|hafif
Sirke|🫙|asit
Nar ekşisi|🍷|asit
Pul biber|🌶️|aci
Karabiber|⚫|aci_hafif
Kimyon|🟤|hafif
Zerdeçal|🟡|hafif
Zencefil|🫚|hafif
Taze nane|🌿|hafif
Kekik|🌿|hafif
Tarçın|🟤|hafif
Sarımsaklı yoğurt|🥛|fermente lahana
Tereyağlı sos|🧈|yag
Zeytinyağı|🫒|yag_hafif

# İçecek
Su|💧|hafif
Maden suyu|🫧|gazli
Soda|🫧|gazli
Ayran|🥛|fermente
Kefir (içecek)|🥛|fermente
Süt|🥛|sut
Laktozsuz süt|🥛|hafif
Badem sütü|🥛|katki
Yulaf sütü|🥛|hafif
Soya sütü|🥛|baklagil
Çay|🍵|kafein_hafif
Açık çay|🍵|kafein_hafif
Yeşil çay|🍵|kafein_hafif
Papatya çayı|🌼|hafif
Nane limon|🌿|hafif
Rezene çayı|🌿|hafif
Zencefil çayı|🫚|hafif
Ihlamur|🍃|hafif
Adaçayı|🌿|hafif
Kahve (filtre)|☕|kafein
Türk kahvesi|☕|kafein
Espresso|☕|kafein
Latte|☕|kafein sut
Laktozsuz latte|☕|kafein
Cappuccino|☕|kafein sut
Soğuk kahve|🧋|kafein sut seker
Kafeinsiz kahve|☕|kafein_hafif
Sıcak çikolata|☕|sut seker kafein_hafif
Salep|☕|sut seker
Boza|🥤|fermente seker
Şalgam suyu|🥤|fermente aci asit
Kola|🥤|gazli seker kafein_hafif
Diyet kola|🥤|gazli tatlandirici kafein_hafif
Gazoz|🥤|gazli seker
Enerji içeceği|⚡|kafein seker gazli katki
Ice tea|🧃|seker kafein_hafif
Hazır meyve suyu|🧃|seker
Taze portakal suyu|🍊|asit seker
Elma suyu|🧃|seker
Limonata|🍋|asit seker
Smoothie (muzlu)|🥤|seker
Smoothie (çilekli)|🥤|seker cekirdek
Milkshake|🥤|sut seker yag
Protein shake|🥤|sut tatlandirici
Kemik suyu (içecek)|🦴|hafif
Bira|🍺|alkol gazli
Şarap|🍷|alkol
Rakı|🥃|alkol
Viski|🥃|alkol
Votka|🥃|alkol
Kokteyl|🍸|alkol seker
Alkolsüz bira|🍺|gazli
`;
