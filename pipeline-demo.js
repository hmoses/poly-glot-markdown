/**
 * Poly-Glot Markdown — Pipeline Demo Animation
 * Matches Format tab speed (requestAnimationFrame, framesPerChar=3)
 * Click canvas to pause/resume
 */
(function () {
    var playBtn  = document.getElementById('plPlayDemo');
    var resetBtn = document.getElementById('plResetDemo');
    var canvas   = document.getElementById('plDemoCanvas');
    var stages   = [1,2,3,4].map(function(i){ return document.getElementById('plStage' + i); });

    if (!playBtn || !canvas) return;

    var playing = false;
    var paused  = false;

    function sleep(ms) {
        return new Promise(function(resolve) {
            var elapsed = 0;
            var interval = 50;
            function tick() {
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
        });
    }

    // Click canvas to pause/resume
    canvas.addEventListener('click', function() {
        if (!playing) return;
        paused = !paused;
        if (paused) {
            canvas.style.outline = '2px solid #fbbf24';
            canvas.insertAdjacentHTML('beforeend', '<div id="plPauseBanner" style="text-align:center;padding:8px;font-size:13px;color:#fbbf24;font-weight:600;background:rgba(251,191,36,0.08);border-radius:6px;margin-top:10px">⏸ Paused — click to resume</div>');
        } else {
            canvas.style.outline = '';
            var banner = document.getElementById('plPauseBanner');
            if (banner) banner.remove();
        }
    });

    async function runDemo() {
        if (playing) return;
        playing = true;
        paused = false;
        playBtn.style.display = 'none';
        resetBtn.style.display = '';

        // ── Stage 1: Chunk ──
        setActive(0);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">📄 Raw Document</div><div id="plDemoType1" class="pl-demo-code"></div></div>';
        await typeSmooth(document.getElementById('plDemoType1'),
'# API Authentication Guide\n\nAPI keys authenticate requests. Each key has\nscopes that control access levels.\n\n## Getting Your API Key\n\nNavigate to Settings > API Keys > Create.\nChoose read-only or read-write scope.\n\n## Rate Limits\n\nFree tier: 100 req/min.\nPro tier: 10,000 req/min.', 3);

        await sleep(2000);
        canvas.innerHTML += '<div class="pl-demo-arrow-down">↓</div>';
        await sleep(1000);
        canvas.innerHTML += '<div class="pl-demo-chunks"><div class="pl-demo-chunk"><strong>Chunk 1:</strong> Frontmatter (metadata)</div><div class="pl-demo-chunk"><strong>Chunk 2:</strong> Getting Your API Key</div><div class="pl-demo-chunk"><strong>Chunk 3:</strong> Rate Limits</div></div>';
        await sleep(3500);

        // ── Stage 2: Embed ──
        setActive(1);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">🧮 Embedding Chunks</div><div class="pl-demo-embed-grid" id="plEmbedGrid"></div></div>';
        var grid = document.getElementById('plEmbedGrid');
        var chunks = ['Frontmatter', 'Getting Your API Key', 'Rate Limits'];
        for (var i = 0; i < chunks.length; i++) {
            await sleep(1500);
            var vec = Array.from({length: 8}, function(){ return (Math.random()*2-1).toFixed(3); });
            grid.innerHTML += '<div class="pl-demo-embed-row"><div class="pl-demo-embed-chunk">' + chunks[i] + '</div><div class="pl-demo-embed-arrow">→</div><div class="pl-demo-embed-vec">[' + vec.join(', ') + '…]</div><div class="pl-demo-embed-ok">✅</div></div>';
        }
        await sleep(1200);
        grid.innerHTML += '<div class="pl-demo-embed-status">3 chunks → IndexedDB 🗄️</div>';
        await sleep(3000);

        // ── Stage 3: Search ──
        setActive(2);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">🔍 Searching: "how many requests per minute?"</div><div id="plSearchAnim" class="pl-demo-search"></div></div>';
        var searchDiv = document.getElementById('plSearchAnim');
        searchDiv.innerHTML = '<div class="pl-demo-searching">Computing cosine similarity…</div>';
        await sleep(2500);
        searchDiv.innerHTML = '<div class="pl-demo-search-result pl-demo-match-high"><span class="pl-demo-match-score">94.2%</span><span class="pl-demo-match-title">Rate Limits</span><span class="pl-demo-match-preview">Free tier: 100 req/min. Pro tier: 10,000 req/min.</span></div><div class="pl-demo-search-result pl-demo-match-med"><span class="pl-demo-match-score">61.8%</span><span class="pl-demo-match-title">Getting Your API Key</span><span class="pl-demo-match-preview">Navigate to Settings > API Keys > Create…</span></div><div class="pl-demo-search-result pl-demo-match-low"><span class="pl-demo-match-score">32.1%</span><span class="pl-demo-match-title">Frontmatter</span><span class="pl-demo-match-preview">title, tags, description…</span></div>';
        await sleep(3500);

        // ── Stage 4: Answer ──
        setActive(3);
        canvas.innerHTML = '<div class="pl-demo-panel"><div class="pl-demo-panel-label">💬 Generating Answer (Gemini)</div><div class="pl-demo-ask-q">Q: "How many requests per minute on the free tier?"</div><div id="plAnswerType" class="pl-demo-answer"></div></div>';
        await typeSmooth(document.getElementById('plAnswerType'),
'The free tier allows 100 requests per minute.\nIf you need higher throughput, the Pro tier\nsupports up to 10,000 requests per minute.\n\n[Source: Rate Limits, similarity: 94.2%]', 3);

        await sleep(1000);
        canvas.innerHTML += '<div class="pl-demo-answer-sources"><span style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em">Sources:</span><span class="pl-demo-source-tag">📄 Rate Limits — 94.2%</span><span class="pl-demo-source-tag">📄 Getting Your API Key — 61.8%</span></div>';

        playing = false;
    }

    function resetDemo() {
        playing = false;
        paused = false;
        canvas.style.outline = '';
        playBtn.style.display = '';
        resetBtn.style.display = 'none';
        stages.forEach(function(s){ if(s){s.style.opacity='';s.style.transform='';s.style.background='';} });
        canvas.innerHTML = '<div class="pl-demo-placeholder"><span style="font-size:40px;opacity:0.3">🔬</span><p style="color:#64748b;font-size:13px">Press Play to see the pipeline in action</p></div>';
    }

    playBtn.addEventListener('click', runDemo);
    resetBtn.addEventListener('click', resetDemo);
})();
