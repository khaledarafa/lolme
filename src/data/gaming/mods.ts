export interface Mod {
    slug: string;
    title: string;
    desc: string;
    img: string;
    link: string;
    subCategory?: string; // 👈 دي المهمة
}
export const mods = [
    {
        slug: "mercedes-gls-63",
        title: "🚙 Mercedes-Benz GLS 63 AMG",
        desc: "مود يضيف سيارة Mercedes GLS 63 AMG الفخمة داخل Euro Truck Simulator 2 بتفاصيل عالية وقيادة سريعة وممتعة.",
        img: "/images/mods/Mercedes-Benz-GLS-63.webp",
        link: "https://modsfire.com/G4RDbY7XO4ad7T0",
        subCategory: "cars"
    },
    {
        slug: "mercedes-w124-250d",
        title: "🚙 Mercedes-Benz 250D W124 (Classic)",
        desc: "مود يضيف السيارة الكلاسيك Mercedes W124 250D داخل Euro Truck Simulator 2 بتصميم قديم فاخر وتجربة قيادة هادية وممتعة.",
        img: "/images/mods/mercedes-w124.webp",
        link: "https://ets2.lt/en/mercedes-benz-250d-w124-1998-1-6-1-58x/",
        subCategory: "cars"
    },
    {
        slug: "mercedes-maybach-s400d",
        title: "🚙 Mercedes-Maybach S400d (2021)",
        desc: "مود يضيف سيارة Mercedes-Maybach S400d الفاخرة جداً داخل Euro Truck Simulator 2 بتجربة قيادة ناعمة وتصميم داخلي راقي لمحبي الفخامة.",
        img: "/images/mods/maybach-s400d.webp",
        link: "https://ets2.lt/en/2021-mercedes-benz-maybach-s-400d-1-0-1-58x/",
        subCategory: "cars"
    },
    {
        slug: "bus-mod",
        title: "🚌 Bus Mod for Euro Truck Simulator 2",
        desc: "مود يضيف أتوبيسات يمكنك قيادتها داخل Euro Truck Simulator 2 بدل الشاحنات.",
        img: "/images/mods/bus.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2869291062",
        subCategory: "bus"
    },
    {
        slug: "marcopolo-g7-1800",
        title: "🚌 MarcoPolo G7 1800 Bus",
        desc: "مود يضيف باص MarcoPolo G7 1800 بتصميم واقعي جداً وتجربة قيادة ممتازة داخل Euro Truck Simulator 2. مناسب لمحبي مودات الباصات والسفر الطويل.",
        img: "/images/mods/marcopolo-g7.jpg",
        link: "https://ets2.lt/en/marcopolo-new-g7-1800-v1-58/",
        subCategory: "bus"
    },
    {
        slug: "setra-s516-hd2",
        title: "🚌 Setra S516 HDH Bus",
        desc: "مود يضيف باص Setra S516 HDH الفخم داخل Euro Truck Simulator 2 مع تصميم داخلي وخارجي واقعي جداً وتجربة قيادة مريحة للسفر الطويل.",
        img: "/images/mods/setra-s516.jpg",
        link: "https://ets2.lt/en/setra-s516-hd2-v1-58/",
        subCategory: "bus"
    },
    {
        slug: "passenger-mod",
        title: "🧍‍♂️ Passenger Mod (نقل ركاب)",
        desc: "مود يضيف ركاب داخل الشركات بدل البضائع ويحول اللعبة لتجربة نقل ركاب بالباص.",
        img: "/images/mods/passenger.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2869291062",
        subCategory: "bus"
    },
    {
        slug: "urban-bus-addon",
        title: "🚌 Urban Bus Add-on (واقعية الباصات)",
        desc: "إضافة لتحسين واقعية الباصات في Euro Truck بإضافة أصوات وتفاصيل داخلية مثل الفرامل والاهتزازات. ⚠️ لا يضيف باصات ويعمل فقط مع مودات الباص.",
        img: "/images/mods/urban-bus-addon.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2416700155",
        subCategory: "bus"
    },
{
  slug: "realistic-truck-physics",
  title: "🛞 Realistic Truck Physics",
  desc: "مود يحسن فيزياء الشاحنات في Euro Truck Simulator 2 ويجعل القيادة أكثر واقعية من حيث الوزن والفرامل والتحكم.",
  img: "/images/mods/truck-physics.webp",
  link: "https://steamcommunity.com/sharedfiles/filedetails/?id=713338424",
},
    {
        slug: "digital-mirrors-scania",
        title: "🪞 Digital Mirrors Camera System",
        desc: "نظام مرايات ديجيتال لشاحنات Scania R و S 2016 يستبدل المرايات التقليدية بكاميرات وشاشات داخل الكابينة.",
        img: "/images/mods/Digital-Mirrors.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2784601482",
    },
    {
        slug: "digital-mirrors-volvo-fh16",
        title: "🪞 Digital Mirrors Cam System (Volvo FH16)",
        desc: "نظام مرايات ديجيتال لشاحنات Volvo FH16 2012 يستبدل المرايات التقليدية بكاميرات وشاشات داخل الكابينة.",
        img: "/images/mods/digital-mirrors-volvo.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2730605328"
    },
    {
        slug: "digital-mirrors-renault-t",
        title: "🪞 Digital Mirrors Cam System (Renault T)",
        desc: "نظام مرايات ديجيتال لشاحنات Renault T Range مع كاميرا رجوع للخلف لتحسين الرؤية أثناء القيادة.",
        img: "/images/mods/digital-mirrors-renault.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2739449876"
    },
    {
        slug: "digital-mirror-daf-2021",
        title: "🪞 Digital Mirror (DAF 2021)",
        desc: "إظهار المرايات الديجيتال على شاشة الملاحة داخل شاحنات DAF 2021 / XD.",
        img: "/images/mods/digital-mirror-daf.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=3234189101"
    },
    {
        slug: "ets2-high-power-engines",
        title: "🔥 850HP / 1500HP / 2500HP Engines",
        desc: "مود يضيف محركات قوية جدًا لكل الشاحنات تصل إلى 2500 حصان لتجربة قيادة سريعة وقوية.",
        img: "/images/mods/high-power-engines.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=3402982812"
    },
    {
        slug: "aq-team-cabin-light",
        title: "💡 AQ-TEAM Cabin Light",
        desc: "إضاءة داخلية للكابينة تضيف جو جميل أثناء القيادة الليلية.",
        img: "/images/mods/cabin-light.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=837291507"
    },

    {
        slug: "interior-cabin-lights",
        title: "💡 Interior Cabin Lights",
        desc: "مود يضيف إضاءة داخلية ملونة داخل كابينة الشاحنة.",
        img: "/images/mods/interior-cabin-lights.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2974113091"
    },

    {
        slug: "aq-team-cabin-light-v2",
        title: "💡 AQ-TEAM Cabin Light V2",
        desc: "نسخة مطورة من إضاءة الكابينة تعطي تأثيرات أجمل داخل الشاحنة.",
        img: "/images/mods/cabin-light-v2.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=1779058165"
    },

    {
        slug: "ets2-interior-addon",
        title: "🛞 Interior Addon",
        desc: "إضافة تحسينات داخلية للكابينة في بعض الشاحنات.",
        img: "/images/mods/interior-addon.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=3102768847"
    },

    {
        slug: "sisl-mega-pack",
        title: "🧸 SISL's Mega Pack",
        desc: "أكبر حزمة إكسسوارات لكابينة الشاحنة تضيف دمى وديكورات وأشياء كثيرة داخل التابلوه.",
        img: "/images/mods/sisl-mega-pack.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2898264929"
    },
    {
        slug: "shocker-xl-train-horns",
        title: "📢 Shocker XL Train Horns",
        desc: "مود يضيف بوق قطار قوي جدًا لكل الشاحنات في Euro Truck. الصوت عالي جدًا ومناسب للكونفوي.",
        img: "/images/mods/train-horn.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=3615074783"
    },
    {
        slug: "interior-lights-scs-trucks",
        title: "💡 Interior Lights SCS Trucks",
        desc: "مود يضيف إضاءة داخلية لكابينة الشاحنة مع 7 ألوان مختلفة يمكن تركيبها على سقف الكابينة.",
        img: "/images/mods/interior-lights.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=3248160833"
    },
    {
        slug: "xenon-lights",
        title: "💡 Xenon Lights",
        desc: "مود يحسن إضاءة فوانيس الشاحنات ويجعلها Xenon أكثر وضوحًا أثناء القيادة الليلية.",
        img: "/images/mods/xenon-lights.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=2043171222"
    },
    {
        slug: "galatasaray-led-pano",
        title: "💡 Galatasaray LED Pano",
        desc: "لوحة LED مضيئة بشعار Galatasaray تضاف داخل كابينة الشاحنة كديكور وإضاءة خلفية.",
        img: "/images/mods/galatasaray-led.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=3519482895"
    },
    {
        slug: "scania-smart-dash",
        title: "📟 Scania Smart Dash",
        desc: "تحسين شاشة العدادات الرقمية في شاحنات Scania مع تصميم أحدث ومعلومات قيادة أوضح.",
        img: "/images/mods/scania-smart-dash.webp",
        link: "https://steamcommunity.com/sharedfiles/filedetails/?id=3609112917"
    },
];