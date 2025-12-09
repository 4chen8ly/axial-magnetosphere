export class InteractionTracker {
    constructor() {
        this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
            threshold: [0.5] // 50% visibility
        });
        this.viewStartTimes = new Map();
    }

    track(element, id) {
        element.dataset.tasteOsId = id;
        this.observer.observe(element);

        element.addEventListener('click', () => {
            this.sendEvent('click', id);
        });

        // TODO: Track skips (fast scroll past)
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            const id = entry.target.dataset.tasteOsId;
            if (!id) return;

            if (entry.isIntersecting) {
                this.viewStartTimes.set(id, Date.now());
            } else {
                const startTime = this.viewStartTimes.get(id);
                if (startTime) {
                    const duration = Date.now() - startTime;
                    this.viewStartTimes.delete(id);

                    if (duration > 10000) { // > 10s
                        this.sendEvent('long_view', id);
                    } else if (duration < 1000) { // < 1s
                        this.sendEvent('short_view', id);
                    }
                }
            }
        });
    }

    sendEvent(type, id) {
        console.log('TasteOS: Interaction', type, id);
        chrome.runtime.sendMessage({
            action: 'LOG_INTERACTION',
            payload: {
                type,
                itemId: id,
                timestamp: Date.now()
            }
        });
    }
}
