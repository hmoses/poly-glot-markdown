/**
 * Poly-Glot Markdown — Dual-Mode Formatter
 * Mode 1: Instant (client-side rules) — works offline, no network
 * Mode 2: AI-Enhanced (server-side Gemini 3.6 Flash) — seamless, no API key needed
 *
 * Methodology:
 * - RAG optimization: LlamaIndex, Pinecone, LangChain chunking best practices
 * - GEO optimization: Aggarwal et al. 2023 "GEO: Generative Engine Optimization"
 * - Freshness: Google Search Quality Evaluator Guidelines
 * - Citation anchors: Google Passage Indexing documentation
 */
class AIMarkdownFormatter {
    constructor() {
        this.mode = localStorage.getItem('pgmd_mode') || 'instant';
        this.serverUrl = 'https://br-steep-leaf-ae2o29qz-mcp.compute.c-2.us-east-2.aws.neon.tech/api/markdown/format';
    }

    setMode(mode) {
        this.mode = mode;
        localStorage.setItem('pgmd_mode', mode);
    }

    isConfigured() { return true; }
    isAIMode() { return this.mode === 'ai'; }

    /**
     * Main format method
     */
    async format(content, options) {
        if (!content || !content.trim()) throw new Error('No content to format.');
        if (this.isAIMode()) {
            try {
                return await this._formatWithServer(content, options);
            } catch (err) {
                console.warn('AI mode failed, falling back to instant:', err.message);
                return this._formatInstant(content, options);
            }
        }
        return this._formatInstant(content, options);
    }

