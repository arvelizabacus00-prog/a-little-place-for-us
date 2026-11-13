(() => {
  const pages = [...document.querySelectorAll('.page')];
  const navButtons = [...document.querySelectorAll('[data-nav]')];
  const validPages = new Set(pages.map((page) => page.dataset.page));
  const pageAliases = { home: 'home', memories: 'memories', letter: 'letter' };
  const storageKeys = {
    photos: 'little-place-for-us:photos',
    captions: 'little-place-for-us:captions',
    letter: 'little-place-for-us:letter',
    music: 'little-place-for-us:music-url'
  };

  const getSaved = (key, fallback) => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? fallback : JSON.parse(saved);
    } catch {
      return fallback;
    }
  };

  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage is optional. */ }
  };

  function showPage(pageName, shouldPush = true) {
    const nextPage = pageAliases[pageName] || 'home';
    pages.forEach((page) => {
      const active = page.dataset.page === nextPage;
      page.classList.toggle('is-active', active);
      page.setAttribute('aria-hidden', String(!active));
    });
    if (shouldPush) history.pushState({ page: nextPage }, '', `#${nextPage}`);
    document.title = nextPage === 'home'
      ? 'A Little Place for Us ♡'
      : nextPage === 'memories'
        ? 'Little Moments, Big Memories ♡'
        : 'Something I Want You to Know... ♡';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const initialHash = window.location.hash.replace('#', '');
  showPage(validPages.has(initialHash) ? initialHash : 'home', false);
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      showPage(button.dataset.nav);
      if (button.id === 'openWorld') music.play();
    });
  });
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    showPage(validPages.has(hash) ? hash : 'home', false);
  });

  // Memories: editable captions and replaceable images are saved locally.
  const savedCaptions = getSaved(storageKeys.captions, []);
  const savedPhotos = getSaved(storageKeys.photos, []);
  const memoryCards = [...document.querySelectorAll('.memory-card')];

  memoryCards.forEach((card, index) => {
    const caption = card.querySelector('.editable-caption');
    const input = card.querySelector('.photo-input');
    const trigger = card.querySelector('.photo-trigger');
    const frame = card.querySelector('.photo-frame');
    const image = card.querySelector('.memory-image');

    if (typeof savedCaptions[index] === 'string') caption.innerHTML = savedCaptions[index];
    if (savedPhotos[index]) applyPhoto(card, savedPhotos[index]);

    caption.addEventListener('input', () => {
      const captions = memoryCards.map((memoryCard) => memoryCard.querySelector('.editable-caption').innerHTML);
      save(storageKeys.captions, captions);
    });

    trigger.addEventListener('click', (event) => {
      if (event.target.closest('.memory-image') && frame.classList.contains('has-image')) {
        openLightbox(image.src, caption.innerText);
      } else {
        input.click();
      }
    });

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        applyPhoto(card, reader.result);
        const photos = memoryCards.map((memoryCard) => memoryCard.querySelector('.memory-image').src || '');
        save(storageKeys.photos, photos);
      });
      reader.readAsDataURL(file);
    });
  });

  function applyPhoto(card, dataUrl) {
    const image = card.querySelector('.memory-image');
    const frame = card.querySelector('.photo-frame');
    image.src = dataUrl;
    image.alt = `Memory photo ${Number(card.dataset.card) + 1}`;
    frame.classList.add('has-image');
  }

  // Photo lightbox.
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  };
  function openLightbox(src, caption) {
    lightboxImage.src = src;
    lightboxCaption.textContent = caption;
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
  });

  // Editable letter body and sign-off.
  const letterBody = document.getElementById('letterBody');
  const editableSignoff = document.querySelector('.editable-signoff');
  const savedLetter = getSaved(storageKeys.letter, null);
  if (savedLetter && typeof savedLetter === 'object') {
    if (savedLetter.body) letterBody.innerHTML = savedLetter.body;
    if (savedLetter.signoff) editableSignoff.innerHTML = savedLetter.signoff;
  }
  const saveLetter = () => save(storageKeys.letter, { body: letterBody.innerHTML, signoff: editableSignoff.innerHTML });
  letterBody.addEventListener('input', saveLetter);
  editableSignoff.addEventListener('input', saveLetter);

  // The final message reveal.
  const revealButton = document.getElementById('revealButton');
  const revealMessage = document.getElementById('revealMessage');
  revealButton.addEventListener('click', () => {
    const isOpen = revealButton.getAttribute('aria-expanded') === 'true';
    revealButton.setAttribute('aria-expanded', String(!isOpen));
    revealMessage.hidden = isOpen;
  });

  // Lightweight YouTube iframe player that remains mounted across all 3 pages.
  const musicFrame = document.getElementById('musicFrame');
  const musicPlayBtn = document.getElementById('musicPlayBtn');
  const musicMuteBtn = document.getElementById('musicMuteBtn');
  const musicState = document.getElementById('musicState');
  const musicUrl = document.getElementById('musicUrl');
  const saveMusicBtn = document.getElementById('saveMusicBtn');
  const defaultMusicUrl = 'https://www.youtube.com/watch?v=jfKfPfyJRdk';
  let musicPlaying = false;
  let musicMuted = true;

  const savedMusicUrl = getSaved(storageKeys.music, defaultMusicUrl);
  musicUrl.value = savedMusicUrl;
  const getVideoId = (url) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1).split('/')[0];
      if (parsed.searchParams.get('v')) return parsed.searchParams.get('v');
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const markerIndex = pathParts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part));
      return markerIndex >= 0 ? pathParts[markerIndex + 1] : '';
    } catch { return ''; }
  };
  const sendCommand = (func, args = '') => {
    if (!musicFrame.contentWindow) return;
    musicFrame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };
  const makeMusicSrc = (url) => {
    const videoId = getVideoId(url);
    if (!videoId) return '';
    const params = new URLSearchParams({
      enablejsapi: '1',
      playsinline: '1',
      controls: '0',
      rel: '0',
      modestbranding: '1',
      origin: window.location.origin,
      mute: '1'
    });
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  };
  const loadMusic = (url, shouldPlay = false) => {
    const src = makeMusicSrc(url);
    if (!src) {
      musicState.textContent = 'add a YouTube link';
      return false;
    }
    musicFrame.src = src;
    musicState.textContent = shouldPlay ? 'starting your song…' : 'paused for now';
    musicPlaying = false;
    musicMuted = true;
    musicPlayBtn.textContent = '▶';
    musicPlayBtn.setAttribute('aria-pressed', 'false');
    musicMuteBtn.textContent = '◌';
    musicMuteBtn.setAttribute('aria-label', 'Unmute background music');
    musicMuteBtn.setAttribute('aria-pressed', 'true');
    if (shouldPlay) window.setTimeout(() => playMusic(), 500);
    return true;
  };
  const playMusic = () => {
    sendCommand('playVideo');
    // A click on the welcome CTA is a user gesture, so sound can begin here.
    if (musicMuted) {
      sendCommand('unMute');
      sendCommand('setVolume', 55);
      musicMuted = false;
      musicMuteBtn.textContent = '◉';
      musicMuteBtn.setAttribute('aria-label', 'Mute background music');
      musicMuteBtn.setAttribute('aria-pressed', 'false');
    }
    musicPlaying = true;
    musicState.textContent = 'playing our soundtrack';
    musicPlayBtn.textContent = 'Ⅱ';
    musicPlayBtn.setAttribute('aria-label', 'Pause background music');
    musicPlayBtn.setAttribute('aria-pressed', 'true');
  };
  const pauseMusic = () => {
    sendCommand('pauseVideo');
    musicPlaying = false;
    musicState.textContent = 'paused for now';
    musicPlayBtn.textContent = '▶';
    musicPlayBtn.setAttribute('aria-label', 'Play background music');
    musicPlayBtn.setAttribute('aria-pressed', 'false');
  };
  loadMusic(savedMusicUrl, false);
  musicPlayBtn.addEventListener('click', () => musicPlaying ? pauseMusic() : playMusic());
  musicMuteBtn.addEventListener('click', () => {
    if (musicMuted) {
      sendCommand('unMute');
      sendCommand('setVolume', 55);
      musicMuted = false;
      musicMuteBtn.textContent = '◉';
      musicMuteBtn.setAttribute('aria-label', 'Mute background music');
      musicMuteBtn.setAttribute('aria-pressed', 'false');
      if (!musicPlaying) playMusic();
    } else {
      sendCommand('mute');
      musicMuted = true;
      musicMuteBtn.textContent = '◌';
      musicMuteBtn.setAttribute('aria-label', 'Unmute background music');
      musicMuteBtn.setAttribute('aria-pressed', 'true');
    }
  });
  saveMusicBtn.addEventListener('click', () => {
    const url = musicUrl.value.trim();
    if (!makeMusicSrc(url)) {
      musicState.textContent = 'that link needs a video';
      musicUrl.focus();
      return;
    }
    save(storageKeys.music, url);
    loadMusic(url, false);
    musicState.textContent = 'song updated';
  });
})();