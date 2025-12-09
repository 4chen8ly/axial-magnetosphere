export class FeedScanner {
    constructor() {
        this.sitePatterns = {
            youtube: {
                host: 'youtube.com',
                itemSelector: 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer',
                titleSelector: '#video-title, #video-title-link',
                textSelector: '#description-text, .ytd-video-renderer', // fallback
                adSelector: '.ytd-ad-slot-renderer, ytd-ad-slot-renderer' // simplistic ad detection
            },
            reddit: {
                host: 'reddit.com',
                itemSelector: 'shreddit-post, .Post',
                titleSelector: '[slot="title"], h3',
                textSelector: '[slot="text-body"], .RichTextJSON-root',
                adSelector: '.promoted, .promotedlink'
            }
        };
        this.currentPattern = null;
    }

    detectSite() {
        const host = window.location.hostname;
        if (host.includes('youtube.com')) return this.sitePatterns.youtube;
        if (host.includes('reddit.com')) return this.sitePatterns.reddit;
        return null;
    }

    scan() {
        this.currentPattern = this.detectSite();
        let items = [];

        if (this.currentPattern) {
            items = this.scanKnownSite(this.currentPattern);
        } else {
            items = this.scanGeneric();
        }

        return items;
    }

    scanKnownSite(pattern) {
        const elements = document.querySelectorAll(pattern.itemSelector);
        const results = [];

        elements.forEach(el => {
            if (this.isSponsored(el, pattern)) {
                el.dataset.tasteOsSponsored = 'true';
                return; // Skip processing/re-ranking ads, just mark them
            }

            const titleEl = el.querySelector(pattern.titleSelector);
            const textEl = el.querySelector(pattern.textSelector);

            if (titleEl) {
                results.push({
                    element: el,
                    id: this.generateId(el),
                    title: titleEl.innerText.trim(),
                    text: textEl ? textEl.innerText.trim() : '',
                    timestamp: Date.now()
                });
            }
        });
        return results;
    }

    observe(callback) {
        if (!this.currentPattern) this.currentPattern = this.detectSite();
        if (!this.currentPattern) return; // TODO: Handle generic site observation

        const observer = new MutationObserver((mutations) => {
            let shouldScan = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldScan = true;
                    break;
                }
            }

            if (shouldScan) {
                // Debounce scan
                if (this.debounceTimer) clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    const items = this.scan();
                    callback(items);
                }, 1000);
            }
        });

        // Find the feed container to observe
        // Heuristic: find the parent of the first item found
        const firstItem = document.querySelector(this.currentPattern.itemSelector);
        if (firstItem && firstItem.parentElement) {
            observer.observe(firstItem.parentElement, { childList: true, subtree: true });
            console.log('TasteOS: Observer started on', firstItem.parentElement);
        } else {
            // Fallback: observe body
            observer.observe(document.body, { childList: true, subtree: true });
            console.log('TasteOS: Observer started on body');
        }
    }

    scanGeneric() {
        // Simple heuristic: find container with many similar children
        // This is a placeholder for the advanced heuristic logic
        return [];
    }

    isSponsored(element, pattern) {
        if (pattern.adSelector && element.querySelector(pattern.adSelector)) return true;
        // Heuristic for ads: "Promoted", "Sponsored" text
        const text = element.innerText.toLowerCase();
        return text.includes('sponsored') || text.includes('promoted') || text.includes('ad');
    }

    generateId(element) {
        // Generate a stable ID based on content if possible, or use a random one if not
        // For MVP, we'll try to find a link href
        const link = element.querySelector('a');
        if (link && link.href) return link.href;
        return 'item-' + Math.random().toString(36).substr(2, 9);
    }
}
