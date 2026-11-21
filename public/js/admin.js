/**
 * MINTO WEDDING — PRIVATE LUXURY ADMIN EDITOR SCRIPT
 * Manages Tabs, Form State, Sliders for Zoom & Pan, Image/Music Uploads, and API Sync.
 */

let invitationData = null;

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.editor-section').forEach(s => s.classList.remove('active'));

    btn.classList.add('active');
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add('active');
  });
});

// Toast Helper
function showToast(msg, isError = false) {
  const toast = document.getElementById('adminToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = isError ? '#dc3545' : '#480C16';
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// 1. Fetch & Populate Data
async function loadAdminData() {
  try {
    const res = await fetch('/api/invitation');
    const json = await res.json();
    if (json.success && json.data) {
      invitationData = json.data;
      populateForm(invitationData);
    }
  } catch (err) {
    console.error('Error loading invitation data:', err);
    showToast('डेटा लोड करने में समस्या आई', true);
  }
}

function populateForm(data) {
  // Couple - Bride
  const b = data.couple.bride || {};
  setValue('brideNameInput', b.name || '');
  setValue('brideTitleInput', b.title || 'सुपुत्री');
  if (b.photo) {
    const brideImg = document.getElementById('adminBridePreview');
    brideImg.src = b.photo;
    setSlider('brideZoomSlider', 'brideZoomVal', b.zoom || 100, '%');
    setSlider('brideXSlider', 'brideXVal', b.positionX !== undefined ? b.positionX : 50, '%');
    setSlider('brideYSlider', 'brideYVal', b.positionY !== undefined ? b.positionY : 35, '%');
    updateImageTransform(brideImg, b.positionX, b.positionY, b.zoom);
  }

  // Couple - Groom
  const g = data.couple.groom || {};
  setValue('groomNameInput', g.name || '');
  setValue('groomTitleInput', g.title || 'सुपुत्र');
  if (g.photo) {
    const groomImg = document.getElementById('adminGroomPreview');
    groomImg.src = g.photo;
    setSlider('groomZoomSlider', 'groomZoomVal', g.zoom || 100, '%');
    setSlider('groomXSlider', 'groomXVal', g.positionX !== undefined ? g.positionX : 50, '%');
    setSlider('groomYSlider', 'groomYVal', g.positionY !== undefined ? g.positionY : 30, '%');
    updateImageTransform(groomImg, g.positionX, g.positionY, g.zoom);
  }

  // General Texts
  const gen = data.general || {};
  setValue('welcomeShlokInput', gen.welcomeShlok || '');
  setValue('mainTitleInput', gen.invitationHeading || '');
  setValue('welcomeMessageInput', gen.welcomeMessage || '');

  // Events List
  renderAdminEvents(data.events || []);

  // Countdown
  const cd = data.countdown || {};
  if (cd.targetDate) {
    // Format YYYY-MM-DDTHH:MM for input datetime-local
    const d = new Date(cd.targetDate);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setValue('countdownTargetInput', localIso);
  }
  setValue('countdownDemoNoteInput', cd.demoTimeNote || '');

  // Families
  const fam = data.families || {};
  if (fam.groom) {
    setValue('groomGfInput', fam.groom.grandFather || '');
    setValue('groomGmInput', fam.groom.grandMother || '');
    setValue('groomFatherInput', fam.groom.father || '');
    setValue('groomMotherInput', fam.groom.mother || '');
    setValue('groomCityInput', fam.groom.address || '');
    setValue('groomQuoteInput', fam.groom.quote || '');
  }
  if (fam.bride) {
    setValue('brideGfInput', fam.bride.grandFather || '');
    setValue('brideGmInput', fam.bride.grandMother || '');
    setValue('brideFatherInput', fam.bride.father || '');
    setValue('brideMotherInput', fam.bride.mother || '');
    setValue('brideCityInput', fam.bride.address || '');
    setValue('brideQuoteInput', fam.bride.quote || '');
  }

  // Story
  renderAdminStory(data.story || []);

  // Gallery
  renderAdminGallery(data.gallery || []);

  // Company Logo & Branding
  const comp = gen.company || {};
  setValue('companyNameInput', comp.name || 'Minto Wedding Planners');
  setValue('companyTaglineInput', comp.tagline || 'Crafted with love by Minto Wedding');
  const showLogoCheckbox = document.getElementById('showCompanyLogoCheckbox');
  if (showLogoCheckbox) showLogoCheckbox.checked = !!comp.showLogo;

  const logoImg = document.getElementById('companyLogoPreviewImg');
  const logoPlaceholder = document.getElementById('companyLogoPlaceholderText');
  const taglinePrev = document.getElementById('companyTaglinePreview');
  if (taglinePrev) taglinePrev.textContent = comp.tagline || comp.name;

  if (comp.logoUrl && comp.showLogo) {
    if (logoImg) {
      logoImg.src = comp.logoUrl;
      logoImg.style.display = 'block';
    }
    if (logoPlaceholder) logoPlaceholder.style.display = 'none';
  } else {
    if (logoImg) logoImg.style.display = 'none';
    if (logoPlaceholder) logoPlaceholder.style.display = 'block';
  }

  // RSVP
  const rsvp = data.rsvp || {};
  setValue('rsvpWhatsappInput', rsvp.whatsappNumber || '919876543210');
  setValue('rsvpMessageInput', rsvp.defaultMessage || '');

  // Audio Music
  if (gen.musicUrl) {
    const audioEl = document.getElementById('adminAudioPlayer');
    if (audioEl) audioEl.src = gen.musicUrl;
  }
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function setSlider(sliderId, labelId, val, unit = '') {
  const s = document.getElementById(sliderId);
  const l = document.getElementById(labelId);
  if (s) s.value = val;
  if (l) l.textContent = `${val}${unit}`;
}

function updateImageTransform(img, x, y, zoom) {
  if (!img) return;
  const zoomScale = (zoom || 100) / 100;
  img.style.objectPosition = `${x}% ${y}%`;
  img.style.transform = `scale(${zoomScale})`;
}

// 2. Interactive Image Sliders Event Listeners
function setupSliders() {
  const brideImg = document.getElementById('adminBridePreview');
  const brideZoom = document.getElementById('brideZoomSlider');
  const brideX = document.getElementById('brideXSlider');
  const brideY = document.getElementById('brideYSlider');

  const onBrideChange = () => {
    document.getElementById('brideZoomVal').textContent = `${brideZoom.value}%`;
    document.getElementById('brideXVal').textContent = `${brideX.value}%`;
    document.getElementById('brideYVal').textContent = `${brideY.value}%`;
    updateImageTransform(brideImg, brideX.value, brideY.value, brideZoom.value);
  };
  if (brideZoom) brideZoom.addEventListener('input', onBrideChange);
  if (brideX) brideX.addEventListener('input', onBrideChange);
  if (brideY) brideY.addEventListener('input', onBrideChange);

  const groomImg = document.getElementById('adminGroomPreview');
  const groomZoom = document.getElementById('groomZoomSlider');
  const groomX = document.getElementById('groomXSlider');
  const groomY = document.getElementById('groomYSlider');

  const onGroomChange = () => {
    document.getElementById('groomZoomVal').textContent = `${groomZoom.value}%`;
    document.getElementById('groomXVal').textContent = `${groomX.value}%`;
    document.getElementById('groomYVal').textContent = `${groomY.value}%`;
    updateImageTransform(groomImg, groomX.value, groomY.value, groomZoom.value);
  };
  if (groomZoom) groomZoom.addEventListener('input', onGroomChange);
  if (groomX) groomX.addEventListener('input', onGroomChange);
  if (groomY) groomY.addEventListener('input', onGroomChange);
}

// 3. Render 4 Events in Admin
function renderAdminEvents(events) {
  const container = document.getElementById('adminEventsList');
  if (!container) return;
  container.innerHTML = '';

  events.forEach((ev, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-event-card';
    card.innerHTML = `
      <div class="event-card-head">
        <h4>कार्यक्रम ${idx + 1}: ${ev.name} — ${ev.date} (${ev.dayHindi})</h4>
        <span style="font-size: 0.8rem; background: #EBDBC8; padding: 3px 10px; border-radius: 12px; font-weight: 600;">
          थीम: ${ev.theme}
        </span>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>टैगलाइन (Tagline)</label>
          <input type="text" class="form-control event-tagline-input" data-index="${idx}" value="${ev.tagline || ''}" />
        </div>
        <div class="form-group">
          <label>शुभ मुहूर्त / समय (Time Placeholder)</label>
          <input type="text" class="form-control event-time-input" data-index="${idx}" value="${ev.time || ''}" />
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>वेन्यू का नाम (Venue Name)</label>
          <input type="text" class="form-control event-venue-input" data-index="${idx}" value="${ev.venue || ''}" />
        </div>
        <div class="form-group">
          <label>वेन्यू का पूरा पता (Address)</label>
          <input type="text" class="form-control event-address-input" data-index="${idx}" value="${ev.address || ''}" />
        </div>
      </div>

      <div class="form-group">
        <label>गूगल मैप्स लिंक (Google Maps URL)</label>
        <input type="url" class="form-control event-map-input" data-index="${idx}" value="${ev.mapUrl || ''}" />
      </div>

      <div class="form-group">
        <label>विस्तृत विवरण (Description)</label>
        <textarea class="form-control event-desc-input" data-index="${idx}">${ev.description || ''}</textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

// 4. Render Story in Admin
function renderAdminStory(storyList) {
  const container = document.getElementById('adminStoryList');
  if (!container) return;
  container.innerHTML = '';

  storyList.forEach((s, idx) => {
    const box = document.createElement('div');
    box.className = 'admin-event-card';
    box.innerHTML = `
      <div class="form-grid">
        <div class="form-group">
          <label>वर्ष (Year)</label>
          <input type="text" class="form-control story-year-input" data-index="${idx}" value="${s.year || ''}" />
        </div>
        <div class="form-group">
          <label>अध्याय शीर्षक (Chapter)</label>
          <input type="text" class="form-control story-chapter-input" data-index="${idx}" value="${s.chapter || ''}" />
        </div>
      </div>
      <div class="form-group">
        <label>कहानी का शीर्षक (Title)</label>
        <input type="text" class="form-control story-title-input" data-index="${idx}" value="${s.title || ''}" />
      </div>
      <div class="form-group">
        <label>कहानी का विवरण (Description)</label>
        <textarea class="form-control story-desc-input" data-index="${idx}">${s.description || ''}</textarea>
      </div>
    `;
    container.appendChild(box);
  });
}

// 5. Render Gallery in Admin
function renderAdminGallery(gallery) {
  const container = document.getElementById('adminGalleryGrid');
  if (!container) return;
  container.innerHTML = '';

  gallery.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'admin-gallery-item';
    div.innerHTML = `
      <img src="${item.url}" alt="${item.caption || 'Gallery'}" />
      <button class="btn-delete-photo" onclick="deleteGalleryPhoto(${idx})" title="फोटो हटाएं">✕</button>
    `;
    container.appendChild(div);
  });
}

window.deleteGalleryPhoto = async function(index) {
  if (!confirm('क्या आप इस फोटो को गैलरी से हटाना चाहते हैं?')) return;
  try {
    const res = await fetch(`/api/gallery/${index}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      invitationData.gallery = json.gallery;
      renderAdminGallery(json.gallery);
      showToast('फोटो हटा दी गई');
    }
  } catch (err) {
    showToast('फोटो हटाने में त्रुटि', true);
  }
};

// 6. Handle File Uploads (Bride, Groom, Gallery, Company Logo, Music)
function setupFileUploads() {
  // Bride File Upload
  const brideFileInput = document.getElementById('brideFileInput');
  if (brideFileInput) {
    brideFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('bride', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success && json.uploaded.bridePhoto) {
          invitationData.couple.bride.photo = json.uploaded.bridePhoto;
          document.getElementById('adminBridePreview').src = json.uploaded.bridePhoto;
          showToast('वधू की नई फोटो अपलोड हो गई!');
        }
      } catch (err) {
        showToast('फोटो अपलोड करने में त्रुटि', true);
      }
    });
  }

  // Groom File Upload
  const groomFileInput = document.getElementById('groomFileInput');
  if (groomFileInput) {
    groomFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('groom', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success && json.uploaded.groomPhoto) {
          invitationData.couple.groom.photo = json.uploaded.groomPhoto;
          document.getElementById('adminGroomPreview').src = json.uploaded.groomPhoto;
          showToast('वर की नई फोटो अपलोड हो गई!');
        }
      } catch (err) {
        showToast('फोटो अपलोड करने में त्रुटि', true);
      }
    });
  }

  // Company Logo Upload
  const companyLogoInput = document.getElementById('companyLogoInput');
  if (companyLogoInput) {
    companyLogoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('companyLogo', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success && json.uploaded.companyLogo) {
          invitationData.general.company.logoUrl = json.uploaded.companyLogo;
          invitationData.general.company.showLogo = true;
          document.getElementById('showCompanyLogoCheckbox').checked = true;

          const logoImg = document.getElementById('companyLogoPreviewImg');
          logoImg.src = json.uploaded.companyLogo;
          logoImg.style.display = 'block';
          document.getElementById('companyLogoPlaceholderText').style.display = 'none';

          showToast('कंपनी लोगो अपलोड हो गया!');
        }
      } catch (err) {
        showToast('लोगो अपलोड में त्रुटि', true);
      }
    });
  }

  // Gallery Multiple Files Upload
  const galleryFilesInput = document.getElementById('galleryFilesInput');
  if (galleryFilesInput) {
    galleryFilesInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('gallery', files[i]);
      }

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success && json.invitation) {
          invitationData = json.invitation;
          renderAdminGallery(invitationData.gallery);
          showToast(`${files.length} नई तस्वीरें गैलरी में जुड़ गईं!`);
        }
      } catch (err) {
        showToast('तस्वीरें अपलोड करने में त्रुटि', true);
      }
    });
  }

  // Music File Upload
  const musicFileInput = document.getElementById('musicFileInput');
  if (musicFileInput) {
    musicFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const fd = new FormData();
      fd.append('music', file);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (json.success && json.uploaded.musicUrl) {
          invitationData.general.musicUrl = json.uploaded.musicUrl;
          document.getElementById('adminAudioPlayer').src = json.uploaded.musicUrl;
          showToast('नया संगीत ट्रैक लोड हो गया!');
        }
      } catch (err) {
        showToast('ऑडियो फाइल अपलोड में त्रुटि', true);
      }
    });
  }
}

