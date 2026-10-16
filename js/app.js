// ==========================================
// تطبيق القرآن الكريم - المنطق الرئيسي
// ==========================================

const API_BASE = 'https://api.alquran.cloud/v1';
let currentPage = 'quran';
let adhanState = { loop: false, player: null };
let ruqyahState = { loop: false, player: null };

// ===== شاشة الترحيب =====
setTimeout(() => {
  const welcome = document.getElementById('welcomeScreen');
  if (welcome) {
    welcome.classList.add('hidden');
    setTimeout(() => welcome.remove(), 1000);
  }
}, 2500);

// ===== التنقل بين الأقسام =====
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    if (page === currentPage) return;

    if (adhanState.player) { adhanState.player.stop(); adhanState.player = null; }
    if (ruqyahState.player) { ruqyahState.player.stop(); ruqyahState.player = null; }
    if (window.currentSurahAudio) { window.currentSurahAudio.pause(); window.currentSurahAudio = null; }

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentPage = page;
    loadPage(page);
  });
});

// ===== تحميل صفحة =====
async function loadPage(page) {
  const main = document.getElementById('mainContent');
  main.innerHTML = '<p class="loading">جاري التحميل...</p>';

  try {
    const res = await fetch(`pages/${page}.html`);
    const html = await res.text();
    main.innerHTML = html;

    if (page === 'quran') initQuranPage();
    if (page === 'adhan') initAdhanPage();
    if (page === 'ruqyah') initRuqyahPage();
    if (page === 'settings') initSettingsPage();
  } catch (err) {
    main.innerHTML = '<p class="error">حدث خطأ في تحميل القسم</p>';
    console.error(err);
  }
}

// ==========================================
// قسم القرآن
// ==========================================
async function initQuranPage() {
  const grid = document.getElementById('surahGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/surah`);
    const data = await res.json();
    grid.innerHTML = '';
    data.data.forEach(surah => {
      const card = document.createElement('div');
      card.className = 'surah-card';
      card.innerHTML = `
        <div class="surah-number">${surah.number}</div>
        <div class="surah-name">${surah.name.replace('سُورَةُ ', '')}</div>
      `;
      card.onclick = () => loadVerses(surah.number, surah.name);
      grid.appendChild(card);
    });
  } catch (err) {
    grid.innerHTML = '<p class="error">حدث خطأ في تحميل السور.</p>';
  }
}

async function loadVerses(surahNumber, surahName) {
  const grid = document.getElementById('surahGrid');
  const container = document.getElementById('versesContainer');
  const versesDiv = document.getElementById('verses');
  const title = document.getElementById('pageTitle');
  const backBtn = document.getElementById('backBtn');
  const audioWrapper = document.getElementById('audioWrapper');

  grid.style.display = 'none';
  container.style.display = 'block';
  backBtn.style.display = 'inline-block';
  title.textContent = `📖 سورة ${surahName.replace('سُورَةُ ', '')}`;
  versesDiv.innerHTML = '<p class="loading">جاري تحميل الآيات...</p>';
  audioWrapper.style.display = 'none';

  history.pushState({page: 'quran-verses'}, '', '');

  try {
    const res = await fetch(`${API_BASE}/surah/${surahNumber}`);
    const data = await res.json();
    const ayahs = data.data.ayahs;
    let html = '';

    ayahs.forEach(ayah => {
      let text = ayah.text;
      if (surahNumber != 1 && surahNumber != 9 && ayah.numberInSurah === 1) {
        let words = text.split(' ');
        if (words.length >= 4) text = words.slice(4).join(' ');
        html += `<div style="text-align: center; margin-bottom: 15px; color: #58a6ff; font-size: 22px;">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`;
        html += `<div style="text-align: center; margin-bottom: 20px; color: #238636; font-size: 24px;">۞ ۞ ۞</div>`;
      }
      html += `<span>${text} <span class="verse-number">${ayah.numberInSurah}</span></span> `;
    });
    versesDiv.innerHTML = html;

    const audioPlayer = document.getElementById('surahAudio');
    if (audioPlayer) {
      audioPlayer.src = `https://server8.mp3quran.net/frs_a/${String(surahNumber).padStart(3, '0')}.mp3`;
      audioPlayer.load();
      audioPlayer.loop = true;
      audioWrapper.style.display = 'block';
      window.currentSurahAudio = audioPlayer;
    }
  } catch (err) {
    versesDiv.innerHTML = '<p class="error">حدث خطأ في تحميل الآيات.</p>';
  }
}

