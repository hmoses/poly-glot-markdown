/**
 * Poly-Glot Markdown — Pipeline Demo Animation
 * - Step 1 shows PRE-FORMATTED RAG/GEO document (output of Format tab)
 * - Click step cards to jump to that stage and pause
 * - Click canvas to pause/resume
 */
(function () {
    var playBtn  = document.getElementById('plPlayDemo');
    var resetBtn = document.getElementById('plResetDemo');
    var canvas   = document.getElementById('plDemoCanvas');
    var stages   = [1,2,3,4].map(function(i){ return document.getElementById('plStage' + i); });

    if (!playBtn || !canvas) return;

    var playing = false;
    var paused  = false;
    var jumpTo  = -1; // -1 = no jump requested

    function sleep(ms) {
        return new Promise(function(resolve) {
            var elapsed = 0;
            var interval = 50;
            function tick() {
                if (jumpTo >= 0) { resolve(); return; }
                if (paused) { setTimeout(tick, 100); return; }
                elapsed += interval;
                if (elapsed >= ms) resolve();
                else setTimeout(tick, interval);
            }
            tick();
        });
    }

    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function typeSmooth(el, text, framesPerChar) {
        framesPerChar = framesPerChar || 3;
        return new Promise(function(resolve) {
            var pos = 0, frame = 0;
            function tick() {
                if (jumpTo >= 0) { el.innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(text) + '</pre>'; resolve(); return; }
                if (paused) { requestAnimationFrame(tick); return; }
                frame++;
                if (frame >= framesPerChar) {
                    frame = 0;
                    pos++;
                    el.innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(text.slice(0, pos)) + '<span class="pl-cursor">▌</span></pre>';
                }
                if (pos < text.length) requestAnimationFrame(tick);
                else {
                    el.innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(text) + '</pre>';
                    resolve();
                }
            }
            requestAnimationFrame(tick);
        });
    }

    function setActive(n) {
        stages.forEach(function(s, i) {
            if (!s) return;
            s.style.opacity = i < n ? '0.4' : i === n ? '1' : '0.5';
            s.style.transform = i === n ? 'scale(1.08)' : 'scale(1)';
            s.style.background = i === n ? 'rgba(125,211,252,0.12)' : 'transparent';
            s.style.cursor = 'pointer';
        });
    }

    // Click canvas to pause/resume
    canvas.addEventListener('click', function(e) {
        if (e.target.closest('.pl-demo-stage')) return;
        if (!playing) return;
        paused = !paused;
        var banner = document.getElementById('plPauseBanner');
        if (paused) {
            canvas.style.outline = '2px solid #fbbf24';
            if (!banner) canvas.insertAdjacentHTML('beforeend', '<div id="plPauseBanner" style="text-align:center;padding:8px;font-size:13px;color:#fbbf24;font-weight:600;background:rgba(251,191,36,0.08);border-radius:6px;margin-top:10px">⏸ Paused — click to resume</div>');
        } else {
            canvas.style.outline = '';
            if (banner) banner.remove();
        }
    });

    // Click step cards to jump
    stages.forEach(function(s, i) {
        if (!s) return;
        s.addEventListener('click', function() {
            if (!playing) {
                // Start demo and jump to this stage
                jumpTo = i;
                runDemo();
            } else {
                jumpTo = i;
                paused = false;
                var banner = document.getElementById('plPauseBanner');
                if (banner) banner.remove();
                canvas.style.outline = '';
            }
        });
    });

    // Pre-formatted RAG/GEO document (what comes OUT of the Format tab)
    var formattedDoc = '---\ntitle: "API Authentication Guide"\ndescription: "How to authenticate API requests using keys with scoped access levels."\ntags: [api, authentication, rate-limits]\nlast_reviewed: 2026-09-16\nexpires: 2026-12-15\n---\n\n# API Authentication Guide\n\n> **Summary:** API keys authenticate requests with scoped access controls.\n\n## Getting Your API Key {#getting-your-api-key}\n\n<!-- chunk-boundary -->\n\n> **Summary:** Create and configure API keys from Settings.\n\nNavigate to **Settings** > **API Keys** > Create.\nChoose **read-only** or **read-write** scope.\n\n## Rate Limits {#rate-limits}\n\n<!-- chunk-boundary -->\n\n> **Summary:** Free tier allows 100 req/min; Pro tier allows 10,000 req/min.\n\n**Free tier**: 100 req/min.\n**Pro tier**: 10,000 req/min.';

    async function showStage1() {
        setActive(0);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">📄 Formatted RAG & GEO Document (from Format tab)</div><div id="plDemoType1" class="pl-demo-code"></div></div>';
        if (jumpTo > 0) {
            document.getElementById('plDemoType1').innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(formattedDoc) + '</pre>';
        } else {
            await typeSmooth(document.getElementById('plDemoType1'), formattedDoc, 3);
            await sleep(2000);
        }
        canvas.innerHTML += '<div class="pl-demo-arrow-down">↓</div>';
        if (jumpTo <= 0) await sleep(1000);
        canvas.innerHTML += '<div class="pl-demo-chunks"><div class="pl-demo-chunk"><strong>Chunk 1:</strong> Frontmatter (metadata)</div><div class="pl-demo-chunk"><strong>Chunk 2:</strong> Getting Your API Key</div><div class="pl-demo-chunk"><strong>Chunk 3:</strong> Rate Limits</div></div>';
        if (jumpTo <= 0) await sleep(3500);
    }

    async function showStage2() {
        setActive(1);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">🧮 Embedding Chunks</div><div class="pl-demo-embed-grid" id="plEmbedGrid"></div></div>';
        var grid = document.getElementById('plEmbedGrid');
        var chunks = ['Frontmatter', 'Getting Your API Key', 'Rate Limits'];
        for (var i = 0; i < chunks.length; i++) {
            if (jumpTo <= 1) await sleep(1500);
            var vec = Array.from({length: 8}, function(){ return (Math.random()*2-1).toFixed(3); });
            grid.innerHTML += '<div class="pl-demo-embed-row"><div class="pl-demo-embed-chunk">' + chunks[i] + '</div><div class="pl-demo-embed-arrow">→</div><div class="pl-demo-embed-vec">[' + vec.join(', ') + '…]</div><div class="pl-demo-embed-ok">✅</div></div>';
        }
        if (jumpTo <= 1) await sleep(1200);
        grid.innerHTML += '<div class="pl-demo-embed-status">3 chunks → IndexedDB 🗄️</div>';
        if (jumpTo <= 1) await sleep(3000);
    }

    async function showStage3() {
        setActive(2);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">🔍 Searching: "how many requests per minute?"</div><div id="plSearchAnim" class="pl-demo-search"></div></div>';
        var searchDiv = document.getElementById('plSearchAnim');
        searchDiv.innerHTML = '<div class="pl-demo-searching">Computing cosine similarity…</div>';
        if (jumpTo <= 2) await sleep(2500);
        searchDiv.innerHTML = '<div class="pl-demo-search-result pl-demo-match-high"><span class="pl-demo-match-score">94.2%</span><span class="pl-demo-match-title">Rate Limits</span><span class="pl-demo-match-preview">Free tier: 100 req/min. Pro tier: 10,000 req/min.</span></div><div class="pl-demo-search-result pl-demo-match-med"><span class="pl-demo-match-score">61.8%</span><span class="pl-demo-match-title">Getting Your API Key</span><span class="pl-demo-match-preview">Navigate to Settings > API Keys > Create…</span></div><div class="pl-demo-search-result pl-demo-match-low"><span class="pl-demo-match-score">32.1%</span><span class="pl-demo-match-title">Frontmatter</span><span class="pl-demo-match-preview">title, tags, description…</span></div>';
        if (jumpTo <= 2) await sleep(3500);
    }

    async function showStage4() {
        setActive(3);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">💬 Generating Answer (Gemini)</div><div class="pl-demo-ask-q">Q: "How many requests per minute on the free tier?"</div><div id="plAnswerType" class="pl-demo-answer"></div></div>';
        if (jumpTo > 3) {
            document.getElementById('plAnswerType').innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">The free tier allows 100 requests per minute.\nIf you need higher throughput, the Pro tier\nsupports up to 10,000 requests per minute.\n\n[Source: Rate Limits, similarity: 94.2%]</pre>';
        } else {
            await typeSmooth(document.getElementById('plAnswerType'), 'The free tier allows 100 requests per minute.\nIf you need higher throughput, the Pro tier\nsupports up to 10,000 requests per minute.\n\n[Source: Rate Limits, similarity: 94.2%]', 3);
        }
        await sleep(1000);
        canvas.innerHTML += '<div class="pl-demo-answer-sources"><span style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Sources:</span><span class="pl-demo-source-tag">📄 Rate Limits — 94.2%</span><span class="pl-demo-source-tag">📄 Getting Your API Key — 61.8%</span></div>';
    }

    async function runDemo() {
        if (playing && jumpTo < 0) return;
        playing = true;
        paused = false;
        playBtn.style.display = 'none';
        resetBtn.style.display = '';

        var startAt = jumpTo >= 0 ? jumpTo : 0;
        jumpTo = -1;

        if (startAt <= 0) { await showStage1(); if (jumpTo >= 0) { startAt = jumpTo; jumpTo = -1; } }
        if (startAt <= 1) { await showStage2(); if (jumpTo >= 0) { startAt = jumpTo; jumpTo = -1; } }
        if (startAt <= 2) { await showStage3(); if (jumpTo >= 0) { startAt = jumpTo; jumpTo = -1; } }
        if (startAt <= 3) { await showStage4(); }

        // Auto-pause at end so user can read
        paused = true;
        canvas.style.outline = '2px solid #34d399';
        canvas.insertAdjacentHTML('beforeend', '<div id="plPauseBanner" style="text-align:center;padding:8px;font-size:13px;color:#34d399;font-weight:600;background:rgba(16,185,129,0.08);border-radius:6px;margin-top:10px">✅ Demo complete — click a step to replay, or Reset</div>');

        playing = false;
    }

    function resetDemo() {
        playing = false;
        paused = false;
        jumpTo = -1;
        canvas.style.outline = '';
        playBtn.style.display = '';
        resetBtn.style.display = 'none';
        stages.forEach(function(s){ if(s){s.style.opacity='';s.style.transform='';s.style.background='';} });
        canvas.innerHTML = '<div class="pl-demo-placeholder"><span style="font-size:40px;opacity:0.3">🔬</span><p style="color:#64748b;font-size:13px">Press Play to see the pipeline in action</p></div>';
    }

    playBtn.addEventListener('click', runDemo);
    resetBtn.addEventListener('click', resetDemo);
})();
