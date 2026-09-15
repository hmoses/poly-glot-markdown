/**
 * Poly-Glot Markdown — See It In Action Demo
 * Animates a before/after transformation showing RAG & GEO optimization.
 * Score cards appear directly beneath their respective panels.
 */

function initializeDemo() {
    const playBtn        = document.getElementById('playDemoBtn');
    const resetBtn       = document.getElementById('resetDemoBtn');
    const tryItBtn       = document.getElementById('tryItNowBtn');
    const demoStats      = document.getElementById('demoStats');
    const demoIssues     = document.getElementById('demoIssues');
    const demoBenefits   = document.getElementById('demoBenefits');
    const demoCta        = document.getElementById('demoCta');
    const demoPanels     = document.querySelectorAll('.demo-panel');
    const scoreBefore    = document.getElementById('demoScoreBefore');
    const scoreAfter     = document.getElementById('demoScoreAfter');

    if (!playBtn || !resetBtn || !demoStats || demoPanels.length < 2) return;

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

    function countUp(elementId, from, to, duration = 1200, suffix = '') {
        const el = document.getElementById(elementId);
        if (!el) return;
        const startTime = performance.now();
        function update(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + (to - from) * eased);
            el.textContent = current + suffix;
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    function animateBar(elementId, toPercent, duration = 1200) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.style.transition = `width ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        setTimeout(() => { el.style.width = toPercent + '%'; }, 50);
    }

    function fadeIn(elementId, delay = 0) {
        setTimeout(() => {
            const el = document.getElementById(elementId);
            if (!el) return;
            el.style.transition = 'opacity 0.6s ease';
            el.style.opacity = '1';
        }, delay);
    }

    // ── Play ──────────────────────────────────────────────────────────────
    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.disabled = true;
        playBtn.textContent = '⏸️ Playing...';

        // Reset everything
        demoIssues.style.opacity   = '0';
        demoBenefits.style.opacity = '0';
        demoStats.style.display    = 'none';
        if (scoreBefore) scoreBefore.style.display = 'none';
        if (scoreAfter)  scoreAfter.style.display  = 'none';
        beforeCodeEl.textContent   = '';
        afterCodeEl.textContent    = '';

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

        // Badges + BAD scores fire INSTANTLY (0ms) after bad run
        demoIssues.style.transition = 'opacity 0.5s ease-in';
        demoIssues.style.opacity = '1';
        if (scoreBefore) {
            scoreBefore.style.display = 'block';
            animateBar('ragBarBefore', 12, 600);
            animateBar('geoBarBefore', 8, 600);
        }
        await sleep(1200);

        // Step 2 — type after code
        demoPanels[1].classList.add('active');
        await typeCode(afterCodeEl, afterCode, 10);

        // Badges + GOOD scores fire INSTANTLY (0ms) after good run
        demoBenefits.style.transition = 'opacity 0.5s ease-in';
        demoBenefits.style.opacity = '1';
        if (scoreAfter) {
            scoreAfter.style.display = 'block';
            animateBar('ragBarAfter', 91, 1200);
            animateBar('geoBarAfter', 87, 1200);
            countUp('ragAfter', 0, 91, 1200);
            countUp('geoAfter', 0, 87, 1200);
        }
        await sleep(1000);

        // Show deltas on after card
        fadeIn('ragDelta', 0);
        fadeIn('geoDelta', 200);
        countUp('ragDeltaNum', 0, 658, 1200);
        setTimeout(() => countUp('geoDeltaNum', 0, 988, 1200), 200);
        await sleep(800);

        // Show "What Changed" metrics
        demoStats.style.display = 'flex';
        const pills = [
            'metricFrontmatter', 'metricChunks', 'metricKeywords',
            'metricStructure', 'metricSummary', 'metricTable',
        ];
        for (let i = 0; i < pills.length; i++) {
            fadeIn(pills[i], i * 150);
        }
        await sleep(1500);

        playBtn.textContent    = '✓ Demo Complete';
        playBtn.disabled       = false;
        resetBtn.style.display = 'inline-flex';
        if (demoCta) demoCta.style.display = 'block';
        isPlaying = false;

        if (typeof gtag !== 'undefined') {
            gtag('event', 'demo_played', { source: 'demo_section' });
        }
    });

    // ── Reset ─────────────────────────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        demoPanels.forEach(p => p.classList.remove('active'));
        demoStats.style.display    = 'none';
        if (scoreBefore) scoreBefore.style.display = 'none';
        if (scoreAfter)  scoreAfter.style.display  = 'none';
        resetBtn.style.display     = 'none';
        if (demoCta) demoCta.style.display = 'none';
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
    if (tryItBtn) {
        tryItBtn.addEventListener('click', () => {
            document.querySelector('.main-content')
                .scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (typeof gtag !== 'undefined') {
                gtag('event', 'demo_cta_clicked', { source: 'demo_section', action: 'try_it_now' });
            }
        });
    }
}

// Auto-play: show the completed demo state immediately
function showDemoCompleted() {
    const playBtn      = document.getElementById('playDemoBtn');
    const resetBtn     = document.getElementById('resetDemoBtn');
    const demoStats    = document.getElementById('demoStats');
    const demoIssues   = document.getElementById('demoIssues');
    const demoBenefits = document.getElementById('demoBenefits');
    const demoCta      = document.getElementById('demoCta');
    const demoPanels   = document.querySelectorAll('.demo-panel');
    const beforeCodeEl = document.querySelector('#demoCodeBefore code');
    const afterCodeEl  = document.querySelector('#demoCodeAfter code');
    const scoreBefore  = document.getElementById('demoScoreBefore');
    const scoreAfter   = document.getElementById('demoScoreAfter');

    if (!playBtn || !demoStats || demoPanels.length < 2) return;

    const today = new Date().toISOString().split('T')[0];

    // Show before code instantly
    if (beforeCodeEl) beforeCodeEl.textContent =
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

    // Show after code instantly
    if (afterCodeEl) afterCodeEl.textContent =
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
> similar content using embedding vectors and
> cosine similarity — used in RAG to fetch context
> for LLM prompts.

## How Vector Search Works

Vector search converts queries and documents into
**embedding vectors**, then ranks results by
**cosine similarity** (distance in vector space).

## Choosing a Vector Database

| Database   | Type       | Best For           |
|-----------|------------|-------------------|
| Pinecone  | Managed    | Production RAG    |
| Weaviate  | Self-host  | Hybrid search     |
| pgvector  | Extension  | Postgres stacks   |

## Implementation

\`\`\`python
# Retrieve top-k similar documents
results = db.query(
    vector=embed(user_query),
    top_k=5,
    filter={"status": "published"}
)
\`\`\`

> **RAG Chunk — Threshold:** Cosine similarity ≥ 0.78
> is recommended for technical documentation retrieval.

## Related Resources

- [Embedding Models Comparison](./embedding-models.md)
- [RAG Architecture](./rag-pipeline.md)`;

    // Activate both panels
    demoPanels.forEach(p => p.classList.add('active'));

    // Show issue/benefit badges
    if (demoIssues) demoIssues.style.opacity = '1';
    if (demoBenefits) demoBenefits.style.opacity = '1';

    // Show before score card with bad scores
    if (scoreBefore) {
        scoreBefore.style.display = 'block';
        const ragBarBefore = document.getElementById('ragBarBefore');
        if (ragBarBefore) { ragBarBefore.style.transition = 'none'; ragBarBefore.style.width = '12%'; }
        const geoBarBefore = document.getElementById('geoBarBefore');
        if (geoBarBefore) { geoBarBefore.style.transition = 'none'; geoBarBefore.style.width = '8%'; }
    }

    // Show after score card with good scores
    if (scoreAfter) {
        scoreAfter.style.display = 'block';
        const ragAfterEl = document.getElementById('ragAfter');
        if (ragAfterEl) ragAfterEl.textContent = '91';
        const ragBarAfter = document.getElementById('ragBarAfter');
        if (ragBarAfter) { ragBarAfter.style.transition = 'none'; ragBarAfter.style.width = '91%'; }
        const geoAfterEl = document.getElementById('geoAfter');
        if (geoAfterEl) geoAfterEl.textContent = '87';
        const geoBarAfter = document.getElementById('geoBarAfter');
        if (geoBarAfter) { geoBarAfter.style.transition = 'none'; geoBarAfter.style.width = '87%'; }

        // Show deltas
        const ragDelta = document.getElementById('ragDelta');
        if (ragDelta) ragDelta.style.opacity = '1';
        const ragDeltaNum = document.getElementById('ragDeltaNum');
        if (ragDeltaNum) ragDeltaNum.textContent = '658';
        const geoDelta = document.getElementById('geoDelta');
        if (geoDelta) geoDelta.style.opacity = '1';
        const geoDeltaNum = document.getElementById('geoDeltaNum');
        if (geoDeltaNum) geoDeltaNum.textContent = '988';
    }

    // Show metrics
    demoStats.style.display = 'flex';
    ['metricFrontmatter','metricChunks','metricKeywords',
     'metricStructure','metricSummary','metricTable'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.opacity = '1';
    });

    // Show CTA and reset button
    if (demoCta) demoCta.style.display = 'block';
    playBtn.textContent = '✓ Demo Complete';
    if (resetBtn) resetBtn.style.display = 'inline-flex';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initializeDemo(); showDemoCompleted(); });
} else {
    initializeDemo();
    showDemoCompleted();
}
