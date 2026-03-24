/**
 * Poly-Glot Markdown — App Controller
 * Handles UI interactions, file upload, formatting, diff view, copy/download
 */

(function () {
    const formatter = new AIMarkdownFormatter();

    // ── DOM refs ──
    const providerSelect  = document.getElementById('providerSelect');
    const modelSelect     = document.getElementById('modelSelect');
    const apiKeyInput     = document.getElementById('apiKeyInput');
    const saveKeyBtn      = document.getElementById('saveKeyBtn');
    const toggleKeyBtn    = document.getElementById('toggleKeyBtn');
    const keyStatus       = document.getElementById('keyStatus');
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
    const loadingOverlay  = document.getElementById('loadingOverlay');
    const diffModal       = document.getElementById('diffModal');
    const diffContent     = document.getElementById('diffContent');
    const closeDiffBtn    = document.getElementById('closeDiffBtn');
    const impBadges       = document.getElementById('improvementBadges');

    let lastOutput = '';
    let lastFilename = 'optimized.md';

    // ── Init settings from localStorage ──
    function initSettings() {
        providerSelect.value = formatter.provider;
        apiKeyInput.value    = formatter.apiKey;
        updateModelOptions();
        modelSelect.value    = formatter.model;
        if (formatter.isConfigured()) {
            keyStatus.textContent = '✅ API key loaded from local storage';
            keyStatus.className   = 'key-status ok';
        }
    }

    function updateModelOptions() {
        const openaiModels    = ['gpt-4o-mini', 'gpt-4o'];
        const anthropicModels = ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'];
        const models = providerSelect.value === 'openai' ? openaiModels : anthropicModels;
        modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
    }

    providerSelect.addEventListener('change', updateModelOptions);

    saveKeyBtn.addEventListener('click', () => {
        const key      = apiKeyInput.value.trim();
        const provider = providerSelect.value;
        const model    = modelSelect.value;
        if (!key) { keyStatus.textContent = '❌ Please enter an API key'; keyStatus.className = 'key-status err'; return; }
        formatter.saveSettings(key, provider, model);
        keyStatus.textContent = '✅ Settings saved';
        keyStatus.className   = 'key-status ok';
        gtag('event', 'api_key_saved', { provider, model });
    });

    toggleKeyBtn.addEventListener('click', () => {
        apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    });

    // ── File Upload ──
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        lastFilename = file.name.replace(/(\.md|\.mdx)$/, '') + '-optimized' + (file.name.endsWith('.mdx') ? '.mdx' : '.md');
        const reader = new FileReader();
        reader.onload = (ev) => { inputEditor.value = ev.target.result; updateInputStats(); };
        reader.readAsText(file);
        fileUpload.value = '';
        gtag('event', 'file_uploaded', { file_type: file.name.endsWith('.mdx') ? 'mdx' : 'md', file_size: file.size });
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
        if (!formatter.isConfigured()) { alert('Please save your API key in the settings above first.'); return; }

        loadingOverlay.style.display = 'flex';
        formatBtn.disabled = true;

        try {
            const options = getOptions();
            const result  = await formatter.format(input, options);
            lastOutput    = result;

            outputArea.textContent = result;

            // Stats
            const sIn  = countStats(input);
            const sOut = countStats(result);
            outputStats.textContent = `${sOut.words} words · ${sOut.lines} lines · ${sOut.chars} chars`;

            // Improvement badges
            const badges = [];
            if (options.frontmatter) badges.push('✅ Frontmatter');
            if (options.structure)   badges.push('✅ Structure');
            if (options.semantic)    badges.push('✅ Semantic Clarity');
            if (options.geo)         badges.push('✅ GEO');
            if (options.rag)         badges.push('✅ RAG Chunks');
            if (options.mdx)         badges.push('✅ MDX');
            impBadges.innerHTML = badges.map(b => `<span class="imp-badge">${b}</span>`).join('');

            copyBtn.disabled        = false;
            downloadBtn.disabled    = false;
            diffBtn.disabled        = false;
            scoreOutputBtn.disabled = false;

            // GA4: track successful format
            gtag('event', 'format_success', {
                provider:        formatter.provider,
                model:           formatter.model,
                input_words:     sIn.words,
                output_words:    sOut.words,
                opt_frontmatter: options.frontmatter,
                opt_structure:   options.structure,
                opt_semantic:    options.semantic,
                opt_geo:         options.geo,
                opt_rag:         options.rag,
                opt_mdx:         options.mdx,
            });
        } catch (err) {
            outputArea.textContent = '❌ Error: ' + err.message;
            gtag('event', 'format_error', { provider: formatter.provider, model: formatter.model, error: err.message });
        } finally {
            loadingOverlay.style.display = 'none';
            formatBtn.disabled = false;
        }
    });

    // ── Score Input ──
    const scoreInputBtn  = document.getElementById('scoreInputBtn');
    const scoreOutputBtn = document.getElementById('scoreOutputBtn');

    scoreInputBtn.addEventListener('click', () => {
        const input = inputEditor.value.trim();
        if (!input) { alert('Paste or upload a Markdown file first.'); return; }
        PolyGlotScorer.show(input, lastOutput || null, false);
        if (typeof gtag !== 'undefined') gtag('event', 'score_input_clicked');
    });

    scoreOutputBtn.addEventListener('click', () => {
        const input = inputEditor.value.trim();
        PolyGlotScorer.show(input || null, lastOutput, false);
        if (typeof gtag !== 'undefined') gtag('event', 'score_output_clicked');
    });

    // ── Copy ──
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(lastOutput).then(() => {
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
            gtag('event', 'output_copied');
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
        gtag('event', 'output_downloaded', { filename: lastFilename });
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
        gtag('event', 'diff_viewed');
    });

    closeDiffBtn.addEventListener('click', () => { diffModal.style.display = 'none'; });
    diffModal.addEventListener('click', (e) => { if (e.target === diffModal) diffModal.style.display = 'none'; });

    function escHtml(str) {
        return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    initSettings();
})();

