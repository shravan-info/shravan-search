# Shravan Search

A small experimental search engine prototype. It crawls up to **100 public web pages** and stores only three fields: title, description and URL.

## Files
- `index.html` — static search interface
- `crawler.py` — Python crawler
- `data.json` — generated search index
- `.github/workflows/crawl.yml` — manual and weekly crawler workflow

## Run locally
Requires Python 3.10+.

```bash
python crawler.py
```

The crawler writes `data.json`. It uses an identifiable User-Agent, checks each host's `robots.txt`, stays within configured seed hosts, waits between requests to the same host, and stops at 100 pages. Hosts whose robots.txt cannot be read are skipped.

## Run on GitHub
1. Open the **Actions** tab.
2. Select **ShravanBot – Crawl up to 100 pages**.
3. Select **Run workflow**.
4. The updated `data.json` is committed automatically.

The workflow also runs weekly. GitHub Actions usage is subject to GitHub plan limits; this is not unlimited crawling.

## Publish the search website
In repository **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, then save.

The site URL will be `https://shravan-info.github.io/shravan-search/`.

The search page loads the small `data.json` index and searches it in the browser. With this prototype capped at 100 records, that is lightweight.

## Important
This is a learning prototype, not a full-web search engine. Crawl only public pages, respect robots.txt and website terms, keep request rates low, and do not treat snippets as verified facts. Some sites may block automated access or return fewer than 100 pages.
