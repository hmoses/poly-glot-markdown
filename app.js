/**
 * Poly-Glot Markdown — App Controller
 * Handles UI interactions, file upload, formatting, diff view, chunk preview, copy/download
 * No API keys needed — all processing is client-side
 */

(function () {
    const formatter = new AIMarkdownFormatter();

    // ── DOM refs ──
    const fileUpload      = document.getElementById('fileUpload');
    const inputEditor     = document.getElementById('inputEditor');
    const clearInputBtn   = document.getElementById('clearInputBtn');
    const formatBtn       = document.getElementById('formatBtn');
    const inputStats      = document.getElementById('inputStats');
    const outputArea      = document.getElementById('outputArea');
    const outputStats     = document.getElementById('outputStats');
    const copyBtn         = document.getElementById('copyBtn');
    const downloadBtn     = document.getElementById('downloadBtn');
    const diffBtn         = document.getElementById('diffBtn');
    const chunkBtn        = document.getElementById('chunkBtn');
    const loadingOverlay  = document.getElementById('loadingOverlay');
    const diffModal       = document.getElementById('diffModal');
    const diffContent     = document.getElementById('diffContent');
    const closeDiffBtn    = document.getElementById('closeDiffBtn');
    const chunkModal      = document.getElementById('chunkModal');
    const chunkContent    = document.getElementById('chunkContent');
    const chunkStatsBar   = document.getElementById('chunkStatsBar');
    const closeChunkBtn   = document.getElementById('closeChunkBtn');
    const impBadges       = document.getElementById('improvementBadges');
    const scoreOutputBtn  = document.getElementById('scoreOutputBtn');

    let lastOutput   = '';
    let lastFilename = 'optimized.md';

    // ── File Upload ──
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        lastFilename = file.name.replace(/(\.md|\.mdx)$/, '') + '-optimized' + (file.name.endsWith('.mdx') ? '.mdx' : '.md');
        const reader = new FileReader();
        reader.onload = (ev) => { inputEditor.value = ev.target.result; updateInputStats(); };
        reader.readAsText(file);
        fileUpload.value = '';
        if (typeof gtag !== 'undefined') gtag('event', 'file_uploaded', { file_type: file.name.endsWith('.mdx') ? 'mdx' : 'md', file_size: file.size });
    });

    // ── Stats ──
    function countStats(text) {
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text.trim() ? text.split('\n').length : 0;
        const chars = text.length;
        return { words, lines, chars };
    }

    function updateInputStats() {
        const s = countStats(inputEditor.value);
        inputStats.textContent = inputEditor.value.trim() ? `${s.words} words · ${s.lines} lines · ${s.chars} chars` : '';
    }

    inputEditor.addEventListener('input', updateInputStats);

    clearInputBtn.addEventListener('click', () => {
        inputEditor.value = '';
        updateInputStats();
        scoreOutputBtn.disabled = true;
        chunkBtn.disabled = true;
    });

    // ── Get selected options ──
    function getOptions() {
        return {
            frontmatter: document.getElementById('optFrontmatter').checked,
            structure:   document.getElementById('optStructure').checked,
            semantic:    document.getElementById('optSemantic').checked,
            geo:         document.getElementById('optGEO').checked,
            rag:         document.getElementById('optRAG').checked,
            mdx:         document.getElementById('optMDX').checked,
        };
    }

    // ── Format ──
    formatBtn.addEventListener('click', async () => {
        const input = inputEditor.value.trim();
        if (!input) { alert('Please paste or upload a Markdown/MDX file first.'); return; }

        const options = getOptions();
        loadingOverlay.style.display = 'flex';
        formatBtn.disabled = true;

        try {
            lastOutput = await formatter.format(input, options);
            outputArea.textContent = lastOutput;
            outputArea.classList.add('has-output');

            const sIn  = countStats(input);
            const sOut = countStats(lastOutput);
            outputStats.textContent = `${sOut.words} words · ${sOut.lines} lines · ${sOut.chars} chars`;

            // Improvement badges
            const badges = [];
            if (options.frontmatter && /^---/m.test(lastOutput) && !/^---/m.test(input)) badges.push('📋 Frontmatter');
            if (options.structure)   badges.push('🏗️ Structure');
            if (options.semantic)    badges.push('💡 Clarity');
            if (options.geo)        badges.push('🔑 GEO Keywords');
            if (options.rag)        badges.push('🧩 RAG Chunks');
            if (/last_reviewed\s*:/.test(lastOutput)) badges.push('📅 Freshness');
            if (/\{#[\w-]+\}/.test(lastOutput)) badges.push('🔗 Anchors');
            if (/chunk-boundary/.test(lastOutput)) badges.push('✂️ Boundaries');
            impBadges.innerHTML = badges.map(b => `<span class="imp-badge">${b}</span>`).join('');

            copyBtn.disabled = false;
            downloadBtn.disabled = false;
            diffBtn.disabled = false;
            chunkBtn.disabled = false;
            scoreOutputBtn.disabled = false;

            if (typeof gtag !== 'undefined') gtag('event', 'format_success', {
                input_words: sIn.words, output_words: sOut.words,
                opt_frontmatter: options.frontmatter, opt_structure: options.structure,
                opt_semantic: options.semantic, opt_geo: options.geo,
                opt_rag: options.rag, opt_mdx: options.mdx,
            });
        } catch (err) {
            outputArea.textContent = '❌ Error: ' + err.message;
            if (typeof gtag !== 'undefined') gtag('event', 'format_error', { error: err.message });
        } finally {
            loadingOverlay.style.display = 'none';
            formatBtn.disabled = false;
        }
    });

    // ── Score Input ──
    const scoreInputBtn = document.getElementById('scoreInputBtn');

    scoreInputBtn.addEventListener('click', () => {
        const input = inputEditor.value.trim();
        if (!input) { alert('Paste or upload a Markdown file first.'); return; }
        scoreInputBtn.classList.toggle('active');
        PolyGlotScorer.renderInline('inputPanel', input, null, false);
        if (typeof gtag !== 'undefined') gtag('event', 'score_input_clicked');
    });

    scoreOutputBtn.addEventListener('click', () => {
        const input = inputEditor.value.trim();
        scoreOutputBtn.classList.toggle('active');
        PolyGlotScorer.renderInline('outputPanel', input || null, lastOutput, false);
        if (typeof gtag !== 'undefined') gtag('event', 'score_output_clicked');
    });

    // ── Copy ──
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(lastOutput).then(() => {
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
            if (typeof gtag !== 'undefined') gtag('event', 'output_copied');
        });
    });

    // ── Download ──
    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([lastOutput], { type: 'text/markdown' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = lastFilename;
        a.click();
        URL.revokeObjectURL(url);
        if (typeof gtag !== 'undefined') gtag('event', 'output_downloaded', { filename: lastFilename });
    });

    // ── Diff ──
    diffBtn.addEventListener('click', () => {
        const original = inputEditor.value.split('\n');
        const optimized = lastOutput.split('\n');
        let html = '';
        const maxLen = Math.max(original.length, optimized.length);
        for (let i = 0; i < maxLen; i++) {
            const o = original[i];
            const n = optimized[i];
            if (o === undefined) {
                html += `<span class="diff-add">+ ${escHtml(n)}</span>`;
            } else if (n === undefined) {
                html += `<span class="diff-remove">- ${escHtml(o)}</span>`;
            } else if (o !== n) {
                html += `<span class="diff-remove">- ${escHtml(o)}</span>`;
                html += `<span class="diff-add">+ ${escHtml(n)}</span>`;
            } else {
                html += `<span class="diff-neutral">  ${escHtml(o)}</span>`;
            }
        }
        diffContent.innerHTML = html;
        diffModal.style.display = 'flex';
        if (typeof gtag !== 'undefined') gtag('event', 'diff_viewed');
    });

    closeDiffBtn.addEventListener('click', () => { diffModal.style.display = 'none'; });
    diffModal.addEventListener('click', (e) => { if (e.target === diffModal) diffModal.style.display = 'none'; });

    // ── Chunk Preview ──
    chunkBtn.addEventListener('click', () => {
        if (!lastOutput) return;
        const chunks = splitIntoChunks(lastOutput);
        renderChunkPreview(chunks);
        chunkModal.style.display = 'flex';
        if (typeof gtag !== 'undefined') gtag('event', 'chunk_preview_viewed', { chunk_count: chunks.length });
    });

    closeChunkBtn.addEventListener('click', () => { chunkModal.style.display = 'none'; });
    chunkModal.addEventListener('click', (e) => { if (e.target === chunkModal) chunkModal.style.display = 'none'; });

    function splitIntoChunks(text) {
        const chunks = [];
        // Split on chunk-boundary markers or H2 headings
        const parts = text.split(/(?=<!-- chunk-boundary -->)|(?=^## )/gm);
        let chunkNum = 0;

        // Handle frontmatter as its own chunk
        const fmMatch = text.match(/^(---\s*\n[\s\S]*?\n---)\s*\n?/);
        let remaining = text;
        if (fmMatch) {
            chunks.push({
                num: ++chunkNum,
                title: '📋 Frontmatter (Metadata)',
                body: fmMatch[1],
                tokens: estimateTokens(fmMatch[1]),
                anchors: [],
                hasFreshness: /last_reviewed\s*:/.test(fmMatch[1]),
                hasExpires: /expires\s*:/.test(fmMatch[1]),
                hasSource: /source\s*:/.test(fmMatch[1]),
                hasVersion: /version\s*:/.test(fmMatch[1]),
            });
            remaining = text.slice(fmMatch[0].length);
        }

        // Split remaining content by H2 headings
        const sections = remaining.split(/(?=^## )/gm).filter(s => s.trim());

        for (const section of sections) {
            const clean = section.replace(/<!-- chunk-boundary -->\s*/g, '').trim();
            if (!clean) continue;

            const headingMatch = clean.match(/^(#{2,3})\s+(.+?)(?:\s*\{#([\w-]+)\})?\s*$/m);
            const title = headingMatch ? headingMatch[2] : `Chunk ${chunkNum + 1}`;
            const anchors = (clean.match(/\{#([\w-]+)\}/g) || []).map(a => a.replace(/[{}#]/g, ''));
            const tokens = estimateTokens(clean);
            const words = clean.trim().split(/\s+/).length;

            chunks.push({
                num: ++chunkNum,
                title: title,
                body: clean,
                tokens: tokens,
                words: words,
                anchors: anchors,
                oversized: words > 500,
                undersized: words < 30 && words > 0,
                hasSummary: /> \*\*Summary:\*\*/.test(clean),
            });
        }

        return chunks;
    }

    function estimateTokens(text) {
        // Rough estimate: ~4 chars per token for English
        return Math.round(text.length / 4);
    }

    function renderChunkPreview(chunks) {
        const totalTokens = chunks.reduce((sum, c) => sum + c.tokens, 0);
        const totalAnchors = chunks.reduce((sum, c) => sum + (c.anchors ? c.anchors.length : 0), 0);
        const oversized = chunks.filter(c => c.oversized).length;
        const withSummary = chunks.filter(c => c.hasSummary).length;

        chunkStatsBar.innerHTML = `
            <span class="chunk-stat">🧩 <strong>${chunks.length}</strong> chunks</span>
            <span class="chunk-stat">📝 <strong>${totalTokens.toLocaleString()}</strong> est. tokens</span>
            <span class="chunk-stat">🔗 <strong>${totalAnchors}</strong> citation anchors</span>
            <span class="chunk-stat">📄 <strong>${withSummary}</strong> summaries</span>
            ${oversized > 0 ? `<span class="chunk-stat">⚠️ <strong>${oversized}</strong> oversized</span>` : '<span class="chunk-stat chunk-ok">✅ All chunks sized well</span>'}
        `;

        let html = '';
        for (const chunk of chunks) {
            const sizeClass = chunk.oversized ? 'chunk-warn' : chunk.undersized ? 'chunk-warn' : 'chunk-ok';
            const sizeLabel = chunk.oversized ? '⚠️ oversized' : chunk.undersized ? '⚠️ undersized' : '✅ good';
            const preview = chunk.body.substring(0, 300) + (chunk.body.length > 300 ? '...' : '');

            html += `
            <div class="chunk-card">
                <div class="chunk-card-header">
                    <span class="chunk-card-title">Chunk ${chunk.num}: ${escHtml(chunk.title)}</span>
                    <div class="chunk-card-meta">
                        <span class="chunk-tokens">~${chunk.tokens} tokens</span>
                        ${chunk.words ? `<span>${chunk.words} words</span>` : ''}
                        <span class="${sizeClass}">${sizeLabel}</span>
                        ${chunk.hasSummary ? '<span class="chunk-ok">📄 summary</span>' : ''}
                    </div>
                </div>
                <div class="chunk-card-body">${escHtml(preview)}</div>
                ${chunk.anchors && chunk.anchors.length > 0 ? `
                <div class="chunk-card-anchors">
                    ${chunk.anchors.map(a => `<span class="chunk-anchor-tag">#${a}</span>`).join('')}
                </div>` : ''}
                ${chunk.hasFreshness || chunk.hasExpires || chunk.hasSource || chunk.hasVersion ? `
                <div class="chunk-freshness-bar">
                    ${chunk.hasSource ? '<span class="fresh">📦 source</span>' : ''}
                    ${chunk.hasVersion ? '<span class="fresh">🏷️ version</span>' : ''}
                    ${chunk.hasFreshness ? '<span class="fresh">📅 last_reviewed</span>' : ''}
                    ${chunk.hasExpires ? '<span class="fresh">⏰ expires</span>' : ''}
                </div>` : ''}
                ${chunk.oversized ? '<div class="chunk-overlap-warn">⚠️ This chunk exceeds 500 words. Consider splitting into sub-sections for better retrieval.</div>' : ''}
            </div>`;
        }

        // Duplicate detection
        const chunkTexts = chunks.map(c => c.body.toLowerCase().replace(/\s+/g, ' ').trim());
        for (let i = 0; i < chunkTexts.length; i++) {
            for (let j = i + 1; j < chunkTexts.length; j++) {
                const similarity = jaccardSimilarity(chunkTexts[i], chunkTexts[j]);
                if (similarity > 0.5) {
                    html += `<div class="chunk-overlap-warn">⚠️ Chunks ${i + 1} and ${j + 1} share ${Math.round(similarity * 100)}% similar content — consider merging or deduplicating.</div>`;
                }
            }
        }

        chunkContent.innerHTML = html;
    }

    function jaccardSimilarity(a, b) {
        const setA = new Set(a.split(/\s+/));
        const setB = new Set(b.split(/\s+/));
        const intersection = [...setA].filter(x => setB.has(x)).length;
        const union = new Set([...setA, ...setB]).size;
        return union === 0 ? 0 : intersection / union;
    }

    function escHtml(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // ── Mode Toggle (Instant ↔ AI-Enhanced) ──
    const modeToggleBtn = document.getElementById('modeToggleBtn');
    const modeBadge     = document.getElementById('modeBadge');
    const modeHint      = document.getElementById('modeHint');

    function updateModeUI() {
        if (formatter.isAIMode()) {
            modeBadge.textContent = '🧠 AI-Enhanced';
            modeBadge.classList.add('ai-active');
            modeHint.textContent = 'Gemini 3.6 Flash — semantic rewriting, natural summaries, context-aware keyword bolding, intelligent restructuring · Free, no API key';
            modeToggleBtn.textContent = '⚡ Switch to Instant';
        } else {
            modeBadge.textContent = '⚡ Instant Mode';
            modeBadge.classList.remove('ai-active');
            modeHint.textContent = '7 deterministic rules: frontmatter generation, heading hierarchy, citation anchors, GEO keyword bolding, chunk boundaries, section summaries, keyword extraction · Zero latency, works offline';
            modeToggleBtn.textContent = '🧠 Switch to AI-Enhanced';
        }
    }

    modeToggleBtn.addEventListener('click', () => {
        formatter.setMode(formatter.isAIMode() ? 'instant' : 'ai');
        updateModeUI();
    });

    updateModeUI();
})();
