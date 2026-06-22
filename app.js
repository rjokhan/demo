/* ══════════════════════════════════════════════════════
   QIZIL POMADA — BALANS KOMPLEKS  |  app.js
   ══════════════════════════════════════════════════════ */

// ═══════════════════════
//  CONFIG
// ═══════════════════════
const WEBHOOK = 'https://crm.qpdev.uz/webhook/lead';
const BUY_URL = 'https://ilmi.uz/collection/6';
const TG_URL  = 'https://t.me/qizilpomada_general';

// ── UTM helpers ──
function getUtm() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source:   p.get('utm_source')   || '',
    utm_medium:   p.get('utm_medium')   || '',
    utm_campaign: p.get('utm_campaign') || '',
    utm_term:     p.get('utm_term')     || '',
    utm_content:  p.get('utm_content')  || '',
  };
}

const PHOTOS = {
  1: 'media/cover-1.jpg',
  2: 'media/cover-2.jpg',
  3: 'media/cover-3.jpg',
  4: 'media/cover-4.jpg',
  5: 'media/cover-5.jpg',
};

const CARD_GRADIENTS = {
  1: 'linear-gradient(145deg, #6d28d9 0%, #a855f7 45%, #ec4899 100%)',
  2: 'linear-gradient(145deg, #0369a1 0%, #6366f1 45%, #818cf8 100%)',
  3: 'linear-gradient(145deg, #b91c1c 0%, #ea580c 45%, #fbbf24 100%)',
  4: 'linear-gradient(145deg, #047857 0%, #10b981 45%, #6ee7b7 100%)',
  5: 'linear-gradient(145deg, #4338ca 0%, #7c3aed 45%, #c084fc 100%)',
};

const LESSONS = [
  {
    id: 1, num: 'Dars 1', title: 'BARAKALI\nHAYOTGA\nOCHILISH', sub: 'Moliyaviy ong',
    video: 'media/lesson-1.mp4',
    points: [
      "Pul energiyasi nima?",
      "Nega ba'zi insonlarga pul oson keladi?",
      "Baraka va moliyaviy o'sish",
      "Pul bilan to'g'ri munosabat",
    ],
  },
  {
    id: 2, num: 'Dars 2', title: "UMR YO'LDOSHI\nBILAN\nMUNOSABAT", sub: "Oilaviy uyg'unlik",
    video: 'media/lesson-2.mp4',
    points: [
      "Erkak ayolni qachon qadrlaydi?",
      "Qanday gapirsangiz sizni eshitadi?",
      "Muhabbatni qanday saqlab qolish?",
      "Munosabatlardagi eng ko'p xatolar",
    ],
  },
  {
    id: 3, num: 'Dars 3', title: "O'ZIGA\nBO'LGAN\nMUNOSABAT", sub: 'Ichki kuch',
    video: 'media/lesson-3.mp4',
    points: [
      "O'zingizni qadrlash",
      "Ichki ishonchni tiklash",
      "Kuchli tomonlaringizni anglash",
      "Ayollik energiyasini uyg'otish",
    ],
  },
  {
    id: 4, num: 'Dars 4', title: 'FARZANDLAR\nBILAN\nMUNOSABAT', sub: 'Ona va farzand',
    video: 'media/lesson-4.mp4',
    points: [
      "Baxtli bola qanday tarbiyalanadi?",
      "Farzand bilan yaqinlikni kuchaytirish",
      "Kelajakdagi muvaffaqiyatga ta'sir",
      "Tarbiyadagi eng muhim qoidalar",
    ],
  },
  {
    id: 5, num: 'Dars 5', title: "MOLIYAVIY\nERKINLIK\nYO'LI", sub: "To'liq kursda",
    video: '', locked: true, points: [],
  },
  {
    id: 6, num: 'Bonus', title: "BALANS\nTO'LIQ\nKOMPLEKS", sub: '170 ta dars',
    video: '', locked: true, points: [],
  },
];

