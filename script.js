 // ---------- SES MOTORU  ----------
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playHoverSound() {
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, audioCtx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  }

  function playClickSound() {
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, audioCtx.currentTime + 0.02);
      osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}
  }

  function playBubblePopSound(index = 0) {
    try {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      const baseFreq = 520 + (index * 70);
      osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, audioCtx.currentTime + 0.07);

      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.07);
    } catch (e) {}
  }

  document.querySelectorAll('button, a, .project-card').forEach(el => {
    el.addEventListener('mouseenter', playHoverSound);
    el.addEventListener('click', playClickSound);
  });

  // ---------- DİL DEĞİŞTİRME ----------
  const langToggle = document.getElementById('langToggle');
  let currentLang = 'tr';

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    langToggle.textContent = lang === 'tr' ? 'EN' : 'TR';
    langToggle.setAttribute('aria-label', lang === 'tr' ? 'Switch to English' : 'Türkçeye Geç');
  }

  langToggle.addEventListener('click', () => {
    applyLanguage(currentLang === 'tr' ? 'en' : 'tr');
  });

  // ---------- ARKA PLAN MÜZİĞİ SENTEZLEYİCİSİ ----------
  let isMusicPlaying = true;
  let musicInterval = null;
  let activeNodes = [];
  const musicToggle = document.getElementById('musicToggle');
  const musicIcon = document.getElementById('musicIcon');

  const soundOnIcon = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>';
  const soundOffIcon = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';

  const chords = [
    [261.63, 329.63, 392.00, 493.88],
    [220.00, 261.63, 329.63, 392.00],
    [174.61, 220.00, 261.63, 329.63],
    [196.00, 246.94, 293.66, 329.63]
  ];
  let chordIndex = 0;

  function startMusicLoop() {
    if (!musicInterval) {
      playSoftChord(chords[chordIndex]);
      musicInterval = setInterval(() => {
        chordIndex = (chordIndex + 1) % chords.length;
        playSoftChord(chords[chordIndex]);
      }, 3400);
    }
  }

  function stopMusicLoop() {
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }
    activeNodes.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        osc.stop(audioCtx.currentTime);
      } catch (e) {}
    });
    activeNodes = [];
  }

  function playSoftChord(frequencies) {
    if (!isMusicPlaying || !audioCtx) return;
    
    frequencies.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, audioCtx.currentTime);

      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + 4.0);

      activeNodes.push({ osc, gain });

      setTimeout(() => {
        activeNodes = activeNodes.filter(n => n.osc !== osc);
      }, 4000);
    });
  }

  function toggleMusic() {
    initAudio();
    isMusicPlaying = !isMusicPlaying;

    if (isMusicPlaying) {
      musicIcon.innerHTML = soundOnIcon;
      musicToggle.setAttribute('aria-label', 'Müziği Kapat');
      startMusicLoop();
    } else {
      musicIcon.innerHTML = soundOffIcon;
      musicToggle.setAttribute('aria-label', 'Müziği Başlat');
      stopMusicLoop();
    }
  }

  musicToggle.addEventListener('click', toggleMusic);

  function autoStartOnFirstInteraction() {
    if (isMusicPlaying && !musicInterval) {
      initAudio();
      startMusicLoop();
    }
    document.removeEventListener('pointerdown', autoStartOnFirstInteraction);
    document.removeEventListener('keydown', autoStartOnFirstInteraction);
  }

  document.addEventListener('pointerdown', autoStartOnFirstInteraction);
  document.addEventListener('keydown', autoStartOnFirstInteraction);

  // Dark mode toggle
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const sunIcon = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>';
  const moonIcon = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>';

  function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.innerHTML = theme === 'dark' ? moonIcon : sunIcon;
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Aydınlık modu aç' : 'Karanlık modu aç');
  }

  let currentTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  applyTheme(currentTheme);

  themeToggle.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
  });

  // Mail window: open, close, drag
  const mailWindow = document.getElementById('mailWindow');
  const openBtn = document.getElementById('openMail');
  const closeBtn = document.getElementById('closeMail');
  const dragBar = document.getElementById('mailDrag');

  openBtn.addEventListener('click', () => {
    mailWindow.classList.add('open');
  });
  closeBtn.addEventListener('click', () => {
    mailWindow.classList.remove('open');
  });

  let dragging = false, offsetX = 0, offsetY = 0;
  dragBar.addEventListener('pointerdown', (e) => {
    if (e.target === closeBtn) return;
    dragging = true;
    const rect = mailWindow.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    mailWindow.style.transform = 'none';
    mailWindow.style.left = rect.left + 'px';
    mailWindow.style.top = rect.top + 'px';
    dragBar.setPointerCapture(e.pointerId);
  });
  dragBar.addEventListener('pointermove', (e) => {
    if(!dragging) return;
    mailWindow.style.left = (e.clientX - offsetX) + 'px';
    mailWindow.style.top = (e.clientY - offsetY) + 'px';
  });
  dragBar.addEventListener('pointerup', () => dragging = false);

  // Scroll reveal for project cards
  const cards = document.querySelectorAll('.project-card');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  cards.forEach(c => io.observe(c));

  // Project detail modal data & logic
  const projects = {
    talentlens: {
      window: 'cv-analiz-asistani.ai',
      title: {
        tr: 'Yapay Zeka Destekli CV Analiz ve İK Asistanı (Bitirme Tezi)',
        en: 'AI-Powered CV Analysis & HR Assistant (Graduation Thesis)'
      },
      desc: {
        tr: 'Dify ve Claude (Sonnet) iş akışları entegre edilerek CV metinleri %86.7 alan doğruluğu ile JSON şemalarına dönüştürüldü. RAG destekli akıllı İK sohbet botu geliştirildi. TF-IDF ve LLM sıralama algoritmaları karşılaştırıldı; eşleştirmede NDCG@5 skorunda 0.908 ve Pearson korelasyonunda 0.752 başarı elde edildi. PyMuPDF, python-docx ve pandas ile veri boru hatları kurularak kararlar Streamlit kontrol paneline aktarıldı.',
        en: 'Integrated Dify and Claude (Sonnet) workflows to convert CV texts into JSON schemas with 86.7% field accuracy. Developed a RAG-supported smart HR chatbot. Compared TF-IDF and LLM ranking algorithms; achieved 0.908 in NDCG@5 and 0.752 in Pearson correlation. Built data pipelines using PyMuPDF, python-docx, and pandas to feed decisions into a Streamlit dashboard.'
      },
      tags: ['Dify', 'Claude Sonnet', 'RAG', 'Streamlit', 'Python', 'PyMuPDF', 'Pandas'],
      repo: 'https://github.com/bsenurbas/cv-analiz-asistani',
      demo: 'https://cv-analiz-asistani-uio3.vercel.app',
      shots: [
        'assets/cv-analiz-asistanı-1.png',
        'assets/cv-analiz-asistanı-2.png',
        'assets/cv-analiz-asistanı-3.png',
        'assets/cv-analiz-asistanı-4.png',
        'assets/cv-analiz-asistanı-5.png'
      ]
    },
    telcoai: {
      window: 'telco-ai-assistant.py',
      title: {
        tr: 'Telekom AI Destek & Ağ Arıza Çözüm Asistanı',
        en: 'Telecom AI Support & Network Fault Resolution Assistant'
      },
      desc: {
        tr: 'GSMA CAMARA Open Gateway API standartları üzerinden gerçek zamanlı hat ve cihaz durumunu sorgulayan Tool/Function Calling mimarisi. ChromaDB ve sentence-transformers tabanlı RAG motoru ile teknik kılavuz taraması yaparken, Groq LLM (Llama-3.1-70B) ve FastAPI altyapısı ile güvenli, çok turlu bir akıllı destek deneyimi sunar.',
        en: 'Tool/Function Calling architecture querying real-time line and device status via GSMA CAMARA Open Gateway API standards. Powered by a ChromaDB and sentence-transformers based RAG engine for technical manual scanning, backed by Groq LLM (Llama-3.1-70B) and FastAPI.'
      },
      tags: ['FastAPI', 'Streamlit', 'LangChain', 'Groq Llama-3', 'ChromaDB', 'CAMARA API'],
      repo: 'https://github.com/sudecokyasar/Telecom-AI-Assistant',
      demo: 'https://telecom-ai-assistant1.streamlit.app',
      shots: [
        'assets/telecom-1.png',
        'assets/telecom-2.png',
        'assets/telecom-3.png',
        'assets/telecom-4.png',
        'assets/telecom-5.png'
      ]
    },
    companyhr: {
      window: 'company-hr.unity',
      title: {
        tr: 'Company & HR - Mobil Simülasyon Oyunu',
        en: 'Company & HR - Mobile Simulation Game'
      },
      desc: {
        tr: 'Bir İK uzmanı olarak patronun talepleri ile çalışanların mutluluğu arasındaki ince çizgide denge kurmaya çalıştığınız karar odaklı bir mobil simülasyon ve yönetim oyunu. İşe alımlar, bütçe yönetimi, ofis içi krizler ve birebir çalışan iletişimleriyle şirketi başarıya taşıyın.',
        en: 'A decision-driven mobile simulation and management game where you balance boss demands and employee happiness as an HR specialist. Lead your company to success through recruitment, budget management, office crises, and one-on-one staff communication.'
      },
      tags: ['Unity (2D)', 'C#', 'Aseprite', 'UI/UX', 'Mobile Game'],
      repo: 'https://github.com/kyatoprak/Company-HR',
      demo: '#',
      shots: [
        'assets/hr-1.png',
        'assets/hr-2.png',
        'assets/hr-3.png',
        'assets/hr-4.png',
        'assets/hr-5.png',
        'assets/hr-6.png',
        'assets/hr-7.png'
      ]
    },
    huetrace: {
      window: 'hue-trace.game',
      title: {
        tr: 'Hue Trace - Renk Bağlama Bulmaca Oyunu',
        en: 'Hue Trace - Color Connect Puzzle Game'
      },
      desc: {
        tr: 'Unity ve C# kullanılarak geliştirilen, grid tabanlı bir renk bağlama bulmaca oyunu. Klasik "aynı renkteki taşları birleştir" mekaniğinin üzerine kilitli hücreler, tek kullanımlık buz blokları, çakışan renkleri taşıyabilen köprü hücreleri sistemleri eklendi. Easy, Normal ve Hard olmak üzere 3 zorluk modunda toplam 300 level bulunuyor.',
        en: 'A grid-based color-connecting puzzle game developed using Unity and C#. Building upon the classic "connect same-colored tiles" mechanic, the game incorporates systems such as locked cells, single-use ice blocks, and bridge cells capable of carrying overlapping colors. It features a total of 300 levels across three difficulty modes: Easy, Normal, and Hard.'
      },
      tags: ['Unity', 'C#', 'Mobile Game', 'Puzzle Design', 'Game Architecture'],
      repo: 'https://github.com/sudecokyasar/Hue-Trace-MobileGame',
      demo: '',
      shots: [
        'assets/hue-1.png',
        'assets/hue-2.png',
        'assets/hue-3.png',
        'assets/hue-4.png',
        'assets/hue-5.png',
        'assets/hue-6.png'
      ]
    }
  };

  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalPanel = document.getElementById('modalPanel');
  const modalDragBar = document.getElementById('modalDrag');
  const modalWindowTitle = document.getElementById('modalWindowTitle');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalTags = document.getElementById('modalTags');
  const modalRepo = document.getElementById('modalRepo');
  const modalDemo = document.getElementById('modalDemo');
  const modalClose = document.getElementById('modalClose');
  const shotGrid = document.querySelector('.shot-grid');

  function openProjectModal(key){
    const p = projects[key];
    if(!p) return;
    
    modalPanel.style.left = '';
    modalPanel.style.top = '';
    modalPanel.style.transform = '';

    modalWindowTitle.textContent = p.window;
    modalTitle.textContent = p.title[currentLang];
    modalDesc.textContent = p.desc[currentLang];
    modalTags.innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
    
    shotGrid.innerHTML = p.shots.map((imgSrc, idx) => `
      <div class="shot" onclick="openLightbox(projects['${key}'].shots, ${idx})">
        <img src="${imgSrc}" alt="Proje Ekran Görüntüsü" style="width:100%; height:100%; object-fit:cover; cursor:pointer;">
      </div>
    `).join('');

    modalRepo.href = p.repo;
    if(p.demo && p.demo !== '#'){
      modalDemo.href = p.demo;
      modalDemo.style.display = 'inline-flex';
    } else {
      modalDemo.style.display = 'none';
    }
    
    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal(){
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  cards.forEach(card => {
    card.addEventListener('click', () => openProjectModal(card.dataset.project));
  });
  
  modalClose.addEventListener('click', closeProjectModal);
  modalBackdrop.addEventListener('click', (e) => {
    if(e.target === modalBackdrop) closeProjectModal();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') closeProjectModal();
  });

  let modalDragging = false, modalStartX = 0, modalStartY = 0, initialLeft = 0, initialTop = 0;
  
  modalDragBar.addEventListener('pointerdown', (e) => {
    if (e.target === modalClose) return;
    modalDragging = true;
    
    const rect = modalPanel.getBoundingClientRect();
    
    modalPanel.style.transform = 'none';
    modalPanel.style.left = rect.left + 'px';
    modalPanel.style.top = rect.top + 'px';
    
    initialLeft = rect.left;
    initialTop = rect.top;
    modalStartX = e.clientX;
    modalStartY = e.clientY;
    
    modalDragBar.setPointerCapture(e.pointerId);
  });
  
  modalDragBar.addEventListener('pointermove', (e) => {
    if(!modalDragging) return;
    const dx = e.clientX - modalStartX;
    const dy = e.clientY - modalStartY;
    
    modalPanel.style.left = (initialLeft + dx) + 'px';
    modalPanel.style.top = (initialTop + dy) + 'px';
  });
  
  modalDragBar.addEventListener('pointerup', (e) => {
    modalDragging = false;
    try {
      modalDragBar.releasePointerCapture(e.pointerId);
    } catch(err) {}
  });

  let currentShots = [];
  let currentIndex = 0;

  function openLightbox(shotsArray, startIndex) {
    currentShots = shotsArray;
    currentIndex = startIndex;
    updateLightboxImage();
    document.getElementById('lightbox').style.display = 'flex';
  }

  function updateLightboxImage() {
    const lightboxImg = document.getElementById('lightboxImg');
    lightboxImg.src = currentShots[currentIndex];
  }

  function changeSlide(direction) {
    currentIndex += direction;
    if (currentIndex < 0) {
      currentIndex = currentShots.length - 1;
    } else if (currentIndex >= currentShots.length) {
      currentIndex = 0;
    }
    updateLightboxImage();
  }

  function closeLightbox() {
    document.getElementById('lightbox').style.display = 'none';
  }

  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.style.display === 'flex') {
      if (e.key === 'ArrowLeft') changeSlide(-1);
      if (e.key === 'ArrowRight') changeSlide(1);
      if (e.key === 'Escape') closeLightbox();
    }
  });

  const expItems = document.querySelectorAll('.exp-item[data-skills]');
  expItems.forEach(item => {
    const skills = item.dataset.skills.split(',').map(s => s.trim()).filter(Boolean);

    const bubbles = skills.map(skill => {
      const el = document.createElement('div');
      el.className = 'skill-bubble';
      el.textContent = skill;
      document.body.appendChild(el);
      return { el, x: 0, y: 0 };
    });

    const bubbleGapY = 46;
    const stepX = 46, stepY = 42;
    const revealDelay = 90;

    let mouseX = 0, mouseY = 0;
    let dirX = 1;
    let rafId = null;
    let active = false;
    let timeouts = [];

    function loop(){
      bubbles.forEach((b, i) => {
        const ease = 0.22;
        const targetX = b.revealed ? mouseX + i * stepX * dirX : mouseX;
        const targetY = b.revealed ? mouseY + bubbleGapY + i * stepY : mouseY;
        
        b.x += (targetX - b.x) * ease;
        b.y += (targetY - b.y) * ease;
        
        b.el.style.left = b.x + 'px';
        b.el.style.top = b.y + 'px';
        b.el.style.transform = `translate(-50%,-50%) scale(1)`;
      });
      if (active) rafId = requestAnimationFrame(loop);
    }

    item.addEventListener('mouseenter', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      bubbles.forEach((b, i) => {
        b.x = mouseX;
        b.y = mouseY;
        b.revealed = false;
        const t = setTimeout(() => {
          b.revealed = true;
          b.el.classList.add('is-visible');
          playBubblePopSound(i);
        }, i * revealDelay);
        timeouts.push(t);
      });
      active = true;
      if (!rafId) rafId = requestAnimationFrame(loop);
    });

    item.addEventListener('mousemove', (e) => {
      const dx = e.clientX - mouseX;
      if (Math.abs(dx) > 2) {
        dirX = dx > 0 ? -1 : 1;
      }
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    item.addEventListener('mouseleave', () => {
      active = false;
      timeouts.forEach(t => clearTimeout(t));
      timeouts = [];
      bubbles.forEach(b => {
        b.revealed = false;
        b.el.classList.remove('is-visible');
      });
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    });
  });

  // Proje kartları
  (function () {
    const viewport = document.getElementById('projectsViewport');
    const track = document.getElementById('projectsGrid');
    if (!viewport || !track) return;

  let isDown = false;
  let startX = 0;
  let startScrollLeft = 0;
  let hasDragged = false;
  let activePointerId = null;

  viewport.addEventListener('pointerdown', (e) => {
    isDown = true;
    hasDragged = false;
    startX = e.clientX;
    startScrollLeft = viewport.scrollLeft;
    activePointerId = e.pointerId;
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (!hasDragged && Math.abs(dx) > 4) {

      hasDragged = true;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture(activePointerId);
    }
    if (hasDragged) {
      viewport.scrollLeft = startScrollLeft - dx;
    }
  });

  function endDrag() {
    isDown = false;
    viewport.classList.remove('is-dragging');
  }
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointerleave', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    viewport.addEventListener('click', (e) => {
      if (hasDragged) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  })();