function backToSurahs() {
  const grid = document.getElementById('surahGrid');
  const container = document.getElementById('versesContainer');
  const backBtn = document.getElementById('backBtn');
  const audioWrapper = document.getElementById('audioWrapper');
  const title = document.getElementById('pageTitle');

  if (grid) grid.style.display = 'grid';
  if (container) container.style.display = 'none';
  if (backBtn) backBtn.style.display = 'none';
  if (audioWrapper) audioWrapper.style.display = 'none';
  if (title) title.textContent = '📖 القرآن الكريم';

  if (window.currentSurahAudio) {
    window.currentSurahAudio.pause();
    window.currentSurahAudio = null;
  }
}

// ==========================================
// قسم الأذان
// ==========================================
function initAdhanPage() {
  const select = document.getElementById('adhanSelect');
  const playBtn = document.getElementById('adhanPlayBtn');
  const loopBtn = document.getElementById('adhanLoopBtn');
  const stopBtn = document.getElementById('adhanStopBtn');

  if (!select) return;

  const adhanList = [
    { name: 'أذان الحرم المكي - عبدالرحمن السديس', url: 'https://www.islamcan.com/audio/adhan/azan1.mp3' },
    { name: 'أذان الحرم المدني', url: 'https://www.islamcan.com/audio/adhan/azan2.mp3' },
    { name: 'أذان مشاري العفاسي', url: 'https://www.islamcan.com/audio/adhan/azan8.mp3' },
    { name: 'أذان المغرب - مؤذن مغاربي', url: 'https://www.islamcan.com/audio/adhan/azan10.mp3' },
    { name: 'أذان مصر - مؤذن مصري', url: 'https://www.islamcan.com/audio/adhan/azan5.mp3' }
  ];

  select.innerHTML = adhanList.map((a, i) =>
    `<option value="${i}">${a.name}</option>`
  ).join('');

  playBtn.onclick = () => {
    const idx = select.value;
    if (adhanState.player) adhanState.player.stop();
    adhanState.player = new Howl({
      src: [adhanList[idx].url],
      html5: true,
      loop: adhanState.loop,
      onloaderror: () => alert('تعذر تحميل الأذان. تحقق من اتصالك بالإنترنت.')
    });
    adhanState.player.play();
  };

  loopBtn.onclick = () => {
    adhanState.loop = !adhanState.loop;
    if (adhanState.player) adhanState.player.loop(adhanState.loop);
    loopBtn.textContent = adhanState.loop ? '🔁 تكرار: مفعل' : '🔁 تكرار: غير مفعل';
    loopBtn.style.background = adhanState.loop ? '#238636' : '#30363d';
  };

  stopBtn.onclick = () => {
    if (adhanState.player) { adhanState.player.stop(); adhanState.player = null; }
  };
}