// ═══════════════════════
//  STATE
// ═══════════════════════
const _savedUser  = JSON.parse(localStorage.getItem('qpb_user') || 'null');
let user       = _savedUser || { name: '', phone: '' };
let phoneGiven = !!_savedUser;
let salesShown = !!localStorage.getItem('qpb_sales');
let pendingId  = 0;
let currentId  = 0;
let watched    = new Set(JSON.parse(localStorage.getItem('qpb_v3') || '[]'));

// ═══════════════════════
//  PLYR SETUP
// ═══════════════════════
let plyrInstance = null;

function initPlyr() {
  if (plyrInstance) return;
  plyrInstance = new Plyr('#mainVideo', {
    controls: [
      'play-large',
      'play', 'rewind', 'fast-forward',
      'progress', 'current-time', 'duration',
      'mute', 'volume', 'settings', 'fullscreen',
    ],
    seekTime: 10,
    volume: 1,
    muted: false,
    keyboard: { focused: true, global: false },
    tooltips: { controls: true, seek: true },
    settings: ['speed'],
    speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] },
    fullscreen: { enabled: true, fallback: true, iosNative: true },
    resetOnEnd: false,
    invertTime: false,
    toggleInvert: true,
    i18n: {
      play: 'Ijro etish',
      pause: 'To\'xtatish',
      mute: 'Ovozni o\'chirish',
      unmute: 'Ovozni yoqish',
      enterFullscreen: 'To\'liq ekran',
      exitFullscreen: 'Chiqish',
      speed: 'Tezlik',
      normal: 'Oddiy',
      rewind: '10 soniya orqaga',
      fastForward: '10 soniya oldinga',
    },
  });

  // Save position every 5 sec
  plyrInstance.on('timeupdate', () => {
    if (currentId && plyrInstance.currentTime > 2) {
      localStorage.setItem(`qpb_pos_${currentId}`, plyrInstance.currentTime.toFixed(1));
    }
  });

  // Mark watched on end + force seek bar to 100%
  plyrInstance.on('ended', () => {
    if (currentId) markWatched(currentId);
    const seekInput = document.querySelector('.plyr__progress input[type=range]');
    if (seekInput) seekInput.style.setProperty('--value', '100%');
  });

  // When player is hidden/shown trigger PiP logic
  plyrInstance.on('pause', () => {
    // do nothing — PiP handles scroll
  });
}

// ═══════════════════════
//  SESSION TIMER
// ═══════════════════════
const sessionStart  = Date.now();
const sessionTimeEl = document.getElementById('sessionTime');

setInterval(() => {
  const s  = Math.floor((Date.now() - sessionStart) / 1000);
  const m  = Math.floor(s / 60);
  const ss = s % 60;
  if (sessionTimeEl) {
    sessionTimeEl.textContent = String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }
}, 1000);

// ═══════════════════════
//  TOAST SYSTEM
// ═══════════════════════
const toastWrap = document.getElementById('toastWrap');
const _shownToasts = new Set();

function showToast(msg, { type = '', icon = '', once = '', duration = 4000 } = {}) {
  if (once && _shownToasts.has(once)) return;
  if (once) _shownToasts.add(once);

  const el = document.createElement('div');
  el.className = 'toast' + (type ? ` toast--${type}` : '');
  el.innerHTML = (icon ? `<span>${icon}</span>` : '') + `<span>${msg}</span>`;
  toastWrap.prepend(el);

  const timer = setTimeout(() => dismiss(el), duration);
  el.addEventListener('click', () => { clearTimeout(timer); dismiss(el); });

  function dismiss(node) {
    node.classList.add('toast--out');
    node.addEventListener('animationend', () => node.remove(), { once: true });
  }
}

// Idle marketing toast — fires once after 3 min of no interaction
let _idleTimer = null;
let _lastInteract = Date.now();

function resetIdle() { _lastInteract = Date.now(); }
['click', 'scroll', 'keydown', 'touchstart'].forEach(ev =>
  document.addEventListener(ev, resetIdle, { passive: true })
);

