/**
 * AI Markdown Formatter
 * Handles API calls to OpenAI and Anthropic for Markdown/MDX optimization.
 * Runs entirely in the browser — your API key and content never leave your machine.
 */
class AIMarkdownFormatter {
    constructor() {
        this.apiKey  = localStorage.getItem('pgmd_api_key')  || '';
        this.provider = localStorage.getItem('pgmd_provider') || 'openai';
        const defaultModel = this.provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1-mini';
        this.model   = localStorage.getItem('pgmd_model')    || defaultModel;
    }

    saveSettings(key, provider, model) {
        this.apiKey   = key;
        this.provider = provider;
        this.model    = model;
        localStorage.setItem('pgmd_api_key',  key);
        localStorage.setItem('pgmd_provider', provider);
        localStorage.setItem('pgmd_model',    model);
    }

    isConfigured() {
        return this.apiKey && this.apiKey.trim().length > 10;
    }

    /**
     * Parse API error response and return a clear human-readable message.
     */
    _parseError(error, provider) {
        const msg = error?.message || String(error);

        // Network/CORS failure — fetch throws a TypeError when the request cannot be made at all
        if (error instanceof TypeError || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
            return provider === 'anthropic'
                ? 'Cannot reach Anthropic API from the browser. Please use an OpenAI key instead, or run the formatter from a local server.'
                : 'Network error — check your internet connection and try again.';
        }

        return msg || 'An unexpected error occurred.';
    }

    /**
     * Build the system prompt based on selected optimization options.
     */
    buildPrompt(options = {}) {
        const goals = ['- Fix Markdown formatting, heading hierarchy, and list consistency'];

        if (options.rag)       goals.push('- Add blockquote summaries (> **Summary:** ...) after each H2 for RAG chunking');
        if (options.frontmatter) goals.push('- Add or enrich YAML frontmatter (title, description, tags, date) at the top');
        if (options.semantic)    goals.push('- Rewrite ambiguous or vague sentences so AI models can clearly understand intent and context');
        if (options.geo)         goals.push('- Bold 3-5 key keyword phrases per section using **keyword** syntax for GEO discoverability');
        if (options.links)       goals.push('- Ensure all links have descriptive anchor text (no "click here" or bare URLs)');
        if (options.tables)      goals.push('- Format any data as proper Markdown tables where appropriate');
        if (options.codeBlocks)  goals.push('- Add language identifiers to all fenced code blocks');

        return `You are an expert technical writer and Markdown/MDX specialist. Your job is to optimize documents for both human readers and AI systems (RAG pipelines, LLMs, GEO).

Optimization goals:
${goals.join('\n')}

Rules:
- Return ONLY the improved Markdown/MDX. No explanations, no code fences wrapping the entire output.
- Preserve all existing content — do not remove information, only improve structure and clarity.
- If the file is MDX, preserve all JSX imports and component usage.
- For RAG chunking: add a blockquote summary like \`> **Summary:** ...\` after each major H2 section.
- For GEO: bold the 3-5 most important keyword phrases per section using **keyword** syntax.
- For frontmatter: if frontmatter already exists, enrich it. If not, add it at the top.
- Maintain the author's voice and tone throughout.`;
    }

    /**
     * Format markdown using OpenAI
     */
    async formatWithOpenAI(content, options) {
        let response;
        try {
            response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: this.buildPrompt(options) },
                        { role: 'user', content: `Please optimize this Markdown/MDX document:\n\n${content}` }
                    ],
                    temperature: 0.3,
                    max_tokens: 4096
                })
            });
        } catch (networkErr) {
            throw new Error(this._parseError(networkErr, 'openai'));
        }

        if (!response.ok) {
            let errBody = {};
            try { errBody = await response.json(); } catch (_) {}
            throw new Error(errBody.error?.message || `OpenAI error ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    /**
     * Format markdown using Anthropic
     */
    async formatWithAnthropic(content, options) {
        let response;
        try {
            response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 4096,
                    system: this.buildPrompt(options),
                    messages: [{ role: 'user', content: `Please optimize this Markdown/MDX document:\n\n${content}` }]
                })
            });
        } catch (networkErr) {
            throw new Error(this._parseError(networkErr, 'anthropic'));
        }

        if (!response.ok) {
            let errBody = {};
            try { errBody = await response.json(); } catch (_) {}
            throw new Error(errBody.error?.message || `Anthropic error ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text.trim();
    }

    /**
     * Main format method — routes to correct provider
     */
    async format(content, options) {
        if (!this.isConfigured()) {
            throw new Error('API key not configured. Add your key in the settings above.');
        }
        try {
            if (this.provider === 'openai')    return await this.formatWithOpenAI(content, options);
            if (this.provider === 'anthropic') return await this.formatWithAnthropic(content, options);
            throw new Error('Unknown provider: ' + this.provider);
        } catch (error) {
            throw new Error(this._parseError(error, this.provider));
        }
    }
}

window.AIMarkdownFormatter = AIMarkdownFormatter;
