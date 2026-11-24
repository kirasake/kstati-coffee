# Границы, решённые в спецификации

## Файлы проекта (корень репозитория)
| Файл | Владеет | Кто пишет |
|---|---|---|
| `assets/img/*` | все изображения | T01 |
| `assets/img/CREDITS.md` | файл → промпт, модель | T01 |
| `index.html` | разметка всех 10 секций, весь текст, подключение шрифтов/CDN | T02 |
| `css/styles.css` | токены, вёрстка, адаптив, начальные состояния | T02; T03 дописывает только блок `/* === motion === */` в конце |
| `js/menu-data.js` | `window.KSTATI_MENU` | T02 |
| `js/main.js` | вкладки меню, бургер, «открыто/закрыто», карусель отзывов (без анимаций), год | T02 |
| `js/motion.js` | все анимации: прелоадер, Lenis, GSAP, параллакс, пар, бегущая строка, пин, reveal, магниты, наклон карточек | T03 |

Порядок подключения в конце `<body>`: CDN GSAP, ScrollTrigger, Lenis (все `defer`), затем `js/menu-data.js`, `js/main.js`, `js/motion.js` (`defer`). `motion.js` проверяет `window.gsap` и при его отсутствии ничего не делает, кроме снятия прелоадера.

## Имена изображений (контракт T01 ↔ T02)
Вырезы первого экрана — PNG с прозрачным фоном, ~1024 px:
`hero-cappuccino.png` (капучино строго сверху, латте-арт), `hero-iced-latte.png` (высокий стакан айс-латте сбоку), `hero-lemonade.png` (лимонад киви–лайм в стакане), `hero-beans.png` (горсть зёрен), `hero-lime-mint.png` (долька лайма и листья мяты).

Меню — 4:5, `.jpg`, единый фон (светлый лён/светлое дерево, тёплый мягкий свет, ракурс 3/4):
`menu-espresso.jpg`, `menu-americano.jpg`, `menu-cappuccino.jpg`, `menu-latte.jpg`, `menu-raf.jpg`, `menu-flat-white.jpg`, `menu-glace.jpg`, `menu-mocha.jpg`, `menu-matcha.jpg`, `menu-cocoa.jpg`,
`menu-iced-latte.jpg`, `menu-iced-matcha.jpg`, `menu-bumble.jpg`, `menu-espresso-tonic.jpg`, `menu-iced-raf.jpg`,
`menu-lemonade-kiwi-lime.jpg`, `menu-lemonade-mango-passion.jpg`, `menu-lemonade-raspberry-lemon.jpg`, `menu-lemonade-cherry-bubblegum.jpg`.

Атмосфера — `.jpg`:
`about-embankment.jpg` 4:5 (летняя площадка кофейни с зонтиками на набережной реки, без вывесок и текста), `about-sizes.jpg` 4:5 (ряд больших стаканов айс-напитков и лимонадов), `about-dog.jpg` 4:5 (собака у столика с кофе с собой), `day-morning.jpg` 4:5 (эспрессо, утренний свет у реки), `day-noon.jpg` 4:5 (айс-латте на парапете набережной, яркое солнце), `day-evening.jpg` 4:5 (лимонад на закате у реки), `day-night.jpg` 4:5 (какао, ночные огни набережной и моста), `visit-terrace.jpg` 16:9 (общий вид террасы у реки), `visit-barista.jpg` 4:5 (руки бариста наливают латте-арт), `banner-cups.jpg` 21:9 (ряд стаканов кофе и лимонадов на каменном парапете набережной, река и мост на фоне, тёплый вечер), `og-cover.jpg` 1200×630 (обложка для соцсетей — может быть кадрированной копией `visit-terrace`).

Файл, который T01 не смог сделать, не подменяется чужим: T01 сообщает о нём в отчёте.

## `window.KSTATI_MENU` (js/menu-data.js)
```js
window.KSTATI_MENU = [
  { id: "classic", title: "Классика", items: [ { name: "Эспрессо", volume: "36 мл", price: 179, img: "assets/img/menu-espresso.jpg" } /* … */ ] },
  { id: "iced", title: "Айс кофе", items: [ /* … */ ] },
  { id: "lemonades", title: "Лимонады", items: [ /* … */ ] }
];
```
Цены — числа, ровно как в `menu-yandex.md`. HTML меню содержит те же данные статически.

## Хуки для анимаций (контракт T02 ↔ T03)
T02 ставит атрибуты; T03 только читает их и не меняет разметку и тексты:
- `data-preloader` — корень прелоадера (стакан SVG с `data-preloader-fill`). Без `html.js` он скрыт CSS-ом.
- `data-header`; `data-burger`, `data-mobile-menu` (T02 переключает `aria-expanded` и класс `is-open`; T03 может анимировать по событию `menu-mobile:toggle` с `detail.open`).
- `data-hero`; `data-hero-item` (+ `data-depth="0.2…1"`) на каждом вырезе; `data-steam` — SVG пара над капучино (3 пути `path`).
- `data-count="4.9"` + `data-decimals="1"` — число, которое досчитывает (в HTML уже стоит итоговое значение).
- `data-marquee` с дочерним `data-marquee-track` (контент продублирован дважды).
- `data-reveal="words|lines|fade|mask|stagger"`.
- `data-magnetic` — магнитные кнопки.
- `data-menu-tabs`; `data-menu-tab="classic|iced|lemonades"`; `data-menu-panel="…"`; `data-menu-card`. T02 при клике шлёт `document.dispatchEvent(new CustomEvent("menu:change",{detail:{from,to,fromPanel,toPanel}}))`; если `event.defaultPrevented` после диспатча — T02 сам не переключает (переключает T03, вызвав `window.KSTATI.showMenuPanel(to)` в нужный момент). Иначе T02 переключает мгновенно.
- `data-day` — секция; `data-day-track`; `data-day-panel` (+ `data-bg="#hex"`, `data-time="09:00"`); `data-day-clock`.
- `data-highlights`; `data-banner` (+ `data-parallax` на фото баннера).
- `data-reviews`, `data-review`; карусель листает T02 через `window.KSTATI.goToReview(i)`, шлёт `reviews:change` `{from,to}`.
- `html.js` ставится инлайн-скриптом в `<head>`. Скрытые начальные состояния анимаций задаёт T03 в блоке motion **только** под `html.js.motion-ok` (класс `motion-ok` ставит `motion.js`, если gsap загружен и нет reduced-motion).
- `window.KSTATI` — объект API от `main.js`: `{ showMenuPanel(id), goToReview(i) }`.

## Правила проекта
- Внешние скрипты только cdnjs / unpkg с точной версией: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`, `…/3.12.5/ScrollTrigger.min.js`, `https://unpkg.com/lenis@1.1.13/dist/lenis.min.js`; шрифты — Google Fonts.
- Ни одного выдуманного факта о кофейне: только `menu-yandex.md`.
- Футер всегда несёт пометку «Концепт-сайт для портфолио…».
- Тексты на русском; имена классов/функций — английские.

## Команды
- Проверка (одна команда): `node tools/check.mjs` — создаёт T02. Node 26 установлен.
- Локальный просмотр: `npx --yes http-server -p 5173 -c-1 .` или `py -3 -m http.server 5173` из корня.
- Higgsfield CLI (`higgsfield`) установлен и авторизован; Python — `py -3` (не `python3`).
