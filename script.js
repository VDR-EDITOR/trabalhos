const body = document.body;
const videoModal = document.querySelector('#video-modal');
const contactModal = document.querySelector('#contact-modal');
const videoFrame = document.querySelector('#video-frame');
const videoTitle = document.querySelector('#video-title');
const localPlayerNote = document.querySelector('#local-player-note');

function openModal(modal) {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}

function closeModal(modal) {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  if (modal === videoModal) videoFrame.src = '';
  if (!document.querySelector('.modal.is-open')) body.classList.remove('modal-open');
}

document.querySelectorAll('.open-video').forEach((button) => {
  button.addEventListener('click', () => {
    videoTitle.textContent = button.dataset.title;
    const isHosted = location.protocol === 'http:' || location.protocol === 'https:';
    localPlayerNote.classList.toggle('is-visible', !isHosted);
    videoFrame.hidden = !isHosted;
    if (isHosted) {
      const origin = encodeURIComponent(location.origin);
      videoFrame.src = `https://www.youtube.com/embed/${button.dataset.video}?autoplay=1&rel=0&playsinline=1&origin=${origin}`;
    }
    openModal(videoModal);
  });
});

document.querySelectorAll('.open-contact').forEach((button) => {
  button.addEventListener('click', () => openModal(contactModal));
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => closeModal(button.dataset.close === 'video' ? videoModal : contactModal));
});

document.querySelector('#copy-email').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const status = button.querySelector('i');
  try {
    await navigator.clipboard.writeText('contatovdreditor@gmail.com');
    status.textContent = 'COPIADO!';
    button.classList.add('copied');
    setTimeout(() => { status.textContent = 'COPIAR'; button.classList.remove('copied'); }, 1800);
  } catch {
    window.location.href = 'mailto:contatovdreditor@gmail.com';
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelectorAll('.modal.is-open').forEach(closeModal);
});
