/**
 * AI Markdown Formatter
 * Handles API calls to OpenAI and Anthropic for Markdown/MDX optimization.
 * Runs entirely in the browser — your API key and content never leave your machine.
 */
class AIMarkdownFormatter {
    constructor() {
        this.apiKey  = localStorage.getItem('pgmd_api_key')  || '';
        this.provider = localStorage.getItem('pgmd_provider') || 'openai';
        const defaultModel = this.provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o-mini';
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
        const msg = error?.message || '';

        // Network/CORS failure — fetch throws a TypeError when the request cannot be made at all
        if (error instanceof TypeError || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror')) {
            if (provider === 'anthropic') {
                return 'Network error reaching Anthropic. Please check your API key and internet connection. If you are behind a VPN or firewall, try disabling it.';
            }
            return 'Network error reaching OpenAI. Please check your API key and internet connection. If you are behind a VPN or firewall, try disabling it.';
        }
        if (msg.includes('401') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('authentication')) {
            return `Invalid API key. Please check your ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key and try again.`;
        }
        if (msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('quota')) {
            return 'Rate limit or quota exceeded. Please wait a moment and try again, or check your API plan limits.';
        }
        if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
            return `${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} servers are temporarily unavailable. Please try again in a moment.`;
        }
        return msg || `Unknown error from ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}. Please try again.`;
    }

    /**
     * Build the system prompt based on selected optimization options
     */
    buildPrompt(options) {
        const goals = [];
        if (options.frontmatter) goals.push('- Add or enrich YAML frontmatter with title, description, tags, keywords, author, and date fields');
        if (options.structure)   goals.push('- Enforce a clear heading hierarchy (single H1, logical H2/H3 progression) for semantic chunking');
        if (options.semantic)    goals.push('- Rewrite ambiguous or vague sentences so AI models can clearly understand intent and context');
        if (options.geo)         goals.push('- Identify and emphasize key terms/phrases for Generative Engine Optimization (GEO) — make the document more likely to be cited by LLMs');
        if (options.rag)         goals.push('- Add concise section summaries as blockquotes after major sections to improve RAG chunking and retrieval accuracy');
        if (options.mdx)         goals.push('- Preserve all JSX/MDX components without modification, but add descriptive comments above each component explaining its purpose');

        return `You are an expert technical writer specializing in RAG (Retrieval-Augmented Generation) optimization and GEO (Generative Engine Optimization) for Markdown and MDX documents.

Your task is to improve the provided Markdown/MDX document according to these goals:
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
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
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
