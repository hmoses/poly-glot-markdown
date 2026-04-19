# NVIDIA NGC Catalog — Technical Writing Guide

> **Internal reference only.** This guide is for technical writers updating content on [catalog.ngc.nvidia.com](https://catalog.ngc.nvidia.com). Do not publish externally without review.

---

## Table of Contents

1. [What is NVIDIA NGC?](#1-what-is-nvidia-ngc)
2. [Site Architecture & Tech Stack](#2-site-architecture--tech-stack)
3. [Content Types & File Structure](#3-content-types--file-structure)
4. [Technical Writer Responsibilities](#4-technical-writer-responsibilities)
5. [Writing Approach by Content Type](#5-writing-approach-by-content-type)
6. [Style & Voice Guidelines](#6-style--voice-guidelines)
7. [Update Workflow](#7-update-workflow)
8. [QA Checklist](#8-qa-checklist)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Glossary](#10-glossary)

---

## 1. What is NVIDIA NGC?

NVIDIA NGC (formerly NVIDIA GPU Cloud) is a catalog of **GPU-optimized software** for AI, machine learning, and HPC. It hosts:

| Resource Type | Description | Example |
|---|---|---|
| **Containers** | Docker images pre-built for NVIDIA GPUs | PyTorch, TensorFlow, CUDA, Triton |
| **Models** | Pre-trained ML models ready to deploy or fine-tune | PeopleNet, StyleGAN3, FoundationPose |
| **Helm Charts** | Kubernetes deployment charts | GPU Operator, NIM for LLMs |
| **Resources / Recipes** | SDKs, scripts, and deployment packages | Riva Quick Start, DeepStream SDK |
| **Collections** | Curated bundles of related resources | Omniverse (PB 25h1), NVAIE Infra 7 |
| **NIMs** | NVIDIA Inference Microservices — optimized API endpoints | Llama-3.2-11B, DeepSeek-R1, CodeLlama |

The catalog serves multiple audiences:
- **AI/ML researchers** — looking for frameworks like PyTorch or NeMo
- **Enterprise engineers** — deploying NVIDIA AI Enterprise (NVAIE) workloads
- **Omniverse developers** — working with 3D simulation and Kit SDKs
- **Kubernetes operators** — deploying via Helm

---

## 2. Site Architecture & Tech Stack

`catalog.ngc.nvidia.com` is a **Next.js application** (React, App Router), deployed on NVIDIA's infrastructure. Key architectural signals:

```
catalog.ngc.nvidia.com
├── Built with: Next.js (App Router, React Server Components)
├── Routing:    /_next/static/chunks/app/(routes)/home/
├── Styling:    CSS Modules via /_next/static/css/
├── Analytics:  Datadog RUM (DatadogAppRouterViewTracker)
├── Data:       Server-side rendered JSON (embedded in page payload)
└── CDN:        NVIDIA DAM / Widen CDN for logos and images
```

### URL Patterns

| URL Pattern | Content |
|---|---|
| `/orgs/{org}/containers/{name}` | Container detail page |
| `/orgs/{org}/models/{name}` | Model detail page |
| `/orgs/{org}/helm-charts/{name}` | Helm chart detail page |
| `/orgs/{org}/resources/{name}` | SDK/recipe detail page |
| `/orgs/{org}/collections/{name}` | Collection detail page |
| `/orgs/{org}/teams/{team}/containers/{name}` | Team-scoped container |
| `/orgs/nim/teams/{publisher}/containers/{name}` | NIM detail page |

### Content Data Model

Each resource in the catalog has a predictable schema:

```json
{
  "resourceId": "nvidia/pytorch",
  "displayName": "PyTorch",
  "name": "pytorch",
  "description": "...",
  "resourceType": "CONTAINER",
  "labels": ["DL", "PyTorch", "NVIDIA AI Enterprise Supported"],
  "publisher": ["NVIDIA"],
  "builtBy": ["NVIDIA"],
  "attributes": [
    { "key": "latestTag", "value": "26.03-py3" },
    { "key": "size", "value": "10519125052" },
    { "key": "latestTagPushedDate", "value": "2026-03-25T15:26:43.471Z" },
    { "key": "logo", "value": "https://..." }
  ],
  "productNames": [],
  "systemLabels": ["signed images", "containers:multiarch"]
}
```

---

## 3. Content Types & File Structure

As a technical writer, your edits live in **two layers**:

### Layer 1 — The Backend Content System (Primary)

The descriptions, labels, logos, and metadata shown in the catalog are managed through NVIDIA's internal content management system (not a public GitHub repo). This is where the majority of technical writing work happens.

```
NGC Content System (internal)
├── resource/
│   ├── description.md       ← Main body shown on resource detail page
│   ├── metadata.yaml        ← Labels, publisher, productNames, tags
│   ├── logo.jpg             ← Product logo (uploaded to Widen DAM)
│   └── overview.md          ← Extended overview tab content
├── collection/
│   ├── description.md
│   └── metadata.yaml
└── nim/
    ├── description.md
    └── api-reference.md     ← Endpoint docs, request/response schemas
```

### Layer 2 — The Next.js Frontend (UI/UX Copy)

UI strings, labels, and navigation copy live inside the Next.js application source:

```
app/
├── (routes)/
│   ├── home/
│   │   └── page.tsx         ← Homepage sections: NIMs, NVAIE, Top Technology
│   ├── [org]/
│   │   ├── containers/
│   │   │   └── [name]/
│   │   │       └── page.tsx ← Container detail page
│   │   ├── models/[name]/
│   │   ├── helm-charts/[name]/
│   │   ├── resources/[name]/
│   │   └── collections/[name]/
│   └── not-found/
│       └── page.tsx
├── layout.tsx               ← Global layout, nav, head metadata
├── globals.css
components/
├── CatalogCard/             ← Resource listing cards
├── ResourceDetail/          ← Detail page tabs (Overview, Tags, Usage)
├── SearchBar/               ← Search and filter UI
└── Navigation/              ← Header/footer
public/
├── _next/static/
│   ├── css/                 ← Compiled stylesheets
│   └── chunks/              ← JS bundles
```

---

## 4. Technical Writer Responsibilities

### What You Own

| Area | Your Role |
|---|---|
| **Resource descriptions** | Write/edit the markdown shown on each resource's detail page |
| **Short descriptions** | The 1–2 sentence blurbs shown on catalog cards |
| **Labels / tags** | Verify accuracy of category labels (e.g., "NVIDIA AI Enterprise Supported") |
| **Release notes** | Document what changed in each new tag/version push |
| **Usage instructions** | Pull commands, quickstart steps, prerequisites |
| **API reference (NIMs)** | Endpoint docs, request/response shapes, code examples |
| **Collection descriptions** | Explain what a collection contains and who it's for |
| **Changelog entries** | Document version-to-version changes for frameworks |

### What You Don't Own (Coordinate With Engineering)

- Logo uploads and CDN asset management
- Product name / entitlement mappings (`productNames` field)
- Security inspection labels (`NSPECT-*`)
- System labels (`signed images`, `containers:multiarch`)
- Deployment of the Next.js frontend

---

## 5. Writing Approach by Content Type

### 5.1 Container Descriptions

**Goal:** Help engineers quickly understand what the container is, what frameworks/versions it bundles, and what hardware it targets.

**Template:**
```
{Container name} is a GPU-accelerated {framework type} built on CUDA {version}.
It provides {key capability 1}, {key capability 2}, and {key capability 3}.

This container is optimized for {use case} on NVIDIA {GPU family}.
```

**Example (PyTorch):**
> PyTorch is a GPU accelerated tensor computational framework. Functionality can be extended with common Python libraries such as NumPy and SciPy. Automatic differentiation is done with a tape-based system at the functional and neural network layer levels.

**Tips:**
- Always mention the framework version in the tag (e.g., `26.03-py3` = March 2026 release, Python 3)
- State CUDA compatibility if not obvious
- List supported precision types (FP32, FP16, INT8) for inference containers

---

### 5.2 Model Descriptions

**Goal:** Explain the model architecture, training data/task, and deployment use case.

**Template:**
```
{Model name} is a {architecture} model trained for {task}.
It achieves {metric} on {benchmark}.

The model supports {input type} inputs and outputs {output type}.
Compatible with {framework(s)} and optimized for NVIDIA {GPU}.
```

**Example (PeopleNet):**
> 3 class object detection network to detect people in an image.

**Tips:**
- Include the number of classes for detection/classification models
- Link to the paper or project page where available
- Note precision formats (`FP32`, `FP16`, `INT8`, `TensorRT`) clearly
- For TAO toolkit models, mention the base architecture (e.g., DetectNet_v2)

---

### 5.3 NIM Descriptions

**Goal:** Explain the model being served, the API compatibility, and the deployment footprint.

**Template:**
```
NVIDIA NIM for GPU accelerated {model name} inference through OpenAI compatible APIs.

{1–2 sentences about what the model does.}

This NIM exposes a standard REST API endpoint compatible with the OpenAI chat completions
specification, enabling drop-in replacement for existing integrations.
```

**Example (CodeLlama-70B):**
> NVIDIA NIM for GPU accelerated CodeLlama-70B inference through OpenAI compatible APIs

**Tips:**
- Always state OpenAI API compatibility if present
- Mention GPU memory requirements if known
- Clarify whether the NIM is quantized (INT4, INT8) vs. full precision
- Note entitlement requirements: `nv-ai-enterprise`, `nim-dev`

---

### 5.4 Collection Descriptions

**Goal:** Tell the user *what's inside* and *why this bundle exists* (e.g., support lifecycle).

**Template:**
```
{Collection name} provides access to {what it contains}.
{Support lifecycle sentence — e.g., "Supported for 9 months with monthly security patches."}

This collection includes: {list of resource types — containers, Helm charts, models}.
```

**Example (Production Branch October 2025):**
> Access the production branch images of AI frameworks and SDKs. Supported for 9 months with monthly security patches.

**Tips:**
- Always state the support window (9 months, 36 months, etc.)
- Distinguish Production Branch (PB) from Long-Term Support Branch (LTSB) and Feature Branch (FB)
- Call out Government Ready / STIG / FIPS compliance when applicable

---

### 5.5 Helm Chart Descriptions

**Goal:** Explain what Kubernetes workload the chart deploys and what the operator/admin needs to know.

**Template:**
```
{Helm chart name} provides an easy way to install, configure, and manage {resource} on Kubernetes.

Prerequisites: {Kubernetes version}, {NVIDIA GPU Operator version if needed}

This chart supports {key configuration options}.
```

**Tips:**
- Always mention the Kubernetes prerequisite
- Include the GPU Operator dependency if relevant
- Document key `values.yaml` parameters in the Overview tab

---

## 6. Style & Voice Guidelines

### Voice
- **Professional and precise.** This is developer-facing documentation.
- **Direct.** Start sentences with the subject, not filler phrases.
- **Active voice preferred.** "The container supports FP16" not "FP16 is supported by the container."

### Tone
- Technical but accessible — assume the reader is an ML engineer, not a marketing executive.
- Avoid superlatives ("best-in-class," "revolutionary") unless citing a benchmark.
- Omit "easy" and "simple" — what's easy for one engineer isn't for another.

### Formatting Conventions

| Element | Convention |
|---|---|
| Code, commands | Inline backticks: `docker pull nvcr.io/nvidia/pytorch:26.03-py3` |
| File paths | Inline backticks: `values.yaml` |
| Version numbers | Exact notation: `26.03-py3`, `v26.3.1`, `1.14.0-pb5.5` |
| GPU names | Full name on first mention: "NVIDIA H100 Tensor Core GPU (H100)" |
| Acronyms | Spell out on first use: "NVIDIA Inference Microservice (NIM)" |
| Numbers | Spell out one through nine; use numerals for 10 and above |

### Label Conventions

Labels are controlled vocabulary. Use only approved labels:

```
NVIDIA AI Enterprise Supported   ← NVAIE-licensed content
NVIDIA AI                         ← General NVIDIA AI branding
DGX Cloud Supported              ← Validated for DGX Cloud
DGX Spark Supported              ← Validated for DGX Spark
Runs on RTX                      ← Optimized for RTX consumer GPUs
NVIDIA NIM                       ← NIM microservices
Production Branch                ← PB release cadence
NSPECT-XXXX-XXXX                 ← Security inspection IDs (set by security team)
```

---

## 7. Update Workflow

### Typical Content Update Flow

```
1. Receive update request
   └── Source: product team, release engineer, or support ticket

2. Identify the resource
   └── Note: org, team, resource type, resource name
   └── URL: /orgs/{org}/[teams/{team}/]{resourceType}/{name}

3. Draft the content change
   └── description.md — full markdown body
   └── short_description — max 280 characters for card display

4. Internal review
   └── Technical SME review (accuracy)
   └── Legal/brand review (if new product or partner)

5. Submit to NGC Content System
   └── Follow internal CMS ticket process
   └── Tag release engineer if tied to a container/model version push

6. Verify on staging
   └── Check staging.catalog.ngc.nvidia.com (internal access)
   └── Validate card display, detail page, tabs

7. Approve and publish
   └── Content goes live on next CMS deploy
```

### Version-Locked Releases

When a new container tag is pushed (e.g., `26.04-py3`), content updates must be **coordinated with the release**:

- Update `latestTag` reference in descriptions
- Add changelog entry for what changed since last tag
- Update any version-specific prerequisites or compatibility notes
- Verify `latestTagPushedDate` is reflected in any dated references

---

## 8. QA Checklist

Before submitting any content update, verify the following:

### Content Accuracy
- [ ] Framework/model version numbers match the latest published tag
- [ ] CUDA version compatibility is current
- [ ] GPU compatibility claims are verified with the engineering team
- [ ] Benchmark numbers (if any) are cited with source
- [ ] License or entitlement requirements are correctly stated

### Style & Formatting
- [ ] No spelling or grammar errors
- [ ] Active voice used throughout
- [ ] No unapproved superlatives
- [ ] Code strings are in backticks
- [ ] Acronyms spelled out on first use

### Metadata
- [ ] Labels are from the approved label vocabulary
- [ ] `publisher` field is accurate
- [ ] `productNames` entitlements are correct (confirmed with PM)
- [ ] Logo image is uploaded and resolving correctly
- [ ] Short description fits within 280 characters

### Display
- [ ] Card view renders correctly (no truncation issues)
- [ ] Detail page tabs (Overview, Tags, Pull Command) all populate
- [ ] Logo displays at correct aspect ratio
- [ ] No broken links in body content

---

## 9. Common Pitfalls

| Pitfall | What Happens | Fix |
|---|---|---|
| Hardcoding a tag version in description | Description becomes stale when new tag ships | Use generic version references; note "see Tags tab for latest" |
| Using unapproved labels | Label doesn't appear in filter facets | Check label vocabulary with catalog team before submitting |
| Mixing `publisher` and `builtBy` | Confuses provenance — publisher = brand, builtBy = team | Keep them separate; both can be NVIDIA or different entities |
| Writing for the logo, not the user | Card description that just restates the product name | Lead with the value proposition or use case |
| Missing entitlement context | Users try to pull a private container and get a 403 | Always state if a resource requires NVAIE or another subscription |
| Forgetting multi-arch labels | Users assume x86-only when ARM/multi-arch is supported | Include `containers:multiarch` label and note it in description |
| Outdated NSPECT IDs | Security inspection IDs expire or rotate | Never author NSPECT labels yourself — set by the security team |

---

## 10. Glossary

| Term | Definition |
|---|---|
| **NGC** | NVIDIA GPU Cloud — the platform and catalog |
| **NIM** | NVIDIA Inference Microservice — a containerized, API-accessible model endpoint |
| **NVAIE** | NVIDIA AI Enterprise — the enterprise software subscription |
| **PB** | Production Branch — a release with a 9-month support window |
| **LTSB** | Long-Term Support Branch — 36-month support, quarterly security patches |
| **FB** | Feature Branch — cutting-edge, frequent updates, no long-term support guarantee |
| **NSPECT** | NVIDIA Security Inspection ID — a label confirming security review |
| **TAO** | Train, Adapt, Optimize — NVIDIA's model fine-tuning toolkit |
| **Triton** | Triton Inference Server — NVIDIA's open-source model serving framework |
| **NeMo** | NVIDIA's framework for training and customizing large language models |
| **DGX** | NVIDIA's data center AI systems (DGX H100, DGX Spark, DGX Cloud) |
| **CUDA** | Compute Unified Device Architecture — NVIDIA's parallel computing platform |
| **Helm Chart** | A Kubernetes packaging format for deploying applications |
| **RTX** | NVIDIA's consumer/prosumer GPU line (GeForce RTX, RTX workstations) |
| **OpenUSD** | Open Universal Scene Description — 3D data interchange standard used in Omniverse |
| **gov_ready** | Label indicating the image is hardened for U.S. government / regulated environments |
| **STIG/FIPS** | Security Technical Implementation Guide / Federal crypto standards — hardened images |

---

*Last updated: 2025. Maintained by the poly-glot technical writing team.*
*For questions or corrections, open an issue in this repo.*
