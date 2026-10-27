# CLAUDE.md: Namaste Work.Life project context

Read this whole file before doing anything. It holds everything a new agent or session needs to continue the work.

---

## 1. What this repo is and why it exists

- **The project.** Work.Life is a UK flexible workspace / coworking company. Its leadership team wants to **ask questions about the business in plain English and trust the answers**: an AI layer on top of their BigQuery warehouse.
- **The user.** The repo owner will work on this real project next. **The goal is to deeply understand the domain, the business and how it works internally**: every term, every system, every integration. Accuracy and depth matter more than polish.
- **The series.** "Namaste Work.Life: Zero to Hero" is a tutorial series of Blogger-style HTML chapters. It is published on GitHub Pages through a small static viewer: https://shreyash510.github.io/workLifeDataAi/
- **Educational purposes only.** Keep the disclaimer in README.md and on the series home (namaste-worklife/index.html).

## 2. Hard rules

1. **Only allowed source of client facts:** `Work.Life-Data-AI-Infrastructure-Supplier-Scoping-Brief.docx` (July 2026). Python is not installed. To read the brief, use PowerShell to open the docx as a zip, read `word/document.xml`, and strip the tags.
2. **NEVER use `Work.Life-173tech.pdf`.** It is another company's proposal. Do not mention any of the following:
   - 173tech or "the deck"
   - Sam ("first analytics hire") or Jules
   - Bumble, MeUndies, Barbican
   - "173tech recommends Metabase"
   - "pipeline built 4+ years ago"
   - "Contracted / Contracted + Renewals"
   - a Xero → NetSuite migration stated as fact

   The brief only says the pipeline is "kept running by an external data partner" (unnamed). Metabase may be discussed as a BI option on its merits.
3. **Lab data** is `namaste-worklife/lab-data/*.csv`, a made-up "Mini Work.Life". Every lab number in a chapter must match the CSVs.
4. **Label every fact about Work.Life internals** as one of: confirmed (brief), vendor-documented, inferred, or unknown (ask the client). Mark invented numbers "(made up)".
5. **They/them for every person.** No invented names or titles for Work.Life staff.
6. **"ACT" is ambiguous** (ACT365 door access vs the Act! CRM). Never assert which one it is.
7. **Commit or push only when the user asks.** Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## 3. Repository layout

```
index.html, app.js, .nojekyll   Static viewer for GitHub Pages (plain JS, no build). Run locally: npx serve .
README.md                        Overview + phases (keep statuses current)
CLAUDE.md                        This file
namaste-worklife/
  index.html                     Series home + chapter timeline (.nz-step blocks). The viewer builds its nav from this.
  lab-data/                      13 CSVs: sites, plans, resources, companies, members, contracts, bookings_sep2026,
                                 netsuite_gl_sep2026, act_contacts, act_opportunities, act365_cardholders,
                                 act365_door_events_sep2026, excel_capacity_budget_2026
  season-0-business/             01–04
  season-1-source-systems/       05–11 (hands-on labs)
  season-2-pipeline/             12–18
  season-3-ai-layer/             19–28
  season-4-phase-2/              29–32
  season-5-delivery/             33–37
  season-6-understand-it-all/    38–40 (glossary, integration map, a month in the life)
  season-7-deep-dives/           41–44
```

The viewer works out which files exist from the GitHub tree API on `*.github.io`. Otherwise it probes each file the index links to. A new lab CSV must be added to `LAB_FILES` in `app.js`.

**Reading order** (the order in `namaste-worklife/index.html` and the nav, most important first): Season 0 → 6 → 7 → 1 → 2 → 3 → 4 → 5. Each season block carries a priority tag (🔴 MUST READ / 🟠 IMPORTANT / 🟡 USEFUL / ⚪ OPTIONAL). Keep this order when you add chapters.

## 4. Chapter list and status (as of 2026-10-27)

| Season | Ch | Files | Status |
|---|---|---|---|
| 0 Business & brief | 01–04 | how-worklife-makes-money, coworking-kpis, reading-the-scoping-brief, whos-who | written + reviewed |
| 1 Source systems (labs) | 05–11 | build-mini-worklife-lab, excel, nexudus, act, netsuite, hubspot, one-member-five-systems | written + reviewed |
| 2 Pipeline | 12–18 | etl-vs-elt, fivetran, python-extractors, bigquery, dbt-layers, dbt-in-depth, bi-layer | written + reviewed (Ch16 dropped unused stg plans/opportunities models → 22 models; code checked by reading, never run) |
| 3 AI layer (client Phase 1) | 19–28 | analytics-maturity-ladder, text-to-sql, semantic-layer, business-context, phase-1-architecture, proactive-insight, accuracy-launch-gate, security, cost-control, source-agnostic | written + reviewed |
| 4 Client Phase 2 | 29–32 | member-retention-reporting, churn-renewal-prediction, forecasting, role-based-access-agents | written + reviewed |
| 5 Delivery | 33–37 | answering-section-7, three-and-six-month-plan, cost-build-and-run, documentation-handover, client-call-interview-questions | written + reviewed |
| 6 Understand it all | 38–40 | glossary, integration-map, a-month-in-the-life | written + checked |
| 7 Deep dives | 41–44 | flex-workspace-economics, membership-billing, month-end-close-and-board-pack, sales-and-renewals | written + automated checks passed (not yet reviewed by a second agent) |

