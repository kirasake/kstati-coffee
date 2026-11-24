#!/usr/bin/env node
// Проверка сайта «Кстати»: меню и цены против menu-yandex.md, ссылки на картинки,
// хуки data-* для анимаций, обязательные факты и пометка «концепт».
// Без зависимостей: node tools/check.mjs  → N passed / M failed, exit 1 при провале.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------- Ожидаемые данные (переписаны вручную из menu-yandex.md, 24.11.2026) ----------
const EXPECTED_MENU = [
  { id: "classic", title: "Классика", items: [
    ["Эспрессо", "36 мл", 179, "menu-espresso.jpg"],
    ["Американо", "250 мл", 195, "menu-americano.jpg"],
    ["Капучино", "250 мл", 215, "menu-cappuccino.jpg"],
    ["Латте", "250 мл", 229, "menu-latte.jpg"],
    ["Раф", "250 мл", 275, "menu-raf.jpg"],
    ["Флэт уайт", "250 мл", 235, "menu-flat-white.jpg"],
    ["Гляссе", "250 мл", 275, "menu-glace.jpg"],
    ["Мокко", "350 мл", 329, "menu-mocha.jpg"],
    ["Матча", "350 мл", 259, "menu-matcha.jpg"],
    ["Какао", "250 мл", 215, "menu-cocoa.jpg"],
  ] },
  { id: "iced", title: "Айс кофе", items: [
    ["Айс латте", "450 мл", 299, "menu-iced-latte.jpg"],
    ["Айс матча", "450 мл", 289, "menu-iced-matcha.jpg"],
    ["Бамбл апельсиновый/вишнёвый/гранатовый", "450 мл", 345, "menu-bumble.jpg"],
    ["Эспрессо тоник", "450 мл", 299, "menu-espresso-tonic.jpg"],
    ["Айс раф", "450 мл", 335, "menu-iced-raf.jpg"],
  ] },
  { id: "lemonades", title: "Лимонады", items: [
    ["Лимонад киви–лайм", "450 мл", 335, "menu-lemonade-kiwi-lime.jpg"],
    ["Лимонад манго–маракуйя", "450 мл", 335, "menu-lemonade-mango-passion.jpg"],
    ["Лимонад малина–лимон", "450 мл", 335, "menu-lemonade-raspberry-lemon.jpg"],
    ["Лимонад вишня–бабл-гам", "450 мл", 335, "menu-lemonade-cherry-bubblegum.jpg"],
  ] },
];

// Список имён изображений из interfaces.md
const ALLOWED_IMAGES = new Set([
  "hero-cappuccino.png", "hero-iced-latte.png", "hero-lemonade.png", "hero-beans.png", "hero-lime-mint.png",
  "menu-espresso.jpg", "menu-americano.jpg", "menu-cappuccino.jpg", "menu-latte.jpg", "menu-raf.jpg",
  "menu-flat-white.jpg", "menu-glace.jpg", "menu-mocha.jpg", "menu-matcha.jpg", "menu-cocoa.jpg",
  "menu-iced-latte.jpg", "menu-iced-matcha.jpg", "menu-bumble.jpg", "menu-espresso-tonic.jpg", "menu-iced-raf.jpg",
  "menu-lemonade-kiwi-lime.jpg", "menu-lemonade-mango-passion.jpg", "menu-lemonade-raspberry-lemon.jpg",
  "menu-lemonade-cherry-bubblegum.jpg",
  "about-embankment.jpg", "about-sizes.jpg", "about-dog.jpg",
  "day-morning.jpg", "day-noon.jpg", "day-evening.jpg", "day-night.jpg",
  "visit-terrace.jpg", "visit-barista.jpg", "banner-cups.jpg", "og-cover.jpg",
]);

const CDN = [
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js",
  "https://unpkg.com/lenis@1.1.13/dist/lenis.min.js",
];

