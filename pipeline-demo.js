/**
 * Poly-Glot Markdown — Pipeline Demo Animation
 * Auto-progresses through all 4 steps.
 * Each step appends (previous steps stay visible).
 * Step cards are clickable CTAs to jump to any step.
 * Click canvas to pause/resume.
 */
(function () {
    var playBtn  = document.getElementById('plPlayDemo');
    var resetBtn = document.getElementById('plResetDemo');
    var canvas   = document.getElementById('plDemoCanvas');
    var stageEls = [1,2,3,4].map(function(i){ return document.getElementById('plStage' + i); });

    if (!playBtn || !canvas) return;

    var playing   = false;
    var paused    = false;
    var cancelled = false;
    var jumpTo    = -1;
    var currentStage = -1;
    var demoResolve = null; // resolve the waiting promise when jump requested

    function sleep(ms) {
        return new Promise(function(resolve) {
            var elapsed = 0;
            function tick() {
                if (cancelled) { resolve(); return; }
                if (jumpTo >= 0) { resolve(); return; }
                if (paused) { setTimeout(tick, 100); return; }
                elapsed += 50;
                if (elapsed >= ms) resolve();
                else setTimeout(tick, 50);
            }
            tick();
        });
    }

    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function typeSmooth(el, text, fpc) {
        fpc = fpc || 3;
        return new Promise(function(resolve) {
            var pos = 0, frame = 0;
            function tick() {
                if (cancelled || jumpTo >= 0) {
                    el.innerHTML = '<pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(text) + '</pre>';
                    resolve(); return;
                }
                if (paused) { requestAnimationFrame(tick); return; }
                frame++;
                if (frame >= fpc) {
                    frame = 0; pos++;
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
        currentStage = n;
        stageEls.forEach(function(s, i) {
            if (!s) return;
            s.style.opacity    = i <= n ? '1' : '0.4';
            s.style.transform  = i === n ? 'scale(1.08)' : 'scale(1)';
            s.style.background = i === n ? 'rgba(125,211,252,0.12)' : 'transparent';
            s.style.cursor     = 'pointer';
        });
    }

    // Pause/resume on canvas click
    canvas.addEventListener('click', function(e) {
        if (e.target.closest('.pl-demo-stage')) return;
        if (!playing) return;
        paused = !paused;
        var banner = document.getElementById('plPauseBanner');
        if (paused) {
            canvas.style.outline = '2px solid #fbbf24';
            if (!banner) canvas.insertAdjacentHTML('beforeend','<div id="plPauseBanner" style="text-align:center;padding:8px;font-size:13px;color:#fbbf24;font-weight:600;background:rgba(251,191,36,0.08);border-radius:6px;margin-top:10px">⏸ Paused — click to resume</div>');
        } else {
            canvas.style.outline = '';
            if (banner) banner.remove();
        }
    });

    // Click step cards to jump
    stageEls.forEach(function(s, i) {
        if (!s) return;
        s.addEventListener('click', function() {
            if (!playing) {
                jumpTo = i;
                runDemo();
            } else {
                jumpTo = i;
                paused = false;
                canvas.style.outline = '';
                var b = document.getElementById('plPauseBanner');
                if (b) b.remove();
            }
        });
    });

    var formattedDoc = '---\ntitle: "API Authentication Guide"\ndescription: "How to authenticate API requests using keys with scoped access levels."\ntags: [api, authentication, rate-limits]\nlast_reviewed: 2026-09-16\nexpires: 2026-12-15\n---\n\n# API Authentication Guide\n\n> **Summary:** API keys authenticate requests with scoped access controls.\n\n## Getting Your API Key {#getting-your-api-key}\n\n<!-- chunk-boundary -->\n\n> **Summary:** Create and configure API keys from Settings.\n\nNavigate to **Settings** > **API Keys** > Create.\nChoose **read-only** or **read-write** scope.\n\n## Rate Limits {#rate-limits}\n\n<!-- chunk-boundary -->\n\n> **Summary:** Free tier allows 100 req/min; Pro tier allows 10,000 req/min.\n\n**Free tier**: 100 req/min.\n**Pro tier**: 10,000 req/min.';

    /* ── Render a completed stage instantly (for jump-ahead) ── */
    function renderStageInstant(n) {
        if (n === 0) {
            canvas.innerHTML += '<div class="pl-demo-panel" id="plPanel1"><div class="pl-demo-panel-label">📄 Step 1 — Formatted Document (from Format tab)</div><div class="pl-demo-code"><pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">' + esc(formattedDoc) + '</pre></div></div>'
                + '<div class="pl-demo-arrow-down">↓ Split by chunk boundaries</div>'
                + '<div class="pl-demo-chunks"><div class="pl-demo-chunk"><strong>Chunk 1:</strong> Frontmatter</div><div class="pl-demo-chunk"><strong>Chunk 2:</strong> Getting Your API Key</div><div class="pl-demo-chunk"><strong>Chunk 3:</strong> Rate Limits</div></div>';
        }
        if (n === 1) {
            var vecs = [];
            var names = ['Frontmatter','Getting Your API Key','Rate Limits'];
            for (var j = 0; j < 3; j++) {
                var v = Array.from({length:8},function(){return (Math.random()*2-1).toFixed(3);});
                vecs.push('<div class="pl-demo-embed-row"><div class="pl-demo-embed-chunk">' + names[j] + '</div><div class="pl-demo-embed-arrow">→</div><div class="pl-demo-embed-vec">[' + v.join(', ') + '…]</div><div class="pl-demo-embed-ok">✅</div></div>');
            }
            canvas.innerHTML += '<div class="pl-demo-arrow-down">↓ Embed each chunk</div>'
                + '<div class="pl-demo-panel" id="plPanel2"><div class="pl-demo-panel-label">🧮 Step 2 — Embedding Chunks → Vectors</div><div class="pl-demo-embed-grid">' + vecs.join('') + '<div class="pl-demo-embed-status">3 chunks stored → IndexedDB 🗄️</div></div></div>';
        }
        if (n === 2) {
            canvas.innerHTML += '<div class="pl-demo-arrow-down">↓ User asks a question</div>'
                + '<div class="pl-demo-panel" id="plPanel3"><div class="pl-demo-panel-label">🔍 Step 3 — Semantic Search: "how many requests per minute?"</div><div class="pl-demo-search">'
                + '<div class="pl-demo-search-result pl-demo-match-high"><span class="pl-demo-match-score">94.2%</span><span class="pl-demo-match-title">Rate Limits</span><span class="pl-demo-match-preview">Free tier: 100 req/min. Pro tier: 10,000 req/min.</span></div>'
                + '<div class="pl-demo-search-result pl-demo-match-med"><span class="pl-demo-match-score">61.8%</span><span class="pl-demo-match-title">Getting Your API Key</span><span class="pl-demo-match-preview">Navigate to Settings > API Keys > Create…</span></div>'
                + '<div class="pl-demo-search-result pl-demo-match-low"><span class="pl-demo-match-score">32.1%</span><span class="pl-demo-match-title">Frontmatter</span><span class="pl-demo-match-preview">title, tags, description…</span></div>'
                + '</div></div>';
        }
        if (n === 3) {
            canvas.innerHTML += '<div class="pl-demo-arrow-down">↓ Send top chunks + question to LLM</div>'
                + '<div class="pl-demo-panel" id="plPanel4"><div class="pl-demo-panel-label">💬 Step 4 — LLM Answer (Gemini)</div><div class="pl-demo-ask-q">Q: "How many requests per minute on the free tier?"</div><div class="pl-demo-answer"><pre style="margin:0;white-space:pre-wrap;color:#a5f3fc;font-size:12px;font-family:Fira Code,monospace;line-height:1.6">The free tier allows 100 requests per minute.\nIf you need higher throughput, the Pro tier\nsupports up to 10,000 requests per minute.\n\n[Source: Rate Limits, similarity: 94.2%]</pre></div></div>'
                + '<div class="pl-demo-answer-sources"><span style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Sources:</span><span class="pl-demo-source-tag">📄 Rate Limits — 94.2%</span><span class="pl-demo-source-tag">📄 Getting Your API Key — 61.8%</span></div>';
        }
    }

    /* ── Animated stages ── */
    async function showStage1() {
        if (cancelled) return;
        setActive(0);
        var panel = document.createElement('div');
        panel.className = 'pl-demo-panel'; panel.id = 'plPanel1';
        panel.innerHTML = '<div class="pl-demo-panel-label">📄 Step 1 — Formatted Document (from Format tab)</div><div id="plDemoType1" class="pl-demo-code"></div>';
        canvas.appendChild(panel);
        await typeSmooth(document.getElementById('plDemoType1'), formattedDoc, 3);
        if (cancelled || jumpTo >= 0) return;
        await sleep(1500);
        if (cancelled || jumpTo >= 0) return;
        var a = document.createElement('div'); a.className='pl-demo-arrow-down'; a.textContent='↓ Split by chunk boundaries'; canvas.appendChild(a);
        await sleep(800);
        if (cancelled || jumpTo >= 0) return;
        var c = document.createElement('div'); c.className='pl-demo-chunks';
        c.innerHTML='<div class="pl-demo-chunk"><strong>Chunk 1:</strong> Frontmatter</div><div class="pl-demo-chunk"><strong>Chunk 2:</strong> Getting Your API Key</div><div class="pl-demo-chunk"><strong>Chunk 3:</strong> Rate Limits</div>';
        canvas.appendChild(c);
        await sleep(2500);
    }

    async function showStage2() {
        if (cancelled) return;
        setActive(1);
        var a = document.createElement('div'); a.className='pl-demo-arrow-down'; a.textContent='↓ Embed each chunk'; canvas.appendChild(a);
        await sleep(600);
        if (cancelled || jumpTo >= 0) return;
        var panel = document.createElement('div'); panel.className='pl-demo-panel'; panel.id='plPanel2';
        panel.innerHTML='<div class="pl-demo-panel-label">🧮 Step 2 — Embedding Chunks → Vectors</div><div class="pl-demo-embed-grid" id="plEmbedGrid"></div>';
        canvas.appendChild(panel);
        var grid = document.getElementById('plEmbedGrid');
        var names = ['Frontmatter','Getting Your API Key','Rate Limits'];
        for (var i = 0; i < names.length; i++) {
            if (cancelled || jumpTo >= 0) return;
            await sleep(1200);
            if (cancelled || jumpTo >= 0) return;
            var v = Array.from({length:8},function(){return (Math.random()*2-1).toFixed(3);});
            grid.innerHTML += '<div class="pl-demo-embed-row"><div class="pl-demo-embed-chunk">'+names[i]+'</div><div class="pl-demo-embed-arrow">→</div><div class="pl-demo-embed-vec">['+v.join(', ')+'…]</div><div class="pl-demo-embed-ok">✅</div></div>';
        }
        if (cancelled || jumpTo >= 0) return;
        await sleep(800);
        grid.innerHTML += '<div class="pl-demo-embed-status">3 chunks stored → IndexedDB 🗄️</div>';
        await sleep(2000);
    }

    async function showStage3() {
        if (cancelled) return;
        setActive(2);
        var a = document.createElement('div'); a.className='pl-demo-arrow-down'; a.textContent='↓ User asks a question'; canvas.appendChild(a);
        await sleep(600);
        if (cancelled || jumpTo >= 0) return;
        var panel = document.createElement('div'); panel.className='pl-demo-panel'; panel.id='plPanel3';
        panel.innerHTML='<div class="pl-demo-panel-label">🔍 Step 3 — Semantic Search: "how many requests per minute?"</div><div id="plSearchAnim" class="pl-demo-search"></div>';
        canvas.appendChild(panel);
        var sd = document.getElementById('plSearchAnim');
        sd.innerHTML='<div class="pl-demo-searching">Computing cosine similarity across 3 chunks…</div>';
        if (cancelled || jumpTo >= 0) return;
        await sleep(2000);
        if (cancelled || jumpTo >= 0) return;
        sd.innerHTML='<div class="pl-demo-search-result pl-demo-match-high"><span class="pl-demo-match-score">94.2%</span><span class="pl-demo-match-title">Rate Limits</span><span class="pl-demo-match-preview">Free tier: 100 req/min. Pro tier: 10,000 req/min.</span></div>'
            +'<div class="pl-demo-search-result pl-demo-match-med"><span class="pl-demo-match-score">61.8%</span><span class="pl-demo-match-title">Getting Your API Key</span><span class="pl-demo-match-preview">Navigate to Settings > API Keys > Create…</span></div>'
            +'<div class="pl-demo-search-result pl-demo-match-low"><span class="pl-demo-match-score">32.1%</span><span class="pl-demo-match-title">Frontmatter</span><span class="pl-demo-match-preview">title, tags, description…</span></div>';
        await sleep(2500);
    }

    async function showStage4() {
        if (cancelled) return;
        setActive(3);
        var a = document.createElement('div'); a.className='pl-demo-arrow-down'; a.textContent='↓ Send top chunks + question to LLM'; canvas.appendChild(a);
        await sleep(600);
        if (cancelled || jumpTo >= 0) return;
        var panel = document.createElement('div'); panel.className='pl-demo-panel'; panel.id='plPanel4';
        panel.innerHTML='<div class="pl-demo-panel-label">💬 Step 4 — LLM Answer (Gemini)</div><div class="pl-demo-ask-q">Q: "How many requests per minute on the free tier?"</div><div id="plAnswerType" class="pl-demo-answer"></div>';
        canvas.appendChild(panel);
        await typeSmooth(document.getElementById('plAnswerType'), 'The free tier allows 100 requests per minute.\nIf you need higher throughput, the Pro tier\nsupports up to 10,000 requests per minute.\n\n[Source: Rate Limits, similarity: 94.2%]', 3);
        if (cancelled) return;
        await sleep(800);
        var src = document.createElement('div'); src.className='pl-demo-answer-sources';
        src.innerHTML='<span style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Sources:</span><span class="pl-demo-source-tag">📄 Rate Limits — 94.2%</span><span class="pl-demo-source-tag">📄 Getting Your API Key — 61.8%</span>';
        canvas.appendChild(src);
    }

    /* ── Main demo runner ── */
    var stageFns = [showStage1, showStage2, showStage3, showStage4];

    async function runDemo() {
        if (playing) return;
        playing = true;
        cancelled = false;
        paused = false;
        playBtn.style.display = 'none';
        resetBtn.style.display = '';
        canvas.innerHTML = '';
        canvas.style.outline = '';

        var startAt = 0;
        if (jumpTo >= 0) { startAt = jumpTo; jumpTo = -1; }

        // Instantly render all stages before the requested one
        for (var s = 0; s < startAt; s++) {
            renderStageInstant(s);
            setActive(s);
        }

        // Animate from startAt onward
        for (var i = startAt; i < 4; i++) {
            if (cancelled) { playing = false; return; }

            // Check if a jump was requested during animation
            if (jumpTo >= 0) {
                var target = jumpTo;
                jumpTo = -1;
                // Clear and re-render up to target instantly
                canvas.innerHTML = '';
                for (var r = 0; r < target; r++) { renderStageInstant(r); }
                i = target - 1; // loop will i++ to target
                continue;
            }

            await stageFns[i]();

            // Check again after stage completes
            if (jumpTo >= 0) {
                var target2 = jumpTo;
                jumpTo = -1;
                canvas.innerHTML = '';
                for (var r2 = 0; r2 < target2; r2++) { renderStageInstant(r2); }
                i = target2 - 1;
                continue;
            }
        }

        if (cancelled) { playing = false; return; }

        // Done
        setActive(3);
        playing = false;
        canvas.style.outline = '2px solid #34d399';
        canvas.insertAdjacentHTML('beforeend','<div id="plPauseBanner" style="text-align:center;padding:10px;font-size:13px;color:#34d399;font-weight:600;background:rgba(16,185,129,0.08);border-radius:6px;margin-top:12px">✅ Demo complete — click a step card above to revisit, or Reset</div>');
    }

    function resetDemo() {
        cancelled = true;
        playing = false;
        paused = false;
        jumpTo = -1;
        currentStage = -1;
        canvas.style.outline = '';
        playBtn.style.display = '';
        resetBtn.style.display = 'none';
        stageEls.forEach(function(s){ if(s){s.style.opacity='';s.style.transform='';s.style.background='';} });
        canvas.innerHTML = '<div class="pl-demo-placeholder"><span style="font-size:40px;opacity:0.3">🔬</span><p style="color:#64748b;font-size:13px">Press ▶ Play to see the full RAG pipeline in action</p></div>';
    }

    playBtn.addEventListener('click', runDemo);
    resetBtn.addEventListener('click', resetDemo);
})();