Filenames are `chapter-NN-<slug>.html` inside each season folder. Every chapter is already linked from `namaste-worklife/index.html`. Chapter 04's title is "Who's Who: Client, Data Partner, Leadership & Us".

## 5. Chapter format (every chapter)

- `<h2>Chapter NN — Title</h2>`
- "Hey everyone! Welcome back to <b>Namaste Work.Life</b>! 🙏", then an intro and a "What we will cover" list
- Numbered `<h3>` sections separated by `<hr/>`, starting with "1. A Small Story First"
- Tables as `<table border="1" cellpadding="10">` and ASCII diagrams in `<pre>`
- Ending sections: "Interview Questions" (Q in bold, answer in italics), a "Key Points to Remember" table, and "What's Next?"
- Sign-off: "Keep learning, keep building! See you in the next one!"
- Simple language, about 15–25 KB per chapter. Relative links between chapters.

## 6. Key facts from the brief

- **Size:** 14 UK sites, about 8,000 members, about 70 staff, B Corp. "We are not a data business, and we do not want to become one."
- **Stack:** Nexudus (largest source), NetSuite, ACT, Excel, with HubSpot being integrated and "expected to become the source of truth for member data". Data flows through Fivetran and Python into BigQuery, then dbt (raw, intermediate, modelled), then Tableau. Tableau is under review: "do not assume Tableau is fixed".
- **Maturity:** descriptive reporting is in place but static and rebuilt by hand. Diagnostic is limited. Predictive and prescriptive are not in place. Activation is minimal (a few alerts).
- **Phase 1:** plain-English questions with accurate answers, business context (board pack, KPIs, definitions), proactive insight, foresight. Leadership team first.
- **Phase 2 (context only, do not price):**
  - real-time member and retention reporting
  - churn and renewal prediction with context packs
  - forecasting: resident revenue projection, net member movements, seasonality, meeting room demand
  - role-based access and agents
- **8 principles:**
  - warehouse first, on a copy
  - source agnostic
  - safe data only
  - people/HR data excluded
  - accuracy is a launch gate
  - cost conscious ("cannot become a six figure operation")
  - secure by design (Work.Life accounts only)
  - documented and handover-ready
- **Out of scope:** member-facing AI, front-end finance automation, HR, Phase 2 build.
- **Section 7's 10 questions:** feasibility and approach, timeline (3 and 6 months), what you need from us, cost (build plus run, leadership vs wider team, token caps), security, accuracy, resilience, documentation and handover, support and resourcing, scalability.
- **Dates:** partner selected by mid-September 2026. A working, trusted Phase 1 by end of 2026. Response format: short written answers plus a call. "Honest > optimistic."

## 7. Canonical decisions (all chapters must agree)

