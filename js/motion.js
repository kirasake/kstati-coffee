/* motion.js — все анимации: прелоадер, Lenis, GSAP + ScrollTrigger, параллакс,
   пар, бегущая строка, пин «День на набережной», reveal, магниты, наклон карточек.
   Без GSAP или при prefers-reduced-motion — только снимает прелоадер. */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var preloader = doc.querySelector("[data-preloader]");

  function hidePreloader() {
    if (!preloader) return;
    preloader.style.animation = "none";
    preloader.style.display = "none";
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!gsap || !ScrollTrigger || reduce) { hidePreloader(); return; }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add("motion-ok");

  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var lenis = null;

  try {
    init();
  } catch (err) {
    // Аварийный выход: ничего не должно остаться скрытым.
    console.warn("[motion] отключено:", err);
    ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    gsap.globalTimeline.clear();
    gsap.set($$("[data-reveal], [data-reveal] *, [data-hero] *, [data-menu-card], [data-day-track]"), { clearProps: "all" });
    var day = $("[data-day]");
    if (day) day.classList.remove("is-pinned");
    if (lenis) lenis.destroy();
    root.classList.remove("motion-ok");
    hidePreloader();
  }

  function init() {
    setupLenis();
    var heroTl = setupHero();
    setupPreloader(heroTl);
    setupReveals();
    setupMarquee();
    setupMenu();
    setupDay();
    setupBanner();
    setupReviews();
    setupMagnetic();
    setupHeader();

    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Инерционная прокрутка ---------- */
  function setupLenis() {
    if (typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    doc.addEventListener("menu-mobile:toggle", function (e) {
      if (e.detail && e.detail.open) lenis.stop(); else lenis.start();
    });
  }

  // Якоря — плавно и с учётом шапки (с Lenis и без него)
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !root.classList.contains("motion-ok")) return;
    var hash = a.getAttribute("href");
    if (hash.length < 2) return;
    var target = hash === "#top" ? 0 : doc.querySelector(hash);
    if (target === null) return;
    e.preventDefault();
    var header = $("[data-header]");
    var offset = header ? -header.offsetHeight + 1 : 0;
    if (lenis) {
      lenis.scrollTo(target, { offset: target === 0 ? 0 : offset, duration: 1.6 });
    } else {
      var y = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    if (history.replaceState) history.replaceState(null, "", hash);
  });

  /* ---------- Разбиение текста на слова ---------- */
  function splitWords(el) {
    if (el._words) return el._words;
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/([ \t\n\r]+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(doc.createTextNode(" ")); return; }
            var outer = doc.createElement("span");
            outer.className = "split-w";
            var inner = doc.createElement("span");
            inner.textContent = part;
            outer.appendChild(inner);
            frag.appendChild(outer);
            words.push(inner);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR" && child.tagName !== "WBR") {
          walk(child);
        }
      });
    })(el);
    el._words = words;
    return words;
  }

  function countUp(el, delay) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var obj = { v: 0 };
    var fmt = function (v) { return v.toFixed(dec).replace(".", ","); };
    el.textContent = fmt(0);
    return gsap.to(obj, {
      v: target, duration: 1.8, delay: delay || 0, ease: "power3.out",
      onUpdate: function () { el.textContent = fmt(obj.v); },
      onComplete: function () { el.textContent = fmt(target); }
    });
  }

  /* ---------- Первый экран ---------- */
  function setupHero() {
    var hero = $("[data-hero]");
    var tl = gsap.timeline({ paused: true });
    if (!hero) return tl;

    var items = $$("[data-hero-item]", hero);
    var imgs = items.map(function (it) { return it.querySelector("img"); });
    var title = $(".hero__title", hero);
    var titleWords = title ? splitWords(title) : [];
    var script = $(".hero__script", hero);
    var rest = $$(".hero__lead, .hero__actions, .rating-badge", hero);
    var count = $("[data-count]", hero);

    if (count) count.textContent = "0,0";
    tl.from(imgs, {
      autoAlpha: 0, scale: 0.55, yPercent: 35,
      rotation: function (i) { return i % 2 ? 14 : -14; },
      duration: 1.4, ease: "expo.out", stagger: 0.09
    }, 0)
      .from(script, { autoAlpha: 0, y: 24, rotation: -8, duration: 1.1, ease: "power3.out" }, 0.1)
      .from(titleWords, { yPercent: 115, duration: 1.25, ease: "expo.out", stagger: 0.075 }, 0.15)
      .from(rest, { autoAlpha: 0, y: 34, duration: 1.1, ease: "power3.out", stagger: 0.1 }, 0.5)
      .from(".hero__scroll", { autoAlpha: 0, duration: 0.8 }, 1);
    if (count) tl.add(function () { countUp(count); }, 0.7);

    // Парение
    $$(".hero__float", hero).forEach(function (f, i) {
      gsap.to(f, {
        y: gsap.utils.random(-24, -12), rotation: gsap.utils.random(-4, 4),
        duration: gsap.utils.random(2.8, 4.4), ease: "sine.inOut",
        yoyo: true, repeat: -1, delay: i * 0.3
      });
    });

    // Пар над капучино
    $$("[data-steam] path", hero).forEach(function (p, i) {
      var len = p.getTotalLength ? p.getTotalLength() : 160;
      var seg = len * 0.45;
      gsap.set(p, { strokeDasharray: seg + " " + len * 2, strokeDashoffset: seg, opacity: 0 });
      var t = gsap.timeline({ repeat: -1, delay: i * 1.05, repeatDelay: 0.25 });
      t.to(p, { strokeDashoffset: -len, duration: 3.2, ease: "none" }, 0)
        .to(p, { opacity: 0.7, duration: 1.0, ease: "sine.out" }, 0)
        .to(p, { opacity: 0, duration: 1.3, ease: "sine.in" }, 1.9);
    });

    // Параллакс за курсором (только мышь)
    if (fine) {
      var movers = items.map(function (it) {
        var d = parseFloat(it.getAttribute("data-depth")) || 0.5;
        return {
          d: d,
          x: gsap.quickTo(it, "x", { duration: 1.1, ease: "power3.out" }),
          y: gsap.quickTo(it, "y", { duration: 1.1, ease: "power3.out" })
        };
      });
      hero.addEventListener("pointermove", function (e) {
        var nx = e.clientX / window.innerWidth - 0.5;
        var ny = e.clientY / window.innerHeight - 0.5;
        movers.forEach(function (m) { m.x(-nx * m.d * 80); m.y(-ny * m.d * 60); });
      });
      hero.addEventListener("pointerleave", function () {
        movers.forEach(function (m) { m.x(0); m.y(0); });
      });
    }

    // Разлёт при прокрутке
    var heroBox = hero.getBoundingClientRect();
    var out = gsap.timeline({
      scrollTrigger: { trigger: hero, start: "top top+=" + hero.offsetTop, end: "bottom top", scrub: 1 }
    });
    items.forEach(function (it) {
      var d = parseFloat(it.getAttribute("data-depth")) || 0.5;
      var r = it.getBoundingClientRect();
      var side = r.left + r.width / 2 < heroBox.left + heroBox.width / 2 ? -1 : 1;
      out.to(it, { yPercent: -60 - d * 110, xPercent: side * d * 45, rotation: side * d * 28, ease: "none" }, 0);
    });
    out.to(".hero__content", { yPercent: 18, autoAlpha: 0.15, ease: "none" }, 0);

    return tl;
  }

  /* ---------- Прелоадер ---------- */
  function setupPreloader(heroTl) {
    var skip = !preloader || root.classList.contains("preloader-skip") || performance.now() > 2600;
    if (skip) {
      hidePreloader();
      heroTl.play();
      return;
    }
    preloader.style.animation = "none";
    if (lenis) lenis.stop();
    window.scrollTo(0, 0);

    var fill = $("[data-preloader-fill]", preloader);
    var wave = $(".preloader__wave", preloader);
    var tl = gsap.timeline({
      onComplete: function () {
        hidePreloader();
        if (lenis) lenis.start();
      }
    });
    tl.from(".preloader__word, .preloader__script", { autoAlpha: 0, y: 14, duration: 0.6, ease: "power3.out", stagger: 0.08 }, 0)
      .fromTo(fill, { y: 96 }, { y: 0, duration: 0.95, ease: "power2.inOut" }, 0.05)
      .fromTo(wave, { x: 0 }, { x: 60, duration: 0.95, ease: "none" }, 0.05)
      .to(".preloader__inner", { yPercent: -30, autoAlpha: 0, duration: 0.6, ease: "power3.in" }, 1.0)
      .fromTo(preloader, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.75, ease: "expo.inOut" }, 1.05)
      .add(function () { heroTl.play(); }, 1.2);
  }

  /* ---------- Появление при прокрутке ---------- */
  function setupReveals() {
    $$("[data-reveal]").forEach(function (el) {
      if (el.closest("[data-hero]")) return;
      var type = el.getAttribute("data-reveal");
      var st = { trigger: el, start: "top 86%", once: true };

      if (type === "words") {
        gsap.from(splitWords(el), { yPercent: 115, rotation: 3, duration: 1.25, ease: "expo.out", stagger: 0.07, scrollTrigger: st });
      } else if (type === "lines") {
        var words = splitWords(el);
        gsap.set(words, { yPercent: 115 });
        ScrollTrigger.create({
          trigger: el, start: "top 88%", once: true,
          onEnter: function () {
            var tops = [];
            words.forEach(function (w) {
              var t = w.parentNode.offsetTop;
              if (tops.indexOf(t) < 0) tops.push(t);
            });
            words.forEach(function (w) {
              var line = tops.indexOf(w.parentNode.offsetTop);
              gsap.to(w, { yPercent: 0, duration: 1.1, ease: "expo.out", delay: 0.15 + line * 0.11 });
            });
          }
        });
      } else if (type === "fade") {
        gsap.from(el, { autoAlpha: 0, y: 40, duration: 1.2, ease: "power3.out", scrollTrigger: st });
      } else if (type === "mask") {
        var img = el.querySelector("img");
        var tl = gsap.timeline({ scrollTrigger: st });
        tl.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.out" }, 0);
        if (img) tl.from(img, { scale: 1.3, duration: 1.8, ease: "expo.out", clearProps: "transform" }, 0);
      } else if (type === "stagger") {
        gsap.from(el.children, { autoAlpha: 0, y: 70, duration: 1.15, ease: "expo.out", stagger: 0.12, scrollTrigger: st });
      }
    });
  }

  /* ---------- Бегущая строка: скорость и направление от прокрутки ---------- */
  function setupMarquee() {
    var box = $("[data-marquee]");
    var track = box && $("[data-marquee-track]", box);
    if (!track) return;
    var pos = 0, dir = 1, boost = 0, skew = 0, skewTarget = 0, active = false;
    var setX = gsap.quickSetter(track, "xPercent");
    var setSkew = gsap.quickSetter(track, "skewX", "deg");

    ScrollTrigger.create({
      trigger: box, start: "top bottom", end: "bottom top",
      onToggle: function (self) { active = self.isActive; },
      onUpdate: function (self) {
        var v = self.getVelocity();
        dir = self.direction;
        boost = Math.min(Math.abs(v) / 110, 16);
        skewTarget = gsap.utils.clamp(-7, 7, -v / 260);
      }
    });

    gsap.ticker.add(function (time, dt) {
      if (!active) return;
      var speed = 1.3 + boost;              // % ширины трека в секунду
      pos -= dir * speed * (dt / 1000);
      if (pos <= -50) pos += 50;
      if (pos > 0) pos -= 50;
      boost *= 0.93;
      skewTarget *= 0.9;
      skew += (skewTarget - skew) * 0.12;
      setX(pos);
      setSkew(skew);
    });
  }

  /* ---------- Меню: каскад вкладок и наклон карточек ---------- */
  function setupMenu() {
    var K = window.KSTATI || {};
    var current = null;

    doc.addEventListener("menu:change", function (e) {
      if (typeof K.showMenuPanel !== "function") return;
      e.preventDefault();
      if (current) current.progress(1);
      var d = e.detail;
      var oldCards = d.fromPanel ? $$("[data-menu-card]", d.fromPanel) : [];
      var newCards = d.toPanel ? $$("[data-menu-card]", d.toPanel) : [];
      current = gsap.timeline({ onComplete: function () { current = null; } });
      current.to(oldCards, { y: -28, autoAlpha: 0, duration: 0.38, ease: "power2.in", stagger: 0.025 })
        .add(function () {
          K.showMenuPanel(d.to);
          gsap.set(oldCards, { clearProps: "transform,opacity,visibility" });
          ScrollTrigger.refresh();
        })
        .fromTo(newCards,
          { y: 60, autoAlpha: 0, rotationX: -14, transformOrigin: "50% 100%" },
          { y: 0, autoAlpha: 1, rotationX: 0, duration: 1.0, ease: "expo.out", stagger: 0.055, clearProps: "transform" });
    });

    // Первое появление активной вкладки — каскадом
    var firstPanel = $("[data-menu-panel]:not([hidden])");
    if (firstPanel) {
      gsap.from($$("[data-menu-card]", firstPanel), {
        y: 70, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.06,
        scrollTrigger: { trigger: firstPanel, start: "top 85%", once: true }
      });
    }

    if (!fine) return;
    $$("[data-menu-card]").forEach(function (card) {
      var inner = card.querySelector(".menu-card__inner");
      if (!inner) return;
      var rx = gsap.quickTo(inner, "rotationX", { duration: 0.8, ease: "power3.out" });
      var ry = gsap.quickTo(inner, "rotationY", { duration: 0.8, ease: "power3.out" });
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * 12);
        rx(-py * 12);
      });
      card.addEventListener("pointerleave", function () { rx(0); ry(0); });
    });
  }

  /* ---------- День на набережной ---------- */
  function setupDay() {
    var day = $("[data-day]");
    var track = day && $("[data-day-track]", day);
    if (!track) return;
    var panels = $$("[data-day-panel]", day);
    var colors = panels.map(function (p) { return p.getAttribute("data-bg") || "#F4ECE1"; });
    var times = panels.map(function (p) { return p.getAttribute("data-time") || "09:00"; });
    var minutes = times.map(function (t) { var a = t.split(":"); return +a[0] * 60 + +a[1]; });
    var clock = $("[data-day-clock]", day);
    var digits = clock && $(".day__clock-digits", clock);
    var hourHand = clock && $(".day__hand--h", clock);
    var minHand = clock && $(".day__hand--m", clock);
    var shown = 0;
    var CREAM = "#F4ECE1", ESPRESSO = "#2B1B14";

    function luminance(rgb) {
      var m = gsap.utils.splitColor(rgb);
      var c = m.slice(0, 3).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    }
    function inkFor(bg) { return luminance(bg) < 0.2 ? CREAM : ESPRESSO; }
    function setHands(min) {
      if (hourHand) gsap.set(hourHand, { rotation: min * 0.5, svgOrigin: "32 32" });
      if (minHand) gsap.set(minHand, { rotation: min * 6, svgOrigin: "32 32" });
    }
    function flipTo(i) {
      if (!digits || i === shown) return;
      var down = i > shown;
      shown = i;
      gsap.timeline()
        .to(digits, { yPercent: down ? -100 : 100, duration: 0.22, ease: "power2.in" })
        .add(function () { digits.textContent = times[i]; })
        .fromTo(digits, { yPercent: down ? 100 : -100 }, { yPercent: 0, duration: 0.5, ease: "expo.out" });
    }
    setHands(minutes[0]);

    var mm = gsap.matchMedia();

    // Десктоп: пин + горизонтальная прокрутка + цвет по прогрессу
    mm.add("(min-width: 768px)", function () {
      day.classList.add("is-pinned");
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var move = gsap.to(track, { x: function () { return -dist(); }, ease: "none" });
      ScrollTrigger.create({
        trigger: day, start: "top top", end: function () { return "+=" + dist(); },
        pin: true, scrub: 1, animation: move, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) {
          var p = self.progress * (panels.length - 1);
          var i = Math.min(panels.length - 2, Math.floor(p));
          var t = p - i;
          var bg = gsap.utils.interpolate(colors[i], colors[i + 1], t);
          day.style.setProperty("--day-bg", bg);
          day.style.setProperty("--day-ink", inkFor(bg));
          setHands(gsap.utils.interpolate(minutes[i], minutes[i + 1], t));
          flipTo(Math.round(p));
        }
      });
      panels.forEach(function (p) {
        var img = p.querySelector("img");
        if (!img) return;
        gsap.fromTo(img, { xPercent: -7, scale: 1.18 }, {
          xPercent: 7, scale: 1.18, ease: "none",
          scrollTrigger: { trigger: p, containerAnimation: move, start: "left right", end: "right left", scrub: true }
        });
        gsap.from(p.querySelector(".day-panel__body"), {
          autoAlpha: 0, x: 80, duration: 1.1, ease: "expo.out",
          scrollTrigger: { trigger: p, containerAnimation: move, start: "left 75%", once: true }
        });
      });
      return function () {
        day.classList.remove("is-pinned");
        day.style.removeProperty("--day-bg");
        day.style.removeProperty("--day-ink");
      };
    });

    // Телефон: вертикальный список, цвет меняется по мере прокрутки
    mm.add("(max-width: 767px)", function () {
      panels.forEach(function (p, i) {
        ScrollTrigger.create({
          trigger: p, start: "top 60%", end: "bottom 60%",
          onToggle: function (self) {
            if (!self.isActive) return;
            gsap.to(day, { "--day-bg": colors[i], "--day-ink": inkFor(colors[i]), duration: 0.9, ease: "power2.out", overwrite: true });
            var from = { m: minutes[shown] };
            gsap.to(from, { m: minutes[i], duration: 0.9, ease: "power2.out", onUpdate: function () { setHands(from.m); } });
            flipTo(i);
          }
        });
        gsap.from(p, { autoAlpha: 0, y: 60, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: p, start: "top 88%", once: true } });
      });
      return function () {
        day.style.removeProperty("--day-bg");
        day.style.removeProperty("--day-ink");
      };
    });
  }

  /* ---------- Баннер: параллакс фото ---------- */
  function setupBanner() {
    var banner = $("[data-banner]");
    var img = banner && $("[data-parallax]", banner);
    if (!img) return;
    gsap.fromTo(img, { yPercent: -9 }, {
      yPercent: 9, ease: "none",
      scrollTrigger: { trigger: banner, start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  /* ---------- Отзывы ---------- */
  function setupReviews() {
    var box = $("[data-reviews]");
    var section = box && box.closest("section");
    var count = section && $("[data-count]", section);
    if (count) {
      count.textContent = "0,0";
      ScrollTrigger.create({ trigger: count, start: "top 85%", once: true, onEnter: function () { countUp(count); } });
    }
    if (box) {
      gsap.from(box, { autoAlpha: 0, y: 60, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: box, start: "top 85%", once: true } });
    }
    doc.addEventListener("reviews:change", function (e) {
      var slides = $$("[data-review]");
      var s = slides[e.detail.to];
      if (!s) return;
      var dir = e.detail.to > e.detail.from ? 1 : -1;
      gsap.fromTo($(".review__quote", s), { autoAlpha: 0, x: 60 * dir }, { autoAlpha: 1, x: 0, duration: 1.1, delay: 0.12, ease: "expo.out" });
      gsap.fromTo($(".review__by", s), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.3, ease: "power3.out" });
    });
  }

  /* ---------- Магнитные кнопки ---------- */
  function setupMagnetic() {
    if (!fine) return;
    $$("[data-magnetic]").forEach(function (el) {
      var x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
      var y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * 0.3);
        y((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      el.addEventListener("pointerleave", function () {
        x(0);
        y(0);
      });
    });
  }

  /* ---------- Шапка прячется вниз, появляется вверх ---------- */
  function setupHeader() {
    var header = $("[data-header]");
    if (!header) return;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: function (self) {
        if (root.classList.contains("menu-open")) return;
        header.classList.toggle("is-hidden", self.direction === 1 && self.scroll() > 260);
      }
    });
  }
})();
