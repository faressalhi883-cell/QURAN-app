// ==========================================
// تطبيق القرآن الكريم - المنطق الرئيسي
// ==========================================

const API_BASE = 'https://api.alquran.cloud/v1';
let currentPage = 'quran';

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

// ===== زر الرجوع في الهاتف =====
window.addEventListener('popstate', function() {
  const versesContainer = document.getElementById('versesContainer');
  if (versesContainer && versesContainer.style.display === 'block') {
    backToSurahs();
  }
});

// ===== تحميل الصفحة الأولى =====
loadPage('quran');
