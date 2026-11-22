/**
 * MINTO WEDDING — LUXURY INDIAN WEDDING INVITATION INTERACTIVE SCRIPT
 * Manages 3D Envelope Opening, Petals Canvas, 4-Event Journey, Live Countdown,
 * Photo Lightbox, Audio Control, Calendar ICS Generator, and WhatsApp RSVP.
 */

// Global State
let invitationData = null;
let currentEventIndex = 0;
let isAudioPlaying = false;
let isReducedMotion = false;
let audioPlayer = null;

// DOM Elements
const envelopeExp = document.getElementById('envelopeExperience');
const openBtn = document.getElementById('openInvitationBtn');
const waxSeal = document.getElementById('waxSeal');
const invitationMain = document.getElementById('invitationMain');
const audioToggleBtn = document.getElementById('audioToggleBtn');
const motionToggleBtn = document.getElementById('motionToggleBtn');

// Helper to resolve asset URLs across static hosting, GitHub Pages, or local Express server
function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) {
    return '.' + url;
  }
  return url;
}

// 1. Fetch Invitation Configuration
async function loadInvitationData() {
  if (window.EMBEDDED_INVITATION_DATA) {
    invitationData = window.EMBEDDED_INVITATION_DATA;
    renderInvitation(invitationData);
    setupCountdown(invitationData.countdown);
    setupEventsJourney(invitationData.events);
    setupAudio(invitationData.general.musicUrl);
    return;
  }

  try {
    const res = await fetch('data/invitation.json').catch(() => fetch('/api/invitation'));
    const json = await res.json();
    const data = json.data || json;
    if (data) {
      invitationData = data;
      renderInvitation(invitationData);
      setupCountdown(invitationData.countdown);
      setupEventsJourney(invitationData.events);
      setupAudio(invitationData.general.musicUrl);
    }
  } catch (err) {
    console.error('Error loading invitation data:', err);
  }
}

// 2. Render Dynamic Data into DOM
function renderInvitation(data) {
  if (!data) return;

  // Sacred Shlok & Titles
  setText('sacredShlok', data.general.welcomeShlok || '|| श्री गणेशाय नमः ||');
  setText('mainTitle', data.general.invitationHeading || 'मांगलिक परिणयोत्सव');
  setText('subTitle', data.general.invitationSubheading || 'दो दिलों का पावन बंधन');
  setText('welcomeMessageText', data.general.welcomeMessage || '');

  // Couple Details
  const bride = data.couple.bride;
  const groom = data.couple.groom;

  setText('brideName', bride.name);
  setText('brideTitle', bride.title);
  setText('envelopeBrideName', bride.name);

  setText('groomName', groom.name);
  setText('groomTitle', groom.title);
  setText('envelopeGroomName', groom.name);

  // Set Couple Photos with position & zoom adjustments
  const brideImg = document.getElementById('bridePhotoImg');
  if (brideImg && bride.photo) {
    brideImg.src = resolveAssetUrl(bride.photo);
    applyImageTransforms(brideImg, bride.positionX, bride.positionY, bride.zoom);
  }

  const groomImg = document.getElementById('groomPhotoImg');
  if (groomImg && groom.photo) {
    groomImg.src = resolveAssetUrl(groom.photo);
    applyImageTransforms(groomImg, groom.positionX, groom.positionY, groom.zoom);
  }

  // Our Story
  renderStory(data.story || []);

  // Families
  renderFamilies(data.families);

  // Gallery
  renderGallery(data.gallery || []);

  // RSVP & WhatsApp
  setupRSVP(data.rsvp);

  // Closing Scene & Company Logo (Small & Understated ONLY at end)
  setText('closingBlessing', data.general.closingBlessing || 'स्नेह, आशीर्वाद और खुशियों के इस उत्सव में...');
  setText('closingTagline', data.general.closingTagline || 'आपका इंतज़ार रहेगा');
  setText('closingMessage', data.general.closingMessage || '');

  const company = data.general.company;
  const footerLogo = document.getElementById('footerCompanyLogo');
  const footerText = document.getElementById('footerCompanyText');
  const footerPhone = document.getElementById('footerCompanyPhone');
  const footerWA = document.getElementById('footerCompanyWhatsApp');
  const footerWrapper = document.getElementById('footerCompanyWrapper');

  if (company && company.showLogo && company.logoUrl) {
    if (footerLogo) {
      footerLogo.src = resolveAssetUrl(company.logoUrl);
      footerLogo.style.display = 'block';
    }
    if (footerText) footerText.textContent = company.tagline || company.name || 'Crafted with love by Shree Creator';
    
    const phoneNum = company.phone || '8770024607';
    if (footerPhone) {
      footerPhone.href = `tel:${phoneNum}`;
      const numSpan = footerPhone.querySelector('.phone-number');
      if (numSpan) numSpan.textContent = phoneNum;
    }
    if (footerWA) {
      footerWA.href = `https://wa.me/91${phoneNum}?text=${encodeURIComponent('नमस्ते Shree Creator! मुझे भी ऐसा डिजिटल वेडिंग कार्ड बनवाना है।')}`;
    }
    if (footerWrapper) footerWrapper.style.display = 'flex';
  } else if (company && company.name) {
    if (footerLogo) footerLogo.style.display = 'none';
    if (footerText) footerText.textContent = company.name;
    const phoneNum = company.phone || '8770024607';
    if (footerPhone) {
      footerPhone.href = `tel:${phoneNum}`;
      const numSpan = footerPhone.querySelector('.phone-number');
      if (numSpan) numSpan.textContent = phoneNum;
    }
    if (footerWrapper) footerWrapper.style.display = 'flex';
  } else {
    if (footerWrapper) footerWrapper.style.display = 'none';
  }

  // Initialize Apple-Style Continuous Scroll Orchestrator
  setTimeout(() => {
    initAppleScrollOrchestrator();
  }, 100);
}

