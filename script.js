// =====================
// Hero Video 切替
// =====================
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

// =====================
// タイトルから日付抽出
// =====================
function extractDate(title) {
  const match = String(title || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);

  if (!match) {
    return {
      timestamp: 0,
      label: ''
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return {
    timestamp: date.getTime(),
    label: `${year}年${month}月${day}日`
  };
}

// =====================
// note読み込み＆表示（完全版）
// =====================
async function loadNoteTitles(limit, targetSelector, showAllLink = false) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  try {
    // ★ キャッシュ回避
    const response = await fetch('./data/note-feed.json?ts=' + Date.now());
    if (!response.ok) throw new Error('feed load failed');

    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('invalid data');

    // =====================
    // ★ 日付抽出＋ソート（最重要）
    // =====================
    const sorted = items
      .map((item) => {
        const parsed = extractDate(item.title);
        return {
          ...item,
          timestamp: parsed.timestamp,
          dateLabel: parsed.label
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    // =====================
    // ★ ここで初めて件数制限
    // =====================
    const list = sorted.slice(0, limit);

    target.innerHTML = '';

    if (list.length === 0) {
      target.innerHTML = '<li>note記事は準備中です。</li>';
      return;
    }

    list.forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = item.url || '#';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      // ★ タイトルから日付を除去して整形
      const cleanTitle = item.title.replace(
        /^(\d{4})年(\d{1,2})月(\d{1,2})日[　\s]*/,
        ''
      );

      // ★ 表示
      if (item.dateLabel) {
        a.textContent = `${item.dateLabel}　${cleanTitle}`;
      } else {
        a.textContent = item.title || 'タイトル未設定';
      }

      li.appendChild(a);
      target.appendChild(li);
    });

    // =====================
    // note一覧リンク
    // =====================
    if (showAllLink) {
      const li = document.createElement('li');
      li.innerHTML =
        '<a href="https://note.com/saitolabo" target="_blank" rel="noopener noreferrer">note一覧を見る</a>';
      target.appendChild(li);
    }
  } catch (error) {
    console.error(error);
    target.innerHTML =
      '<li>note記事タイトルの読み込みに失敗しました。data/note-feed.json を更新してください。</li>';
  }
}

// =====================
// 実行
// =====================
loadNoteTitles(2, '#latest-note-titles', true);
loadNoteTitles(100, '#all-note-titles');