setInterval(() => {
  if (Date.now() - _lastInteract > 3 * 60 * 1000) {
    if (!phoneGiven) {
      showToast('Siz hali yerdasiz 😊 1-darsni boshlaymizmi?', { icon: '👇', once: 'idle-noreg' });
    } else if ([...watched].length === 0) {
      showToast('Darsni boshlashga tayyormisiz?', { icon: '▶', once: 'idle-nowatch' });
    }
    _lastInteract = Date.now(); // reset so it doesn't spam
  }
}, 30_000);

// ═══════════════════════
//  FORM VALIDATION
// ═══════════════════════
function validateName(val) {
  // Allow letters from Latin, Cyrillic, Uzbek (apostrophe for O'zbek), spaces, hyphens
  return /^[a-zA-Zа-яёА-ЯЁЀ-ӿʼ\s'\-]{2,50}$/.test(val.trim());
}

function validatePhone(raw) {
  const clean = raw.replace(/[\s\-\(\)\.]/g, '');
  if (!clean.startsWith('+')) return false;
  // Uzbekistan: +998 + 9 digits
  if (clean.startsWith('+998')) return /^\+998\d{9}$/.test(clean);
  // Russia / Kazakhstan: +7 + 10 digits
  if (clean.startsWith('+7')) return /^\+7\d{10}$/.test(clean);
  // Kyrgyzstan: +996 + 9 digits
  if (clean.startsWith('+996')) return /^\+996\d{9}$/.test(clean);
  // Tajikistan: +992 + 9 digits
  if (clean.startsWith('+992')) return /^\+992\d{9}$/.test(clean);
  // Generic fallback: + followed by 7–15 digits
  return /^\+\d{7,15}$/.test(clean);
}

// Auto-prepend + when typing phone
document.querySelectorAll('input[type="tel"]').forEach(el => {
  el.addEventListener('input', () => {
    const v = el.value.trim();
    if (v && !v.startsWith('+')) el.value = '+' + v.replace(/^\+*/, '');
  });
});

// ═══════════════════════
//  POPUP HELPERS
// ═══════════════════════
function openPop(id)  { document.getElementById(id)?.classList.remove('popup--hidden'); }
function closePop(id) { document.getElementById(id)?.classList.add('popup--hidden'); }

// ── Popup 1: Registration ──
document.getElementById('phoneForm').addEventListener('submit', e => {
  e.preventDefault();
  const nameVal  = e.target.name.value.trim();
  const phoneVal = e.target.phone.value.trim();
  const errEl    = document.getElementById('phoneError');

  if (!validateName(nameVal)) {
    errEl.textContent = 'Ismingizni faqat harflar bilan kiriting (kamida 2 ta)';
    e.target.name.focus();
    return;
  }
  if (!validatePhone(phoneVal)) {
    errEl.textContent = 'Telefon raqamni to\'liq kiriting, masalan: +998 77 307 32 22';
    e.target.phone.focus();
    return;
  }
  errEl.textContent = '';

  user.name  = nameVal;
  user.phone = phoneVal;
  phoneGiven = true;
  localStorage.setItem('qpb_user', JSON.stringify(user));
  hook({ event: 'demo_register', formname: 'popup1_registration', ...user });
  sendToCrm(nameVal, phoneVal, 'popup1_registration');

  // Pre-fill lock popup
  const lockNameEl  = document.getElementById('lockName');
  const lockPhoneEl = document.getElementById('lockPhone');
  if (lockNameEl)  lockNameEl.value  = nameVal;
  if (lockPhoneEl) lockPhoneEl.value = phoneVal;

  document.getElementById('popPhoneForm').style.display = 'none';
  document.getElementById('popHiName').textContent = nameVal.toUpperCase() + '!';
  document.getElementById('popPhoneGreeting').classList.add('is-active');

  setTimeout(() => {
    closePop('popPhone');
    document.getElementById('popPhoneForm').style.display = '';
    document.getElementById('popPhoneGreeting').classList.remove('is-active');
    if (pendingId) playLesson(pendingId);
  }, 1800);
});

document.getElementById('startAfterGreeting').addEventListener('click', () => {
  closePop('popPhone');
  if (pendingId) playLesson(pendingId);
});

// ── Popup 2: Sales ──
function closeSalesAndPlay() {
  salesShown = true;
  localStorage.setItem('qpb_sales', '1');
  closePop('popSales');
  if (pendingId) {
    const id = pendingId; pendingId = 0;
    if (phoneGiven) playLesson(id);
    else { pendingId = id; openPop('popPhone'); }
  }
}
document.getElementById('salesClose').addEventListener('click', closeSalesAndPlay);
document.getElementById('salesSkip').addEventListener('click',  closeSalesAndPlay);
document.getElementById('salesToPitch').addEventListener('click', () => {
  closePop('popSales'); pendingId = 0;
  document.getElementById('pitch').scrollIntoView({ behavior: 'smooth' });
});

// ── Popup 3: Lock ──
document.getElementById('lockClose').addEventListener('click', () => closePop('popLock'));
document.getElementById('lockToPitch').addEventListener('click', () => {
  closePop('popLock');
  document.getElementById('pitch').scrollIntoView({ behavior: 'smooth' });
  hook({ event: 'buy_click', formname: 'popup3_lock_pitch', ...user });
});
document.getElementById('lockForm').addEventListener('submit', e => {
  e.preventDefault();
  const nm = document.getElementById('lockName').value.trim()  || user.name;
  const ph = document.getElementById('lockPhone').value.trim() || user.phone;
  if (ph && !validatePhone(ph)) {
    document.getElementById('lockError').textContent = "To'g'ri telefon raqam kiriting";
    return;
  }
  document.getElementById('lockError').textContent = '';
  hook({ event: 'locked_interest', formname: 'popup3_locked_lesson', name: nm, phone: ph });
  sendToCrm(nm, ph, 'popup3_locked_lesson');
  closePop('popLock');
  showToast('Tez orada siz bilan bog\'lanamiz!', { icon: '✅', type: 'ok' });
});

['popSales', 'popLock'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', e => {
    if (e.target === document.getElementById(id)) closePop(id);
  });
});

