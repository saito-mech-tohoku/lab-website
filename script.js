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

function extractDateFromTitle(title) {
  const match = String(title || '').match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) {
    return {
      timestamp: 0,
      dateLabel: ''
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  return {
    timestamp: date.getTime(),
    dateLabel: `${year}年${month}月${day}日`
  };
}

async function loadNoteTitles(limit, targetSelector, showAllLink = false) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  try {
    const response = await fetch('./data/note-feed.json');
    if (!response.ok) throw new Error('feed load failed');

    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('feed format invalid');

    const sortedItems = items
      .map((item) => {
        const parsed = extractDateFromTitle(item.title);
        return {
          ...item,
          timestamp: parsed.timestamp,
          dateLabel: parsed.dateLabel
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    const list = sortedItems.slice(0, limit);

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

      if (item.dateLabel) {
        a.textContent = `${item.dateLabel}　${item.title.replace(/^(\d{4})年(\d{1,2})月(\d{1,2})日[　\s]*/, '')}`;
      } else {
        a.textContent = item.title || 'タイトル未設定';
      }

      li.appendChild(a);
      target.appendChild(li);
    });

    if (showAllLink) {
      const li = document.createElement('li');
      li.innerHTML = '<a href="https://note.com/saitolabo" target="_blank" rel="noopener noreferrer">note一覧を見る</a>';
      target.appendChild(li);
    }
  } catch (error) {
    target.innerHTML = '<li>note記事タイトルの読み込みに失敗しました。data/note-feed.json を更新してください。</li>';
  }
}

loadNoteTitles(2, '#latest-note-titles');
loadNoteTitles(100, '#all-note-titles');
