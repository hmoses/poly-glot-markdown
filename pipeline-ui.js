/**
 * Poly-Glot Markdown — Pipeline UI Controller
 * Wires the Pipeline tab: Embed, Search, Ask
 */
(function () {
    // ── Tab switching ──
    const tabFormat   = document.getElementById('tabFormat');
    const tabPipeline = document.getElementById('tabPipeline');
    const viewFormat  = document.getElementById('viewFormat');
    const viewPipeline= document.getElementById('viewPipeline');

    if (!tabFormat || !tabPipeline) return; // guard

    tabFormat.addEventListener('click', () => {
        tabFormat.classList.add('tab-active');
        tabPipeline.classList.remove('tab-active');
        viewFormat.style.display = '';
        viewPipeline.style.display = 'none';
    });

    tabPipeline.addEventListener('click', () => {
        tabPipeline.classList.add('tab-active');
        tabFormat.classList.remove('tab-active');
        viewPipeline.style.display = '';
        viewFormat.style.display = 'none';
    });

    // ── Pipeline DOM refs ──
    const loadModelBtn   = document.getElementById('plLoadModel');
    const modelStatus    = document.getElementById('plModelStatus');
    const embedInput     = document.getElementById('plEmbedInput');
    const embedFileBtn   = document.getElementById('plEmbedFile');
    const embedFileInput = document.getElementById('plEmbedFileInput');
    const embedBtn       = document.getElementById('plEmbedBtn');
    const embedStatus    = document.getElementById('plEmbedStatus');
    const storeStatus    = document.getElementById('plStoreStatus');
    const clearStoreBtn  = document.getElementById('plClearStore');
    const searchInput    = document.getElementById('plSearchInput');
    const searchBtn      = document.getElementById('plSearchBtn');
    const searchResults  = document.getElementById('plSearchResults');
    const askInput       = document.getElementById('plAskInput');
    const askBtn         = document.getElementById('plAskBtn');
    const askAnswer      = document.getElementById('plAskAnswer');
    const askSources     = document.getElementById('plAskSources');

    // ── Helpers ──
    function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    async function refreshStoreCount() {
        try {
            const count = await Pipeline.getChunkCount();
            storeStatus.innerHTML = count > 0
                ? `<span class="pl-store-count">🗄️ <strong>${count}</strong> chunks stored</span>`
                : `<span class="pl-store-empty">No chunks stored yet</span>`;
            // Enable/disable search & ask
            searchBtn.disabled = count === 0;
            askBtn.disabled    = count === 0;
        } catch(e) {
            storeStatus.innerHTML = '<span class="pl-store-empty">Store not initialized</span>';
        }
    }

    // ── Load Model ──
    loadModelBtn.addEventListener('click', async () => {
        loadModelBtn.disabled = true;
        modelStatus.className = 'pl-status pl-status-loading';
        modelStatus.textContent = 'Initializing…';
        try {
            await Pipeline.loadModel((msg) => {
                modelStatus.textContent = msg;
            });
            modelStatus.className = 'pl-status pl-status-ok';
            modelStatus.textContent = 'all-MiniLM-L6-v2 ready ✅';
            embedBtn.disabled = false;
            loadModelBtn.textContent = '✅ Model Loaded';
        } catch (err) {
            modelStatus.className = 'pl-status pl-status-err';
            modelStatus.textContent = '❌ ' + err.message;
            loadModelBtn.disabled = false;
        }
    });

    // ── File upload for embed ──
    embedFileBtn.addEventListener('click', () => embedFileInput.click());
    embedFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { embedInput.value = ev.target.result; };
        reader.readAsText(file);
        embedFileInput.value = '';
    });

    // ── Embed ──
    embedBtn.addEventListener('click', async () => {
        const text = embedInput.value.trim();
        if (!text) { embedStatus.textContent = 'Paste or upload content first.'; return; }
        if (!Pipeline.isModelReady()) { embedStatus.textContent = 'Load the model first.'; return; }

        embedBtn.disabled = true;
        embedStatus.className = 'pl-status pl-status-loading';
        const docId = 'doc_' + Date.now();

        try {
            const count = await Pipeline.embedDocument(text, docId, (msg) => {
                embedStatus.textContent = msg;
            });
            embedStatus.className = 'pl-status pl-status-ok';
            embedStatus.textContent = `✅ Embedded ${count} chunks`;
            await refreshStoreCount();
        } catch (err) {
            embedStatus.className = 'pl-status pl-status-err';
            embedStatus.textContent = '❌ ' + err.message;
        } finally {
            embedBtn.disabled = false;
        }
    });

    // ── Clear Store ──
    clearStoreBtn.addEventListener('click', async () => {
        if (!confirm('Clear all stored vectors?')) return;
        await Pipeline.clearStore();
        await refreshStoreCount();
        searchResults.innerHTML = '';
        askAnswer.innerHTML = '';
        askSources.innerHTML = '';
    });

    // ── Search ──
    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value.trim();
        if (!query) return;
        searchBtn.disabled = true;
        searchResults.innerHTML = '<div class="pl-loading-msg">Searching…</div>';

        try {
            const results = await Pipeline.search(query);
            if (results.length === 0) {
                searchResults.innerHTML = '<div class="pl-empty-msg">No results found.</div>';
            } else {
                searchResults.innerHTML = results.map((r, i) => `
                    <div class="pl-result-card">
                        <div class="pl-result-header">
                            <span class="pl-result-rank">#${i+1}</span>
                            <span class="pl-result-title">${esc(r.title)}</span>
                            <span class="pl-result-score">${(r.score * 100).toFixed(1)}%</span>
                        </div>
                        <div class="pl-result-body">${esc(r.body.substring(0, 250))}${r.body.length > 250 ? '…' : ''}</div>
                        <div class="pl-result-meta">${r.words || '?'} words · ${r.type || 'section'}</div>
                    </div>
                `).join('');
            }
        } catch (err) {
            searchResults.innerHTML = `<div class="pl-error-msg">❌ ${esc(err.message)}</div>`;
        } finally {
            searchBtn.disabled = false;
        }
    });

    // Enter key for search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });

    // ── Ask ──
    askBtn.addEventListener('click', async () => {
        const question = askInput.value.trim();
        if (!question) return;
        askBtn.disabled = true;
        askAnswer.innerHTML = '<div class="pl-loading-msg">Retrieving & generating answer…</div>';
        askSources.innerHTML = '';

        try {
            const result = await Pipeline.ask(question);
            // Render answer (basic markdown-ish: bold, newlines)
            let html = esc(result.answer)
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
            askAnswer.innerHTML = `<div class="pl-answer-text">${html}</div>`;

            if (result.sources && result.sources.length > 0) {
                askSources.innerHTML = '<div class="pl-sources-title">📚 Sources Used</div>' +
                    result.sources.map((s, i) => `
                        <div class="pl-source-pill">
                            <span class="pl-source-num">${i+1}</span>
                            <span class="pl-source-name">${esc(s.title)}</span>
                            <span class="pl-source-score">${(s.score * 100).toFixed(1)}%</span>
                        </div>
                    `).join('');
            }
        } catch (err) {
            askAnswer.innerHTML = `<div class="pl-error-msg">❌ ${esc(err.message)}</div>`;
        } finally {
            askBtn.disabled = false;
        }
    });

    // Enter key for ask
    askInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') askBtn.click();
    });

    // ── Use formatted output as pipeline input ──
    const useOutputBtn = document.getElementById('plUseOutput');
    if (useOutputBtn) {
        useOutputBtn.addEventListener('click', () => {
            const outputArea = document.getElementById('outputArea');
            if (outputArea && outputArea.textContent && !outputArea.querySelector('.output-placeholder')) {
                embedInput.value = outputArea.textContent;
                embedStatus.textContent = 'Output loaded. Click Embed to vectorize.';
            } else {
                embedStatus.textContent = 'No formatted output yet. Format a document first.';
            }
        });
    }

    // ── Init ──
    refreshStoreCount();
})();
