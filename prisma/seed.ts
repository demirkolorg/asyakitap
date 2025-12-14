import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Seeding database...")

    // Delete existing lists to start fresh
    await prisma.readingList.deleteMany({
        where: {
            slug: { in: ["bilim-kurgu", "bilim-kurgu-yol-haritasi", "dusunce-dava", "tarih-medeniyet", "ilahiyat-medeniyet", "zeka-kod-kaos", "istihbarat-strateji", "teknoloji-yapay-zeka"] }
        }
    })

    // ==========================================
    // 1. BİLİM KURGU UZMANLIK YOL HARİTASI
    // ==========================================
    const bilimKurgu = await prisma.readingList.create({
        data: {
            slug: "bilim-kurgu",
            name: "🚀 Bilim Kurgu Okumaları",
            description: "En basit, en \"film gibi\" olandan başlayıp, siberpunka, sosyal deneylere ve evrenin sırlarını çözen ağır toplara uzanan 10 seviyeli dev bir yol haritası. 50 kitap.",
            coverUrl: "https://images.unsplash.com/photo-1534996858221-380b92700493?w=800&q=80",
            sortOrder: 0,
            levels: {
                create: [
                    // Seviye 1: Sayfa Çevirtenler
                    {
                        levelNumber: 1,
                        name: "\"Sayfa Çevirtenler\" (Yüksek Tempo)",
                        description: "Bilimsel açıklamalarla boğmayan, hayatta kalma ve macera odaklı, Hollywood filmi tadında kitaplar.",
                        books: {
                            create: [
                                { title: "Marslı", author: "Andy Weir", neden: "Mars'ta mahsur kalan bir botanikçinin hayatta kalma mücadelesi. Müthiş zeki ve esprili.", sortOrder: 0 },
                                { title: "Karanlık Madde", author: "Blake Crouch", neden: "Paralel evrenler arasında geçen, nefes nefese bir kaçış hikayesi. \"Diğer ben\" ile yüzleşmek.", sortOrder: 1 },
                                { title: "Başlat (Ready Player One)", author: "Ernest Cline", neden: "80'ler kültürü ve oyun dünyasına aşk mektubu. Sanal gerçeklikte hazine avı.", sortOrder: 2 },
                                { title: "Jurassic Park", author: "Michael Crichton", neden: "Filmini unut. Kitaptaki kaos teorisi ve genetik mühendisliği tartışmaları çok daha derin.", sortOrder: 3 },
                                { title: "Kurtuluş Projesi (Project Hail Mary)", author: "Andy Weir", neden: "Uzayda tek başına uyanan bir adam ve insanlığı kurtarma görevi. Bilim ve dostluk üzerine.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 2: Mizah ve Absürtlük
                    {
                        levelNumber: 2,
                        name: "Mizah ve Absürtlük (Buzları Eritmek)",
                        description: "Bilim kurgunun her zaman ciddi olması gerekmez. Evrenin saçmalıklarına gülmek için ideal seviye.",
                        books: {
                            create: [
                                { title: "Otostopçunun Galaksi Rehberi", author: "Douglas Adams", neden: "Evrenin en komik ve en saçma yolculuğu. İngiliz mizahının zirvesi.", sortOrder: 0 },
                                { title: "Kedi Beşiği", author: "Kurt Vonnegut", neden: "Dünyayı dondurabilecek bir madde ve insanlığın deliliği üzerine kara mizah.", sortOrder: 1 },
                                { title: "Kızıl Üniformalılar (Redshirts)", author: "John Scalzi", neden: "Star Trek gibi dizilerde sürekli ölen \"isimsiz mürettebatın\" isyanı. Çok eğlenceli.", sortOrder: 2 },
                                { title: "Kıyamet Gösterisi (Good Omens)", author: "Neil Gaiman & Terry Pratchett", neden: "Bir melek ve bir şeytanın kıyameti durdurmak için işbirliği yapması.", sortOrder: 3 },
                                { title: "Mezbaha 5", author: "Kurt Vonnegut", neden: "Zaman içinde savrulan bir askerin savaş karşıtı, yarı deli hikayesi.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 3: Kısa Klasikler
                    {
                        levelNumber: 3,
                        name: "Kısa Klasikler (Temelleri Atmak)",
                        description: "Türün \"Ata\"ları. Sayfa sayıları az (100-200 sayfa) ama vizyonları yüzyılları aşıyor.",
                        books: {
                            create: [
                                { title: "Zaman Makinesi", author: "H.G. Wells", neden: "Geleceğe gidip insanlığın sınıfsal olarak iki farklı türe ayrıldığını görmek.", sortOrder: 0 },
                                { title: "Fahrenheit 451", author: "Ray Bradbury", neden: "Kitapların yakıldığı, ekranların insanları uyuşturduğu bir gelecek.", sortOrder: 1 },
                                { title: "Ben, Robot", author: "Isaac Asimov", neden: "Yapay zeka etiğinin ve 3 Robot Yasası'nın temeli. Robotların mantık hataları.", sortOrder: 2 },
                                { title: "Dünyalar Savaşı", author: "H.G. Wells", neden: "Uzaylı istilası temasının kökeni. İnsanlığın çaresizliği.", sortOrder: 3 },
                                { title: "Görünmez Adam", author: "H.G. Wells", neden: "Bilim etiği üzerine. Görünmezlik gücü insana neler yaptırır?", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 4: Cyberpunk
                    {
                        levelNumber: 4,
                        name: "Cyberpunk ve Sanal Gerçeklik (Yazılımcı Özel)",
                        description: "Kodlar, yapay zeka, hackerlar, şirketlerin yönettiği distopyalar.",
                        books: {
                            create: [
                                { title: "Neuromancer", author: "William Gibson", neden: "Matrix'in atası. \"Siberuzay\" kelimesinin icat edildiği kitap. Biraz zor okunur ama kültdür.", sortOrder: 0 },
                                { title: "Parazit (Snow Crash)", author: "Neal Stephenson", neden: "\"Metaverse\" kavramının çıktığı kitap. Sümer mitolojisi ile sanal gerçekliği birleştirir.", sortOrder: 1 },
                                { title: "Değiştirilmiş Karbon (Altered Carbon)", author: "Richard K. Morgan", neden: "Bilincin dijitalleşip başka bedenlere yüklenebildiği bir ölümsüzlük ve dedektiflik hikayesi.", sortOrder: 2 },
                                { title: "Androidler Elektrikli Koyun Düşler mi?", author: "Philip K. Dick", neden: "Blade Runner. İnsan ile yapay zeka arasındaki fark \"empati\" midir?", sortOrder: 3 },
                                { title: "Ubik", author: "Philip K. Dick", neden: "Gerçeklik nedir? Ölüler yarı-canlı tutulursa ne olur? Zihin büken bir kurgu.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 5: Uzay Operası
                    {
                        levelNumber: 5,
                        name: "Uzay Operası ve Askeri Strateji",
                        description: "Yıldızlararası savaşlar, filo yönetimi, siyaset ve strateji.",
                        books: {
                            create: [
                                { title: "Ender'in Oyunu", author: "Orson Scott Card", neden: "Çocukların simülasyonlarla komutan olarak yetiştirilmesi. Liderlik ve strateji dersi.", sortOrder: 0 },
                                { title: "Yaşlı Adamın Savaşı", author: "John Scalzi", neden: "75 yaşındaki insanların genç bedenlere aktarılıp uzayda savaştırılması.", sortOrder: 1 },
                                { title: "Yıldız Gemisi Askerleri", author: "Robert Heinlein", neden: "Filmi sadece aksiyondu, kitap ise askerlik, vatandaşlık ve demokrasi üzerine felsefi bir tartışmadır.", sortOrder: 2 },
                                { title: "Bitmeyen Savaş", author: "Joe Haldeman", neden: "Işık hızında seyahat yüzünden askerler için 1 yıl geçerken dünyada yüzyıllar geçmesi.", sortOrder: 3 },
                                { title: "Leviathan Uyanıyor (Enginlik)", author: "James S.A. Corey", neden: "Güneş sistemindeki politik soğuk savaş. The Expanse dizisinin kaynağı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 6: Post-Apokaliptik
                    {
                        levelNumber: 6,
                        name: "Post-Apokaliptik ve Hayatta Kalma",
                        description: "Medeniyet çöktükten sonra insan kalmak. Frostpunk seven taraf için.",
                        books: {
                            create: [
                                { title: "Metro 2033", author: "Dmitry Glukhovsky", neden: "Nükleer savaş sonrası Moskova metrosunda kurulan yeni ve karanlık dünya.", sortOrder: 0 },
                                { title: "Metro 2034", author: "Dmitry Glukhovsky", neden: "Serinin ikinci kitabı. Metrodaki hayata derin bir bakış ve farklı karakterler.", sortOrder: 1 },
                                { title: "Metro 2035", author: "Dmitry Glukhovsky", neden: "Serinin finali. Artyom'un gerçeği arama yolculuğu.", sortOrder: 2 },
                                { title: "Yol (The Road)", author: "Cormac McCarthy", neden: "Bir baba ve oğulun, kül olmuş dünyada güneye yürüyüşü. Çok sarsıcı ve gerçekçi.", sortOrder: 3 },
                                { title: "Triffidlerin Günü", author: "John Wyndham", neden: "İnsanların kör olduğu ve yürüyen bitkilerin saldırdığı klasik bir felaket senaryosu.", sortOrder: 4 },
                                { title: "İstasyon On Bir", author: "Emily St. John Mandel", neden: "Salgın sonrası dünyada tiyatro yaparak medeniyeti hatırlatmaya çalışan bir grup.", sortOrder: 5 },
                                { title: "Leibowitz İçin Bir İlahi", author: "Walter M. Miller", neden: "Nükleer yıkımdan sonra bilimi korumaya çalışan rahipler. Din ve bilim döngüsü.", sortOrder: 6 },
                                { title: "Kum", author: "Hugh Howey", neden: "Çöle gömülmüş bir medeniyetin hayatta kalma mücadelesi. Silo serisinin yazarından.", sortOrder: 7 },
                                { title: "Salgın", author: "Ling Ma", neden: "Salgın sonrası distopya. Kapitalizm eleştirisi ve zombi metaforu.", sortOrder: 8 }
                            ]
                        }
                    },
                    // Seviye 7: İlk Temas
                    {
                        levelNumber: 7,
                        name: "İlk Temas ve Uzaylılar",
                        description: "Sadece \"Bizi vurmaya geldiler\" değil. \"Onlarla nasıl konuşuruz?\" sorusu.",
                        books: {
                            create: [
                                { title: "Çocukluğun Sonu", author: "Arthur C. Clarke", neden: "Uzaylılar dünyaya barış getirirse bunun bedeli ne olur? İnsan evriminin sonu.", sortOrder: 0 },
                                { title: "Mesaj (Contact)", author: "Carl Sagan", neden: "Bir gökbilimcinin dünya dışı sinyal alması. Bilim ve inanç çatışması.", sortOrder: 1 },
                                { title: "Rama ile Buluşma", author: "Arthur C. Clarke", neden: "Güneş sistemine giren devasa bir silindir nesnenin keşfi. Mühendislik ve gizem.", sortOrder: 2 },
                                { title: "Geliş (Hayatının Hikayesi)", author: "Ted Chiang", neden: "Uzaylıların dilini öğrenmek, zaman algımızı değiştirir mi? Dilbilimsel bilim kurgu.", sortOrder: 3 },
                                { title: "Solaris", author: "Stanislaw Lem", neden: "İletişim kurulamayan, okyanus gezegen. İnsanın kendi bilinçaltıyla savaşı.", sortOrder: 4 },
                                { title: "Kıyamete Bir Milyar Yıl", author: "Arkadi ve Boris Strugatski", neden: "Felsefi bilim kurgu ve bilinmezlik. İnsanlığın evrensel engelle karşılaşması.", sortOrder: 5 }
                            ]
                        }
                    },
                    // Seviye 8: Distopyalar
                    {
                        levelNumber: 8,
                        name: "Distopyalar ve Sosyoloji",
                        description: "Toplum mühendisliği. \"Böyle giderse sonumuz ne olur?\"",
                        books: {
                            create: [
                                { title: "1984", author: "George Orwell", neden: "Gözetim toplumu, Büyük Birader ve gerçeğin yok edilmesi.", sortOrder: 0 },
                                { title: "Hayvan Çiftliği", author: "George Orwell", neden: "Totalitarizmin alegorisi. Devrimlerin nasıl yozlaştığının hikayesi.", sortOrder: 1 },
                                { title: "Cesur Yeni Dünya", author: "Aldous Huxley", neden: "Haz, uyuşturucu ve genetik mühendisliği ile uyuşturulmuş, \"mutlu\" köleler.", sortOrder: 2 },
                                { title: "Damızlık Kızın Öyküsü", author: "Margaret Atwood", neden: "Kadın haklarının olmadığı teokratik bir rejim.", sortOrder: 3 },
                                { title: "Biz", author: "Yevgeni Zamyatin", neden: "1984 ve Cesur Yeni Dünya'ya ilham veren, camdan evlerde yaşanan şeffaf distopya.", sortOrder: 4 },
                                { title: "Mülksüzler", author: "Ursula K. Le Guin", neden: "Anarşist bir ütopya mümkün mü? Mülkiyet olmadan toplum nasıl yaşar?", sortOrder: 5 }
                            ]
                        }
                    },
                    // Seviye 9: Alternatif Tarih
                    {
                        levelNumber: 9,
                        name: "Alternatif Tarih ve Zaman",
                        description: "\"Tarihte bir şey değişseydi ne olurdu?\" ve zaman yolculuğunun paradoksları.",
                        books: {
                            create: [
                                { title: "Yüksek Şatodaki Adam", author: "Philip K. Dick", neden: "2. Dünya Savaşı'nı Naziler ve Japonlar kazansaydı dünya nasıl olurdu?", sortOrder: 0 },
                                { title: "11/22/63", author: "Stephen King", neden: "Bir adam geçmişe gidip Kennedy suikastını önlemeye çalışır. Kelebek etkisi.", sortOrder: 1 },
                                { title: "Sonsuzluğun Sonu", author: "Isaac Asimov", neden: "Zamanı bir mühendislik projesi gibi yöneten ve hataları düzelten bir kurum.", sortOrder: 2 },
                                { title: "Zamanın Kıyısındaki Kadın", author: "Marge Piercy", neden: "Hem ütopik hem distopik geleceğe gidip gelen bir kadının hikayesi.", sortOrder: 3 },
                                { title: "Kaplan! Kaplan!", author: "Alfred Bester", neden: "Işınlanmanın bulunduğu bir dünyada Monte Kristo Kontu vari bir intikam hikayesi.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 10: Hard Sci-Fi
                    {
                        levelNumber: 10,
                        name: "Hard Sci-Fi ve Başyapıtlar (Zirve)",
                        description: "Fizik, biyoloji, ekoloji ve felsefenin en yoğun olduğu, okuması emek isteyen dev eserler.",
                        books: {
                            create: [
                                { title: "Dune", author: "Frank Herbert", neden: "Çöl gezegeni, siyaset, din ve ekoloji. Bilim kurgunun Yüzüklerin Efendisi.", sortOrder: 0 },
                                { title: "Dune Mesihi", author: "Frank Herbert", neden: "Kahramanlık mitinin eleştirisi. Paul Atreides'in trajedisi.", sortOrder: 1 },
                                { title: "Dune Çocukları", author: "Frank Herbert", neden: "Genetik hafıza ve gelecek vizyonu. Serinin en karmaşık kitabı.", sortOrder: 2 },
                                { title: "Dune Tanrı İmparatoru", author: "Frank Herbert", neden: "3500 yıl sonra. İnsanlığın geleceği için yapılan en büyük fedakarlık.", sortOrder: 3 },
                                { title: "Dune Sapkınları", author: "Frank Herbert", neden: "Dağılma sonrası yeni düzen. Bene Gesserit'in geri dönüşü.", sortOrder: 4 },
                                { title: "Dune Rahibeler Meclisi", author: "Frank Herbert", neden: "Serinin finali. Herbert'ın son eseri.", sortOrder: 5 },
                                { title: "Vakıf", author: "Isaac Asimov", neden: "Galaktik İmparatorluk çökerken, medeniyeti kurtarmak için kurulan matematiksel plan: Psikotarih.", sortOrder: 6 },
                                { title: "Üç Cisim Problemi", author: "Cixin Liu", neden: "Fizik kurallarının silah olarak kullanıldığı, evrenin karanlık orman teorisi.", sortOrder: 7 },
                                { title: "Karanlığın Sol Eli", author: "Ursula K. Le Guin", neden: "Cinsiyetin olmadığı bir gezegende diplomasi ve insanlık üzerine felsefi bir yolculuk.", sortOrder: 8 },
                                { title: "Hyperion", author: "Dan Simmons", neden: "Farklı gezegenlerden gelen hacıların anlattığı hikayeler. Canterbury Hikayeleri'nin uzay versiyonu.", sortOrder: 9 }
                            ]
                        }
                    }
                ]
            }
        }
    })
    console.log(`Created: ${bilimKurgu.name}`)

    // ==========================================
    // 2. DÜŞÜNCE VE DAVA OKUMALARI - BÜYÜK KÜLLİYAT
    // ==========================================
    const dusunceDava = await prisma.readingList.create({
        data: {
            slug: "dusunce-dava",
            name: "💡 Düşünce ve Dava Okumaları",
            description: "Bir insanın entelektüel omurgasını sıfırdan inşa edip zirveye taşıyacak 12 Seviyeli ve 75 Kitaplık bir \"Münevver Olma Projesi\". 3-4 yıllık bir hayat projesi.",
            coverUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
            sortOrder: 1,
            levels: {
                create: [
                    // Seviye 1: Kalbi ve Zihni Isıtma
                    {
                        levelNumber: 1,
                        name: "Kalbi ve Zihni Isıtma (Akıcı Hikayeler)",
                        description: "Okuma kondisyonu kazanmak. Dili sade, mesajı net, kalbe dokunan eserler.",
                        books: {
                            create: [
                                { title: "Minyeli Abdullah", author: "Hekimoğlu İsmail", neden: "İnanç çilesinin klasik romanı.", sortOrder: 0 },
                                { title: "Yürek Dede ile Padişah", author: "Cahit Zarifoğlu", neden: "Masal tadında tasavvuf.", sortOrder: 1 },
                                { title: "Uzun Hikaye", author: "Mustafa Kutlu", neden: "Anadolu irfanının en sıcak, en sinematografik hali.", sortOrder: 2 },
                                { title: "Beyhude Ömrüm", author: "Mustafa Kutlu", neden: "Toprağa tutunma ve sabır öyküsü.", sortOrder: 3 },
                                { title: "Sır", author: "Mustafa Kutlu", neden: "Mustafa Kutlu külliyatından. Anadolu hikayelerinin sıcaklığı.", sortOrder: 4 },
                                { title: "Memleket Hikayeleri", author: "Refik Halit Karay", neden: "Türkçenin lezzetini damakta bırakan hikayeler.", sortOrder: 5 },
                                { title: "Yollar Dönüşe Gider", author: "Nurullah Genç", neden: "Erzurum soğuğunda geçen sıcak bir hayat hikayesi.", sortOrder: 6 },
                                { title: "Toprak Ana", author: "Cengiz Aytmatov", neden: "Savaş ve kıtlıkta insan kalabilmek.", sortOrder: 7 },
                                { title: "Martin Eden", author: "Jack London", neden: "Kimlik inşası ve mücadele. Bir insanın kendini yetiştirme öyküsü.", sortOrder: 8 },
                                { title: "Beyaz Diş", author: "Jack London", neden: "Doğa, hayatta kalma ve medeniyetle tanışma.", sortOrder: 9 },
                                { title: "Babamın Şarkısı", author: "İsmail Özen", neden: "Sıcak bir aile hikayesi ve baba-oğul ilişkisi.", sortOrder: 10 },
                                { title: "Bangır Bangır Ferdi Çalıyor Evde...", author: "Mahir Ünsal Eriş", neden: "Nostaljik ve eğlenceli bir çocukluk hikayesi.", sortOrder: 11 },
                                { title: "Beyaz Gemi", author: "Cengiz Aytmatov", neden: "Masumiyet ve hayal kırıklığı üzerine dokunaklı bir hikaye.", sortOrder: 12 },
                                { title: "Bir Çift Yürek", author: "Marlo Morgan", neden: "Manevi bir yolculuk ve Aborijin bilgeliği.", sortOrder: 13 },
                                { title: "Bu Böyledir", author: "Mustafa Kutlu", neden: "Anadolu insanının hikayesi ve kabullenme.", sortOrder: 14 },
                                { title: "Fabrika Ayarı", author: "Hayati İnanç", neden: "Sohbet tadında, düşündüren yazılar.", sortOrder: 15 },
                                { title: "Martı Jonathan Livingston", author: "Richard Bach", neden: "Özgürlük ve kendini aşma hikayesi.", sortOrder: 16 },
                                { title: "Selam Olsun", author: "Mustafa Kutlu", neden: "Anadolu'dan selamlar ve hikayeler.", sortOrder: 17 },
                                { title: "Şeker Portakalı", author: "Jose Mauro De Vasconcelos", neden: "Çocuk gözünden hayatın acı tatlı gerçekleri.", sortOrder: 18 },
                                { title: "Sevmek Bu Kadar Güzelken", author: "Sema Maraşlı", neden: "Aile ve sevgi üzerine.", sortOrder: 19 },
                                { title: "Yoksulluk İçimizde", author: "Mustafa Kutlu", neden: "Modern insanın iç yoksulluğu.", sortOrder: 20 },
                                { title: "Yoksulluk Kitabı", author: "Mustafa Kutlu", neden: "Yoksulluk ve zenginlik üzerine düşünceler.", sortOrder: 21 }
                            ]
                        }
                    },
                    // Seviye 2: Kimlik, Hafıza ve Duygu
                    {
                        levelNumber: 2,
                        name: "Kimlik, Hafıza ve Duygu (Romanlar)",
                        description: "Hikaye derinleşiyor. Tarihsel hafıza ve kimlik sorgulamaları başlıyor.",
                        books: {
                            create: [
                                { title: "Gün Olur Asra Bedel", author: "Cengiz Aytmatov", neden: "Mankurtlaşmak ve toplumsal hafıza.", sortOrder: 0 },
                                { title: "Osmancık", author: "Tarık Buğra", neden: "Devletin ve liderin kuruluş felsefesi.", sortOrder: 1 },
                                { title: "Üsküp'ten Kosova'ya", author: "Yavuz Bülent Bakiler", neden: "Balkan coğrafyasına ve \"bize\" duygusal bir bakış.", sortOrder: 2 },
                                { title: "Doğu'nun Limanları", author: "Amin Maalouf", neden: "Doğu-Batı arasında sıkışan hayatlar.", sortOrder: 3 },
                                { title: "Gül Yetiştiren Adam", author: "Rasim Özdenören", neden: "Modernizme pasif direniş.", sortOrder: 4 },
                                { title: "Çalıkuşu", author: "Reşat Nuri Güntekin", neden: "İdealizm ve Anadolu gerçeği.", sortOrder: 5 },
                                { title: "Momo", author: "Michael Ende", neden: "Modern zaman hırsızlarına eleştiri.", sortOrder: 6 },
                                { title: "Bin Muhteşem Güneş", author: "Khaled Hosseini", neden: "Afganistan'da iki kadının hayat hikayesi. Savaş ve umut.", sortOrder: 7 },
                                { title: "Doppler", author: "Erlend Loe", neden: "Modern hayattan kaçış ve kendini bulma.", sortOrder: 8 },
                                { title: "Uçurtma Avcısı", author: "Khaled Hosseini", neden: "Dostluk, ihanet ve kefaret hikayesi.", sortOrder: 9 },
                                { title: "Ve Dağlar Yankılandı", author: "Khaled Hosseini", neden: "Aile bağları ve fedakarlık üzerine.", sortOrder: 10 },
                                { title: "Yaşamak", author: "Yu Hua", neden: "Çin'de bir ailenin nesiller boyu hayatta kalma mücadelesi.", sortOrder: 11 }
                            ]
                        }
                    },
                    // Seviye 3: Dil Köprüsü ve Psikoloji
                    {
                        levelNumber: 3,
                        name: "Dil Köprüsü ve Psikoloji (Peyami Safa Eşiği)",
                        description: "Kelime hazinesini geliştirmek (Sözlük kullanmaya başla) ve ruh tahlilleri.",
                        books: {
                            create: [
                                { title: "Fatih-Harbiye", author: "Peyami Safa", neden: "Doğu-Batı çatışmasının ABC'si.", sortOrder: 0 },
                                { title: "Dokuzuncu Hariciye Koğuşu", author: "Peyami Safa", neden: "Hastalık ve ruhun derinlikleri.", sortOrder: 1 },
                                { title: "Yaban", author: "Yakup Kadri Karaosmanoğlu", neden: "Aydın ile halk arasındaki uçurum.", sortOrder: 2 },
                                { title: "Kürk Mantolu Madonna", author: "Sabahattin Ali", neden: "Önyargıları yıkan bir iç dünya anlatısı.", sortOrder: 3 },
                                { title: "Kapıların Ardında", author: "Rasim Özdenören", neden: "Yabancılaşma üzerine öyküler.", sortOrder: 4 },
                                { title: "Türkçenin Sırları", author: "Nihat Sami Banarlı", neden: "Dil şuurunu kazanmak, kelimeleri sevmek.", sortOrder: 5 },
                                { title: "Sözün Doğrusu 1", author: "Yavuz Bülent Bakiler", neden: "Türkçeyi doğru kullanma kılavuzu.", sortOrder: 6 },
                                { title: "Dönüşüm", author: "Franz Kafka", neden: "Yabancılaşma ve modern insanın bunalımı.", sortOrder: 7 },
                                { title: "Gulyabani", author: "Hüseyin Rahmi Gürpınar", neden: "Klasik Türk romanı ve toplum eleştirisi.", sortOrder: 8 },
                                { title: "İçimizdeki Şeytan", author: "Sabahattin Ali", neden: "İnsan ruhunun karanlık köşeleri.", sortOrder: 9 },
                                { title: "Kendine Ait Bir Oda", author: "Virginia Woolf", neden: "Kadın yazarlık ve özgürlük üzerine.", sortOrder: 10 },
                                { title: "Kuyucaklı Yusuf", author: "Sabahattin Ali", neden: "Anadolu'da adalet arayışı ve trajedisi.", sortOrder: 11 }
                            ]
                        }
                    },
                    // Seviye 4: Dava'nın Estetiği ve Şiirsel Duruş
                    {
                        levelNumber: 4,
                        name: "Dava'nın Estetiği ve Şiirsel Duruş",
                        description: "Fikre geçmeden önce \"Tavır\" kazanmak. Şiir ve tiyatro.",
                        books: {
                            create: [
                                { title: "Reis Bey", author: "Necip Fazıl Kısakürek", neden: "Merhamet ve adalet üzerine sarsıcı bir piyes.", sortOrder: 0 },
                                { title: "İdeolocya Örgüsü", author: "Necip Fazıl Kısakürek", neden: "Necip Fazıl'ın düşünce sistemi. Teorik temel.", sortOrder: 1 },
                                { title: "Anneler ve Kudüsler", author: "Nuri Pakdil", neden: "Kudüs bilinci ve \"Klas Duruş\".", sortOrder: 2 },
                                { title: "Yedi Güzel Adam", author: "Cahit Zarifoğlu", neden: "Müslüman şairin bakış açısı.", sortOrder: 3 },
                                { title: "Yağmur", author: "Nurullah Genç", neden: "Peygamber sevgisi - Naat.", sortOrder: 4 },
                                { title: "Bağlanma", author: "Nuri Pakdil", neden: "Yabancılaşmaya karşı yerli düşünceye tutunmak.", sortOrder: 5 },
                                { title: "İnce Memed 1", author: "Yaşar Kemal", neden: "Başkaldırı kültürü.", sortOrder: 6 }
                            ]
                        }
                    },
                    // Seviye 5: Yaşanmışlıklar ve Rehberlik
                    {
                        levelNumber: 5,
                        name: "Yaşanmışlıklar ve Rehberlik (Biyografi)",
                        description: "Gerçek hayatlar üzerinden \"Dava Adamı\"nı tanımak.",
                        books: {
                            create: [
                                { title: "Suyu Arayan Adam", author: "Şevket Süreyya Aydemir", neden: "En kritik otobiyografi. Fikir çilesinin haritası.", sortOrder: 0 },
                                { title: "Gençlerle Başbaşa", author: "Ali Fuad Başgil", neden: "İrade eğitimi ve çalışma disiplini.", sortOrder: 1 },
                                { title: "Atomik Alışkanlıklar", author: "James Clear", neden: "Küçük alışkanlıkların büyük dönüşümleri. İrade eğitiminin modern versiyonu.", sortOrder: 2 },
                                { title: "Savaşçı", author: "Doğan Cüceloğlu", neden: "Güçlü bir karakter inşası.", sortOrder: 3 },
                                { title: "Malcolm X", author: "Alex Haley", neden: "Dönüşüm ve mücadele.", sortOrder: 4 },
                                { title: "Zeytindağı", author: "Falih Rıfkı Atay", neden: "İmparatorluğun çöküşü.", sortOrder: 5 },
                                { title: "O ve Ben", author: "Necip Fazıl Kısakürek", neden: "Manevi arayış ve buluş.", sortOrder: 6 },
                                { title: "Bir Ömür Nasıl Yaşanır?", author: "İlber Ortaylı", neden: "Yaşam deneyimleri ve tavsiyeler.", sortOrder: 7 },
                                { title: "Ferrari'sini Satan Bilge", author: "Robin Sharma", neden: "Kişisel gelişim ve hayatın anlamı.", sortOrder: 8 },
                                { title: "Küçük Ağaç'ın Eğitimi", author: "Forrest Carter", neden: "Doğa ile iç içe yaşam ve bilgelik.", sortOrder: 9 },
                                { title: "Yoldaki Mühendis", author: "Abdullah Galib Bergusi", neden: "Manevi yolculuk ve keşif.", sortOrder: 10 },
                                { title: "Yoldaki Mühendis 2", author: "Abdullah Galib Bergusi", neden: "Manevi yolculuğun devamı.", sortOrder: 11 }
                            ]
                        }
                    },
                    // Seviye 6: Fikre Giriş ve Zihniyet Haritası
                    {
                        levelNumber: 6,
                        name: "Fikre Giriş ve Zihniyet Haritası",
                        description: "Sistematik düşünmeye başlama.",
                        books: {
                            create: [
                                { title: "Medeniyet Tasavvuru", author: "Yusuf Kaplan", neden: "Neyi kaybettik, nasıl buluruz? Yol haritası.", sortOrder: 0 },
                                { title: "Dostluk Üzerine", author: "Fethi Gemuhluoğlu", neden: "İnsana ve eşyaya dost olmak.", sortOrder: 1 },
                                { title: "Beş Şehir", author: "Ahmet Hamdi Tanpınar", neden: "Medeniyetin estetik boyutu.", sortOrder: 2 },
                                { title: "Safsata Kılavuzu", author: "Alev Alatlı", neden: "Mantık hatalarını tespit etme rehberi.", sortOrder: 3 },
                                { title: "Öyle Geçer ki Zaman", author: "Teoman Duralı", neden: "Bir filozofun hayat yolculuğu.", sortOrder: 4 },
                                { title: "Waldo Sen Neden Buradasın?", author: "İsmet Özel", neden: "İsmet Özel'in insani tarafı.", sortOrder: 5 },
                                { title: "Başarı Bedel İster", author: "Nurullah Genç", neden: "Ahlaklı kariyer ve başarı.", sortOrder: 6 }
                            ]
                        }
                    },
                    // Seviye 7: Cemil Meriç Modülü
                    {
                        levelNumber: 7,
                        name: "Cemil Meriç Modülü (Okyanusa Dalış)",
                        description: "Türkiye'nin en büyük düşünürünün mutfağı.",
                        books: {
                            create: [
                                { title: "Jurnal 1. Cilt", author: "Cemil Meriç", neden: "Acıları ve yalnızlığı.", sortOrder: 0 },
                                { title: "Jurnal 2. Cilt", author: "Cemil Meriç", neden: "Fikrin olgunlaşması.", sortOrder: 1 },
                                { title: "Yalnızız", author: "Peyami Safa", neden: "Jurnallerle paralel okunacak ruhsal roman.", sortOrder: 2 },
                                { title: "Bu Ülke", author: "Cemil Meriç", neden: "Zirve eser. Aforizmalar ve analizler.", sortOrder: 3 },
                                { title: "Mağaradakiler", author: "Cemil Meriç", neden: "Aydınların analizi.", sortOrder: 4 },
                                { title: "Umrandan Uygarlığa", author: "Cemil Meriç", neden: "Medeniyet tartışmaları.", sortOrder: 5 }
                            ]
                        }
                    },
                    // Seviye 8: Bilge Kral Aliya Modülü
                    {
                        levelNumber: 8,
                        name: "Bilge Kral Aliya Modülü (Devlet ve Fikir)",
                        description: "Düşüncenin eyleme dönüşmesi.",
                        books: {
                            create: [
                                { title: "Özgürlüğe Kaçış", author: "Aliya İzzetbegoviç", neden: "Hapishane notları.", sortOrder: 0 },
                                { title: "Doğu Batı Arasında İslam", author: "Aliya İzzetbegoviç", neden: "En kapsamlı felsefi eser.", sortOrder: 1 },
                                { title: "İslam Deklarasyonu", author: "Aliya İzzetbegoviç", neden: "Müslüman toplumların manifestosu.", sortOrder: 2 },
                                { title: "Tarihe Tanıklığım", author: "Aliya İzzetbegoviç", neden: "Savaş ve devlet yönetimi.", sortOrder: 3 }
                            ]
                        }
                    },
                    // Seviye 9: İsmet Özel Fırtınası
                    {
                        levelNumber: 9,
                        name: "İsmet Özel Fırtınası (Sert Düşünce)",
                        description: "Zihni sarsmak ve konforu bozmak.",
                        books: {
                            create: [
                                { title: "Erbain", author: "İsmet Özel", neden: "Şiirle düşünmek - Amentü, Evet İsyan.", sortOrder: 0 },
                                { title: "Üç Mesele", author: "İsmet Özel", neden: "Teknik, Medeniyet, Yabancılaşma.", sortOrder: 1 },
                                { title: "Taşları Yemek Yasak", author: "İsmet Özel", neden: "Türkiye analizleri.", sortOrder: 2 },
                                { title: "Zor Zamanda Konuşmak", author: "İsmet Özel", neden: "Entelektüel sorumluluk.", sortOrder: 3 }
                            ]
                        }
                    },
                    // Seviye 10: Diriliş Mimarı Sezai Karakoç
                    {
                        levelNumber: 10,
                        name: "Diriliş Mimarı Sezai Karakoç",
                        description: "Teorik ve metafizik temel.",
                        books: {
                            create: [
                                { title: "Diriliş Neslinin Amentüsü", author: "Sezai Karakoç", neden: "Gençliğin el kitabı.", sortOrder: 0 },
                                { title: "Yitik Cennet", author: "Sezai Karakoç", neden: "Peygamberler tarihi ve medeniyet.", sortOrder: 1 },
                                { title: "İslam'ın Dirilişi", author: "Sezai Karakoç", neden: "Kriz ve çıkış.", sortOrder: 2 },
                                { title: "Ruhun Dirilişi", author: "Sezai Karakoç", neden: "Kültür ve ruh cephesi.", sortOrder: 3 },
                                { title: "Mehmet Akif", author: "Sezai Karakoç", neden: "Akif'i en iyi anlatan eser.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 11: İleri Sistem Analizi ve Eleştiri
                    {
                        levelNumber: 11,
                        name: "İleri Sistem Analizi ve Eleştiri",
                        description: "Dünyayı ve Türkiye'yi kodlarına kadar analiz etmek.",
                        books: {
                            create: [
                                { title: "Bize Yön Veren Metinler", author: "Alev Alatlı", neden: "Batı'nın zihin kodları.", sortOrder: 0 },
                                { title: "Sorun Nedir?", author: "Teoman Duralı", neden: "Küresel sorunların felsefi kökeni.", sortOrder: 1 },
                                { title: "Batılaşma İhaneti", author: "D. Mehmet Doğan", neden: "Yakın tarih eleştirisi.", sortOrder: 2 },
                                { title: "Kelimeler ve Kavramlar", author: "Rasim Özdenören", neden: "Zihni netleştirme.", sortOrder: 3 },
                                { title: "Var Olmak", author: "Nurettin Topçu", neden: "Hareket felsefesi ve ahlak.", sortOrder: 4 },
                                { title: "Hangi Batı", author: "Attilâ İlhan", neden: "Farklı bir perspektiften Batı eleştirisi.", sortOrder: 5 }
                            ]
                        }
                    },
                    // Seviye 12: Zirve (Klasikler ve Büyük Sentez)
                    {
                        levelNumber: 12,
                        name: "Zirve (Klasikler ve Büyük Sentez)",
                        description: "Bin yıllık bilgelik ve kapanış.",
                        books: {
                            create: [
                                { title: "Yarınki Türkiye", author: "Nurettin Topçu", neden: "İdeal toplum tezi.", sortOrder: 0 },
                                { title: "Biati", author: "Nuri Pakdil", neden: "Duruş odaklı denemeler.", sortOrder: 1 },
                                { title: "Siyasetname", author: "Nizamülmülk", neden: "Devlet yönetimi.", sortOrder: 2 },
                                { title: "Mukaddime (Seçkiler)", author: "İbn Haldun", neden: "Sosyolojinin temeli.", sortOrder: 3 },
                                { title: "Kutadgu Bilig (Günümüz Türkçesi)", author: "Yusuf Has Hacib", neden: "Mutluluk bilgisi.", sortOrder: 4 },
                                { title: "Bostan ve Gülistan", author: "Sadi Şirazi", neden: "Doğu hikmetleri.", sortOrder: 5 },
                                { title: "Devlet", author: "Platon", neden: "Batı düşüncesinin kökü.", sortOrder: 6 },
                                { title: "Ya Tahammül Ya Sefer", author: "Mustafa Kutlu", neden: "Final hikayesi - Dava yükü.", sortOrder: 7 },
                                { title: "Kendi Gök Kubbemiz", author: "Yahya Kemal Beyatlı", neden: "Huzurlu bir şiirsel kapanış.", sortOrder: 8 },
                                { title: "Modern Dünyanın Bunalımı", author: "René Guénon", neden: "Gelenekselci ekolün zirvesi.", sortOrder: 9 }
                            ]
                        }
                    }
                ]
            }
        }
    })
    console.log(`Created: ${dusunceDava.name}`)

    // ==========================================
    // 3. TARİH VE MEDENİYET OKUMALARI
    // ==========================================
    const tarihMedeniyet = await prisma.readingList.create({
        data: {
            slug: "tarih-medeniyet",
            name: "🏛️ Tarih ve Medeniyet Okumaları",
            description: "Romanlarla tarihi sevdirecek, popüler tarihçilerle merak uyandıracak ve sonunda akademik derinliği olan eserleri \"su içer gibi\" okumanı sağlayacak kapsamlı bir yol haritası. 10 seviye, 50 kitap.",
            coverUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
            sortOrder: 2,
            levels: {
                create: [
                    // Seviye 1: Roman Kapısı
                    {
                        levelNumber: 1,
                        name: "Roman Kapısı (Tarihi Hissetmek)",
                        description: "Tarih dersi yok, macera var. Dönemlerin ruhunu, kokusunu ve atmosferini hissetmek için en iyi başlangıç tarihi romanlardır.",
                        books: {
                            create: [
                                { title: "Şu Çılgın Türkler", author: "Turgut Özakman", neden: "Milli Mücadele'yi belgesel tadında ama roman akıcılığında anlatan, tüyleri diken diken eden bir modern klasik.", sortOrder: 0 },
                                { title: "Devlet Ana", author: "Kemal Tahir", neden: "Osmanlı'nın kuruluşunu, Anadolu insanının yapısını ve söğüt ağacının gölgesini anlatan dev bir eser.", sortOrder: 1 },
                                { title: "Semerkant", author: "Amin Maalouf", neden: "Orta Doğu, Selçuklular, Ömer Hayyam ve Hasan Sabbah... Doğu'nun gizemli tarihine büyülü bir giriş.", sortOrder: 2 },
                                { title: "Bozkurtların Ölümü", author: "Hüseyin Nihal Atsız", neden: "Orta Asya Türk tarihi, Göktürkler ve Kürşad destanı. Mitoloji ile tarihin iç içe geçtiği heyecanlı bir roman.", sortOrder: 3 },
                                { title: "Osmancık", author: "Tarık Buğra", neden: "Osman Gazi'nin bir \"alp\"ten bir \"devlet adamı\"na dönüşümünün psikolojik ve tarihi romanı.", sortOrder: 4 },
                                { title: "Puslu Kıtalar Atlası", author: "İhsan Oktay Anar", neden: "Tarihi atmosferi ve Osmanlı İstanbul'unun gizemini hissettiren büyülü gerçekçi bir roman.", sortOrder: 5 },
                                { title: "Ben Ayşe", author: "Fikret Eroğlu", neden: "Milli mücadele ve yakın tarih romanı. Anadolu kadınının gözünden kurtuluş.", sortOrder: 6 }
                            ]
                        }
                    },
                    // Seviye 2: Popüler Tarih ve Merak
                    {
                        levelNumber: 2,
                        name: "Popüler Tarih ve Merak (Soru-Cevap)",
                        description: "Romanlardan çıktık. Şimdi sıkıcı olmayan, sohbet havasında yazılmış, \"tarih magazini\" tadında ama öğretici kitaplar.",
                        books: {
                            create: [
                                { title: "Tarihin Arka Odası", author: "Murat Bardakçı", neden: "Tarihin bilinmeyen, ilginç, tuhaf ve magazinel yönleri. Resmi tarihin asık suratını dağıtır.", sortOrder: 0 },
                                { title: "Sorularla Osmanlı İmparatorluğu", author: "Erhan Afyoncu", neden: "Kronolojik sıkıcılık yok. \"Padişahlar içki içer miydi?\", \"Harem nasıldı?\" gibi merak edilen sorulara net cevaplar.", sortOrder: 1 },
                                { title: "Sultanın Casusları", author: "Emrah Safa Gürkan", neden: "Akademik bilgiyi inanılmaz eğlenceli ve mizahi bir dille anlatır. 16. yüzyıl istihbarat savaşları.", sortOrder: 2 },
                                { title: "Türklerin Tarihi (1. Cilt)", author: "İlber Ortaylı", neden: "Orta Asya'dan Anadolu'ya göçü İlber Hoca'nın sohbetiyle dinler gibi okursun.", sortOrder: 3 },
                                { title: "Yavuz", author: "Feridun Andaç", neden: "Yavuz Sultan Selim dönemi ve Orta Doğu siyasetinin şekillenişi üzerine roman tadında anlatılar.", sortOrder: 4 },
                                { title: "Türklerin Serüveni", author: "Cansu Canan Özgen", neden: "Popüler ve görsel tarih anlatımı. Orta Asya'dan Anadolu'ya.", sortOrder: 5 },
                                { title: "İnsanlığın Medeniyet Destanı", author: "Cansu Canan Özgen", neden: "Dünya medeniyetlerinin hikayesi, akıcı ve öğretici.", sortOrder: 6 },
                                { title: "Türklerin Büyükleri", author: "Cansu Canan Özgen", neden: "Türk tarihinin önemli isimleri, biyografik anlatım.", sortOrder: 7 }
                            ]
                        }
                    },
                    // Seviye 3: Biyografilerle Dönemleri Anlamak
                    {
                        levelNumber: 3,
                        name: "Biyografilerle Dönemleri Anlamak",
                        description: "Tarihi olaylar değil, o olayları yapan insanlar. Liderlerin hayatı üzerinden dönemi okumak.",
                        books: {
                            create: [
                                { title: "Çankaya", author: "Falih Rıfkı Atay", neden: "Atatürk'ü ve Cumhuriyet'in kuruluşunu, sofranın başköşesindeki bir şahidin gözünden, mükemmel bir Türkçeyle okumak.", sortOrder: 0 },
                                { title: "Fatih Sultan Mehemmed Han", author: "Halil İnalcık", neden: "İnalcık Hoca'nın en okunabilir, sadeleştirilmiş Fatih portresi. İstanbul'un fethi ve imparatorluk vizyonu.", sortOrder: 1 },
                                { title: "Kösem Sultan", author: "Reşat Ekrem Koçu", neden: "Kadınlar Saltanatı dönemi. Saray entrikaları ve Osmanlı'nın duraklaması üzerine \"roman gibi\" bir tarih.", sortOrder: 2 },
                                { title: "Suyu Arayan Adam", author: "Şevket Süreyya Aydemir", neden: "Enver Paşa'dan Cumhuriyet öğretmenine... Osmanlı'nın çöküşü ve Cumhuriyet'in kuruluşu bir insan ömründe nasıl yaşandı?", sortOrder: 3 },
                                { title: "Timur", author: "Jean-Paul Roux", neden: "Türk-Moğol dünyasının bu büyük ve acımasız liderini Batılı ama objektif bir tarihçiden okumak.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 4: Orta Doğu'ya Giriş
                    {
                        levelNumber: 4,
                        name: "Orta Doğu'ya Giriş",
                        description: "Osmanlı ve Türk tarihini anlamak için Orta Doğu'yu bilmek şarttır. Bu seviye o coğrafyanın kodlarını verir.",
                        books: {
                            create: [
                                { title: "Arapların Gözünden Haçlı Seferleri", author: "Amin Maalouf", neden: "Tarihi hep Batı'dan okuduk. Peki işgale uğrayanlar ne düşündü? Orta Doğu'nun bugünkü öfkesinin kökleri.", sortOrder: 0 },
                                { title: "Kısa Orta Doğu Tarihi", author: "Recep Boztemur", neden: "Karmaşık Orta Doğu tarihini özetleyen, harita çizen bir rehber.", sortOrder: 1 },
                                { title: "Petrol Fırtınası", author: "Raif Karadağ", neden: "Bölgenin kaderini değiştiren petrolün ve emperyalizmin tarihi.", sortOrder: 2 },
                                { title: "Kudüs: Bir Şehrin Biyografisi", author: "Simon Sebag Montefiore", neden: "Kudüs'ü anlamadan Orta Doğu anlaşılmaz. Çok sürükleyici, çok katmanlı bir tarih anlatısı.", sortOrder: 3 },
                                { title: "Alamut", author: "Vladimir Bartol", neden: "Hasan Sabbah ve fedaileri. Orta Doğu'da \"terör\" ve \"suikast\" geleneğinin tarihi kökleri - Roman kurgusunda.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 5: Osmanlı Klasik Çağı
                    {
                        levelNumber: 5,
                        name: "Osmanlı Klasik Çağı (Yükseliş ve Zirve)",
                        description: "Artık biraz daha ciddi tarihçilere geçiyoruz. Osmanlı'nın kurumsallaşması ve dünyaya hükmetmesi.",
                        books: {
                            create: [
                                { title: "Devlet-i Aliyye (1. Cilt)", author: "Halil İnalcık", neden: "İnalcık Hoca'nın \"herkes okusun diye\" yazdığı başyapıt serisinin ilki. Klasik dönem.", sortOrder: 0 },
                                { title: "Osmanlıyı Yeniden Keşfetmek", author: "İlber Ortaylı", neden: "Osmanlı kurumları, aile yapısı ve yaşam tarzı üzerine ufuk açıcı makaleler.", sortOrder: 1 },
                                { title: "Kanuni ve Çağı", author: "Feridun Emecen", neden: "Muhteşem Yüzyıl'ın gerçeği. Dünyaya nizam veren bir imparatorluğun zirvesi.", sortOrder: 2 },
                                { title: "Piri Reis ve Türk Denizciliği", author: "İdris Bostan", neden: "Osmanlı'nın Akdeniz hakimiyeti.", sortOrder: 3 },
                                { title: "Osmanlı Gerileme Dönemi", author: "Nicolae Jorga", neden: "Dışarıdan bir gözle Osmanlı'nın nasıl algılandığı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 6: Geç Dönem ve Hüzün
                    {
                        levelNumber: 6,
                        name: "Geç Dönem ve Hüzün (19. Yüzyıl)",
                        description: "\"İmparatorluğun En Uzun Yüzyılı\". Modernleşme, toprak kayıpları ve Cumhuriyet'in doğum sancıları.",
                        books: {
                            create: [
                                { title: "İmparatorluğun En Uzun Yüzyılı", author: "İlber Ortaylı", neden: "Tanzimat, modernleşme ve Osmanlı'nın kabuk değiştirmesi. Mutlaka okunmalı.", sortOrder: 0 },
                                { title: "Son İmparator Abdülhamid", author: "Vahdettin Engin", neden: "Çok tartışılan Abdülhamid dönemine belgelerle, sakin ve objektif bir bakış.", sortOrder: 1 },
                                { title: "İttihat ve Terakki", author: "Feroz Ahmad", neden: "İmparatorluğu savaşa sokan, Cumhuriyeti kuran kadroyu anlamak. Batılı ama içeriden bir bakış.", sortOrder: 2 },
                                { title: "Zeytindağı", author: "Falih Rıfkı Atay", neden: "Ortadoğu'nun elimizden kayıp gidişinin ağıtı. Suriye, Filistin ve çöl.", sortOrder: 3 },
                                { title: "Milli Mücadele Başlarken", author: "Tayyib Gökbilgin", neden: "Kurtuluş Savaşı'nın siyasi ve askeri altyapısı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 7: Modern Türkiye ve Yakın Tarih
                    {
                        levelNumber: 7,
                        name: "Modern Türkiye ve Yakın Tarih",
                        description: "Cumhuriyet dönemi, demokrasi denemeleri ve darbeler tarihi.",
                        books: {
                            create: [
                                { title: "Modern Türkiye'nin Doğuşu", author: "Bernard Lewis", neden: "Türkiye'nin modernleşme serüvenini en iyi analiz eden klasiklerden biri.", sortOrder: 0 },
                                { title: "Tek Adam (1. Cilt)", author: "Şevket Süreyya Aydemir", neden: "Atatürk biyografisinin zirvesi. Hem insan hem lider olarak Atatürk.", sortOrder: 1 },
                                { title: "Demokrasinin İlk Yılları (1947-1951)", author: "Taha Akyol", neden: "Çok partili hayata geçiş sancıları. Siyasi tarih okuması.", sortOrder: 2 },
                                { title: "Türkiye'nin Yakın Tarihi", author: "İlber Ortaylı", neden: "Yakın dönemin olaylarına eleştirel bir bakış.", sortOrder: 3 },
                                { title: "Gölgedekiler", author: "Murat Bardakçı", neden: "Cumhuriyet kurulurken dışarıda kalan hanedan üyeleri ve sürgünlerin hüzünlü tarihi.", sortOrder: 4 },
                                { title: "Darbeye Geçit Yok", author: "Abdulkadir Selvi", neden: "15 Temmuz ve yakın siyasi tarih. Güncel bir tanıklık.", sortOrder: 5 }
                            ]
                        }
                    },
                    // Seviye 8: Derinlemesine Orta Doğu
                    {
                        levelNumber: 8,
                        name: "Derinlemesine Orta Doğu (Büyük Oyun)",
                        description: "Bugünkü Orta Doğu haritası nasıl çizildi?",
                        books: {
                            create: [
                                { title: "Barışa Son Veren Barış", author: "David Fromkin", neden: "Modern Orta Doğu'nun I. Dünya Savaşı'ndan sonra nasıl, kimler tarafından cetvelle çizildiğini anlatan başyapıt. Biraz kalındır ama efsanedir.", sortOrder: 0 },
                                { title: "Ortadoğu", author: "Bernard Lewis", neden: "Bölgenin binlerce yıllık tarihini dini, sosyal ve kültürel açıdan özetleyen dev eser.", sortOrder: 1 },
                                { title: "Çöl Kraliçesi (Gertrude Bell)", author: "Janet Wallach", neden: "İngiliz ajanlarının bölgeyi nasıl şekillendirdiğine dair biyografik bir okuma.", sortOrder: 2 },
                                { title: "Osmanlı Barışı", author: "İlber Ortaylı", neden: "Osmanlı'nın Orta Doğu'yu nasıl yönettiğini, bugünkü kaosun neden Osmanlı gidince başladığını anlatır.", sortOrder: 3 },
                                { title: "Petrol, Para ve Güç", author: "Daniel Yergin", neden: "Enerji savaşları tarihi.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 9: Türk Kültürü ve Teşkilat Tarihi
                    {
                        levelNumber: 9,
                        name: "Türk Kültürü ve Teşkilat Tarihi",
                        description: "Sadece olaylar değil; devlet nedir, töre nedir, kültür nedir? Zihniyet tarihi.",
                        books: {
                            create: [
                                { title: "Türk Cihan Hakimiyeti Mefkuresi", author: "Osman Turan", neden: "Türklerin devlete ve dünyaya bakış açısı, \"Kızıl Elma\" felsefesi.", sortOrder: 0 },
                                { title: "Türk Kültürü", author: "Bahaeddin Ögel", neden: "Orta Asya'dan gelen yaşam tarzımız, geleneklerimiz. Kültür tarihi.", sortOrder: 1 },
                                { title: "Bunu Herkes Bilir", author: "Emrah Safa Gürkan", neden: "Tarihteki yanlış bilinen efsaneleri yıkan, metodoloji öğreten bir kitap.", sortOrder: 2 },
                                { title: "Osmanlı'da Devlet, Hukuk, Adalet", author: "Halil İnalcık", neden: "Osmanlı sisteminin işleyiş mantığı. Ağır ama besleyici.", sortOrder: 3 },
                                { title: "Oğuzlar", author: "Faruk Sümer", neden: "Anadolu'daki Türk boylarının kökeni. \"Benim köküm nereye dayanıyor?\" sorusunun cevabı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 10: Büyük Resim ve Metodoloji
                    {
                        levelNumber: 10,
                        name: "Büyük Resim ve Metodoloji",
                        description: "Artık bir tarihçi gibi olaylara yukarıdan bakabilirsin.",
                        books: {
                            create: [
                                { title: "Nutuk", author: "Mustafa Kemal Atatürk", neden: "Birinci elden kaynak. Cumhuriyet'in kuruluş belgesi. Sadeleştirilmiş değil, açıklamalı tam metin okunmalı.", sortOrder: 0 },
                                { title: "Tarih Notları", author: "Bernard Lewis", neden: "Tarih nasıl yazılır, nasıl okunur? Bir tarihçinin laboratuvarı.", sortOrder: 1 },
                                { title: "Medeniyetler Çatışması", author: "Samuel Huntington", neden: "Tarihi bitirip geleceği okumak için. Doğu-Batı geriliminin modern teorisi.", sortOrder: 2 },
                                { title: "Devlet-i Aliyye (Diğer Ciltler)", author: "Halil İnalcık", neden: "Seriyi tamamlayarak Osmanlı tarihini akademik düzeyde kapatmak.", sortOrder: 3 },
                                { title: "Türk Tarih Tezi", author: "Afet İnan", neden: "Erken Cumhuriyet döneminin tarih algısını anlamak için.", sortOrder: 4 }
                            ]
                        }
                    }
                ]
            }
        }
    })
    console.log(`Created: ${tarihMedeniyet.name}`)

    // ==========================================
    // 4. İLAHİYAT VE MEDENİYET OKUMALARI
    // ==========================================
    const ilahiyatMedeniyet = await prisma.readingList.create({
        data: {
            slug: "ilahiyat-medeniyet",
            name: "📿 Din ve İslam Okumaları",
            description: "İslam'ı ve dinler tarihini önce \"hikaye ve insan\" üzerinden anlatan, sonra \"tarihsel sürece\" giren, en sonunda ise \"sistem ve ekolleri\" (Mezhep, Fıkıh vb.) öğreten kapsamlı bir müfredat. 10 seviye, 50 kitap.",
            coverUrl: "https://images.unsplash.com/photo-1585036156171-384164a8c675?w=800&q=80",
            sortOrder: 3,
            levels: {
                create: [
                    // Seviye 1: Siyer ve Asr-ı Saadet
                    {
                        levelNumber: 1,
                        name: "Siyer ve Asr-ı Saadet (Roman Tadında)",
                        description: "Teorik bilgi yok. Peygamberin hayatı ve arkadaşlarının yaşantısı. Akıcı, edebi ve duygusal bir giriş.",
                        books: {
                            create: [
                                { title: "Hz. Muhammed'in Hayatı", author: "Martin Lings", neden: "Batılı bir Müslüman'ın yazdığı, dünya çapında \"en iyi siyer\" kabul edilen, roman akıcılığında muazzam bir eser.", sortOrder: 0 },
                                { title: "Çöl Deniz (Hz. Hatice)", author: "Sibel Eraslan", neden: "İslam'ın doğuşunu bir kadının, Peygamber eşinin gözünden anlatan çok naif bir roman.", sortOrder: 1 },
                                { title: "Yaralı Kalplerin Baharı (Sahabe Hayatları)", author: "Salih Suruç", neden: "Sahabeleri kuru biyografi gibi değil, yaşadıkları olaylarla hikaye eden popüler bir eser.", sortOrder: 2 },
                                { title: "Hz. Ali", author: "Ahmet Lütfi Kazancı", neden: "Dört halife döneminin en çalkantılı zamanlarını ve Hz. Ali'nin şahsiyetini anlatan, roman tadında tarih.", sortOrder: 3 },
                                { title: "Aşkın Gözyaşları (Tebrizli Şems)", author: "Sinan Yağmur", neden: "Tasavvufun \"aşk\" boyutuna popüler bir giriş. Çok satan, çok okunan bir ısınma kitabı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 2: Dinler Tarihi
                    {
                        levelNumber: 2,
                        name: "Dinler Tarihi (Büyük Resim)",
                        description: "İslam'ı anlamak için önceki dinleri (Yahudilik, Hristiyanlık) bilmek gerekir. Karşılaştırmalı okuma.",
                        books: {
                            create: [
                                { title: "Tanrı'nın Tarihi", author: "Karen Armstrong", neden: "Üç büyük dinin nasıl ortaya çıktığını, Tanrı algısının nasıl değiştiğini anlatan, dünyaca ünlü bir popüler tarih kitabı.", sortOrder: 0 },
                                { title: "Dinler Tarihi (Giriş)", author: "Ekrem Sarıkçıoğlu", neden: "Budizm'den Hristiyanlığa kadar dinler hakkında özet, ansiklopedik olmayan genel kültür bilgisi.", sortOrder: 1 },
                                { title: "Hristiyanlık ve İslam", author: "Müfit Selim Saruhan", neden: "İki din arasındaki temel farklar ve benzerlikler. İsa peygamber algısı vs.", sortOrder: 2 },
                                { title: "Kudüs Ey Kudüs", author: "Dominique Lapierre", neden: "Kudüs'ün dinler için neden bu kadar önemli olduğunu anlatan belgesel roman.", sortOrder: 3 },
                                { title: "Mitoloji ve Din", author: "Mircea Eliade", neden: "Biraz daha felsefi. İnsan neden inanır? Kutsal nedir? Dinin kökenine dair bir zihin egzersizi.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 3: İslam Tarihi 1
                    {
                        levelNumber: 3,
                        name: "İslam Tarihi 1 (Dört Halife ve Emeviler)",
                        description: "Peygamberden sonra ne oldu? Siyasi kavgalar, fetihler ve devletleşme.",
                        books: {
                            create: [
                                { title: "Dört Halife Dönemi", author: "Ahmet Cevdet Paşa", neden: "İslam devletinin temellerinin atıldığı, adalet ve yönetim anlayışının şekillendiği dönem.", sortOrder: 0 },
                                { title: "Kerbela", author: "Ahmet Turgut", neden: "Tarihin en acı olayını, mezhep ayrılıklarının kökünü roman diliyle anlatan, ağlatan bir kitap.", sortOrder: 1 },
                                { title: "Siyasi ve Dini Mücadeleler Tarihi", author: "Hasan Onat", neden: "Emeviler döneminde Arap milliyetçiliği ve buna karşı gelişen tepkiler. Ayrışmaların kökeni.", sortOrder: 2 },
                                { title: "İslam Tarihi (Emeviler-Abbasiler)", author: "Philip Hitti", neden: "Batılı bir gözle İslam imparatorluğunun yükselişini anlatan klasik bir özet.", sortOrder: 3 },
                                { title: "Endülüs Tarihi", author: "Ziya Paşa", neden: "İslam'ın Avrupa'daki 800 yıllık macerası, bilim ve sanat zirvesi.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 4: Mezhepler Tarihi
                    {
                        levelNumber: 4,
                        name: "Mezhepler Tarihi (Ayrışmaların Mantığı)",
                        description: "Sünni, Şii, Selefi ne demek? Neden ayrıldılar? Teoloji ve Siyaset.",
                        books: {
                            create: [
                                { title: "Mezhepler Tarihi", author: "Muhammed Ebu Zehra", neden: "Bu alanın en anlaşılır, en temel kitabıdır. Hangi mezhep ne diyor, neden çıktı? Başucu eseri.", sortOrder: 0 },
                                { title: "Şiilik Kısa Tarihi", author: "Halm Heinz", neden: "Şiilik nedir, İmamet nedir? Sünnilikten farkı nedir? Objektif bir bakış.", sortOrder: 1 },
                                { title: "Tarihsel Süreçte Mutezile", author: "Sönmez Kutlu", neden: "İslam'ın \"akılcı\" ekolü. Neden kaybettiler? Akıl-Vahiy tartışması.", sortOrder: 2 },
                                { title: "Selefilik", author: "Mehmet Ali Büyükkara", neden: "Günümüz dünyasını anlamak için çok kritik. Selefilik nedir, radikalizm nereden doğar?", sortOrder: 3 },
                                { title: "İslam Düşünce Tarihi", author: "Hilmi Ziya Ülken", neden: "Fikirlerin ve ekollerin genel serüveni.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 5: Kur'an ve Hadis
                    {
                        levelNumber: 5,
                        name: "Kur'an ve Hadis (Kaynakları Tanımak)",
                        description: "Ayet ve hadis okumaktan ziyade; \"Kur'an nasıl bir kitap?\", \"Hadisler nasıl toplandı?\" (Usul bilgisi).",
                        books: {
                            create: [
                                { title: "Kur'an-ı Kerim'in Tarihi", author: "Ömer Rıza Doğrul", neden: "Vahiy nasıl geldi, nasıl kitap haline getirildi?", sortOrder: 0 },
                                { title: "Kur'an Nedir?", author: "Mustafa İslamoğlu", neden: "Kur'an'ın temel kavramları ve mesajı üzerine bir giriş.", sortOrder: 1 },
                                { title: "Hadisleri Anlama Metodolojisi", author: "Mehmet Görmez", neden: "Hadis nedir? Uydurma hadis nasıl anlaşılır? Akılla hadis ilişkisi.", sortOrder: 2 },
                                { title: "Sünneti Anlamak", author: "Yaşar Kandemir", neden: "Peygamberin örnekliği günümüze nasıl taşınır?", sortOrder: 3 },
                                { title: "Büyük Tefsir Tarihi (Giriş Bölümü)", author: "Ömer Nasuhi Bilmen", neden: "Tefsir nedir? Kur'an nasıl yorumlanır?", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 6: Fıkıh ve Hukuk
                    {
                        levelNumber: 6,
                        name: "Fıkıh ve Hukuk (Sistemi Anlamak)",
                        description: "\"Abdest nasıl alınır?\"dan ziyade, \"İslam Hukuku nasıl çalışır? Kurallar nasıl türetilir?\"",
                        books: {
                            create: [
                                { title: "İslam Hukuk Tarihi", author: "Hayreddin Karaman", neden: "Fıkhın doğuşu, mezheplerin hukuk sistemleri. Hukukçu olmayanlar için en anlaşılır giriş.", sortOrder: 0 },
                                { title: "Ebu Hanife", author: "Muhammed Ebu Zehra", neden: "En büyük hukukçunun hayatı ve hukuk mantığı. Fıkhın babasını tanımak.", sortOrder: 1 },
                                { title: "İslam Hukukuna Giriş", author: "Abdülkadir Şener", neden: "Temel kavramlar. Helal, haram, farz mantığı nedir?", sortOrder: 2 },
                                { title: "Mecelle (Kavâid-i Külliye)", author: "Ahmet Cevdet Paşa", neden: "Medeni kanunun girişindeki Genel Kaideler bölümü. Hukuk mantığı dersi gibidir.", sortOrder: 3 },
                                { title: "Güncel Fıkıh Problemleri", author: "Hayreddin Karaman", neden: "Organ nakli, borsa, faiz gibi modern konulara fıkhın bakışı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 7: Tasavvuf ve İrfan
                    {
                        levelNumber: 7,
                        name: "Tasavvuf ve İrfan (Kalbin Yolu)",
                        description: "Dinin manevi boyutu, tarikatların tarihi ve felsefesi.",
                        books: {
                            create: [
                                { title: "İslam'ın Mistik Boyutları", author: "Annemarie Schimmel", neden: "Tasavvufu dışarıdan bir gözle, inanılmaz bir derinlikle anlatan dünya çapında bir eser.", sortOrder: 0 },
                                { title: "Kuşların Dili (Mantıku't-Tayr)", author: "Feridüddin Attar", neden: "Tasavvufun 7 vadisini anlatan sembolik bir şaheser. Roman gibi okunur.", sortOrder: 1 },
                                { title: "Mesnevi'den Seçmeler", author: "Mevlana", neden: "Tamamını okumak zordur, iyi bir şerhli seçki ile başlanmalı.", sortOrder: 2 },
                                { title: "Kimya-yı Saadet", author: "İmam Gazali", neden: "İhyâ'nın özeti gibidir. Kalp hastalıkları, ahlak ve maneviyat rehberi.", sortOrder: 3 },
                                { title: "Türklerin İslamlaşma Serüveni", author: "Fuat Köprülü", neden: "Türkler nasıl Müslüman oldu? Yesevilik ve Anadolu dervişleri.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 8: İslam Felsefesi ve Düşüncesi
                    {
                        levelNumber: 8,
                        name: "İslam Felsefesi ve Düşüncesi",
                        description: "Din ile Felsefenin ilişkisi. Farabi, İbn Sina, Gazali tartışmaları.",
                        books: {
                            create: [
                                { title: "El-Munkız (Dalaletten Kurtuluş)", author: "İmam Gazali", neden: "Felsefe ile hesaplaşma ve hakikati arama yolculuğu. Otobiyografik.", sortOrder: 0 },
                                { title: "Hayy Bin Yakzan", author: "İbn Tufeyl", neden: "Issız bir adada büyüyen bir çocuğun akıl yoluyla Allah'ı bulması. İlk felsefi roman.", sortOrder: 1 },
                                { title: "İslam Felsefesi Tarihi", author: "Macit Fahri", neden: "Filozoflar geçidi. Kim ne dedi?", sortOrder: 2 },
                                { title: "Tehafüt'ül Felasife Hakkında Okumalar", author: "İmam Gazali", neden: "Gazali'nin felsefeye eleştirisini anlamak için analiz kitapları.", sortOrder: 3 },
                                { title: "Üç Müceddid", author: "Necip Fazıl Kısakürek", neden: "İmam Rabbani, Gazali ve Halid-i Bağdadi üzerine portreler.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 9: Modern Dönem ve Sorunlar
                    {
                        levelNumber: 9,
                        name: "Modern Dönem ve Sorunlar",
                        description: "İslam dünyasının son 200 yılı, modernizmle imtihanı.",
                        books: {
                            create: [
                                { title: "İslam'da Yenilik Düşüncesi", author: "Fazlur Rahman", neden: "Modernist İslam düşüncesini anlamak için temel ama biraz ağır bir eser.", sortOrder: 0 },
                                { title: "İslamın Bugünü", author: "Edward Said", neden: "Batı medyasında İslam algısı üzerine eleştirel bir medya okuması.", sortOrder: 1 },
                                { title: "İslam Manifestosu", author: "Aliya İzzetbegoviç", neden: "Müslümanların modern dünyadaki yeri ve duruşu.", sortOrder: 2 },
                                { title: "Din ve Laiklik", author: "Ali Bulaç", neden: "Türkiye özelinde din-devlet ilişkileri tartışmaları.", sortOrder: 3 },
                                { title: "Sünnet Olmadan Ümmet Olmaz", author: "Mehmet Görmez", neden: "Güncel hadis ve sünnet tartışmalarına cevaplar.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 10: Klasikler ve Başvuru Eserleri
                    {
                        levelNumber: 10,
                        name: "Klasikler ve Başvuru Eserleri",
                        description: "Kütüphanende durması gereken, arada açıp bakacağın temel kaynaklar.",
                        books: {
                            create: [
                                { title: "Riyazü's Salihin", author: "İmam Nevevi", neden: "En temel hadis kitabı. Ahlak ve günlük yaşam hadisleri. Her evde olmalı.", sortOrder: 0 },
                                { title: "İlmihal (2 Cilt)", author: "Diyanet Vakfı", neden: "Fıkıh kuralları için en güvenilir, en modern dilli başvuru kaynağı.", sortOrder: 1 },
                                { title: "Hak Dini Kur'an Dili (Tefsir)", author: "Elmalılı Hamdi Yazır", neden: "Fatiha ve kısa surelerin tefsiri mutlaka okunmalı.", sortOrder: 2 },
                                { title: "Şifa-i Şerif", author: "Kadı İyaz", neden: "Peygamber sevgisi ve ona saygı üzerine yazılmış klasik bir eser.", sortOrder: 3 },
                                { title: "Veda Hutbesi", author: "Hz. Muhammed", neden: "Peygamberin son mesajı. İnsan hakları evrensel beyannamesi niteliğinde, tekrar tekrar okunmalı.", sortOrder: 4 },
                                { title: "Sabredenler ve Şükredenler", author: "İbn Kayyim el-Cevziyye", neden: "Sabır ve şükür üzerine klasik bir maneviyat eseri.", sortOrder: 5 },
                                { title: "Namaz Çağrısı", author: "Ramazan Kayan", neden: "İbadet bilinci ve namazın anlamı üzerine.", sortOrder: 6 },
                                { title: "İslam'ın Vadettikleri", author: "Roger Garaudy", neden: "Batılı bir düşünürün İslam'a bakışı. Medeniyet perspektifi.", sortOrder: 7 }
                            ]
                        }
                    }
                ]
            }
        }
    })
    console.log(`Created: ${ilahiyatMedeniyet.name}`)

    // ==========================================
    // 5. İSTİHBARAT, STRATEJİ VE İNSAN ANALİZİ
    // ==========================================
    const istihbaratStrateji = await prisma.readingList.create({
        data: {
            slug: "istihbarat-strateji",
            name: "🎯 İstihbarat ve Strateji Okumaları",
            description: "Sadece ajanlık değil; insan psikolojisini okuma, yalanı yakalama, strateji kurma ve devletlerin güvenlik mimarisini anlama. 10 seviye, 50 kitap.",
            coverUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
            sortOrder: 4,
            levels: {
                create: [
                    // Seviye 1: İtiraflar ve Gerçek Yüzler
                    {
                        levelNumber: 1,
                        name: "İtiraflar ve Gerçek Yüzler (Isınma)",
                        description: "Dünyanın nasıl yönetildiğine dair sarsıcı, akıcı ve popüler kitaplar.",
                        books: {
                            create: [
                                { title: "Bir Ekonomik Tetikçinin İtirafları", author: "John Perkins", neden: "Küresel sömürünün finansal istihbarat ayağı.", sortOrder: 0 },
                                { title: "Sultanın Casusları", author: "Emrah Safa Gürkan", neden: "Osmanlı casusluk ağları. Eğlenceli ve öğretici.", sortOrder: 1 },
                                { title: "Köstebek", author: "John le Carré", neden: "İstihbarat dünyasının \"bürokratik\" ve gerçekçi yüzü.", sortOrder: 2 },
                                { title: "Teşkilat-ı Mahsusa", author: "Abdullah Muradoğlu", neden: "Türk istihbaratının kökleri ve fedai geleneği.", sortOrder: 3 },
                                { title: "Araf'tan Kurtuluş", author: "Cengiz Abdullayev", neden: "Eski KGB ajanının yazdığı, Drongo serisinden bir casusluk romanı.", sortOrder: 4 },
                                { title: "İstihbarat Savaşları", author: "Hüseyin Aziz Akyürek", neden: "İstihbarat dünyasının perde arkası ve gerçek operasyonlar.", sortOrder: 5 },
                                { title: "Suç Ortakları", author: "Agatha Christie", neden: "Dedektiflik ve zeka oyunlarına klasik bir giriş.", sortOrder: 6 },
                                { title: "Leyleklerin Uçuşu", author: "J.C. Grangé", neden: "Kurgusal suç analizi ve gerilim.", sortOrder: 7 },
                                { title: "Sakkara'nın Kumları", author: "Glenn Meade", neden: "Soğuk Savaş dönemi casusluk romanı.", sortOrder: 8 }
                            ]
                        }
                    },
                    // Seviye 2: Suç ve Kriminal Analiz
                    {
                        levelNumber: 2,
                        name: "Suç ve Kriminal Analiz (Adli Bilimler)",
                        description: "Bir dedektif gibi düşünmek. Kanıtlar ne söyler?",
                        books: {
                            create: [
                                { title: "Kusursuz Cinayet Yoktur", author: "Sevil Atasoy", neden: "Türkiye'nin en iyi adli tıpçısından kanıt okuma dersleri.", sortOrder: 0 },
                                { title: "Karanlığa Yolculuk", author: "Sevil Atasoy", neden: "Gerçek suç öyküleri ve profil çıkarma.", sortOrder: 1 },
                                { title: "Sherlock Holmes: Akıl Oyunlarının Gölgesinde", author: "Arthur Conan Doyle", neden: "Tümdengelim mantığını oturtmak için.", sortOrder: 2 },
                                { title: "Doğu Ekspresinde Cinayet", author: "Agatha Christie", neden: "Kurgusal suç çözümlemesi.", sortOrder: 3 },
                                { title: "Yaratıcılık: Kusursuz Suç", author: "Philippe Petit", neden: "Suçun sanatsal ve planlama boyutuna farklı bir bakış.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 3: İnsan Okuma ve Yalan Analizi
                    {
                        levelNumber: 3,
                        name: "İnsan Okuma ve Yalan Analizi (HUMINT)",
                        description: "Karşındakinin ne düşündüğünü bilmek. Mikro ifadeler ve beden dili.",
                        books: {
                            create: [
                                { title: "Yalan Söylediğimi Nasıl Anladın?", author: "Paul Ekman", neden: "Mikro ifadeler ve beden diliyle yalan yakalama.", sortOrder: 0 },
                                { title: "Yalan: İlişkilerde, İşte ve Yaşamda Yalanı Yakalamak", author: "Paul Seager", neden: "Yalanın psikolojisi.", sortOrder: 1 },
                                { title: "Ne Düşündüğünü Biliyorum", author: "Paul Ekman", neden: "Duyguların yüze yansıması ve analizi.", sortOrder: 2 },
                                { title: "İnsanların Oynadıkları Oyunlar", author: "Eric Berne", neden: "Transaksiyonel analiz. İnsan ilişkilerindeki gizli psikolojik oyunlar.", sortOrder: 3 },
                                { title: "Beden Dili", author: "Joe Navarro", neden: "Eski bir FBI ajanından insan okuma rehberi.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 4: Suçlu Psikolojisi ve Profilleme
                    {
                        levelNumber: 4,
                        name: "Suçlu Psikolojisi ve Profilleme",
                        description: "Suçlunun zihnine girmek.",
                        books: {
                            create: [
                                { title: "Suç Psikolojisi", author: "David Canter", neden: "Suçlu profilleme ve suç analizi üzerine akademik bir temel.", sortOrder: 0 },
                                { title: "Zihin Avcısı (Mindhunter)", author: "John Douglas", neden: "Seri katillerle yapılan görüşmeler ve profil çıkarma tekniğinin doğuşu.", sortOrder: 1 },
                                { title: "Suçlu Psikolojisi", author: "İzzet Durak", neden: "Suçluyu suça iten psikolojik süreçler.", sortOrder: 2 },
                                { title: "Adalet Psikolojisi", author: "Faruk Erem", neden: "Hukuk ve psikolojinin kesişimi.", sortOrder: 3 },
                                { title: "Psikodrama", author: "D. Altınay", neden: "İnsan davranışlarını çözümlemede kullanılan bir teknik.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 5: Tarihsel Strateji ve Savaş Sanatı
                    {
                        levelNumber: 5,
                        name: "Tarihsel Strateji ve Savaş Sanatı",
                        description: "Değişmeyen kurallar. Bin yıllık stratejiler.",
                        books: {
                            create: [
                                { title: "Savaş Sanatı", author: "Sun Tzu", neden: "Stratejinin kutsal kitabı.", sortOrder: 0 },
                                { title: "Hükümdar (Prens)", author: "Machiavelli", neden: "Politik strateji ve güç kullanımı.", sortOrder: 1 },
                                { title: "Siyasetname", author: "Nizamülmülk", neden: "Devlet yönetimi ve istihbaratın tarihsel kökleri.", sortOrder: 2 },
                                { title: "Başımıza Gelenler", author: "Mehmet Arif", neden: "93 Harbi ve Osmanlı'nın askeri/istihbari hataları üzerine bir klasik.", sortOrder: 3 },
                                { title: "Bitmeyen Savaş", author: "Halil Paşa / Taylan Sorgun", neden: "Kut'ül Amare kahramanının anıları ve stratejileri.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 6: Modern İstihbarat Teorisi
                    {
                        levelNumber: 6,
                        name: "Modern İstihbarat Teorisi",
                        description: "Günümüz dünyasında istihbarat nasıl çalışır?",
                        books: {
                            create: [
                                { title: "İstihbarat Teorisi", author: "Ümit Özdağ", neden: "İstihbaratın akademik ve teorik altyapısı.", sortOrder: 0 },
                                { title: "İşte İstihbarat", author: "Nurullah Aydın", neden: "İstihbarat teknikleri ve terimleri.", sortOrder: 1 },
                                { title: "21. Yüzyılda Güvenlik ve İstihbarat", author: "Sait Yılmaz", neden: "Modern güvenlik konseptleri.", sortOrder: 2 },
                                { title: "MİT'in Gizli Tarihi", author: "Tuncay Özkan", neden: "Kurumun tarihsel gelişimi.", sortOrder: 3 },
                                { title: "Asimetrik Savaş ve İstihbarat", author: "Serkan Yenal", neden: "Terör ve gerilla taktikleriyle mücadelede istihbarat.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 7: Algı Yönetimi ve Propaganda
                    {
                        levelNumber: 7,
                        name: "Algı Yönetimi ve Propaganda",
                        description: "Kitleleri yönetmek ve yönlendirmek.",
                        books: {
                            create: [
                                { title: "Propaganda", author: "Edward Bernays", neden: "Halkla ilişkiler ve manipülasyonun babası.", sortOrder: 0 },
                                { title: "Kitleler Psikolojisi", author: "Gustave Le Bon", neden: "Toplumların zihniyeti nasıl çalışır?", sortOrder: 1 },
                                { title: "İknanın Psikolojisi", author: "Robert Cialdini", neden: "İnsanlar neden \"evet\" der?", sortOrder: 2 },
                                { title: "Rol Yapmayın Lütfen", author: "Eric Morris", neden: "Maskeleme ve insan davranışı üzerine.", sortOrder: 3 },
                                { title: "Soğuk Savaş", author: "John Lewis Gaddis", neden: "Casuslar Köprüsü döneminin tarihi.", sortOrder: 4 },
                                { title: "Stratejik İletişim", author: "Dr. Rıza Güler", neden: "Algı yönetimi ve iletişim stratejileri.", sortOrder: 5 },
                                { title: "Outliers (Çizginin Dışındakiler)", author: "Malcolm Gladwell", neden: "Başarının arka planındaki görünmeyen stratejiler ve toplumsal algı.", sortOrder: 6 }
                            ]
                        }
                    },
                    // Seviye 8: Küresel Strateji ve Jeopolitik
                    {
                        levelNumber: 8,
                        name: "Küresel Strateji ve Jeopolitik",
                        description: "Dünya haritası üzerinde satranç oynamak.",
                        books: {
                            create: [
                                { title: "Büyük Satranç Tahtası", author: "Zbigniew Brzezinski", neden: "Avrasya ve Orta Doğu stratejileri.", sortOrder: 0 },
                                { title: "Stratejik Derinlik", author: "Ahmet Davutoğlu", neden: "Teorik jeopolitik okuması.", sortOrder: 1 },
                                { title: "Petrol, Para ve Güç", author: "Daniel Yergin", neden: "Enerji istihbaratı.", sortOrder: 2 },
                                { title: "Savaş Tertipleri", author: "Judith Butler", neden: "Savaşın çerçevelenmesi ve algılanması üzerine felsefi/politik bir bakış.", sortOrder: 3 },
                                { title: "Uygarlıkların Çatışması", author: "Samuel Huntington", neden: "Kültürel fay hatları.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 9: Derin Devlet ve Güç Mimarisi
                    {
                        levelNumber: 9,
                        name: "Derin Devlet ve Güç Mimarisi",
                        description: "Görünenin ardındaki yapılar.",
                        books: {
                            create: [
                                { title: "Devletin Gizli Sahipleri", author: "Ömer Lütfi Mete", neden: "Türkiye'deki derin yapılar ve uluslararası bağlantılar.", sortOrder: 0 },
                                { title: "Mahrem", author: "Elif Şafak", neden: "Görme ve görülme üzerine roman tadında.", sortOrder: 1 },
                                { title: "Gülün Adı", author: "Umberto Eco", neden: "Bilgiye sahip olmanın gücü ve gizemi.", sortOrder: 2 },
                                { title: "Kaos", author: "James Gleick", neden: "Karmaşık sistemlerin teorisi.", sortOrder: 3 },
                                { title: "Panoptikon (Hapishanenin Doğuşu)", author: "Michel Foucault", neden: "Gözetim toplumu ve modern iktidarın \"izleme\" üzerine kurulu yapısı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 10: Büyük Sentez
                    {
                        levelNumber: 10,
                        name: "Büyük Sentez",
                        description: "Tüm parçaları birleştirmek.",
                        books: {
                            create: [
                                { title: "Nutuk", author: "Mustafa Kemal Atatürk", neden: "Bir istihbarat, strateji ve kuruluş belgesi.", sortOrder: 0 },
                                { title: "Süper Zeka", author: "Nick Bostrom", neden: "Geleceğin istihbaratı: Yapay Zeka.", sortOrder: 1 },
                                { title: "Aldatma Sanatı", author: "Kevin Mitnick", neden: "Siber istihbaratın sosyal boyutu.", sortOrder: 2 },
                                { title: "Snowden (Sistem Hatası)", author: "Edward Snowden", neden: "Dijital gözetim gerçeği.", sortOrder: 3 },
                                { title: "Oyun ve Gerçeklik", author: "D.W. Winnicott", neden: "Oyun, yaratıcılık ve gerçeklik algısı üzerine derin bir psikanaliz.", sortOrder: 4 }
                            ]
                        }
                    }
                ]
            }
        }
    })
    console.log(`Created: ${istihbaratStrateji.name}`)

    // ==========================================
    // 6. TEKNOLOJİ, YAPAY ZEKA VE GELECEK VİZYONU
    // ==========================================
    const teknolojiYapayZeka = await prisma.readingList.create({
        data: {
            slug: "teknoloji-yapay-zeka",
            name: "🤖 Teknoloji ve Yapay Zeka Okumaları",
            description: "Geleceği inşa eden zihinlerden, yapay zeka okuryazarlığına, transhümanizmden uzay kolonizasyonuna kapsamlı bir teknoloji müfredatı. 10 seviye, 50 kitap.",
            coverUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
            sortOrder: 5,
            levels: {
                create: [
                    // Seviye 1: Vizyonerlerin Ayak İzleri
                    {
                        levelNumber: 1,
                        name: "Vizyonerlerin Ayak İzleri",
                        description: "Geleceği inşa eden zihinleri anlamak.",
                        books: {
                            create: [
                                { title: "Steve Jobs", author: "Walter Isaacson", neden: "Teknoloji ile beşeri bilimlerin kesişimi.", sortOrder: 0 },
                                { title: "Elon Musk", author: "Walter Isaacson", neden: "Mars vizyonu, yapay zeka ve risk alma.", sortOrder: 1 },
                                { title: "Sıfırdan Bire (Zero to One)", author: "Peter Thiel", neden: "Geleceği inşa edecek girişimler kurmak.", sortOrder: 2 },
                                { title: "İnovatörler", author: "Walter Isaacson", neden: "Ada Lovelace'tan Google'a dijital devrimin tarihi.", sortOrder: 3 },
                                { title: "Yaratıcılar", author: "Paul Johnson", neden: "Tarihsel yaratıcılık örnekleri.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 2: Yapay Zeka Okuryazarlığı
                    {
                        levelNumber: 2,
                        name: "Yapay Zeka Okuryazarlığı (Giriş)",
                        description: "YZ nedir, ne değildir? Temel kavramlar ve tarihçe.",
                        books: {
                            create: [
                                { title: "Yapay Zeka", author: "Cem Say", neden: "Türkçe en iyi ve en anlaşılır giriş kitabı. YZ'nin mantığı.", sortOrder: 0 },
                                { title: "Derin Düşünme (Deep Thinking)", author: "Garry Kasparov", neden: "Kasparov'un Deep Blue'ya yenilişi ve makine zekasıyla barışması.", sortOrder: 1 },
                                { title: "Yapay Zeka: İnsanlığın En Büyük İcadı mı?", author: "Toby Walsh", neden: "YZ'nin toplum üzerindeki olası etkileri.", sortOrder: 2 },
                                { title: "Algoritmalarla Yaşamak", author: "Brian Christian", neden: "Bilgisayar biliminin günlük hayata uygulanması.", sortOrder: 3 },
                                { title: "Ben, Robot", author: "Isaac Asimov", neden: "Robot yasaları ve makine etiğinin temeli.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 3: Hacker Kültürü ve Dijital Güvenlik
                    {
                        levelNumber: 3,
                        name: "Hacker Kültürü ve Dijital Güvenlik",
                        description: "Geleceği kuranların (ve bozanların) kültürü.",
                        books: {
                            create: [
                                { title: "Hacker Etiği", author: "Pekka Himanen", neden: "Kod yazmanın felsefesi: İş değil, tutku.", sortOrder: 0 },
                                { title: "Aldatma Sanatı", author: "Kevin Mitnick", neden: "En büyük güvenlik açığı insandır.", sortOrder: 1 },
                                { title: "Kripto", author: "Steven Levy", neden: "Şifrelemenin ve mahremiyetin tarihi.", sortOrder: 2 },
                                { title: "Sızma Sanatı", author: "Kevin Mitnick", neden: "Ağlara ve sistemlere giriş yolları.", sortOrder: 3 },
                                { title: "Sıfır", author: "Tunca Öğüten", neden: "Siber savaşlar üzerine yerli bir kurgu.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 4: Yakın Gelecek ve YZ Senaryoları
                    {
                        levelNumber: 4,
                        name: "Yakın Gelecek ve YZ Senaryoları",
                        description: "Önümüzdeki 20-30 yılda bizi neler bekliyor?",
                        books: {
                            create: [
                                { title: "Yapay Zeka 2041", author: "Kai-Fu Lee", neden: "Bilimsel gerçeklere dayanan 10 farklı gelecek hikayesi.", sortOrder: 0 },
                                { title: "Yaklaşan Dalga (The Coming Wave)", author: "Mustafa Suleyman", neden: "DeepMind'ın kurucusundan YZ ve biyoteknolojinin getireceği devasa riskler/fırsatlar.", sortOrder: 1 },
                                { title: "Geleceğin Fiziği", author: "Michio Kaku", neden: "Bilim, 2100 yılına kadar ekonomiyi ve hayatı nasıl şekillendirecek?", sortOrder: 2 },
                                { title: "İkinci Makine Çağı", author: "Erik Brynjolfsson", neden: "Dijital teknolojilerin ekonomiyi ve iş gücünü dönüştürmesi.", sortOrder: 3 },
                                { title: "Robotların Yükselişi", author: "Martin Ford", neden: "Yapay zeka işsizliğe yol açacak mı?", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 5: Algoritmik Toplum ve Veri
                    {
                        levelNumber: 5,
                        name: "Algoritmik Toplum ve Veri",
                        description: "Veri, yeni petrol müdür? Algoritmalar bizi nasıl yönetiyor?",
                        books: {
                            create: [
                                { title: "Matematiksel İmha Silahları", author: "Cathy O'Neil", neden: "Big Data ve algoritmaların eşitsizliği nasıl artırdığına dair bir yazılımcı eleştirisi.", sortOrder: 0 },
                                { title: "Gözetim Kapitalizmi", author: "Shoshana Zuboff", neden: "İnsan deneyiminin veriye dönüştürülüp satılması.", sortOrder: 1 },
                                { title: "Herkes Yalan Söyler", author: "Seth Stephens-Davidowitz", neden: "Google aramaları insan psikolojisi hakkında ne söylüyor?", sortOrder: 2 },
                                { title: "Enformasyon (Bilgi)", author: "James Gleick", neden: "Bilginin, selin ve bit'in tarihi.", sortOrder: 3 },
                                { title: "Dijital Minimalizm", author: "Cal Newport", neden: "Gürültüden sıyrılıp odaklanma sanatı.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 6: Transhümanizm ve İnsanlık 2.0
                    {
                        levelNumber: 6,
                        name: "Transhümanizm ve İnsanlık 2.0",
                        description: "İnsan biyolojisini aşmak. Ölümsüzlük ve siborglar.",
                        books: {
                            create: [
                                { title: "İnsanlık 2.0 (The Singularity is Near)", author: "Ray Kurzweil", neden: "Teknolojik tekillik, nanoteknoloji ve insan beyninin dijitalleşmesi. Bu alanın incili.", sortOrder: 0 },
                                { title: "Homo Deus", author: "Yuval Noah Harari", neden: "İnsanın tanrılaşma çabası: Ölümsüzlük, mutluluk ve tanrısallık.", sortOrder: 1 },
                                { title: "Bir Makine Olmak", author: "Mark O'Connell", neden: "Transhümanistler, biyo-hackerlar ve ölümü yenmeye çalışanların dünyasına yolculuk.", sortOrder: 2 },
                                { title: "Novacene", author: "James Lovelock", neden: "Yapay zekanın yöneteceği yeni jeolojik çağ.", sortOrder: 3 },
                                { title: "Değiştirilmiş Karbon", author: "Richard K. Morgan", neden: "Bilincin başka bedenlere aktarıldığı bir gelecek kurgusu.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 7: Yapay Zeka Felsefesi ve Etik
                    {
                        levelNumber: 7,
                        name: "Yapay Zeka Felsefesi ve Etik",
                        description: "Makine düşünebilir mi? Bilinç nedir?",
                        books: {
                            create: [
                                { title: "Süper Zeka", author: "Nick Bostrom", neden: "Yapay zeka insan zekasını geçtiğinde ne olacak? Kontrol sorunu.", sortOrder: 0 },
                                { title: "Yaşam 3.0", author: "Max Tegmark", neden: "YZ çağında insan olmak ne anlama gelecek? Fizikçi gözüyle analiz.", sortOrder: 1 },
                                { title: "Klara ve Güneş", author: "Kazuo Ishiguro", neden: "Yapay zekalı bir arkadaşın gözünden insan nedir? Çok naif ve derin bir roman.", sortOrder: 2 },
                                { title: "Yapay Zeka Felsefesi", author: "Ömer Belkıs", neden: "YZ tartışmalarının felsefi temelleri.", sortOrder: 3 },
                                { title: "Son İcat", author: "James Barrat", neden: "Yapay zeka insanlığın sonunu mu getirecek?", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 8: Evrenin Kodları
                    {
                        levelNumber: 8,
                        name: "Evrenin Kodları (Hard Science)",
                        description: "Yazılımın temeli fiziktir. Evreni anlamak.",
                        books: {
                            create: [
                                { title: "Zamanın Kısa Tarihi", author: "Stephen Hawking", neden: "Kozmolojiye giriş.", sortOrder: 0 },
                                { title: "Gen Bencildir", author: "Richard Dawkins", neden: "Biyolojik evrimin algoritması.", sortOrder: 1 },
                                { title: "Kozmos", author: "Carl Sagan", neden: "Bilimin şiirsel anlatımı.", sortOrder: 2 },
                                { title: "Kaos", author: "James Gleick", neden: "Kelebek etkisi ve karmaşık sistemler teorisi.", sortOrder: 3 },
                                { title: "Tüfek, Mikrop ve Çelik", author: "Jared Diamond", neden: "Medeniyetlerin gelişim kodları.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 9: Uzay Kolonizasyonu ve Gelecek
                    {
                        levelNumber: 9,
                        name: "Uzay Kolonizasyonu ve Gelecek",
                        description: "Dünyadan çıkış.",
                        books: {
                            create: [
                                { title: "Marslı", author: "Andy Weir", neden: "Bilimsel temelli hayatta kalma ve mühendislik.", sortOrder: 0 },
                                { title: "Soluk Mavi Nokta", author: "Carl Sagan", neden: "İnsanın uzaydaki geleceği.", sortOrder: 1 },
                                { title: "Gelecek 100 Yıl", author: "George Friedman", neden: "21. yüzyılın jeopolitik ve teknolojik tahminleri.", sortOrder: 2 },
                                { title: "Üç Cisim Problemi", author: "Cixin Liu", neden: "Evrensel sosyoloji, fizik ve uzaylılarla temasın en sert hali.", sortOrder: 3 },
                                { title: "Cesur Yeni Dünya", author: "Aldous Huxley", neden: "Genetik mühendisliği ile tasarlanmış toplum.", sortOrder: 4 }
                            ]
                        }
                    },
                    // Seviye 10: Nihai Sentez
                    {
                        levelNumber: 10,
                        name: "Nihai Sentez (Master Algoritma)",
                        description: "Tüm parçaları birleştiren başyapıtlar.",
                        books: {
                            create: [
                                { title: "Master Algoritma", author: "Pedro Domingos", neden: "Tüm bilgiyi öğrenebilecek nihai öğrenme makinesi arayışı. Makine öğrenmesi türleri.", sortOrder: 0 },
                                { title: "Vakıf", author: "Isaac Asimov", neden: "Geleceği matematiksel olarak öngörmek: Psikotarih.", sortOrder: 1 },
                                { title: "Dune", author: "Frank Herbert", neden: "İnsan zihni vs Yapay Zeka (Butleryan Cihadı) sonrası evren.", sortOrder: 2 },
                                { title: "Olasılıksız", author: "Adam Fawer", neden: "Bilgi, determinizm ve özgür irade.", sortOrder: 3 },
                                { title: "Başlangıç (Origin)", author: "Dan Brown", neden: "Yapay zeka, din ve insanlığın geleceği.", sortOrder: 4 }
                            ]
                        }
                    }
                ]
            }
        }
    })
    console.log(`Created: ${teknolojiYapayZeka.name}`)

    // ==========================================
    // 2026 YILLIK OKUMA HEDEFİ (READING CHALLENGE)
    // ==========================================

    // Önce varolan 2026 challenge'ı sil
    await prisma.readingChallenge.deleteMany({
        where: { year: 2026 }
    })

    const challenge2026 = await prisma.readingChallenge.create({
        data: {
            year: 2026,
            name: "2026 Okuma Hedefi",
            description: "Yatay Okuma Stratejisi: Türler arası geçişle sıkılmadan, her ay en az 1 kitabı sindirerek bitirme hedefi.",
            strategy: "1_MAIN_2_BONUS",
            isActive: true,
            months: {
                create: [
                    // OCAK - Bilim Kurgu & Macera
                    {
                        monthNumber: 1,
                        monthName: "Ocak",
                        theme: "Bilim Kurgu & Macera",
                        themeIcon: "🚀",
                        books: {
                            create: [
                                {
                                    title: "Marslı",
                                    author: "Andy Weir",
                                    role: "MAIN",
                                    pageCount: 380,
                                    reason: "Yıla yüksek enerjiyle, zeki ve komik bir hayatta kalma hikayesiyle başlamak için.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Başlat (Ready Player One)",
                                    author: "Ernest Cline",
                                    role: "BONUS",
                                    pageCount: 450,
                                    reason: "80'ler nostaljisi ve oyun dünyasıyla eğlenceyi sürdürmek için.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Minyeli Abdullah",
                                    author: "Hekimoğlu İsmail",
                                    role: "BONUS",
                                    pageCount: 240,
                                    reason: "Uzaydan dünyaya dönüş; manevi ve nostaljik bir klasikle dinlenmek için.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // ŞUBAT - Edebiyat & İnsan
                    {
                        monthNumber: 2,
                        monthName: "Şubat",
                        theme: "Edebiyat & İnsan",
                        themeIcon: "💡",
                        books: {
                            create: [
                                {
                                    title: "Uzun Hikaye",
                                    author: "Mustafa Kutlu",
                                    role: "MAIN",
                                    pageCount: 160,
                                    reason: "Kısa, akıcı ve kalbi ısıtan bir Anadolu hikayesiyle okuma kondisyonunu korumak.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Beyaz Diş",
                                    author: "Jack London",
                                    role: "BONUS",
                                    pageCount: 280,
                                    reason: "Doğa ve mücadele temalı, dünya edebiyatından akıcı bir klasik.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Kusursuz Cinayet Yoktur",
                                    author: "Sevil Atasoy",
                                    role: "BONUS",
                                    pageCount: 320,
                                    reason: "Biraz merak ve gizem. Adli bilimlere giriş.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // MART - Tarihi Kurgu
                    {
                        monthNumber: 3,
                        monthName: "Mart",
                        theme: "Tarihi Kurgu",
                        themeIcon: "🏰",
                        books: {
                            create: [
                                {
                                    title: "Semerkant",
                                    author: "Amin Maalouf",
                                    role: "MAIN",
                                    pageCount: 318,
                                    reason: "Ömer Hayyam ve Hasan Sabbah'ın hikayesiyle Doğu'nun gizemli tarihine giriş.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Fedailerin Kalesi Alamut",
                                    author: "Vladimir Bartol",
                                    role: "BONUS",
                                    pageCount: 510,
                                    reason: "Semerkant'ı sevenler için aynı dönemi daha karanlık anlatan bir gerilim.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Sultanın Casusları",
                                    author: "Emrah Safa Gürkan",
                                    role: "BONUS",
                                    pageCount: 400,
                                    reason: "Tarihi bu sefer kurgu değil, eğlenceli ve gerçek casusluk hikayeleriyle okumak.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // NİSAN - Teknoloji & Vizyon
                    {
                        monthNumber: 4,
                        monthName: "Nisan",
                        theme: "Teknoloji & Vizyon",
                        themeIcon: "🤖",
                        books: {
                            create: [
                                {
                                    title: "Steve Jobs",
                                    author: "Walter Isaacson",
                                    role: "MAIN",
                                    pageCount: 600,
                                    reason: "Teknoloji dünyasını şekillendiren bir dâhinin hayatını roman gibi okumak.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Sıfırdan Bire",
                                    author: "Peter Thiel",
                                    role: "BONUS",
                                    pageCount: 200,
                                    reason: "Girişimcilik ve geleceği inşa etmek üzerine kısa ve vurucu bir kitap.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Otostopçunun Galaksi Rehberi",
                                    author: "Douglas Adams",
                                    role: "BONUS",
                                    pageCount: 250,
                                    reason: "Teknolojinin ciddiyetinden sıkılınca evrene kahkahalarla gülmek için.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // MAYIS - Maneviyat & Siyer
                    {
                        monthNumber: 5,
                        monthName: "Mayıs",
                        theme: "Maneviyat & Siyer",
                        themeIcon: "📿",
                        books: {
                            create: [
                                {
                                    title: "Hz. Muhammed'in Hayatı",
                                    author: "Martin Lings",
                                    role: "MAIN",
                                    pageCount: 450,
                                    reason: "Dünyanın en iyi siyerlerinden biriyle, dönemin atmosferini solumak.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Çöl Deniz (Hz. Hatice)",
                                    author: "Sibel Eraslan",
                                    role: "BONUS",
                                    pageCount: 350,
                                    reason: "Siyeri bir de Hz. Hatice'nin gözünden, duygusal bir romanla okumak.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Küçük Ağaç'ın Eğitimi",
                                    author: "Forrest Carter",
                                    role: "BONUS",
                                    pageCount: 270,
                                    reason: "Doğa, bilgelik ve saflık üzerine ruhu dinlendiren bir hikaye.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // HAZİRAN - Strateji & Casusluk
                    {
                        monthNumber: 6,
                        monthName: "Haziran",
                        theme: "Strateji & Casusluk",
                        themeIcon: "🎯",
                        books: {
                            create: [
                                {
                                    title: "Savaş Sanatı",
                                    author: "Sun Tzu",
                                    role: "MAIN",
                                    pageCount: 100,
                                    reason: "Yaz başlarken kısa ama bin yıllık strateji bilgeliği içeren bir temel eser.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Köstebek",
                                    author: "John le Carré",
                                    role: "BONUS",
                                    pageCount: 400,
                                    reason: "Gerçekçi ve bürokratik bir soğuk savaş casusluğu romanı.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Sherlock Holmes - Bütün Hikayeler 1",
                                    author: "Arthur Conan Doyle",
                                    role: "BONUS",
                                    pageCount: 350,
                                    reason: "Stratejiden sonra biraz da tümdengelim ve suç çözme keyfi.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // TEMMUZ - Bilim Kurgu & Gerilim
                    {
                        monthNumber: 7,
                        monthName: "Temmuz",
                        theme: "Bilim Kurgu & Gerilim",
                        themeIcon: "🧬",
                        books: {
                            create: [
                                {
                                    title: "Karanlık Madde",
                                    author: "Blake Crouch",
                                    role: "MAIN",
                                    pageCount: 400,
                                    reason: "Yaz sıcağında elden bırakılamayacak, film gibi bir paralel evren kovalamacası.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Jurassic Park",
                                    author: "Michael Crichton",
                                    role: "BONUS",
                                    pageCount: 450,
                                    reason: "Genetik bilimi ve kaos teorisi üzerine heyecanlı bir klasik.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Yalan Söylediğimi Nasıl Anladın?",
                                    author: "Paul Ekman",
                                    role: "BONUS",
                                    pageCount: 300,
                                    reason: "İnsanların mimiklerini okumayı öğrenmek için eğlenceli bir kişisel gelişim.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // AĞUSTOS - Polisiye & Gizem
                    {
                        monthNumber: 8,
                        monthName: "Ağustos",
                        theme: "Polisiye & Gizem",
                        themeIcon: "🔍",
                        books: {
                            create: [
                                {
                                    title: "Doğu Ekspresinde Cinayet",
                                    author: "Agatha Christie",
                                    role: "MAIN",
                                    pageCount: 250,
                                    reason: "Sıcaklarda zihni yormayan, sonu şaşırtıcı klasik bir dedektiflik hikayesi.",
                                    sortOrder: 0
                                },
                                {
                                    title: "İstanbul Hatırası",
                                    author: "Ahmet Ümit",
                                    role: "BONUS",
                                    pageCount: 550,
                                    reason: "İstanbul'un tarihiyle iç içe geçmiş yerli ve atmosferik bir polisiye.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Yapay Zeka",
                                    author: "Cem Say",
                                    role: "BONUS",
                                    pageCount: 200,
                                    reason: "Eylüldeki teknoloji ayına hazırlık için hafif ve öğretici bir giriş.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // EYLÜL - Teknoloji & Gelecek
                    {
                        monthNumber: 9,
                        monthName: "Eylül",
                        theme: "Teknoloji & Gelecek",
                        themeIcon: "🌌",
                        books: {
                            create: [
                                {
                                    title: "Elon Musk",
                                    author: "Walter Isaacson",
                                    role: "MAIN",
                                    pageCount: 650,
                                    reason: "Mars, elektrikli araçlar ve yapay zeka vizyonunu anlamak için güncel bir biyografi.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Yapay Zeka 2041",
                                    author: "Kai-Fu Lee",
                                    role: "BONUS",
                                    pageCount: 450,
                                    reason: "Gelecekte bizi nelerin beklediğine dair bilimsel temelli 10 hikaye.",
                                    sortOrder: 1
                                },
                                {
                                    title: "1984",
                                    author: "George Orwell",
                                    role: "BONUS",
                                    pageCount: 350,
                                    reason: "Teknolojinin karanlık yüzünü hatırlatan distopik bir klasik.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // EKİM - Düşünce & Melankoli
                    {
                        monthNumber: 10,
                        monthName: "Ekim",
                        theme: "Düşünce & Melankoli",
                        themeIcon: "🍂",
                        books: {
                            create: [
                                {
                                    title: "Kürk Mantolu Madonna",
                                    author: "Sabahattin Ali",
                                    role: "MAIN",
                                    pageCount: 160,
                                    reason: "Sonbahar ruhuna uygun, derin bir karakter analizi ve aşk hikayesi.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Beş Şehir",
                                    author: "Ahmet Hamdi Tanpınar",
                                    role: "BONUS",
                                    pageCount: 250,
                                    reason: "Medeniyetimizin estetiğini ve şehirlerin ruhunu anlamak için.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Martı Jonathan Livingston",
                                    author: "Richard Bach",
                                    role: "BONUS",
                                    pageCount: 100,
                                    reason: "Kendini aşmak üzerine bir oturuşta bitecek felsefi bir masal.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // KASIM - Dinler & Tarih
                    {
                        monthNumber: 11,
                        monthName: "Kasım",
                        theme: "Dinler & Tarih",
                        themeIcon: "🏛️",
                        books: {
                            create: [
                                {
                                    title: "Tanrı'nın Tarihi",
                                    author: "Karen Armstrong",
                                    role: "MAIN",
                                    pageCount: 550,
                                    reason: "Üç büyük dinin tarihsel gelişimini anlatan, yılın en öğretici kitabı.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Hristiyanlık ve İslam",
                                    author: "Müfit Selim Saruhan",
                                    role: "BONUS",
                                    pageCount: 200,
                                    reason: "Ana kitaptaki konuları karşılaştırmalı olarak pekiştirmek için.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Malcolm X",
                                    author: "Alex Haley",
                                    role: "BONUS",
                                    pageCount: 500,
                                    reason: "İnanç ve mücadele üzerine sarsıcı bir biyografi.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    // ARALIK - Cumhuriyet & Sentez
                    {
                        monthNumber: 12,
                        monthName: "Aralık",
                        theme: "Cumhuriyet & Sentez",
                        themeIcon: "🇹🇷",
                        books: {
                            create: [
                                {
                                    title: "Çankaya",
                                    author: "Falih Rıfkı Atay",
                                    role: "MAIN",
                                    pageCount: 600,
                                    reason: "Yılı Cumhuriyet'in kuruluşu ve Atatürk'ün sofrasından anılarla kapatmak.",
                                    sortOrder: 0
                                },
                                {
                                    title: "Nutuk",
                                    author: "Mustafa Kemal Atatürk",
                                    role: "BONUS",
                                    pageCount: 650,
                                    reason: "Tarihi birinci ağızdan, kurucunun kaleminden okumak.",
                                    sortOrder: 1
                                },
                                {
                                    title: "Sinyal ve Gürültü",
                                    author: "Nate Silver",
                                    role: "BONUS",
                                    pageCount: 500,
                                    reason: "Yıl boyu okunan tüm veriyi ve bilgiyi nasıl analiz edeceğini öğrenerek seneyi bitirmek.",
                                    sortOrder: 2
                                }
                            ]
                        }
                    }
                ]
            }
        }
    })
    console.log(`Created: ${challenge2026.name}`)

    console.log("Seeding completed!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