// ═══════════════════════
//  RENDER GRID
// ═══════════════════════
function render() {
  const free        = LESSONS.filter(l => !l.locked);
  const maxUnlocked = [...watched].filter(wid => free.some(l => l.id === wid)).length;
  const done        = [...watched].filter(wid => free.some(l => l.id === wid)).length;

  document.getElementById('grid').innerHTML = LESSONS.map(l => {
    const isWatched = watched.has(l.id);
    const isLocked  = !!l.locked;
    const isBlocked = !isLocked && l.id > maxUnlocked + 1;
    const isPlaying = l.id === currentId;

    const cls = [
      'lcard',
      isWatched && !isPlaying ? 'lcard--watched' : '',
      isLocked  ? 'lcard--locked'  : '',
      isBlocked ? 'lcard--blocked' : '',
      isPlaying ? 'lcard--playing' : '',
    ].filter(Boolean).join(' ');

    const photoBg = PHOTOS[l.id]
      ? `background-image:url('${PHOTOS[l.id]}')`
      : `background:${CARD_GRADIENTS[l.id] || 'linear-gradient(135deg,#1a1a2e,#16213e)'}`;

    const statusHTML = isPlaying
      ? `<span class="lcard-status lcard-status--playing" aria-label="Hozir ijro etilmoqda"></span>`
      : isWatched
      ? `<span class="lcard-status lcard-status--watched" aria-label="Ko'rildi">✓</span>`
      : `<span class="lcard-status"></span>`;

    const playHTML = (!isLocked && !isBlocked)
      ? `<div class="lcard-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>`
      : '';

    const previewHTML = (!isLocked && !isBlocked && l.points.length)
      ? `<div class="lcard-preview" aria-hidden="true">
           <p class="eyebrow" style="margin-bottom:6px">${l.num}</p>
           <ul>${l.points.slice(0, 3).map(p => `<li>${p}</li>`).join('')}</ul>
         </div>`
      : '';

    const progressHTML = isWatched
      ? `<div class="lcard-progress"><span style="width:100%"></span></div>` : '';

    const lockHTML = isLocked
      ? `<div class="lcard-lock">
           <div class="lcard-lock__icon">🔒</div>
           <div class="lcard-lock__label">To'liq kursda</div>
           <div class="lcard-lock__chip">Xarid qilish</div>
         </div>` : '';

    return `<article class="${cls}" data-id="${l.id}" tabindex="0" role="button" aria-label="${l.title.replace(/\n/g, ' ')}">
  <div class="lcard-photo" style="${photoBg}"></div>
  <div class="lcard-shade"></div>
  ${playHTML}${previewHTML}
  <div class="lcard-head">
    <span class="lcard-num">${l.num}</span>${statusHTML}
  </div>
  <div class="lcard-body">
    <h2 class="lcard-title">${l.title.replace(/\n/g, '<br>')}</h2>
    <p class="lcard-sub">${l.sub}</p>
  </div>
  ${lockHTML}${progressHTML}
</article>`;
  }).join('');

  document.querySelectorAll('.lcard').forEach(card => {
    card.addEventListener('click', () => cardClick(+card.dataset.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cardClick(+card.dataset.id); }
    });
  });

  // Stagger animation
  requestAnimationFrame(() => {
    const cards = document.querySelectorAll('.lcard');
    cards.forEach((c, i) => setTimeout(() => c.classList.add('lcard--visible'), i * 80));
    setTimeout(() => cards.forEach(c => c.classList.add('lcard--visible')), 1000);
  });

  const label = `${done} / ${free.length} ko'rildi`;
  ['watchedCount', 'lessonCount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = label;
  });

  updateProgress();
}

