// ===============================
// Hero video switching
// ===============================
const videos = Array.from(document.querySelectorAll('[data-hero-video]'));

if (videos.length > 0) {
  let index = 0;

  const showVideo = (next) => {
    videos.forEach((video, i) => {
      const active = i === next;
      video.classList.toggle('is-active', active);

      if (active) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  };

  showVideo(index);

  setInterval(() => {
    index = (index + 1) % videos.length;
    showVideo(index);
  }, 9000);
}


// ===============================
// note RSS loading
// ===============================
const noteUser = 'saitolabo';
const noteRssUrl = `https://note.com/${noteUser}/rss`;
const noteApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(noteRssUrl)}`;

function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
}

async function fetchNoteItems() {
  const response = await fetch(noteApiUrl);

  if (!response.ok) {
    throw new Error('note RSS loading failed');
  }

  const data = await response.json();

  if (!data.items || !Array.isArray(data.items)) {
    throw new Error('invalid note RSS data');
  }

  return data.items;
}

async function loadNoteTitles(limit, targetSelector, showAllLink = false) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  try {
    target.innerHTML = '<li>読み込み中...</li>';

    const items = await fetchNoteItems();

    const list = items
      .slice()
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, limit);

    target.innerHTML = '';

    if (list.length === 0) {
      target.innerHTML = '<li>note記事は準備中です。</li>';
      return;
    }

    list.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = item.link || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const dateText = formatDate(item.pubDate);
      a.textContent = dateText
        ? `${dateText}　${item.title || 'タイトル未設定'}`
        : item.title || 'タイトル未設定';

      li.appendChild(a);
      target.appendChild(li);
    });

    if (showAllLink) {
      const li = document.createElement('li');
      li.innerHTML =
        '<a href="https://note.com/saitolabo" target="_blank" rel="noopener noreferrer">note一覧を見る</a>';
      target.appendChild(li);
    }
  } catch (error) {
    console.error(error);
    target.innerHTML =
      '<li>note記事タイトルの読み込みに失敗しました。</li>';
  }
}


// ===============================
// Execute
// ===============================
loadNoteTitles(5, '#latest-note-titles', true);
loadNoteTitles(1000, '#all-note-titles', true);
