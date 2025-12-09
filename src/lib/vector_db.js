export class VectorDB {
    constructor(dbName = 'TasteOS_DB', storeName = 'vectors') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = (event) => reject('VectorDB init failed');

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
        });
    }

    async add(item) {
        // item: { id, vector, text, timestamp, weight }
        // Ensure vector is normalized?
        // We assume the caller handles normalization or we do it here.
        // Let's do it here for safety.
        if (item.vector) {
            item.vector = this.normalize(item.vector);
        }

        return this.performTransaction('readwrite', (store) => store.put(item));
    }

    async get(id) {
        return this.performTransaction('readonly', (store) => store.get(id));
    }

    async getAll() {
        return this.performTransaction('readonly', (store) => store.getAll());
    }

    async performTransaction(mode, operation) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], mode);
            const store = transaction.objectStore(this.storeName);
            const request = operation(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    normalize(vector) {
        // vector is Float32Array or Array
        let sum = 0;
        for (let i = 0; i < vector.length; i++) {
            sum += vector[i] * vector[i];
        }
        const magnitude = Math.sqrt(sum);
        if (magnitude === 0) return vector;

        const normalized = new Float32Array(vector.length);
        for (let i = 0; i < vector.length; i++) {
            normalized[i] = vector[i] / magnitude;
        }
        return normalized;
    }

    cosineSimilarity(vecA, vecB) {
        // Assumes normalized vectors
        let dot = 0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
        }
        return dot;
    }
}