// ═══════════════════════
//  CARD CLICK
// ═══════════════════════
function cardClick(id) {
  const l = LESSONS.find(x => x.id === id);
  if (!l) return;

  if (l.locked) {
    hook({ event: 'locked_click', formname: 'popup3_locked_trigger', ...user });
    openPop('popLock');
    return;
  }

  const free = LESSONS.filter(x => !x.locked);
  const maxU = [...watched].filter(wid => free.some(l2 => l2.id === wid)).length;

  // Blocked: not yet accessible
  if (id > maxU + 1) {
    const needed = LESSONS.find(l2 => l2.id === maxU + 1 && !l2.locked);
    if (needed) {
      showToast(`Avval ${needed.num}ni ko'ring`, { icon: '☝️', type: 'warn', once: `blocked-${id}` });
    }
    return;
  }

  // Sales popup before lesson 4
  if (id === 4 && !salesShown) {
    pendingId = 4;
    hook({ event: 'lesson4_intent', formname: 'popup2_sales_trigger', ...user });
    openPop('popSales');
    return;
  }

  if (!phoneGiven) {
    pendingId = id;
    openPop('popPhone');
    return;
  }

  playLesson(id);
}

// ═══════════════════════
//  PLAY LESSON
// ═══════════════════════
function playLesson(id) {
  const l = LESSONS.find(x => x.id === id);
  if (!l) return;
  currentId = id;
  pendingId = 0;

  const player  = document.getElementById('player');
  const ph      = document.getElementById('pPh');

  player.classList.remove('player--hidden');
  document.getElementById('pBarName').textContent   = l.title.replace(/\n/g, ' ');
  document.getElementById('pPhTitle').textContent   = l.title.replace(/\n/g, ' ');
  document.getElementById('pBarExpert').textContent = 'Amira Rashidova';
  document.getElementById('pPoints').innerHTML      = l.points.map(p => `<li>${p}</li>`).join('');
  document.getElementById('pBarDesc').textContent   = l.points.slice(0, 2).join(' · ');

  // Update next-lesson button label
  const nextL = LESSONS.find(x => x.id === l.id + 1 && !x.locked);
  document.getElementById('pClose').textContent = nextL ? 'Keyingi dars →' : 'Yopish';

  if (l.video) {
    ph.classList.add('player__empty--hidden');
    initPlyr();

    plyrInstance.source = {
      type: 'video',
      sources: [{ src: l.video, type: 'video/mp4' }],
    };

    // Restore saved position
    plyrInstance.once('canplay', () => {
      const saved = parseFloat(localStorage.getItem(`qpb_pos_${id}`) || '0');
      if (saved > 3) {
        plyrInstance.currentTime = saved;
        showToast(`Siz ${formatTime(saved)} da to'xtagan edingiz`, { icon: '⏩', once: `resume-${id}` });
      }
      plyrInstance.play().catch(() => {});
    });
  } else {
    ph.classList.remove('player__empty--hidden');
    document.getElementById('pNoVideo').textContent = "Video fayl yuklanmagan — media/ papkasiga qo'shing";
    markWatched(id);
  }

  // Update playing card highlight
  document.querySelectorAll('.lcard').forEach(c => c.classList.remove('lcard--playing'));
  document.querySelector(`.lcard[data-id="${id}"]`)?.classList.add('lcard--playing');

  player.scrollIntoView({ behavior: 'smooth', block: 'start' });
  hideNextHint();
  setupPip(l);
  render();
}

