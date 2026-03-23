/**
 * AI Markdown/MDX Formatter
 * Optimizes Markdown and MDX for RAG retrieval and GEO discoverability
 * Supports OpenAI and Anthropic — client-side only, keys stored in localStorage
 */

class AIMarkdownFormatter {
    constructor() {
        this.apiKey = localStorage.getItem('pgmd_api_key') || '';
        this.provider = localStorage.getItem('pgmd_provider') || 'openai';
        this.model = localStorage.getItem('pgmd_model') || 'gpt-4o-mini';
    }

    saveSettings(key, provider, model) {
        this.apiKey = key;
        this.provider = provider;
        this.model = model;
        localStorage.setItem('pgmd_api_key', key);
        localStorage.setItem('pgmd_provider', provider);
        localStorage.setItem('pgmd_model', model);
    }

    isConfigured() {
        return this.apiKey && this.apiKey.trim().length > 10;
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
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
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
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `OpenAI error ${response.status}`);
        }
        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    /**
     * Format markdown using Anthropic
     */
    async formatWithAnthropic(content, options) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
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
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || `Anthropic error ${response.status}`);
        }
        const data = await response.json();
        return data.content[0].text.trim();
    }

    /**
     * Main format method — routes to correct provider
     */
    async format(content, options) {
        if (!this.isConfigured()) throw new Error('API key not configured. Add your key in the settings above.');
        if (this.provider === 'openai') return this.formatWithOpenAI(content, options);
        if (this.provider === 'anthropic') return this.formatWithAnthropic(content, options);
        throw new Error('Unknown provider: ' + this.provider);
    }
}

window.AIMarkdownFormatter = AIMarkdownFormatter;
