// Every piece of copy, video and photo on the site lives here.
// To swap in your own media:
//   - photos: drop files into /public/images/... and set `photo` / `src` to "/images/...".
//   - videos: set `youtube` to the id from the URL (youtube.com/watch?v=<id>).
// Anything without a photo renders a styled "ẢNH DEMO" placeholder.

export const PLAYER = {
  name: "Lamine Yamal",
  fullName: "Lamine Yamal Nasraoui Ebana",
  born: "2007-07-13",
  birthplace: "Esplugues de Llobregat, Catalonia",
  hometown: "Rocafonda, Mataró",
  club: "FC Barcelona",
  shirt: 10,
  position: "Tiền đạo cánh phải",
};

export type Chapter = {
  year: string;
  date: string;
  title: string;
  body: string;
  stat?: [string, string]; // [value, label]
  photo?: string;
};

// The scroll-world flight, in order.
export const JOURNEY: Chapter[] = [
  {
    year: "2007",
    date: "13 · 07 · 2007",
    title: "Một cậu bé ở Rocafonda",
    body: "Sinh ra tại Esplugues de Llobregat, lớn lên ở khu Rocafonda, Mataró. Bố người Morocco, mẹ người Guinea Xích Đạo. Mã bưu chính 08304 về sau thành màn ăn mừng “304”.",
    stat: ["304", "Rocafonda"],
    photo: "/journey/2007-rocafonda.jpg",
  },
  {
    year: "2007",
    date: "Thu 2007",
    title: "Tấm ảnh với Messi",
    body: "Vài tháng tuổi, Lamine được một Lionel Messi 20 tuổi bế trong buổi chụp lịch từ thiện tại Camp Nou. 17 năm sau, tấm ảnh lan khắp thế giới.",
    photo: "/journey/2007-messi.jpg",
  },
  {
    year: "2014",
    date: "2014",
    title: "Bước vào La Masia",
    body: "Lên 7 tuổi, Lamine vượt qua buổi thử việc và gia nhập học viện La Masia của Barcelona, đi qua mọi cấp độ trẻ từ Alevín tới Juvenil.",
    stat: ["7", "tuổi"],
    photo: "/journey/2014-la-masia.jpg",
  },
  {
    year: "2023",
    date: "29 · 04 · 2023",
    title: "Ra mắt đội một",
    body: "Vào sân trong trận Barcelona 4-0 Real Betis, trở thành một trong những cầu thủ trẻ nhất từng ra sân cho Barça.",
    stat: ["15", "tuổi 290 ngày"],
    photo: "/journey/2023-debut.jpg",
  },
  {
    year: "2023",
    date: "08 · 10 · 2023",
    title: "Bàn thắng đầu tiên",
    body: "Ghi bàn vào lưới Granada, trở thành cầu thủ trẻ nhất từng ghi bàn trong lịch sử La Liga. Một tháng trước đó, cậu cũng đã lập kỷ lục ghi bàn trẻ nhất cho tuyển Tây Ban Nha.",
    stat: ["16", "tuổi 87 ngày"],
  },
  {
    year: "2024",
    date: "09 · 07 · 2024",
    title: "Siêu phẩm vào lưới Pháp",
    body: "Cú cứa lòng từ ngoài vòng cấm ở bán kết EURO 2024 biến cậu thành cầu thủ ghi bàn trẻ nhất lịch sử giải đấu. Năm ngày sau, Tây Ban Nha vô địch châu Âu.",
    stat: ["16", "tuổi 362 ngày"],
    photo: "/journey/2024-euro-goal.webp",
  },
  {
    year: "2024",
    date: "14 · 07 · 2024",
    title: "Vô địch châu Âu",
    body: "Tây Ban Nha đánh bại Anh 2-1 ở chung kết EURO 2024 tại Berlin. Lamine nhận giải Cầu thủ trẻ xuất sắc nhất giải.",
    photo: "/journey/2024-euro-champion.webp",
  },
  {
    year: "2025",
    date: "2025",
    title: "Cú ăn ba quốc nội & áo số 10",
    body: "La Liga, Copa del Rey và Supercopa trong cùng một mùa. Mùa hè 2025, Lamine chính thức khoác chiếc áo số 10 của Barcelona.",
    stat: ["10", "số áo"],
    photo: "/journey/2025-copa-del-rey.jpg",
  },
  {
    year: "2026",
    date: "19 · 07 · 2026",
    title: "Vô địch thế giới",
    body: "Tây Ban Nha đánh bại Argentina 1-0 sau hiệp phụ ở chung kết World Cup 2026. Ở tuổi 19, Lamine đã có cả EURO lẫn World Cup.",
    stat: ["19", "tuổi"],
    photo: "/journey/2026-world-cup.jpg",
  },
];

