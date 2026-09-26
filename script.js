(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const videoModal = document.querySelector('#video-modal');
  const contactModal = document.querySelector('#contact-modal');
  const videoFrame = document.querySelector('#video-frame');
  const videoTitle = document.querySelector('#video-title');
  const localPlayerNote = document.querySelector('#local-player-note');
  const menuToggle = document.querySelector('#menu-toggle');
  const siteNav = document.querySelector('#site-nav');
  const copyButton = document.querySelector('#copy-email');
  const copyStatus = document.querySelector('#copy-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeModal = null;
  let returnFocus = null;
  let savedScroll = { x: 0, y: 0 };
  let savedBodyTop = '';
  let viewportFrame = 0;

  function syncViewport() {
    cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(() => {
      const height = window.visualViewport?.height || window.innerHeight;
      root.style.setProperty('--viewport-height', `${height}px`);
    });
  }
  syncViewport();
  window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });
  window.addEventListener('resize', () => {
    syncViewport();
    if (window.innerWidth > 1100) closeMenu();
  }, { passive: true });

  document.querySelectorAll('.cover-ui > img').forEach((image) => {
    const markMissing = () => image.classList.add('image-error');
    image.addEventListener('error', markMissing);
    if (image.complete && image.naturalWidth === 0) markMissing();
  });

  function closeMenu() {
    siteNav.classList.remove('is-open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
  }
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    menuToggle.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });
  siteNav.querySelectorAll('a, button').forEach((item) => item.addEventListener('click', closeMenu));
  document.addEventListener('pointerdown', (event) => {
    if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      closeMenu();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start', inline: 'nearest' });
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        history.replaceState(null, '', hash);
      }
    });
  });

  function lockPage() {
    savedScroll = { x: window.scrollX, y: window.scrollY };
    savedBodyTop = body.style.top;
    body.style.top = `-${savedScroll.y}px`;
    root.classList.add('modal-open');
    body.classList.add('modal-open');
  }
  function unlockPage() {
    body.classList.remove('modal-open');
    body.style.top = savedBodyTop;
    // Restore instantly while smooth scrolling is still disabled.
    window.scrollTo({ left: savedScroll.x, top: savedScroll.y, behavior: 'instant' });
    root.classList.remove('modal-open');
  }
  function openModal(modal, trigger) {
    if (activeModal) return;
    closeMenu();
    returnFocus = trigger;
    lockPage();
    activeModal = modal;
    modal.showModal();
    const content = modal.querySelector('.contact-content, .video-content');
    if (content) content.scrollTop = 0;
    modal.querySelector('.modal-close').focus({ preventScroll: true });
  }
  function closeModal(modal) {
    if (modal.open) modal.close();
  }

  [videoModal, contactModal].forEach((modal) => {
    let startedOutside = false;
    const outsidePanel = (event) => {
      const rect = modal.getBoundingClientRect();
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    };
    modal.addEventListener('pointerdown', (event) => { startedOutside = event.target === modal && outsidePanel(event); });
    modal.addEventListener('click', (event) => {
      if (startedOutside && event.target === modal && outsidePanel(event)) closeModal(modal);
      startedOutside = false;
    });
    modal.addEventListener('close', () => {
      if (modal === videoModal) videoFrame.removeAttribute('src');
      if (activeModal !== modal) return;
      activeModal = null;
      unlockPage();
      const trigger = returnFocus;
      returnFocus = null;
      if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus({ preventScroll: true });
      else if (menuToggle.getClientRects().length) menuToggle.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll('.open-video').forEach((button) => {
    button.addEventListener('click', () => {
      if (activeModal || !/^[\w-]{11}$/.test(button.dataset.video || '')) return;
      videoTitle.textContent = button.dataset.title;
      videoFrame.title = button.dataset.title;
      const isHosted = location.protocol === 'http:' || location.protocol === 'https:';
      localPlayerNote.hidden = isHosted;
      videoFrame.parentElement.hidden = !isHosted;
      if (isHosted) {
        const params = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1', origin: location.origin });
        videoFrame.src = `https://www.youtube.com/embed/${button.dataset.video}?${params}`;
      }
      openModal(videoModal, button);
    });
  });
  document.querySelectorAll('.open-contact').forEach((button) => {
    button.addEventListener('click', () => {
      copyStatus.textContent = '';
      copyButton.classList.remove('copied');
      openModal(contactModal, button);
    });
  });
  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.closest('dialog')));
  });

  function copyFallback(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.setAttribute('aria-label', 'Endereço de e-mail para copiar');
    field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px';
    contactModal.appendChild(field);
    field.focus({ preventScroll: true });
    field.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { /* Manual copy remains available. */ }
    field.remove();
    copyButton.focus({ preventScroll: true });
    return copied;
  }
  copyButton.addEventListener('click', async () => {
    const email = 'contatovdreditor@gmail.com';
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        copied = true;
      }
    } catch { /* The fallback also works when Clipboard permission is denied. */ }
    if (!copied) copied = copyFallback(email);
    copyButton.classList.toggle('copied', copied);
    copyStatus.textContent = copied ? 'E-mail copiado!' : `Selecione e copie: ${email}`;
  });

  const feedbacks = document.querySelector('.feedbacks');
  const feedbackToggle = document.querySelector('.feedback-toggle');
  feedbackToggle.addEventListener('click', () => {
    const paused = feedbacks.classList.toggle('is-paused');
    feedbackToggle.setAttribute('aria-pressed', String(paused));
    feedbackToggle.setAttribute('aria-label', `${paused ? 'Retomar' : 'Pausar'} carrossel de feedbacks`);
    feedbackToggle.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
    feedbackToggle.querySelector('.feedback-toggle-label').textContent = paused ? 'Retomar carrossel' : 'Pausar carrossel';
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
      closeMenu();
      menuToggle.focus({ preventScroll: true });
    }
    // Native dialogs handle Escape, focus trapping and background inertness.
  });
})();