    // ══════════════════════════════════════════════════════════════════
    // AI MODE: Server-side Gemini (no API key needed)
    // ══════════════════════════════════════════════════════════════════
    async _formatWithServer(content, options) {
        const response = await fetch(this.serverUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, options })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            if (response.status === 429) throw new Error('Rate limit reached (20/hour). Switch to Instant Mode or wait.');
            throw new Error(err.error || `Server error ${response.status}`);
        }

        const data = await response.json();
        return data.result;
    }

    // ══════════════════════════════════════════════════════════════════
    // INSTANT MODE: Client-side rule engine
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

    _addFrontmatter(text) {
        const hasFM = /^---\s*\n[\s\S]*?\n---/m.test(text);
        const today = new Date().toISOString().split('T')[0];
        const expires = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
        if (hasFM) {
            let fm = text.match(/^---\s*\n([\s\S]*?)\n---/m)[1];
            const body = text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
            if (!/description\s*:/i.test(fm)) { const p = body.split('\n').find(l => l.trim().length > 20 && !l.startsWith('#')); if (p) fm += `\ndescription: "${p.trim().substring(0, 160)}"`; }
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
        const p = text.split('\n').find(l => l.trim().length > 20 && !l.startsWith('#'));
        const desc = p ? p.trim().substring(0, 160) : title;
        const kw = this._extractKeywords(text);
        return `---\ntitle: "${title}"\ndescription: "${desc}"\ntags: [${kw.slice(0, 5).join(', ')}]\nkeywords: [${kw.slice(0, 8).join(', ')}]\nauthor: ""\ndate: ${today}\nlast_reviewed: ${today}\nexpires: ${expires}\nsource: ""\nversion: "1.0"\n---\n\n${text}`;
    }

    _fixStructure(text) {
        const lines = text.split('\n'), result = [];
        let hasH1 = false, last = 0;
        for (const line of lines) {
            const m = line.match(/^(#{1,6})\s+(.+)/);
            if (m) { let l = m[1].length; if (l===1){if(hasH1)l=2;else hasH1=true;} if(last>0&&l>last+1)l=last+1; last=l; result.push(`${'#'.repeat(l)} ${m[2]}`); }
            else result.push(line);
        }
        if (!hasH1) result.unshift(`# ${this._extractTitle(text)||'Document'}\n`);
        return result.join('\n');
    }

    _improveSemantic(text) {
        let r = text;
        r = r.replace(/\b(action items|todo|tasks|steps|requirements)\s*:?\s*\n((?:[-*]\s+.+\n?)+)/gi, (m,l,items) => `## ${l.charAt(0).toUpperCase()+l.slice(1)}\n\n${items}`);
        r = r.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
        r = r.replace(/(#{1,6}\s.+)\n([^#\n])/g, '$1\n\n$2');
        return r;
    }

    _addGEOKeywords(text) {
        const kw = this._extractKeywords(text); let r = text;
        for (const k of kw.slice(0,5)) { const re = new RegExp(`(?<!\\*\\*)(?<!# )\\b(${this._esc(k)})\\b(?!\\*\\*)`,'i'); r = r.replace(re,'**$1**'); }
        return r;
    }

    _addRAGChunking(text) {
        const lines = text.split('\n'), result = []; let sec=[], hd='', inFM=false;
        for (let i=0;i<lines.length;i++) {
            const line=lines[i];
            if(i===0&&line.trim()==='---'){inFM=true;result.push(line);continue;}
            if(inFM){result.push(line);if(line.trim()==='---')inFM=false;continue;}
            const h2=line.match(/^##\s+(.+)/), h3=line.match(/^###\s+(.+)/);
            if(h2||h3){
                if(sec.length>0&&hd){const t=sec.join('\n').trim();if(t.length>30)result.push('',`> **Summary:** ${this._sum(t,hd)}`);}
                if(hd)result.push('','<!-- chunk-boundary -->');
                const txt=h2?h2[1]:h3[1],slug=this._slug(txt),pfx=h2?'##':'###';
                result.push(/\{#[\w-]+\}/.test(txt)?line:`${pfx} ${txt} {#${slug}}`);
                hd=txt;sec=[];
            } else {if(hd)sec.push(line);result.push(line);}
        }
        if(sec.length>0&&hd){const t=sec.join('\n').trim();if(t.length>30)result.push('',`> **Summary:** ${this._sum(t,hd)}`);}
        return result.join('\n');
    }

    _extractTitle(t){const m=t.match(/^#\s+(.+)/m);return m?m[1].trim():(t.split('\n').find(l=>l.trim().length>3)||'').trim().substring(0,60)||null;}
    _extractKeywords(text) {
        const clean=text.replace(/^---[\s\S]*?---/m,'').replace(/^#{1,6}\s.+/gm,'');
        const words=clean.toLowerCase().match(/\b[a-z]{4,}\b/g)||[];
        const stop=new Set(['the','and','for','are','but','not','you','all','can','had','was','one','our','out','has','been','have','this','that','with','they','from','will','would','could','should','about','which','their','there','what','when','where','also','some','them','than','then','into','just','more','other','were','being','does','each','make','like','very','most','over','such','after','only','before','because','between','through','during','without','again','further','once','here','both','those','these','done','said','need','probably','something','mentioned','talked','going','might','still','keep','look','tell','things','stuff','pretty','good','last','next','first']);
        const freq={};words.forEach(w=>{if(!stop.has(w))freq[w]=(freq[w]||0)+1;});
        const bi=[];for(let i=0;i<words.length-1;i++){if(!stop.has(words[i])&&!stop.has(words[i+1]))bi.push(`${words[i]} ${words[i+1]}`);}
        const bf={};bi.forEach(b=>{bf[b]=(bf[b]||0)+1;});
        const all=[...Object.entries(bf).filter(([,c])=>c>=1).map(([w,c])=>[w,c*2]),...Object.entries(freq).filter(([,c])=>c>=2)];
        all.sort((a,b)=>b[1]-a[1]);return all.slice(0,10).map(([w])=>w);
    }
    _sum(t,h){const s=t.split(/[.!?]\s+/);const m=s.find(x=>x.trim().length>15&&!x.trim().startsWith('>')&&!x.trim().startsWith('-'));if(m){const c=m.trim().replace(/\*\*/g,'').substring(0,120);return c.endsWith('.')?c:c+'.';}const items=t.match(/^[-*]\s+(.+)/gm);if(items&&items.length)return`${h}: ${items.slice(0,3).map(i=>i.replace(/^[-*]\s+/,'')).join('; ')}.`;return`${h} section content.`;}
    _slug(t){return t.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').substring(0,50);}
    _esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
}

window.AIMarkdownFormatter = AIMarkdownFormatter;