function applyImageTransforms(imgEl, x, y, zoom) {
  const posX = (x !== undefined) ? x : 50;
  const posY = (y !== undefined) ? y : 35;
  const zoomScale = (zoom !== undefined) ? (zoom / 100) : 1;
  imgEl.style.objectPosition = `${posX}% ${posY}%`;
  imgEl.style.transform = `scale(${zoomScale})`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text) el.textContent = text;
}

// 3. Cinematic Envelope Opening
function initEnvelopeOpening() {
  const openEnvelope = () => {
    // Play sound if allowed
    playAudio();

    // Animate wax seal burst
    if (waxSeal) waxSeal.classList.add('broken');

    const wrapper = document.querySelector('.envelope-wrapper');
    if (wrapper) wrapper.classList.add('opening');

    // Trigger golden sparkles burst on envelope
    createSparkleBurst(window.innerWidth / 2, window.innerHeight / 2);

    setTimeout(() => {
      if (envelopeExp) envelopeExp.classList.add('opened');
      if (invitationMain) invitationMain.classList.add('visible');

      // Animate couple entrance on envelope open
      setTimeout(() => {
        const coupleWrapper = document.querySelector('.couple-reveal-section');
        if (coupleWrapper) {
          coupleWrapper.classList.add('in-view');
          setTimeout(() => coupleWrapper.classList.add('couple-joined'), 700);
        }
      }, 500);

      // Smooth scroll to top of card
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1300);
  };

  if (openBtn) openBtn.addEventListener('click', openEnvelope);
  if (waxSeal) waxSeal.addEventListener('click', openEnvelope);
}

// 4. Floating Petals Canvas Animation
function initPetalCanvas() {
  const canvas = document.getElementById('petalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const petals = [];
  const petalCount = window.innerWidth < 600 ? 25 : 45;

  const colors = [
    { fill: '#E8B4B8', stroke: '#C06C84' }, // Soft rose
    { fill: '#C72C41', stroke: '#80132A' }, // Deep red rose
    { fill: '#FFD700', stroke: '#B8860B' }, // Golden glitter
    { fill: '#F5A623', stroke: '#D0021B' }  // Marigold
  ];

  class Petal {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * width;
      this.y = -20 - Math.random() * 50;
      this.size = 8 + Math.random() * 12;
      this.speedY = 0.8 + Math.random() * 1.6;
      this.speedX = -0.6 + Math.random() * 1.2;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = 0.01 + Math.random() * 0.03;
      this.flip = Math.random() * Math.PI;
      this.flipSpeed = 0.02 + Math.random() * 0.04;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.isGold = Math.random() < 0.25;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
      this.rotation += this.rotSpeed;
      this.flip += this.flipSpeed;

      if (this.y > height + 20) {
        this.reset();
      }
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(Math.cos(this.flip), 1);

      if (this.isGold) {
        // Sparkling gold particle
        ctx.fillStyle = '#FFE6A3';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flower petal curve
        ctx.fillStyle = this.color.fill;
        ctx.strokeStyle = this.color.stroke;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(this.size * 0.5, -this.size * 0.6, this.size, -this.size * 0.2, this.size * 0.6, this.size * 0.8);
        ctx.bezierCurveTo(0, this.size * 1.1, -this.size * 0.6, this.size * 0.8, -this.size * 0.6, -this.size * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  for (let i = 0; i < petalCount; i++) {
    petals.push(new Petal());
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    if (!isReducedMotion) {
      for (const p of petals) {
        p.update();
        p.draw();
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
}

function createSparkleBurst(centerX, centerY) {
  const canvas = document.getElementById('petalCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let particles = [];
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      size: 4 + Math.random() * 4
    });
  }

  function animateBurst() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      ctx.save();
      ctx.fillStyle = `rgba(255, 230, 163, ${p.life})`;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p.life <= 0) particles.splice(i, 1);
    }
    if (particles.length > 0) requestAnimationFrame(animateBurst);
  }
  animateBurst();
}

// 5. Live Countdown Timer (Asia/Kolkata)
function setupCountdown(config) {
  if (!config) return;

  const targetDateStr = config.targetDate || '2026-11-30T17:30:00+05:30';
  const targetTime = new Date(targetDateStr).getTime();

  const daysEl = document.getElementById('countDays');
  const hoursEl = document.getElementById('countHours');
  const minutesEl = document.getElementById('countMinutes');
  const secondsEl = document.getElementById('countSeconds');
  const badgeEl = document.getElementById('countdownBadge');

  if (badgeEl) {
    if (config.demoTimeNote) {
      badgeEl.textContent = config.demoTimeNote;
    } else if (config.eventTitle) {
      badgeEl.textContent = config.eventTitle;
    }
  }

  function update() {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minutesEl) minutesEl.textContent = '00';
      if (secondsEl) secondsEl.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(d).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(m).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(s).padStart(2, '0');
  }

  update();
  setInterval(update, 1000);
}

// 6. The Royal Card Deck Stacking Journey (शुभ मांगलिक प्रसंग & All Chapters)
function setupEventsJourney(events) {
  if (!events || events.length === 0) return;

  const deckEventsWrapper = document.getElementById('deckEventsWrapper');
  const stickyNav = document.getElementById('royalDeckNav');
  if (!deckEventsWrapper || !stickyNav) return;

  deckEventsWrapper.innerHTML = '';
  stickyNav.innerHTML = '';

  const themeIcons = {
    engagement: '💍',
    haldi: '🌼',
    baraat: '🥁',
    reception: '✨'
  };

  const navItems = [];

  // 1. Inject the 4 Event Deck Cards into #deckEventsWrapper
  events.forEach((ev, index) => {
    const cardId = `deck-event-${index}`;
    const icon = themeIcons[ev.theme] || '🌸';
    const demoBadge = ev.isDemoTime ? `<span class="demo-time-pill" style="font-size: 0.72rem; background: rgba(212,175,55,0.25); color: #FFE29F; padding: 2px 8px; border-radius: 12px; margin-left: 6px; border: 1px solid rgba(212,175,55,0.4);">डेमो</span>` : '';

    const pillNames = {
      event_1: 'सगाई',
      event_2: 'हल्दी/मायन',
      event_3: 'बारात',
      event_4: 'भोज/लोकेशन'
    };
    const navName = pillNames[ev.id] || ev.name;

    navItems.push({
      id: cardId,
      icon: icon,
      name: navName
    });

    const isPartyDay = (index === 3 || ev.theme === 'reception' || ev.id === 'event_4');
    const destQuery = encodeURIComponent(`${ev.venue}, ${ev.address}`);
    const dirUrl = ev.directionUrl || `https://www.google.com/maps/dir/?api=1&destination=${destQuery}`;

    const locationMapHtml = isPartyDay ? `
        <div class="venue-location-map-box">
          <div class="venue-map-header">
            <div class="venue-map-title">
              <span>📍</span> पार्टी एवं आशीर्वाद समारोह स्थल (लोकेशन मैप)
            </div>
            <span class="venue-map-badge">Live Map</span>
          </div>
          <div class="venue-map-frame-wrapper">
            <iframe 
              src="https://www.openstreetmap.org/export/embed.html?bbox=81.695%2C20.845%2C81.725%2C20.875&amp;layer=mapnik&amp;marker=20.8594%2C81.7100" 
              title="विवाह स्थल लोकेशन मैप - ईदगाह मैदान कुरुद"
              loading="lazy" 
              allowfullscreen>
            </iframe>
            <div class="venue-map-tag">
              <span>🏛️ ईदगाह भवन / मैदान, कुरुद (धमतरी)</span>
              <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" style="color: #6EE7B7; font-weight: 700; text-decoration: underline;">दिशा-निर्देश लें ↗</a>
            </div>
          </div>
        </div>
    ` : '';

    const actionsHtml = isPartyDay ? `
        <div class="event-actions" style="display: flex; flex-direction: column; gap: 10px; margin-top: 14px;">
          <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" class="party-get-direction-btn" title="Google Maps पर रास्ता (दिशा-निर्देश) देखें">
            <span style="font-size: 1.25rem;">🧭</span>
            <span>Get Direction (रास्ता देखें)</span>
          </a>
          <div style="display: flex; gap: 10px; width: 100%;">
            <a href="${ev.mapUrl}" target="_blank" rel="noopener noreferrer" class="btn-event-action btn-map" style="flex: 1; text-align: center; text-decoration: none;">
              <span>🗺️</span> Maps पर देखें
            </a>
            <button class="btn-event-action btn-calendar" onclick="downloadEventCalendar('${ev.id}')" style="flex: 1; text-align: center; cursor: pointer;">
              <span>📅</span> कैलेंडर में जोड़ें
            </button>
          </div>
        </div>
    ` : `
        <div class="event-actions" style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px;">
          <a href="${dirUrl}" target="_blank" rel="noopener noreferrer" class="btn-event-action btn-get-direction" style="flex: 1; min-width: 135px; text-align: center; text-decoration: none;" title="Google Maps पर रास्ता देखें">
            <span>🧭</span> Get Direction
          </a>
          <a href="${ev.mapUrl}" target="_blank" rel="noopener noreferrer" class="btn-event-action btn-map" style="flex: 1; min-width: 110px; text-align: center; text-decoration: none;">
            <span>🗺️</span> Maps
          </a>
          <button class="btn-event-action btn-calendar" onclick="downloadEventCalendar('${ev.id}')" style="flex: 1; min-width: 110px; text-align: center; cursor: pointer;">
            <span>📅</span> कैलेंडर
          </button>
        </div>
    `;

    const card = document.createElement('section');
    card.className = `royal-deck-card event-deck-card theme-${ev.theme}`;
    card.id = cardId;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="deck-card-inner">
        <div class="deck-card-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
          <div class="event-badge-icon" style="font-size: 1.8rem; background: rgba(255,255,255,0.12); border-radius: 50%; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(212,175,55,0.4); box-shadow: 0 4px 12px rgba(0,0,0,0.3);">${icon}</div>
          <div style="font-family: var(--font-heading); font-size: 0.8rem; color: #FFE29F; letter-spacing: 1px; text-transform: uppercase; background: rgba(0,0,0,0.35); padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.35);">
            उत्सव ${index + 1} ऑफ 4
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 14px;">
          <div style="font-family: var(--font-devanagari); font-size: 0.88rem; color: #FFE8B2; letter-spacing: 2px; text-transform: uppercase;">॥ शुभ मांगलिक प्रसंग ॥</div>
          <h2 style="font-family: var(--font-heading); font-size: 2.3rem; color: #FFF; margin: 4px 0 6px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">${ev.name}</h2>
          <p style="font-size: 0.95rem; color: #F7E7A9; font-style: italic; margin-bottom: 16px;">“${ev.tagline}”</p>
        </div>

        <div class="event-info-box" style="background: rgba(0,0,0,0.28); border: 1px solid rgba(212,175,55,0.35); border-radius: 16px; padding: 16px; margin-bottom: 16px; backdrop-filter: blur(6px);">
          <div class="info-item" style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 1.4rem;">📅</span>
            <div>
              <div style="font-size: 0.74rem; color: #EAD7C0; text-transform: uppercase; letter-spacing: 0.5px;">दिनांक एवं दिन</div>
              <div style="font-weight: 700; color: #FFF; font-size: 1.05rem;">${ev.date} (${ev.dayHindi})</div>
            </div>
          </div>

          <div class="info-item" style="display: flex; gap: 14px; align-items: center; margin-bottom: 12px;">
            <span style="font-size: 1.4rem;">⏰</span>
            <div>
              <div style="font-size: 0.74rem; color: #EAD7C0; text-transform: uppercase; letter-spacing: 0.5px;">शुभ मुहूर्त / समय ${demoBadge}</div>
              <div style="font-weight: 700; color: #FFF; font-size: 1rem;">${ev.time}</div>
            </div>
          </div>

          <div class="info-item" style="display: flex; gap: 14px; align-items: flex-start;">
            <span style="font-size: 1.4rem; margin-top: 2px;">📍</span>
            <div>
              <div style="font-size: 0.74rem; color: #EAD7C0; text-transform: uppercase; letter-spacing: 0.5px;">स्थान / वेन्यू</div>
              <div style="font-weight: 700; color: #FFF; font-size: 1.02rem;">${ev.venue}</div>
              <div style="font-size: 0.85rem; color: #D5C5B5; margin-top: 3px; line-height: 1.35;">${ev.address}</div>
            </div>
          </div>
        </div>

        <p style="font-size: 0.92rem; color: #F5EAE0; line-height: 1.55; margin-bottom: 12px; text-align: center;">${ev.description}</p>

        ${locationMapHtml}

        ${actionsHtml}

        <!-- Animated Hand Swipe (Left & Right) Navigation Bar -->
        <div class="deck-hand-swipe-bar">
          <button class="card-nav-arrow btn-prev-card" onclick="window.navigateDeckCard(${index - 1})" ${index === 0 ? 'disabled style="opacity:0.3; pointer-events:none;"' : ''} aria-label="पिछला कार्ड">
            ❮
          </button>
          <div class="animated-hand-hint">
            <span class="anim-hand-icon">👈 🖐️ 👉</span>
            <span class="anim-hand-label">लेफ्ट / राइट स्वाइप करें</span>
          </div>
          <button class="card-nav-arrow btn-next-card" onclick="window.navigateDeckCard(${index + 1})" aria-label="अगला कार्ड">
            ❯
          </button>
        </div>
      </div>
    `;

    deckEventsWrapper.appendChild(card);
  });

  // 2. Add Remaining Chapters to Navigation Pills
  navItems.push(
    { id: 'deck-story', icon: '📖', name: 'दास्तान' },
    { id: 'deck-families', icon: '👨‍👩‍👧‍👦', name: 'परिवार' },
    { id: 'deck-gallery', icon: '🖼️', name: 'गैलरी' },
    { id: 'deck-rsvp', icon: '📤', name: 'शेयर करें' }
  );

  navItems.forEach((item, idx) => {
    const pill = document.createElement('button');
    pill.className = `event-nav-pill ${idx === 0 ? 'active' : ''}`;
    pill.id = `pill-${item.id}`;
    pill.innerHTML = `<span>${item.icon}</span> <span>${item.name}</span>`;
    pill.setAttribute('aria-label', `${item.name} पर जाएं`);
    pill.addEventListener('click', () => {
      const targetCard = document.getElementById(item.id);
      if (targetCard) {
        const targetRect = targetCard.getBoundingClientRect();
        const offset = targetRect.top + window.scrollY - 75;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
    stickyNav.appendChild(pill);
  });

  // 3. Initialize Apple-Style & Instagram-Style Continuous Card Stacking Physics
  initDeckStackingEngine();
}

function initDeckStackingEngine() {
  const container = document.getElementById('royalDeckContainer');
  if (!container) return;

  const deckCards = Array.from(document.querySelectorAll('.royal-deck-card'));
  if (deckCards.length === 0) return;

  // Set progressive z-index so incoming cards always stack cleanly over previous cards
  deckCards.forEach((card, idx) => {
    card.style.zIndex = idx + 2;
  });

  let ticking = false;

  function updateDeckPhysics() {
    const stickyTop = 75; // sticky offset from top of viewport
    const windowH = window.innerHeight;
    let activeCardIndex = 0;

    for (let i = 0; i < deckCards.length; i++) {
      const card = deckCards[i];
      const nextCard = deckCards[i + 1];
      const cardRect = card.getBoundingClientRect();

      // Check if this card has reached or passed the sticky position
      if (cardRect.top <= stickyTop + 30) {
        activeCardIndex = i;
      }

      if (nextCard) {
        const nextRect = nextCard.getBoundingClientRect();
        const transitionRange = Math.min(windowH * 0.3, 160);
        const distanceToSticky = nextRect.top - stickyTop;

        if (distanceToSticky <= transitionRange && distanceToSticky >= 0) {
          // Gentle tuck when next card is closely approaching stickyTop
          const overlap = 1 - (distanceToSticky / transitionRange);
          const scale = 1 - (overlap * 0.05); // slight tuck scale
          const brightness = 1 - (overlap * 0.15); // gentle dimming
          const translateY = -(overlap * 10);

          card.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
          card.style.filter = `brightness(${brightness})`;
          card.classList.remove('is-active-top');
          card.classList.toggle('is-stacked', overlap > 0.8);
        } else if (distanceToSticky < 0) {
          // Next card has completely covered stickyTop - this card is stacked underneath
          const deeperCardsAbove = deckCards.slice(i + 1).filter(c => c.getBoundingClientRect().top <= stickyTop + 10).length;
          const extraScale = Math.min(0.04, deeperCardsAbove * 0.015);
          const finalScale = Math.max(0.90, 0.95 - extraScale);
          const finalBrightness = Math.max(0.75, 0.85 - (deeperCardsAbove * 0.04));
          const finalY = -10 - (deeperCardsAbove * 4);

          card.style.transform = `translate3d(0, ${finalY}px, 0) scale(${finalScale})`;
          card.style.filter = `brightness(${finalBrightness})`;
          card.classList.add('is-stacked');
          card.classList.remove('is-active-top');
        } else {
          // Next card hasn't started overlapping yet - full brightness and crispness!
          card.style.transform = 'translate3d(0, 0, 0) scale(1)';
          card.style.filter = 'brightness(1)';
          card.classList.remove('is-stacked');
        }
      } else {
        // Last card in deck (closing card)
        card.style.transform = 'translate3d(0, 0, 0) scale(1)';
        card.style.filter = 'brightness(1)';
      }
    }

    // Mark the current front active card
    deckCards.forEach((c, idx) => {
      if (idx === activeCardIndex) {
        c.classList.add('is-active-top');
      } else {
        c.classList.remove('is-active-top');
      }
    });

    // Update active navigation pill in #royalDeckNav
    const activeCard = deckCards[activeCardIndex];
    if (activeCard) {
      const activePill = document.getElementById(`pill-${activeCard.id}`);
      if (activePill && !activePill.classList.contains('active')) {
        document.querySelectorAll('.event-nav-pill').forEach(p => p.classList.remove('active'));
        activePill.classList.add('active');
        activePill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateDeckPhysics);
      ticking = true;
    }
  }, { passive: true });

  // Couple Section Scroll Observer for entrance
  const coupleSection = document.querySelector('.couple-reveal-section');
  if (coupleSection) {
    const coupleObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          coupleSection.classList.add('in-view');
          setTimeout(() => coupleSection.classList.add('couple-joined'), 600);
        }
      });
    }, { threshold: 0.2 });
    coupleObserver.observe(coupleSection);
  }

  // Touch Gesture (Swipe Left & Right) on Deck Cards
  deckCards.forEach((card, idx) => {
    let touchStartX = 0;
    let touchStartY = 0;

    card.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
      touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Detect horizontal swipe (>45px and predominantly horizontal)
      if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        if (deltaX < 0 && idx < deckCards.length - 1) {
          // Swiped Left ➔ Advance to Next Card
          window.navigateDeckCard(idx + 1);
        } else if (deltaX > 0 && idx > 0) {
          // Swiped Right ➔ Go to Previous Card
          window.navigateDeckCard(idx - 1);
        }
      }
    }, { passive: true });
  });

  // Global Quick Navigator helper between deck cards
  window.navigateDeckCard = function(targetIdx) {
    const cards = Array.from(document.querySelectorAll('.royal-deck-card'));
    if (targetIdx >= 0 && targetIdx < cards.length) {
      const targetCard = cards[targetIdx];
      const offset = targetCard.getBoundingClientRect().top + window.scrollY - 75;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  // Initial trigger
  updateDeckPhysics();
}

// 7. Calendar .ICS File Generator
window.downloadEventCalendar = function(eventId) {
  if (!invitationData || !invitationData.events) return;
  const ev = invitationData.events.find(e => e.id === eventId) || invitationData.events[0];

  // Map dates
  const dateMap = {
    '28 November 2026': '20261128',
    '29 November 2026': '20261129',
    '30 November 2026': '20261130',
    '1 December 2026': '20261201'
  };

  const dtStamp = dateMap[ev.date] || '20261128';
  const startT = `${dtStamp}T190000`;
  const endT = `${dtStamp}T230000`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Minto Wedding//Indian Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:शुभ विवाह - ${ev.name} (${invitationData.couple.bride.name} संग ${invitationData.couple.groom.name})`,
    `DESCRIPTION:${ev.description} | समय: ${ev.time}`,
    `LOCATION:${ev.venue}, ${ev.address}`,
    `DTSTART;TZID=Asia/Kolkata:${startT}`,
    `DTEND;TZID=Asia/Kolkata:${endT}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${ev.name}_Wedding_Invitation.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 8. Story Timeline Render
function renderStory(storyList) {
  const container = document.getElementById('storyTimeline');
  if (!container) return;
  container.innerHTML = '';

  storyList.forEach(item => {
    const node = document.createElement('div');
    node.className = 'story-node in-view';
    node.innerHTML = `
      <div class="story-marker"></div>
      <div class="story-card">
        <span class="story-year">${item.year} — ${item.chapter}</span>
        <h4 class="story-title">${item.title}</h4>
        <p class="story-text">${item.description}</p>
      </div>
    `;
    container.appendChild(node);
  });
}

// 9. Families Section Render
function renderFamilies(families) {
  if (!families) return;

  const groomBox = document.getElementById('groomFamilyCard');
  if (groomBox && families.groom) {
    const g = families.groom;
    groomBox.innerHTML = `
      <div class="family-card-badge">${g.side || 'वर पक्ष'}</div>
      <div class="family-members-list">
        <div class="member-row"><span class="member-relation">दादाजी:</span> <span class="member-name">${g.grandFather}</span></div>
        <div class="member-row"><span class="member-relation">माता-पिता:</span> <span class="member-name">${g.mother} एवं ${g.father}</span></div>
        <div class="member-row"><span class="member-relation">निवास:</span> <span class="member-name">${g.address}</span></div>
      </div>
      <p class="family-quote">“${g.quote}”</p>
    `;
  }

  const brideBox = document.getElementById('brideFamilyCard');
  if (brideBox && families.bride) {
    const b = families.bride;
    brideBox.innerHTML = `
      <div class="family-card-badge">${b.side || 'वधू पक्ष'}</div>
      <div class="family-members-list">
        <div class="member-row"><span class="member-relation">दादाजी:</span> <span class="member-name">${b.grandFather}</span></div>
        <div class="member-row"><span class="member-relation">माता-पिता:</span> <span class="member-name">${b.mother} एवं ${b.father}</span></div>
        <div class="member-row"><span class="member-relation">निवास:</span> <span class="member-name">${b.address}</span></div>
      </div>
      <p class="family-quote">“${b.quote}”</p>
    `;
  }
}

// 10. Photo Gallery & Lightbox
let activeGallery = [];
let currentLightboxIndex = 0;

function renderGallery(galleryList) {
  const container = document.getElementById('galleryGrid');
  if (!container) return;
  container.innerHTML = '';
  activeGallery = galleryList;

  galleryList.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'gallery-item in-view';
    div.innerHTML = `
      <img src="${resolveAssetUrl(item.url)}" alt="${item.caption}" loading="lazy" />
      <div class="gallery-overlay">🔍</div>
    `;
    div.addEventListener('click', () => openLightbox(index));
    container.appendChild(div);
  });
}

function openLightbox(index) {
  if (!activeGallery || activeGallery.length === 0) return;
  currentLightboxIndex = index;
  const lb = document.getElementById('galleryLightbox');
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');

  if (lb && img && cap) {
    img.src = resolveAssetUrl(activeGallery[index].url);
    cap.textContent = activeGallery[index].caption || '';
    lb.classList.add('active');
  }
}

function initLightboxControls() {
  const lb = document.getElementById('galleryLightbox');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  if (closeBtn) closeBtn.addEventListener('click', () => lb.classList.remove('active'));
  if (lb) {
    lb.addEventListener('click', (e) => {
      if (e.target === lb) lb.classList.remove('active');
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLightboxIndex = (currentLightboxIndex - 1 + activeGallery.length) % activeGallery.length;
      openLightbox(currentLightboxIndex);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLightboxIndex = (currentLightboxIndex + 1) % activeGallery.length;
      openLightbox(currentLightboxIndex);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === 'Escape') lb.classList.remove('active');
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === 'ArrowRight') nextBtn.click();
  });
}

// 11. WhatsApp Share & Universal Sharing Controls (Any visitor can share the URL)
function setupRSVP(rsvpConfig) {
  const groom = invitationData?.couple?.groom?.name || 'चि. चन्द्रशेखर';
  const bride = invitationData?.couple?.bride?.name || 'सौ. का. चन्द्रकिरण';

  // 1. WhatsApp Share Button (Opens WhatsApp with invitation URL for ANY contact/group)
  const waShareBtn = document.getElementById('whatsappShareBtn') || document.getElementById('whatsappRsvpBtn');
  if (waShareBtn) {
    waShareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const currentUrl = window.location.origin + window.location.pathname;
      const shareText = `🌸 || श्री गणेशाय नमः || 🌸\n\nसाहू परिवार का सस्नेह आमंत्रण:\n${groom} संग ${bride} के शुभ विवाह का डिजिटल निमंत्रण पत्र देखने के लिए नीचे दिए गए लिंक पर क्लिक करें:\n\n👉 ${currentUrl}\n\n✨ शुभ विवाह: 30 नवम्बर 2026 (गोधुली बेला)\n🙏 आप सपरिवार सादर आमंत्रित हैं!`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    });
  }

  // 2. Direct Link Copy Button
  const copyBtn = document.getElementById('copyInviteLinkBtn');
  const copyToast = document.getElementById('shareCopyToast');
  if (copyBtn) {
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const currentUrl = window.location.origin + window.location.pathname;
      try {
        await navigator.clipboard.writeText(currentUrl);
        if (copyToast) {
          copyToast.style.display = 'block';
          setTimeout(() => { copyToast.style.display = 'none'; }, 4000);
        }
        showToast('✨ निमंत्रण लिंक कॉपी हो गया!');
      } catch (err) {
        // Fallback prompt
        prompt('निमंत्रण लिंक कॉपी करें:', currentUrl);
      }
    });
  }

  // 3. Other Apps Share (Web Share API)
  const shareBtn = document.getElementById('shareInviteBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const currentUrl = window.location.origin + window.location.pathname;
      const shareData = {
        title: `${groom} संग ${bride} — शुभ विवाह निमंत्रण पत्र`,
        text: `🌸 साहू परिवार का सस्नेह आमंत्रण:\n${groom} संग ${bride} के शुभ विवाह का डिजिटल निमंत्रण पत्र। कृपया पधारकर अपना स्नेह व आशीर्वाद प्रदान करें।`,
        url: currentUrl
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.log('Share canceled or failed:', err);
        }
      } else {
        if (copyBtn) copyBtn.click();
      }
    });
  }
}

function showToast(msg) {
  let toast = document.getElementById('weddingToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'weddingToast';
    toast.style.position = 'fixed';
    toast.style.bottom = '25px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#4A0E17';
    toast.style.color = '#F7E7A9';
    toast.style.border = '1px solid #D4AF37';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
    toast.style.zIndex = '3000';
    toast.style.fontSize = '0.9rem';
    toast.style.fontFamily = 'var(--font-heading)';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// 12. Audio Control with Mute / Unmute
function setupAudio(musicUrl) {
  if (!musicUrl) musicUrl = './audio/kudmayi_shagna.mp3';

  audioPlayer = new Audio(resolveAssetUrl(musicUrl));
  audioPlayer.loop = true;
  audioPlayer.preload = 'auto';

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      if (isAudioPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    });
  }
}

function playAudio() {
  if (!audioPlayer) return;
  audioPlayer.play().then(() => {
    isAudioPlaying = true;
    if (audioToggleBtn) {
      audioToggleBtn.classList.remove('sound-muted');
      audioToggleBtn.setAttribute('title', 'संगीत बंद करें');
    }
  }).catch((err) => {
    console.log('Audio autoplay prevented by browser policy:', err);
  });
}

function pauseAudio() {
  if (!audioPlayer) return;
  audioPlayer.pause();
  isAudioPlaying = false;
  if (audioToggleBtn) {
    audioToggleBtn.classList.add('sound-muted');
    audioToggleBtn.setAttribute('title', 'संगीत शुरू करें');
  }
}

// 13. Reduced Motion Support
function setupReducedMotion() {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mediaQuery.matches) {
    setReducedMotion(true);
  }

  if (motionToggleBtn) {
    motionToggleBtn.addEventListener('click', () => {
      setReducedMotion(!isReducedMotion);
    });
  }
}

function setReducedMotion(enable) {
  isReducedMotion = enable;
  document.body.classList.toggle('reduced-motion', enable);
  if (motionToggleBtn) {
    motionToggleBtn.classList.toggle('active', enable);
    motionToggleBtn.setAttribute('title', enable ? 'एनिमेशन चालू करें' : 'कम एनिमेशन (Reduced Motion)');
  }
}

// 14. Apple-Style Comprehensive Scroll Orchestrator (Throughout Entire Website)
function initAppleScrollOrchestrator() {
  const scrollTargets = [
    ...document.querySelectorAll('.section-header'),
    ...document.querySelectorAll('.story-node'),
    ...document.querySelectorAll('.family-card'),
    ...document.querySelectorAll('.gallery-item'),
    ...document.querySelectorAll('.rsvp-box'),
    ...document.querySelectorAll('.closing-scene')
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -5% 0px'
  });

  scrollTargets.forEach(el => observer.observe(el));

  // Continuous Parallax & Depth Physics (Apple.com style)
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (!isReducedMotion) {
          applyContinuousScrollEffects();
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

function applyContinuousScrollEffects() {
  const windowH = window.innerHeight;

  // 1. Photo Gallery Staggered Parallax
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach((item, idx) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < windowH && rect.bottom > 0) {
      const progress = (windowH - rect.top) / (windowH + rect.height);
      const factor = (idx % 2 === 0) ? -12 : 12;
      const translateY = (progress - 0.5) * factor;
      if (item.classList.contains('in-view')) {
        item.style.transform = `translateY(${translateY}px) scale(1)`;
      }
    }
  });

  // 2. Story Timeline Nodes Glow Progress
  const storyNodes = document.querySelectorAll('.story-node');
  storyNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.top < windowH && rect.bottom > 0) {
      const progress = Math.max(0, Math.min(1, (windowH - rect.top) / (windowH * 0.8)));
      const marker = node.querySelector('.story-marker');
      if (marker && progress > 0.35) {
        marker.style.boxShadow = `0 0 ${8 + progress * 14}px rgba(212, 175, 55, 0.85)`;
      }
    }
  });

  // 3. Closing Scene Grand Climax Glow
  const closingScene = document.querySelector('.closing-scene');
  if (closingScene) {
    const rect = closingScene.getBoundingClientRect();
    if (rect.top < windowH) {
      closingScene.classList.add('in-view');
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  initEnvelopeOpening();
  initPetalCanvas();
  initLightboxControls();
  setupReducedMotion();
  loadInvitationData();
});
