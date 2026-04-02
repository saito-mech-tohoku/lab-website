const fs = require("fs");
const https = require("https");
const xml2js = require("xml2js");
const RSS_URL = "https://note.com/saitolabo/rss/";

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
        }
      },
      (res) => {
        // リダイレクト対応
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectedUrl = new URL(res.headers.location, url).toString();
          return resolve(fetchText(redirectedUrl));
        }

        if (res.statusCode !== 200) {
          return reject(
            new Error(`RSS fetch failed: ${res.statusCode} ${res.statusMessage}`)
          );
        }

        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      }
    ).on("error", reject);
  });
}

(async () => {
  try {
    const xml = await fetchText(RSS_URL);
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const items = parsed?.rss?.channel?.item || [];
    const normalized = Array.isArray(items) ? items : [items];

    const news = normalized.slice(0, 3).map((item) => ({
      title: item.title,
      link: item.link,
      date: new Date(item.pubDate).toISOString().slice(0, 10)
    }));

    fs.writeFileSync("news.json", JSON.stringify(news, null, 2), "utf-8");
    console.log("news.json updated");
    console.log(news);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
