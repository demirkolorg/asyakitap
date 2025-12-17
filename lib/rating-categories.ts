// Puanlama kategorileri - client ve server tarafında kullanılabilir
export const RATING_CATEGORIES = [
    {
        key: "konuFikir",
        label: "Konu/Fikir",
        description: "Ana tema, mesaj veya fikrin özgünlüğü ve derinliği",
        group: "İçerik & Hikaye"
    },
    {
        key: "akicilik",
        label: "Akıcılık",
        description: "Okuma hızı, sayfa çevirme isteği, sıkılma durumu",
        group: "İçerik & Hikaye"
    },
    {
        key: "derinlik",
        label: "Derinlik",
        description: "Konunun işlenme seviyesi, detay zenginliği",
        group: "İçerik & Hikaye"
    },
    {
        key: "etki",
        label: "Etki",
        description: "Kitabın bıraktığı iz, düşündürme gücü",
        group: "İçerik & Hikaye"
    },
    {
        key: "dilUslup",
        label: "Dil & Üslup",
        description: "Yazarın anlatım gücü, kelime seçimi, cümle yapısı",
        group: "Yazarlık & Üslup"
    },
    {
        key: "karakterAnlatim",
        label: "Karakter/Anlatım",
        description: "Karakter derinliği (kurgu) veya anlatım tutarlılığı (kurgu dışı)",
        group: "Yazarlık & Üslup"
    },
    {
        key: "ozgunluk",
        label: "Özgünlük",
        description: "Yazarın kendine has sesi, farklılığı",
        group: "Yazarlık & Üslup"
    },
    {
        key: "baskiTasarim",
        label: "Baskı/Tasarım",
        description: "Kapak, kağıt kalitesi, punto, sayfa düzeni",
        group: "Teknik & Üretim"
    },
    {
        key: "genelPuan",
        label: "Genel Puan",
        description: "Tüm değerlendirmelerin özeti, kitabın genel değeri",
        group: "Genel"
    }
] as const

export type RatingCategoryKey = typeof RATING_CATEGORIES[number]["key"]
