/**
 * Poly-Glot Markdown — Dual-Mode Formatter
 * Mode 1: Instant (client-side rules) — no API key, works offline
 * Mode 2: AI-Enhanced (Google Gemini 2.0 Flash) — free API key from Google AI Studio
 * 
 * Methodology:
 * - RAG optimization based on chunking best practices from LlamaIndex, Pinecone, LangChain
 * - GEO optimization based on Aggarwal et al. 2023 "GEO: Generative Engine Optimization"
 * - Freshness metadata per Google Search Quality Evaluator Guidelines
 * - Citation anchors per Google Passage Indexing documentation
 */
class AIMarkdownFormatter {
    constructor() {
        this.geminiKey = localStorage.getItem('pgmd_gemini_key') || '';
        this.mode = this.geminiKey ? 'ai' : 'instant';
    }

    setGeminiKey(key) {
        this.geminiKey = key;
        this.mode = key ? 'ai' : 'instant';
        localStorage.setItem('pgmd_gemini_key', key);
    }

    isConfigured() { return true; } // Instant mode always works
    isAIMode() { return this.mode === 'ai' && this.geminiKey; }

    /**
     * Main format method — routes to instant or AI mode
     */
    async format(content, options) {
        if (!content || !content.trim()) throw new Error('No content to format.');

        if (this.isAIMode()) {
            try {
                return await this._formatWithGemini(content, options);
            } catch (err) {
                console.warn('Gemini failed, falling back to instant mode:', err.message);
                // Fall back to instant mode
                return this._formatInstant(content, options);
            }
        }
        return this._formatInstant(content, options);
    }

    // ══════════════════════════════════════════════════════════════════
    // AI MODE: Google Gemini 2.0 Flash (free)
    // ══════════════════════════════════════════════════════════════════
    async _formatWithGemini(content, options) {
        const prompt = this._buildPrompt(options);
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${prompt}\n\n---\n\nDocument to optimize:\n\n${content}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 8192,
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err?.error?.message || `Gemini error ${response.status}`;
            if (response.status === 400 && msg.includes('API_KEY')) {
                throw new Error('Invalid Gemini API key. Get a free key at https://aistudio.google.com/apikeys');
            }
            if (response.status === 429) {
                throw new Error('Rate limit reached. Gemini free tier: 15 requests/minute. Wait and retry.');
            }
            throw new Error(msg);
        }

        const data = await response.json();
        let result = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Strip markdown code fences if Gemini wrapped the output
        result = result.replace(/^```(?:markdown|md|mdx)?\s*\n/i, '').replace(/\n```\s*$/, '');
        
