/**
 * Poly-Glot Markdown — Pipeline Demo Animation
 * Shows: Chunk → Embed → Search → Answer flow
 */
(function () {
    const playBtn  = document.getElementById('plPlayDemo');
    const resetBtn = document.getElementById('plResetDemo');
    const canvas   = document.getElementById('plDemoCanvas');
    const stages   = [1,2,3,4].map(i => document.getElementById('plStage' + i));

    if (!playBtn || !canvas) return;

    let playing = false;

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function setActive(n) {
        stages.forEach((s, i) => {
            if (!s) return;
            s.style.opacity = i < n ? '0.4' : i === n ? '1' : '0.5';
            s.style.transform = i === n ? 'scale(1.08)' : 'scale(1)';
            if (i === n) s.style.background = 'rgba(125,211,252,0.12)';
            else s.style.background = 'transparent';
        });
    }

    async function typeText(el, text, speed) {
        speed = speed || 12;
        let out = '';
        for (const ch of text) {
            out += ch;
            el.innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(out) + '<span class="pl-cursor">▌</span></pre>';
            await sleep(speed);
        }
        el.innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(out) + '</pre>';
    }

    async function runDemo() {
        if (playing) return;
        playing = true;
        playBtn.style.display = 'none';
        resetBtn.style.display = '';

        // ── Stage 1: Chunk ──
        setActive(0);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">📄 Raw Document</div><div id="plDemoType1" class="pl-demo-code"></div></div>';
        await typeText(document.getElementById('plDemoType1'),
`# API Authentication Guide

API keys authenticate requests. Each key has
scopes that control access levels.

## Getting Your API Key

Navigate to Settings > API Keys > Create.
Choose read-only or read-write scope.

## Rate Limits

Free tier: 100 req/min.
Pro tier: 10,000 req/min.`, 10);

        await sleep(600);
        canvas.innerHTML += '<div class="pl-demo-arrow-down">↓</div>';
        await sleep(300);
        canvas.innerHTML += `<div class="pl-demo-chunks">
            <div class="pl-demo-chunk"><strong>Chunk 1:</strong> Frontmatter (metadata)</div>
            <div class="pl-demo-chunk"><strong>Chunk 2:</strong> Getting Your API Key</div>
            <div class="pl-demo-chunk"><strong>Chunk 3:</strong> Rate Limits</div>
        </div>`;
        await sleep(1200);

        // ── Stage 2: Embed ──
        setActive(1);
        canvas.innerHTML = `<div class="pl-demo-panel"><div class="pl-demo-panel-label">🧮 Embedding Chunks</div><div class="pl-demo-embed-grid" id="plEmbedGrid"></div></div>`;
        const grid = document.getElementById('plEmbedGrid');
        const chunks = ['Frontmatter', 'Getting Your API Key', 'Rate Limits'];
        for (let i = 0; i < chunks.length; i++) {
            await sleep(500);
            const vec = Array.from({length: 8}, () => (Math.random()*2-1).toFixed(3));
            grid.innerHTML += `<div class="pl-demo-embed-row">
                <div class="pl-demo-embed-chunk">${chunks[i]}</div>
                <div class="pl-demo-embed-arrow">→</div>
                <div class="pl-demo-embed-vec">[${vec.join(', ')}…]</div>
                <div class="pl-demo-embed-ok">✅</div>
            </div>`;
        }
        await sleep(400);
        grid.innerHTML += '<div class="pl-demo-embed-status">3 chunks → IndexedDB 🗄️</div>';
        await sleep(1000);

        // ── Stage 3: Search ──
        setActive(2);
        canvas.innerHTML = `<div class="pl-demo-panel">
            <div class="pl-demo-panel-label">🔍 Searching: "how many requests per minute?"</div>
            <div id="plSearchAnim" class="pl-demo-search"></div>
        </div>`;
        const searchDiv = document.getElementById('plSearchAnim');
        searchDiv.innerHTML = '<div class="pl-demo-searching">Computing cosine similarity…</div>';
        await sleep(800);
        searchDiv.innerHTML = `
            <div class="pl-demo-search-result pl-demo-match-high">
                <span class="pl-demo-match-score">94.2%</span>
                <span class="pl-demo-match-title">Rate Limits</span>
                <span class="pl-demo-match-preview">Free tier: 100 req/min. Pro tier: 10,000 req/min.</span>
            </div>
            <div class="pl-demo-search-result pl-demo-match-med">
                <span class="pl-demo-match-score">61.8%</span>
                <span class="pl-demo-match-title">Getting Your API Key</span>
                <span class="pl-demo-match-preview">Navigate to Settings > API Keys > Create…</span>
            </div>
            <div class="pl-demo-search-result pl-demo-match-low">
                <span class="pl-demo-match-score">32.1%</span>
                <span class="pl-demo-match-title">Frontmatter</span>
                <span class="pl-demo-match-preview">title, tags, description…</span>
            </div>`;
        await sleep(1500);

        // ── Stage 4: Answer ──
        setActive(3);
        canvas.innerHTML = `<div class="pl-demo-panel">
            <div class="pl-demo-panel-label">💬 Generating Answer (Gemini)</div>
            <div class="pl-demo-ask-q">Q: "How many requests per minute on the free tier?"</div>
            <div id="plAnswerType" class="pl-demo-answer"></div>
        </div>`;
        await typeText(document.getElementById('plAnswerType'),
`The free tier allows 100 requests per minute. 
If you need higher throughput, the Pro tier 
supports up to 10,000 requests per minute.

[Source: Rate Limits, similarity: 94.2%]`, 18);

        await sleep(500);
        canvas.innerHTML += `<div class="pl-demo-answer-sources">
            <span style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Sources:</span>
            <span class="pl-demo-source-tag">📄 Rate Limits — 94.2%</span>
            <span class="pl-demo-source-tag">📄 Getting Your API Key — 61.8%</span>
        </div>`;

        playing = false;
    }

    function resetDemo() {
        playing = false;
        playBtn.style.display = '';
        resetBtn.style.display = 'none';
        stages.forEach(s => { if(s){s.style.opacity='';s.style.transform='';s.style.background='';} });
        canvas.innerHTML = '<div class="pl-demo-placeholder"><span style="font-size:40px;opacity:0.3">🔬</span><p style="color:#64748b;font-size:13px">Press Play to see the pipeline in action</p></div>';
    }

    playBtn.addEventListener('click', runDemo);
    resetBtn.addEventListener('click', resetDemo);
})();
