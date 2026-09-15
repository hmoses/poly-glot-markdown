/**
 * AI Markdown Formatter — Client-Side Rule-Based Engine
 * Transforms Markdown/MDX for RAG & GEO optimization.
 * Runs entirely in the browser — no API keys, no network calls.
 */
class AIMarkdownFormatter {
    constructor() {}

    isConfigured() { return true; } // Always ready — no API needed

    /**
     * Main format method — pure client-side transformation
     */
    async format(content, options) {
        if (!content || !content.trim()) throw new Error('No content to format.');
        let result = content.trim();

        // 1. Frontmatter
        if (options.frontmatter) result = this._addFrontmatter(result);

        // 2. Structure — heading hierarchy
        if (options.structure) result = this._fixStructure(result);

        // 3. Semantic clarity
        if (options.semantic) result = this._improveSemantic(result);

        // 4. GEO keywords
        if (options.geo) result = this._addGEOKeywords(result);

        // 5. RAG chunking — summaries, boundaries, anchors
        if (options.rag) result = this._addRAGChunking(result);

        // 6. MDX preservation (no-op — we never break MDX)
        return result;
    }

    // ── Frontmatter ──────────────────────────────────────────────────
    _addFrontmatter(text) {
        const hasFM = /^---\s*\n[\s\S]*?\n---/m.test(text);
        const today = new Date().toISOString().split('T')[0];
        const expires = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];

        if (hasFM) {
            // Enrich existing frontmatter
            let fm = text.match(/^---\s*\n([\s\S]*?)\n---/m)[1];
            const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
            if (!/description\s*:/i.test(fm)) {
                const firstPara = body.split('\n').find(l => l.trim().length > 20 && !l.startsWith('#'));
                if (firstPara) fm += `\ndescription: "${firstPara.trim().substring(0, 160)}"`;
            }
            if (!/tags\s*:/i.test(fm)) {
                const keywords = this._extractKeywords(body);
                fm += `\ntags: [${keywords.slice(0, 5).join(', ')}]`;
            }
            if (!/keywords\s*:/i.test(fm)) {
                const keywords = this._extractKeywords(body);
                fm += `\nkeywords: [${keywords.slice(0, 8).join(', ')}]`;
            }
            if (!/date\s*:/i.test(fm)) fm += `\ndate: ${today}`;
            if (!/last_reviewed\s*:/i.test(fm)) fm += `\nlast_reviewed: ${today}`;
            if (!/expires\s*:/i.test(fm)) fm += `\nexpires: ${expires}`;
            if (!/source\s*:/i.test(fm)) fm += `\nsource: ""`;
            if (!/version\s*:/i.test(fm)) fm += `\nversion: "1.0"`;
            return `---\n${fm}\n---\n\n${body}`;
        }

        // Generate new frontmatter
        const title = this._extractTitle(text) || 'Untitled Document';
        const firstPara = text.split('\n').find(l => l.trim().length > 20 && !l.startsWith('#'));
        const desc = firstPara ? firstPara.trim().substring(0, 160) : title;
        const keywords = this._extractKeywords(text);

