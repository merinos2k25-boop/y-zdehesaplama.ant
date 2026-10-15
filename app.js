/**
 * Yüzde Hesaplayıcı - Mobile Web App
 * Featuring: Web Audio mechanical click sound, Haptic Vibration feedback,
 * 3D Barrel Drum Picker (1-100%), formatted TL input & real-time percentage results.
 */

(() => {
  // --- DOM Elements ---
  const amountInput = document.getElementById('amountInput');
  const clearBtn = document.getElementById('clearBtn');
  const presetChips = document.querySelectorAll('.preset-chip');
  
  const wheelViewport = document.getElementById('wheelViewport');
  const wheelItemsContainer = document.getElementById('wheelItemsContainer');
  const activePercentBadge = document.getElementById('activePercentBadge');
  const quickPctButtons = document.querySelectorAll('.quick-pct-btn');
  
  const formulaText = document.getElementById('formulaText');
  const resultPctLabel = document.getElementById('resultPctLabel');
  const percentAmount = document.getElementById('percentAmount');
  const totalWithPercent = document.getElementById('totalWithPercent');
  const totalWithoutPercent = document.getElementById('totalWithoutPercent');
  const copyMainBtn = document.getElementById('copyMainBtn');
  const toast = document.getElementById('toast');
  
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');
  const vibrateToggleBtn = document.getElementById('vibrateToggleBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const moonIcon = document.getElementById('moonIcon');
  const sunIcon = document.getElementById('sunIcon');

  // --- App State ---
  const ITEM_HEIGHT = 38; // px, corresponds to CSS --wheel-item-height
  const TOTAL_ITEMS = 100; // %1 to %100
  let currentPercentage = 20; // Default selected %20
  let rawAmount = 1000; // Default 1.000 TL
  let isSoundEnabled = true;
  let isVibrateEnabled = true;
  let lastTickIndex = 20;
  let lastTickTime = 0;
  let audioCtx = null;
  let isScrollingProgrammatically = false;
  let scrollTimeout = null;

  // --- Web Audio API: Synthetic Mechanical Rotary Click Sound ---
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTickSound() {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    const now = performance.now();
    // Rate limit rapid fire sound to prevent audio distortion
    if (now - lastTickTime < 18) return;
    lastTickTime = now;

    try {
      const t = audioCtx.currentTime;

      // 1. Tonal Click (High-to-low crisp click)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.012);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t);
      osc.stop(t + 0.016);

      // 2. Micro Noise Transient (tactile switch texture)
      const bufferSize = audioCtx.sampleRate * 0.005; // 5ms burst
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, t);
      filter.Q.setValueAtTime(3, t);

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.15, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.006);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.007);
    } catch {
      // Audio error silently ignored
    }
  }

  // --- Haptic Feedback (Vibration) ---
  function triggerHaptic() {
    if (!isVibrateEnabled) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(10); // 10ms subtle crisp vibration
      } catch {
        // Ignored if browser policy blocks
      }
    }
  }

  // --- Wheel Initialization (1 - 100) ---
  const wheelElements = [];
  function buildWheelItems() {
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= TOTAL_ITEMS; i++) {
      const item = document.createElement('div');
      item.className = 'wheel-item';
      item.dataset.value = i;
      item.textContent = `%${i}`;
      
      item.addEventListener('click', () => {
        scrollToPercentage(i, true);
      });

      fragment.appendChild(item);
      wheelElements.push(item);
    }
    wheelItemsContainer.appendChild(fragment);
  }

  // --- 3D Barrel Transform Calculation ---
  function updateWheel3DEffect() {
    const scrollTop = wheelViewport.scrollTop;
    const centerOffset = 0; // Relative to the top padding

    for (let i = 0; i < TOTAL_ITEMS; i++) {
      const item = wheelElements[i];
      const itemTop = i * ITEM_HEIGHT;
      const distanceFromCenter = (itemTop - scrollTop);
      const normalizedDist = distanceFromCenter / ITEM_HEIGHT;

      // Only transform items within visible radius
      if (Math.abs(normalizedDist) <= 3) {
        const rotateX = normalizedDist * -24; // degree curve
        const scale = Math.max(0.75, 1 - Math.abs(normalizedDist) * 0.12);
        const opacity = Math.max(0.18, 1 - Math.abs(normalizedDist) * 0.35);

        item.style.transform = `rotateX(${rotateX}deg) scale(${scale})`;
        item.style.opacity = opacity.toFixed(2);
      } else {
        item.style.opacity = '0.12';
        item.style.transform = 'scale(0.7)';
      }
    }
  }

  // --- Scroll Handler for Wheel Picker ---
  function onWheelScroll() {
    const scrollTop = wheelViewport.scrollTop;
    let closestIndex = Math.round(scrollTop / ITEM_HEIGHT) + 1;
    closestIndex = Math.max(1, Math.min(TOTAL_ITEMS, closestIndex));

    updateWheel3DEffect();

    if (closestIndex !== lastTickIndex) {
      playTickSound();
      triggerHaptic();
      lastTickIndex = closestIndex;
      currentPercentage = closestIndex;

      // Update badge and highlighted class
      wheelElements.forEach((el, idx) => {
        if (idx + 1 === currentPercentage) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });

      updateUI();
    }

    // Update active state on quick preset percentage buttons
    quickPctButtons.forEach(btn => {
      const pct = parseInt(btn.dataset.pct, 10);
      btn.classList.toggle('active', pct === currentPercentage);
    });
  }

  function scrollToPercentage(pct, smooth = true) {
    pct = Math.max(1, Math.min(TOTAL_ITEMS, pct));
    currentPercentage = pct;
    const targetScroll = (pct - 1) * ITEM_HEIGHT;

    wheelViewport.scrollTo({
      top: targetScroll,
      behavior: smooth ? 'smooth' : 'auto'
    });

    if (!smooth) {
      lastTickIndex = pct;
      onWheelScroll();
    }
  }

  // --- Currency Formatting & Parsing ---
  const trCurrencyFormatter = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function formatTL(num) {
    if (isNaN(num) || !isFinite(num)) return '0,00';
    return trCurrencyFormatter.format(num);
  }

  function parseInputAmount(str) {
    if (!str) return 0;
    // Replace thousands dots, replace comma with dot
    const sanitized = str.toString().replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
    const val = parseFloat(sanitized);
    return isNaN(val) ? 0 : val;
  }

  function formatInputValue(val) {
    if (!val && val !== 0) return '';
    return new Intl.NumberFormat('tr-TR', {
      maximumFractionDigits: 2
    }).format(val);
  }

  // --- Calculations ---
  function updateUI() {
    activePercentBadge.textContent = `%${currentPercentage}`;
    resultPctLabel.textContent = `%${currentPercentage}`;
    formulaText.textContent = `${formatTL(rawAmount)} ₺ × %${currentPercentage}`;

    // 1. Yüzde Payı: (Tutar * %) / 100
    const pctValue = (rawAmount * currentPercentage) / 100;
    percentAmount.textContent = formatTL(pctValue);

    // 2. Tutar + %: (Zam / Ekleme / KDV)
    const totalPlus = rawAmount + pctValue;
    totalWithPercent.textContent = `₺ ${formatTL(totalPlus)}`;

    // 3. Tutar - %: (İndirim / İskonto)
    const totalMinus = Math.max(0, rawAmount - pctValue);
    totalWithoutPercent.textContent = `₺ ${formatTL(totalMinus)}`;
  }

  // --- Input Handlers ---
  amountInput.value = formatInputValue(rawAmount);

  amountInput.addEventListener('input', (e) => {
    initAudio();
    const rawStr = e.target.value;
    rawAmount = parseInputAmount(rawStr);
    updateUI();
  });

  amountInput.addEventListener('blur', () => {
    if (rawAmount > 0) {
      amountInput.value = formatInputValue(rawAmount);
    }
  });

  amountInput.addEventListener('focus', () => {
    initAudio();
  });

  clearBtn.addEventListener('click', () => {
    initAudio();
    rawAmount = 0;
    amountInput.value = '';
    amountInput.focus();
    updateUI();
  });

  // Preset TL Chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      initAudio();
      playTickSound();
      triggerHaptic();
      const amt = parseFloat(chip.dataset.amount);
      rawAmount = amt;
      amountInput.value = formatInputValue(amt);
      updateUI();
    });
  });

  // Quick Percentage Buttons
  quickPctButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      initAudio();
      const pct = parseInt(btn.dataset.pct, 10);
      scrollToPercentage(pct, true);
    });
  });

  // Sound Toggle
  soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundToggleBtn.classList.toggle('active', isSoundEnabled);
    soundOnIcon.classList.toggle('hidden', !isSoundEnabled);
    soundOffIcon.classList.toggle('hidden', isSoundEnabled);
    if (isSoundEnabled) {
      initAudio();
      playTickSound();
    }
  });

  // Vibrate Toggle
  vibrateToggleBtn.addEventListener('click', () => {
    isVibrateEnabled = !isVibrateEnabled;
    vibrateToggleBtn.classList.toggle('active', isVibrateEnabled);
    if (isVibrateEnabled) {
      triggerHaptic();
    }
  });

  // --- Dark / Light Theme Toggle ---
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('yuzde_theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (theme === 'light') {
      moonIcon.classList.add('hidden');
      sunIcon.classList.remove('hidden');
      themeToggleBtn.classList.add('active');
      if (metaTheme) metaTheme.setAttribute('content', '#f1f5f9');
    } else {
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
      themeToggleBtn.classList.remove('active');
      if (metaTheme) metaTheme.setAttribute('content', '#090d16');
    }
  }

  const savedTheme = localStorage.getItem('yuzde_theme') || 
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  applyTheme(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    initAudio();
    playTickSound();
    triggerHaptic();
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  });

  // --- Mouse Wheel Support on Desktop for the Picker ---
  wheelViewport.addEventListener('wheel', (e) => {
    initAudio();
    // Allow natural smooth mouse scroll
  }, { passive: true });

  // Passive touch start to initialize audio on mobile
  document.addEventListener('touchstart', () => {
    initAudio();
  }, { once: true, passive: true });

  document.addEventListener('click', () => {
    initAudio();
  }, { once: true, passive: true });

  // Scroll event with requestAnimationFrame
  let ticking = false;
  wheelViewport.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onWheelScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // --- Copy Functionality with Toast ---
  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  function copyToClipboard(text, successMsg = 'Panoya kopyalandı!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg);
      }).catch(() => {
        fallbackCopy(text, successMsg);
      });
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, successMsg) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    tempInput.style.position = 'fixed';
    tempInput.style.left = '-9999px';
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch {
      showToast('Kopyalama başarısız!');
    }
    document.body.removeChild(tempInput);
  }

  copyMainBtn.addEventListener('click', () => {
    initAudio();
    playTickSound();
    triggerHaptic();
    const val = percentAmount.textContent.trim();
    const textToCopy = `₺ ${val} (${formatTL(rawAmount)} ₺'nin %${currentPercentage}'si)`;
    
    // Toggle copy button icon briefly
    const copyIcon = copyMainBtn.querySelector('.copy-icon');
    const checkIcon = copyMainBtn.querySelector('.check-icon');
    if (copyIcon && checkIcon) {
      copyIcon.classList.add('hidden');
      checkIcon.classList.remove('hidden');
      setTimeout(() => {
        copyIcon.classList.remove('hidden');
        checkIcon.classList.add('hidden');
      }, 1500);
    }

    copyToClipboard(textToCopy, `₺ ${val} kopyalandı!`);
  });

  // Clicking sub cards also copies their value
  document.getElementById('plusCard').addEventListener('click', () => {
    playTickSound();
    triggerHaptic();
    const val = totalWithPercent.textContent.trim();
    copyToClipboard(val, `Toplam tutar (${val}) kopyalandı!`);
  });

  document.getElementById('minusCard').addEventListener('click', () => {
    playTickSound();
    triggerHaptic();
    const val = totalWithoutPercent.textContent.trim();
    copyToClipboard(val, `İndirimli tutar (${val}) kopyalandı!`);
  });

  // --- Initial Setup ---
  buildWheelItems();
  // Scroll to default %20 without animation on initial load
  setTimeout(() => {
    scrollToPercentage(20, false);
    updateUI();
  }, 50);

})();
