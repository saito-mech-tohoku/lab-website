const fs = require("fs");
const https = require("https");
const xml2js = require("xml2js");

const RSS_URL = "https://note.com/saitolabo/rss";
const OUTPUT_PATH = "data/note-feed.json";

function fetchText(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error("Too many redirects"));
    }

    const req = https.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          "Accept":
            "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
          "Cache-Control": "no-cache",
        },
      },
      (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          const redirectedUrl = new URL(res.headers.location, url).toString();
          return resolve(fetchText(redirectedUrl, redirectCount + 1));
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(`RSS fetch failed: ${res.statusCode} ${res.statusMessage}`)
          );
        }

        let data = "";
        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve(data);
        });
      }
    );

    req.setTimeout(15000, () => {
      req.destroy(new Error("Request timeout"));
    });

    req.on("error", reject);
  });
}

function extractDateFromTitle(title) {
  const match = title.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return null;

  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));

  return {
    timestamp: date.getTime(),
    label: `${y}年${Number(m)}月${Number(d)}日`,
  };
}

function ensureOutputDirectory() {
  const dir = OUTPUT_PATH.split("/").slice(0, -1).join("/");
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function keepExistingJsonWhenFetchFails(error) {
  console.warn("Warning: Failed to fetch note RSS.");
  console.warn(error.message);

  if (fs.existsSync(OUTPUT_PATH)) {
    console.warn(`Keeping existing ${OUTPUT_PATH}.`);
    process.exit(0);
  }

  console.warn(`No existing ${OUTPUT_PATH} found. Creating empty feed.`);

  ensureOutputDirectory();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify([], null, 2), "utf-8");
  process.exit(0);
}

(async () => {
  try {
    ensureOutputDirectory();

    const xml = await fetchText(RSS_URL);
    const parsed = await xml2js.parseStringPromise(xml, {
      explicitArray: false,
      trim: true,
    });

    const items = parsed?.rss?.channel?.item || [];
    const normalized = Array.isArray(items) ? items : [items];

    console.log("RSS item count:", normalized.length);
    console.log(
      "RSS titles:",
      normalized.map((item) => item.title)
    );

    const feed = normalized
      .filter(Boolean)
      .map((item) => {
        const title = item.title || "タイトル未設定";
        const url = item.link || "https://note.com/saitolabo";

        const extracted = extractDateFromTitle(title);

        return {
          title,
          url,
          timestamp: extracted ? extracted.timestamp : 0,
          dateLabel: extracted ? extracted.label : "",
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(feed, null, 2), "utf-8");

    console.log(`${OUTPUT_PATH} updated`);
    console.log(feed);
  } catch (error) {
    keepExistingJsonWhenFetchFails(error);
  }
})();
