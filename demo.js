/**
 * Poly-Glot Markdown — See It In Action Demo
 * Animates a before/after transformation of a Markdown file
 * to show RAG & GEO optimization in action.
 */

function initializeDemo() {
    const playBtn    = document.getElementById('playDemoBtn');
    const resetBtn   = document.getElementById('resetDemoBtn');
    const tryItBtn   = document.getElementById('tryItNowBtn');
    const demoStats  = document.getElementById('demoStats');
    const demoPanels = document.querySelectorAll('.demo-panel');

    let isPlaying = false;

    /* ── Before: raw, unstructured markdown ─────────────────── */
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

    /* ── After: RAG & GEO optimized ─────────────────────────── */
    const afterCode =
`---
title: "Authentication Setup Guide"
description: "Step-by-step guide to configuring token-based
  authentication in your application."
tags: [authentication, api, security, setup]
author: ""
date: "${new Date().toISOString().split('T')[0]}"
---

# Authentication Setup Guide

> **Summary:** This guide explains how to configure
> token-based authentication, secure your API token,
> and initialize the auth module before making API calls.

## Prerequisites

Before starting, ensure you have:
- A valid **API token** from your dashboard
- Node.js 18+ installed
- The \`@your-org/auth\` package available

## Setup

### 1. Install the Package

\`\`\`bash
npm install @your-org/auth
\`\`\`

### 2. Configure Environment Variables

Store your token securely — **never commit it to source control**:

\`\`\`bash
# .env
TOKEN=your_secret_token_here
\`\`\`

### 3. Initialize the Auth Module

Call \`auth.init()\` before any API requests:

\`\`\`js
import auth from '@your-org/auth';

auth.init({ token: process.env.TOKEN });
\`\`\`

> **RAG Chunk:** Authentication is token-based. The token
> must be set via environment variable and passed to
> \`auth.init()\` at application startup.

## See Also

- [API Reference](./api-docs.md)
- [Security Best Practices](./security.md)`;

    /* ── Helpers ─────────────────────────────────────────────── */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function typeCode(codeElement, code, speed = 18) {
        codeElement.textContent = '';
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let currentLine = '';
            for (const char of lines[i]) {
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

    /* ── Play ────────────────────────────────────────────────── */
    playBtn.addEventListener('click', async () => {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.disabled = true;

        const beforeIssues   = demoPanels[0].querySelector('.demo-issues');
        const afterBenefits  = demoPanels[1].querySelector('.demo-benefits');
        beforeIssues.style.opacity  = '0';
        afterBenefits.style.opacity = '0';

        // Step 1 — show "before"
        demoPanels[0].classList.add('active');
        const beforeEl = demoPanels[0].querySelector('.demo-code code');
        await typeCode(beforeEl, beforeCode, 22);
        await sleep(300);
        beforeIssues.style.transition = 'opacity 0.5s ease-in';
        beforeIssues.style.opacity = '1';
        await sleep(1500);

        // Step 2 — show "after"
        demoPanels[1].classList.add('active');
        const afterEl = demoPanels[1].querySelector('.demo-code code');
        await typeCode(afterEl, afterCode, 12);
        await sleep(300);
        afterBenefits.style.transition = 'opacity 0.5s ease-in';
        afterBenefits.style.opacity = '1';
        await sleep(1500);

        // Step 3 — stats
        demoStats.style.display = 'flex';

        playBtn.textContent = '✓ Demo Complete';
        playBtn.disabled = false;
        isPlaying = false;
    });

    /* ── Reset ───────────────────────────────────────────────── */
    resetBtn.addEventListener('click', () => {
        demoPanels.forEach(p => p.classList.remove('active'));
        demoStats.style.display = 'none';
        playBtn.textContent = '▶️ Play Demo';
        playBtn.disabled = false;
        isPlaying = false;

        demoPanels[0].querySelector('.demo-code code').textContent = '';
        demoPanels[1].querySelector('.demo-code code').textContent = '';
        document.getElementById('demoIssues').style.opacity  = '0';
        document.getElementById('demoBenefits').style.opacity = '0';
    });

    /* ── Try It Now ──────────────────────────────────────────── */
    tryItBtn.addEventListener('click', () => {
        document.querySelector('.main-content')
            .scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

document.addEventListener('DOMContentLoaded', initializeDemo);
