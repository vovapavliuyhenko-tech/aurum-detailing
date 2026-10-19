(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const fmt = n => n.toLocaleString('ru-RU').replace(/ | /g, ' ');

  /* ---------- Старт ---------- */
  const start = () => requestAnimationFrame(() => document.body.classList.add('is-loaded'));
  const heroImg = $('.hero__media img');
  if (heroImg.complete) start(); else { heroImg.addEventListener('load', start); setTimeout(start, 1200); }

  /* ---------- Появление при прокрутке ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .lines, #map').forEach(el => { if (!el.closest('.hero')) io.observe(el); });

  /* ---------- Шапка: тень, скрытие, активный раздел ---------- */
  const header = $('#header');
  const navLinks = $$('.nav a');
  const sections = navLinks.map(a => $(a.getAttribute('href')));
  let lastY = scrollY, ticking = false;
  const parallax = $$('[data-parallax]');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    if (!header.classList.contains('menu-open')) header.classList.toggle('is-hidden', y > 500 && y > lastY + 3);
    if (y < lastY - 3) header.classList.remove('is-hidden');
    lastY = y;
    // подсветка пункта меню
    const mid = innerHeight * 0.35;
    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < mid) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-active', i === cur));
    // параллакс картинок и первого экрана
    if (!reduce) {
      if (y < innerHeight) heroImg.style.translate = `0 ${(y * 0.18).toFixed(1)}px`;
      parallax.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.translate = `0 ${(p * -100 * +img.dataset.parallax).toFixed(2)}%`;
      });
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (open) header.classList.remove('is-hidden');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  navLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Блик за курсором и магнитные кнопки ---------- */
  if (fine && !reduce) {
    const hero = $('#hero'), glare = $('#glare');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      glare.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      glare.style.setProperty('--gy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
    $$('.magnet').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.15).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Тост ---------- */
  const toast = $('#toast');
  let toastTimer;
  const showToast = text => {
    toast.textContent = text;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 3200);
  };
  $$('[data-soon]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    showToast(`Ссылка на ${a.dataset.soon} появится после публикации контактов. Оставьте заявку — мы свяжемся с вами.`);
  }));

  /* ---------- Выпадающие списки ---------- */
  const selects = new Map();
  $$('.select').forEach(sel => {
    const btn = $('.select__btn', sel);
    const value = $('.select__value', sel);
    const input = $('input[type=hidden]', sel);
    const opts = $$('.select__opt', sel);
    let active = Math.max(0, opts.findIndex(o => o.getAttribute('aria-selected') === 'true'));
    const label = o => o.firstChild.textContent.trim();
    const highlight = i => { active = (i + opts.length) % opts.length; opts.forEach((o, k) => o.classList.toggle('is-active', k === active)); };
    const open = () => {
      $$('.select.is-open').forEach(s => s !== sel && s.classList.remove('is-open'));
      sel.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); highlight(active);
    };
    const close = () => { sel.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); };
    const choose = (i, silent) => {
      opts.forEach(o => o.setAttribute('aria-selected', 'false'));
      opts[i].setAttribute('aria-selected', 'true');
      value.textContent = label(opts[i]);
      if (input) input.value = label(opts[i]);
      active = i;
      close();
      if (!silent) btn.focus();
      sel.dispatchEvent(new CustomEvent('change', { detail: opts[i] }));
    };
    btn.addEventListener('click', () => (sel.classList.contains('is-open') ? close() : open()));
    opts.forEach((o, i) => { o.addEventListener('click', () => choose(i)); o.addEventListener('pointermove', () => highlight(i)); });
    sel.addEventListener('keydown', e => {
      const isOpen = sel.classList.contains('is-open');
      if (e.key === 'ArrowDown') { e.preventDefault(); isOpen ? highlight(active + 1) : open(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); isOpen ? highlight(active - 1) : open(); }
      else if ((e.key === 'Enter' || e.key === ' ') && isOpen) { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') close();
    });
    document.addEventListener('pointerdown', e => { if (!sel.contains(e.target)) close(); });
    selects.set(sel, { choose, byText: t => { const i = opts.findIndex(o => label(o) === t); if (i >= 0) choose(i, true); } });
  });

  /* ---------- Калькулятор ---------- */
  const priceEl = $('#price'), meta = $('#priceMeta');
  const svcSel = $('#svcSelect');
  let k = 1, base = 24000, svcName = 'Керамика', clsName = 'Средний класс', shown = 24000, anim;
  const roundTo = n => Math.round(n / 500) * 500;
  const render = () => {
    const target = roundTo(base * k);
    meta.textContent = `${clsName} · ${svcName}`;
    $('#calcForm').elements.calc.value = `${clsName} · ${svcName} · от ${fmt(target)} ₽`;
    cancelAnimationFrame(anim);
    if (reduce) { shown = target; priceEl.textContent = `от ${fmt(target)} ₽`; return; }
    const from = shown, t0 = performance.now(), dur = 650;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      shown = Math.round(from + (target - from) * e);
      priceEl.textContent = `от ${fmt(roundTo(shown))} ₽`;
      if (p < 1) anim = requestAnimationFrame(tick); else { shown = target; priceEl.textContent = `от ${fmt(target)} ₽`; }
    };
    anim = requestAnimationFrame(tick);
    priceEl.animate([{ transform: 'translateY(4px)', opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' });
  };
  $$('.cls').forEach(b => b.addEventListener('click', () => {
    $$('.cls').forEach(x => { x.classList.remove('is-active'); x.setAttribute('aria-checked', 'false'); });
    b.classList.add('is-active'); b.setAttribute('aria-checked', 'true');
    k = +b.dataset.k; clsName = b.dataset.name; render();
  }));
  svcSel.addEventListener('change', e => { base = +e.detail.dataset.price; svcName = e.detail.firstChild.textContent.trim(); render(); });
  render();

  // карточки услуг → подставляем услугу в калькулятор
  $$('.svc[data-service]').forEach(card => card.addEventListener('click', () => selects.get(svcSel).byText(card.dataset.service)));
  // кнопки «Записаться на диагностику» → тема в форме записи
  $$('[data-topic]').forEach(a => a.addEventListener('click', () => selects.get($('#topicSelect')).byText(a.dataset.topic)));

  /* ---------- Формы ---------- */
  const formatPhone = v => {
    let d = v.replace(/\D/g, '');
    if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
    d = d.slice(0, 10);
    const t = '(___) ___-__-__'.split('');
    let i = 0;
    for (let j = 0; j < t.length && i < d.length; j++) if (t[j] === '_') t[j] = d[i++];
    return { text: '+7 ' + t.join(''), digits: d };
  };
  $$('.phone').forEach(phone => {
    phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 '; });
    phone.addEventListener('blur', () => { if (phone.value.replace(/\D/g, '').length <= 1) phone.value = ''; });
    phone.addEventListener('input', () => {
      const { text, digits } = formatPhone(phone.value);
      phone.value = digits.length ? text.slice(0, text.search(/_|$/)).replace(/[\s()-]+$/, '') : '+7 ';
    });
  });
  $$('form.form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.elements.name, phone = form.elements.phone, consent = form.elements.consent;
      const okName = name.value.trim().length > 1;
      const okPhone = phone.value.replace(/\D/g, '').length === 11;
      name.closest('.field').classList.toggle('is-error', !okName);
      phone.closest('.field').classList.toggle('is-error', !okPhone);
      consent.closest('.consent').classList.toggle('is-error', !consent.checked);
      if (!okName || !okPhone || !consent.checked) {
        form.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 320 });
        return;
      }
      // Здесь подключается отправка заявки (CRM, Telegram-бот, почта)
      form.classList.add('is-sent');
      setTimeout(() => { form.reset(); form.classList.remove('is-sent'); }, 6000);
    });
    $$('.field input', form).forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('is-error')));
    form.elements.consent.addEventListener('change', e => e.target.closest('.consent').classList.remove('is-error'));
  });

  /* ---------- До / после ---------- */
  const cmp = $('#compare');
  let pos = 50, drag = false;
  const setPos = p => { pos = Math.max(0, Math.min(100, p)); cmp.style.setProperty('--pos', pos + '%'); cmp.setAttribute('aria-valuenow', Math.round(pos)); };
  const fromEvent = e => { const r = cmp.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
  cmp.addEventListener('pointerdown', e => { drag = true; cmp.classList.remove('is-anim'); cmp.setPointerCapture(e.pointerId); setPos(fromEvent(e)); });
  cmp.addEventListener('pointermove', e => { if (drag) setPos(fromEvent(e)); });
  ['pointerup', 'pointercancel'].forEach(t => cmp.addEventListener(t, () => { drag = false; }));
  cmp.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') setPos(pos - 5); if (e.key === 'ArrowRight') setPos(pos + 5); });
  new IntersectionObserver((en, o) => {
    if (!en[0].isIntersecting || reduce) return;
    o.disconnect();
    cmp.classList.add('is-anim');
    setTimeout(() => setPos(78), 300);
    setTimeout(() => setPos(24), 1350);
    setTimeout(() => setPos(50), 2400);
    setTimeout(() => cmp.classList.remove('is-anim'), 3500);
  }, { threshold: 0.6 }).observe(cmp);

  /* ---------- FAQ ---------- */
  const setOpen = (qa, open) => {
    const box = $('.qa__a', qa);
    qa.classList.toggle('is-open', open);
    $('.qa__q', qa).setAttribute('aria-expanded', String(open));
    box.style.height = open ? box.scrollHeight + 'px' : '0px';
  };
  $$('.qa').forEach(qa => {
    if (qa.classList.contains('is-open')) setOpen(qa, true);
    $('.qa__q', qa).addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      $$('.qa.is-open').forEach(o => o !== qa && setOpen(o, false));
      setOpen(qa, open);
    });
  });
  addEventListener('resize', () => $$('.qa.is-open .qa__a').forEach(b => { b.style.height = b.scrollHeight + 'px'; }));
  document.fonts && document.fonts.ready.then(() => $$('.qa.is-open .qa__a').forEach(b => { b.style.height = b.scrollHeight + 'px'; }));

  /* ---------- Счётчик «до 5 лет» ---------- */
  $$('[data-count]').forEach(el => {
    if (reduce) return;
    const target = +el.dataset.count;
    new IntersectionObserver((en, o) => {
      if (!en[0].isIntersecting) return;
      o.disconnect();
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / 1200);
        el.textContent = 'до ' + Math.max(1, Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 }).observe(el);
  });
})();
