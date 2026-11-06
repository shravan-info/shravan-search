#!/usr/bin/env python3
"""Polite 100-page crawler. Stores only title, description and URL."""
import json
import re
import time
from collections import deque
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser
from urllib.request import Request, urlopen

MAX_PAGES = 100
MAX_PER_HOST = 10
DELAY_SECONDS = 1.0
USER_AGENT = "ShravanSearchBot/0.1 (+https://github.com/shravan-info/shravan-search; educational crawler)"
SEEDS = [
    "https://en.wikipedia.org/wiki/India",
    "https://en.wikipedia.org/wiki/Maharashtra",
    "https://www.nasa.gov/",
    "https://science.nasa.gov/",
    "https://www.who.int/",
    "https://www.un.org/",
    "https://www.unesco.org/",
    "https://www.isro.gov.in/",
    "https://www.india.gov.in/",
    "https://www.pib.gov.in/",
    "https://www.rbi.org.in/",
    "https://maharashtra.gov.in/",
    "https://www.imd.gov.in/",
    "https://www.ncert.nic.in/",
    "https://www.noaa.gov/",
    "https://www.si.edu/",
    "https://www.loc.gov/",
    "https://www.britannica.com/",
    "https://www.nature.com/",
    "https://www.nationalgeographic.com/"
]
SKIP_EXTENSIONS = (".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".zip", ".mp4", ".mp3", ".css", ".js", ".xml")

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title_parts = []
        self.description = ""
        self.links = []
        self.in_title = False
        self.in_body = False
        self.skip_text = False
        self.body_text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "meta":
            name = (attrs.get("name") or attrs.get("property") or "").lower()
            if name in ("description", "og:description") and not self.description:
                self.description = attrs.get("content", "").strip()
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag in ("script", "style", "noscript"):
            self.skip_text = True
        if tag == "body":
            self.in_body = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag in ("script", "style", "noscript"):
            self.skip_text = False
        if tag == "body":
            self.in_body = False

    def handle_data(self, data):
        value = re.sub(r"\\s+", " ", data).strip()
        if not value:
            return
        if self.in_title:
            self.title_parts.append(value)
        if self.in_body and not self.skip_text and len(" ".join(self.body_text)) < 1000:
            self.body_text.append(value)

def normalize_url(url):
    url, _ = urldefrag(url.strip())
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return None
    if parsed.path.lower().endswith(SKIP_EXTENSIONS):
        return None
    return parsed._replace(query="", fragment="").geturl().rstrip("/") or parsed.scheme + "://" + parsed.netloc + "/"

def get_robots(origin, cache):
    if origin not in cache:
        parser = RobotFileParser()
        parser.set_url(origin + "/robots.txt")
        try:
            request = Request(parser.url, headers={"User-Agent": USER_AGENT})
            with urlopen(request, timeout=12) as response:
                parser.parse(response.read(512000).decode("utf-8", "replace").splitlines())
        except Exception:
            parser.disallow_all = True
        cache[origin] = parser
    return cache[origin]

def fetch_html(url):
    try:
        request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})
        with urlopen(request, timeout=12) as response:
            content_type = response.headers.get("Content-Type", "").lower()
            if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
                return None
            charset = response.headers.get_content_charset() or "utf-8"
            return response.geturl(), response.read(1500000).decode(charset, "replace")
    except (HTTPError, URLError, TimeoutError, ValueError):
        return None

def main():
    queue = deque(SEEDS)
    queued = set(SEEDS)
    seen = set()
    per_host = {}
    last_fetch = {}
    robots_cache = {}
    pages = []
    print("ShravanBot starting. Maximum pages: 100")
    while queue and len(pages) < MAX_PAGES:
        url = normalize_url(queue.popleft())
        if not url or url in seen:
            continue
        seen.add(url)
        parsed = urlparse(url)
        host = parsed.netloc.lower()
        origin = parsed.scheme + "://" + parsed.netloc
        if per_host.get(host, 0) >= MAX_PER_HOST:
            continue
        if not get_robots(origin, robots_cache).can_fetch(USER_AGENT, url):
            print("ROBOTS skip:", url)
            continue
        wait = DELAY_SECONDS - (time.time() - last_fetch.get(host, 0))
        if wait > 0:
            time.sleep(wait)
        fetched = fetch_html(url)
        last_fetch[host] = time.time()
        if not fetched:
            print("SKIP:", url)
            continue
        final_url, html = fetched
        final_url = normalize_url(final_url) or url
        if any(item["url"] == final_url for item in pages):
            continue
        page = PageParser()
        try:
            page.feed(html)
        except Exception:
            continue
        title = re.sub(r"\\s+", " ", " ".join(page.title_parts)).strip()[:250] or final_url
        description = re.sub(r"\\s+", " ", page.description or " ".join(page.body_text)).strip()[:400]
        pages.append({"title": title, "description": description, "url": final_url})
        per_host[host] = per_host.get(host, 0) + 1
        print("[%d/100] %s" % (len(pages), title))
        for href in page.links:
            link = normalize_url(urljoin(final_url, href))
            if link and urlparse(link).netloc.lower() == host and link not in queued and link not in seen:
                queued.add(link)
                queue.append(link)
    with open("data.json", "w", encoding="utf-8") as output:
        json.dump(pages, output, ensure_ascii=False, separators=(",", ":"))
    print("Finished: saved %d pages to data.json" % len(pages))

if __name__ == "__main__":
    main()
