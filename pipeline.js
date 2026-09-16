/**
 * Poly-Glot Markdown — RAG Pipeline
 * Full in-browser RAG: Embed → Store → Search → Ask
 *
 * Stack:
 *   Embeddings — Transformers.js  (all-MiniLM-L6-v2, runs in WASM)
 *   Vector DB  — IndexedDB        (persists across sessions)
 *   Search     — Cosine similarity (brute-force, fast for <10k chunks)
 *   LLM        — Gemini 3.6 Flash (via existing Poly-Glot server, free)
 */

const Pipeline = (() => {
    // ── Constants ──
    const DB_NAME    = 'polyglot_vectors';
    const DB_VERSION = 1;
    const STORE_NAME = 'chunks';
    const MODEL_ID   = 'Xenova/all-MiniLM-L6-v2';
    const GEMINI_URL = 'https://br-steep-leaf-ae2o29qz-mcp.compute.c-2.us-east-2.aws.neon.tech/api/markdown/ask';
    const TOP_K      = 5;

    // ── State ──
    let embedder    = null;
    let modelReady  = false;
    let loading     = false;
    let db          = null;

    // ══════════════════════════════════════════════════════════════
    //  IndexedDB Vector Store
    // ══════════════════════════════════════════════════════════════

    function openDB() {
        return new Promise((resolve, reject) => {
            if (db) { resolve(db); return; }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const d = e.target.result;
                if (!d.objectStoreNames.contains(STORE_NAME)) {
                    const store = d.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('docId', 'docId', { unique: false });
                }
            };
            req.onsuccess = (e) => { db = e.target.result; resolve(db); };
            req.onerror   = (e) => reject(e.target.error);
        });
    }

    async function clearStore() {
        const d = await openDB();
        return new Promise((resolve, reject) => {
            const tx = d.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    async function putChunks(chunks, docId) {
        const d = await openDB();
        return new Promise((resolve, reject) => {
            const tx = d.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            for (const chunk of chunks) {
                store.put({ ...chunk, docId });
            }
            tx.oncomplete = resolve;
            tx.onerror = (e) => reject(e.target.error);
        });
    }

    async function getAllChunks() {
        const d = await openDB();
        return new Promise((resolve, reject) => {
            const tx = d.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror   = (e) => reject(e.target.error);
        });
    }

    async function getChunkCount() {
        const d = await openDB();
        return new Promise((resolve, reject) => {
            const tx = d.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).count();
            req.onsuccess = () => resolve(req.result);
            req.onerror   = (e) => reject(e.target.error);
        });
    }

    // ══════════════════════════════════════════════════════════════
    //  Embeddings (Transformers.js)
    // ══════════════════════════════════════════════════════════════

    async function loadModel(onProgress) {
        if (modelReady && embedder) return;
        if (loading) return;
        loading = true;

        try {
            if (onProgress) onProgress('Loading embedding model…');

            // Dynamic import of Transformers.js from CDN
            if (!window.TransformersApi) {
                if (onProgress) onProgress('Downloading Transformers.js runtime…');
                const module = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
                window.TransformersApi = module;
            }

            const { pipeline, env } = window.TransformersApi;

            // Use WASM backend, allow remote models
            env.allowRemoteModels = true;
            env.allowLocalModels  = false;

            if (onProgress) onProgress('Downloading all-MiniLM-L6-v2 (~23MB)…');

            embedder = await pipeline('feature-extraction', MODEL_ID, {
                quantized: true,
                progress_callback: (p) => {
                    if (p.status === 'progress' && p.progress && onProgress) {
                        onProgress(`Downloading model… ${Math.round(p.progress)}%`);
                    }
                }
            });

            modelReady = true;
            if (onProgress) onProgress('Model ready ✅');
        } catch (err) {
            loading = false;
            throw new Error('Failed to load embedding model: ' + err.message);
        } finally {
            loading = false;
        }
    }

    async function embed(text) {
        if (!embedder) throw new Error('Model not loaded');
        const output = await embedder(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }

    // ══════════════════════════════════════════════════════════════
    //  Chunker (reuses existing logic from app.js)
    // ══════════════════════════════════════════════════════════════

    function chunkText(text) {
        const chunks = [];

        // Extract frontmatter
        const fmMatch = text.match(/^(---\s*\n[\s\S]*?\n---)\s*\n?/);
        let remaining = text;
        if (fmMatch) {
            chunks.push({
                title: 'Frontmatter (Metadata)',
                body: fmMatch[1],
                type: 'frontmatter'
            });
            remaining = text.slice(fmMatch[0].length);
        }

        // Split by H2 headings
        const sections = remaining.split(/(?=^## )/gm).filter(s => s.trim());

        for (const section of sections) {
            const clean = section.replace(/<!-- chunk-boundary -->\s*/g, '').trim();
            if (!clean) continue;

            const headingMatch = clean.match(/^(#{2,3})\s+(.+?)(?:\s*\{#[\w-]+\})?\s*$/m);
            const title = headingMatch ? headingMatch[2] : clean.substring(0, 60);
            const words = clean.trim().split(/\s+/).length;

            // If section is very large (>500 words), split further on H3
            if (words > 500) {
                const subSections = clean.split(/(?=^### )/gm).filter(s => s.trim());
                if (subSections.length > 1) {
                    for (const sub of subSections) {
                        const subHead = sub.match(/^(#{2,3})\s+(.+?)(?:\s*\{#[\w-]+\})?\s*$/m);
                        chunks.push({
                            title: subHead ? subHead[2] : sub.substring(0, 60),
                            body: sub.trim(),
                            type: 'section'
                        });
                    }
                    continue;
                }
            }

            chunks.push({ title, body: clean, type: 'section' });
        }

        return chunks;
    }

    // ══════════════════════════════════════════════════════════════
    //  Search (cosine similarity)
    // ══════════════════════════════════════════════════════════════

    function cosine(a, b) {
        let dot = 0, na = 0, nb = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            na  += a[i] * a[i];
            nb  += b[i] * b[i];
        }
        return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
    }

    async function search(query, topK = TOP_K) {
        const qVec    = await embed(query);
        const all     = await getAllChunks();
        if (all.length === 0) return [];

        const scored = all.map(chunk => ({
            ...chunk,
            score: cosine(qVec, chunk.vector)
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }

    // ══════════════════════════════════════════════════════════════
    //  RAG Ask (retrieve → Gemini)
    // ══════════════════════════════════════════════════════════════

    async function ask(question) {
        const results = await search(question, TOP_K);
        if (results.length === 0) {
            return { answer: 'No documents embedded yet. Embed some chunks first.', sources: [] };
        }

        const context = results.map((r, i) =>
            `[Source ${i + 1}: "${r.title}" (score: ${r.score.toFixed(3)})]\n${r.body}`
        ).join('\n\n---\n\n');

        // Try Gemini server
        try {
            const res = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, context })
            });

            if (res.ok) {
                const data = await res.json();
                return {
                    answer: data.answer || data.result,
                    sources: results.map(r => ({ title: r.title, score: r.score, preview: r.body.substring(0, 150) }))
                };
            }
        } catch (e) {
            console.warn('Gemini ask failed:', e.message);
        }

        // Fallback: just return retrieved chunks
        return {
            answer: `Here are the most relevant chunks for your question:\n\n${results.map((r, i) =>
                `**${i + 1}. ${r.title}** (similarity: ${(r.score * 100).toFixed(1)}%)\n${r.body.substring(0, 300)}…`
            ).join('\n\n')}`,
            sources: results.map(r => ({ title: r.title, score: r.score, preview: r.body.substring(0, 150) }))
        };
    }

    // ══════════════════════════════════════════════════════════════
    //  Embed Pipeline (chunk → embed → store)
    // ══════════════════════════════════════════════════════════════

    async function embedDocument(text, docId, onProgress) {
        const chunks = chunkText(text);
        if (chunks.length === 0) throw new Error('No chunks found in document.');

        const embedded = [];
        for (let i = 0; i < chunks.length; i++) {
            if (onProgress) onProgress(`Embedding chunk ${i + 1}/${chunks.length}: ${chunks[i].title}`);
            const vector = await embed(chunks[i].body);
            embedded.push({
                title:  chunks[i].title,
                body:   chunks[i].body,
                type:   chunks[i].type,
                vector: vector,
                words:  chunks[i].body.split(/\s+/).length,
                docId:  docId
            });
        }

        await putChunks(embedded, docId);
        return embedded.length;
    }

    // ══════════════════════════════════════════════════════════════
    //  Public API
    // ══════════════════════════════════════════════════════════════

    return {
        loadModel,
        embedDocument,
        search,
        ask,
        clearStore,
        getChunkCount,
        getAllChunks,
        isModelReady: () => modelReady,
        isLoading:    () => loading,
    };
})();

window.Pipeline = Pipeline;
