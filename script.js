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

// あなたのnote ID
const NOTE_USER = "saitolabo";

// RSS→JSON変換API
const NOTE_API =
  "https://api.rss2json.com/v1/api.json?rss_url=" +
  encodeURIComponent(`https://note.com/${NOTE_USER}/rss`);


// note取得
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

    // 新しい順
    items.sort((a, b) => {

      return new Date(b.pubDate) - new Date(a.pubDate);

    });

    const list = items.slice(0, limit);

    target.innerHTML = "";

    if (list.length === 0) {

      target.innerHTML = "<li>記事はありません。</li>";
      return;

    }

    list.forEach(item => {

      const li = document.createElement("li");

      const a = document.createElement("a");

      a.href = item.link;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      // タイトルだけ表示（タイトル内の日付を利用）
      a.textContent = item.title;

      li.appendChild(a);

      target.appendChild(li);

    });

    if (showAllLink) {

      const li = document.createElement("li");

      li.innerHTML =
        `<a href="https://note.com/${NOTE_USER}"
            target="_blank"
            rel="noopener noreferrer">
            note一覧を見る
         </a>`;

      target.appendChild(li);

    }

  } catch (err) {

    console.error(err);

    target.innerHTML =
      "<li>note記事の読み込みに失敗しました。</li>";

  }

}



// ======================================================
// 実行
// ======================================================

// index.html
loadNoteTitles(5, "#latest-note-titles", true);

// news.html
loadNoteTitles(1000, "#all-note-titles", true);
