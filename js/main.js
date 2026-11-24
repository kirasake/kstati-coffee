/* main.js — поведение без анимаций: вкладки меню, бургер, «открыто/закрыто»,
   карусель отзывов, год, заглушки для незагруженных фото.
   Выставляет window.KSTATI = { showMenuPanel(id), goToReview(i) }. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var KSTATI = (window.KSTATI = window.KSTATI || {});

  /* ---------- Фото: бежевая заглушка, если файла нет ---------- */
  function markMissing(img) {
    var box = img.closest(".media, .hero__item");
    if (box) box.classList.add("is-missing");
  }
  Array.prototype.forEach.call(doc.images, function (img) {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) markMissing(img);
    img.addEventListener("error", function () { markMissing(img); });
    img.addEventListener("load", function () {
      var box = img.closest(".media, .hero__item");
      if (box) box.classList.remove("is-missing");
    });
  });

  /* ---------- Шапка: фон при прокрутке ---------- */
  var header = doc.querySelector("[data-header]");
  function onScroll() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Бургер и мобильное меню ---------- */
  var burger = doc.querySelector("[data-burger]");
  var mobileMenu = doc.querySelector("[data-mobile-menu]");
  function setMobileMenu(open) {
    if (!burger || !mobileMenu) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    mobileMenu.classList.toggle("is-open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
    if ("inert" in mobileMenu) mobileMenu.inert = !open;
    root.classList.toggle("menu-open", open);
    if (open && header) header.classList.remove("is-hidden");
    doc.dispatchEvent(new CustomEvent("menu-mobile:toggle", { detail: { open: open } }));
  }
  if (burger && mobileMenu) {
    if ("inert" in mobileMenu) mobileMenu.inert = true;
    burger.addEventListener("click", function () {
      setMobileMenu(burger.getAttribute("aria-expanded") !== "true");
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMobileMenu(false);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setMobileMenu(false);
        burger.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) {
      if (mq.matches) setMobileMenu(false);
    });
  }

  /* ---------- Вкладки меню ---------- */
  var tablist = doc.querySelector("[data-menu-tabs]");
  var tabs = Array.prototype.slice.call(doc.querySelectorAll("[data-menu-tab]"));
  var panels = Array.prototype.slice.call(doc.querySelectorAll("[data-menu-panel]"));
  var pill = tablist && tablist.querySelector(".menu__tabs-pill");
  var activeTab = tabs.length ? tabs[0].getAttribute("data-menu-tab") : null;

  function panelById(id) { return doc.querySelector('[data-menu-panel="' + id + '"]'); }
  function tabById(id) { return doc.querySelector('[data-menu-tab="' + id + '"]'); }

  function movePill() {
    var tab = tabById(activeTab);
    if (!pill || !tab) return;
    pill.style.setProperty("--pill-x", tab.offsetLeft + "px");
    pill.style.setProperty("--pill-w", tab.offsetWidth + "px");
  }

  function selectTab(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-menu-tab") === id;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    activeTab = id;
    movePill();
  }

  // Показ панели — публичный: motion.js вызывает его в середине каскада.
  KSTATI.showMenuPanel = function (id) {
    if (!panelById(id)) return;
    panels.forEach(function (p) { p.hidden = p.getAttribute("data-menu-panel") !== id; });
    if (activeTab !== id) selectTab(id);
  };

  function requestTab(to) {
    var from = activeTab;
    if (!to || to === from) return;
    selectTab(to);
    var evt = new CustomEvent("menu:change", {
      cancelable: true,
      detail: { from: from, to: to, fromPanel: panelById(from), toPanel: panelById(to) }
    });
    doc.dispatchEvent(evt);
    if (!evt.defaultPrevented) KSTATI.showMenuPanel(to);
  }

  if (tabs.length && panels.length) {
    KSTATI.showMenuPanel(activeTab);
    root.classList.add("tabs-ready");
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { requestTab(tab.getAttribute("data-menu-tab")); });
      tab.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (e.key === "Home") dir = -i;
        if (e.key === "End") dir = tabs.length - 1 - i;
        if (!dir) return;
        e.preventDefault();
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        next.focus();
        requestTab(next.getAttribute("data-menu-tab"));
      });
    });
    movePill();
    window.addEventListener("resize", movePill);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(movePill);
  }

  /* ---------- Открыто / закрыто (Ростов-на-Дону, UTC+3) ---------- */
  var statuses = doc.querySelectorAll("[data-open-status]");
  function updateStatus() {
    var now = new Date();
    var h = (now.getUTCHours() + 3) % 24;
    var open = h >= 9; // 09:00–00:00
    Array.prototype.forEach.call(statuses, function (el) {
      el.classList.toggle("is-open", open);
      el.classList.toggle("is-closed", !open);
      var t = el.querySelector(".status__text");
      if (t) t.textContent = open ? "Сейчас открыто · до 00:00" : "Сейчас закрыто · откроемся в 09:00";
    });
  }
  if (statuses.length) {
    updateStatus();
    setInterval(updateStatus, 60 * 1000);
  }

  /* ---------- Карусель отзывов ---------- */
  var carousel = doc.querySelector("[data-reviews]");
  if (carousel) {
    var track = carousel.querySelector(".reviews__track");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll("[data-review]"));
    var dotsBox = carousel.querySelector("[data-reviews-dots]");
    var prev = carousel.querySelector("[data-reviews-prev]");
    var next = carousel.querySelector("[data-reviews-next]");
    var current = 0;
    var dots = [];

    slides.forEach(function (_, i) {
      var b = doc.createElement("button");
      b.type = "button";
      b.className = "reviews__dot";
      b.setAttribute("aria-label", "Отзыв " + (i + 1));
      b.addEventListener("click", function () { KSTATI.goToReview(i); });
      dotsBox && dotsBox.appendChild(b);
      dots.push(b);
    });

    function render(offsetPx) {
      var x = -current * 100;
      track.style.transform = offsetPx
        ? "translateX(calc(" + x + "% + " + offsetPx + "px))"
        : "translateX(" + x + "%)";
      slides.forEach(function (s, i) {
        s.setAttribute("aria-hidden", String(i !== current));
        if ("inert" in s) s.inert = i !== current;
      });
      dots.forEach(function (d, i) {
        if (i === current) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }

    KSTATI.goToReview = function (i) {
      var n = slides.length;
      var to = ((i % n) + n) % n;
      var from = current;
      current = to;
      render(0);
      if (from !== to) doc.dispatchEvent(new CustomEvent("reviews:change", { detail: { from: from, to: to } }));
    };

    prev && prev.addEventListener("click", function () { KSTATI.goToReview(current - 1); });
    next && next.addEventListener("click", function () { KSTATI.goToReview(current + 1); });
    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") KSTATI.goToReview(current - 1);
      if (e.key === "ArrowRight") KSTATI.goToReview(current + 1);
    });

    // Перетаскивание мышью и пальцем
    var startX = 0, startY = 0, dx = 0, dragging = false, decided = false;
    track.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      dragging = true; decided = false; dx = 0;
      startX = e.clientX; startY = e.clientY;
    });
    window.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var mx = e.clientX - startX, my = e.clientY - startY;
      if (!decided) {
        if (Math.abs(mx) < 6 && Math.abs(my) < 6) return;
        decided = true;
        if (Math.abs(my) > Math.abs(mx)) { dragging = false; return; }
        track.classList.add("is-dragging");
      }
      dx = mx;
      var edge = (current === 0 && dx > 0) || (current === slides.length - 1 && dx < 0);
      render(edge ? dx * 0.35 : dx);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      track.classList.remove("is-dragging");
      var w = track.parentNode.offsetWidth || 1;
      if (Math.abs(dx) > Math.min(90, w * 0.18)) KSTATI.goToReview(current + (dx < 0 ? 1 : -1));
      else render(0);
      dx = 0;
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    track.addEventListener("dragstart", function (e) { e.preventDefault(); });

    render(0);
  } else {
    KSTATI.goToReview = function () {};
  }

  /* ---------- Год в футере ---------- */
  var year = doc.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