// ---------- Мини-фреймворк ----------
let passed = 0;
const failures = [];
function check(name, fn) {
  try {
    const res = fn();
    if (res === true || res === undefined) passed++;
    else failures.push(`${name}: ${res}`);
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}
const read = (p) => {
  const full = join(root, p);
  if (!existsSync(full)) throw new Error(`нет файла ${p}`);
  return readFileSync(full, "utf8");
};
const decode = (s) => s
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;|&#160;| | /g, " ")
  .replace(/&ndash;/g, "–").replace(/&mdash;/g, "—").replace(/&amp;/g, "&")
  .replace(/&laquo;/g, "«").replace(/&raquo;/g, "»")
  .replace(/\s+/g, " ").trim();
const fmtPrice = (n) => `${n} ₽`;

let html = "";
try { html = read("index.html"); } catch (e) { failures.push(`index.html: ${e.message}`); }

// ---------- 1. Меню в HTML ----------
function parseHtmlMenu() {
  const panels = {};
  const parts = html.split(/data-menu-panel="/).slice(1);
  for (const part of parts) {
    const id = part.slice(0, part.indexOf('"'));
    const cards = part.split(/data-menu-card/).slice(1).map((chunk) => {
      const pick = (re) => { const m = chunk.match(re); return m ? decode(m[1]) : null; };
      return {
        name: pick(/class="menu-card__name"[^>]*>([\s\S]*?)<\/h\d>/),
        volume: pick(/class="menu-card__volume"[^>]*>([\s\S]*?)<\/span>/),
        price: pick(/class="menu-card__price"[^>]*>([\s\S]*?)<\/span>/),
        img: (chunk.match(/src="assets\/img\/([^"]+)"/) || [])[1] || null,
      };
    });
    panels[id] = cards;
  }
  return panels;
}

check("HTML: в меню ровно 19 карточек data-menu-card", () => {
  const n = (html.match(/data-menu-card(?![-\w])/g) || []).length;
  return n === 19 || `найдено ${n}`;
});

const htmlMenu = html ? parseHtmlMenu() : {};
for (const group of EXPECTED_MENU) {
  check(`HTML: панель «${group.title}» (${group.id}) — ${group.items.length} позиций`, () => {
    const cards = htmlMenu[group.id];
    if (!cards) return "панели нет";
    return cards.length === group.items.length || `карточек ${cards.length}`;
  });
  group.items.forEach(([name, volume, price, img], i) => {
    check(`HTML: ${group.id}#${i + 1} «${name}» ${volume} ${price} ₽`, () => {
      const c = (htmlMenu[group.id] || [])[i];
      if (!c) return "карточки нет";
      const errs = [];
      if (c.name !== name) errs.push(`название «${c.name}»`);
      if (c.volume !== volume) errs.push(`объём «${c.volume}»`);
      if (c.price !== fmtPrice(price)) errs.push(`цена «${c.price}»`);
      if (c.img !== img) errs.push(`фото ${c.img}`);
      return errs.length ? errs.join(", ") : true;
    });
  });
}

// ---------- 2. Меню в js/menu-data.js ----------
let dataMenu = null;
check("menu-data.js: выставляет window.KSTATI_MENU", () => {
  const src = read("js/menu-data.js");
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox);
  dataMenu = sandbox.window.KSTATI_MENU;
  return Array.isArray(dataMenu) || "KSTATI_MENU не массив";
});
check("menu-data.js: группы classic/iced/lemonades и 19 позиций, всё совпадает с Яндексом", () => {
  if (!dataMenu) return "нет данных";
  const errs = [];
  if (dataMenu.length !== 3) errs.push(`групп ${dataMenu.length}`);
  EXPECTED_MENU.forEach((g, gi) => {
    const d = dataMenu[gi];
    if (!d || d.id !== g.id || d.title !== g.title) { errs.push(`группа ${gi}: ${d && d.id}/${d && d.title}`); return; }
    if (d.items.length !== g.items.length) errs.push(`${g.id}: позиций ${d.items.length}`);
    g.items.forEach(([name, volume, price, img], i) => {
      const it = d.items[i] || {};
      if (it.name !== name || it.volume !== volume || it.price !== price || it.img !== `assets/img/${img}`)
        errs.push(`${g.id}#${i + 1}: ${JSON.stringify(it)}`);
    });
  });
  return errs.length ? errs.join("; ") : true;
});

// ---------- 3. Нет промо «1 ₽» ----------
check("Нет промо «1 ₽» (HTML и данные)", () => {
  const text = decode(html);
  if (/(^|[^\d])1\s*₽/.test(text)) return "в HTML есть «1 ₽»";
  if (/Попробуй лето/i.test(text)) return "в HTML есть промо-строка";
  if (dataMenu && dataMenu.some((g) => g.items.some((i) => i.price === 1))) return "в данных цена 1";
  return true;
});

// ---------- 4. Ссылки на изображения ----------
check("Каждая ссылка на assets/img/* — из списка interfaces.md", () => {
  const files = ["index.html", "css/styles.css"];
  const jsDir = join(root, "js");
  if (existsSync(jsDir)) for (const f of readdirSync(jsDir)) if (f.endsWith(".js")) files.push(`js/${f}`);
  const bad = [];
  let total = 0;
  for (const f of files) {
    if (!existsSync(join(root, f))) { bad.push(`нет ${f}`); continue; }
    const src = read(f);
    for (const m of src.matchAll(/assets\/img\/([\w.\-]+)/g)) {
      total++;
      if (!ALLOWED_IMAGES.has(m[1])) bad.push(`${f}: ${m[1]}`);
    }
  }
  if (bad.length) return bad.join(", ");
  return total > 0 || "ссылок на картинки нет вовсе";
});

// ---------- 5. Хуки data-* ----------
const HOOKS = [
  "data-preloader", "data-preloader-fill", "data-header", "data-burger", "data-mobile-menu",
  "data-hero", "data-hero-item", "data-depth", "data-steam", "data-count", "data-decimals",
  "data-marquee", "data-marquee-track", "data-reveal", "data-magnetic",
  "data-menu-tabs", "data-menu-tab", "data-menu-panel", "data-menu-card",
  "data-day", "data-day-track", "data-day-panel", "data-bg", "data-time", "data-day-clock",
  "data-highlights", "data-banner", "data-parallax", "data-reviews", "data-review",
];
for (const hook of HOOKS) {
  check(`Хук ${hook}`, () => new RegExp(`\\s${hook}(?=[\\s=>])`).test(html) || "нет в index.html");
}
check("Хуки: вкладки и панели classic/iced/lemonades", () => {
  const miss = [];
  for (const id of ["classic", "iced", "lemonades"]) {
    if (!html.includes(`data-menu-tab="${id}"`)) miss.push(`tab ${id}`);
    if (!html.includes(`data-menu-panel="${id}"`)) miss.push(`panel ${id}`);
  }
  return miss.length ? miss.join(", ") : true;
});
check("Хуки: 5 вырезов data-hero-item с data-depth", () => {
  const tags = html.match(/<[^>]*\sdata-hero-item[\s>][^>]*>|<[^>]*\sdata-hero-item\s[^>]*>/g) || [];
  const withDepth = tags.filter((t) => /data-depth="(0(\.\d+)?|1(\.0+)?)"/.test(t));
  return (tags.length === 5 && withDepth.length === 5) || `вырезов ${tags.length}, с глубиной ${withDepth.length}`;
});
check("Хуки: 4 панели дня с data-bg и data-time (09:00, 13:00, 18:00, 23:30)", () => {
  const tags = html.match(/<[^>]*\sdata-day-panel[\s>][^>]*>/g) || [];
  const times = tags.map((t) => (t.match(/data-time="([^"]+)"/) || [])[1]);
  const bgs = tags.filter((t) => /data-bg="#[0-9a-fA-F]{3,8}"/.test(t)).length;
  const ok = tags.length === 4 && bgs === 4 && times.join(",") === "09:00,13:00,18:00,23:30";
  return ok || `панелей ${tags.length}, data-bg ${bgs}, время ${times.join(",")}`;
});
check("Хуки: 3 отзыва data-review", () => {
  const n = (html.match(/\sdata-review(?=[\s>])/g) || []).length;
  return n === 3 || `отзывов ${n}`;
});
check("Хуки: пар data-steam — 3 пути", () => {
  const m = html.match(/<svg[^>]*data-steam[\s\S]*?<\/svg>/);
  if (!m) return "нет svg с data-steam";
  const n = (m[0].match(/<path/g) || []).length;
  return n === 3 || `путей ${n}`;
});
check("Хуки: значения data-reveal из списка", () => {
  const vals = [...html.matchAll(/data-reveal="([^"]*)"/g)].map((m) => m[1]);
  const bad = vals.filter((v) => !["words", "lines", "fade", "mask", "stagger"].includes(v));
  return bad.length ? `чужие: ${bad.join(",")}` : vals.length > 0 || "нет ни одного";
});
check("Хуки: бегущая строка продублирована дважды", () => {
  const m = html.match(/data-marquee-track[\s\S]*?<\/section>/);
  if (!m) return "нет трека";
  const n = (m[0].match(/class="marquee__group/g) || []).length;
  return n === 2 || `групп ${n}`;
});

// ---------- 6. Порядок секций ----------
check("Секции в порядке спецификации", () => {
  const order = ["data-preloader", 'id="header"', 'id="top"', 'id="marquee"', 'id="about"', 'id="highlights"',
    'id="menu"', 'id="day"', 'id="reviews"', 'id="contacts"', 'id="visit"', 'id="footer"'];
  let last = -1;
  for (const key of order) {
    const i = html.indexOf(key);
    if (i < 0) return `нет ${key}`;
    if (i < last) return `${key} не на своём месте`;
    last = i;
  }
  return true;
});

// ---------- 7. Факты и пометка ----------
const text = decode(html);
const FACTS = [
  ["Пометка «Концепт-сайт для портфолио»", () => /Концепт-сайт для портфолио\. Не является официальным сайтом кофейни/.test(text)],
  ["Телефон tel:+79953779121", () => html.includes('href="tel:+79953779121"')],
  ["Телефон текстом +7 (995) 377-91-21", () => text.includes("+7 (995) 377-91-21")],
  ["Часы 09:00", () => text.includes("09:00")],
  ["Часы 00:00", () => text.includes("00:00")],
  ["Адрес «Береговая ул., 12, Ростов-на-Дону»", () => text.includes("Береговая ул., 12, Ростов-на-Дону")],
  ["Карта Яндекса (виджет организации, lazy)", () => /<iframe[^>]*src="https:\/\/yandex\.ru\/map-widget\/v1\/\?oid=193387289977"[^>]*loading="lazy"|<iframe[^>]*loading="lazy"[^>]*src="https:\/\/yandex\.ru\/map-widget\/v1\/\?oid=193387289977"/.test(html)],
  ["«Построить маршрут» на карточку организации", () => html.includes('href="https://yandex.ru/maps/org/kstati/193387289977/"') && text.includes("Построить маршрут")],
  ["Рейтинг 4,9 и 128 оценок", () => text.includes("4,9") && text.includes("128 оценок")],
  ["Заголовок «Кофе с видом на Дон»", () => text.includes("Кофе с видом на Дон")],
  ["Баннер «Заходи, кстати»", () => text.includes("Заходи, кстати")],
  ["Сноска «Цены с Яндекс.Карт на 24.11.2026»", () => text.includes("Цены с Яндекс.Карт на 24.11.2026, могут отличаться")],
  ["Отзывы: Анютка♡, Анна Петухова, Ева Чистова", () => ["Анютка♡", "Анна Петухова", "Ева Чистова"].every((n) => text.includes(n))],
  ["Вкладки с role=tab и aria-selected", () => (html.match(/role="tab"/g) || []).length === 3 && html.includes('aria-selected="true"')],
  ["Скрипты CDN с точными версиями", () => CDN.every((u) => html.includes(`src="${u}"`))],
  ["Порядок скриптов: CDN → menu-data → main → motion", () => {
    const idx = [...CDN, "js/menu-data.js", "js/main.js", "js/motion.js"].map((s) => html.indexOf(`src="${s}"`));
    return idx.every((v, i) => v > 0 && (i === 0 || v > idx[i - 1]));
  }],
  ["Шрифты Playfair Display, Manrope, Marck Script", () => /fonts\.googleapis\.com\/css2\?[^"]*Playfair\+Display[^"]*/.test(html) && html.includes("Manrope") && html.includes("Marck+Script")],
  ["html.js ставится инлайн в <head>", () => /<head>[\s\S]*classList\.add\("js"\)[\s\S]*<\/head>/.test(html)],
];
for (const [name, fn] of FACTS) check(name, () => fn() || "не найдено");

// ---------- Итог ----------
for (const f of failures) console.log(`FAIL  ${f}`);
console.log(`\n${passed} passed / ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