// ═══════════════════════
//  PiP (scroll-based)
// ═══════════════════════
let _pipObs = null;

const pipVid = document.getElementById('pipVideo');

function _pipTimeUpdate() {
  if (plyrInstance) plyrInstance.currentTime = pipVid.currentTime;
}

function _hidePip() {
  const pip = document.getElementById('pip');
  pipVid.removeEventListener('timeupdate', _pipTimeUpdate);
  pipVid.pause();
  pip.classList.remove('is-active');
}

function setupPip(lesson) {
  const player = document.getElementById('player');
  const pip    = document.getElementById('pip');

  if (_pipObs) { _pipObs.disconnect(); _pipObs = null; }
  _hidePip();

  if (!lesson.video || !('IntersectionObserver' in window)) return;

  _pipObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Back to main player — stop pip, resume main
        const ct = pipVid.currentTime;
        _hidePip();
        if (plyrInstance) {
          plyrInstance.currentTime = ct;
          if (plyrInstance.paused) plyrInstance.play().catch(() => {});
        }
      } else {
        // Main player scrolled out — start pip
        if (plyrInstance && !plyrInstance.paused) {
          pipVid.innerHTML = `<source src="${lesson.video}" type="video/mp4">`;
          pipVid.currentTime = plyrInstance.currentTime;
          document.getElementById('pipTitle').textContent = lesson.title.replace(/\n/g, ' ');
          pip.classList.add('is-active');
          pipVid.addEventListener('timeupdate', _pipTimeUpdate);
          pipVid.play().catch(() => {});
          plyrInstance.pause();
        }
      }
    });
  }, { threshold: 0.25 });

  _pipObs.observe(player);
}

function closePip() {
  const pip = document.getElementById('pip');
  if (!pip.classList.contains('is-active')) return;
  const ct = pipVid.currentTime;
  _hidePip();
  if (plyrInstance) {
    plyrInstance.currentTime = ct;
    plyrInstance.play().catch(() => {});
  }
}

document.getElementById('pipClose').addEventListener('click', closePip);

// ═══════════════════════
//  MARK WATCHED
// ═══════════════════════
function markWatched(id) {
  if (watched.has(id)) { currentId = 0; render(); return; }
  watched.add(id);
  localStorage.setItem('qpb_v3', JSON.stringify([...watched]));
  // Clear saved position since lesson is done
  localStorage.removeItem(`qpb_pos_${id}`);
  hook({ event: 'lesson_watched', lesson: id, ...user });

  // Completion toasts
  const msgs = {
    1: { msg: "Zo'r boshladingiz! Keyingi dars tayyor 💪", type: 'ok' },
    2: { msg: "2 ta dars ko'rdingiz — siz kuchli ayolsiz!", type: 'ok' },
    3: { msg: "3 ta dars! 1 ta qoldi — davom eting 🔥", type: 'ok' },
    4: { msg: "Demo tugadi! To'liq kurs sizni kutmoqda 🌹", type: 'sales' },
  };
  if (msgs[id]) {
    setTimeout(() => showToast(msgs[id].msg, { type: msgs[id].type }), 800);
  }

  if (id === 3) {
    setTimeout(() => document.getElementById('banner3').classList.add('is-active'), 1200);
  }

  if (id === 4) {
    setTimeout(() => {
      showToast('1 xarid → 6 ta kurs sovg\'a. Faqat hozir!', {
        icon: '🎁', type: 'sales', once: 'sales-after-4', duration: 6000,
      });
    }, 5000);
  }

  const next = LESSONS.find(l => l.id === id + 1 && !l.locked);
  if (next) showNextHint(next);

  currentId = 0;
  render();
}

