/**
 * Poly-Glot Markdown — See It In Action Demo
 * Animates a before/after transformation showing RAG & GEO optimization.
 * Matches the demo pattern from poly-glot.ai.
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

    // ── BEFORE: messy, unstructured, not AI-retrievable ─────────────────
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

    // ── AFTER: RAG-ready, GEO-optimized, fully structured ───────────────
    const today = new Date().toISOString().split('T')[0];
    const afterCode =
`---
title: "Vector Search for AI Applications"
description: "How to implement vector similarity search
  using embeddings and a vector database. Covers cosine
  similarity, top-k retrieval, and threshold tuning
  for RAG pipelines."
tags: [vector-search, embeddings, RAG, AI,
  cosine-similarity, pinecone, pgvector,
  semantic-search]
date: "${today}"
difficulty: intermediate
---

# Vector Search for AI Applications

> **RAG Summary:** Vector search finds semantically
> similar content by comparing embedding vectors using
> cosine similarity — powering RAG pipelines, semantic
> search, and recommendation engines.

## What Is Vector Search?

Vector search enables **semantic similarity retrieval**
by converting text into high-dimensional embeddings
and comparing them mathematically.

**Key use cases:**
- Retrieval-Augmented Generation (RAG)
- Semantic document search
- Recommendation engines

## How It Works

1. **Embed** the query (e.g. \`text-embedding-3-small\`)
2. **Compare** against stored vectors via cosine sim
3. **Retrieve** top-k most similar results
4. **Filter** by threshold (typically ≥ 0.78)

## Choosing a Vector Database

| Database  | Best For         | Hosted |
|-----------|------------------|--------|
| Pinecone  | Production RAG   | ✅ Yes |
| pgvector  | Existing Postgres | ❌ No |
| Weaviate  | Hybrid search    | ✅ Yes |

## Implementation

\`\`\`python
query_vector = embed(user_query)  # shape: [1536]

results = db.query(
    vector=query_vector,
    top_k=5,
    filter={"score": {"$gte": 0.78}}
)
\`\`\`

> **RAG Chunk — Threshold Tuning:** Cosine similarity
> ≥ 0.78 indicates strong semantic relevance. Lower
> values increase recall; higher values improve
> precision. Tune per your dataset.

## See Also
- [Embedding Models Guide](./embeddings.md)
- [RAG Pipeline Architecture](./rag-pipeline.md)`;

    // ── Helpers ──────────────────────────────────────────────────────────
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

    // ── Play ─────────────────────────────────────────────────────────────
    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.disabled = true;
        playBtn.textContent = '⏸️ Playing...';

        // Reset state
        demoIssues.style.opacity   = '0';
        demoBenefits.style.opacity = '0';
        demoStats.style.display    = 'none';
        beforeCodeEl.textContent   = '';
        afterCodeEl.textContent    = '';

        // Step 1 — activate before panel, type raw messy markdown
        demoPanels[0].classList.add('active');
        await typeCode(beforeCodeEl, beforeCode, 22);

        // Show issue badges
        await sleep(300);
        demoIssues.style.transition = 'opacity 0.5s ease-in';
        demoIssues.style.opacity = '1';
        await sleep(1200);

        // Step 2 — activate after panel, type optimized markdown
        demoPanels[1].classList.add('active');
        await typeCode(afterCodeEl, afterCode, 10);

        // Show benefit badges
        await sleep(300);
        demoBenefits.style.transition = 'opacity 0.5s ease-in';
        demoBenefits.style.opacity = '1';
        await sleep(1200);

        // Step 3 — show stats
        demoStats.style.display = 'flex';
        await sleep(2000);

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
            gtag('event', 'demo_cta_clicked', {
                source: 'demo_section',
                action: 'try_it_now'
            });
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    initializeDemo();
}
