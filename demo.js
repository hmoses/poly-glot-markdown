/**
 * Poly-Glot Markdown — See It In Action Demo
 * Animates a before/after transformation showing RAG & GEO optimization.
 * Matches the demo pattern from poly-glot.ai.
 */

function initializeDemo() {
    const playBtn    = document.getElementById('playDemoBtn');
    const resetBtn   = document.getElementById('resetDemoBtn');
    const tryItBtn   = document.getElementById('tryItNowBtn');
    const demoStats  = document.getElementById('demoStats');
    const demoIssues = document.getElementById('demoIssues');
    const demoBenefits = document.getElementById('demoBenefits');
    const demoPanels = document.querySelectorAll('.demo-panel');

    if (!playBtn || !resetBtn || !tryItBtn || !demoStats || demoPanels.length < 2) return;

    const beforeCodeEl = document.querySelector('#demoCodeBefore code');
    const afterCodeEl  = document.querySelector('#demoCodeAfter code');

    let isPlaying = false;

    // ── Before: raw, unstructured markdown ──────────────────────────────
    const beforeCode =
`# intro

this doc explains how to set up auth in our app.
you need a token to call the api. make sure to keep
it secret. there are a few steps involved.

## setup

install the package first. then configure your env vars.
call the init function before anything else.

## example

\`\`\`js
auth.init({ token: process.env.TOKEN })
\`\`\`

see the api docs for more info.`;

    // ── After: RAG & GEO optimized ───────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const afterCode =
`---
title: "Authentication Setup Guide"
description: "Step-by-step guide to configuring
  token-based authentication. Covers install,
  environment setup, and secure API init."
tags: [authentication, api, security, setup, token]
date: "${today}"
---

# Authentication Setup Guide

> **Summary:** Configure token-based auth by installing
> the package, setting env vars, and calling
> \`auth.init()\` before any API requests.

## Prerequisites

- Valid **API token** from your dashboard
- Node.js 18+ installed

## Setup

### 1. Install the Package

\`\`\`bash
npm install @your-org/auth
\`\`\`

### 2. Configure Environment Variables

\`\`\`bash
# .env — never commit this file
TOKEN=your_secret_token_here
\`\`\`

### 3. Initialize Auth

\`\`\`js
import auth from '@your-org/auth';
auth.init({ token: process.env.TOKEN });
\`\`\`

> **RAG Chunk:** Auth is token-based. Pass the token
> via env var to \`auth.init()\` at startup.

## See Also

- [API Reference](./api-docs.md)
- [Security Best Practices](./security.md)`;

    // ── Helpers ──────────────────────────────────────────────────────────
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function typeCode(codeElement, code, speed = 18) {
        codeElement.textContent = '';
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let currentLine = '';
            for (const char of line) {
                currentLine += char;
                codeElement.textContent =
                    lines.slice(0, i).join('\n') +
                    (i > 0 ? '\n' : '') +
                    currentLine;
                await sleep(speed);
            }
            if (i < lines.length - 1) {
                codeElement.textContent += '\n';
            }
        }
    }

    // ── Play ─────────────────────────────────────────────────────────────
    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.disabled = true;
        playBtn.textContent = '⏸️ Playing...';

        // Reset state
        demoIssues.style.opacity   = '0';
        demoBenefits.style.opacity = '0';
        demoStats.style.display    = 'none';

        // Step 1 — activate before panel, type code
        demoPanels[0].classList.add('active');
        await typeCode(beforeCodeEl, beforeCode, 20);

        // Show issue badges
        await sleep(300);
        demoIssues.style.transition = 'opacity 0.5s ease-in';
        demoIssues.style.opacity = '1';
        await sleep(1500);

        // Step 2 — activate after panel, type optimized code
        demoPanels[1].classList.add('active');
        await typeCode(afterCodeEl, afterCode, 12);

        // Show benefit badges
        await sleep(300);
        demoBenefits.style.transition = 'opacity 0.5s ease-in';
        demoBenefits.style.opacity = '1';
        await sleep(1500);

        // Step 3 — show stats
        demoStats.style.display = 'flex';
        await sleep(2000);

        playBtn.textContent    = '✓ Demo Complete';
        playBtn.disabled       = false;
        resetBtn.style.display = 'inline-flex';
        isPlaying = false;

        if (typeof gtag !== 'undefined') {
            gtag('event', 'demo_played', { source: 'demo_section' });
        }
    });

    // ── Reset ─────────────────────────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        demoPanels.forEach(p => p.classList.remove('active'));
        demoStats.style.display    = 'none';
        resetBtn.style.display     = 'none';
        playBtn.textContent        = '▶️ Play Demo';
        playBtn.disabled           = false;
        isPlaying                  = false;

        beforeCodeEl.textContent   = '';
        afterCodeEl.textContent    = '';
        demoIssues.style.opacity   = '0';
        demoBenefits.style.opacity = '0';

        if (typeof gtag !== 'undefined') {
            gtag('event', 'demo_reset', { source: 'demo_section' });
        }
    });

    // ── Try It Now ────────────────────────────────────────────────────────
    tryItBtn.addEventListener('click', () => {
        document.querySelector('.main-content')
            .scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (typeof gtag !== 'undefined') {
            gtag('event', 'demo_cta_clicked', { source: 'demo_section', action: 'try_it_now' });
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    initializeDemo();
}