export type Trophy = {
  name: string;
  scope: "club" | "country";
  years: string[];
  note?: string;
  featured?: boolean;
};

// Team trophies. Double-check new seasons against FC Barcelona / RFEF records.
export const TROPHIES: Trophy[] = [
  {
    name: "FIFA World Cup",
    scope: "country",
    years: ["2026"],
    note: "Chung kết: Tây Ban Nha 1-0 Argentina (hiệp phụ)",
    featured: true,
  },
  { name: "UEFA EURO", scope: "country", years: ["2024"], note: "Cầu thủ trẻ xuất sắc nhất giải", featured: true },
  { name: "La Liga", scope: "club", years: ["2022/23", "2024/25", "2025/26"] },
  { name: "Copa del Rey", scope: "club", years: ["2024/25"] },
  { name: "Supercopa de España", scope: "club", years: ["2025", "2026"] },
];

// Totals derived from the list above (used by the hero and the trophies section).
export const TEAM_TITLE_COUNT = TROPHIES.reduce((n, t) => n + t.years.length, 0);
export const COUNTRY_TITLE_COUNT = TROPHIES.filter((t) => t.scope === "country").reduce(
  (n, t) => n + t.years.length,
  0,
);

export const AWARDS: [string, string][] = [
  ["Golden Boy", "2024"],
  ["Kopa Trophy ×2", "2024 · 2025"],
  ["EURO Young Player", "2024"],
  ["Laureus Breakthrough", "2025"],
  ["La Liga Player of the Season", "2025/26"],
];

export type Video = { youtube: string; title: string; source: string; length?: string };

// The clip that loops, muted, behind the home page's highlights section.
export const HIGHLIGHT_LOOP: Video = {
  youtube: "WXpSDZzRCPI",
  title: "Rabona trước Galatasaray",
  source: "Jens E",
};

export const HIGHLIGHTS: Video[] = [
  {
    youtube: "MZ5z-dLhjUE",
    title: "From La Masia to First Team — Best of Lamine Yamal",
    source: "FC Barcelona",
    length: "5:27",
  },
  {
    youtube: "M37orXBtvtg",
    title: "Tất cả bàn thắng của Lamine Yamal năm 2025",
    source: "FC Barcelona",
    length: "18:56",
  },
  { youtube: "cQQsgMpy2cA", title: "Best of Lamine Yamal mùa 2025/26", source: "FC Barcelona", length: "14:00" },
  { youtube: "GeONdafonl4", title: "Lamine Yamal — The Movie", source: "LALIGA", length: "10:20" },
  { youtube: "30mr4mGaI5A", title: "Cậu bé 16 tuổi khiến tuyển Pháp gục ngã", source: "Number 9", length: "16:25" },
  {
    youtube: "8Wa2p3Tz7Ts",
    title: "Từ La Masia tới chung kết World Cup: Messi & Lamine",
    source: "FC Barcelona",
    length: "9:50",
  },
  {
    youtube: "CxumhgRBmP8",
    title: "Ngày Yamal 15 tuổi vào sân và thay đổi trận đấu",
    source: "ArtSoccer",
    length: "10:52",
  },
  { youtube: "FY8ASN1VV-8", title: "Top 10 bàn thắng", source: "NecbY Football", length: "4:39" },
  { youtube: "FJjRJbRPExM", title: "100+ pha xử lý kỹ thuật", source: "DX10HD3", length: "10:00" },
];

