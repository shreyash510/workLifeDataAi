# Namaste Work.Life: Zero to Hero

A tutorial series that takes one real client project and explains every piece of it, end to end.

**🌐 Read it online: [shreyash510.github.io/workLifeDataAi](https://shreyash510.github.io/workLifeDataAi/)**

> ⚠️ **For educational purposes only.** This is a personal learning resource, not an official Work.Life document and not affiliated with or endorsed by Work.Life or any supplier.
> - All lab data, names, companies and figures are **made up** for practice.
> - Designs, table names, costs and plans are **our own proposals**, not what Work.Life uses or has agreed to.
> - Vendor features and prices may be out of date; check the vendors' current docs.
> - Nothing here is financial, legal or accounting advice.

**The project:** Work.Life is a UK coworking company (B Corp, 14 sites, about 8,000 members, about 70 staff). They want their leadership team to **ask questions about the business in plain English and trust the answers**. That AI layer sits on top of their existing data stack: Nexudus, NetSuite, ACT, Excel and HubSpot → Fivetran/Python → BigQuery → dbt → BI.

The series covers the business, every source system, the pipeline, the AI layer and how to deliver the project, in simple language with one topic per chapter.

---

## Reading order (most important first)

The series index and the viewer's nav list the seasons in this order. Chapter numbers stay as they are.

| Priority | Season | Chapters | Why |
|---|---|---|---|
| 🔴 Must read | 0 · The Business & the Brief | 01–04 | How Work.Life makes money, the KPIs, the brief, the people |
| 🔴 Must read | 6 · Understand It All | 38–40 | Glossary, every integration, a month in the life |
| 🔴 Must read | 7 · Deep Dives | 41–44 | Site economics, billing, month-end close, sales & renewals |
| 🟠 Important | 1 · Source Systems | 05–11 | How each system works inside (07 Nexudus and 11 matching are key) |
| 🟡 Useful | 2 · The Pipeline | 12–18 | How data moves into the warehouse |
| 🟡 Useful | 3 · The AI Layer | 19–28 | What the client wants built (23 is key) |
| ⚪ Optional | 4 · Phase 2 | 29–32 | Future ideas, not in scope yet |
| ⚪ Optional | 5 · Delivery | 33–37 | Writing the response, plan, cost, handover |

**Only have one hour?** Read 01, 02, 38, 39, 40.

---

## Repository layout

```
.
├── index.html                  Viewer: the reader app (GitHub Pages entry point)
├── app.js                      Viewer logic (plain JS, no build step)
├── .nojekyll                   Tells GitHub Pages to serve files as-is
├── namaste-worklife/           The tutorial content (Blogger post fragments)
│   ├── index.html              Series home + chapter timeline (source of the nav)
│   ├── season-0-business/
│   ├── season-1-source-systems/
│   ├── season-2-pipeline/
│   ├── season-3-ai-layer/
│   ├── season-4-phase-2/
│   ├── season-5-delivery/
│   └── lab-data/               Mini Work.Life CSVs used in the hands-on labs
├── Work.Life-Data-AI-Infrastructure-Supplier-Scoping-Brief.docx   Source: client brief (July 2026)
└── Work.Life-173tech.pdf                                          NOT a source (another company's proposal)
```

The scoping brief is the only source of client facts. Lab numbers come from `lab-data/`, and made-up examples are labelled "(made up)".

`Work.Life-173tech.pdf` is a proposal from another company. It is deliberately **not** used anywhere in the series.

**The goal:** understand the domain, the business and how it works internally. That means every term, every system, and every integration between them.

---

## Work plan by phase

The series is built in phases. Each phase is one season, written as its own unit so the phases can be worked on in parallel.

### Phase 0: The Business & the Brief ✅ done, reviewed
`namaste-worklife/season-0-business/`

| # | Chapter |
|---|---------|
| 01 | What Is Work.Life? How a Coworking Business Makes Money ⭐ |
| 02 | The Numbers That Run a Coworking Business (KPIs) |
| 03 | Reading the Scoping Brief Like an Engineer |
| 04 | Who's Who: Client, Data Partner, Leadership & Us |

**Outcome:** the business model, the KPI dictionary, the brief turned into requirements, and the stakeholder map.

### Phase 1: The Source Systems, Hands-On Labs ✅ done, reviewed
`namaste-worklife/season-1-source-systems/`

| # | Chapter |
|---|---------|
| 05 | Build Your Own Mini Work.Life (The Lab Setup) |
| 06 | Excel: The Spreadsheets Nobody Talks About |
| 07 | Nexudus: The Heart of the Business ⭐ |
| 08 | ACT: The Mystery Source (Door Access or CRM?) |
| 09 | NetSuite: Where the Money Is Counted |
| 10 | HubSpot: The New Source of Truth for Members |
| 11 | One Member, Five Systems: IDs, Matching & the Final Exam ⭐ |

**Outcome:** the lab data, an understanding of each system, the ID crosswalk, and 12 questions for the client.

### Phase 2: The Pipeline ✅ written, reviewed
`namaste-worklife/season-2-pipeline/`

| # | Chapter |
|---|---------|
| 12 | ETL vs ELT and the Modern Data Stack |
| 13 | Fivetran: Connectors, Syncs & MAR Pricing |
| 14 | Python Extractors: Pulling Nexudus into BigQuery |
| 15 | Google BigQuery: The Warehouse |
| 16 | dbt: Raw → Staging → Intermediate → Marts |
| 17 | dbt in Depth: Sources, Tests, Docs & Lineage |
| 18 | The BI Layer: Tableau vs Metabase vs Looker |

**Outcome:** lab exports loaded into BigQuery and modelled into the shared marts (below).

### Phase 3: The AI Layer (client Phase 1) ✅ written, reviewed
`namaste-worklife/season-3-ai-layer/`, split into two parts:

| Part | # | Chapter |
|------|---|---------|
| 3a: Foundations & architecture | 19 | The Analytics Maturity Ladder: Descriptive → Activation |
| | 20 | Text-to-SQL: How an LLM Answers From a Warehouse |
| | 21 | The Semantic Layer: One Definition of "Revenue" |
| | 22 | Business Context: Board Pack, KPIs & Definitions |
| | 23 | Phase 1 Architecture on BigQuery ⭐ |
| 3b: Trust, safety & cost | 24 | Proactive Insight: Alerts, Digests & Trends |
| | 25 | Accuracy as a Launch Gate: Golden Questions & Actuals |
| | 26 | Security: SSO, IAM, Safe Data & What Never Gets Connected |
| | 27 | Cost Control: Tokens, BigQuery Bytes & Caps |
| | 28 | Source Agnostic: Swapping Nexudus Without Breaking AI |

**Outcome:** a Phase 1 design that meets all 8 of the brief's principles.

### Phase 4: Where It Goes Next (client Phase 2) ✅ written, reviewed
`namaste-worklife/season-4-phase-2/`

| # | Chapter |
|---|---------|
| 29 | Automating Member & Retention Reporting |
| 30 | Churn & Renewal Prediction + Context Packs |
| 31 | Forecasting: Resident Revenue, Seasonality, Meeting Rooms |
| 32 | Role-Based Access & Agents on Top |

**Outcome:** how Phase 1 extends without a rebuild. This is context only, so it isn't priced.

### Phase 5: Delivering the Project 🏆 ✅ written, reviewed
`namaste-worklife/season-5-delivery/`

| # | Chapter |
|---|---------|
| 33 | Answering the 10 Questions in Section 7 |
| 34 | The 3-Month and 6-Month Plan |
| 35 | Cost: Build and Run, Leadership vs Wider Team |
| 36 | Documentation & Handover |
| 37 | Client Call & Interview Questions |

**Outcome:** the written supplier response, plan, cost model, handover pack and call prep.

### Phase 7: Understand It All (domain reference) ✅ written
`namaste-worklife/season-6-understand-it-all/`

| # | Chapter |
|---|---------|
| 38 | The Work.Life Glossary: Every Term, One Page |
| 39 | Every Integration at Work.Life: What Flows Where, and Why |
| 40 | A Month in the Life of Work.Life: Every System, Day by Day |

**Outcome:** complete domain knowledge in one place: every term, every integration (with confidence labels), and the whole business in motion.

### Phase 8: Deep Dives ✅ written
`namaste-worklife/season-7-deep-dives/`

| # | Chapter |
|---|---------|
| 41 | Flex Workspace Economics: How a Site Makes (or Loses) Money |
| 42 | How Membership Billing Really Works: Contracts to Cash |
| 43 | Month-End Close and the Board Pack: How the Numbers Become Official |
| 44 | The Sales and Renewals Engine: From Enquiry to Re-Sign |

**Outcome:** how the business works inside: site economics, billing mechanics, the finance close, and the customer lifecycle.

### Phase 6: Review & publish 🔄 in progress
- Link the new chapters in `namaste-worklife/index.html` and update the progress counts.
- Cross-check consistency across seasons: mart names, cost figures, accuracy bar and plan dates.
- Fact-check against the two source documents and `lab-data/`.
- Push, then deploy to GitHub Pages.

---

## Shared design (all phases use these names)

| Thing | Name |
|-------|------|
| Marts | `dim_site`, `dim_company`, `dim_member`, `fct_contract_month`, `fct_booking`, `fct_gl`, `fct_site_month_kpis` |
| ID crosswalk | `member_xref` |
| The AI layer's only data source | BigQuery dataset `ai_safe`, a controlled copy of safe marts |
| Never connected | HR / people data; raw personal data (door events are aggregated only) |

## Writing rules

- Follow the format of the existing chapters:
  - `<h2>` title, a "Small Story First" section, then numbered `<h3>` sections
  - tables, ASCII diagrams, Interview Questions, Key Points, What's Next
- Client facts come only from the brief, the lab data and earlier chapters. Never invent names or numbers.
- Label every fact about Work.Life's internals as confirmed (brief), vendor-documented, inferred, or unknown (ask).
- Use they/them for people.
- Only the series index (`namaste-worklife/index.html`) decides what appears in the nav. Update it once a chapter is written.

---

## Viewing the series

**Online:** deployed with GitHub Pages from `main`, at the repo root.

**Locally:** browsers block `fetch()` from `file://`, so run a static server:

```bash
npx serve .
```

The viewer reads the chapter timeline in `namaste-worklife/index.html` to build the left nav. It renders each chapter with a table of contents and previous/next links, and opens every lab CSV as a sortable, filterable table.

On `*.github.io` it gets the file list from the GitHub API. Elsewhere, or if the API is unavailable, it checks each linked file directly. That fallback only knows the lab CSVs listed in `LAB_FILES` in `app.js`.