// ==========================================
// قسم الرقية الشرعية
// ==========================================
function initRuqyahPage() {
  const menu = document.getElementById('ruqyahMenu');
  const content = document.getElementById('ruqyahContent');
  const backBtn = document.getElementById('ruqyahBackBtn');
  const title = document.getElementById('ruqyahTitle');
  const player = document.getElementById('ruqyahAudio');
  const playBtn = document.getElementById('ruqyahPlayBtn');
  const loopBtn = document.getElementById('ruqyahLoopBtn');
  const stopBtn = document.getElementById('ruqyahStopBtn');

  if (!menu) return;

  const ruqyahTypes = [
    { id: 'fatiha', name: '🤲 الرقية بالفاتحة', url: 'https://server8.mp3quran.net/frs_a/001.mp3' },
    { id: 'baqara', name: '🧿 رقية الحسد والعين (البقرة)', url: 'https://server8.mp3quran.net/frs_a/002.mp3' },
    { id: 'kahf', name: '🪄 رقية السحر (الكهف)', url: 'https://server8.mp3quran.net/frs_a/018.mp3' },
    { id: 'yasin', name: '👤 رقية المس (يس)', url: 'https://server8.mp3quran.net/frs_a/036.mp3' },
    { id: 'saffat', name: '🤒 رقية الأمراض (الصافات)', url: 'https://server8.mp3quran.net/frs_a/037.mp3' },
    { id: 'rahman', name: '😴 رقية الأرق والقلق (الرحمن)', url: 'https://server8.mp3quran.net/frs_a/055.mp3' },
    { id: 'mulk', name: '🏠 رقية المنزل (الملك)', url: 'https://server8.mp3quran.net/frs_a/067.mp3' },
    { id: 'ikhlas', name: '👶 رقية الأطفال (الإخلاص والمعوذتين)', url: 'https://server8.mp3quran.net/frs_a/112.mp3' }
  ];

  menu.innerHTML = ruqyahTypes.map(t =>
    `<button class="ruqyah-card" data-id="${t.id}">${t.name}</button>`
  ).join('');

  menu.querySelectorAll('.ruqyah-card').forEach(card => {
    card.onclick = () => {
      const id = card.dataset.id;
      const type = ruqyahTypes.find(t => t.id === id);
      menu.style.display = 'none';
      content.style.display = 'block';
      backBtn.style.display = 'inline-block';
      title.textContent = type.name;

      player.src = type.url;
      player.loop = ruqyahState.loop;
      player.load();
      player.play().catch(e => console.log('Play error:', e));
    };
  });

  backBtn.onclick = () => {
    content.style.display = 'none';
    menu.style.display = 'flex';
    backBtn.style.display = 'none';
    title.textContent = '🤲 الرقية الشرعية';
    if (player) { player.pause(); player.src = ''; }
  };

  playBtn.onclick = () => { if (player) player.play(); };
  stopBtn.onclick = () => { if (player) { player.pause(); player.currentTime = 0; } };
  loopBtn.onclick = () => {
    ruqyahState.loop = !ruqyahState.loop;
    if (player) player.loop = ruqyahState.loop;
    loopBtn.textContent = ruqyahState.loop ? '🔁 تكرار: مفعل' : '🔁 تكرار: غير مفعل';
    loopBtn.style.background = ruqyahState.loop ? '#238636' : '#30363d';
  };
}

// ==========================================
// قسم الإعدادات
// ==========================================
function initSettingsPage() {
  const fontSelect = document.getElementById('fontSelect');
  const fontSize = document.getElementById('fontSize');
  const sizeValue = document.getElementById('sizeValue');
  const themeSelect = document.getElementById('themeSelect');

  if (!fontSelect) return;

  const savedFont = localStorage.getItem('quran_font') || 'Amiri';
  const savedSize = localStorage.getItem('quran_font_size') || '22';
  const savedTheme = localStorage.getItem('quran_theme') || 'dark';

  fontSelect.value = savedFont;
  fontSize.value = savedSize;
  sizeValue.textContent = savedSize;
  themeSelect.value = savedTheme;

  fontSelect.onchange = () => {
    localStorage.setItem('quran_font', fontSelect.value);
    document.body.style.fontFamily = fontSelect.value;
  };

  fontSize.oninput = () => {
    localStorage.setItem('quran_font_size', fontSize.value);
    sizeValue.textContent = fontSize.value;
    const verses = document.getElementById('verses');
    if (verses) verses.style.fontSize = fontSize.value + 'px';
  };

  themeSelect.onchange = () => {
    localStorage.setItem('quran_theme', themeSelect.value);
    if (themeSelect.value === 'light') {
      document.body.style.background = '#f5f5f5';
      document.body.style.color = '#1a1a1a';
    } else {
      document.body.style.background = '#0d1117';
      document.body.style.color = '#fff';
    }
  };
}

// ===== زر الرجوع في الهاتف =====
window.addEventListener('popstate', function() {
  const versesContainer = document.getElementById('versesContainer');
  if (versesContainer && versesContainer.style.display === 'block') {
    backToSurahs();
  }
});

// ===== تحميل الصفحة الأولى =====
loadPage('quran');
