# NVIDIA NGC Catalog — Technical Writing Guide

> **Internal reference only.** This guide is for technical writers working on content updates for [catalog.ngc.nvidia.com](https://catalog.ngc.nvidia.com). Do not modify any live site files directly.

---

## Table of Contents

1. [Overview of the Site](#1-overview-of-the-site)
2. [Technology Stack](#2-technology-stack)
3. [Inferred File & Content Structure](#3-inferred-file--content-structure)
4. [Content Types You Will Write For](#4-content-types-you-will-write-for)
5. [Technical Writing Approach](#5-technical-writing-approach)
6. [Style Guide Principles](#6-style-guide-principles)
7. [Workflow for Updating Content](#7-workflow-for-updating-content)
8. [Common Pitfalls to Avoid](#8-common-pitfalls-to-avoid)
9. [Glossary of NGC Terms](#9-glossary-of-ngc-terms)

---

## 1. Overview of the Site

**NVIDIA NGC Catalog** (`catalog.ngc.nvidia.com`) is NVIDIA's central hub for GPU-optimized AI, Machine Learning, and HPC software. It surfaces:

- **Containers** — Docker images optimized for NVIDIA GPUs (e.g., PyTorch, TensorFlow, TensorRT, CUDA, Triton Inference Server)
- **Models** — Pre-trained AI models (e.g., PeopleNet, StyleGAN3, FoundationPose)
- **Helm Charts** — Kubernetes deployment manifests (e.g., GPU Operator, NIM for LLMs)
- **Resources / Recipes** — SDKs, scripts, and toolkits (e.g., DeepStream, Riva Quick Start)
- **Collections** — Curated groups of related assets (e.g., NeMo Microservices, Cosmos, Omniverse)
- **NIMs** — NVIDIA Inference Microservices; containerized API endpoints for production AI inference

The site is used by:
- ML engineers and data scientists pulling containers
- DevOps engineers deploying Helm charts to Kubernetes clusters
- Researchers downloading pre-trained models
- Enterprise customers with NVIDIA AI Enterprise subscriptions accessing gated content

---

## 2. Technology Stack

The live site is a **Next.js** application (App Router) deployed by NVIDIA's web infrastructure. Key signals from the source:

| Signal | Detail |
|--------|--------|
| Framework | Next.js (App Router, React Server Components) |
| Routing | `app/(routes)/home/page` pattern |
| Rendering | Client-side hydration with bailout to CSR |
| Analytics | Datadog RUM (`DatadogAppRouterViewTracker`) |
| CDN assets | `assets.nvidiagrid.net`, `nvdam.widen.net`, `assets.ngc.nvidia.com` |
| API data | JSON embedded in RSC payload at page load |
| CSS | Multiple hashed CSS chunk files (Next.js build output) |

> ⚠️ **You will not edit Next.js source files directly.** Content is managed through NVIDIA's internal CMS/catalog backend that populates the API data. Your job is writing the *text content* that feeds into those fields.

---

## 3. Inferred File & Content Structure

Based on the site's API payload, each catalog resource is a structured JSON object. As a technical writer, you are responsible for the following **editable string fields**:

```
Resource Object
├── displayName          ← Short title shown on card (e.g. "PyTorch", "Triton Inference Server")
├── description          ← 1–3 sentence summary shown on card and detail page
├── labels[]             ← Taxonomy tags (e.g. "Natural Language Processing", "CUDA")
├── attributes[]
│   ├── description      ← Longer description (may differ from top-level description)
│   ├── category         ← Content category (e.g. "DEEP_LEARNING", "INFRASTRUCTURE")
│   └── logo             ← URL to logo image (coordinate with design team)
├── resourceType         ← CONTAINER | MODEL | HELM_CHART | RECIPE | COLLECTION
├── productNames[]       ← Licensing/product gating (e.g. "nv-ai-enterprise", "omniverse")
└── publisher[]          ← Organization credit (e.g. "NVIDIA", "Mistral AI", "Google")
```

### Collections also include:
```
Collection Object
├── containerCount       ← Auto-populated count
├── helmchartCount       ← Auto-populated count
├── modelCount           ← Auto-populated count
└── resourceCount        ← Auto-populated count
```

### URL Patterns

| Resource Type | URL Pattern |
|---------------|-------------|
| Container | `/orgs/{org}/containers/{name}` |
| Container (team) | `/orgs/{org}/teams/{team}/containers/{name}` |
| Model | `/orgs/{org}/models/{name}` |
| Model (team) | `/orgs/{org}/teams/{team}/models/{name}` |
| Helm Chart | `/orgs/{org}/helm-charts/{name}` |
| Recipe/Resource | `/orgs/{org}/resources/{name}` |
| Collection | `/orgs/{org}/collections/{name}` |
| NIM | `/orgs/nim/teams/{publisher}/containers/{name}` |

---

## 4. Content Types You Will Write For

### 4.1 Card Descriptions (Short)
- **Character limit:** ~200 characters (aim for 1–2 sentences)
- **Purpose:** Shown on browse/search cards, must be scannable
- **Tone:** Technical but direct. Lead with the primary use case.

**Example (good):**
> "Triton Inference Server is an open source software that lets teams deploy trained AI models from any framework on any GPU- or CPU-based infrastructure."

**Example (bad):**
> "This is a powerful and flexible tool that NVIDIA has created for the purpose of enabling inference at scale across various deployment targets and hardware configurations."

---

### 4.2 Detail Page Descriptions (Long)
- **Length:** 2–5 sentences or a short structured paragraph
- **Purpose:** Shown on the full resource detail page
- **Must include:** What it does, who it's for, key technical differentiator
- **May use:** Markdown bold (`**term**`) for key terms

---

### 4.3 Display Names
- Use **Title Case**
- Match the official product name exactly (check NVIDIA brand guidelines)
- Abbreviations are OK if universally known (e.g., "CUDA", "NIM", "SDK")
- Do not use version numbers in the display name unless it is a versioned collection (e.g., "Production Branch - October 2025 (PB 25h2)")

---

### 4.4 Labels / Tags
- Labels drive **search and filtering** — accuracy is critical
- Use existing taxonomy terms; do not invent new ones without approval
- `NSPECT-XXXX-XXXX` format labels are internal compliance identifiers — do not modify
- Common label categories:
  - Use case: `Natural Language Processing`, `Computer Vision`, `Inference`, `Conversational AI`
  - Industry: `Healthcare`, `Automotive / Transportation`, `Retail`, `Manufacturing`
  - Framework: `PyTorch`, `TensorFlow`, `NeMo`, `DeepStream`
  - Product: `NVIDIA AI Enterprise Supported`, `DGX Cloud Supported`, `Runs on RTX`

---

### 4.5 Collection Descriptions
- Collections group related resources. Descriptions should explain **why these resources are grouped** and **what the user gets** from the collection.
- Reference the support lifecycle if relevant (e.g., "Supported for 9 months with monthly security patches")

---

## 5. Technical Writing Approach

### Step 1 — Audit the existing entry
Before writing anything new:
1. Navigate to the resource's detail page on the live catalog
2. Note the current `displayName`, short description, long description, labels, and publisher
3. Identify what is outdated, inaccurate, or missing
4. Cross-reference with the official product documentation (docs.nvidia.com)

### Step 2 — Research the product
- Primary sources: official NVIDIA product docs, GitHub READMEs, release notes
- Check the **latest tag** and **latestTagPushedDate** — if a container is months old, flag it
- Verify the **publisher** field matches the actual originating organization

### Step 3 — Draft the content
Write in a plain text editor or your team's CMS interface. Follow the field specs in Section 4.

### Step 4 — Peer review
- At minimum one SME (subject matter expert — the owning engineering team) review
- One technical writer peer review for style/clarity

### Step 5 — Submit for publication
Submit changes through the internal catalog content management workflow (Jira ticket → CMS update → staging review → publish).

---

## 6. Style Guide Principles

Base style: **NVIDIA Writing Style Guide** (internal) + **Microsoft Writing Style Guide** (public reference).

### Voice & Tone
- **Direct and technical.** The audience is engineers, not marketers.
- **Active voice.** "Triton deploys models" not "Models are deployed by Triton."
- **Second person for instructions.** "Use this container to..." not "The user can use this container to..."
- **No fluff.** Cut phrases like "powerful", "seamless", "robust", "state-of-the-art" unless they are technically justified and specific.

### Terminology

| Use | Avoid |
|-----|-------|
| GPU-accelerated | GPU-powered, GPU-enabled (unless product-specific) |
| container | docker image (in user-facing copy) |
| inference | inferencing |
| pre-trained | pretrained, pre trained |
| fine-tune / fine-tuning | finetune, fine tuning |
| NVIDIA NIM | NIM microservice (first use must spell out) |
| Helm chart | helm chart, HELM chart |
| Kubernetes | k8s (in user-facing copy) |

### Numbers & Versions
- Spell out numbers under 10 in prose: "six frameworks"
- Use digits for version numbers: "version 2.19", "26.03-py3"
- Always include the unit: "10 GB", not "10gb"

### Abbreviations
- Define on first use in long descriptions: "NVIDIA Inference Microservice (NIM)"
- In short card descriptions, abbreviations are acceptable if universally known

---

## 7. Workflow for Updating Content

```
┌─────────────────────────────────────────────────────────────────┐
│                     CONTENT UPDATE WORKFLOW                     │
└─────────────────────────────────────────────────────────────────┘

  1. IDENTIFY
     └─ Ticket raised (Jira) with resource ID + what needs changing
            e.g. nvidia:pytorch | description outdated

  2. RESEARCH
     └─ Review product docs, GitHub, release notes
     └─ Check live catalog entry at catalog.ngc.nvidia.com

  3. DRAFT
     └─ Write to field specs (Section 4)
     └─ Follow style guide (Section 6)

  4. REVIEW
     ├─ SME sign-off (engineering team)
     └─ TW peer review

  5. SUBMIT
     └─ Enter content in internal CMS / catalog backend
     └─ Preview on staging environment

  6. PUBLISH
     └─ Catalog backend pushes to production API
     └─ Content appears on catalog.ngc.nvidia.com

  7. VERIFY
     └─ QA check: load the live detail page
     └─ Confirm description, labels, display name render correctly
     └─ Close Jira ticket
```

---

## 8. Common Pitfalls to Avoid

| Pitfall | Why It Matters | What to Do Instead |
|---------|---------------|--------------------|
| Copying description from PyPI/Docker Hub verbatim | May be stale, wrong tone, or miss NGC-specific context | Write fresh, adapted copy |
| Using a version number in `displayName` | Cards become stale instantly after next release | Use version numbers only in versioned collections (e.g., PB 25h2) |
| Adding invented taxonomy labels | Breaks search filters for users | Use only approved labels from the taxonomy list |
| Describing what a container *could* do | Users need to know what it *does* | Be specific about the primary, documented use case |
| Forgetting to set `publisher` | Misattributes credit (e.g., TensorFlow publisher is Google, not NVIDIA) | Always verify the originating organization |
| Leaving `productNames` blank on gated content | Users can't find enterprise-only content with their subscription filter | Confirm with PM which product gates apply |
| Not checking `latestTagPushedDate` | You may be writing for a deprecated version | Flag containers not updated in >6 months for engineering review |

---

## 9. Glossary of NGC Terms

| Term | Definition |
|------|------------|
| **NGC** | NVIDIA GPU Cloud — the platform and registry behind the catalog |
| **NIM** | NVIDIA Inference Microservice — a containerized, OpenAI-compatible API for deploying AI models |
| **Collection** | A curated set of related containers, models, Helm charts, or resources grouped under one catalog entry |
| **Production Branch (PB)** | A version branch of a container or collection supported for 9 months with monthly security patches (e.g., PB 25h2 = H2 2025) |
| **LTSB** | Long-Term Support Branch — supported for 36 months with quarterly patches for high/critical vulnerabilities |
| **Feature Branch (FB)** | Cutting-edge, frequently updated branch for developers who need early access to the latest features |
| **NVAIE** | NVIDIA AI Enterprise — the commercial software subscription that gates certain catalog content |
| **Guest Access** | Resources marked `guestAccess: true` are publicly browsable without an NGC account |
| **Signed Images** | Containers with cryptographic signatures verifiable with `cosign`; displayed as a system label |
| **Helm Chart** | A package of Kubernetes manifests for deploying NGC resources to a cluster |
| **Recipe / Resource** | A downloadable artifact (tarball, script, SDK installer) that is not a container or model |
| **org / namespace** | The organizational owner in the catalog URL path (e.g., `nvidia`, `nim`) |
| **team** | A sub-namespace under an org (e.g., `nvidia/omniverse`, `nim/meta`) |
| **latestTag** | The most recently pushed Docker image tag for a container resource |
| **oneClickDeploy** | Feature flag for resources deployable directly from the catalog UI |
| **gov_ready** | Label indicating the image meets requirements for US Government regulated environments |

---

*Last updated: 2025 — Maintained by the Poly-Glot technical writing team.*
*Do not commit changes to `index.html`, `styles.css`, `app.js`, or any root-level site file.*