- **Datasets** (BigQuery region `europe-west2`): `raw_nexudus`, `raw_netsuite`, `raw_excel`, `raw_act`, `raw_act365`, `staging`, `intermediate`, `marts`, `ai_safe`, `ai_logs`, `ai_eval`.
- **Marts:** `dim_site`, `dim_company`, `dim_member`, `member_xref`, `fct_contract_month` (one row per contract per month, active on the month's last day), `fct_booking`, `fct_gl` (`pl_category` is revenue / direct_cost / central_cost), and `fct_site_month_kpis`.
  - `fct_site_month_kpis` columns: `mrr_gbp`, `revenue_gbp`, `direct_costs_gbp`, `contribution_gbp`, `central_costs_gbp`, `contribution_after_central_gbp`, `revenue_vs_budget_gbp`, `desk_occupancy`, `sellable_desks`, `desks_contracted`, `has_finance_actuals`, and others.
  - The contract-movements model is `fct_contract_events` (Ch 29), with `movement_type` = new / upgrade / downgrade / transfer / renewal / churn.
  - Proposed attendance aggregate: `agg_company_week_attendance`, company × week with a minimum group size of 5.
- **`ai_safe`** (the AI reads ONLY this):
  - Contains: `dim_site`, `dim_company` (no billing email), `fct_site_month_kpis`, `fct_contract_month` (no member key), `fct_booking`, `fct_gl` (no memo or entity).
  - Excludes: `dim_member`, `member_xref`, door events, CRM contacts.
- **AI tools:** `query_metrics` (first choice), `run_sql` (fallback, answers labelled "Exploratory", max 200 rows), `get_business_context` (text only, never figures). The default period is the last closed month; an open month is labelled PROVISIONAL.
- **Launch gate:**
  - Tier 1 (core KPIs): 100% correct on the last 3 closed months.
  - Tier 2: at least 90% correct, with every miss a refusal or a caveat.
  - Tier 3 (must refuse): 100%.
  - Zero confidently wrong answers.
  - Finance signs off money answers; Ops signs off member and occupancy answers.
- **Cost assumptions** (estimates, "check current pricing"):
  - Leadership: 10 users × 8 questions/day × 21 days ≈ 1,680 questions/month ≈ £50/month in tokens.
  - Wider team: 70 users × 3 questions/day × 21 days ≈ £130/month.
  - BigQuery: about 67 GB/month. About £0.03 per question.
  - Ch 35 totals: leadership ≈ £22k/yr, wider team ≈ £42.5k/yr (mostly support). The build is 84 days ≈ £63k at a made-up £750 day rate.
- **Plan:** go-live by end of December 2026 (the 3-month mark). Handover at the end of March 2027 (the 6-month mark).
- **Client question numbering:** Ch 11 has #1–12, Ch 03 has #13–22, Ch 39 has #23–25. New questions start at #26 or stay unnumbered.

## 8. Lab truths (snapshot 30 Sep 2026)

- **Soho:**
  - MRR £3,040 (Pixel Chai Office 101 £2,400 + Ravi/Nomad £320 + Fatima/Kite & Key £320)
  - Invoiced £3,565 vs recognised £3,475 (−£90 credit memo CN-2609-01)
  - Direct costs £7,650; contribution −£4,175; after central −£5,175
  - −£5,725 vs budget (−62%)
  - Desk occupancy 6/34 = 17.6%; office occupancy 1/3
  - Brick Lane 9/220 = 4.1%
- **Reading:**
  - MRR £2,700 (GreenRoot Office 201, ends 31 Dec 2026)
  - Revenue £2,900; contribution +£450; after central −£50
  - Desk occupancy 6/31
- **Members:** by contract site, Soho 6 / Reading 6. By home site, Soho 5 / Reading 7.
- **Churn in 2026:**
  - 1 company: Brightline (2 people, £1,400 MRR, "moving to hybrid", notice 30 Apr, ended 30 Jun).
  - K001 was an upgrade and K006 a transfer, so neither is churn.
- **Sales pipeline:**
  - Open pipeline £7,000/month: GreenRoot renewal £2,800 (opened 2026-09-15) + Ortho Robotics £4,200.
  - Win rate 3/5. Pixel Chai discount 7.7% (£2,600 list → £2,400).
- **Door data:**
  - 276 door events in September.
  - GreenRoot weekly badge-in rate: 73% → 40% → 23% → ~0.
  - Door data is personal data; aggregate it at company level only.
- **Lab GL accounts:**
  - 4000 Office, 4010 Coworking, 4100 Meeting Rooms, 4200 Events (no Sep rows)
  - 5000 Rent, 5010 Rates, 5020 Service Charge, 5100 Utilities, 5200 Site Staff, 5300 Cleaning
  - 6000 Central Overheads
  - Expenses are stored as positive `amount_gbp`.

## 9. Open items / next steps

1. Season 2 review is DONE. Ch 16/17 are ~30 KB / ~25 KB.
2. Season 7 (41–44) is written; optionally have an agent review it. Known flags: the lab Soho budget (85% occupancy but only £9,200 revenue) is taught as a finance question in Ch 41; Ch 43 states FRS 102 lease changes apply from 2026 (verify); Ch 42 invents liability account numbers 2100/2200/2300 (labelled made up).
3. Re-run the whole-series checks (bash):
   - `grep -n -i -E "173tech|the deck|Jules|\bSam\b|Barbican" namaste-worklife/season-*/*.html` (expect nothing)
   - Tag balance for table / pre / ul / ol / p / tr / li per file
   - Every relative `href` to a chapter resolves
   - Each chapter has an `<h2>Chapter`, an "Interview Questions" section and the sign-off
   - Pronoun grep `\b(she|he|her|his|him)\b`
4. Update the README phase statuses (Phase 2 review, Phase 8 deep dives, Phase 6 review & publish).
5. Known gaps, flagged by reviewers and not yet built:
   - Season 2 has no `contract_end_date` column and no `is_period_closed` flag from NetSuite accounting periods.
   - Ch 23 recommends a separate GCP project for `ai_safe`; the Ch 17 lab uses views in the same project. Both are explained.
6. Ideas the user may want next: a data-model reference chapter (every mart table and column), a practice workbook, and one prioritised pack of client questions.
7. Publishing: push to `main`, then GitHub Settings → Pages → Deploy from branch `main` / root. The repo is private, so Pages needs a paid plan or a public repo, and the brief docx is marked "Commercial in confidence". Ask before making anything public.

## 10. Working style that worked

- Split big writing or review work across parallel agents, one season or chapter per agent, each owning distinct files. Give each one this file's rules.
- Only the coordinator edits `namaste-worklife/index.html` and `README.md`.
- Other agents or users may edit files at the same time. Re-read a file before editing it, and never revert someone else's change without asking.