// ═══════════════════════
//  NEXT HINT
// ═══════════════════════
function showNextHint(next) {
  const hint = document.getElementById('nextHint');
  document.getElementById('nextHintTitle').textContent = next.title.replace(/\n/g, ' ');
  document.getElementById('nextHintSub').textContent   = next.sub;
  document.getElementById('nextHintBtn').onclick = () => { cardClick(next.id); hideNextHint(); };
  hint.classList.add('is-active');
  setTimeout(() => hint.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function hideNextHint() {
  document.getElementById('nextHint').classList.remove('is-active');
}

// ═══════════════════════
//  CLOSE PLAYER
// ═══════════════════════
document.getElementById('pClose').addEventListener('click', () => {
  const nextL = LESSONS.find(x => x.id === currentId + 1 && !x.locked);
  if (nextL) {
    if (currentId) markWatched(currentId);
    cardClick(nextL.id);
    return;
  }
  if (plyrInstance) plyrInstance.pause();
  document.getElementById('player').classList.add('player--hidden');
  document.getElementById('pPh').classList.remove('player__empty--hidden');
  document.querySelectorAll('.lcard').forEach(c => c.classList.remove('lcard--playing'));
  closePip();
  hideNextHint();
  if (_pipObs) { _pipObs.disconnect(); _pipObs = null; }
  currentId = 0;
  render();
});

// ═══════════════════════
//  PROGRESS
// ═══════════════════════
function updateProgress() {
  const free = LESSONS.filter(l => !l.locked);
  const done = [...watched].filter(wid => free.some(l => l.id === wid)).length;
  const pct  = Math.round(done / free.length * 100);
  const pNum  = document.getElementById('pNum');
  const pFill = document.getElementById('pFill');
  if (pNum)  pNum.textContent  = pct + '%';
  if (pFill) pFill.style.width = pct + '%';
}

// ═══════════════════════
//  WEBHOOK
// ═══════════════════════
function hook(data) {
  if (!WEBHOOK) return;
  fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, ts: new Date().toISOString(), src: 'qpb-demo' }),
  }).catch(() => {});
}

// ── CRM Lead sender ──
function sendToCrm(name, phone, formName) {
  fetch('https://crm.qpdev.uz/webhook/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, form_name: formName, ...getUtm() }),
  }).catch(() => {});
}

// ═══════════════════════
//  BUY + TELEGRAM
// ═══════════════════════
function handleBuy() {
  hook({ event: 'buy_click', formname: 'buy_button', ...user });
  if (BUY_URL) window.location.href = BUY_URL;
  else document.getElementById('pitch').scrollIntoView({ behavior: 'smooth' });
}

function handleTelegram() {
  hook({ event: 'telegram_click', formname: 'tg_button', ...user });
  if (TG_URL) window.open(TG_URL, '_blank');
}

// ═══════════════════════
//  UTIL
// ═══════════════════════
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ═══════════════════════
//  BUTTON WIRING
// ═══════════════════════
document.getElementById('heroStartBtn')?.addEventListener('click', () => cardClick(1));
document.getElementById('heroPitchBtn')?.addEventListener('click', () =>
  document.getElementById('pitch').scrollIntoView({ behavior: 'smooth' })
);
['topJoinBtn', 'stickyBuyBtn'].forEach(id =>
  document.getElementById(id)?.addEventListener('click', () =>
    document.getElementById('pitch').scrollIntoView({ behavior: 'smooth' })
  )
);
document.getElementById('mainBuyBtn')?.addEventListener('click', handleBuy);
document.getElementById('bannerBuyBtn')?.addEventListener('click', () =>
  document.getElementById('pitch').scrollIntoView({ behavior: 'smooth' })
);
document.getElementById('telegramBtn')?.addEventListener('click', handleTelegram);

// ═══════════════════════
//  INIT
// ═══════════════════════
render();
updateProgress();