        const fm = `---
title: "${title}"
description: "${desc}"
tags: [${keywords.slice(0, 5).join(', ')}]
keywords: [${keywords.slice(0, 8).join(', ')}]
author: ""
date: ${today}
last_reviewed: ${today}
expires: ${expires}
source: ""
version: "1.0"
---`;
        return `${fm}\n\n${text}`;
    }

    // ── Structure ────────────────────────────────────────────────────
    _fixStructure(text) {
        const lines = text.split('\n');
        const result = [];
        let hasH1 = false;
        let lastHeadingLevel = 0;

        for (const line of lines) {
            const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
                let level = headingMatch[1].length;
                const content = headingMatch[2];

                // Ensure single H1
                if (level === 1) {
                    if (hasH1) { level = 2; }
                    else { hasH1 = true; }
                }

                // Fix heading jumps (e.g., H1 → H4 becomes H1 → H2)
                if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
                    level = lastHeadingLevel + 1;
                }
                lastHeadingLevel = level;
                result.push(`${'#'.repeat(level)} ${content}`);
            } else {
                result.push(line);
            }
        }

        // If no H1, promote first heading or add one
        if (!hasH1) {
            const title = this._extractTitle(text) || 'Document';
            result.unshift(`# ${title}\n`);
        }

        return result.join('\n');
    }

    // ── Semantic Clarity ─────────────────────────────────────────────
    _improveSemantic(text) {
        let result = text;

        // Convert unstructured paragraphs into proper lists where pattern detected
        // "action items:" followed by dash items — already good
        // Bare paragraphs with comma-separated items → bullet list
        result = result.replace(/\b(action items|todo|tasks|steps|requirements)\s*:?\s*\n((?:[-*]\s+.+\n?)+)/gi,
            (match, label, items) => `## ${label.charAt(0).toUpperCase() + label.slice(1)}\n\n${items}`);

        // Add blank lines before headings if missing
        result = result.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

        // Add blank lines after headings if missing
        result = result.replace(/(#{1,6}\s.+)\n([^#\n])/g, '$1\n\n$2');

        return result;
    }

    // ── GEO Keywords ─────────────────────────────────────────────────
    _addGEOKeywords(text) {
        const keywords = this._extractKeywords(text);
        let result = text;

        // Bold the top keywords in the text (only first occurrence of each)
        for (const kw of keywords.slice(0, 5)) {
            // Don't bold if already bold, in heading, or in frontmatter
            const regex = new RegExp(`(?<!\\*\\*)(?<!# )(?<!^---[\\s\\S]*?)\\b(${this._escapeRegex(kw)})\\b(?!\\*\\*)`, 'i');
            result = result.replace(regex, '**$1**');
        }

        return result;
    }

    // ── RAG Chunking ─────────────────────────────────────────────────
    _addRAGChunking(text) {
        const lines = text.split('\n');
        const result = [];
        let currentSection = [];
        let currentHeading = '';
        let inFrontmatter = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Track frontmatter
            if (i === 0 && line.trim() === '---') { inFrontmatter = true; result.push(line); continue; }
            if (inFrontmatter) {
                result.push(line);
                if (line.trim() === '---') inFrontmatter = false;
                continue;
            }

            const h2Match = line.match(/^##\s+(.+)/);
            const h3Match = line.match(/^###\s+(.+)/);

            if (h2Match || h3Match) {
                // Flush previous section with summary
                if (currentSection.length > 0 && currentHeading) {
                    const sectionText = currentSection.join('\n').trim();
                    if (sectionText.length > 30) {
                        const summary = this._summarizeSection(sectionText, currentHeading);
                        result.push('');
                        result.push(`> **Summary:** ${summary}`);
                    }
                }

                // Add chunk boundary before new section
                if (currentHeading) {
                    result.push('');
                    result.push('<!-- chunk-boundary -->');
                }

                // Add anchor ID to heading
                const headingText = h2Match ? h2Match[1] : h3Match[1];
                const slug = this._slugify(headingText);
                const prefix = h2Match ? '##' : '###';

                // Don't add anchor if already has one
                if (/\{#[\w-]+\}/.test(headingText)) {
                    result.push(line);
                } else {
                    result.push(`${prefix} ${headingText} {#${slug}}`);
                }

                currentHeading = headingText;
                currentSection = [];
            } else {
                if (currentHeading) currentSection.push(line);
                result.push(line);
            }
        }

        // Final section summary
        if (currentSection.length > 0 && currentHeading) {
            const sectionText = currentSection.join('\n').trim();
            if (sectionText.length > 30) {
                const summary = this._summarizeSection(sectionText, currentHeading);
                result.push('');
                result.push(`> **Summary:** ${summary}`);
            }
        }

        return result.join('\n');
    }

    // ── Helpers ───────────────────────────────────────────────────────
    _extractTitle(text) {
        const h1 = text.match(/^#\s+(.+)/m);
        if (h1) return h1[1].trim();
        const firstLine = text.split('\n').find(l => l.trim().length > 3);
        return firstLine ? firstLine.trim().substring(0, 60) : null;
    }

    _extractKeywords(text) {
        // Remove frontmatter and headings
        const clean = text.replace(/^---[\s\S]*?---/m, '').replace(/^#{1,6}\s.+/gm, '');
        const words = clean.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const stopwords = new Set(['the','and','for','are','but','not','you','all','can','had','her','was','one','our','out','has',
            'been','have','this','that','with','they','from','will','would','could','should','about','which','their','there',
            'what','when','where','also','some','them','than','then','into','just','more','other','were','being','does','each',
            'make','like','very','most','over','such','after','only','before','because','between','through','during','without',
            'again','further','once','here','both','those','these','done','said','need','probably','something','mentioned',
            'talked','going','might','still','keep','look','tell','things','stuff','pretty','good','last','next','first']);
        const freq = {};
        words.forEach(w => { if (!stopwords.has(w) && w.length > 3) freq[w] = (freq[w] || 0) + 1; });

        // Also extract multi-word phrases (bigrams)
        const bigrams = [];
        for (let i = 0; i < words.length - 1; i++) {
            if (!stopwords.has(words[i]) && !stopwords.has(words[i+1]) && words[i].length > 3 && words[i+1].length > 3) {
                bigrams.push(`${words[i]} ${words[i+1]}`);
            }
        }
        const bigramFreq = {};
        bigrams.forEach(b => { bigramFreq[b] = (bigramFreq[b] || 0) + 1; });

        // Combine single words and bigrams, sort by frequency
        const all = [
            ...Object.entries(bigramFreq).filter(([,c]) => c >= 1).map(([w,c]) => [w, c * 2]),
            ...Object.entries(freq).filter(([,c]) => c >= 2)
        ];
        all.sort((a, b) => b[1] - a[1]);
        return all.slice(0, 10).map(([w]) => w);
    }

    _summarizeSection(text, heading) {
        // Extract first meaningful sentence or create from heading
        const sentences = text.split(/[.!?]\s+/);
        const meaningful = sentences.find(s => s.trim().length > 15 && !s.trim().startsWith('>') && !s.trim().startsWith('-'));
        if (meaningful) {
            const clean = meaningful.trim().replace(/\*\*/g, '').substring(0, 120);
            return clean.endsWith('.') ? clean : clean + '.';
        }
        // Fallback: list-based summary
        const items = text.match(/^[-*]\s+(.+)/gm);
        if (items && items.length > 0) {
            return `${heading}: ${items.slice(0, 3).map(i => i.replace(/^[-*]\s+/, '')).join('; ')}.`;
        }
        return `${heading} section content.`;
    }

    _slugify(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);
    }

    _escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

window.AIMarkdownFormatter = AIMarkdownFormatter;
