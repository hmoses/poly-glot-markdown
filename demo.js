/**
 * Poly-Glot Markdown — See It In Action Demo
 * Animates a before/after transformation showing RAG & GEO optimization.
 * Includes animated score counters, progress bars, and improvement pills.
 */

function initializeDemo() {
    const playBtn      = document.getElementById('playDemoBtn');
    const resetBtn     = document.getElementById('resetDemoBtn');
    const tryItBtn     = document.getElementById('tryItNowBtn');
    const demoStats    = document.getElementById('demoStats');
    const demoIssues   = document.getElementById('demoIssues');
    const demoBenefits = document.getElementById('demoBenefits');
    const demoPanels   = document.querySelectorAll('.demo-panel');

    if (!playBtn || !resetBtn || !tryItBtn || !demoStats || demoPanels.length < 2) return;

    const beforeCodeEl = document.querySelector('#demoCodeBefore code');
    const afterCodeEl  = document.querySelector('#demoCodeAfter code');

    let isPlaying = false;

    // ── BEFORE: messy, unstructured, not AI-retrievable ──────────────────
    const beforeCode =
`# vector search

vector search lets you find similar things.
its used in ai apps a lot. you embed the query
and compare it to stored embeddings using math.

you need a vector db. some options are pinecone,
weaviate, or pgvector. pick one and set it up.

the main thing is cosine similarity. lower distance
means more similar. threshold is usually like 0.8
or whatever works for your data.

heres a rough example:

results = db.query(embed(user_query), top_k=5)

thats basically it. tune the threshold as needed.`;

    // ── AFTER: RAG-ready, GEO-optimized, fully structured ────────────────
    const today = new Date().toISOString().split('T')[0];
    const afterCode =
`---
title: "Vector Search for AI Applications"
description: "Implement vector similarity search using
  embeddings and a vector database. Covers cosine
  similarity, top-k retrieval, and threshold tuning
  for RAG pipelines."
tags: [vector-search, embeddings, RAG, AI,
  cosine-similarity, pinecone, semantic-search]
date: "${today}"
difficulty: intermediate
---

# Vector Search for AI Applications

> **RAG Summary:** Vector search finds semantically
> similar content by comparing embedding vectors via
> cosine similarity — used in RAG to fetch context
> before LLM inference.

## What Is Vector Search?

**Semantic similarity retrieval** converts text into
high-dimensional vectors and compares them — rather
than matching exact keywords.

## How It Works

1. **Embed** the query (e.g. \`text-embedding-3-small\`)
2. **Compare** via cosine similarity against stored vectors
3. **Retrieve** top-k most similar results
4. **Filter** by threshold (typically ≥ 0.78)

## Implementation

\`\`\`python
query_vector = embed(user_query)  # shape: [1536]
results = db.query(
    vector=query_vector,
    top_k=5,
    filter={"similarity": {"$gte": 0.78}}
)
\`\`\`

> **RAG Chunk — Threshold:** Cosine similarity ≥ 0.78
> indicates strong semantic relevance. Tune per dataset.

## See Also

- [Embedding Models](./embeddings.md)
- [RAG Architecture](./rag-pipeline.md)`;

    // ── Helpers ───────────────────────────────────────────────────────────
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function typeCode(codeElement, code, speed = 18) {
        codeElement.textContent = '';
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let currentLine = '';
            for (const char of line) {
                currentLine += char;
                codeElement.textContent =
                    lines.slice(0, i).join('\n') +
                    (i > 0 ? '\n' : '') +
                    currentLine;
                await sleep(speed);
            }
            if (i < lines.length - 1) {
                codeElement.textContent += '\n';
            }
        }
    }

    // Animate a number counting up from start to end
    function countUp(elementId, from, to, duration = 1200, suffix = '') {
        const el = document.getElementById(elementId);
        if (!el) return;
        const startTime = performance.now();
        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + (to - from) * eased);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // Animate a progress bar width
    function animateBar(elementId, toPercent, duration = 1200) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.style.transition = `width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        // Small delay so transition fires
        setTimeout(() => { el.style.width = toPercent + '%'; }, 50);
    }

    // Fade in an element
    function fadeIn(elementId, delay = 0) {
        setTimeout(() => {
            const el = document.getElementById(elementId);
            if (!el) return;
            el.style.transition = 'opacity 0.6s ease';
            el.style.opacity = '1';
        }, delay);
    }

    // ── Animate scores ────────────────────────────────────────────────────
    async function animateScores() {
        // RAG: 12 → 91
        animateBar('ragBarBefore', 12, 600);
        await sleep(400);
        animateBar('ragBarAfter', 91, 1200);
        countUp('ragAfter', 0, 91, 1200);
        fadeIn('ragDelta', 800);
        const ragDeltaEl = document.getElementById('ragDeltaNum');
        if (ragDeltaEl) {
            setTimeout(() => countUp('ragDeltaNum', 0, 658, 1200), 400);
        }

        await sleep(600);

        // GEO: 8 → 87
        animateBar('geoBarBefore', 8, 600);
        await sleep(400);
        animateBar('geoBarAfter', 87, 1200);
        countUp('geoAfter', 0, 87, 1200);
        fadeIn('geoDelta', 800);
        const geoDeltaEl = document.getElementById('geoDeltaNum');
        if (geoDeltaEl) {
            setTimeout(() => countUp('geoDeltaNum', 0, 988, 1200), 400);
        }

        await sleep(800);

        // Metric pills — staggered fade in
        const pills = [
            'metricFrontmatter',
            'metricChunks',
            'metricKeywords',
            'metricStructure',
            'metricSummary',
            'metricTable',
        ];
        pills.forEach((id, i) => fadeIn(id, i * 120));
    }

    // ── Play ──────────────────────────────────────────────────────────────
    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.disabled = true;
        playBtn.textContent = '⏸️ Playing...';

        // Reset
        demoIssues.style.opacity   = '0';
        demoBenefits.style.opacity = '0';
        demoStats.style.display    = 'none';
        beforeCodeEl.textContent   = '';
        afterCodeEl.textContent    = '';

        // Reset score elements
        ['ragAfter','geoAfter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
        ['ragDelta','geoDelta'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.opacity = '0';
        });
        ['ragBarBefore','ragBarAfter','geoBarBefore','geoBarAfter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.transition = 'none'; el.style.width = '0%'; }
        });
        ['metricFrontmatter','metricChunks','metricKeywords',
         'metricStructure','metricSummary','metricTable'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.opacity = '0';
        });

        // Step 1 — type before code
        demoPanels[0].classList.add('active');
        await typeCode(beforeCodeEl, beforeCode, 22);

        // Show issue badges
        await sleep(300);
        demoIssues.style.transition = 'opacity 0.5s ease-in';
        demoIssues.style.opacity = '1';
        await sleep(1200);

        // Step 2 — type after code
        demoPanels[1].classList.add('active');
        await typeCode(afterCodeEl, afterCode, 10);

        // Show benefit badges
        await sleep(300);
        demoBenefits.style.transition = 'opacity 0.5s ease-in';
        demoBenefits.style.opacity = '1';
        await sleep(800);

        // Step 3 — show animated scores
        demoStats.style.display = 'flex';
        await sleep(200);
        await animateScores();
        await sleep(1500);

        playBtn.textContent    = '✓ Demo Complete';
        playBtn.disabled       = false;
        resetBtn.style.display = 'inline-flex';
        isPlaying = false;

        if (typeof gtag !== 'undefined') {
            gtag('event', 'demo_played', { source: 'demo_section' });
        }
    });

    // ── Reset ─────────────────────────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        demoPanels.forEach(p => p.classList.remove('active'));
        demoStats.style.display    = 'none';
        resetBtn.style.display     = 'none';
        playBtn.textContent        = '▶️ Play Demo';
        playBtn.disabled           = false;
        isPlaying                  = false;

        beforeCodeEl.textContent   = '';
        afterCodeEl.textContent    = '';
        demoIssues.style.opacity   = '0';
        demoBenefits.style.opacity = '0';

        if (typeof gtag !== 'undefined') {
            gtag('event', 'demo_reset', { source: 'demo_section' });
        }
    });

    // ── Try It Now ────────────────────────────────────────────────────────
    tryItBtn.addEventListener('click', () => {
        document.querySelector('.main-content')
            .scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (typeof gtag !== 'undefined') {
            gtag('event', 'demo_cta_clicked', { source: 'demo_section', action: 'try_it_now' });
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    initializeDemo();
}