export const CHILDHOOD_VIDEOS: Video[] = [
  {
    youtube: "xzehnfQTM94",
    title: "Lamine 13 tuổi — đã có mọi thứ của một ngôi sao",
    source: "Reykob 7.0",
    length: "14:20",
  },
  { youtube: "f3x_xKWfpiU", title: "Lamine & Pau Cubarsí năm 11 tuổi", source: "Maximum Pro", length: "9:19" },
  { youtube: "kiHljIHu1wU", title: "Lamine 12 tuổi", source: "SV2", length: "16:34" },
  { youtube: "l7whDJSE1HU", title: "Alevín A, mùa 2018/19", source: "La Masia Talents", length: "4:25" },
  { youtube: "-NDXPL64KOI", title: "Trận đấu năm 11 tuổi", source: "ArtSoccer", length: "12:58" },
  {
    youtube: "XxjVxxfrnj0",
    title: "Trận đấu hay nhất ở La Masia (full match)",
    source: "FC Barcelona",
    length: "56:25",
  },
];

export type Photo = { caption: string; year: string; src?: string };

// Archive reel. Replace `src` with your own photos (e.g. "/images/archive/01.jpg").
export const ARCHIVE_PHOTOS: Photo[] = [
  { year: "2007", caption: "Buổi chụp lịch từ thiện cùng Messi tại Camp Nou" },
  { year: "2010", caption: "Những trận bóng đầu tiên trên sân Rocafonda" },
  { year: "2014", caption: "Ngày đầu ở La Masia" },
  { year: "2017", caption: "Benjamín A — cậu bé thuận chân trái" },
  { year: "2019", caption: "Alevín A, giải trẻ quốc tế" },
  { year: "2021", caption: "Cadete A, đá vượt tuổi" },
  { year: "2022", caption: "Juvenil A — UEFA Youth League" },
  { year: "2023", caption: "Buổi tập đầu tiên với đội một" },
];

// Photos for the spinning gallery behind the hero title.
// For now these are thumbnails of the YouTube videos featured on the site (mostly
// FC Barcelona, LALIGA and UEFA uploads). To use your own photos, put files in
// /public/images/hero/ and list them here instead, e.g. "/images/hero/01.jpg".
// hqdefault is ~30KB (vs ~375KB for hq720). It is 4:3 with black bars; the gallery
// cover-fits it into 16:9, which crops the bars off exactly.
const yt = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const HERO_IMAGES: string[] = [
  "cQQsgMpy2cA",
  "GeONdafonl4",
  "lACgOT_5zNU",
  "61H0uDv3WTg",
  "8Wa2p3Tz7Ts",
  "JfP7zfeQrG4",
  "M37orXBtvtg",
  "J0s6gT8OCJc",
  "CzWXyBmwKTc",
  "FJjRJbRPExM",
  "KMpRz2q-w_Y",
  "EV7gjjAM4bc",
  "MZ5z-dLhjUE",
  "bUMVUC2uQJY",
  "iMvXat8xQos",
  "_UVK0h72UB0",
  "CxumhgRBmP8",
  "4z-s3zRku20",
  "p_aSpG4jZSU",
  "qTaeQXFYa34",
  "Ftu--ea1haE",
  "MIKSbfmUXSE",
  "rOkllIBU2do",
  "FY8ASN1VV-8",
].map(yt);

// Shirt stripes used for placeholders and accents.
export const STRIPES = ["var(--accent)", "var(--garnet)"];
