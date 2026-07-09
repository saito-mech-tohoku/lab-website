// ======================================================
// Hero video
// ======================================================

const videos = Array.from(document.querySelectorAll("[data-hero-video]"));

if (videos.length > 0) {
  let index = 0;

  function showVideo(next) {
    videos.forEach((video, i) => {
      const active = i === next;
      video.classList.toggle("is-active", active);

      if (active) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  showVideo(index);

  setInterval(() => {
    index = (index + 1) % videos.length;
    showVideo(index);
  }, 9000);
}


// ======================================================
// note RSS
// ======================================================

const NOTE_USER = "saitolabo";

const NOTE_API =
  "https://api.rss2json.com/v1/api.json?rss_url=" +
  encodeURIComponent(`https://note.com/${NOTE_USER}/rss`);


// タイトル中の「2026年7月2日」のような日付を抽出
function extractDateFromTitle(title) {
  const text = String(title || "");

  const match = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);

  if (!match) {
    return 0;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(year, month - 1, day).getTime();
}


async function fetchNoteItems() {
  const response = await fetch(NOTE_API);

  if (!response.ok) {
    throw new Error("RSS取得失敗");
  }

  const data = await response.json();

  if (!data.items || !Array.isArray(data.items)) {
    throw new Error("RSS形式が不正です");
  }

  return data.items;
}


// ======================================================
// note表示
// ======================================================

async function loadNoteTitles(limit, selector, showAllLink = false) {
  const target = document.querySelector(selector);

  if (!target) return;

  target.innerHTML = "<li>読み込み中...</li>";

  try {
    const items = await fetchNoteItems();

    const list = items
      .slice()
      .sort((a, b) => {
        const dateA = extractDateFromTitle(a.title);
        const dateB = extractDateFromTitle(b.title);

        return dateB - dateA;
      })
      .slice(0, limit);

    target.innerHTML = "";

    if (list.length === 0) {
      target.innerHTML = "<li>記事はありません。</li>";
      return;
    }

    list.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");

      a.href = item.link || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = item.title || "タイトル未設定";

      li.appendChild(a);
      target.appendChild(li);
    });

    if (showAllLink) {
      const li = document.createElement("li");

      li.innerHTML =
        `<a href="https://note.com/${NOTE_USER}" target="_blank" rel="noopener noreferrer">note一覧を見る</a>`;

      target.appendChild(li);
    }
  } catch (error) {
    console.error(error);

    target.innerHTML =
      "<li>note記事の読み込みに失敗しました。</li>";
  }
}


// ======================================================
// 実行
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
  loadNoteTitles(5, "#latest-note-titles", true);
  loadNoteTitles(1000, "#all-note-titles", true);
});