// 7. Save All Changes to Server
async function saveAllChanges() {
  if (!invitationData) return;

  // 1. Couple Details
  invitationData.couple.bride.name = document.getElementById('brideNameInput').value;
  invitationData.couple.bride.title = document.getElementById('brideTitleInput').value;
  invitationData.couple.bride.zoom = parseInt(document.getElementById('brideZoomSlider').value, 10);
  invitationData.couple.bride.positionX = parseInt(document.getElementById('brideXSlider').value, 10);
  invitationData.couple.bride.positionY = parseInt(document.getElementById('brideYSlider').value, 10);

  invitationData.couple.groom.name = document.getElementById('groomNameInput').value;
  invitationData.couple.groom.title = document.getElementById('groomTitleInput').value;
  invitationData.couple.groom.zoom = parseInt(document.getElementById('groomZoomSlider').value, 10);
  invitationData.couple.groom.positionX = parseInt(document.getElementById('groomXSlider').value, 10);
  invitationData.couple.groom.positionY = parseInt(document.getElementById('groomYSlider').value, 10);

  // 2. Sacred & Welcome Texts
  invitationData.general.welcomeShlok = document.getElementById('welcomeShlokInput').value;
  invitationData.general.invitationHeading = document.getElementById('mainTitleInput').value;
  invitationData.general.welcomeMessage = document.getElementById('welcomeMessageInput').value;

  // 3. Four Events
  const taglineInputs = document.querySelectorAll('.event-tagline-input');
  const timeInputs = document.querySelectorAll('.event-time-input');
  const venueInputs = document.querySelectorAll('.event-venue-input');
  const addressInputs = document.querySelectorAll('.event-address-input');
  const mapInputs = document.querySelectorAll('.event-map-input');
  const descInputs = document.querySelectorAll('.event-desc-input');

  taglineInputs.forEach((inp, idx) => {
    if (invitationData.events[idx]) {
      invitationData.events[idx].tagline = inp.value;
      invitationData.events[idx].time = timeInputs[idx].value;
      invitationData.events[idx].venue = venueInputs[idx].value;
      invitationData.events[idx].address = addressInputs[idx].value;
      invitationData.events[idx].mapUrl = mapInputs[idx].value;
      invitationData.events[idx].description = descInputs[idx].value;
    }
  });

  // 4. Countdown
  const cdTarget = document.getElementById('countdownTargetInput').value;
  if (cdTarget) {
    invitationData.countdown.targetDate = new Date(cdTarget).toISOString();
  }
  invitationData.countdown.demoTimeNote = document.getElementById('countdownDemoNoteInput').value;

  // 5. Families
  invitationData.families.groom.grandFather = document.getElementById('groomGfInput').value;
  invitationData.families.groom.grandMother = document.getElementById('groomGmInput').value;
  invitationData.families.groom.father = document.getElementById('groomFatherInput').value;
  invitationData.families.groom.mother = document.getElementById('groomMotherInput').value;
  invitationData.families.groom.address = document.getElementById('groomCityInput').value;
  invitationData.families.groom.quote = document.getElementById('groomQuoteInput').value;

  invitationData.families.bride.grandFather = document.getElementById('brideGfInput').value;
  invitationData.families.bride.grandMother = document.getElementById('brideGmInput').value;
  invitationData.families.bride.father = document.getElementById('brideFatherInput').value;
  invitationData.families.bride.mother = document.getElementById('brideMotherInput').value;
  invitationData.families.bride.address = document.getElementById('brideCityInput').value;
  invitationData.families.bride.quote = document.getElementById('brideQuoteInput').value;

  // 6. Story
  const yearInputs = document.querySelectorAll('.story-year-input');
  const chapterInputs = document.querySelectorAll('.story-chapter-input');
  const titleInputs = document.querySelectorAll('.story-title-input');
  const sDescInputs = document.querySelectorAll('.story-desc-input');

  yearInputs.forEach((inp, idx) => {
    if (invitationData.story[idx]) {
      invitationData.story[idx].year = inp.value;
      invitationData.story[idx].chapter = chapterInputs[idx].value;
      invitationData.story[idx].title = titleInputs[idx].value;
      invitationData.story[idx].description = sDescInputs[idx].value;
    }
  });

  // 7. Company Logo & Branding (small & understated)
  invitationData.general.company.name = document.getElementById('companyNameInput').value;
  invitationData.general.company.tagline = document.getElementById('companyTaglineInput').value;
  invitationData.general.company.showLogo = document.getElementById('showCompanyLogoCheckbox').checked;

  // 8. RSVP
  invitationData.rsvp.whatsappNumber = document.getElementById('rsvpWhatsappInput').value;
  invitationData.rsvp.defaultMessage = document.getElementById('rsvpMessageInput').value;

  // POST to API
  try {
    const res = await fetch('/api/invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invitationData)
    });
    const json = await res.json();
    if (json.success) {
      showToast('🎉 सभी बदलाव सफलतापूर्वक सुरक्षित कर दिए गए!');
    } else {
      showToast('बदलाव सुरक्षित करने में त्रुटि हुई', true);
    }
  } catch (err) {
    console.error('Error saving:', err);
    showToast('सर्वर से कनेक्ट करने में त्रुटि', true);
  }
}

// Attach Save Button
document.getElementById('saveChangesBtn').addEventListener('click', saveAllChanges);

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  setupSliders();
  setupFileUploads();
  loadAdminData();
});