        return result.trim();
    }

    _buildPrompt(options) {
        const goals = [];
        if (options.frontmatter) goals.push('- Add or enrich YAML frontmatter: title, description, tags, keywords, author, date, last_reviewed (today), expires (90 days from today), source, version');
        if (options.structure)   goals.push('- Enforce clear heading hierarchy: single H1, logical H2/H3 progression. Fix heading jumps.');
        if (options.semantic)    goals.push('- Rewrite vague or ambiguous sentences for clarity. Convert run-on text into structured paragraphs. Add blank lines between sections.');
        if (options.geo)         goals.push('- Bold the 3-5 most important keyword phrases per section using **keyword** syntax. These should be terms an AI search engine would use to cite this document.');
        if (options.rag)         goals.push('- Add `> **Summary:** ...` blockquote after each H2 section. Add `<!-- chunk-boundary -->` between major sections. Add anchor IDs to H2/H3 headings using `{#section-slug}` syntax.');
        if (options.mdx)         goals.push('- Preserve all JSX/MDX components. Add descriptive comments above each component.');

        return `You are an expert technical writer optimizing documents for RAG (Retrieval-Augmented Generation) and GEO (Generative Engine Optimization).

Optimize this document according to these goals:
${goals.join('\n')}

Rules:
- Return ONLY the improved Markdown/MDX. No explanations, no wrapping code fences.
- Preserve all existing content — improve structure and clarity, do not remove information.
- For frontmatter: enrich if exists, add if missing. Always include last_reviewed and expires.
- For RAG: each H2 section gets a summary blockquote and chunk-boundary marker.
- For GEO: bold key phrases that AI search engines would match on.
- For headings: add {#slug} anchor IDs for citation targeting.
- Keep chunk sizes between 100-500 words per section (split if oversized).
- Maintain the author's voice and tone.`;
    }

    // ══════════════════════════════════════════════════════════════════
    // INSTANT MODE: Client-side rule engine (no API needed)
    // ══════════════════════════════════════════════════════════════════
    _formatInstant(content, options) {
        let result = content.trim();
        if (options.frontmatter) result = this._addFrontmatter(result);
        if (options.structure)   result = this._fixStructure(result);
        if (options.semantic)    result = this._improveSemantic(result);
        if (options.geo)         result = this._addGEOKeywords(result);
        if (options.rag)         result = this._addRAGChunking(result);
        return result;
    }

    // ── Frontmatter ──────────────────────────────────────────────────
    _addFrontmatter(text) {
        const hasFM = /^---\s*\n[\s\S]*?\n---/m.test(text);
        const today = new Date().toISOString().split('T')[0];
        const expires = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

        if (hasFM) {
            let fm = text.match(/^---\s*\n([\s\S]*?)\n---/m)[1];
            const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
            if (!/description\s*:/i.test(fm)) {
                const firstPara = body.split('\n').find(l => l.trim().length > 20 && !l.startsWith('#'));
                if (firstPara) fm += `\ndescription: "${firstPara.trim().substring(0, 160)}"`;
            }
            if (!/tags\s*:/i.test(fm))     { const kw = this._extractKeywords(body); fm += `\ntags: [${kw.slice(0, 5).join(', ')}]`; }
            if (!/keywords\s*:/i.test(fm)) { const kw = this._extractKeywords(body); fm += `\nkeywords: [${kw.slice(0, 8).join(', ')}]`; }
            if (!/date\s*:/i.test(fm))           fm += `\ndate: ${today}`;
            if (!/last_reviewed\s*:/i.test(fm))  fm += `\nlast_reviewed: ${today}`;
            if (!/expires\s*:/i.test(fm))        fm += `\nexpires: ${expires}`;
            if (!/source\s*:/i.test(fm))         fm += `\nsource: ""`;
            if (!/version\s*:/i.test(fm))        fm += `\nversion: "1.0"`;
            return `---\n${fm}\n---\n\n${body}`;
        }

        const title = this._extractTitle(text) || 'Untitled Document';
        const firstPara = text.split('\n').find(l => l.trim().length > 20 && !l.startsWith('#'));
        const desc = firstPara ? firstPara.trim().substring(0, 160) : title;
        const keywords = this._extractKeywords(text);
        return `---\ntitle: "${title}"\ndescription: "${desc}"\ntags: [${keywords.slice(0, 5).join(', ')}]\nkeywords: [${keywords.slice(0, 8).join(', ')}]\nauthor: ""\ndate: ${today}\nlast_reviewed: ${today}\nexpires: ${expires}\nsource: ""\nversion: "1.0"\n---\n\n${text}`;
    }

    // ── Structure ────────────────────────────────────────────────────
    _fixStructure(text) {
        const lines = text.split('\n');
        const result = [];
        let hasH1 = false, lastLevel = 0;
        for (const line of lines) {
            const m = line.match(/^(#{1,6})\s+(.+)/);
            if (m) {
                let level = m[1].length;
                if (level === 1) { if (hasH1) level = 2; else hasH1 = true; }
                if (lastLevel > 0 && level > lastLevel + 1) level = lastLevel + 1;
                lastLevel = level;
                result.push(`${'#'.repeat(level)} ${m[2]}`);
            } else { result.push(line); }
        }
        if (!hasH1) { const t = this._extractTitle(text) || 'Document'; result.unshift(`# ${t}\n`); }
        return result.join('\n');
    }

    // ── Semantic Clarity ─────────────────────────────────────────────
    _improveSemantic(text) {
        let r = text;
        r = r.replace(/\b(action items|todo|tasks|steps|requirements)\s*:?\s*\n((?:[-*]\s+.+\n?)+)/gi,
            (m, label, items) => `## ${label.charAt(0).toUpperCase() + label.slice(1)}\n\n${items}`);
        r = r.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
        r = r.replace(/(#{1,6}\s.+)\n([^#\n])/g, '$1\n\n$2');
        return r;
    }

    // ── GEO Keywords ─────────────────────────────────────────────────
    _addGEOKeywords(text) {
        const keywords = this._extractKeywords(text);
        let r = text;
        for (const kw of keywords.slice(0, 5)) {
            const regex = new RegExp(`(?<!\\*\\*)(?<!# )\\b(${this._escapeRegex(kw)})\\b(?!\\*\\*)`, 'i');
            r = r.replace(regex, '**$1**');
        }
        return r;
    }

    // ── RAG Chunking ─────────────────────────────────────────────────
    _addRAGChunking(text) {
        const lines = text.split('\n');
        const result = [];
        let section = [], heading = '', inFM = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (i === 0 && line.trim() === '---') { inFM = true; result.push(line); continue; }
            if (inFM) { result.push(line); if (line.trim() === '---') inFM = false; continue; }
            const h2 = line.match(/^##\s+(.+)/), h3 = line.match(/^###\s+(.+)/);
            if (h2 || h3) {
                if (section.length > 0 && heading) {
                    const t = section.join('\n').trim();
                    if (t.length > 30) result.push('', `> **Summary:** ${this._summarize(t, heading)}`);
                }
                if (heading) result.push('', '<!-- chunk-boundary -->');
                const txt = h2 ? h2[1] : h3[1], slug = this._slugify(txt), pfx = h2 ? '##' : '###';
                result.push(/\{#[\w-]+\}/.test(txt) ? line : `${pfx} ${txt} {#${slug}}`);
                heading = txt; section = [];
            } else { if (heading) section.push(line); result.push(line); }
        }
        if (section.length > 0 && heading) {
            const t = section.join('\n').trim();
            if (t.length > 30) result.push('', `> **Summary:** ${this._summarize(t, heading)}`);
        }
        return result.join('\n');
    }

    // ── Helpers ───────────────────────────────────────────────────────
    _extractTitle(text) {
        const h1 = text.match(/^#\s+(.+)/m);
        if (h1) return h1[1].trim();
        const fl = text.split('\n').find(l => l.trim().length > 3);
        return fl ? fl.trim().substring(0, 60) : null;
    }

    _extractKeywords(text) {
        const clean = text.replace(/^---[\s\S]*?---/m, '').replace(/^#{1,6}\s.+/gm, '');
        const words = clean.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const stop = new Set(['the','and','for','are','but','not','you','all','can','had','was','one','our','out','has',
            'been','have','this','that','with','they','from','will','would','could','should','about','which','their','there',
            'what','when','where','also','some','them','than','then','into','just','more','other','were','being','does','each',
            'make','like','very','most','over','such','after','only','before','because','between','through','during','without',
            'again','further','once','here','both','those','these','done','said','need','probably','something','mentioned',
            'talked','going','might','still','keep','look','tell','things','stuff','pretty','good','last','next','first']);
        const freq = {};
        words.forEach(w => { if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1; });
        const bigrams = [];
        for (let i = 0; i < words.length - 1; i++) {
            if (!stop.has(words[i]) && !stop.has(words[i+1])) bigrams.push(`${words[i]} ${words[i+1]}`);
        }
        const bf = {};
        bigrams.forEach(b => { bf[b] = (bf[b] || 0) + 1; });
        const all = [...Object.entries(bf).filter(([,c]) => c >= 1).map(([w,c]) => [w, c*2]),
                     ...Object.entries(freq).filter(([,c]) => c >= 2)];
        all.sort((a, b) => b[1] - a[1]);
        return all.slice(0, 10).map(([w]) => w);
    }

    _summarize(text, heading) {
        const sentences = text.split(/[.!?]\s+/);
        const m = sentences.find(s => s.trim().length > 15 && !s.trim().startsWith('>') && !s.trim().startsWith('-'));
        if (m) { const c = m.trim().replace(/\*\*/g, '').substring(0, 120); return c.endsWith('.') ? c : c + '.'; }
        const items = text.match(/^[-*]\s+(.+)/gm);
        if (items && items.length > 0) return `${heading}: ${items.slice(0, 3).map(i => i.replace(/^[-*]\s+/, '')).join('; ')}.`;
        return `${heading} section content.`;
    }

    _slugify(t) { return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 50); }
    _escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
}

window.AIMarkdownFormatter = AIMarkdownFormatter;
