# Namaste Work.Life Knowledge Base — Part 2 of 2: Playbooks, Q&A and Lab Data

This part holds the hands-on playbooks (Integrations for engineers, Staff Training for new staff), the draft answers to the client questions, and the full lab CSV data.

> **For educational purposes only.** This is a personal learning resource, not an official Work.Life document and not affiliated with or endorsed by Work.Life or any supplier. All lab data, names and figures are made up. Designs, costs and plans are proposals, not what Work.Life uses or has agreed to. Vendor details and prices may be out of date. Nothing here is financial, legal or accounting advice.

## How to use this file

- Each document starts with a `#` heading and a `> Source file:` line. When you answer, name the chapter or guide you used (for example "Chapter 07" or "Integration Guide 05").
- Confidence labels used in the text: ✅ confirmed by the client scoping brief, 📘 vendor-documented, 🛠 our own standard or proposal, ❓ unknown, ask the client. "(made up)" marks an invented number.
- All money is in US dollars. The lab was converted from pounds at an assumed rate of 1 pound = 1.25 dollars (made up), so percentages and ratios are unchanged.
- The brief only says "ACT". It is not known whether that means ACT365 door access or the Act! CRM. Do not say which one the client uses.
- Work.Life is a UK coworking company with 14 sites, about 8,000 members and about 70 staff. The lab ("Mini Work.Life") has two made-up sites, Soho and Reading.

## Contents of this file

- Integration Guide 01 — Start Here: How We Set Up the Data Integrations
- Integration Guide 02 — Foundation: Google Cloud, BigQuery, Service Accounts and Secrets
- Integration Guide 03 — Fivetran Setup and the NetSuite Connector
- Integration Guide 04 — HubSpot to BigQuery
- Integration Guide 05 — Nexudus to BigQuery With a Python Extractor
- Integration Guide 06 — ACT and Excel: The Two Tricky Sources
- Integration Guide 07 — dbt: From Raw Data to Trusted Marts
- Integration Guide 08 — Scheduling, Monitoring and the Fix-It Runbook
- Integration Guide 09 — Go-Live and Handover Checklist
- Staff Training 01 — Start Here: Which System Does What
- Staff Training 02 — Nexudus for Front Desk and Community
- Staff Training 03 — Nexudus for Billing and Payments
- Staff Training 04 — HubSpot for Sales: Leads, Tours, Deals and Renewals
- Staff Training 05 — NetSuite for Finance: The Accounts and the Month-End Close
- Staff Training 06 — Door Access (ACT365) and the Act! CRM
- Staff Training 07 — Excel: The Budget and Capacity Sheets
- Staff Training 08 — Joiner, Mover, Leaver: What to Do in Every System
- Draft Answers to the Client Questions (Q&A)
- Lab Data (Mini Work.Life CSV files)

---

# Integration Guide 01 — Start Here: How We Set Up the Data Integrations

> Source file: `integrations/integration-01-start-here.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 This set of guides is a **handover playbook**. It shows, step by step, how to connect a coworking client's business systems to one data warehouse, clean the data, and show it in dashboards. It covers the data flow only (sources → loaders → BigQuery → dbt → BI). Any AI layer on top is a separate project and is not part of these guides.

It is written for an engineer who is setting this up **for a new client**, with the same kind of stack as Work.Life: Nexudus, NetSuite, HubSpot, ACT and Excel, loaded with Fivetran and Python into BigQuery, then modelled with dbt. If you follow the guides in order, you will end with a working, tested, documented pipeline that someone else can run.

⚠️ **Read this first.** This is **our standard setup**, built from the decisions made across this series. It is not a copy of Work.Life's real pipeline: the brief only says their data moves "through Fivetran and Python" and is "kept running by an external data partner". Which tool loads which system there is not confirmed. Vendor screens and prices change often, so always check the vendor's current docs before you click. All day counts and names of example clients in these guides are **made up**.

What we will cover in this guide:

-   The big picture: what you are building
-   The 9 guides and the order to do them in
-   A week-by-week plan
-   Questions to ask the client before you touch anything
-   The access request list
-   Naming rules (use these exactly)
-   The golden rules
-   The integration register
-   "Done" means done: the checklist for every integration
-   When to stop and ask

The labels you will see in every guide:

| Label | Meaning |
| --- | --- |
| ✅ Confirmed | Written in the Work.Life scoping brief |
| 📘 Vendor-documented | How the tool works, from the vendor's own docs. Check the current version. |
| 🛠 Our standard | Our own choice for how to set it up. You can change it, but write down why. |
| ❓ Ask the client | Unknown until the client tells you |

---

## 1. The Big Picture

Every integration in these guides does one job: copy data from a business system into BigQuery **without changing it**. All cleaning happens later, inside the warehouse, with dbt. This is called **ELT**: Extract, Load, then Transform (Chapter 12).

```
  SOURCE SYSTEMS              LOADERS                  BIGQUERY (europe-west2)
  ──────────────              ───────                  ───────────────────────

  NetSuite  (finance) ───┐                       ┌──► raw_netsuite ──┐
  HubSpot   (CRM)     ───┼──► Fivetran ──────────┼──► raw_hubspot  ──┤
  Excel / Sheets      ───┘    (Guides 03, 04, 06)└──► raw_excel    ──┤
                                                                     │   dbt (Guide 07)
  Nexudus   (members) ──────► Python on Cloud Run ──► raw_nexudus  ──┼──► staging
  ACT       (which one?) ───► Python or export   ──► raw_act365 /  ──┤    ──► intermediate
                              (Guides 05, 06)        raw_act       ──┘    ──► marts ──► BI dashboards
                                                                                        (Tableau today,
                                                                                         under review)
```

Three layers of work, in this order:

| Layer | What it means | Guides |
| --- | --- | --- |
| **Foundation** | Cloud projects, datasets, service accounts, secrets, budgets | 02 |
| **Loaders** | One integration per source system, each landing in its own `raw_*` dataset | 03, 04, 05, 06 |
| **Models and running it** | dbt models and tests, the nightly schedule, alerts, go-live and handover | 07, 08, 09 |

---

## 2. The 9 Guides and the Order to Do Them In

| Guide | What you build | Rough effort (made up) | Needs first |
| --- | --- | --- | --- |
| 01 Start Here | The plan, the questions, the access list (this page) | 1 day | Nothing |
| 02 Foundation | Google Cloud projects, BigQuery datasets, service accounts, Secret Manager, budgets | 1–2 days | 01 |
| 03 Fivetran + NetSuite | Fivetran account, BigQuery destination, NetSuite connector | 2–3 days | 02, NetSuite access |
| 04 HubSpot | HubSpot connector into `raw_hubspot` | 1 day | 03 (Fivetran ready) |
| 05 Nexudus | Python extractor on a Cloud Run job, with a watermark and retries | 3–5 days | 02, Nexudus API user |
| 06 ACT + Excel | Find out which ACT, load it safely; load the budget and capacity sheets | 2–3 days | 02, 03 |
| 07 dbt | Staging, intermediate, marts for the dashboards, tests, CI | 8–12 days | 03–06 loading |
| 08 Scheduling + Monitoring | Nightly run order, freshness checks, alerts, the fix-it runbook | 2–3 days | 05, 07 |
| 09 Go-Live + Handover | Reconciliation sign-off, docs, access handover, final checks | 3–5 days | All of the above |

💡 You can run Guides 03–06 side by side once Guide 02 is done. Start the **access requests on day one**: waiting for a NetSuite role or a Nexudus API user is the most common reason these projects slip.

---

## 3. A Week-by-Week Plan (made up)

```
  WEEK 1   Kick-off questions (section 4) · send access requests (section 5)
           Guide 02: projects, datasets, service accounts, secrets, budget alerts
  WEEK 2   Guide 03 + 04: Fivetran, NetSuite, HubSpot syncing
           Guide 05: Nexudus extractor running by hand
  WEEK 3   Guide 05: extractor on a schedule · Guide 06: ACT + Excel
           Guide 07: dbt project, sources, staging models
  WEEK 4   Guide 07: intermediate, marts, tests · connect the BI tool to marts
  WEEK 5   Guide 08: nightly order, alerts · reconcile numbers with the client
  WEEK 6   Guide 09: sign-off, docs, handover
```

This is a plan for one engineer on a client the size of Work.Life (about 14 sites, about 8,000 members, ✅ brief). A client with more sources, or messy data, takes longer. Tell the lead early if a week slips.

---

## 4. Before You Start: Questions to Ask the Client

Never design around a guess. Ask these in the first meeting and write the answers in the integration register (section 8).

| # | Question | Why it matters |
| --- | --- | --- |
| 1 | Which systems hold your data today, and which one is the "source of truth" for members, contracts, money and sales? | Decides which system wins when two disagree |
| 2 | Is anything already loading into a warehouse? Who runs it? Can we see it? | You may be extending a pipeline, not building one |
| 3 | When you say "ACT", do you mean ACT365 door access or the Act! CRM? | Two completely different systems (Chapter 08) |
| 4 | Which Excel files matter? Who owns them? How often do they change? | Excel files break pipelines when columns move |
| 5 | How fresh must the data be? Nightly, hourly, or real time? | Changes the tools, the schedule and the cost |
| 6 | How is a "site" tagged in finance (a NetSuite segment such as class, department or location)? | Without this you cannot build a P&L per site |
| 7 | When does a month "close" in finance? Who confirms it? | Open months change; answers must say "provisional" |
| 8 | Which data must never be loaded (HR, salaries, health, anything else)? | Some data should never enter the warehouse at all |
| 9 | Which cloud account and region must we use? Who pays the cloud bill? | Data should stay in the UK (europe-west2) and in the client's own account |
| 10 | Who signs off that the numbers are right: Finance for money, Ops for members and occupancy? | No sign-off, no go-live (Guide 09) |
| 11 | Which reports do you trust today? Can we have last month's copy? | These are the "golden numbers" your models must match |
| 12 | Who will own the pipeline after handover? | Shapes how much you document and train (Guide 09) |

---

## 5. The Access Request List

Send this list on day one. Ask for **read-only** access and a **separate integration user** for every system, never a staff member's personal login. If a staff member leaves, their login is turned off and your pipeline breaks.

| System | What to ask for | Usually given by (role) | Guide |
| --- | --- | --- | --- |
| Google Cloud | A project (or the right to create one) in the client's own organisation, with billing linked. Owner or editor rights for you during the build only. | IT / cloud admin | 02 |
| NetSuite | SuiteAnalytics Connect turned on, plus an integration user with a read-only custom role and token-based login 📘 | Finance systems admin | 03 |
| HubSpot | A super admin to approve the Fivetran connection (or a private app) with read scopes only 📘 | Marketing / CRM admin | 04 |
| Nexudus | A dedicated API user with read-only rights to only the modules needed 📘 | Ops / Nexudus admin | 05 |
| ACT | First, which ACT (question 3). Then an API key or an export, read-only. | Ops / IT | 06 |
| Excel | The files' location (SharePoint, OneDrive or Google Drive) and the owner's name for each file | Finance / Ops | 06 |
| Fivetran | Who owns the Fivetran account and pays for it (the client, not us) | IT / finance | 03 |
| Git | A repository in the client's own Git organisation | IT | 02 |

🛠 **Our standard:** every account, key and tool lives in the **client's** name and is paid by the client. On handover day nothing should depend on our own accounts. The brief asks for exactly this: "secure by design", Work.Life accounts only (✅ brief).

---

## 6. Naming Rules (Use These Exactly)

Every guide uses these names. Replace `<client>` with a short lowercase client code, for example `acme`.

| Thing | Name | Notes |
| --- | --- | --- |
| Data project (prod) | `<client>-data-prod` | Raw data, staging, intermediate, marts |
| Data project (dev) | `<client>-data-dev` | Your dbt work and CI test runs |
| Region | `europe-west2` (London) | Every dataset, every job, every bucket |
| Raw datasets | `raw_nexudus`, `raw_netsuite`, `raw_hubspot`, `raw_excel`, `raw_act365` or `raw_act` | One per source. Loaders write here and nowhere else. |
| Model datasets | `staging`, `intermediate`, `marts` | Written only by dbt |
| dbt dev / CI datasets | `dbt_<yourname>`, `ci_pr_<number>` | In the dev project |
| Service accounts | `sa-fivetran`, `sa-extract-nexudus`, `sa-extract-act`, `sa-dbt`, `sa-dbt-ci`, `sa-bi-reader` | One job, one account (Guide 02; `sa-dbt-ci` is added in Guide 07 for test runs) |
| Secrets | `nexudus-api-token`, `act-api-key`, `alert-webhook-url` | In Secret Manager, never in Git |
| Cloud Run jobs | `extract-nexudus`, `extract-act`, `dbt-build` | Guides 05, 06, 08 |
| Git repository | `<client>-data-platform` | One repo for everything (layout below) |

```
  <client>-data-platform/
  ├── README.md                 how to run everything, who owns what
  ├── docs/
  │   ├── integration-register.md   (section 8)
  │   ├── runbook.md                (Guide 08)
  │   └── decisions.md              every "why did we do it this way?"
  ├── infra/                    setup commands for projects, datasets, IAM (Guide 02)
  ├── extractors/
  │   ├── nexudus/              main.py, requirements.txt, Dockerfile (Guide 05)
  │   └── act/                  (Guide 06)
  ├── dbt/                      the dbt project (Guide 07)
  └── .github/workflows/        CI: dbt build on every pull request (Guide 07)
```

🛠 Why these exact names? Because the next person (maybe you in six months) should be able to guess where anything lives. Do not invent new names per client.

---

## 7. The Golden Rules

| # | Rule | Why |
| --- | --- | --- |
| 1 | **Read-only, always.** No loader ever writes back to a source system. | A bug in our code must never change a member's contract or an invoice |
| 2 | **Load raw, clean later.** Loaders do not rename, filter or fix data (one exception: door events, Guide 06). | If cleaning is wrong, you can rebuild from raw. If you cleaned while loading, the original is gone. |
| 3 | **Secrets never in Git**, chat or email. Only in Secret Manager or the tool's own vault. | One leaked Nexudus token can read every member's personal details |
| 4 | **One job, one service account**, with the smallest rights that work. | If one key leaks, the damage stays small |
| 5 | **Fail loudly.** A loader that fails must exit with an error and send an alert. Zero rows is suspicious. | The worst failure is a silent one: dashboards look fine but are a week old |
| 6 | **Protect personal data. HR data is not loaded at all.** Dashboards get only the personal details they truly need; door data goes in at company level only. | ✅ Brief principles: safe data only, people/HR data excluded |
| 7 | **Match the client's own reports** before you call a number right. | ✅ Brief: accuracy is a launch gate |
| 8 | **Write down every decision** in `docs/decisions.md` on the day you make it. | ✅ Brief: documented and handover-ready |
| 9 | **Watch the cost** from day one: budget alerts, Fivetran usage, query costs. | ✅ Brief: it "cannot become a six figure operation" |

---

## 8. The Integration Register

Keep one row per integration in `docs/integration-register.md`. Fill it in as you go. On handover day it is the first page the client's team reads (Chapter 39 has the Work.Life version).

| Source | Loader | Lands in | Schedule | Auth (where the secret lives) | Client owner (role) | Status |
| --- | --- | --- | --- | --- | --- | --- |
| NetSuite | Fivetran | `raw_netsuite` | Every 6 hours (made up) | Token-based, stored in Fivetran | Finance systems admin | ☐ syncing ☐ tested ☐ signed off |
| HubSpot | Fivetran | `raw_hubspot` | Every 6 hours (made up) | OAuth, stored in Fivetran | CRM admin | ☐ ☐ ☐ |
| Nexudus | Python, Cloud Run job | `raw_nexudus` | Daily 02:00 UK | `nexudus-api-token` in Secret Manager | Ops / Nexudus admin | ☐ ☐ ☐ |
| ACT (which one? ❓) | Python or export | `raw_act365` / `raw_act` | Daily or one-off | `act-api-key` in Secret Manager | Ops / IT | ☐ ☐ ☐ |
| Excel budget + capacity | Fivetran (Google Sheets or file) | `raw_excel` | Daily | Shared with the Fivetran account | Finance | ☐ ☐ ☐ |
| raw → marts | dbt | `staging` → `intermediate` → `marts` | Daily 03:00 UK (freshness check, then build) | `sa-dbt` | Data owner after handover | ☐ ☐ ☐ |

---

## 9. "Done" Means Done: The Checklist for Every Integration

An integration is not done when the first sync works. It is done when all of these are true. Every guide ends with its own version of this list.

| ☐ | Check |
| --- | --- |
| ☐ | Uses its own read-only integration user and its own service account |
| ☐ | No secret in Git, code, chat or email |
| ☐ | Lands only in its own `raw_*` dataset, in `europe-west2` |
| ☐ | Runs on a schedule with nobody touching it |
| ☐ | Fails loudly: you broke it on purpose once and the alert arrived |
| ☐ | Has a dbt source freshness test (Guide 07) |
| ☐ | Row counts match the source system's own count (or the gap is explained) |
| ☐ | Deletes and updates are handled (a deleted record does not live forever in raw) |
| ☐ | Time zones checked: raw times are UTC, and you know what the API sends |
| ☐ | The register row and the runbook entry are written |

---

## 10. When to Stop and Ask

Stop and ask the lead (do not guess) if:

-   A client asks you to use a personal login or to share a password.
-   You find HR, salary or health data in any source.
-   A number does not match the client's report and you cannot explain the gap within a day.
-   Something needs write access to a source system.
-   A tool's price or usage looks much higher than the plan (for example, Fivetran usage doubling in a week).
-   The client wants data copied to a region outside the UK, or into an account they do not own.

Asking early is cheap. Fixing a wrong design after go-live is not.

---

## What's Next?

Start with Guide 02 — Foundation: Google Cloud, BigQuery, Service Accounts and Secrets. Everything else is built on top of it. 🚀

Background reading in the series, if a step feels unclear: Chapter 12 (ELT), Chapter 39 (the integration map) and Chapter 36 (documentation and handover).

---

# Integration Guide 02 — Foundation: Google Cloud, BigQuery, Service Accounts and Secrets

> Source file: `integrations/integration-02-foundation-gcp-bigquery.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 This guide builds the **ground floor** that every other guide stands on. It is for the engineer who has finished Guide 01, has the client's answers to the kick-off questions, and now has access to the client's Google Cloud.

At the end of this guide you will have: two Google Cloud projects with billing linked, the right APIs turned on, every BigQuery dataset created in London (`europe-west2`), one service account per job with only the rights it needs, secrets stored safely, a place to keep job images, budget alerts, audit logs, and one script in `infra/` that can build all of it again.

⚠️ **Read this first.** This is **our standard setup** 🛠. Work.Life's real Google Cloud layout is not described in the brief: the brief only says data lands in BigQuery and is modelled with dbt (✅ brief). The commands below are correct as far as we know, but Google changes flags and console screens. If a command fails, check the current Google Cloud docs before you change anything else. We use `acme` as the made-up client code.

What we will cover:

-   Before you start: what you need
-   Step 1: Create the two projects and link billing
-   Step 2: Turn on the APIs
-   Step 3: Create the BigQuery datasets
-   Step 4: Google groups for humans
-   Step 5: Service accounts and their rights
-   Step 6: Secret Manager
-   Step 7: Artifact Registry for job images
-   Step 8: Budget alerts and query limits
-   Step 9: Audit logs
-   Step 10: Put it all in one script
-   Check it worked, common problems, and the "done when" list

---

## 1. Before You Start

| You need | Why | Where it comes from |
| --- | --- | --- |
| The client's Google Cloud **organisation ID** (or a folder ID) | Projects should live inside the client's own organisation, not a personal account | Client IT / cloud admin ❓ |
| A **billing account ID** (looks like `0X0X0X-0X0X0X-0X0X0X`) | Nothing in Google Cloud runs without billing linked | Client finance or cloud admin ❓ |
| Rights for you: Project Creator, Billing Account User, and Owner on the new projects **during the build only** | To create everything below | Client cloud admin (Guide 01, section 5) |
| The `gcloud` and `bq` command line tools | Every step below uses them | Install the Google Cloud CLI, then run `gcloud auth login` |
| The client's Git repository `acme-data-platform` | The setup script goes in `infra/` | Client IT |
| A budget number agreed with the client | For budget alerts | ❓ Ask the client |
| The client's group email names (for example `data-engineers@acme.com`) | Humans get rights through groups | Client IT (Google Workspace or Cloud Identity admin) ❓ |

Some words you will meet:

-   **Project**: a box in Google Cloud that holds resources and has its own bill and its own permissions.
-   **Dataset**: a folder inside BigQuery that holds tables and views. Permissions can be set per dataset.
-   **IAM** (Identity and Access Management): the system that says _who_ can do _what_ on _which_ thing. You give a **role** to a **principal** (a person, group or service account) on a **resource**.
-   **Service account**: a login for a program, not a person. Our jobs run as service accounts.
-   **Secret**: a password or API token, kept in Secret Manager and never in code.

Set some shell variables first, so you can copy every command below as it is:

```
export CLIENT=acme
export ORG_ID=123456789012                      # made up: ask the client
export BILLING=0X0X0X-0X0X0X-0X0X0X             # made up: ask the client
export REGION=europe-west2
export PROD=${CLIENT}-data-prod
export DEV=${CLIENT}-data-dev
```

---

## 2. Step 1: Create the Two Projects and Link Billing

🛠 Our standard uses two projects. Why two? The prod project holds the real data that dashboards read, and only service accounts write to it. The dev project keeps your experiments and test runs away from real numbers, with its own bill, so you can see what development costs.

| Project | Holds |
| --- | --- |
| `acme-data-prod` | `raw_*`, `staging`, `intermediate`, `marts`; the Cloud Run jobs; the secrets |
| `acme-data-dev` | `dbt_<yourname>` and `ci_pr_<number>` datasets |

```
for P in $PROD $DEV; do
  gcloud projects create $P --organization=$ORG_ID --labels=client=$CLIENT,owner=data-platform
  gcloud billing projects link $P --billing-account=$BILLING
done
```

What you should see: `Create in progress for [https://cloudresourcemanager.googleapis.com/v1/projects/acme-data-prod]`, then a line showing `billingEnabled: true` for each link.

💡 Project IDs are **unique across all of Google Cloud** and can never be reused, even after deletion. If `acme-data-prod` is taken, add a short suffix (for example `acme-data-prod-01`), and write the real IDs in `docs/decisions.md`. If the client wants projects in a folder, use `--folder=FOLDER_ID` instead of `--organization`.

---

## 3. Step 2: Turn On the APIs

An **API** here is a Google Cloud service. Each one is off until you turn it on in a project.

| API | Used for | Projects |
| --- | --- | --- |
| `bigquery.googleapis.com` | The warehouse | both |
| `bigquerystorage.googleapis.com` | Fast reads (dbt, BI tools) | both |
| `iam.googleapis.com`, `iamcredentials.googleapis.com` | Service accounts and short-lived tokens | both |
| `cloudresourcemanager.googleapis.com` | Reading and setting project permissions | both |
| `logging.googleapis.com`, `monitoring.googleapis.com` | Logs and alerts (Guide 08) | both |
| `run.googleapis.com` | Cloud Run jobs (extractors, dbt) | data-prod |
| `cloudscheduler.googleapis.com` | The nightly timer (Guide 08) | data-prod |
| `secretmanager.googleapis.com` | Secrets | data-prod |
| `artifactregistry.googleapis.com`, `cloudbuild.googleapis.com` | Building and storing job images | data-prod |
| `billingbudgets.googleapis.com` | Budget alerts from the command line | data-prod (the project your gcloud uses) |

```
COMMON="bigquery.googleapis.com bigquerystorage.googleapis.com iam.googleapis.com \
  iamcredentials.googleapis.com cloudresourcemanager.googleapis.com \
  logging.googleapis.com monitoring.googleapis.com"

for P in $PROD $DEV; do
  gcloud services enable $COMMON --project=$P
done

gcloud services enable run.googleapis.com cloudscheduler.googleapis.com \
  secretmanager.googleapis.com artifactregistry.googleapis.com \
  cloudbuild.googleapis.com billingbudgets.googleapis.com --project=$PROD
```

Check: `gcloud services list --enabled --project=$PROD` should list all of them. Turning on an API can take a minute or two.

---

## 4. Step 3: Create the BigQuery Datasets

📘 A dataset's **location is fixed when you create it**. You cannot move a dataset later; you would have to copy every table into a new one. So always pass `--location=europe-west2`. Every dataset gets a description (people read it in the console) and labels (so the bill can be split by layer).

```
mkds () {   # usage: mkds PROJECT DATASET LAYER "description"
  bq --location=$REGION mk --dataset \
     --description="$4" \
     --label=client:$CLIENT --label=layer:$3 \
     $1:$2
}

# Raw: one per source. Loaders write here and nowhere else.
mkds $PROD raw_nexudus  raw "Raw Nexudus API data. Written only by sa-extract-nexudus. Do not edit."
mkds $PROD raw_netsuite raw "Raw NetSuite data. Written only by Fivetran (sa-fivetran)."
mkds $PROD raw_hubspot  raw "Raw HubSpot data. Written only by Fivetran (sa-fivetran)."
mkds $PROD raw_excel    raw "Raw budget and capacity sheets. Written only by Fivetran."
mkds $PROD raw_act365   raw "Raw ACT data. Name depends on which ACT (Guide 06). Written only by sa-extract-act."

# Models: written only by dbt
mkds $PROD staging      staging      "dbt staging models: renamed, typed, de-duplicated. Written only by sa-dbt."
mkds $PROD intermediate intermediate "dbt intermediate models. Written only by sa-dbt."
mkds $PROD marts        marts        "dbt marts: the tables BI reads. Written only by sa-dbt."
```

What you should see for each: `Dataset 'acme-data-prod:raw_nexudus' successfully created.`

Notes:

-   ❓ **ACT:** only create `raw_act365` (door access) or `raw_act` (CRM) once the client has told you which ACT they mean (Guide 01, question 3). Do not guess. If they use both, create both.
-   🛠 We pre-create the raw datasets for Fivetran so it does not need rights to create datasets. Fivetran's setup may still ask for wider rights; check Fivetran's current BigQuery destination docs in Guide 03.
-   🛠 dev datasets (`dbt_<yourname>`, `ci_pr_<number>`) are created by dbt itself in Guide 07. Set a **default table expiry** on CI datasets so old ones clean themselves up, for example `bq update --default_table_expiration 259200 acme-data-dev:ci_pr_12` (3 days, in seconds).

---

## 5. Step 4: Google Groups for Humans

🛠 **Humans get rights through groups, never one by one.** When someone joins, IT adds them to a group. When they leave, IT removes them, and every right goes with them in one move. Humans use their **own** Google accounts; they never log in as a service account.

Ask client IT to create these groups (the names are our standard; the client may have its own naming ❓):

| Group | Who | data-prod | data-dev |
| --- | --- | --- | --- |
| `data-engineers@acme.com` | People who build and fix the pipeline | BigQuery Job User; Data Viewer (project); Cloud Run Developer; Logs Viewer; Monitoring Editor | BigQuery Job User; BigQuery Data Editor (project) |
| `data-analysts@acme.com` | People who build reports | BigQuery Job User; Data Viewer on `marts` only (no `raw_*`, so no member contact details or door events) | BigQuery Job User; Data Editor on their own `dbt_<name>` |
| `data-admins@acme.com` | One or two client owners after handover | Owner | Owner |
| `billing-viewers@acme.com` | Finance, to see the cloud bill | Billing Account Viewer (on the billing account, not the projects) |  |

⚠️ No human group has **write** rights on the prod datasets. Only service accounts write to prod. If an engineer must fix a table by hand in an emergency, a data admin grants it for that day and removes it after, and it goes in `docs/decisions.md`.

```
G=group:data-engineers@acme.com
for R in roles/bigquery.jobUser roles/bigquery.dataViewer roles/run.developer \
         roles/logging.viewer roles/monitoring.editor; do
  gcloud projects add-iam-policy-binding $PROD --member=$G --role=$R --condition=None
done
for R in roles/bigquery.jobUser roles/bigquery.dataEditor; do
  gcloud projects add-iam-policy-binding $DEV --member=$G --role=$R --condition=None
done
```

📘 To deploy a Cloud Run job that runs as a service account, the person deploying also needs **Service Account User** on that service account. Give it to `data-engineers` on each job's service account (Step 5).

---

## 6. Step 5: Service Accounts and Their Rights

🛠 **One job, one service account**, with the smallest rights that work (Golden Rule 4). Two kinds of grant:

-   **BigQuery Job User on a project**: lets the account _run_ queries and load jobs in that project. It does not let it see any data.
-   **Data Viewer / Data Editor on a dataset**: lets the account _read_ or _write_ tables in that one dataset.

| Service account | Lives in | Project roles | Dataset and secret roles | Runs |
| --- | --- | --- | --- | --- |
| `sa-fivetran` | data-prod | Job User (data-prod) | Data Editor on `raw_netsuite`, `raw_hubspot`, `raw_excel` | Fivetran loads |
| `sa-extract-nexudus` | data-prod | Job User (data-prod) | Data Editor on `raw_nexudus`; Secret Accessor on `nexudus-api-token` | Cloud Run job `extract-nexudus` |
| `sa-extract-act` | data-prod | Job User (data-prod) | Data Editor on `raw_act365` / `raw_act`; Secret Accessor on `act-api-key` | Cloud Run job `extract-act` |
| `sa-dbt` | data-prod | Job User (data-prod, data-dev) | Data Viewer on every `raw_*`; Data Editor on `staging`, `intermediate`, `marts` | Cloud Run job `dbt-build` |
| `sa-bi-reader` | data-prod | Job User (data-prod) | Data Viewer on `marts` only. **No rights on `raw_*`, `staging` or `intermediate`.** | The BI tool (dashboards) |

### 5a. Create the accounts

```
for SA in sa-fivetran sa-extract-nexudus sa-extract-act sa-dbt sa-bi-reader; do
  gcloud iam service-accounts create $SA --project=$PROD --display-name="$SA"
done

# a helper to build the full email
sa () { echo "serviceAccount:$1@$2.iam.gserviceaccount.com"; }
```

### 5b. Project-level Job User

```
for SA in sa-fivetran sa-extract-nexudus sa-extract-act sa-dbt sa-bi-reader; do
  gcloud projects add-iam-policy-binding $PROD --member=$(sa $SA $PROD) \
    --role=roles/bigquery.jobUser --condition=None
done
gcloud projects add-iam-policy-binding $DEV --member=$(sa sa-dbt $PROD) \
  --role=roles/bigquery.jobUser --condition=None
```

### 5c. Dataset-level roles

The simplest way that works today is BigQuery's own `GRANT` statement (📘 "BigQuery DCL"). You run it as a query in the dataset's region. In BigQuery SQL a dataset is called a **schema**.

```
grant () {  # usage: grant PROJECT DATASET ROLE MEMBER
  bq query --project_id=$1 --location=$REGION --use_legacy_sql=false \
    "GRANT \`roles/bigquery.$3\` ON SCHEMA \`$1.$2\` TO \"$4\""
}

# Loaders: write their own raw dataset only
for D in raw_netsuite raw_hubspot raw_excel; do
  grant $PROD $D dataEditor "$(sa sa-fivetran $PROD)"
done
grant $PROD raw_nexudus dataEditor "$(sa sa-extract-nexudus $PROD)"
grant $PROD raw_act365  dataEditor "$(sa sa-extract-act $PROD)"

# dbt: read raw, write the model layers
for D in raw_nexudus raw_netsuite raw_hubspot raw_excel raw_act365; do
  grant $PROD $D dataViewer "$(sa sa-dbt $PROD)"
done
for D in staging intermediate marts; do
  grant $PROD $D dataEditor "$(sa sa-dbt $PROD)"
done

# Readers: marts only
grant $PROD marts dataViewer "$(sa sa-bi-reader $PROD)"
grant $PROD marts dataViewer "group:data-analysts@acme.com"
```

What you should see: `Waiting on bqjob_... (0s) Current status: DONE` for each grant. Another way to do the same thing is the console: BigQuery → click the dataset → **Sharing** → **Permissions** → **Add principal**.

⚠️ `sa-bi-reader` gets `marts` and nothing else. That is the whole point: the raw datasets hold personal data (member names and emails from Nexudus and HubSpot, and door events if ACT is ACT365). Even a badly built dashboard cannot reach them, because the account simply has no rights there. Personal data that must stay out of dashboards is also kept out of `marts` by dbt (Guide 07), and door data only reaches `marts` as company-level totals. Never "fix" a missing column by giving `sa-bi-reader` access to `raw_*`; add the column to a mart through dbt instead.

### 5d. Let engineers deploy jobs that run as these accounts

```
for SA in sa-extract-nexudus sa-extract-act sa-dbt; do
  gcloud iam service-accounts add-iam-policy-binding $SA@$PROD.iam.gserviceaccount.com \
    --member=group:data-engineers@acme.com --role=roles/iam.serviceAccountUser --project=$PROD
done
```

### 5e. No key files

🛠 A **service account key** is a JSON file that works like a password forever. Our jobs run **on** Google Cloud as their service account, so they never need a key. The one likely exception is Fivetran: depending on how you connect it, it may ask for a key for `sa-fivetran` or offer to use its own Google service account instead (📘 check Fivetran's docs in Guide 03). If a key is needed, create it, paste it straight into Fivetran, delete the file from your laptop, and write that in `docs/decisions.md`. Never put it in Git. The same rule covers the second possible exception, the BI tool: if it cannot sign in to BigQuery any other way, a key for `sa-bi-reader` goes only into the BI tool's own credential store, owned by the client (Guide 09). For GitHub Actions CI, use **Workload Identity Federation** (a keyless login from GitHub to Google), covered in Guide 07.

---

## 7. Step 6: Secret Manager

📘 Secret Manager stores secrets with **versions**: when you rotate a token, you add a new version and turn off the old one. We keep secret copies in London only.

```
for S in nexudus-api-token act-api-key alert-webhook-url; do
  gcloud secrets create $S --project=$PROD \
    --replication-policy=user-managed --locations=$REGION \
    --labels=client=$CLIENT
done

# Add the real value WITHOUT it landing in your shell history:
read -s -p "Paste Nexudus token: " TOKEN; echo
printf '%s' "$TOKEN" | gcloud secrets versions add nexudus-api-token --project=$PROD --data-file=-
unset TOKEN
# do the same for act-api-key (once you know which ACT) and alert-webhook-url (Guide 08)

# Only the job that needs a secret can read it
gcloud secrets add-iam-policy-binding nexudus-api-token --project=$PROD \
  --member=$(sa sa-extract-nexudus $PROD) --role=roles/secretmanager.secretAccessor
gcloud secrets add-iam-policy-binding act-api-key --project=$PROD \
  --member=$(sa sa-extract-act $PROD) --role=roles/secretmanager.secretAccessor
```

Notes:

-   Use `printf '%s'`, not `echo`: `echo` adds a line break at the end, and the API will reject the token with a 401 that is very hard to spot.
-   The token itself comes from the client's Nexudus admin, created for a dedicated read-only API user (Guide 05). Ask them to share it through a password manager, not email or chat.
-   `alert-webhook-url` holds the chat webhook address used for alerts. It is a secret because anyone with the URL can post into the client's chat. Guide 08 explains who reads it.
-   Engineers get **no** Secret Accessor role. If you must check a value, a data admin does it.

---

## 8. Step 7: Artifact Registry for Job Images

A Cloud Run job runs a **container image**: a packed copy of your code and its libraries. Artifact Registry is where those images are stored. 🛠 We use one Docker repository called `data-jobs` (this name is ours; change it if the client has a rule).

```
gcloud artifacts repositories create data-jobs --project=$PROD \
  --repository-format=docker --location=$REGION \
  --description="Images for extract-nexudus, extract-act and dbt-build"

# Your image names will look like:
#   europe-west2-docker.pkg.dev/acme-data-prod/data-jobs/extract-nexudus:2026-10-28
```

💡 Add a cleanup policy so old images do not pile up (📘 Artifact Registry "cleanup policies", for example keep the latest 10 versions). It is a small cost, but small costs add up.

---

## 9. Step 8: Budget Alerts and Query Limits

✅ The brief says the work "cannot become a six figure operation". 🛠 We guard cost in two ways from day one.

### 8a. A budget with alerts

```
gcloud billing budgets create --billing-account=$BILLING \
  --display-name="$CLIENT data platform" \
  --budget-amount=375USD \
  --filter-projects=projects/$PROD,projects/$DEV \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 \
  --threshold-rule=percent=1.0,basis=forecasted-spend
```

The $375/month is **made up**; use the number the client agreed. The currency must match the billing account's currency. By default the alert emails go to the billing account admins; to send them to the data team too, add a Cloud Monitoring notification channel with `--notifications-rule-monitoring-notification-channels` (check the current docs; Guide 08 creates the channels).

⚠️ 📘 A budget only **warns**. It does not stop spending. That is why we also set limits.

### 8b. BigQuery query limits (custom quotas)

📘 BigQuery lets you cap how many bytes queries can scan per day, for the whole project and per user. Set these in the console: **IAM & Admin → Quotas & System Limits**, filter for **BigQuery API**, then find **Query usage per day** and **Query usage per day per user**, tick it and click **Edit**. (The screen names change from time to time; check the current docs.)

| Project | Per day, whole project (made up) | Per user per day (made up) |
| --- | --- | --- |
| data-prod | 500 GB | 100 GB |
| data-dev | 200 GB | 50 GB |

For scale: a client the size of Work.Life has small tables (thousands of members, not billions of rows), so a nightly dbt build plus normal dashboard use should scan far less than this. Measure your real use for two weeks with the query in Guide 08, section 8, then set the caps a few times above it, so they only bite when something goes wrong. When a cap is hit, queries fail with a quota error until the next day (Pacific time, 📘). Tell the team that, so they do not think the warehouse is broken.

---

## 10. Step 9: Audit Logs

An **audit log** records who did what and when. 📘 Two kinds matter:

| Log | Records | On by default? |
| --- | --- | --- |
| Admin Activity | Changes: creating datasets, granting roles, deploying jobs | Yes, always on, cannot be turned off |
| Data Access (BigQuery) | Who read or queried which data | Yes for BigQuery |
| Data Access (other services, for example Secret Manager) | Who read a secret | **No**: turn it on |

Turn on Data Access logs for Secret Manager in each project: **IAM & Admin → Audit Logs**, tick **Secret Manager API**, tick **Data Read**, click **Save**. 📘 Default keeping times are about 400 days for Admin Activity and 30 days for Data Access (check current docs). If the client needs longer, ask the lead before adding a log sink, because stored logs cost money.

Why this matters: when a leaver's access is reviewed, or the client asks "who looked at member data?", the answer is here.

---

## 11. Step 10: Put It All in One Script

🛠 Everything above goes into `infra/setup.sh` in the client's repo, so the next engineer can read exactly what was built, and rebuild it. Keep the helpers (`mkds`, `sa`, `grant`) at the top.

```
acme-data-platform/infra/
├── setup.sh          projects, APIs, datasets, service accounts, grants, secrets (empty), registry
├── budget.sh         the budget (run once, needs billing rights)
├── config.env        CLIENT, ORG_ID, BILLING, REGION  (IDs only, NO secrets)
└── README.md         how to run it, what it does NOT do (quotas, audit log ticks, group creation)
```

```
#!/usr/bin/env bash
# infra/setup.sh  -  safe to re-run: "already exists" errors are ignored
set -uo pipefail
source "$(dirname "$0")/config.env"
PROD=${CLIENT}-data-prod; DEV=${CLIENT}-data-dev

step () { echo; echo "=== $1 ==="; }
try  () { "$@" 2>&1 | grep -v -i "already exists" || true; }

step "Projects";         for P in $PROD $DEV; do try gcloud projects create $P --organization=$ORG_ID; done
step "Billing";          for P in $PROD $DEV; do gcloud billing projects link $P --billing-account=$BILLING; done
step "APIs";             # ... Step 2 commands
step "Datasets";         # ... Step 3 commands, each wrapped in try
step "Service accounts"; # ... Step 5a, wrapped in try
step "Grants";           # ... Steps 4, 5b, 5c, 5d (grants are safe to repeat)
step "Secrets";          # ... Step 6 create + accessor grants (NOT the values)
step "Registry";         # ... Step 7
echo "Done. Now run the checks in Guide 02, section 12."
```

Rules for this script:

-   **No secret values** in it, ever. Secrets are added by hand with `read -s` as in Step 6.
-   Run it through a pull request like any code change, so there is a record.
-   Things that only the console can do (quotas, audit log ticks) go in `infra/README.md` as a checklist.
-   💡 Bigger teams use **Terraform** (a tool that describes cloud setup as files) instead of a shell script. That is fine too; a shell script is simpler to hand over to a small team. Write the choice in `docs/decisions.md`.

---

## 12. Check It Worked

Run each check and compare with "you should see".

| # | Command | You should see |
| --- | --- | --- |
| 1 | `gcloud billing projects describe acme-data-prod` | `billingEnabled: true` (repeat for dev) |
| 2 | `bq ls --project_id=acme-data-prod` | The 5 raw datasets (or 4, plus the right ACT one), `staging`, `intermediate`, `marts` |
| 3 | `bq ls --project_id=acme-data-dev` | Empty for now (dbt creates `dbt_<yourname>` in Guide 07) |
| 4 | `bq show --format=prettyjson acme-data-prod:raw_nexudus \| grep -E '"location"\|"description"'` | `"location": "europe-west2"` and your description. Check every dataset. |
| 5 | `gcloud iam service-accounts list --project=acme-data-prod` | Your 5 accounts (plus any default accounts Google made) |
| 6 | `gcloud iam service-accounts keys list --iam-account=sa-dbt@acme-data-prod.iam.gserviceaccount.com --managed-by=user` | Nothing. No user-made keys (repeat per account; only `sa-fivetran` may have one, if Fivetran needs it) |
| 7 | Project roles for one account (below) | `roles/bigquery.jobUser` only |
| 8 | Dataset grants (below) | Only the members in the table in Step 5 |
| 9 | `gcloud secrets list --project=acme-data-prod` and `gcloud secrets get-iam-policy nexudus-api-token --project=acme-data-prod` | 3 secrets; only `sa-extract-nexudus` as accessor on the Nexudus token |
| 10 | `gcloud artifacts repositories list --project=acme-data-prod --location=europe-west2` | `data-jobs`, format DOCKER |
| 11 | `gcloud billing budgets list --billing-account=$BILLING` | Your budget with 4 threshold rules |

```
# 7. Project roles held by one service account
gcloud projects get-iam-policy acme-data-prod \
  --flatten="bindings[].members" \
  --filter="bindings.members:sa-extract-nexudus@" \
  --format="table(bindings.role)"

# 8. Who has rights on one dataset
bq query --project_id=acme-data-prod --location=europe-west2 --use_legacy_sql=false '
SELECT object_name, privilege_type, grantee
FROM `acme-data-prod`.`region-europe-west2`.INFORMATION_SCHEMA.OBJECT_PRIVILEGES
WHERE object_name = "raw_nexudus"'
```

💡 **The negative test** is the one that matters most. Once Guide 07 has built `marts`, prove that `sa-bi-reader` **can** read `marts` but **cannot** read raw data. One way is to impersonate the account (you need the Service Account Token Creator role on it for a short time; check current docs for how `bq` picks up impersonation). Run ``SELECT 1 FROM `acme-data-prod.marts.dim_site` LIMIT 1``: it should work. Then run ``SELECT 1 FROM `acme-data-prod.raw_nexudus.<any table>` LIMIT 1`` and the same on `raw_act365` (door events): you should get **Access Denied**. Remove your Token Creator role after. Write the result, with the date, in `docs/decisions.md`.

---

## 13. Common Problems and Fixes

| Problem | Likely cause | Fix |
| --- | --- | --- |
| `The project ID you specified is already in use by another project` | Project IDs are global and never reused | Add a suffix (`-01`), record the real ID in `docs/decisions.md` and `infra/config.env` |
| `Cloud billing quota exceeded` when linking | The billing account has a limit on linked projects | Ask the client's billing admin to raise it, or ask Google support |
| `API [x] not enabled on project` | Step 2 missed for that project | Enable it; wait a minute; retry |
| A dataset was made in `US` or `EU` | `--location` forgotten | Delete it while it is still empty and create it again in `europe-west2`. If it has data, copy the tables, then delete. |
| Query error: `Not found: Dataset ... was not found in location europe-west2` | Query running in a different location from the dataset | Pass `--location=europe-west2` to `bq query`; in the console set the location under **More → Query settings** |
| `Access Denied: ... User does not have bigquery.jobs.create permission` | Missing Job User in the project where the query runs | Grant Job User in **that** project (the billing project of the query, not the data project) |
| `Permission iam.serviceAccounts.actAs denied` when deploying a job | Deployer lacks Service Account User on the job's account | Step 5d |
| `Constraint iam.disableServiceAccountKeyCreation violated` | The client's organisation blocks key files (good!) | Use Fivetran's own service account option instead of a key, or ask client IT for a one-off exception |
| Extractor gets 401 from Nexudus although the token is right | Line break saved with the secret (`echo` instead of `printf`) | Add a new secret version with `printf '%s'`; disable the old version |
| Budget command fails on currency | Amount currency differs from the billing account currency | Use the billing account's currency code |

---

## 14. Done When

| ☐ | Check |
| --- | --- |
| ☐ | Two projects exist in the client's organisation, all with billing linked, all paid by the client |
| ☐ | Every dataset exists, in `europe-west2`, with a description and labels |
| ☐ | The ACT dataset name matches the client's confirmed answer (not a guess) |
| ☐ | Humans get rights only through groups; no human has write rights on prod datasets |
| ☐ | 5 service accounts exist; each has exactly the rights in the Step 5 table |
| ☐ | No service account key files exist (or only one each for Fivetran and the BI tool, recorded in `docs/decisions.md`) |
| ☐ | `sa-bi-reader` can read `marts` and gets Access Denied on `raw_*` (negative test done and dated) |
| ☐ | 3 secrets exist in London; only the right account can read each one |
| ☐ | The `data-jobs` Artifact Registry repository exists in `europe-west2` |
| ☐ | Budget with alerts at 50 / 90 / 100% (and forecast) is set; query quotas are set on both projects |
| ☐ | Secret Manager Data Access logs are on |
| ☐ | `infra/setup.sh`, `config.env` and `infra/README.md` are merged in Git, with no secrets in them |
| ☐ | Every check in section 12 passed, and the real project IDs are in `docs/decisions.md` |
| ☐ | Your own Owner rights are listed in `docs/decisions.md` as "remove at handover" (Guide 09) |

---

## What's Next?

The ground floor is built. Next, connect the first source: Guide 03 — Fivetran + NetSuite, where `sa-fivetran` and `raw_netsuite` get their first real data. 🚀

Back to the plan: Guide 01 — Start Here. Background in the series: Chapter 14 (secrets and least privilege), Chapter 15 (BigQuery: locations, costs and permissions) and Chapter 39 (the integration map).

---

# Integration Guide 03 — Fivetran Setup and the NetSuite Connector

> Source file: `integrations/integration-03-fivetran-netsuite.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 This guide is for the engineer who has finished Guide 02 (projects, datasets and service accounts exist) and now needs the client's finance data in BigQuery.

At the end you will have: a Fivetran account owned by the client, a BigQuery destination in `<client>-data-prod` (`europe-west2`), and a NetSuite connector that copies the general ledger, accounts and accounting periods into `raw_netsuite` on a schedule, with failure emails, a cost check and a trial-balance test that matches NetSuite's own report.

⚠️ **Read this first.** This is **our standard setup**. The Work.Life brief only says data moves "through Fivetran and Python" (✅ brief). It does not say which tool loads NetSuite, so Work.Life's real setup is not confirmed. Fivetran and NetSuite change their screens, menu names and prices often. Every click path below is 📘 "at the time of writing": **check the current Fivetran and NetSuite docs** before you click. All numbers marked (made up) are examples only.

What we will cover in this guide:

-   Words you need (connector, destination, MAR, SuiteAnalytics Connect, token-based login)
-   Before you start: the needs list
-   Part A: the Fivetran account and the BigQuery destination
-   Part B: prepare NetSuite (feature, role, user, integration record, token)
-   Part C: create the NetSuite connector and choose tables
-   Schedule, alerts and schema-change settings
-   The first sync, history and re-syncs
-   Check it worked (row counts and a trial balance)
-   Common problems and fixes
-   Cost check
-   Done when

---

## 1. Words You Need

| Word | Simple meaning |
| --- | --- |
| **Fivetran** | A paid service that copies data from business tools into a warehouse with no code. It does the E and L of ELT (Chapter 13). |
| **Destination** | Where Fivetran writes. For us: one BigQuery project. You set it up once and every connector reuses it. |
| **Connector** (Fivetran also says "connection") | One link from one source account, for example "NetSuite production". |
| **Destination schema** | Fivetran's word for the BigQuery **dataset** a connector writes into. We want `raw_netsuite`. |
| **Sync** | One run of a connector. The first one copies everything (historical sync); later ones copy only changes (incremental sync). |
| **MAR** (monthly active rows) | How Fivetran charges: each row added, changed or deleted in a calendar month counts once that month 📘. |
| **SuiteAnalytics Connect** | A NetSuite feature that lets outside tools read NetSuite data with SQL (through ODBC/JDBC drivers) from the `NetSuite2.com` data source 📘. The Fivetran NetSuite connector reads through it (📘 confirm in Fivetran's NetSuite setup guide). |
| **Token-based authentication (TBA)** | A way to log in without a password: an **integration record** gives a consumer key and secret; an **access token** for one user and one role gives a token ID and secret. Together they let Fivetran log in as the integration user 📘. |
| **Role** | A NetSuite bundle of permissions. We make a **custom read-only role** just for Fivetran. |

---

## 2. Before You Start: The Needs List

| ☐ | You need | From (role) |
| --- | --- | --- |
| ☐ | Guide 02 done: `<client>-data-prod` exists, dataset `raw_netsuite` exists in `europe-west2`, `sa-fivetran` exists | You |
| ☐ | A Fivetran account in the **client's** name, paid by the client, with you invited as a user | IT / finance |
| ☐ | A NetSuite administrator who can turn on features, create roles, users, integration records and tokens (you will probably watch them do it) | Finance systems admin |
| ☐ | Answers to: which segment is "the site" (subsidiary, location, department, class or a custom segment)? ❓ When does a month close and who confirms it? ❓ Is there more than one subsidiary, currency or accounting book? ❓ | Finance |
| ☐ | A copy of one trusted report for a closed month: the income statement (P&L) and trial balance. These are your "golden numbers". | Finance |
| ☐ | The shared data alerts email address (from Guide 02) | You / IT |
| ☐ | A list of NetSuite records that must never be loaded (payroll, employee pay, anything HR) ❓ | Finance + data owner |

💡 Ask for the NetSuite pieces on day one. Licence questions (SuiteAnalytics Connect may need to be bought or switched on by the client's NetSuite account team 📘) can take a week or more.

---

## 3. Part A: The Fivetran Account and the BigQuery Destination

**Step A1 — Account.** The client signs up for Fivetran (or uses their existing account) and invites you. 🛠 Ask for a role that lets you create destinations and connectors during the build. Write down in `docs/decisions.md` who the account owner is (a role, not a person's private email).

**Step A2 — Start the destination.** In Fivetran, go to **Destinations → Add destination → BigQuery** 📘. Give it a clear name, for example `<client>_bigquery_prod`.

**Step A3 — Fill in the form** (field names 📘, check the current form):

| Field | What to type | Why |
| --- | --- | --- |
| Project ID | `<client>-data-prod` | Raw data lives in the prod data project (Guide 01 naming rules) |
| Data location | `europe-west2` | Must match the datasets made in Guide 02. A mismatch makes syncs fail. |
| Data processing location (if offered) | UK or EU, whichever is closest | Keeps data in the UK/EU while Fivetran moves it 📘 |
| Time zone (if offered) | Europe/London | Only affects how the schedule is shown; raw timestamps stay as the source sends them |

**Step A4 — Give Fivetran access to BigQuery.** There are two ways. Read Fivetran's BigQuery setup guide and use the one it describes today.

| Way | How it works | What you do |
| --- | --- | --- |
| **A. Fivetran's own service account** (the common way at the time of writing 📘) | The form shows an email ending in something like `…iam.gserviceaccount.com` that belongs to Fivetran | Grant **that email** the roles below in `<client>-data-prod`. In this case `sa-fivetran` is not used. Write that in `docs/decisions.md` and the integration register. |
| **B. Your own service account** (if the form offers it) | You upload a key for `sa-fivetran` | Create a key for `sa-fivetran`, paste it **only** into the Fivetran form, then delete the downloaded file. Never put it in Git, chat or email. |

🛠 **Our standard roles** (smallest that should work):

```
  In project <client>-data-prod:
    BigQuery Job User          (project level: lets it run load and MERGE jobs)
    BigQuery Data Editor       (on datasets raw_netsuite, raw_hubspot, raw_excel ONLY)
```

⚠️ 📘 Fivetran's guide has asked for the wider **BigQuery User** role at project level, because Fivetran likes to create datasets itself and may make extra working datasets or tables for its own use. If the setup test fails with a permission error using our narrow roles, check Fivetran's docs for the exact list. If you must give the wider role, write down why in `docs/decisions.md`. Never give Owner or Editor on the whole project.

**Step A5 — Test.** Click **Save & Test**. You should see green ticks for connection and permissions. If you see "location mismatch", the dataset region and the form do not agree.

---

## 4. Part B: Prepare NetSuite

Do these steps with the client's NetSuite admin. Menu paths are 📘 and change between NetSuite releases, so follow Fivetran's current NetSuite setup guide side by side.

**Step B1 — Turn on the features.** In NetSuite: **Setup → Company → Enable Features**.

-   **Analytics** tab: tick **SuiteAnalytics Connect**.
-   **SuiteCloud** tab: tick **Token-Based Authentication**.

If SuiteAnalytics Connect is missing, the client may need to add it to their NetSuite licence 📘. Stop and tell the lead: this is a cost and timing issue.

**Step B2 — Make a custom read-only role.** **Setup → Users/Roles → Manage Roles → New**. Name it `Fivetran Read Only`. Give it:

-   The SuiteAnalytics Connect permission, plus the login permissions for tokens (names like "Log in using Access Tokens" 📘).
-   **View** level (never Create, Edit or Full) on the transactions and lists you need: accounts, accounting periods, subsidiaries, locations, departments, classes, customers, vendors, and the transaction types (invoices, credit memos, bills, journals).
-   No access to payroll, employee pay or HR records.

⚠️ 📘 NetSuite has a permission called **"SuiteAnalytics Connect – Read All"**. As the name says, it lets the role read **every** record through Connect, ignoring the other limits. That would include payroll and HR data, which the brief says must not be connected (✅ brief: people/HR data excluded). Do not use it unless the client's finance lead agrees in writing, and then block the HR tables in Fivetran (Part C). Check the current Fivetran guide for its exact permission list.

**Step B3 — Make the integration user.** A NetSuite user (an employee record or similar, 📘) with a shared, role-based email such as the data alerts address, never a staff member's own login. Give it the `Fivetran Read Only` role only. A NetSuite user may use a paid licence 📘: ❓ ask the client.

**Step B4 — Make the integration record.** **Setup → Integration → Manage Integrations → New**.

-   Name: `Fivetran`. State: Enabled.
-   Tick **Token-Based Authentication**. Untick the OAuth flows you do not use (📘 check what Fivetran's guide says).
-   Save. NetSuite shows the **Consumer Key** and **Consumer Secret** **once**. Copy them straight into the Fivetran form (Part C) or a password manager the client owns.

**Step B5 — Make the access token.** **Setup → Users/Roles → Access Tokens → New**. Pick Application = `Fivetran`, User = the integration user, Role = `Fivetran Read Only`. Save. NetSuite shows the **Token ID** and **Token Secret** **once**. Copy them the same way.

**Step B6 — Find the account details.** The SuiteAnalytics Connect page (**Settings → Set Up SuiteAnalytics Connect** on the home page, 📘) shows the service host, port, account ID and role ID. Note the **account ID** and the **role ID**. A sandbox account ID usually ends in something like `_SB1` 📘. Make sure you are using **production**.

Where the secrets end up:

```
  Consumer key + secret  ─┐
  Token ID + secret      ─┼──► typed into the Fivetran connector form ──► stored by Fivetran
  Account ID, role ID    ─┘    (nowhere else: not Git, not chat, not email, not a ticket)
```

---

## 5. Part C: Create the NetSuite Connector and Choose Tables

**Step C1 — Add the connector.** In Fivetran: **Connectors → Add connector**, search "NetSuite", pick the **SuiteAnalytics** one 📘, and choose your BigQuery destination.

**Step C2 — Name the destination schema.** This becomes the BigQuery dataset name. Type `raw_netsuite`.

-   📘 For single-schema connectors like NetSuite, the name you type is used as the dataset name. For some database connectors Fivetran asks for a **prefix** and adds the source schema name after it (for example `raw_netsuite_something`). Look at the preview under the field before you continue.
-   📘 At the time of writing, the schema name **cannot be changed** after you create the connector. If it is wrong, you delete the connector and start again (and pay for the time of a new historical sync). Check twice.
-   Because `raw_netsuite` already exists (Guide 02), Fivetran writes into it. Good: it keeps the region and labels we set.

**Step C3 — Fill in the login.** Account ID, consumer key, consumer secret, token ID, token secret, and role ID if asked (field names 📘). Click **Save & Test**. Green ticks mean Fivetran can log in through SuiteAnalytics Connect.

**Step C4 — Choose tables.** Fivetran lists what the role can see. 🛠 Our standard is "only what the models need", which also keeps MAR down. Table names below follow NetSuite's analytics source (📘 check the Records Catalog and what your connector actually shows).

| Table | What it holds | Select? |
| --- | --- | --- |
| `transaction` | One row per invoice, credit memo, bill, journal (the header). Has `trandate` and `postingperiod`. | ✅ Yes |
| `transactionline` | The lines. Segments like location, department, class usually live here. | ✅ Yes |
| `transactionaccountingline` | The GL impact: account, debit, credit, `posting` flag, accounting book | ✅ Yes (this is the ledger) |
| `account` | The chart of accounts: number, name, type | ✅ Yes |
| `accountingperiod` | Months, quarters, years; start and end dates; closed or open | ✅ Yes |
| `subsidiary`, `location`, `department`, `classification` | The segments. One of them (or a custom segment) is "the site" ❓ | ✅ Yes, all four until the client answers |
| `accountingbook`, `currency` | Which book is primary; currencies | ✅ Yes (small) |
| `customer`, `vendor` | Who was invoiced, who sent bills | ✅ Yes, but they hold contact details: keep raw access restricted |
| Custom segment tables or columns (names like `cseg_…` 📘) | Only if the site is a custom segment | ❓ Ask |
| `employee`, payroll items, anything with pay or HR data | People data | ❌ Never (✅ brief: HR excluded) |
| Everything else (items, sales orders, estimates, system notes…) | Not needed for the P&L | ❌ Not now. Add later when a model needs it. |

💡 Fivetran also lets you untick single **columns** or hash them 📘. Use this for things like memo fields if finance tells you staff write personal notes there. Removing data that must never be loaded does not break the "load raw, clean later" rule: that rule is about not _changing_ data, not about loading everything.

Three NetSuite ideas to keep in mind while you choose (see Chapter 09):

-   **Posting vs non-posting.** Only lines with `posting = 'T'` hit the general ledger. Sales orders and estimates do not. Load both; filter in dbt.
-   **Period, not date.** Finance reports by `postingperiod`. A transaction dated 30 Sep can post to October.
-   **Closed periods.** When finance closes a month, its numbers should stop changing. A closed period can still be reopened by finance, so never assume old rows are frozen forever.

🛠 The project's P&L categories (`revenue` / `direct_cost` / `central_cost`) are **not** set here. Fivetran copies the accounts as they are. The mapping from account to category is done later in dbt (Guide 07), in a small mapping table finance signs off.

---

## 6. Schedule, Alerts and Schema-Change Settings

| Setting | Where (📘) | 🛠 Our standard |
| --- | --- | --- |
| Sync frequency | Connector → Setup | Every 6 hours (made up as a starting point). A P&L rarely needs more. Lower it to 12 or 24 hours if MAR or sync time is high. |
| Finish time | Connector → Status / sync history | A sync must **finish before 03:00 Europe/London**. At 03:00 the `dbt-build` job runs `dbt source freshness` then `dbt build` (Guide 08). If a sync often runs past 03:00, move its start time or change the frequency. |
| Schema changes | Connector → Schema → schema change handling | "Allow new columns, block new tables" (the option names change 📘). New tables are reviewed by a person first, so an HR table can never appear on its own. |
| Failure emails | Account or user notification settings | Send sync failures and "connector broken" emails to the shared data alerts address. One way 📘: invite that address as a Fivetran user with a read-only role and turn on its email alerts. Use whatever the current notifications page offers. |
| Pause / delete rights | Account → users and roles | Only the data owner and you (during the build) can change connectors |

---

## 7. The First Sync, History and Re-syncs

**Step 7.1 — Start.** Click **Start initial sync**. The first (historical) sync copies all history the role can see.

-   📘 SuiteAnalytics Connect is not fast. A historical sync can take hours, or longer for a big account. Start it early in the day and do not panic.
-   📘 Historical syncs have not counted towards MAR in the past. Check the current pricing page, because the rules change.

**Step 7.2 — Look at what landed.** In BigQuery, open `<client>-data-prod.raw_netsuite`. You should see one table per selected table, plus a few Fivetran tables (names like `fivetran_audit` 📘). Every table has `_fivetran_synced` (when Fivetran last wrote the row) and `_fivetran_deleted` (TRUE if the row was deleted in NetSuite).

**Deletes.** 📘 NetSuite keeps a list of deleted records, and the connector uses it to mark rows `_fivetran_deleted = TRUE` instead of removing them. Every staging model must filter them out (Chapter 13). Test it once: ask finance to delete a test journal in a sandbox, or find a real deleted transaction, and check the flag.

**Re-syncs.** Fivetran lets you re-sync one table or the whole connector 📘. Use it when a table looks wrong, a column was missed, or after a role change gave access to new data. A re-sync re-reads everything, so it is slow and may cost MAR: ask the lead first, and write down why in `docs/decisions.md`.

📘 Some NetSuite tables have no reliable "last modified" column, so the connector may re-read them in full on every sync. If one table makes syncs slow, check its sync mode in the connector's schema tab and in Fivetran's NetSuite docs.

---

## 8. Check It Worked

**Check 1 — Row counts and freshness.** Run in BigQuery:

```
-- How many rows landed, how many are deleted, and how fresh is each table?
SELECT 'transaction' AS tbl, COUNT(*) AS rows_total,
       COUNTIF(_fivetran_deleted) AS rows_deleted, MAX(_fivetran_synced) AS last_synced
FROM `<client>-data-prod.raw_netsuite.transaction`
UNION ALL
SELECT 'transactionaccountingline', COUNT(*), COUNTIF(_fivetran_deleted), MAX(_fivetran_synced)
FROM `<client>-data-prod.raw_netsuite.transactionaccountingline`
UNION ALL
SELECT 'account', COUNT(*), COUNTIF(_fivetran_deleted), MAX(_fivetran_synced)
FROM `<client>-data-prod.raw_netsuite.account`
UNION ALL
SELECT 'accountingperiod', COUNT(*), COUNTIF(_fivetran_deleted), MAX(_fivetran_synced)
FROM `<client>-data-prod.raw_netsuite.accountingperiod`;
```

What you should see: `last_synced` within the last sync window. Compare the `account` count with the chart of accounts list in NetSuite (**Lists → Accounting → Accounts**, 📘, including inactive accounts). Compare transactions for one month with a NetSuite saved search for the same month and types.

**Check 2 — The trial balance per period.** In double-entry bookkeeping every posting has equal debits and credits, so each period should net to zero.

```
-- Trial-balance style check: debits must equal credits in every posting period.
-- Column names follow NetSuite2.com; check them in your dataset.
SELECT
  ap.periodname,
  ap.startdate,
  ap.closed                                   AS period_closed,   -- 'T' or 'F'
  COUNT(*)                                    AS gl_lines,
  ROUND(SUM(COALESCE(tal.debit, 0)), 2)       AS total_debit,
  ROUND(SUM(COALESCE(tal.credit, 0)), 2)      AS total_credit,
  ROUND(SUM(COALESCE(tal.debit, 0) - COALESCE(tal.credit, 0)), 2) AS difference  -- expect 0
FROM `<client>-data-prod.raw_netsuite.transactionaccountingline` AS tal
JOIN `<client>-data-prod.raw_netsuite.transaction`  AS t  ON t.id = tal.transaction
JOIN `<client>-data-prod.raw_netsuite.accountingperiod` AS ap ON ap.id = t.postingperiod
JOIN `<client>-data-prod.raw_netsuite.accountingbook` AS ab ON ab.id = tal.accountingbook
WHERE tal.posting = 'T'
  AND ab.isprimary = 'T'                                    -- primary book only
  AND NOT COALESCE(tal._fivetran_deleted, FALSE)
  AND NOT COALESCE(t._fivetran_deleted, FALSE)
  AND ap.isquarter = 'F' AND ap.isyear = 'F'                -- months only
GROUP BY 1, 2, 3
ORDER BY ap.startdate DESC
LIMIT 24;
```

What you should see: `difference` = 0.00 for every month. If not, you are probably missing deleted-row filters, a second accounting book, or lines from a table that is not fully synced.

**Check 3 — Match NetSuite's own report.** Pick the last **closed** month. In NetSuite run **Reports → Financial → Income Statement** (📘) for that period. Then sum income and expenses by account in BigQuery (the query shape is in Chapter 09, section 14; change the date filter to `t.postingperiod` = that period's ID). Put them side by side, account by account, with a "gap" and an "explained?" column. Every gap must be zero or explained (wrong book, currency, a journal posted after the sync). Keep this sheet: Guide 09 asks finance to sign it off.

**Check 4 — Open vs closed periods.**

```
SELECT periodname, startdate, enddate, closed, isadjust
FROM `<client>-data-prod.raw_netsuite.accountingperiod`
WHERE isquarter = 'F' AND isyear = 'F'
ORDER BY startdate DESC
LIMIT 6;
```

Ask finance: "Is this the list of closed months you expect?" This table later drives the PROVISIONAL label for open months.

---

## 9. Common Problems and Fixes

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Destination test: "permission denied" | Narrow roles not enough, or roles given to the wrong service account email | Check which email Fivetran shows; compare roles with Fivetran's current BigQuery guide |
| "Location mismatch" / dataset not found | Dataset is in a different region from the destination setting | Both must be `europe-west2`. Fix the destination; do not move data to another region. |
| Dataset is `raw_netsuite_netsuite2` or similar | The form used the name as a prefix | Delete the connector before the first sync finishes, re-create it with the right setting. Check docs first. |
| NetSuite login test fails: "invalid login" | Wrong account ID (sandbox vs production), token made for the wrong role, or a typo in a secret | Re-check the account ID; make a new token for the right user + role |
| Login works but tables are missing or empty | The role lacks View permission on that record type | Add View on that record to the role, then re-sync that table |
| Trial balance difference is not zero | Deleted rows not filtered, two accounting books, or a partial sync | Add the filters in Check 2; wait for the sync to finish; check the book |
| Numbers are right for closed months but jump around for this month | Normal: the month is open | Nothing to fix. Label open months PROVISIONAL downstream. |
| Sync often still running at 03:00 | Big tables re-read in full, or too many tables | Untick unused tables; change the start time; ask about the table's sync mode |
| Connector broke after a password or role change | Someone edited the integration user or role | Write in the runbook: "do not edit the Fivetran role or user without telling the data owner" |
| A new table appeared that nobody asked for | Schema setting allows new tables | Switch to "block new tables"; check the table for HR data; remove it if needed |

---

## 10. Cost Check

MAR = rows added, changed or deleted in a month, each counted once per month 📘. Finance data is mostly quiet once a month is closed, so NetSuite is usually cheap after the first load.

**Estimate before you start** (method only, numbers made up):

```
  (MADE UP — method only; replace with the client's real numbers)
  GL lines per month (invoices + credit memos + bills + journals)   ≈ 20,000
  + lines edited again in later months (corrections)                ≈  1,000
  + small tables (accounts, periods, segments) changing              ≈    100
                                                                    ─────────
  NetSuite MAR per month                                            ≈ 21,100
```

To get real numbers, ask finance for a count of transaction lines per month, or after the first sync run:

```
-- Roughly how many GL lines are created per month? (a good proxy for MAR)
SELECT FORMAT_DATE('%Y-%m', DATE(t.createddate)) AS month, COUNT(*) AS gl_lines
FROM `<client>-data-prod.raw_netsuite.transactionaccountingline` AS tal
JOIN `<client>-data-prod.raw_netsuite.transaction` AS t ON t.id = tal.transaction
GROUP BY 1 ORDER BY 1 DESC LIMIT 12;
```

**Watch it for real.** In Fivetran, open the **Usage** page (📘 under account or billing settings). It shows MAR per connector and per table. Check it after the first week and at each month end. 🛠 If one table is much bigger than you expected, find out why before the bill arrives. Fivetran's pricing rules (free tiers, how MAR is added up across connectors, whether deletes count) have changed more than once: **check the current pricing page** before you write a number in a cost plan.

---

## 11. Done When

| ☐ | Check |
| --- | --- |
| ☐ | Fivetran account is in the client's name and paid by the client |
| ☐ | BigQuery destination points at `<client>-data-prod`, `europe-west2`, and the identity Fivetran uses is written in the register |
| ☐ | NetSuite uses a dedicated integration user with a custom read-only role and token-based login; no personal login |
| ☐ | Consumer and token secrets exist only inside Fivetran (and the client's password manager if they want one) |
| ☐ | Data lands only in `raw_netsuite` |
| ☐ | No HR or payroll tables or columns selected; "block new tables" is on |
| ☐ | Sync runs every 6 hours (or the agreed frequency) and finishes before 03:00 Europe/London |
| ☐ | You paused or broke the connector once on purpose, and the failure email reached the shared alerts address |
| ☐ | Trial balance difference is zero for every month; one closed month matches NetSuite's income statement (gaps explained) |
| ☐ | Deleted rows are flagged by `_fivetran_deleted` and you know staging must filter them |
| ☐ | The "site" segment answer and the month-close rule are written in `docs/decisions.md` (or still marked ❓) |
| ☐ | MAR estimate written down; Usage page checked after week one |
| ☐ | Register row and runbook entry written |

---

## What's Next?

Fivetran is ready and finance data is flowing. The next connector reuses the same destination: Guide 04 — HubSpot to BigQuery. 🚀

Back to the plan: Guide 01 — Start Here. Background reading: Chapter 13 (Fivetran), Chapter 09 (NetSuite) and Chapter 39 (integration I8).

---

# Integration Guide 04 — HubSpot to BigQuery

> Source file: `integrations/integration-04-hubspot.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 This guide is for the engineer who has finished Guide 03, so a Fivetran account and a BigQuery destination already exist. Now we add the client's CRM.

At the end you will have: a Fivetran HubSpot connector that copies companies, contacts, deals, pipelines, owners and the links between them into `raw_hubspot`, on a schedule, with failure emails, a cost check, and three tests: counts that match HubSpot's screens, a duplicate check and a list of companies with no Nexudus ID.

⚠️ **Read this first.** This is **our standard setup**. The brief says HubSpot "is being integrated" and "is expected to become the source of truth for member data" (✅ brief). It does not say how HubSpot data reaches the warehouse, so a Fivetran HubSpot connector at Work.Life is **inferred, not confirmed**. Fivetran and HubSpot change screens, table names and prices often: **check the current docs** before you click. Numbers marked (made up) are examples only.

What we will cover in this guide:

-   Words you need (objects, properties, associations, OAuth, scopes)
-   What "source of truth for member data" means for loading
-   Before you start: the needs list
-   Step-by-step: create the connector, log in, choose tables
-   Schedule, alerts and schema-change settings
-   HubSpot traps you must know about
-   Check it worked (counts, duplicates, missing Nexudus IDs)
-   Common problems and fixes
-   Cost check
-   Done when

---

## 1. Words You Need

| Word | Simple meaning |
| --- | --- |
| **Object** | A kind of record in HubSpot: company, contact, deal (Chapter 10). |
| **Property** | A field on an object, for example a company's `domain`. Clients add their own **custom properties**. |
| **Association** | A link between two records. Many-to-many: a contact can link to two companies, a deal to three contacts. |
| **Pipeline / stage** | The steps a deal moves through, for example "New Business" or "Renewals". |
| **Owner** | The HubSpot user (a staff member) a record is assigned to. |
| **Property history** | Every past value of a property with the time it changed. Useful, but can be large. |
| **Merge** | Joining two duplicate records into one. One record ID disappears 📘. |
| **OAuth** | A "log in with HubSpot" screen. A HubSpot user approves access for Fivetran; no password is shared. |
| **Scopes** | The list of things the app is allowed to do (for example "read contacts"). Shown on the approval screen. |

---

## 2. What "Source of Truth for Member Data" Means for Loading

✅ The brief says HubSpot "is expected to become the source of truth for member data". Two words matter: **expected** and **become**. Today some member facts live in Nexudus, and the move happens while you build. So:

| What it means | What you do when loading |
| --- | --- |
| Truth is decided **per field**, not per system (Chapter 10, section 11). Names and emails may come from HubSpot; contracts and invoices stay in Nexudus. | Load HubSpot **in full** (all companies and contacts, not only synced ones). The choice of "which system wins for this field" is made in dbt, not in Fivetran. |
| HubSpot holds leads and past members too, not only current members | Do not filter to "members" while loading. Member status is worked out in the warehouse from contracts. |
| The two systems are joined by an ID, not by names | Make sure the custom property holding the **Nexudus ID** is loaded. It is the bridge for matching (section 6, trap 4). |
| The switch happens over time | Write the date each field's owner changes in `docs/decisions.md`. Keep property history for the key fields, so you can explain old numbers. |

📘 The **Nexudus ↔ HubSpot sync** (contacts ↔ customers, companies ↔ teams, deals → opportunities) is an **operational** integration between the two tools. We do not build or change it. We only read both sides. Which fields it syncs at the client is ❓ (Chapter 39, I2). If it causes duplicates, raise it with the client's CRM admin; do not fix it in the pipeline.

---

## 3. Before You Start: The Needs List

| ☐ | You need | From (role) |
| --- | --- | --- |
| ☐ | Guide 03 done: Fivetran account and the BigQuery destination for `<client>-data-prod` work | You |
| ☐ | Dataset `raw_hubspot` exists in `europe-west2`, and Fivetran's identity has Data Editor on it (Guide 02/03) | You |
| ☐ | A HubSpot **super admin** who can approve the connection, on a call with you 📘 | CRM admin |
| ☐ | The names of the custom properties that hold the Nexudus IDs on companies and contacts ❓ (in our lab: `nexudus_team_id` and `nexudus_customer_id`; the client's may differ, and the Nexudus integration may add its own 📘) | CRM admin |
| ☐ | Which pipelines are in use (new business, renewals, others) ❓ | Sales |
| ☐ | Whether emails, calls and notes (engagements) are needed. 🛠 Our standard: no, they hold free text about people. | Data owner |
| ☐ | Whether "deals by owner" reporting is wanted. Owner data is about staff, so check with the client ❓ (✅ brief: people/HR data excluded) | Data owner |

---

## 4. Step-by-Step: Create the Connector

**Step 1 — Add the connector.** In Fivetran: **Connectors → Add connector**, search "HubSpot", pick it and choose the same BigQuery destination as Guide 03 📘.

**Step 2 — Name the destination schema.** Type `raw_hubspot`. Look at the preview under the field to make sure the dataset will be exactly `raw_hubspot` (not a prefix plus another name). 📘 At the time of writing it cannot be renamed later, so check before you go on.

**Step 3 — Log in with OAuth.** Click **Authorize**. A HubSpot window opens.

-   The **super admin** logs in (on the call, with you watching). Never use your own HubSpot user, and never ask for their password.
-   Pick the right HubSpot account (portal). Clients often have a test portal too; the account ID is shown on the screen 📘.
-   **Read the scopes list.** 📘 Fivetran asks for a fixed set of scopes; at the time of writing they are for reading data. 🛠 If you see any write scope (create, update, delete), stop and check Fivetran's current HubSpot docs before you approve.
-   Click **Connect app**. Back in Fivetran you should see a green tick.

Where the secret lives: the OAuth token is stored by Fivetran. It is not in Git or anywhere else. 📘 If the super admin who approved it is later removed from HubSpot, the token may stop working. Write in the runbook: "re-authorise with another super admin if the HubSpot connector breaks after a staff change."

💡 Another way, if the client will not use OAuth: a HubSpot **private app** with read-only scopes, used by a Python script (Chapter 10, section 12). That is more code to look after, so 🛠 we only use it if Fivetran is not allowed.

**Step 4 — Choose tables.** Fivetran writes HubSpot properties as columns with a `property_` prefix, for example `property_name`, `property_domain` 📘. Table names below are typical; **check what your connector shows**.

| Table (typical name 📘) | What it holds | Select? |
| --- | --- | --- |
| `company` | Companies with all their properties, including the Nexudus team ID property | ✅ Yes |
| `contact` | People: name, email, phone, lifecycle stage, Nexudus customer ID property | ✅ Yes, but it is personal data: raw access stays restricted |
| `deal` | Deals: amount, stage, close date, pipeline | ✅ Yes |
| `deal_pipeline`, `deal_pipeline_stage` | Pipeline and stage names (the labels for the IDs on deals) | ✅ Yes (small) |
| `owner` | HubSpot users records are assigned to | ❓ Only if the client agrees (staff data) |
| Association tables (names like `deal_company`, `deal_contact`, `contact_company`) | Which deal belongs to which company and contact | ✅ Yes |
| `property`, `property_option` | Property definitions: dropdown values and their labels | ✅ Yes (small, needed for labels) |
| Merge tables or merge columns (names like `merged_deal`, or a property like `hs_merged_object_ids`) | Which old IDs were merged into which record | ✅ Yes |
| `company_property_history`, `contact_property_history`, `deal_property_history` | Every past value of every property | 🛠 Deal history yes (stage changes). Contact and company history: only if needed, they drive MAR (section 9). |
| Engagements (emails, calls, meetings, notes), tickets, marketing emails, forms | Free text and activity about people | ❌ Not by default |

**Step 5 — Columns.** Inside `contact`, untick columns you do not need and that are sensitive (for example free-text notes, date of birth, anything health-related, if they exist) 📘. Keep the IDs, email (needed for duplicate checks), lifecycle stage, company link, created and last modified dates and the Nexudus ID property.

---

## 5. Schedule, Alerts and Schema-Change Settings

| Setting | 🛠 Our standard |
| --- | --- |
| Sync frequency | Every 6 hours (made up as a starting point). Lower it if MAR is high. |
| Finish time | A sync must finish **before 03:00 Europe/London**, when `dbt-build` runs `dbt source freshness` then `dbt build` (Guide 08). Check the sync history. |
| Schema changes | "Allow new columns, block new tables" (option names 📘). In HubSpot every new custom property becomes a new column, so check new columns once a week for personal data. |
| Failure emails | Same as Guide 03: sync failures go to the shared data alerts address. |

Click **Save & Test**, then **Start initial sync**. A small HubSpot account usually syncs in minutes to an hour; property history can make it much longer 📘.

---

## 6. HubSpot Traps You Must Know About

These do not stop the load, but they break numbers later if you forget them. Each one is handled in dbt (Guide 07); here you only make sure the data needed to handle it is loaded.

| # | Trap | What happens | What to load now |
| --- | --- | --- | --- |
| 1 | **Merged records** | When two contacts are merged, one ID disappears 📘. Old rows may point at a dead ID, or a person is counted twice in history. | The merge table or merged-IDs property, so dbt can map old IDs to the surviving one |
| 2 | **Values vs labels** | Dropdowns store an internal value (`hybrid_remote`); the screen shows a label ("Hybrid / remote") 📘. Pipeline stages are stored as IDs. | `property_option`, `deal_pipeline_stage` |
| 3 | **Many-to-many associations** | A deal linked to two companies gets counted twice if you join without care. | Association tables, including any "primary" flag 📘 |
| 4 | **The Nexudus ID property** | It is the bridge between HubSpot and Nexudus. If it is empty or typed by hand, matching fails and revenue lands under "unknown company" (Chapter 39). | The custom property column, for both companies and contacts |
| 5 | **Deleted (archived) records** | Fivetran marks deleted rows instead of removing them 📘 (`_fivetran_deleted`, and some tables have their own deleted flag). | Nothing extra; filter in staging |
| 6 | **Lifecycle stage only moves forward** by default 📘 | A member who left can still show as "customer" | Nothing extra; member status comes from contracts, not lifecycle stage |
| 7 | **Leads are mixed with members** | Counting all contacts gives a wrong "members" number | Load all; filter in dbt |

⚠️ **Privacy.** `raw_hubspot` holds names, emails and phone numbers. Only the pipeline service accounts and the data owner can read it. 🛠 Personal contact details stay in raw and staging. The marts and BI dashboards get company-level facts only, like deal amounts by stage, built by dbt.

---

## 7. Check It Worked

**Check 1 — Counts vs the HubSpot screens.** In HubSpot, open **Contacts**, **Companies** and **Deals**; each list view shows a record count at the top 📘. Then run:

```
-- Live (not deleted) records per object, and freshness
SELECT 'company' AS obj, COUNTIF(NOT COALESCE(_fivetran_deleted, FALSE)) AS live_rows,
       MAX(_fivetran_synced) AS last_synced
FROM `<client>-data-prod.raw_hubspot.company`
UNION ALL
SELECT 'contact', COUNTIF(NOT COALESCE(_fivetran_deleted, FALSE)), MAX(_fivetran_synced)
FROM `<client>-data-prod.raw_hubspot.contact`
UNION ALL
SELECT 'deal', COUNTIF(NOT COALESCE(_fivetran_deleted, FALSE)), MAX(_fivetran_synced)
FROM `<client>-data-prod.raw_hubspot.deal`;
```

What you should see: counts equal to the HubSpot screens (allow a few for records changed since the last sync). If yours is higher, you may be counting archived or merged rows; check the tables' own deleted flag columns.

**Check 2 — Deals by pipeline and stage, with labels.** Compare with the deal board in HubSpot:

```
SELECT p.label AS pipeline, s.label AS stage,
       COUNT(*) AS deals, SUM(d.property_amount) AS amount
FROM `<client>-data-prod.raw_hubspot.deal` AS d
LEFT JOIN `<client>-data-prod.raw_hubspot.deal_pipeline` AS p
       ON p.pipeline_id = d.deal_pipeline_id
LEFT JOIN `<client>-data-prod.raw_hubspot.deal_pipeline_stage` AS s
       ON s.stage_id = d.deal_pipeline_stage_id
WHERE NOT COALESCE(d._fivetran_deleted, FALSE)
GROUP BY 1, 2
ORDER BY 1, 2;
-- Column names are typical for Fivetran's HubSpot schema; check yours.
```

**Check 3 — Possible duplicate companies (same email domain).**

```
-- Companies that share a website domain: likely duplicates to review
SELECT LOWER(TRIM(property_domain)) AS domain,
       COUNT(*)                     AS companies,
       STRING_AGG(property_name, ' | ') AS names
FROM `<client>-data-prod.raw_hubspot.company`
WHERE NOT COALESCE(_fivetran_deleted, FALSE)
  AND property_domain IS NOT NULL
GROUP BY 1
HAVING COUNT(*) > 1
ORDER BY companies DESC;

-- Contacts whose email domain does not match any company (for review, not for fixing here)
SELECT LOWER(SPLIT(property_email, '@')[SAFE_OFFSET(1)]) AS email_domain, COUNT(*) AS contacts
FROM `<client>-data-prod.raw_hubspot.contact`
WHERE NOT COALESCE(_fivetran_deleted, FALSE)
GROUP BY 1
ORDER BY contacts DESC
LIMIT 20;
```

Free email domains (gmail.com and similar) will top the second list: that is normal for freelancers and coworking members. Send the first list to the CRM admin; duplicates are fixed by merging **in HubSpot**, never in BigQuery.

**Check 4 — Companies without the Nexudus ID.** Replace `property_nexudus_team_id` with the client's real property column ❓.

```
SELECT COUNT(*)                                             AS companies,
       COUNTIF(property_nexudus_team_id IS NULL
               OR TRIM(property_nexudus_team_id) = '')      AS missing_nexudus_id,
       ROUND(100 * SAFE_DIVIDE(
         COUNTIF(property_nexudus_team_id IS NULL OR TRIM(property_nexudus_team_id) = ''),
         COUNT(*)), 1)                                      AS pct_missing
FROM `<client>-data-prod.raw_hubspot.company`
WHERE NOT COALESCE(_fivetran_deleted, FALSE)
  AND property_lifecyclestage = 'customer';     -- customers should all have one
```

What you should see: ideally 0 missing for customers. Leads without a Nexudus ID are normal (they have not signed yet). Also check the other way: two HubSpot companies with the **same** Nexudus ID means a duplicate. Keep the results; they become dbt tests in Guide 07.

---

## 8. Common Problems and Fixes

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Authorize fails or shows "insufficient permissions" | The person approving is not a super admin 📘 | Ask a super admin to approve |
| Data is from the wrong portal (test data) | Wrong HubSpot account picked on the OAuth screen | Delete the connector and re-create it; check the account ID first |
| Connector broke months later with an auth error | The approving user left or lost super admin rights | Re-authorise with another super admin; note it in the runbook |
| Contact count higher than HubSpot shows | Archived or merged records counted | Filter deleted flags; use the merge data |
| Nexudus ID column missing | Property created after the connector, and new columns are blocked, or the property is on another object | Allow the column in the schema tab; re-sync that table if needed |
| Dropdown columns show codes, not words | Normal: HubSpot stores values 📘 | Join `property_option` in staging |
| Deal amounts double when joined to companies | Many-to-many associations | Use a primary association rule in dbt |
| MAR much higher than planned | Property history tables, or a workflow that touches every contact daily | Untick history tables you do not need; ask the CRM admin about bulk workflows |
| Same person appears in Nexudus and HubSpot with different emails | The operational sync matched badly, or legacy data | Report to the CRM admin; matching on the Nexudus ID in dbt avoids most of it |

---

## 9. Cost Check

CRM data changes more than finance data: every email open, lifecycle change or workflow update can touch a contact. HubSpot's own automation can also update thousands of records at once 📘.

```
  (MADE UP — method only; replace with the client's real numbers)
  Contacts touched per month   (count with lastmodifieddate in the month)     ≈ 1,500
  Companies touched per month                                                ≈   300
  Deals touched per month                                                    ≈   200
  Association rows changed                                                   ≈   200
  Property history rows (only if selected — can be many times the above!)    ≈    ?
                                                                             ─────────
  HubSpot MAR per month without history tables                               ≈ 2,200
```

Get the real number after the first sync:

```
-- How many contacts change each month? (a good proxy for contact MAR)
SELECT FORMAT_TIMESTAMP('%Y-%m', property_lastmodifieddate) AS month, COUNT(*) AS contacts_changed
FROM `<client>-data-prod.raw_hubspot.contact`
GROUP BY 1 ORDER BY 1 DESC LIMIT 6;
-- This only sees the LAST change of each contact, so it is a lower bound.
```

Then open Fivetran's **Usage** page 📘 after one week and after the first month end. Look at MAR per table. If a property history table is the biggest line, ask whether anyone needs it. If a single day shows a huge jump, ask the CRM admin what bulk update ran. Pricing rules change: **check Fivetran's current pricing page** before you put a number in a plan.

---

## 10. Done When

| ☐ | Check |
| --- | --- |
| ☐ | Connector approved by a super admin with OAuth; scopes checked and read-only; no personal login of yours used |
| ☐ | The right HubSpot portal (production, not test) is connected |
| ☐ | Data lands only in `raw_hubspot` in `europe-west2` |
| ☐ | Companies, contacts, deals, pipelines, stages, associations, property options and merge data selected; engagements not selected |
| ☐ | The Nexudus ID properties are present as columns |
| ☐ | Owner table decision written down (loaded or not, and why) |
| ☐ | Sync every 6 hours (or agreed), finishing before 03:00 Europe/London; "block new tables" on |
| ☐ | Failure email tested once and reached the shared alerts address |
| ☐ | Counts match the HubSpot screens; duplicate and missing-Nexudus-ID lists sent to the CRM admin |
| ☐ | Raw access to `raw_hubspot` limited; personal contact details will never reach the marts or BI dashboards |
| ☐ | Field ownership (which system wins for which field) and any switch dates written in `docs/decisions.md` |
| ☐ | MAR estimate written; Usage page checked after week one |
| ☐ | Register row and runbook entry written (including "re-authorise if the approving admin leaves") |

---

## What's Next?

Fivetran now loads finance and CRM data. The biggest source has no ready-made connector in our standard setup, so we write code: Guide 05 — Nexudus with Python on Cloud Run. 🚀

Back to the plan: Guide 01 — Start Here. Background reading: Chapter 10 (HubSpot), Chapter 13 (Fivetran) and Chapter 39 (integrations I2 and I9).

---

# Integration Guide 05 — Nexudus to BigQuery With a Python Extractor

> Source file: `integrations/integration-05-nexudus-python.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 Nexudus is the system that runs the buildings: members, teams, contracts, bookings, invoices and check-ins. For Work.Life it is "the largest source" (✅ brief). In this guide you build a small Python program (an **extractor**) that copies Nexudus records into `raw_nexudus` every night, safely and without losing anything.

⚠️ **Read this first.** This is **our standard setup**. Work.Life's brief says data moves "through Fivetran and Python", but which tool loads Nexudus there is not confirmed (❓ ask the client). The Nexudus API paths, filter names and field names in this guide follow the pattern Nexudus documents, but treat them as **illustrative**: check the current Nexudus API docs before you rely on any of them. Vendor APIs change.

What we will cover in this guide:

-   Decide first: Python, the Nexudus BigQuery integration, or Fivetran
-   Before you start
-   Create the Nexudus API user and store the token
-   Which entities to pull (and their old names)
-   The extractor: main.py, requirements.txt, Dockerfile
-   Run it on your laptop
-   Build and deploy it as a Cloud Run job, then schedule it
-   First full load, nightly loads and the weekly ID scan for deletes
-   The time zone check
-   The de-duplication pattern you hand to Guide 07
-   Check it worked, common problems, and "Done when"

---

## 1. Decide First: Which Way Out of Nexudus?

There are three real ways to get Nexudus data into BigQuery on a schedule (Chapter 07, section 14). Pick one **before** you write code, and write the reason in `docs/decisions.md`.

| Option | How it works | Cost | The catch |
| --- | --- | --- | --- |
| **Python extractor** (this guide) | Our code calls the Nexudus REST API each night and loads JSON into `raw_nexudus` | Cloud Run runs a few minutes a night: usually pennies to a few dollars a month (estimate) | Someone must look after the code when the API changes |
| **Nexudus native BigQuery integration** 📘 | Turned on in Nexudus settings; Nexudus sends changes to BigQuery as they happen | Listed at $125 per location per month at the time of writing. For 14 sites that is about $21,000 a year. Check the current price. | No code, but you get Nexudus's table shapes and a per-site bill that grows with the client |
| **Fivetran** | A managed connector, if one exists | Priced on monthly active rows (Chapter 13) | At the time of writing we did not find a ready-made Nexudus connector in Fivetran's list. Check again. Fivetran's "build your own" options still mean writing code. |

🛠 **Our standard decision rule:**

-   Client is cost conscious and has (or buys) someone to look after a small script → **Python**.
-   Client wants zero code and the per-site price is fine for them → **native integration**. Skip sections 5 to 8 of this guide, but still do sections 9 to 13 (time zones, de-dup, checks).
-   A real Fivetran connector appears → compare its monthly active rows cost with the two above.

For Work.Life, the brief says the stack must stay cost conscious: it "cannot become a six figure operation" (✅ brief). That points to Python, but ask the client what runs today before you change anything (❓ ask the client).

---

## 2. Before You Start

| ☐ | You need | From |
| --- | --- | --- |
| ☐ | Projects `<client>-data-prod` and `<client>-data-dev` in `europe-west2`, with the dataset `raw_nexudus` created in prod | Guide 02 |
| ☐ | Service account `sa-extract-nexudus` with: BigQuery Job User (project), BigQuery Data Editor on `raw_nexudus` only, Secret Manager Secret Accessor on `nexudus-api-token` only | Guide 02 |
| ☐ | The secret `nexudus-api-token` (it can be empty for now), and the Artifact Registry Docker repository `data-jobs` in `europe-west2` | Guide 02 |
| ☐ | You are in the group `data-engineers@`, which has Service Account User on `sa-extract-nexudus`, so you can deploy a job that runs as it | Guide 02 |
| ☐ | These Google Cloud APIs turned on: Cloud Run, Cloud Scheduler, Artifact Registry, Cloud Build, Secret Manager, BigQuery | Guide 02 |
| ☐ | On your laptop: the Google Cloud CLI (`gcloud`), Python 3.11 or newer, Git, and the repo `<client>-data-platform` | You |
| ☐ | A Nexudus admin on the client side who can create an API user | Client (Ops / Nexudus admin) |
| ☐ | An answer to: "How many years of history do you want loaded?" (bookings and invoices can be big) | ❓ Ask the client |

Two words you will see a lot: a **watermark** is "how far did we get last time?", stored as the newest `updated_on` value already in BigQuery. An **incremental load** fetches only records changed since the watermark.

---

## 3. Create the Nexudus API User and Store the Token

Ask the client's Nexudus admin to do this with you on a call. Never use a staff member's own login (Guide 01, section 5).

1.  **Create a new admin user** in Nexudus (look under the settings for users or admin users; menu names change, so check the current Nexudus help pages 📘). Use a shared mailbox the client owns, for example `data-integration@<client domain>`, not a person's email.
2.  **Give it read-only rights** to only the modules you need: customers and teams, billing (contracts, plans, invoices), resources and bookings, check-ins. No rights to change anything, no HR or staff modules.
3.  **Get an API token** for that user, the way the current Nexudus API docs describe (bearer token 📘). Find out if the token **expires**. If it does, see the warning note in section 5.
4.  **Store it in Secret Manager** without it ever touching a file, chat or your shell history:

```
# read -s hides what you type and keeps it out of your shell history
read -s NEXUDUS_TOKEN
printf '%s' "$NEXUDUS_TOKEN" | gcloud secrets versions add nexudus-api-token \
    --data-file=- --project=acme-data-prod
```

5.  **Test it with one tiny request** (one record only). You should see JSON with a `Records` list and a `HasNextPage` flag. The path is illustrative:

```
curl -s -H "Authorization: Bearer $NEXUDUS_TOKEN" \
  "https://spaces.nexudus.com/api/spaces/coworkers?page=1&size=1" | head -c 600
```

Write the API user's email, its rights, and who to call if it is locked out into `docs/integration-register.md`. Replace `acme` with your client code everywhere in this guide.

---

## 4. Which Entities to Pull (and Their Old Names)

The Nexudus screens use new names, but the API uses **old names** (Chapter 07, section 4). In raw we keep the API's names, because raw means "exactly what the source sent". dbt staging renames them later.

| On screen | API name (raw table) | Why we need it | Weekly ID scan? |
| --- | --- | --- | --- |
| Location | Business → `businesses` | The list of sites | Yes |
| Customer | Coworker → `coworkers` | Members (personal data: only counts and company-level facts move on into marts) | Yes |
| Team | Team → `teams` | Companies | Yes |
| Contract | CoworkerContract → `coworker_contracts` | MRR, occupancy, churn: the most important table | Yes |
| Plan | Tariff → `tariffs` | Plan names and list prices | Yes |
| Resource | Resource → `resources` | Offices, desks, meeting rooms, capacity | Yes |
| Booking | Booking → `bookings` | Meeting room use and revenue | No (big) |
| Cancelled booking | CancelledBookings → `cancelled_bookings` | If you skip this, cancellations silently vanish | No |
| Invoice | CoworkerInvoice → `coworker_invoices` | What was billed | No (big) |
| Invoice line | CoworkerInvoiceLines → `coworker_invoice_lines` | Billed amount per product and financial account | No (big) |
| Check-in | Checkins → `checkins` | Who came in (personal data, aggregate only, like door events in Guide 06) | No (big) |

🛠 Start with these. Add more (proposals, plan history, booking credits, financial accounts) only when a dbt model needs them. Fewer entities means fewer API calls and less to look after.

---

## 5. The Extractor: `extractors/nexudus/main.py`

This is a complete, readable skeleton. It follows the golden rules: read-only, load raw (the whole record as JSON text), secrets from the environment only, and fail loudly. Read the comments: each one explains a choice from Chapter 14.

```
"""extract-nexudus: copy Nexudus records into BigQuery raw_nexudus, unchanged.

MODE (environment variable):
  auto         (default) full on Sundays (UK date), incremental on other days
  incremental  only records changed since the last run (the watermark)
  full         every record, plus a list of current ids, so dbt can spot deletes
SINCE (optional, ISO date like 2026-09-01): reload from that date instead of the
  watermark, for every table, with no weekly scan (backfill, used by Guide 08)
Exit code 0 = success. Anything else = failure, and Cloud Monitoring alerts.
"""
import json
import logging
import os
import random
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import requests
from google.api_core.exceptions import NotFound
from google.cloud import bigquery

# ---------- settings: all from the environment, nothing secret in code ----------
PROJECT    = os.environ["GCP_PROJECT"]                  # for example acme-data-prod
DATASET    = os.environ.get("BQ_DATASET", "raw_nexudus")
LOCATION   = os.environ.get("BQ_LOCATION", "europe-west2")
MODE       = os.environ.get("MODE", "auto")
START_FROM = os.environ.get("START_FROM", "2000-01-01T00:00")   # big tables only: agree with client
EARLIEST   = "2000-01-01T00:00"         # small tables: always the whole history
SINCE      = os.environ.get("SINCE", "").strip()           # optional backfill date, replaces the watermark
BASE_URL   = os.environ.get("NEXUDUS_BASE_URL", "https://spaces.nexudus.com/api")
TOKEN      = os.environ["NEXUDUS_TOKEN"]    # Cloud Run fills this from Secret Manager

PAGE_SIZE     = 100
OVERLAP_HOURS = 2       # re-read the last 2 hours every run: safe, staging de-duplicates
MAX_TRIES     = 6

# raw table -> (API path, "updated since" filter, include in weekly ID scan?)
# ILLUSTRATIVE: check every path and filter name in the current Nexudus API docs.
ENTITIES = {
    "businesses":             ("sys/businesses",             "from_Business_UpdatedOn",              True),
    "coworkers":              ("spaces/coworkers",           "from_Coworker_UpdatedOn",              True),
    "teams":                  ("spaces/teams",               "from_Team_UpdatedOn",                  True),
    "coworker_contracts":     ("billing/coworkercontracts",  "from_CoworkerContract_UpdatedOn",      True),
    "tariffs":                ("billing/tariffs",            "from_Tariff_UpdatedOn",                True),
    "resources":              ("spaces/resources",           "from_Resource_UpdatedOn",              True),
    "bookings":               ("spaces/bookings",            "from_Booking_UpdatedOn",               False),
    "cancelled_bookings":     ("spaces/cancelledbookings",   "from_CancelledBooking_UpdatedOn",      False),
    "coworker_invoices":      ("billing/coworkerinvoices",   "from_CoworkerInvoice_UpdatedOn",       False),
    "coworker_invoice_lines": ("billing/coworkerinvoicelines", "from_CoworkerInvoiceLine_UpdatedOn", False),
    "checkins":               ("spaces/checkins",            "from_Checkin_UpdatedOn",               False),
}

SCHEMA = [
    bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("updated_on", "STRING"),      # exactly as the API sent it
    bigquery.SchemaField("payload", "STRING"),         # the whole record, as JSON text
    bigquery.SchemaField("_loaded_at", "TIMESTAMP"),   # our own clock, in UTC
]
ID_SCHEMA = [
    bigquery.SchemaField("id", "STRING", mode="REQUIRED"),
    bigquery.SchemaField("_loaded_at", "TIMESTAMP"),
]

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("extract-nexudus")

class FatalApiError(Exception):
    """A response we must NOT retry: bad token, missing rights, renamed endpoint."""

# ---------- 1. Talk to the API politely: retry 429 / 5xx, stop on 4xx ----------
def get_page(session, path, params):
    for attempt in range(1, MAX_TRIES + 1):
        try:
            r = session.get(f"{BASE_URL}/{path}", params=params, timeout=60)
        except (requests.ConnectionError, requests.Timeout) as exc:
            wait = 2 ** attempt + random.random()
            log.warning("network problem on %s (%s), retry in %.0fs", path, exc, wait)
            time.sleep(wait)
            continue

        if r.status_code == 200:
            return r.json()
        if r.status_code in (400, 401, 403, 404):
            # 401/403 = token or rights. 400/404 = the API probably changed. Do not retry.
            raise FatalApiError(f"HTTP {r.status_code} on {path}: {r.text[:200]}")
        if r.status_code == 429 or r.status_code >= 500:
            retry_after = r.headers.get("Retry-After", "")
            wait = int(retry_after) if retry_after.isdigit() else 2 ** attempt + random.random()
            log.warning("HTTP %s on %s, try %d of %d, waiting %.0fs",
                        r.status_code, path, attempt, MAX_TRIES, wait)
            time.sleep(wait)
            continue
        raise FatalApiError(f"unexpected HTTP {r.status_code} on {path}")
    raise RuntimeError(f"gave up on {path} after {MAX_TRIES} tries")

def fetch_records(session, path, filter_name, since):
    """Yield every record changed on or after `since`, page by page."""
    params = {"page": 1, "size": PAGE_SIZE, "orderBy": "UpdatedOn", "dir": 0,
              filter_name: since}
    while True:
        body = get_page(session, path, params)
        yield from body["Records"]                # KeyError here = API changed: fail loudly
        if not body["HasNextPage"]:
            return
        params["page"] += 1

# ---------- 2. The watermark: ask BigQuery how far we got ----------
def read_watermark(bq, table, first_run_from):
    sql = f"SELECT MAX(updated_on) AS wm FROM `{PROJECT}.{DATASET}.{table}`"
    try:
        wm = list(bq.query(sql).result())[0].wm
    except NotFound:                              # first run: the table does not exist yet
        return first_run_from
    if not wm:
        return first_run_from
    # Go back OVERLAP_HOURS and fetch with "on or after" (>=), never "after" (>).
    # This also covers the hour that repeats when the clocks go back in October.
    since = datetime.fromisoformat(wm[:16]) - timedelta(hours=OVERLAP_HOURS)
    return since.strftime("%Y-%m-%dT%H:%M")

# ---------- 3. Write JSONL and run a BigQuery load job ----------
def load_records(bq, table, records, loaded_at, keep_ids):
    ids, n = [], 0
    with tempfile.NamedTemporaryFile("w", suffix=".jsonl", delete=False,
                                     encoding="utf-8") as f:
        for rec in records:
            row = {"id": str(rec["Id"]),               # no Id = API changed: fail loudly
                   "updated_on": rec.get("UpdatedOn"),
                   "payload": json.dumps(rec, ensure_ascii=False),
                   "_loaded_at": loaded_at}
            f.write(json.dumps(row) + "\n")
            n += 1
            if keep_ids:
                ids.append(row["id"])
        file_name = f.name
    if n:
        job_config = bigquery.LoadJobConfig(
            schema=SCHEMA,
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,   # never overwrite raw
            time_partitioning=bigquery.TimePartitioning(field="_loaded_at"),
        )
        with open(file_name, "rb") as f:
            bq.load_table_from_file(f, f"{PROJECT}.{DATASET}.{table}",
                                    job_config=job_config, location=LOCATION).result()
    os.remove(file_name)
    return n, ids

def load_current_ids(bq, table, ids, loaded_at):
    """Weekly: replace the list of ids that exist in Nexudus today."""
    rows = [{"id": i, "_loaded_at": loaded_at} for i in ids]
    job_config = bigquery.LoadJobConfig(
        schema=ID_SCHEMA,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
    )
    bq.load_table_from_json(rows, f"{PROJECT}.{DATASET}.{table}_current_ids",
                            job_config=job_config, location=LOCATION).result()

# ---------- 4. Main ----------
def main():
    if MODE not in ("auto", "incremental", "full"):
        raise ValueError(f"MODE must be auto, incremental or full, not {MODE!r}")
    is_sunday = datetime.now(ZoneInfo("Europe/London")).weekday() == 6
    run_full = not SINCE and (MODE == "full" or (MODE == "auto" and is_sunday))
    since_override = (datetime.fromisoformat(SINCE).strftime("%Y-%m-%dT%H:%M")
                      if SINCE else None)          # a bad date fails loudly here

    bq = bigquery.Client(project=PROJECT, location=LOCATION)
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {TOKEN}",
                            "Accept": "application/json"})
    loaded_at = datetime.now(timezone.utc).isoformat()
    total = 0

    for table, (path, filter_name, in_id_scan) in ENTITIES.items():
        full = run_full and in_id_scan
        first_run_from = EARLIEST if in_id_scan else START_FROM
        if full:
            since = EARLIEST
        elif since_override:
            since = since_override
        else:
            since = read_watermark(bq, table, first_run_from)
        n, ids = load_records(bq, table, fetch_records(session, path, filter_name, since),
                              loaded_at, keep_ids=full)
        log.info("%-24s %7d rows  since %s  (%s)", table, n, since,
                 "full" if full else "incremental")
        if full:
            if n == 0:   # a full scan of a real table can never be empty
                raise RuntimeError(f"full scan of {table} returned 0 rows")
            load_current_ids(bq, table, ids, loaded_at)
        total += n

    log.info("DONE: %d rows loaded into %s.%s", total, PROJECT, DATASET)

if __name__ == "__main__":
    try:
        main()
    except FatalApiError as exc:
        log.error("EXTRACT FAILED (do not retry, check token / rights / API docs): %s", exc)
        sys.exit(2)
    except Exception:
        log.exception("EXTRACT FAILED")
        sys.exit(1)
```

Why some choices are made this way:

| Choice | Why |
| --- | --- |
| `updated_on` kept as STRING, exactly as sent | Load raw. We give the API back its own value as the next watermark, so no time zone change can creep in here. Staging turns it into a real timestamp (section 9). |
| Whole record in `payload` | If Nexudus adds a field, nothing breaks. It is already in the JSON. |
| `WRITE_APPEND`, never update | Every version is kept. Duplicates are expected, and staging removes them (section 10). |
| 2-hour overlap plus `>=` | Records changed in the same minute, or during the repeated hour in October, are never skipped |
| Partitioned by `_loaded_at` | Queries that look at recent loads read less data, so they cost less |
| Exit code 2 for "do not retry" errors, 1 for everything else | Both alert. The log line tells the person on call where to look first. |

⚠️ **Warning note on tokens.** If the client's Nexudus token expires (for example, after some hours or days), a fixed token in Secret Manager will start failing with 401. In that case store the API user's login details as the secret instead, and add a small function that asks Nexudus for a fresh token at the start of each run, the way the current API docs describe. Check this on day one: it is the most common reason this extractor "suddenly" stops.

⚠️ **Summary records.** Nexudus documents that list results may not fill in every field (Chapter 07, section 16). After your first run, open a few `payload` values and check the fields your models need are really there. If not, you may need to fetch some records one by one, which is slower. Write the finding in `docs/decisions.md`.

---

## 6. `requirements.txt` and `Dockerfile`

`extractors/nexudus/requirements.txt` (pin exact versions once it works, so a new library version cannot surprise you):

```
google-cloud-bigquery>=3.25
requests>=2.32
tzdata>=2024.1
```

`tzdata` gives Python the "Europe/London" time zone rules even inside a slim container.

`extractors/nexudus/Dockerfile`:

```
FROM python:3.12-slim

# Logs appear in Cloud Logging straight away, not in big chunks
ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .

# No secrets in the image. The token arrives at run time from Secret Manager.
CMD ["python", "main.py"]
```

---

## 7. Run It on Your Laptop First

Your first runs go to **your own dev dataset**, never to prod raw. That way test rows never mix with real loads.

```
cd extractors/nexudus
python -m venv .venv
source .venv/bin/activate              # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Lets Python use YOUR Google login (opens a browser). No JSON key files, ever.
gcloud auth application-default login

export GCP_PROJECT=acme-data-dev
export BQ_DATASET=dbt_yourname         # your own dev dataset (Guide 01 naming)
export MODE=incremental
export START_FROM=2026-09-01T00:00     # big tables: only recent rows for this test
read -s NEXUDUS_TOKEN; export NEXUDUS_TOKEN

python main.py
```

Expected output looks like this (made up numbers):

```
INFO businesses                     14 rows  since 2026-09-01T00:00  (incremental)
INFO coworkers                     612 rows  since 2026-09-01T00:00  (incremental)
INFO teams                          88 rows  since 2026-09-01T00:00  (incremental)
...
INFO DONE: 41207 rows loaded into acme-data-dev.dbt_yourname
```

Now run it a **second time**. You should see only a few rows per table (the 2-hour overlap plus anything that changed). If the second run loads everything again, the watermark is not working: stop and fix it before going further.

---

## 8. Build, Deploy and Schedule the Cloud Run Job

A **Cloud Run job** runs a container until it finishes, then stops. You pay only while it runs. The job runs **as** `sa-extract-nexudus`, so it needs no key file.

```
PROJECT=acme-data-prod
REGION=europe-west2
SA=sa-extract-nexudus@$PROJECT.iam.gserviceaccount.com
IMAGE=$REGION-docker.pkg.dev/$PROJECT/data-jobs/extract-nexudus

# 1. The Docker repository data-jobs was made in Guide 02. Check it is there:
gcloud artifacts repositories describe data-jobs \
  --location=$REGION --project=$PROJECT

# 2. Build the image in the cloud (no Docker needed on your laptop)
gcloud builds submit extractors/nexudus --tag=$IMAGE:v1 --project=$PROJECT

# 3. Create or update the job
gcloud run jobs deploy extract-nexudus \
  --image=$IMAGE:v1 \
  --region=$REGION --project=$PROJECT \
  --service-account=$SA \
  --set-secrets=NEXUDUS_TOKEN=nexudus-api-token:latest \
  --set-env-vars=GCP_PROJECT=$PROJECT,BQ_DATASET=raw_nexudus,BQ_LOCATION=$REGION,MODE=auto \
  --tasks=1 --max-retries=1 --task-timeout=3600s --memory=1Gi

# 4. Run it once by hand and wait for the result
gcloud run jobs execute extract-nexudus --region=$REGION --project=$PROJECT --wait
```

Then the nightly trigger. The Cloud Scheduler job `nightly-extract-nexudus` calls the Cloud Run API to start the job at 02:00 UK time (🛠 shared schedule: 02:00 `nightly-extract-nexudus`, 02:15 `nightly-extract-act`, 03:00 dbt). Guide 08 adds the alerts and the full run order.

```
# The job's own account may start ITS OWN job only (Cloud Run Invoker), and
# Scheduler uses that same account as its OAuth identity (same as Guide 08)
gcloud run jobs add-iam-policy-binding extract-nexudus \
  --region=$REGION --project=$PROJECT \
  --member=serviceAccount:$SA --role=roles/run.invoker

gcloud scheduler jobs create http nightly-extract-nexudus \
  --location=$REGION --project=$PROJECT \
  --schedule="0 2 * * *" --time-zone="Europe/London" \
  --http-method=POST \
  --uri="https://run.googleapis.com/v2/projects/$PROJECT/locations/$REGION/jobs/extract-nexudus:run" \
  --oauth-service-account-email=$SA
```

💡 If a flag is rejected, check the current `gcloud` docs, or use the Cloud Run console: open the job → **Triggers** → add a scheduler trigger. Same result.

Why 02:00? In the UK, clocks go forward at 01:00 in March (01:00–02:00 never happens) and back at 02:00 in October (01:00–02:00 happens twice). A job at 02:00 runs exactly once on both days. Avoid schedules between 01:00 and 02:00.

---

## 9. First Load, Nightly Loads, Deletes and Time Zones

**First full load.** On the very first run no table exists, so the small tables (sites, customers, teams, contracts, plans, resources) load their whole history, and the big tables (bookings, invoices, check-ins) start from `START_FROM`. With years of bookings and invoices this can take a long time and hit rate limits. 🛠 Do the first load by hand, during the day, with a longer timeout, and watch the logs:

```
gcloud run jobs execute extract-nexudus --region=$REGION --project=$PROJECT \
  --update-env-vars=MODE=full,START_FROM=2023-01-01T00:00 --task-timeout=21600s --wait
```

(The start date is made up: use what the client agreed.) If it times out, just run it again. Tables that finished have a watermark, so they continue from there.

**Nightly loads.** Monday to Saturday, `MODE=auto` runs incrementally: only changes since the watermark.

**Reloading from a date (backfill).** If a few nights were lost or wrong, set `SINCE` for one run. It replaces the watermark for every table and skips the weekly scan. Guide 08 uses exactly this:

```
gcloud run jobs execute extract-nexudus --region=$REGION --project=$PROJECT \
  --update-env-vars=SINCE=2026-09-01 --wait
```

The extra rows are safe: staging keeps only the latest version of each id. Write every setting (`MODE`, `START_FROM`, `SINCE`) and an example run in `extractors/nexudus/README.md`, for example:

```
## Settings (environment variables)
GCP_PROJECT   required, for example acme-data-prod
BQ_DATASET    default raw_nexudus
MODE          auto (default) | incremental | full
START_FROM    first-run start for big tables (bookings, invoices, check-ins)
SINCE         optional backfill date, for example 2026-09-01. Replaces the watermark.
NEXUDUS_TOKEN set by Cloud Run from Secret Manager (nexudus-api-token). Never in Git.
```

**The weekly ID scan for deletes.** An "updated since" query never shows a record that was **deleted**. On Sundays, `MODE=auto` fetches every record of the small tables (sites, customers, teams, contracts, plans, resources) and replaces `<table>_current_ids`. Any id in raw but not in that list was deleted in Nexudus. For about 8,000 members (✅ brief) this is small and cheap. The big tables (bookings, invoices, check-ins) are not scanned; cancelled bookings arrive through `cancelled_bookings`. If the client deletes bookings or invoices often (❓ ask the client), add a scan of the last 90 days for those too.

**The time zone check.** Raw times must be understood before anyone builds on them. Do this once, and write the answer in `docs/decisions.md`:

1.  Ask the client's admin to change one test record at a known time, for example 10:15 UK time.
2.  After the next run, look at that record's `updated_on`. Does it say 09:15 (UTC in summer), 10:15 (UK local time), or 10:15 with an offset like `+01:00`?
3.  Repeat after the late-October clock change (last Sunday in October), when UK time and UTC are the same again. If the API sends local time without an offset, staging must convert it with `TIMESTAMP(SAFE_CAST(updated_on AS DATETIME), 'Europe/London')`, and you must know about the repeated hour.
4.  Also check booking start and end times. A meeting at 09:00 UK time must not show as 08:00 in a dashboard.

🛠 Our standard: everything is stored in UTC in staging and turned into UK time only in marts or the BI tool, for display.

---

## 10. The De-duplication Pattern You Hand to Guide 07

Because we append and overlap on purpose, raw has many copies of the same record. Every Nexudus staging model in Guide 07 starts with this pattern: keep the latest version of each id, and flag ids that no longer exist. Field names inside `JSON_VALUE` are illustrative: read them from a real payload.

```
-- dbt/models/staging/nexudus/stg_nexudus__contracts.sql  (Guide 07 completes it)
WITH latest AS (
  SELECT *
  FROM {{ source('raw_nexudus', 'coworker_contracts') }}
  WHERE TRUE
  QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_on DESC, _loaded_at DESC) = 1
),
current_ids AS (
  SELECT id FROM {{ source('raw_nexudus', 'coworker_contracts_current_ids') }}
)
SELECT
  l.id                                                   AS contract_id,
  JSON_VALUE(l.payload, '$.CoworkerId')                  AS customer_id,
  JSON_VALUE(l.payload, '$.TariffId')                    AS plan_id,
  SAFE_CAST(JSON_VALUE(l.payload, '$.Price') AS NUMERIC) AS monthly_price_usd,
  -- deleted = missing from the latest weekly scan (only once a scan exists)
  (c.id IS NULL AND (SELECT COUNT(*) FROM current_ids) > 0) AS is_deleted_in_source,
  l._loaded_at
FROM latest AS l
LEFT JOIN current_ids AS c ON c.id = l.id
```

Forget the `QUALIFY` line and MRR counts each contract several times (Chapter 14, Lab 14.2 shows a $6,250 mistake from one missing line). Guide 07 adds a test that every staging model has one row per id.

---

## 11. Check It Worked

Run these in the BigQuery console (project `acme-data-prod`). Do them after the first full load and again after the first Sunday.

```
-- 1. Rows loaded per day, and how many distinct records
SELECT DATE(_loaded_at) AS load_day, COUNT(*) AS rows_loaded, COUNT(DISTINCT id) AS distinct_ids
FROM `acme-data-prod.raw_nexudus.coworkers`
GROUP BY load_day
ORDER BY load_day DESC;

-- 2. Latest version of every customer: compare with the count in the Nexudus admin
--    (field names illustrative; check how Nexudus counts archived customers)
SELECT
  COUNT(*)                                                    AS customers_in_raw,
  COUNTIF(JSON_VALUE(payload, '$.Archived') = 'true')         AS archived
FROM `acme-data-prod.raw_nexudus.coworkers`
WHERE TRUE
QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY updated_on DESC, _loaded_at DESC) = 1;

-- 3. One sample record: open the same customer in Nexudus and compare field by field
SELECT id, updated_on, JSON_VALUE(payload, '$.FullName') AS name,
       JSON_VALUE(payload, '$.TariffId') AS plan_id, payload
FROM `acme-data-prod.raw_nexudus.coworkers`
WHERE id = 'PUT-ONE-ID-HERE'
ORDER BY _loaded_at DESC
LIMIT 1;
```

Also compare: active contracts per site against the Nexudus contracts report, and last month's booking count against the Nexudus bookings report (cancelled ones separately). Write each result, and any gap with its reason, in the register. A gap you cannot explain within a day is a "stop and ask" (Guide 01, section 10).

---

## 12. Common Problems and Fixes

| What you see | Likely cause | Fix |
| --- | --- | --- |
| `HTTP 401` after weeks of working | Token expired, API user's password changed, or user turned off | Check with the Nexudus admin. If tokens expire, fetch a fresh one each run (section 5 warning note). Add a new secret version. |
| `HTTP 403` on one entity only | The API user has no rights to that module | Ask the admin to add read-only rights to that module |
| `HTTP 404` or `400` | Wrong path or filter name, or the API changed | Check the current Nexudus API docs and fix `ENTITIES` |
| Many `429` warnings, then "gave up" | Too many calls too fast | Keep `PAGE_SIZE` at the documented maximum, add a short sleep between pages, ask Nexudus about limits |
| Job stops at the time limit on the first load | Years of history | Run again (it continues), or raise `--task-timeout`, or start from a later `START_FROM` |
| Every run loads everything again | Watermark not read: wrong dataset, or `updated_on` empty | Check `BQ_DATASET`; check the API really returns `UpdatedOn` |
| Fields you need are empty in `payload` | The list endpoint returns summary records | Fetch those records one by one, or reconsider the native integration |
| Cancelled meetings missing from usage numbers | `cancelled_bookings` not loaded | Load it; union it with bookings in staging with a status column |
| MRR doubled overnight | A staging model without `QUALIFY` | Add the de-dup pattern (section 10) and the one-row-per-id test |
| A deleted member still counts as active | No weekly ID scan, or staging ignores `is_deleted_in_source` | Check Sunday's run loaded `*_current_ids` |
| Times one hour off in summer | API sends UK local time, staging treats it as UTC | Do the time zone check (section 9) and convert once in staging |
| `Permission denied` on the secret, or `bigquery.jobs.create` denied | A role from Guide 02 is missing | Check `sa-extract-nexudus` has Secret Accessor on the secret, Job User on the project, Data Editor on `raw_nexudus` |
| "Not found in location" errors | Dataset not in `europe-west2`, or wrong `BQ_LOCATION` | Every dataset and job in `europe-west2`; never mix regions |
| Scheduler shows `PERMISSION_DENIED` | The calling account cannot start the job | Re-run the `roles/run.invoker` binding in section 8 |

---

## 13. Done When

| ☐ | Check |
| --- | --- |
| ☐ | The decision (Python vs native vs Fivetran) and its reason are in `docs/decisions.md` |
| ☐ | A dedicated, read-only Nexudus API user exists, owned by a client mailbox |
| ☐ | The token is only in Secret Manager (`nexudus-api-token`); nothing secret in Git, the image or logs |
| ☐ | `main.py`, `requirements.txt`, `Dockerfile` and a `README.md` (settings, including `SINCE`) are in `extractors/nexudus/` and reviewed |
| ☐ | The Cloud Run job `extract-nexudus` runs as `sa-extract-nexudus` in `europe-west2` |
| ☐ | The Cloud Scheduler job `nightly-extract-nexudus` starts it at 02:00 Europe/London, and it has run for 3 nights in a row with nobody touching it |
| ☐ | A second run loads only changes (the watermark works) |
| ☐ | The first Sunday full scan ran and every `*_current_ids` table is filled |
| ☐ | You broke it on purpose once (for example, a wrong secret version) and the job failed with a non-zero exit (the alert itself comes in Guide 08) |
| ☐ | Customer, contract and booking counts match the Nexudus admin, or the gap is explained in writing |
| ☐ | The time zone answer (UTC or UK local) is written down, and checked across a clock change |
| ☐ | The de-dup pattern is handed to whoever builds Guide 07 |
| ☐ | The register row and a runbook entry ("extract-nexudus failed: what to check") are written |

---

## What's Next?

Next is Guide 06 — ACT and Excel: The Two Tricky Sources, where the hard part is not the code but asking the right questions. Need the big picture again? Go back to Guide 01 — Start Here. 🚀

Background reading: Chapter 07 (Nexudus), Chapter 14 (Python extractors) and Chapter 39 (the integration map, I7).

---

# Integration Guide 06 — ACT and Excel: The Two Tricky Sources

> Source file: `integrations/integration-06-act-and-excel.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 This guide covers the two sources where the hard part is **not the code**. With ACT, the hard part is knowing **which system it even is**, and keeping personal data safe. With Excel, the hard part is that **people** change the file, and a renamed column can quietly break a board number.

⚠️ **Read this first.** Work.Life's brief lists "ACT" and "Excel" as sources (✅ brief), but it does not say which ACT, or how either one reaches BigQuery today (❓ ask the client). "ACT" could be **ACT365** door access or the **Act!** CRM (Chapter 08). Never assume which one. This guide gives our standard setup for both paths. Vendor screens change, so check current docs. Numbers marked (made up) are examples only.

What we will cover in this guide:

-   Before you start
-   Part A, step 1: find out which ACT
-   Path A: ACT365 door events, with the privacy design
-   Path B: Act! CRM, a one-off export of old history
-   Part B: which Excel files, and how to lock the template
-   Loading Excel with the Fivetran Google Sheets connector
-   When someone renames a column: the dbt test that catches it
-   Check it worked, common problems, and "Done when"

---

## 1. Before You Start

| ☐ | You need | From |
| --- | --- | --- |
| ☐ | Datasets `raw_excel` and `raw_act365` or `raw_act` in `<client>-data-prod`, region `europe-west2` | Guide 02 |
| ☐ | `sa-extract-act` (Job User, Data Editor on the ACT raw dataset only, Secret Accessor on `act-api-key`) | Guide 02 |
| ☐ | Fivetran account with the BigQuery destination working, and `sa-fivetran` able to write `raw_excel` | Guide 03 |
| ☐ | The answer to "Which ACT?" (section 2) | ❓ Ask the client |
| ☐ | The list of Excel files that matter, with one owner each | ❓ Ask the client (Finance / Ops) |
| ☐ | A contact for the client's data protection lead (for door data) | ❓ Ask the client |

---

# Part A — ACT

## 2. Step 1: Find Out Which ACT

Do not build anything until this is answered. Ask in plain words: _"In your source list you mention ACT. Is that your ACT365 door access system, the Act! CRM, or something else? Which data from it do you want in the warehouse?"_

| Look at | Points to ACT365 (doors) | Points to Act! (CRM) |
| --- | --- | --- |
| Who uses it | Ops, facilities, IT, front desk | Sales team |
| What people say about it | Key cards, fobs, doors, "who came in" | Contacts, leads, tours, deals, renewals |
| Nexudus integrations page | An ACT365 add-on turned on (📘 Nexudus lists one) | Nothing in Nexudus |
| Existing warehouse tables (if any) | Events, cardholders, doors | Contacts, opportunities, history |
| Who sold it to them | A security installer | A software licence |
| Link to the HubSpot plan | HubSpot replaces nothing here | HubSpot may be replacing it for sales (❓ ask) |

```
  "Which ACT?"
      │
      ├── ACT365 door access ──► Path A (section 3): daily, privacy first
      ├── Act! CRM ───────────► Path B (section 4): usually a one-off export
      ├── Both ───────────────► do both, two datasets: raw_act365 AND raw_act
      └── Neither / unsure ───► stop and ask the lead. Write it in decisions.md.
```

---

## 3. Path A: ACT365 Door Events

**First question: do you need ACT365 at all?** 📘 Nexudus documents that its ACT365 integration can turn door events into **check-ins** in Nexudus. If the client has that turned on, you may already get "who came in" from `raw_nexudus.checkins` (Guide 05), and you can skip this extractor. Ask which one the client trusts for attendance (❓ ask the client), and write the answer down.

**Getting the data out.** Two ways:

| Way | How | Our view |
| --- | --- | --- |
| API 📘 | ACT365 offers an API for integrations (Nexudus's own integration uses one). Access is usually arranged through the client's installer. Endpoint names: check the current ACT365 docs; we do not guess them here. | 🛠 Preferred. A Cloud Run job `extract-act` built the same way as Guide 05 (image in the `data-jobs` repository, runs as `sa-extract-act`, key in `act-api-key`), started at 02:15 by the Cloud Scheduler job `nightly-extract-act`. |
| Export | A CSV export of events from the ACT365 portal, uploaded to a locked bucket, then `bq load` | Fine for a first look. Not fine for daily use: someone must remember to do it. |

### The privacy design (the ONE exception to "load raw")

A door event says when a named person walked in, every day. Under UK GDPR that is **personal data**. One of its ideas is **data minimisation**: only collect and keep what you really need for the purpose. Our purpose is company-level attendance ("GreenRoot's attendance fell"), not watching people. So only company × week aggregates move on into marts for dashboards, and person-level door data never reaches marts or the BI tool. Work.Life's brief says the same: "safe data only" and people/HR data excluded (✅ brief). This is not legal advice: the client's data protection lead makes the final call.

|  | Option 1: aggregate inside the loader | Option 2: locked raw dataset |
| --- | --- | --- |
| What lands in BigQuery | Only company × week counts | Events with names and card numbers removed, in `raw_act365`, which only `sa-extract-act` and `sa-dbt` can read |
| What moves on | The counts | Only `agg_company_week_attendance` (company × week, minimum group size 5), built by dbt |
| Good | No person-level door data in the warehouse at all | If a rule is wrong (main door list, staff groups), you can rebuild history. The join to Nexudus companies stays in dbt, tested. |
| The catch | The loader needs the Nexudus company list (business logic in a loader). A bug means lost history. | Person-level data exists in one locked place, so the lock and the retention must be right |

🛠 **Our standard: Option 2**, with three protections, **unless** the client's data protection lead says no person-level door data may be stored. Then use Option 1.

1.  **Minimise at load.** The loader drops names and card numbers, and never loads staff cardholders at all (staff door data is people/HR data).
2.  **Lock the dataset.** Only the two service accounts. No analysts, no BI tool.
3.  **Short retention.** Raw events are deleted after 90 days (made up: agree the number with the client). The weekly aggregates stay.

The one place a loader changes data (inside `extractors/act/main.py`; field names illustrative):

```
DROP_FIELDS  = {"cardholder_name", "first_name", "last_name", "card_number"}
STAFF_GROUPS = set(os.environ.get("STAFF_GROUPS", "").split(";"))   # list agreed with client

def minimise(event, cardholder_group):
    """Door events: keep only what the attendance model needs."""
    if cardholder_group in STAFF_GROUPS:
        return None                       # staff = people/HR data: never loaded
    return {k: v for k, v in event.items() if k not in DROP_FIELDS}
```

Lock the dataset and set retention with SQL (run as a project owner, in the BigQuery console):

```
-- Only the two service accounts may touch raw_act365
GRANT `roles/bigquery.dataEditor` ON SCHEMA `acme-data-prod.raw_act365`
  TO "serviceAccount:sa-extract-act@acme-data-prod.iam.gserviceaccount.com";
GRANT `roles/bigquery.dataViewer` ON SCHEMA `acme-data-prod.raw_act365`
  TO "serviceAccount:sa-dbt@acme-data-prod.iam.gserviceaccount.com";

-- New partitioned tables delete partitions older than 90 days (made up: agree it)
ALTER SCHEMA `acme-data-prod.raw_act365`
  SET OPTIONS (default_partition_expiration_days = 90);
```

⚠️ A dataset lock does not stop people who have BigQuery data roles on the **whole project**. Check the project's IAM page: nobody except admins should have project-wide BigQuery Data Viewer or Data Editor (Guide 02). The loader must create `door_events` partitioned by event date, so the 90-day rule works.

### The aggregate that moves on (built in Guide 07)

🛠 Rules: count **unique person-days at the main entrance** (people tap several doors), drop contractors (no Nexudus match), and show a company only if it has **at least 5 people** with active cards. Count the group size from active cardholders, not from who came in that week: otherwise a quiet week would be hidden, and a quiet week is the very signal we want.

```
-- marts/agg_company_week_attendance.sql (sketch; stg/int model names are Guide 07's)
WITH visits AS (
  SELECT DISTINCT
    m.company_id,
    e.cardholder_id,
    DATE(e.event_time_utc, 'Europe/London') AS visit_date
  FROM {{ ref('stg_act365__door_events') }}      AS e
  JOIN {{ ref('int_cardholder_company') }}       AS m USING (cardholder_id)  -- drops contractors
  WHERE e.is_main_entrance AND e.event_type = 'Access Granted'
),
group_size AS (
  SELECT company_id, COUNT(*) AS people
  FROM {{ ref('int_cardholder_company') }}
  WHERE is_active
  GROUP BY company_id
)
SELECT
  v.company_id,
  DATE_TRUNC(v.visit_date, WEEK(MONDAY)) AS week_start,
  g.people,
  COUNT(*)                               AS person_days
FROM visits AS v
JOIN group_size AS g USING (company_id)
WHERE g.people >= 5                      -- minimum group size
GROUP BY 1, 2, 3
```

**Check it against the lab.** If you loaded the lab files (Chapter 14, Lab 14.1), this shortcut uses the cardholder group as a stand-in for the company:

```
WITH people AS (
  SELECT `group` AS grp, COUNT(*) AS people
  FROM raw_act365.cardholders
  WHERE status = 'active' AND nexudus_customer_email IS NOT NULL
  GROUP BY grp
),
visits AS (
  SELECT DISTINCT c.`group` AS grp, e.cardholder_id, DATE(TIMESTAMP(e.event_time_utc)) AS d
  FROM raw_act365.door_events AS e
  JOIN raw_act365.cardholders AS c USING (cardholder_id)
  WHERE e.door LIKE '%Main Entrance' AND e.event_type = 'Access Granted'
)
SELECT v.grp, DATE_TRUNC(v.d, WEEK(MONDAY)) AS week_start, p.people, COUNT(*) AS person_days
FROM visits AS v JOIN people AS p USING (grp)
WHERE p.people >= 5
GROUP BY 1, 2, 3
ORDER BY 2;
```

Expected: only **Reading Office 201** (GreenRoot, 6 people) appears, with 17, 22, 12, 7 and 1 person-days for the weeks starting 31 Aug, 7, 14, 21 and 28 Sep. That matches Chapter 08 (week 2: 22 ÷ (6 × 5) = 73%). Pixel Chai has only 4 active cards, so it is hidden: the minimum group size is working. Only this aggregate moves on into marts for dashboards; nothing person-level from `raw_act365` ever reaches marts or the BI tool.

---

## 4. Path B: Act! CRM (Usually Old History)

If ACT is the Act! CRM, and the client is moving sales to HubSpot (✅ brief: HubSpot is being integrated), Act! is usually **old, frozen history**: lead sources, lost deals and churn reasons from before HubSpot. 🛠 Our standard: **one export, loaded once, kept safely**. No daily extractor for a system that is being retired. (If Act! is still in daily use, ❓ ask: then build `extract-act` on Act!'s web API like Guide 05, if the client's edition offers one 📘.)

1.  **Agree what to export**: contacts, companies, opportunities, and maybe history notes. Free-text notes can hold sensitive personal details. Leave them out unless a model really needs them (data minimisation again).
2.  **Export to CSV** from Act! (the client's admin usually does this). Save as UTF-8 if the option exists.
3.  **Keep the files in a locked bucket** in the UK, never on a laptop or in email. The bucket name is our example: add it to `docs/decisions.md`.

```
gcloud storage buckets create gs://acme-data-prod-act-export \
  --project=acme-data-prod --location=europe-west2 \
  --uniform-bucket-level-access --public-access-prevention

gcloud storage cp act_contacts.csv act_opportunities.csv \
  gs://acme-data-prod-act-export/2026-10-28/
```

4.  **Load to `raw_act` with every column as STRING** and clean column names (Act! headers like `ID/Status` are not valid BigQuery names, so we give our own schema and skip the header row):

```
bq load --location=europe-west2 --source_format=CSV --skip_leading_rows=1 \
  --allow_quoted_newlines --replace \
  acme-data-prod:raw_act.contacts \
  gs://acme-data-prod-act-export/2026-10-28/act_contacts.csv \
  contact:STRING,company:STRING,e_mail:STRING,phone:STRING,title:STRING,id_status:STRING,referred_by:STRING,create_date:STRING

bq update --description "Act! export taken 2026-10-28, one-off, file in gs://acme-data-prod-act-export/2026-10-28/" \
  acme-data-prod:raw_act.contacts
```

Do the same for opportunities (one STRING column per header, in order). If $ signs look broken, the file is probably not UTF-8: add `--encoding=ISO-8859-1` and load again.

5.  **Check the counts**: rows in BigQuery = lines in the file minus the header. With the lab files: 7 contacts and 7 opportunities; open pipeline $8,750 a month and win rate 3 of 5 (Chapter 08).
6.  **Map it later, not now.** Act! has no shared ID with Nexudus or HubSpot, and emails and company names are spelled differently (Chapter 11). The matching belongs in dbt (`member_xref`, Guide 07). `raw_act` holds contacts (personal data), so contact-level rows never reach marts or the BI tool; only company-level facts like churn reasons move on into marts.

---

# Part B — Excel

## 5. Which Files, and Lock the Template

Most clients have one or two spreadsheets that hold numbers no system has: **sellable capacity** per site and the **budget** (✅ brief lists Excel as a source; which files, ❓ ask the client). In the lab this is `excel_capacity_budget_2026.csv`. Ask for each file: what is in it, who owns it, how often it changes, and which report uses it. Load only files a model needs.

Then **lock a template** with the owner. A pipeline can only read a file that keeps its shape.

| Rule | How, in Excel or Google Sheets |
| --- | --- |
| One named table | Excel: Insert → Table, name it `tbl_capacity_budget`. Sheets: Data → Named ranges, name it `capacity_budget_2026`. |
| Fixed column names, lowercase, no spaces | `site_code, month, sellable_desks, budget_revenue_usd, budget_desk_occupancy, budget_direct_costs_usd, notes`. Protect the header row. |
| One row per site per month | Months go down the rows, not across the columns. A new month = a new row, not a new column. |
| Codes, not free text | Data validation on `site_code`: a drop-down list from a "lists" tab (SOHO, RDG, …). No "Soho site (new)". |
| Clean values | `month` as text `YYYY-MM`; numbers only in number columns; no merged cells, no totals rows, no notes outside the table |
| One owner | A "README" tab: owner (a role, for example Finance), what each column means, "do not rename columns, ask the data team first" |

---

## 6. Move It to a Shared Place and Load It With Fivetran

A file on someone's laptop cannot be loaded. 🛠 Our standard: move it to a **Google Sheet** owned by a client account (or a shared drive folder if the client uses Microsoft 365 📘: Fivetran lists file connectors for shared drives; check which ones exist today). Then:

1.  In the sheet, check the named range covers the headers and all rows (and leave spare empty rows inside the range for future months, or extend the range when adding a year).
2.  In Fivetran: add a connection → **Google Sheets** 📘. Destination: the BigQuery destination from Guide 03. Destination schema: `raw_excel`. Table name: `capacity_budget_2026`. Fivetran may not let you rename these later, so get them right (check the current Fivetran docs).
3.  Paste the sheet link, pick the named range, and share the sheet **view-only** with the email address Fivetran shows you.
4.  Set the sync to daily (made up: budgets change rarely) and run the first sync. One named range = one table.

**No Fivetran?** For a one-off, export the sheet to CSV and load it with every column as STRING, the same way as section 4:

```
bq load --location=europe-west2 --source_format=CSV --skip_leading_rows=1 --replace \
  acme-data-prod:raw_excel.capacity_budget_2026 capacity_budget_2026.csv \
  site_code:STRING,month:STRING,sellable_desks:STRING,budget_revenue_usd:STRING,budget_desk_occupancy:STRING,budget_direct_costs_usd:STRING,notes:STRING
```

For a repeating load without Fivetran, a small script on a Cloud Run job does the same thing (Chapter 06, section 9). Fivetran may pick its own column types (numbers as FLOAT, for example); staging uses `SAFE_CAST` either way.

---

## 7. When Someone Renames a Column

Picture it: the budget owner renames `budget_revenue_usd` to `Budget Revenue` to make it "look nicer". Fivetran does **not** fail. It adds a new column, and the old column stops getting values (Chapter 13, Lab 13.1). Your model now reads blanks, and "revenue vs budget" quietly breaks. A test must catch it.

In the dbt sources file (Guide 07 owns the full file):

```
sources:
  - name: raw_excel
    schema: raw_excel
    loaded_at_field: _fivetran_synced
    freshness:
      error_after: {count: 3, period: day}
    tables:
      - name: capacity_budget_2026
        columns:
          - name: site_code
            tests: [not_null, {accepted_values: {values: ['SOHO', 'RDG']}}]   # lab sites
          - name: month
            tests: [not_null]
          - name: budget_revenue_usd
            tests: [not_null]       # a renamed column turns into NULLs: this fails
          - name: sellable_desks
            tests: [not_null]
```

And a test that fails if any expected column is missing (save as `dbt/tests/assert_excel_budget_columns_exist.sql`; a dbt test passes when it returns zero rows):

```
WITH expected AS (
  SELECT col FROM UNNEST(['site_code', 'month', 'sellable_desks', 'budget_revenue_usd',
                          'budget_desk_occupancy', 'budget_direct_costs_usd']) AS col
)
SELECT e.col AS missing_column
FROM expected AS e
LEFT JOIN raw_excel.INFORMATION_SCHEMA.COLUMNS AS c
  ON c.table_name = 'capacity_budget_2026' AND c.column_name = e.col
WHERE c.column_name IS NULL
```

⚠️ After a rename, the old column still exists (with blanks in new rows), so the `not_null` test is the one that fires. Keep both. When a test fails: ask the owner to put the name back. Do not "fix" it by changing the model to the new name without agreeing it.

---

## 8. Check It Worked

```
-- Excel: compare with the sheet's own totals (lab numbers shown)
SELECT site_code,
       COUNT(*)                                          AS months,
       SUM(SAFE_CAST(budget_revenue_usd AS NUMERIC))     AS budget_revenue,
       MAX(SAFE_CAST(sellable_desks AS INT64))           AS sellable_desks
FROM raw_excel.capacity_budget_2026
GROUP BY site_code;
-- Lab: SOHO 3 months, $34,250, 34 desks; RDG 3 months, $11,750, 31 desks

-- ACT365: nothing personal leaked, and no staff
SELECT column_name FROM raw_act365.INFORMATION_SCHEMA.COLUMNS
WHERE table_name = 'door_events';            -- expect no name or card number columns
```

Also: open the dataset sharing page for `raw_act365` and confirm only `sa-extract-act` and `sa-dbt` are listed, and run `dbt build` once with a column renamed in a test copy of the sheet to see the test fail.

---

## 9. Common Problems and Fixes

| What you see | Likely cause | Fix |
| --- | --- | --- |
| Nobody can say which ACT it is | The name means different things to different teams | Ask Ops and Sales separately; check the Nexudus integrations page. Do not build until answered. |
| Attendance far too high | Counting events, not person-days; office members tap two doors | Unique person-days at the main entrance only |
| Cleaners or staff in "member attendance" | Contractor or staff cards | Staff dropped in the loader; contractors dropped by the Nexudus match |
| A visit lands on the wrong day | Grouping by UTC date | Convert to Europe/London before taking the date |
| An analyst can still read `raw_act365` | A project-wide BigQuery role | Remove it; give dataset-level access only |
| Act! CSV loads with broken $ signs or split rows | Not UTF-8; line breaks inside notes | `--encoding=ISO-8859-1`; `--allow_quoted_newlines` |
| Budget numbers suddenly blank | Column renamed in the sheet | The `not_null` test fails; ask the owner to rename it back |
| New month missing | Row added outside the named range | Extend the range; leave spare rows inside it |
| Fivetran says it cannot read the sheet | Not shared with Fivetran's address, or named range deleted | Share view-only again; recreate the named range with the same name |
| Freshness test fails on `raw_excel` | Sync paused or broken | Check the Fivetran connection status and its alert email |

---

## 10. Done When

| ☐ | Check |
| --- | --- |
| ☐ | "Which ACT?" is answered in writing and recorded in `docs/decisions.md` |
| ☐ | ACT365: the privacy option is chosen, and the client's data protection lead agreed it |
| ☐ | ACT365: names, card numbers and staff never land; `raw_act365` is readable only by `sa-extract-act` and `sa-dbt`; retention is set |
| ☐ | ACT365: `extract-act` is started by `nightly-extract-act` at 02:15 Europe/London (or the attendance source is Nexudus check-ins, written down) |
| ☐ | ACT365: only `agg_company_week_attendance` (minimum group size 5) moves on into marts, and no person-level ACT data reaches marts or the BI tool |
| ☐ | Act!: the export is in the locked UK bucket, loaded to `raw_act` as STRING, row counts match the files |
| ☐ | Excel: each file has a named owner, a locked template and a README tab |
| ☐ | Excel: Fivetran syncs into `raw_excel` daily, and the totals match the sheet |
| ☐ | Excel: you renamed a column on purpose in a test copy and a dbt test failed |
| ☐ | The register rows and runbook entries are written |

---

## What's Next?

All the raw data is now landing. Next is Guide 07 — dbt: From Raw to Marts, where you turn it into clean, tested marts for the BI dashboards. Need the big picture again? Go back to Guide 01 — Start Here. 🚀

Background reading: Chapter 08 (ACT), Chapter 06 (Excel), Chapter 13 (Fivetran) and Chapter 39 (the integration map, I10 and I11).

---

# Integration Guide 07 — dbt: From Raw Data to Trusted Marts

> Source file: `integrations/integration-07-dbt-raw-to-marts.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 Guides 03 to 06 copied each business system into its own `raw_*` dataset, untouched. In this guide we turn that raw data into clean, tested tables (the **marts**) that the BI dashboards can trust. The tool is **dbt** ("data build tool"): you write SQL `SELECT` files, and dbt builds them as tables and views in BigQuery, in the right order, and tests them.

This is the biggest guide in the set (8–12 days, made up). Take it one layer at a time.

⚠️ **Read this first.** This is **🛠 our standard setup**, built from Chapters 16 and 17. The SQL and YAML below are **patterns to adapt, not tested code**: the dbt code in this series was checked by reading, never run. dbt changes often (YAML keys, where settings live, new features), so **check the current dbt docs** for your version. Field names inside the raw tables are examples: always look at your own raw data first.

What we will cover in this guide:

-   Before you start
-   The folder layout
-   Install dbt and set up `profiles.yml` (dev, CI and prod)
-   Sources and freshness
-   Staging rules, with examples
-   Seeds and intermediate models (month spine, crosswalk, `member_xref`)
-   The marts
-   Tests: generic, golden numbers, reconciliation, unit tests
-   What the BI tool reads: grants, personal data, contracts, exposures
-   Docs, CI with GitHub Actions, and the production job
-   The first full build, step by step
-   Check it worked, common problems, done when

---

## 1. Before You Start

| ☐ | You need | From |
| --- | --- | --- |
| ☐ | The two projects (`<client>-data-prod`, `<client>-data-dev`), `sa-dbt` with its roles (below) and `sa-bi-reader` | Guide 02 |
| ☐ | At least one day of data in each `raw_*` dataset | Guides 03–06 |
| ☐ | Your own Google login in the `data-engineers@` group (Data Viewer on `raw_*` in `<client>-data-prod`, Data Editor in `<client>-data-dev`) | Guide 02 / `data-admins@` |
| ☐ | The client's trusted report for the last closed month (the "golden numbers", Guide 01 question 11) | Finance / Ops ❓ |
| ☐ | Written definitions: how a site is tagged in finance, which accounts are revenue, direct cost and central cost, how many desks each plan holds | Finance / Ops ❓ |
| ☐ | Python 3 and the `gcloud` command line on your laptop | You |

🛠 `sa-dbt` roles (Guide 02): Job User on the data-prod and data-dev projects; Data Viewer on each `raw_*` (read, never change); Data Editor on `staging`, `intermediate` and `marts` only. The BI tool reads `marts` as `sa-bi-reader` (section 9).

---

## 2. The Folder Layout

The dbt project lives in the `dbt/` folder of the `<client>-data-platform` repo (Guide 01, section 6).

```
dbt/
├── dbt_project.yml          project settings, folders → datasets
├── profiles.yml             connection targets (holds NO secrets, see section 3)
├── packages.yml             extra packages, for example dbt_utils
├── requirements.txt         dbt-bigquery==<pinned version>
├── Dockerfile               the production image (section 12)
├── run.sh                   what the production job runs (section 12)
├── macros/
│   ├── generate_schema_name.sql
│   └── company_match_key.sql
├── seeds/
│   ├── site_mapping.csv
│   └── golden_numbers.csv
├── models/
│   ├── staging/
│   │   ├── nexudus/         _nexudus__sources.yml, _nexudus__models.yml, stg_nexudus__*.sql
│   │   ├── netsuite/        same pattern
│   │   ├── hubspot/
│   │   ├── excel/
│   │   └── act365/          (or act/, after you know which ACT it is, Guide 06)
│   ├── intermediate/        int_month_spine.sql, int_contract_months.sql, int_company_matching.sql ...
│   └── marts/               dim_*, fct_*, member_xref, _marts.yml, _exposures.yml
└── tests/                   singular tests: golden numbers, reconciliations, grain checks
```

Naming (Chapter 16): `stg_<source>__<table>` (two underscores), `int_<what it does>`, and marts with business names only (`fct_contract_month`, never `fct_nexudus_contracts`). Every model states its **grain** (what one row means) in a comment on line 1.

---

## 3. Install dbt and Set Up the Targets

```
cd <client>-data-platform/dbt
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt    # pins dbt-bigquery, check the current version
dbt --version
gcloud auth application-default login   # your own Google login, used by the dev target
```

A **target** is a named connection: where dbt builds and as whom. We keep three. **`dbt/profiles.yml`**:

```
<client>_dbt:
  target: dev
  outputs:
    dev:                         # your laptop, your own Google login
      type: bigquery
      method: oauth
      project: <client>-data-dev
      dataset: "dbt_{{ env_var('DBT_USER') }}"     # for example dbt_priya
      location: europe-west2
      threads: 4
    ci:                          # GitHub Actions, one dataset per pull request
      type: bigquery
      method: oauth
      project: <client>-data-dev
      dataset: "ci_pr_{{ env_var('PR_NUMBER', '0') }}"
      location: europe-west2
      threads: 4
    prod:                        # the Cloud Run job, running as sa-dbt
      type: bigquery
      method: oauth
      project: <client>-data-prod
      dataset: staging           # default only; folders set the real datasets
      location: europe-west2
      threads: 8
```

Why no key file? `method: oauth` uses Google's "application default credentials": on your laptop that is your login; on Cloud Run it is the job's own service account (`sa-dbt`); in CI it is Workload Identity Federation (section 11). So this file holds **no secrets** and can live in Git. Run dbt with `--profiles-dir .` or set `DBT_PROFILES_DIR=.` 📘 check the dbt-bigquery docs.

**`dbt_project.yml`** (the important parts):

```
name: <client>_dbt
profile: <client>_dbt

vars:
  raw_project: <client>-data-prod      # dev and CI READ prod raw data
  spine_start: "2024-01-01"            # first month we report on (ask the client)
  spine_end:   "2027-12-01"

models:
  <client>_dbt:
    staging:      {+schema: staging,      +materialized: view}
    intermediate: {+schema: intermediate, +materialized: view}
    marts:        {+schema: marts,        +materialized: table}   # dashboards query these a lot

seeds:
  <client>_dbt:
    +schema: staging
```

**`macros/generate_schema_name.sql`** decides dataset names. In prod we want the plain names (`staging`, `marts`, ...). In dev and CI we want your own copies, so you never overwrite production:

```
{% macro generate_schema_name(custom_schema_name, node) -%}
    {%- if target.name == 'prod' and custom_schema_name is not none -%}
        {{ custom_schema_name | trim }}                         {# marts #}
    {%- elif custom_schema_name is not none -%}
        {{ target.schema }}_{{ custom_schema_name | trim }}     {# dbt_priya_marts, ci_pr_42_marts #}
    {%- else -%}
        {{ target.schema }}
    {%- endif -%}
{%- endmacro %}
```

```
export DBT_USER=priya        # Windows PowerShell: $env:DBT_USER = "priya"
dbt debug --profiles-dir .   # should end with "All checks passed!"
```

---

## 4. Sources and Freshness

A **source** tells dbt where a raw table is. Because sources point at `<client>-data-prod`, your dev build reads real raw data (read-only, through Data Viewer) and writes only into `dbt_<yourname>_*` in the dev project. **Freshness** asks "was this loaded recently?" and fails when a loader has quietly stopped.

**`models/staging/nexudus/_nexudus__sources.yml`**:

```
version: 2
sources:
  - name: nexudus
    database: "{{ var('raw_project') }}"
    schema: raw_nexudus
    loaded_at_field: _loaded_at              # added by our Python extractor (Guide 05)
    freshness:
      warn_after:  {count: 26, period: hour}   # made up: a daily load plus 2 hours
      error_after: {count: 50, period: hour}   # made up: two missed loads
    tables:
      - name: contracts                        # use the table names your Guide 05 job writes
      - name: members
      - name: companies
      - name: resources
      - name: bookings
```

For Fivetran sources (NetSuite, HubSpot, Excel) use `loaded_at_field: _fivetran_synced`. Finance can use a longer error limit (for example 72 hours, made up). A sheet that rarely changes can look "stale" even when the sync is fine: give it a long limit and rely on Fivetran's own sync alerts too. 📘 Newer dbt versions put `freshness` and `loaded_at_field` under `config:`; check the docs.

```
dbt source freshness --profiles-dir .
# PASS freshness of nexudus.contracts ... (or WARN / ERROR)
```

---

## 5. Staging Rules, with Examples

**Staging** is the first clean copy of each raw table. The rules (🛠 our standard):

1.  One model per raw table that something uses.
2.  Rename to clear `snake_case` names (`contract_id`, not `Id`).
3.  Cast every type: raw JSON and sheets are mostly text.
4.  Times as UTC `TIMESTAMP`; work out UK dates on purpose (23:30 in summer is the next day in UTC).
5.  De-duplicate: keep the latest version of each record (our Nexudus load only adds rows).
6.  Drop rows where `_fivetran_deleted` is true (Fivetran marks deletes instead of removing rows).
7.  Drop personal columns nobody downstream needs (phones, card numbers): the less personal data you carry, the less can leak.
8.  **No joins, no business rules.** Those belong in intermediate and marts.

**Nexudus** raw tables hold `id`, `updated_on`, `payload` (the API record as a JSON string) and `_loaded_at`. **`stg_nexudus__contracts.sql`**:

```
-- Grain: one row per Nexudus contract (latest version only).
with latest as (
    select *
    from {{ source('nexudus', 'contracts') }}
    qualify row_number() over (
        partition by id order by updated_on desc, _loaded_at desc) = 1
)
select
    cast(id as string)                                          as contract_id,
    json_value(payload, '$.CoworkerId')                         as member_id,     -- example paths:
    json_value(payload, '$.TeamId')                             as company_id,    -- check YOUR payload
    json_value(payload, '$.TariffName')                         as plan_name,
    json_value(payload, '$.ResourceId')                         as resource_id,
    upper(trim(json_value(payload, '$.LocationName')))          as nexudus_location_name,
    safe_cast(json_value(payload, '$.StartDate') as date)       as start_date,
    safe_cast(nullif(json_value(payload, '$.EndDate'), '') as date) as end_date,  -- NULL = rolling
    safe_cast(json_value(payload, '$.Price') as numeric)        as monthly_price_usd,
    updated_on                                                  as source_updated_at_utc
from latest
```

Find the real field names first: ``select payload from `<client>-data-prod.raw_nexudus.contracts` limit 5``. JSON paths are case-sensitive.

**Fivetran** tables (NetSuite, HubSpot, Excel) are already one row per record, so no `QUALIFY`; just filter deletes. 📘 Table and column names come from the Fivetran connector schema; check what landed in your `raw_netsuite`.

```
-- stg_netsuite__accounts.sql
-- Grain: one row per NetSuite account.
select
    cast(id as string)            as account_id,
    acctnumber                    as account_number,
    accountsearchdisplayname      as account_name,
    accttype                      as account_type
from {{ source('netsuite', 'account') }}
where not coalesce(_fivetran_deleted, false)
```

💡 Fivetran publishes free dbt packages for some connectors (NetSuite and HubSpot among them) 📘. They can save days, but read what they build before you use them, and keep our layer and naming rules on top.

Add the generic tests for staging keys in `_nexudus__models.yml` (section 8). Then:

```
dbt build --select staging --profiles-dir .
```

---

## 6. Seeds and Intermediate Models

A **seed** is a small CSV in Git that dbt loads as a table. Use seeds for small mappings that people keep by hand. **`seeds/site_mapping.csv`** (one row per site; names made up):

```
site_code,site_name,nexudus_location_name,netsuite_site_value,act_site_name,hubspot_site_value
SOHO,Soho,SOHO,Soho,Soho,soho
RDG,Reading,READING,Reading,Reading,reading
```

Each system names a site its own way; this file joins them. Give it an owner on the client side (Finance or Ops ❓). A new site means a new row, reviewed in a pull request.

**Intermediate** models hold rules several marts reuse. Nobody outside the data team queries them.

**1. The month spine** (a list of months), because leaders ask "per month" but a contract is one row with dates:

```
-- int_month_spine.sql
-- Grain: one row per calendar month.
select month_start, last_day(month_start) as month_end
from unnest(generate_date_array(
    date '{{ var("spine_start") }}', date '{{ var("spine_end") }}', interval 1 month)) as month_start
```

**2. Contract months**: one row per contract per month in which it is **active on the last day of the month** (the canonical rule, CLAUDE.md §7):

```
-- int_contract_months.sql
-- Grain: one row per contract per month, active on the month's last day.
with contracts as (       -- staging has no joins, so the site code is added here, from the seed
    select c.*, s.site_code
    from {{ ref('stg_nexudus__contracts') }} c
    left join {{ ref('site_mapping') }} s using (nexudus_location_name)
)
select m.month_start, m.month_end, c.contract_id, c.member_id, c.company_id, c.site_code,
       c.plan_name, c.monthly_price_usd as mrr_usd,
       case when c.plan_name = 'Private Office'      then r.capacity_people   -- desk rule and plan
            when c.plan_name = 'Unlimited Coworking' then 1                   -- names: agree with Ops ❓
            else 0 end as desks
from contracts c
join {{ ref('int_month_spine') }} m
  on c.start_date <= m.month_end
 and (c.end_date is null or c.end_date >= m.month_end)
left join {{ ref('stg_nexudus__resources') }} r using (resource_id)
```

**3. The company crosswalk** (`int_company_matching`): one row per real company with its ID in each system. The best match is a **shared ID**: ask whether HubSpot or NetSuite stores the Nexudus ID in a field ❓. Only when there is none, match on a cleaned name with the `company_match_key` macro from Chapter 16 (lowercase, "&" → "and", drop "Ltd", drop punctuation).

```
  Nexudus company ─┐
  HubSpot company ─┼── shared ID if it exists, else company_match_key(name) ──► int_company_matching
  NetSuite customer┤                                                           ──► dim_company
  Act! company  ───┘   (only if "ACT" turns out to be the CRM, Guide 06)
```

**4. `member_xref`**: one row per member with their ID in each system. Typical matching (🛠 our standard; confirm with the client):

-   **Nexudus:** the anchor (member ID). Keep our own key (`MB-...`) so it survives a source change (for example HubSpot replacing Nexudus as the member source).
-   **HubSpot:** shared ID if stored, else exact email (lowercase, trimmed). Watch for two contacts with one email.
-   **NetSuite:** usually company level only (the customer), not the person.
-   **ACT365** (if "ACT" is door access): exact email on the cardholder. **Act!** (if it is the CRM): email domain + cleaned name.

Add a `match_method` column (`shared_id`, `exact_email`, `domain_and_name`) so anyone can see how sure a match is. Count the unmatched rows and show them to the client every week until the number is small and explained.

---

## 7. The Marts

**Marts** are the business-ready tables. A **dimension** (`dim_`) describes a thing; a **fact** (`fct_`) records events or measures. These names are canonical (CLAUDE.md §7); every guide and chapter uses them.

| Mart | Grain (one row per...) | Notes |
| --- | --- | --- |
| `dim_site` | site | With every system's name for it (from the seed) |
| `dim_company` | real company (members and prospects) | Holds `billing_email` (personal: keep it away from dashboards that do not need it) |
| `dim_member` | person | Personal data (names, emails). Only for the few reports that truly need people. |
| `member_xref` | person | IDs in each system. For the data team, not for dashboards. |
| `fct_contract_month` | contract per month (active on the last day) | MRR and desks live here |
| `fct_contract_events` | contract movement | `movement_type` = new / upgrade / downgrade / transfer / renewal / churn (Chapter 29) |
| `fct_booking` | booking | Meeting rooms, day passes |
| `fct_gl` | GL line | `pl_category` = revenue / direct_cost / central_cost. Agree the account ranges and sign rule with Finance, in writing. |
| `fct_site_month_kpis` | site per month | The main table behind the leadership dashboards (below) |

Door data (if "ACT" turns out to be door access): no per-person door events in marts. If the client wants attendance, build a company-level aggregate such as `agg_company_week_attendance` (company × week, only groups of 5 or more people), and agree it with the client first ❓.

`fct_site_month_kpis` columns include `mrr_usd`, `revenue_usd`, `direct_costs_usd`, `contribution_usd`, `central_costs_usd`, `contribution_after_central_usd`, `revenue_vs_budget_usd`, `desk_occupancy`, `sellable_desks`, `desks_contracted` and `has_finance_actuals`. Build it the Chapter 16 way: sum contracts, GL, bookings and budget to site × month **each in its own CTE first**, then join them to a site × month frame. Joining before summing multiplies rows (the "$20,250 bug").

Two rules worth repeating:

-   **No data is not zero.** If no GL lines exist for a month, finance columns stay `NULL` and `has_finance_actuals = false`.
-   **Months close.** For a real client, use the NetSuite **accounting period**, not the transaction date, and carry a "period closed" flag, so dashboards can mark an open month as "provisional" (it can still change). (The series' lab used transaction dates and has no such flag yet; it is a known gap.)

---

## 8. Tests

A dbt **test** is a query that should return zero rows. If it returns rows, the test fails, and `dbt build` skips every model downstream of it.

**1. Generic tests** (one line in YAML). In `models/marts/_marts.yml`:

```
version: 2
models:
  - name: fct_contract_month
    columns:
      - name: site_code
        data_tests:
          - not_null
          - relationships: {to: ref('dim_site'), field: site_code}
  - name: fct_gl
    columns:
      - name: site_code
        description: "NULL means a NetSuite site value is missing from seeds/site_mapping.csv"
        data_tests: [not_null]
      - name: pl_category
        data_tests:
          - accepted_values: {values: ['revenue', 'direct_cost', 'central_cost']}
```

📘 Older dbt versions call the key `tests:`; the newest nest test settings under `arguments:`. Check your version. Also put `accepted_values` on any code that drives a rule (for example plan codes): a new plan should fail loudly, not quietly count as 0 desks.

**2. Golden-number tests**: compare the marts with the client's own trusted report. Put the report's figures in **`seeds/golden_numbers.csv`** (made up: these are the Mini Work.Life lab figures from Chapter 16):

```
site_code,month_start,metric,expected_value,source_report
SOHO,2026-09-01,mrr_usd,3040,September board pack p.4
SOHO,2026-09-01,revenue_usd,3475,NetSuite P&L by site (closed)
SOHO,2026-09-01,desks_contracted,6,Ops occupancy sheet
```

**`tests/assert_golden_numbers.sql`**:

```
-- Returns one row per golden figure that the mart does NOT match.
with kpis as (            -- UNPIVOT needs one type for all columns
    select site_code, month_start,
           cast(mrr_usd as numeric)          as mrr_usd,
           cast(revenue_usd as numeric)      as revenue_usd,
           cast(desks_contracted as numeric) as desks_contracted
    from {{ ref('fct_site_month_kpis') }}
),
actual as (
    select * from kpis
    unpivot (value for metric in (mrr_usd, revenue_usd, desks_contracted))
)
select g.*, a.value as actual_value
from {{ ref('golden_numbers') }} g
left join actual a using (site_code, month_start, metric)
where a.value is distinct from g.expected_value    -- NOT "!=": a NULL must fail too
```

⚠️ `UNPIVOT` drops NULL values by default, so a missing value shows up as "no match" and the test fails, which is what we want. Money on closed months has **$0 tolerance** (🛠 our standard; agree it with Finance). If the report rounds to whole dollars, round the same way in the test and write that in `docs/decisions.md`.

**3. Reconciliation test**: two systems that should agree. Nexudus invoices versus NetSuite revenue per site per month. Differences can be real (credit notes, timing), so make it a **warning** above a tolerance agreed with Finance:

```
-- tests/warn_revenue_nexudus_vs_netsuite.sql
{{ config(severity = 'warn') }}
with nexudus as (
    select site_code, month_start, sum(invoiced_usd) as nexudus_usd
    from {{ ref('int_nexudus_invoice_lines') }} group by 1, 2),
netsuite as (
    select site_code, month_start, revenue_usd as netsuite_usd
    from {{ ref('fct_site_month_kpis') }} where has_finance_actuals)
select *, coalesce(nexudus_usd, 0) - coalesce(netsuite_usd, 0) as difference_usd
from nexudus full outer join netsuite using (site_code, month_start)
where abs(coalesce(nexudus_usd, 0) - coalesce(netsuite_usd, 0)) > 50   -- tolerance made up
```

(`int_nexudus_invoice_lines` is an example name: build it only if you load Nexudus invoices.) Write each known cause of a difference into the test's comment.

**4. Unit tests** (dbt 1.8 and later) check a **business rule** with made-up input rows, including cases real data does not have yet. Copy the Chapter 17 example for `int_contract_months`: a Flex contract gives MRR but 0 desks; a contract starting mid-month counts; a contract with no end date carries on.

```
dbt test --select "test_type:unit" --profiles-dir .
```

Also add a **grain test** per fact: group by the grain columns, `having count(*) > 1` should return nothing.

---

## 9. What the BI Tool Reads: Grants, Personal Data, Contracts, Exposures

The BI tool (Tableau today; the brief says it is under review, so "do not assume Tableau is fixed" ✅) reads the **marts** and nothing else. It signs in to BigQuery as `sa-bi-reader`, with BigQuery Data Viewer on `marts` and Job User to run queries (Guide 02). It never reads `raw_*`, `staging` or `intermediate`, and it can never write.

**Personal data.** `dim_member`, `member_xref` and `dim_company.billing_email` live in `marts` because some work needs them, but most dashboards do not. 🛠 Give the BI reader only what the dashboards need:

| Mart | BI reader? | Why |
| --- | --- | --- |
| `dim_site`, `fct_site_month_kpis`, `fct_contract_month`, `fct_contract_events`, `fct_booking`, `fct_gl` | Yes | Sites, companies, money and counts |
| `dim_company` | Yes, ideally without `billing_email` | Dashboards need company names, not their emails |
| `dim_member`, `member_xref` | Only if a named dashboard needs people ❓ | Names and emails; ask the client which reports truly need them |
| Door data | Company-level aggregate only | Per-person door events are location tracking |
| HR data | Never (not loaded at all) | ✅ Brief: people/HR data excluded |

How to do it, two ways:

-   **Simple (Guide 02 standard):** `sa-bi-reader` has Data Viewer on the whole `marts` dataset. Fine only if the client agrees dashboard builders may see `dim_member`. Write that decision down.
-   **Tighter:** grant read on each needed table instead, with dbt's `grants` config, so the BI reader cannot see `dim_member` or `member_xref` at all. It needs `sa-dbt` to have the right to change table permissions (more than Data Editor), and only in prod. 📘 Check the dbt-bigquery grants docs for the format.

```
-- example: models/marts/fct_site_month_kpis.sql (tighter option)
{{ config(grants = {'roles/bigquery.dataViewer':
           ['serviceAccount:sa-bi-reader@<client>-data-prod.iam.gserviceaccount.com']}
           if target.name == 'prod' else {}) }}
```

A **model contract** fixes a model's column names and types: if a change would add, drop, rename or retype a column, the build fails. Dashboards break when a column they use disappears, so put contracts on the marts the dashboards read. In `models/marts/_marts.yml`:

```
  - name: dim_site
    config:
      contract: {enforced: true}
    columns:
      - {name: site_code,         data_type: string}
      - {name: site_name,         data_type: string}
      - {name: netsuite_location, data_type: string}
      # ... every column, each with its type
```

An **exposure** records which dashboard uses which models, so dbt's lineage reaches the dashboard. Then `dbt ls --select +exposure:leadership_kpi_dashboard` lists everything that dashboard depends on.

```
# models/marts/_exposures.yml
version: 2
exposures:
  - name: leadership_kpi_dashboard
    type: dashboard
    url: https://<your BI tool>/<dashboard link>
    owner: {name: Client reporting owner (role), email: data-analysts@<client domain>}
    depends_on:
      - ref('fct_site_month_kpis')
      - ref('dim_site')
      - ref('dim_company')
```

⚠️ One honest limit: dbt tests a model **after** it builds it. If a test on `fct_site_month_kpis` fails, the models after it are skipped, but that table already holds the new numbers and the dashboard shows them. Your protection is the alert (Guide 08) and a quick fix. If the client needs more, look at a "build in a separate dataset, test, then swap" pattern (📘 check current dbt docs; more work to run).

---

## 10. Docs

```
dbt docs generate --profiles-dir .
dbt docs serve --profiles-dir .      # opens the docs site in your browser
```

You get a page per model: description, columns, tests, SQL and the lineage graph. This becomes the **data dictionary** handed over in Guide 09. Describe every mart column: dashboard builders read these, and they will guess about a column with no description (and two dashboards may then guess differently). Share the docs site only inside the client, never publicly.

---

## 11. CI with GitHub Actions

**CI** (continuous integration) means every pull request is built and tested automatically before it is merged. Ours runs `dbt build` into `ci_pr_<number>_*` datasets in the dev project. It logs in to Google with **Workload Identity Federation**: GitHub proves who it is and gets a short-lived token, so there is no key file to leak. 📘 Check Google's and GitHub's current docs for the setup steps and action versions.

```
# .github/workflows/dbt-ci.yml
name: dbt-ci
on:
  pull_request:
    paths: ["dbt/**"]
permissions:
  contents: read
  id-token: write                      # needed for Workload Identity Federation
jobs:
  build:
    runs-on: ubuntu-latest
    defaults: {run: {working-directory: dbt}}
    env:
      DBT_PROFILES_DIR: .
      PR_NUMBER: ${{ github.event.pull_request.number }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: {python-version: "3.11"}
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: projects/<number>/locations/global/workloadIdentityPools/github/providers/github
          service_account: sa-dbt-ci@<client>-data-dev.iam.gserviceaccount.com
      - run: pip install -r requirements.txt
      - run: dbt deps
      - run: dbt build --target ci
```

🛠 **Our choice: a separate CI account, `sa-dbt-ci`**, with Data Viewer on `raw_*` in data-prod, plus BigQuery Data Editor and Job User at project level on `<client>-data-dev` **only** (Data Editor lets it create the `ci_pr_<number>_*` datasets). Guide 02 did not create this account or these grants, so **add them to `infra/`** and to the access list. Unmerged code can then never write to production, which is why we do not reuse `sa-dbt` here. CI datasets hold copies of personal data (for example `dim_member`): give them a short expiry (3 days, made up) and delete them when the pull request closes. Protect `main` so the CI check must pass before merging.

---

## 12. The Production Job: Docker, Cloud Run, Scheduler

🛠 Production runs **dbt Core in a container** as the Cloud Run job `dbt-build`, as `sa-dbt`, every night at 03:00 Europe/London, after the loaders. **`dbt/Dockerfile`**:

```
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV DBT_PROFILES_DIR=/app
RUN dbt deps                      # packages fetched once, at build time, not every night
CMD ["sh", "/app/run.sh"]
```

**`dbt/run.sh`**, the entry script (the same name Guide 08 uses):

```
#!/bin/sh
set -e                            # stop at the first command that fails
dbt source freshness
dbt build --target prod "$@"      # "$@" lets you pass extra options, for example --select
```

`set -e` means "stop if a step fails". A freshness error stops the run; a failed test makes `dbt build` skip every model after the failing one, and the job ends with an error that Guide 08's alert picks up.

```
# 1. The image store is the Artifact Registry repo "data-jobs" (europe-west2, Guide 02)

# 2. Build and push the image (from the dbt/ folder)
gcloud builds submit --project=<client>-data-prod \
  --tag europe-west2-docker.pkg.dev/<client>-data-prod/data-jobs/dbt-build:v1

# 3. Create the job, running as sa-dbt
gcloud run jobs create dbt-build --project=<client>-data-prod --region=europe-west2 \
  --image=europe-west2-docker.pkg.dev/<client>-data-prod/data-jobs/dbt-build:v1 \
  --service-account=sa-dbt@<client>-data-prod.iam.gserviceaccount.com \
  --task-timeout=3600 --max-retries=0

# 4. Run it once by hand and wait
gcloud run jobs execute dbt-build --region=europe-west2 --project=<client>-data-prod --wait

# 5. Schedule it: 03:00 UK time, every day
gcloud scheduler jobs create http nightly-dbt-build --project=<client>-data-prod \
  --location=europe-west2 --schedule="0 3 * * *" --time-zone="Europe/London" \
  --http-method=POST \
  --uri="https://run.googleapis.com/v2/projects/<client>-data-prod/locations/europe-west2/jobs/dbt-build:run" \
  --oauth-service-account-email=sa-dbt@<client>-data-prod.iam.gserviceaccount.com
# sa-dbt needs Cloud Run Invoker on the dbt-build job (Guide 08, step 3)
```

📘 Check the current `gcloud` docs for flags. Guide 08 covers the full nightly order, alerts and the runbook. **Alternative:** dbt Cloud (the paid hosted version) can run the schedule and CI for you. It is fine if the client prefers it; the models, tests and datasets stay the same.

---

## 13. The First Full Build, Step by Step

```
 STEP  COMMAND (with DBT_PROFILES_DIR=.)    WHAT YOU SHOULD SEE
  1    dbt debug                           "All checks passed!"
  2    dbt deps  then  dbt seed            seeds in dbt_<yourname>_staging
  3    dbt source freshness                PASS for every source (fix loaders first if not)
  4    dbt build --select staging          views built, key tests pass, counts match raw after de-dup
  5    dbt build --select intermediate     crosswalk built: look at the unmatched count
  6    dbt build --select marts            golden test passes (or each gap is explained)
  7    dbt build                           everything, in graph order, all tests green
  8    open a pull request                 the CI check goes green
  9    merge, build image, run job --wait  job succeeds; prod marts tables are rebuilt
                                           and the BI tool shows the new numbers
 10    wait for the 03:00 run              it succeeds with nobody touching it
```

---

## 14. Check It Worked

```
-- 1. Did the nightly job build today? (last change time per table)
select table_id, timestamp_millis(last_modified_time) as last_built
from `<client>-data-prod.marts.__TABLES__` order by last_built;

-- 2. Does the KPI mart match the client's report for the last closed month?
select site_code, mrr_usd, revenue_usd, desks_contracted, sellable_desks, desk_occupancy
from `<client>-data-prod.marts.fct_site_month_kpis`
where month_start = '2026-09-01' order by site_code;

-- 3. Where are the personal-looking columns in marts? Expect ONLY the ones
--    you agreed (dim_member, member_xref, dim_company.billing_email), and nothing HR.
select table_name, column_name
from `<client>-data-prod.marts.INFORMATION_SCHEMA.COLUMNS`
where regexp_contains(lower(column_name),
      r'email|phone|first_name|last_name|card|salary|payroll');
```

Also check: the job's logs show `PASS` for every test; the dbt docs site opens; the BI tool, signed in as `sa-bi-reader`, can read the marts it needs and gets "Access Denied" on `raw_*` and `staging`; a leadership dashboard shows the same September numbers as query 2.

---

## 15. Common Problems and Fixes

| Problem | Likely cause | Fix |
| --- | --- | --- |
| "Access Denied" reading a source | No Data Viewer on that `raw_*`, or the source has no `database:` so dbt looks in the dev project | Check the role; set `database: "{{ var('raw_project') }}"` |
| "Not found: Dataset ... was not found in location US" | Region mismatch | `location: europe-west2` in every target; create datasets in London |
| Your dev run wrote into `marts` (prod names) | `generate_schema_name` wrong, or `--target prod` on your laptop | Fix the macro; your own login should not have write rights in prod at all |
| MRR too high, contracts appear twice | Missing `QUALIFY` de-dup in staging | Add it; add a `unique` test on the ID |
| A column is all NULL after staging | Wrong JSON path (they are case-sensitive) | Look at a raw `payload` and fix the path |
| Golden test fails, site revenue is NULL | Finance renamed a site value; seed not updated | Add the new value to `site_mapping.csv`; ask Finance to tell you next time |
| Contract error: "data type mismatch" | `float64` where the contract says `numeric` | Cast in the model; change the contract only on purpose |
| Bookings in the wrong month | UTC date used where a UK date was meant | `date(booking_start_utc, 'Europe/London')` |
| CI cannot log in to Google | `id-token: write` missing, or the pool does not trust this repo | Check the workflow permissions and the provider's attribute condition |
| Freshness fails on Excel every week | The sheet rarely changes | Longer threshold for that source; write the reason down |

---

## 16. Done When

| ☐ | Check |
| --- | --- |
| ☐ | Every raw table used has a source with freshness, and every source passes |
| ☐ | One staging model per used raw table: renamed, cast, UTC, de-duplicated, deletes dropped, no joins |
| ☐ | All canonical marts built, each with its grain in a comment and a grain test |
| ☐ | Generic tests on every key and relationship; `accepted_values` on codes that drive rules |
| ☐ | Golden-number test matches the client's report for the last closed month (or each gap is explained and written down) |
| ☐ | Reconciliation runs as a warning; unit tests cover the desk rule, rolling contracts, mid-month starts |
| ☐ | `sa-bi-reader` reads only the marts the dashboards need (read only); the choice about `dim_member` is written down |
| ☐ | The personal-column check (section 14) shows only the agreed columns; no HR data; door data company-level only |
| ☐ | Contracts on the marts dashboards read; an exposure for each main dashboard |
| ☐ | CI runs on every pull request with no key files; `main` is protected |
| ☐ | `dbt-build` ran at 03:00 by itself and succeeded; when you broke a test on purpose, the job failed, later models were skipped and the alert arrived |
| ☐ | Descriptions on every mart column; `dbt docs generate` works |
| ☐ | Definitions (accounts, sign rule, desk rule, site mapping) agreed in writing and logged in `docs/decisions.md` |

---

## What's Next?

Your models build and test themselves every night. Now make sure everything runs in the right order and that someone hears about it when it does not: Guide 08 — Scheduling and Monitoring. 🚀

Background reading, if a step feels unclear: Chapter 16 (dbt layers), Chapter 17 (tests, freshness, docs, lineage), Chapter 14 (the de-dup pattern) and Chapter 18 (the BI layer).

---

# Integration Guide 08 — Scheduling, Monitoring and the Fix-It Runbook

> Source file: `integrations/integration-08-scheduling-monitoring.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 Up to now every piece of the pipeline has been run by hand. This guide makes it **run by itself every night, in the right order**, and makes sure that when something breaks, a person finds out before the leadership team does.

It is for the engineer who has finished Guide 05 (the Nexudus job works when run by hand) and Guide 07 (dbt builds and tests pass). At the end you will have: a nightly schedule, alerts to email and chat, a stale-data guard, a list of routine checks, cost monitoring, and a **fix-it runbook** that someone who has never seen the pipeline can follow at 8am on a Monday.

⚠️ **Read this first.** This is **our standard setup** 🛠, not a copy of Work.Life's real pipeline. The brief only says the pipeline is "kept running by an external data partner" (✅ brief); how and when it runs there is unknown ❓. Google Cloud and Fivetran screens change often: if a menu name below does not match, check the vendor's current docs. All times, limits and amounts marked "(made up)" are examples.

What we will cover:

-   Before you start
-   The nightly run order
-   Scheduling each piece (Cloud Scheduler and Fivetran)
-   The dbt-build job and the stale-data guard
-   Alerts: notification channels, job failure alerts, log-based alerts
-   Check it worked: break it on purpose
-   Daily, weekly and monthly checks
-   Cost monitoring
-   Re-running a job by hand, and backfills
-   The fix-it runbook
-   Common problems, and the "done when" list

---

## 1. Before You Start

| You need | From |
| --- | --- |
| Cloud Run jobs `extract-nexudus` (and `extract-act` if used) deployed and working when run by hand | Guides 05, 06 |
| Fivetran connectors for NetSuite, HubSpot and Excel syncing | Guides 03, 04, 06 |
| The dbt project in Git, with source freshness set in `_sources.yml` | Guide 07 |
| Projects, service accounts, secrets and the `data-jobs` image repository | Guide 02 |
| An alert email address (a shared mailbox or group, for example `data-alerts@acme.com`, never one person's inbox) | Client IT ❓ |
| The client's chat tool (Slack, Google Chat or Teams) and a webhook for an alerts channel | Client IT ❓ |
| Who is on call for failures, and in which hours | ❓ Ask the client (support hours are part of the brief's Section 7 questions) |

```
export PROD=acme-data-prod REGION=europe-west2
```

---

## 2. The Nightly Run Order

The order matters more than the exact times. **Load first, then check freshness, then build, then test.** If any step fails, the steps after it must not publish half-fresh numbers.

```
  UK TIME (Europe/London)                                          ON FAILURE
  ─────────────────────────────────────────────────────────────────────────────────
  00:30 UTC  Fivetran: NetSuite, HubSpot, Excel syncs start        Fivetran emails
             (must finish before 03:00 UK)                         + freshness catches it

  02:00      Cloud Scheduler ──► Cloud Run job  extract-nexudus    job fails ──► alert
                                 └─► raw_nexudus

  02:15      Cloud Scheduler ──► Cloud Run job  extract-act        job fails ──► alert
                                 └─► raw_act365 / raw_act

  03:00      Cloud Scheduler ──► Cloud Run job  dbt-build
               1. dbt source freshness   any source too old?  ──► stop, job fails ──► alert
               2. dbt build              seeds ► models ► tests, in graph order
                    a test fails ──► every model after it is SKIPPED
                    (marts keep yesterday's good data)     ──► job fails ──► alert

  ~03:30     BI dashboards read fresh, tested data
  ─────────────────────────────────────────────────────────────────────────────────
  Any failed job ──► Cloud Monitoring alert ──► email + chat channel
```

Why these times? 🛠 Overnight, nobody is editing contracts in Nexudus, so the data is calm. 03:00 leaves room for the extractors to finish. Before you lock the times in, run each job by hand a few times and note how long it takes. If `extract-nexudus` often takes 50 minutes, move it earlier, not dbt later.

⚠️ **Simple time-based order, not a chain.** dbt does not "wait" for the extractors; it just starts at 03:00. That is fine for a client this size, because the freshness check is the safety net: if an extractor did not finish, its data is old and freshness says so. If you later find yourself juggling many timings, that is the moment to look at a proper workflow tool (for example Cloud Workflows), not before. Write the choice in `docs/decisions.md`.

---

## 3. Scheduling Each Piece

### 3a. Give each job's own service account the right to start its job

📘 Cloud Scheduler starts a Cloud Run job by calling the Cloud Run API with a token for a service account. 🛠 We use the job's **own** service account and give it **Cloud Run Invoker** on that one job only, so we do not need an extra account.

```
gcloud run jobs add-iam-policy-binding extract-nexudus --region=$REGION --project=$PROD \
  --member=serviceAccount:sa-extract-nexudus@$PROD.iam.gserviceaccount.com \
  --role=roles/run.invoker
# repeat for extract-act (sa-extract-act) and dbt-build (sa-dbt)
```

### 3b. Set a timeout on each job

A job that hangs forever is a silent failure. 🛠 Give each job a time limit and a retry count:

```
gcloud run jobs update extract-nexudus --region=$REGION --project=$PROD \
  --task-timeout=45m --max-retries=1          # made up: base it on real run times
gcloud run jobs update dbt-build --region=$REGION --project=$PROD \
  --task-timeout=60m --max-retries=0          # never auto-retry dbt; a person should look
```

### 3c. Create the Cloud Scheduler jobs

```
mksched () {  # usage: mksched NAME "CRON" CLOUD_RUN_JOB SERVICE_ACCOUNT
  gcloud scheduler jobs create http $1 --project=$PROD --location=$REGION \
    --schedule="$2" --time-zone="Europe/London" \
    --http-method=POST \
    --uri="https://run.googleapis.com/v2/projects/$PROD/locations/$REGION/jobs/$3:run" \
    --oauth-service-account-email=$4@$PROD.iam.gserviceaccount.com \
    --attempt-deadline=180s
}

mksched nightly-extract-nexudus "0 2 * * *"  extract-nexudus sa-extract-nexudus
mksched nightly-extract-act     "15 2 * * *" extract-act     sa-extract-act
mksched nightly-dbt-build       "0 3 * * *"  dbt-build       sa-dbt
```

The `--schedule` value is a **cron** line: `minute hour day-of-month month day-of-week`. So `"15 2 * * *"` means 02:15 every day. With `--time-zone="Europe/London"`, Google moves the run with British Summer Time for you.

📘 The Scheduler only **starts** the job; the call returns as soon as the run begins, so a "success" in Cloud Scheduler does **not** mean the job worked. The job's own result is what the alerts in section 5 watch. You can also create these from the console: **Cloud Run → Jobs → your job → Triggers → Add scheduler trigger**. Some docs show an older address form (`https://europe-west2-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/PROJECT/jobs/JOB:run`); either works today, but check the current docs.

### 3d. Fivetran sync times

📘 In Fivetran, open each connector → **Setup** tab → **Sync frequency**. Pick **24 hours** (or 12), then set the **sync start time**. ⚠️ Check in the current Fivetran docs which time zone that screen uses. If it is UTC, then 00:30 UTC is 00:30 UK in winter and 01:30 UK in summer: both well before 03:00.

| Connector | Frequency (🛠) | Start (made up) | Typical run (measure it) |
| --- | --- | --- | --- |
| NetSuite | 24 hours | 00:30 UTC | ❓ measure |
| HubSpot | 24 hours | 00:30 UTC | ❓ measure |
| Excel / Sheets | 24 hours | 00:30 UTC | ❓ measure |

💡 Fivetran's price is based on rows changed (📘 "monthly active rows"), not on how often it syncs, but more syncs can still add cost on some connectors. Daily is enough for board-pack and monthly KPI dashboards, which mostly look at closed months. Guide 01's register says "every 6 hours"; that is fine too if the client wants fresher CRM data. Pick one and write it in the register.

---

## 4. The dbt-build Job and the Stale-Data Guard

🛠 The `dbt-build` Cloud Run job runs a small script, `dbt/run.sh`, built into its image (Guide 07 builds the image):

```
#!/usr/bin/env bash
# dbt/run.sh  -  entrypoint of the dbt-build Cloud Run job
set -euo pipefail              # any failing command stops the script with an error

dbt deps
echo "Step 1: source freshness"
dbt source freshness --target prod          # ERROR on any source = exit 1 = job fails

echo "Step 2: build"
dbt build --target prod "$@"                # extra args allow manual runs (section 9)
```

**Source freshness** is the stale-data guard. It looks at the newest load time in each raw table (`_loaded_at` for our Python loaders, `_fivetran_synced` for Fivetran tables) and compares it to now. 📘 A `warn_after` only prints a warning; an `error_after` makes the command fail.

| Source | warn after | error after | Why (🛠) |
| --- | --- | --- | --- |
| nexudus | 24 hours | 48 hours | Loaded every night; two missed nights is a real problem |
| netsuite | 24 hours | 72 hours | Finance changes slowly (Chapter 17) |
| hubspot | 24 hours | 48 hours | Daily sync |
| excel | 7 days | 35 days | Budget sheets change rarely. Use the load time, not the edit time. |
| act365 / act | 24 hours | 48 hours | If it is a one-off export, turn freshness off and say so in the register |

Why is this so important? Because the worst failure is a **silent** one. An extractor that "succeeds" with zero rows, or a Scheduler job someone paused, sends no failure alert at all. Freshness catches both the next night (Chapter 17, Lab 17.4).

⚠️ When freshness fails, **nothing** is rebuilt, and dashboards keep showing the last good data. That is the safe choice: old but correct beats fresh but half-loaded. The alert tells the team to fix it the same morning.

---

## 5. Alerts

### 5a. Notification channels

A **notification channel** is where Cloud Monitoring sends an alert. Create them once in `acme-data-prod`: **Monitoring → Alerting → Edit notification channels**, or from the command line:

```
gcloud beta monitoring channels create --project=$PROD \
  --display-name="Data alerts email" --type=email \
  --channel-labels=email_address=data-alerts@acme.com

gcloud beta monitoring channels list --project=$PROD \
  --format="table(name,displayName,type)"      # copy the channel IDs for later
```

For chat:

-   **Slack**: 📘 Cloud Monitoring has a built-in Slack channel type. Set it up in the console, because it asks you to log in to Slack and approve it.
-   **Google Chat or Microsoft Teams**: ⚠️ Cloud Monitoring's plain webhook sends its own message format, which these tools may not show nicely. Check the current docs. If it does not work, 🛠 send alerts to a Pub/Sub topic and use a tiny function that reads `alert-webhook-url` from Secret Manager and posts a short message. Give that function its own service account with Secret Accessor on that one secret. Write it in `docs/decisions.md`.

### 5b. Alert policy: a Cloud Run job execution failed

📘 Cloud Run records a metric for every finished job run, with a `result` label of `succeeded` or `failed`. We alert on any failed run.

Console: **Monitoring → Alerting → Create policy → Select a metric → Cloud Run Job → Job → Completed Executions**. Add a filter `result = failed`. Set the threshold to **above 0**, over a 5 minute window. Add both notification channels. Name it `Cloud Run job failed`. In the documentation box, paste: _"Open the runbook: docs/runbook.md. Find the job name in this alert."_

Or as a file, `infra/alert-job-failed.yaml` (check field names in the current docs):

```
displayName: "Cloud Run job failed"
combiner: OR
conditions:
  - displayName: "Any failed execution"
    conditionThreshold:
      filter: >
        resource.type = "cloud_run_job" AND
        metric.type = "run.googleapis.com/job/completed_execution_count" AND
        metric.labels.result = "failed"
      comparison: COMPARISON_GT
      thresholdValue: 0
      duration: 0s
      aggregations:
        - alignmentPeriod: 300s
          perSeriesAligner: ALIGN_SUM
notificationChannels:
  - projects/acme-data-prod/notificationChannels/EMAIL_CHANNEL_ID
  - projects/acme-data-prod/notificationChannels/CHAT_CHANNEL_ID
documentation:
  content: "A pipeline job failed. Follow docs/runbook.md (Guide 08, section 10)."
```

```
gcloud alpha monitoring policies create --project=$PROD \
  --policy-from-file=infra/alert-job-failed.yaml
```

### 5c. Log-based alerts

A **log-based alert** fires when a matching line appears in Cloud Logging. It catches things the metric does not, for example the Scheduler failing to start a job at all. Console: **Logging → Logs Explorer**, paste a query, click **Run query**, check it finds real past errors, then **Actions → Create log alert**. Set a notification limit (for example one alert per hour) so one problem does not flood the channel.

| Alert name | Logs query |
| --- | --- |
| Scheduler could not start a job | `resource.type="cloud_scheduler_job" severity>=ERROR` |
| Extractor auth error (401/403) | `resource.type="cloud_run_job" resource.labels.job_name=~"extract-" textPayload:("401" OR "403")` |
| dbt freshness ERROR | `resource.type="cloud_run_job" resource.labels.job_name="dbt-build" textPayload:"ERROR STALE"` |

The second and third queries depend on what your code actually prints. Run a failing job once, look at the real log lines, and adjust the query to match them (the exact dbt wording changes between versions).

### 5d. Fivetran's own alerts

📘 Fivetran emails account users when a connector fails or needs attention. In Fivetran, go to your user settings → **Notifications** and make sure `data-alerts@acme.com` (or a user whose email forwards there) gets connector failure emails. Do not rely on one person's inbox.

---

## 6. Check It Worked: Break It on Purpose

An alert you have never seen fire is an alert you cannot trust (Guide 01, section 9). Do each test in the dev setup or in a quiet hour, and put things back after.

| # | Break it like this | You should see |
| --- | --- | --- |
| 1 | Add a new version of `nexudus-api-token` with a wrong value, run `gcloud run jobs execute extract-nexudus --region=$REGION --wait` | The job fails; email and chat alert within about 10 minutes; the 401 log alert fires. Then disable the bad version and enable the good one again. |
| 2 | Pause the Nexudus Scheduler job for 2 nights (`gcloud scheduler jobs pause nightly-extract-nexudus --location=$REGION`) | Night 2: `dbt source freshness` errors for nexudus; dbt-build fails; alert. Then `resume` it. |
| 3 | In a branch, add a test that always fails, deploy to a test job, run it | dbt-build fails; models after the test are SKIPPED; alert |
| 4 | Pause one Fivetran connector | Freshness warning the next morning, error after the error limit |
| 5 | `gcloud scheduler jobs run nightly-dbt-build --location=$REGION` | A normal run starts now; the job shows "Succeeded" in Cloud Run |

Write the date and result of each test in `docs/runbook.md`. It is proof for go-live (Guide 09).

---

## 7. Daily, Weekly and Monthly Checks

| When | Check | Where | Takes |
| --- | --- | --- | --- |
| Daily (morning) | Any alert overnight? If not, still glance at last night's runs: all three jobs "Succeeded" | Chat channel; **Cloud Run → Jobs** | 2 min |
| Daily | Any freshness **warnings** (they do not alert, but they warn of trouble) | dbt-build logs | 2 min |
| Weekly | Fivetran: all connectors green; any schema change notices? | Fivetran dashboard | 5 min |
| Weekly | Row counts per day in each raw source look normal (no sudden drop to zero or doubling) | A saved query on `_loaded_at` / `_fivetran_synced` | 5 min |
| Weekly | The top 10 most expensive queries (section 8) | `INFORMATION_SCHEMA.JOBS` | 5 min |
| Monthly | Cloud bill vs budget; Fivetran usage vs plan | Billing reports; Fivetran usage page | 15 min |
| Monthly (after finance close) | Reconcile revenue per site with Finance's report; Ops checks members and occupancy | Reconciliation tests (Guide 07, Chapter 17) | 1–2 hours |
| Monthly | Access review: who is in each group? Any leavers? | Client IT, Google groups | 15 min |
| Every 3–6 months (🛠) | Rotate the Nexudus and ACT tokens | Secret Manager (section 10, row G) | 30 min |

---

## 8. Cost Monitoring

✅ The brief says it "cannot become a six figure operation". Watch four places:

**1. Budget alerts** (set in Guide 02). Check they reach the right people. Look at **Billing → Reports**, grouped by **Project** and then by **SKU** (the line item, for example "Analysis" for BigQuery queries), to see where money goes.

**2. The most expensive BigQuery queries** in the last 7 days. Run this in each project:

```
bq query --project_id=acme-data-prod --location=europe-west2 --use_legacy_sql=false '
SELECT
  user_email,
  job_id,
  creation_time,
  ROUND(total_bytes_billed / POW(1024, 4), 4) AS tib_billed,
  LEFT(query, 120)                           AS query_start
FROM `region-europe-west2`.INFORMATION_SCHEMA.JOBS
WHERE creation_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND job_type = "QUERY"
  AND statement_type != "SCRIPT"          -- avoid counting scripts twice
ORDER BY total_bytes_billed DESC
LIMIT 20'
```

Multiply `tib_billed` by the current on-demand price per TiB (check current pricing for `europe-west2`). Look for: a BI dashboard scanning a whole table every few minutes, a `SELECT *` on a big raw table, or dbt rebuilding a large table in full every night that could be incremental (Chapter 15).

**3. Fivetran usage.** 📘 In Fivetran, open the account **Usage** page (the menu name may differ; check the docs). It shows monthly active rows per connector. A connector whose rows jump overnight usually means a full re-sync or a table you did not need. Untick tables you do not use.

**4. Cloud Run jobs.** 📘 Cloud Run jobs are charged only while they run (CPU and memory time). Three short nightly jobs should cost very little. In **Billing → Reports**, filter the service to **Cloud Run**. If the cost grows, check **Cloud Run → Jobs → your job → Executions** for runs that got much longer, or that retried many times (a hanging extractor, or a dbt model that is no longer incremental). The task timeout from section 3b puts a ceiling on each run.

---

## 9. Re-running a Job by Hand, and Backfills

### Re-run a job now

```
gcloud run jobs execute extract-nexudus --region=$REGION --project=$PROD --wait
gcloud run jobs execute dbt-build       --region=$REGION --project=$PROD --wait
# --wait keeps the command running until the job ends and shows the result
```

Always re-run in order: the failed extractor first, then `dbt-build`. Running dbt alone does not bring in new data.

### Backfill: load or rebuild an older period

A **backfill** means loading or rebuilding data for days that were missed or wrong.

| Piece | How |
| --- | --- |
| Nexudus extractor | Run once with an override that moves the start point back. 🛠 Our Guide 05 extractor reads a start-date setting from an environment variable; use the exact name from `extractors/nexudus/README.md`. Example: `gcloud run jobs execute extract-nexudus --region=$REGION --update-env-vars=SINCE=2026-09-01 --wait`. This applies to this one run only. Duplicates are fine: staging keeps the latest version per id (Chapter 14). |
| Fivetran | 📘 Connector → **Setup** → re-sync one table, or re-sync all historical data. ⚠️ A full re-sync can add a lot of usage; ask the lead first for big sources like NetSuite. |
| dbt | Pass extra args through `run.sh`: `gcloud run jobs execute dbt-build --region=$REGION --args="--select,fct_contract_month+,--full-refresh" --wait`. The `+` after the model name also rebuilds everything that depends on it. ⚠️ `--args` replaces the job's normal arguments for this run; check the current docs and test it in dev first. |

---

## 10. The Fix-It Runbook

Copy this section into `docs/runbook.md` and fill in the client's real names for each role. Every entry follows the same shape: **symptoms → how to check → how to fix → who to tell**. If a fix is not working after an hour, stop and tell the lead (Guide 01, section 10).

Useful command for every entry, to read a job's last logs:

```
gcloud logging read \
  'resource.type="cloud_run_job" AND resource.labels.job_name="extract-nexudus"' \
  --project=$PROD --freshness=1d --limit=100 --format="value(textPayload)"

gcloud run jobs executions list --job=extract-nexudus --region=$REGION --project=$PROD --limit=5
```

### A. Nexudus job failed

| Symptoms | "Cloud Run job failed" alert for `extract-nexudus` |
| --- | --- |
| How to check | Read the logs (above). Find the HTTP status code. |
| How to fix | **401 / 403** (not allowed): the token is wrong, expired, or the API user was turned off or lost rights. Do **not** retry in a loop. Ask the Nexudus admin to check the API user. If they issue a new token: `printf '%s' "$NEW" \| gcloud secrets versions add nexudus-api-token --data-file=-`, then disable the old version, then re-run. **429** (too many requests): the extractor already waits and retries (Chapter 14). If it still fails, run again later in the morning, and lower the page size or request rate in the extractor config. **500 / 502 / 503 / 504** (Nexudus side): wait 30–60 minutes and re-run. If it lasts hours, check the vendor's status page. **400 / 404**: the API probably changed. Check the vendor's change notes, fix the code in a branch, deploy, re-run. After any fix: re-run `extract-nexudus`, then `dbt-build`. |
| Who to tell | Chat channel: "Nexudus load failed, data is from yesterday, fixing". If it was the API user, the Ops / Nexudus admin. |

### B. Fivetran connector broken, or a schema change

| Symptoms | Fivetran failure email; connector shows red or "broken" in Fivetran; freshness warning for that source |
| --- | --- |
| How to check | Fivetran → connector → **Status** / logs. Is it a login problem (password or token changed, integration user turned off) or a **schema change** (a column or table added, renamed or removed in the source)? |
| How to fix | **Login**: ask the system admin (for example the NetSuite finance systems admin) to check the integration user and role; update the login in Fivetran's Setup tab; click re-sync. **Schema change**: 📘 Fivetran usually adds new columns by itself. A **renamed** or removed column can break a dbt staging model. Run `dbt build --select source:netsuite+` in dev; fix the staging model so later layers keep the same column names; merge; re-run `dbt-build`. |
| Who to tell | The source system's admin; chat channel if the data will be late |

### C. Freshness test failed

| Symptoms | `dbt-build` failed; logs show `ERROR STALE` for a source |
| --- | --- |
| How to check | Which source? When did it last load? `` SELECT MAX(_loaded_at) FROM `acme-data-prod.raw_nexudus.<table>` `` (or `_fivetran_synced`). Then check that loader: did its job run? Is its Scheduler job paused? (`gcloud scheduler jobs list --location=$REGION`) |
| How to fix | Fix the loader (entry A or B), re-run it, then re-run `dbt-build`. If the source is **meant** to be quiet (for example a budget sheet in a quiet month), raise its `error_after` in `_sources.yml` through a pull request and note why. |
| Who to tell | Chat channel: "Data is from <date>, fix in progress". Leadership only if it lasts past midday. |

### D. dbt test failed

| Symptoms | `dbt-build` failed; logs show `FAIL` on a test and `SKIP` on models after it |
| --- | --- |
| How to check | Find the test name in the logs. Run it in dev with `dbt test --select <test_name> --store-failures` to see the bad rows. Ask: is it a **data** problem (a duplicate member, a contract with no site) or a **code** problem (a recent change)? |
| How to fix | **Data**: tell the source owner what to correct in the source system (never patch raw by hand). Re-run after they fix it. **Code**: revert or fix the change through a pull request, then re-run. ⚠️ Never delete or turn off a test just to get green. If a rule really changed, change the test through a pull request, with a reason in `docs/decisions.md`. |
| Who to tell | Chat channel. Note that `marts` (and so the dashboards) still hold yesterday's good data. |

### E. Numbers do not match finance

| Symptoms | Finance says revenue (or another money number) differs from their report |
| --- | --- |
| How to check | 1. Same period? Was the month **closed** in finance? An open month will change and should be labelled provisional. 2. Same definition? For example invoiced vs recognised revenue, or credit notes included or not. 3. Same data date? When did Fivetran last sync? 4. Compare by site and by account, to find where the gap sits. |
| How to fix | Timing → wait for the next sync, or re-sync. Definition → agree the right one with the Finance owner and record it. Mapping (wrong account or site) → fix the dbt mapping and add a golden-number test so it cannot happen again (Chapter 17, Lab 17.2). |
| Who to tell | Finance owner the same day if the number is in a board paper. Log the result. |

### F. Cost spike

| Symptoms | Budget alert email; or the monthly bill is much higher than last month |
| --- | --- |
| How to check | Billing reports by project and SKU. Then: BigQuery → the expensive-queries query (section 8); Fivetran → Usage page; Cloud Run → job run times. |
| How to fix | Expensive dashboard → add filters, use partitioned tables, lower refresh rate. Runaway script → stop it (`gcloud run jobs executions cancel`), fix it. Fivetran re-sync → untick unneeded tables. If needed, lower the BigQuery daily quota for a while. |
| Who to tell | The lead and the client's budget owner, with the cause and the fix |

### G. A leaver's access

| Symptoms | HR or a manager says someone with data access is leaving (or has left) |
| --- | --- |
| How to check | Which groups were they in? Any direct grants? `gcloud projects get-iam-policy acme-data-prod --flatten="bindings[].members" --filter="bindings.members:user:" --format="table(bindings.role,bindings.members)"` (repeat for dev). Fivetran user? BI tool user? Did they ever see a secret value? |
| How to fix | Client IT removes them from the Google groups (all rights go at once). Remove any direct grants. Remove their Fivetran and BI accounts. If they knew a token: get a new one from the vendor, add it as a new secret version, disable the old one, re-run the job to prove it works. Check the audit logs for unusual reads in their last weeks if the client asks. |
| Who to tell | Client IT; the lead. Note the date in `docs/runbook.md`. |

---

## 11. Common Problems and Fixes

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Scheduler shows `PERMISSION_DENIED` | The service account lacks Cloud Run Invoker on the job | Section 3a |
| Scheduler shows success but nothing ran | Wrong job name or region in the URI | Check the URI; run `gcloud scheduler jobs run` and watch **Cloud Run → Jobs → Executions** |
| Jobs run an hour early or late | `--time-zone` missing, so UTC was used | `gcloud scheduler jobs update http NAME --time-zone="Europe/London" --location=$REGION` |
| No alert when a job failed | Policy has no channel, wrong filter, or the email went to spam | Open the policy, check channels; send a test from the channel page; re-do the break-it test |
| Too many alerts for one problem | No notification limit | Set a limit on log alerts; set auto-close on the policy |
| Freshness always fails for Excel | Error limit too short for a file that rarely changes | Longer `error_after`, or load the file daily so the load time moves |
| dbt-build starts before Fivetran ends | Fivetran start time in UTC, run longer than you thought | Move Fivetran earlier; measure the real run time |

---

## 12. Done When

| ☐ | Check |
| --- | --- |
| ☐ | Three Scheduler jobs exist, in `Europe/London` time, at 02:00, 02:15 and 03:00 |
| ☐ | Fivetran connectors are set to finish before 03:00 UK (measured, not guessed) |
| ☐ | Every Cloud Run job has a timeout; dbt-build does not auto-retry |
| ☐ | `dbt-build` runs freshness first, then build; a failed test skips everything after it |
| ☐ | Every source has freshness limits, or a written reason why not |
| ☐ | Email and chat channels work; the job-failed policy and log alerts point to both |
| ☐ | Fivetran failure emails reach the shared alerts address |
| ☐ | All five break-it tests in section 6 were done, with dates written down |
| ☐ | The expensive-queries query is saved, and budget alerts reach the right people |
| ☐ | The daily / weekly / monthly checks have a named owner (a role) each |
| ☐ | The fix-it runbook is in `docs/runbook.md` with real role names, and someone other than you has followed one entry without help |
| ☐ | Alert files and Scheduler commands are in `infra/` in Git |

---

## What's Next?

The pipeline now runs itself and shouts when it breaks. The last step is to prove the numbers with the client and hand it all over: Guide 09 — Go-Live and Handover. 🚀

Back to the plan: Guide 01 — Start Here. Background in the series: Chapter 14 (retries and failing loudly), Chapter 17 (freshness and the nightly run), Chapter 39 (what breaks) and Chapter 36 (runbooks).

---

# Integration Guide 09 — Go-Live and Handover Checklist

> Source file: `integrations/integration-09-go-live-handover.html` · Integrations — set it up for a new client (engineer playbook)

Hi! 🙏 This is the last guide. Everything is built: loaders, dbt models, tests, the nightly schedule and alerts. Now we prove it is right, prove it is safe, and hand it over so the client's own team can run it **without us**.

Two moments, not one:

-   **Go-live**: the BI dashboards switch to the new marts, and the client starts to trust and use those numbers (week 5–6 in Guide 01's made-up plan).
-   **Handover**: the client owns and runs the whole pipeline, from sources to dashboards, without us.

⚠️ **Read this first.** This is **🛠 our standard** checklist. When go-live and handover happen is for you and the client to agree ❓. The brief asks that the setup is "documented so the capability does not depend on any single person, on your side or ours" (✅ brief), and our golden rule 7 says: match the client's own reports before you call a number right (Guide 01). Thresholds such as "two weeks" are **made up**: agree your own with the client and write them in `docs/decisions.md`.

What we will cover in this guide:

-   Before you start
-   The go-live readiness checklist
-   Reconciliation and sign-off
-   The security review
-   The cost review
-   The documentation set to hand over
-   Access handover and secret rotation
-   The handover sessions: Tell, Show, Do, Prove
-   The support period after handover
-   The final one-page checklist

---

## 1. Before You Start

| ☐ | You need |
| --- | --- |
| ☐ | Guides 02–08 finished, each with its own "Done when" list ticked |
| ☐ | A named client owner for the pipeline after handover (Guide 01, question 12) ❓, plus a backup |
| ☐ | A Finance person to sign off money numbers and an Ops person to sign off member and occupancy numbers ❓ |
| ☐ | The client's trusted reports for the **last 3 closed months** |
| ☐ | The cost plan you agreed at the start, to compare with real bills |
| ☐ | Time booked in the client team's calendar for the handover sessions (section 8) |

---

## 2. The Go-Live Readiness Checklist

Go-live means people will start to make decisions with these numbers. Do not go live until every line is true.

| ☐ | Check | How you prove it |
| --- | --- | --- |
| ☐ | Every integration is "done" (Guide 01, section 9) | Each row of the integration register shows ☑ syncing ☑ tested |
| ☐ | **Two weeks of clean nightly runs** (made up threshold): loaders, freshness and `dbt build` all green, nobody touching them | Cloud Run job history for `extract-nexudus`, `dbt-build`; Fivetran sync history |
| ☐ | **Alerts tested by breaking things on purpose** | The table below, each with the time the alert arrived |
| ☐ | Golden-number test passes for the last 3 closed months | `dbt build` log; sign-off table (section 3) |
| ☐ | Every leadership dashboard reads the new marts (not old hand-built extracts) and shows the signed-off numbers | Open each dashboard next to the sign-off table (section 3) |
| ☐ | The BI reader (`sa-bi-reader`) sees only what dashboards need; no personal columns on dashboards that do not need them | The check in section 4 |
| ☐ | The runbook has an entry for every alert | `docs/runbook.md` (Guide 08) |
| ☐ | Open months are marked so dashboards can show them as "provisional" (they can still change) | A month that is not closed shows the flag in the marts |

**Break it on purpose** (do this in a quiet hour, tell the client first, and undo each one):

| Break | How | Expected result |
| --- | --- | --- |
| Nexudus token stops working | Point the job at a disabled test secret version | Job fails, alert arrives, freshness errors next morning |
| Fivetran connector stops | Pause the NetSuite connector for longer than the freshness limit | Fivetran email + dbt freshness error |
| A test fails | Change a site value in `site_mapping.csv` on a test branch and run the job against it | `not_null` on `fct_gl.site_code` fails; the models after it (such as `fct_site_month_kpis`) are skipped; alert arrives |
| Excel column renamed | Rename a budget column in a copy of the sheet | Staging test fails with a clear message |
| Cost alert | Set a test budget alert very low | Budget email arrives to the right group |

💡 An alert that nobody received is not an alert. Check it reached a **client** address or channel, not only yours.

---

## 3. Reconciliation and Sign-Off

**Reconciliation** means comparing our numbers with the client's own trusted report, line by line, and explaining every difference. **Sign-off** means the right person says in writing "these are correct". The rule (🛠 our standard, the series' canonical sign-off):

-   **Finance signs off money numbers**: MRR, revenue, direct costs, contribution, central costs, budget gaps.
-   **Ops signs off member and occupancy numbers**: members, desks contracted, sellable desks, desk occupancy, movements.
-   For the **last 3 closed months**, per site. Money on closed months has **$0 tolerance** (rounded the same way the report rounds).

Each difference ends in one of three states: **fixed** (our bug), **explained** (a real, known reason, such as a credit note in NetSuite that Nexudus does not know about), or **changed definition** (the client agrees a new rule; log it in `docs/decisions.md`). "We are looking into it" is not a state you can sign off.

**Sign-off table template** (one per month; the figures are made up, from the series' Mini Work.Life lab for September 2026):

| Site | Metric | Client report | Our mart | Difference | State and reason | Signed by (role) | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Soho | MRR | $3,800 | $3,800 | $0 | Match | Finance | ☐ |
| Soho | Revenue | $4,343.75 | $4,343.75 | $0 | Match (includes −$112.50 credit memo) | Finance | ☐ |
| Soho | Desk occupancy | 17.6% | 17.6% (6/34) | 0 | Match | Ops | ☐ |
| Soho | Meeting rooms: Nexudus vs NetSuite | $656.25 booked | $543.75 in ledger | $112.50 | Explained: goodwill credit, warning test | Finance | ☐ |
| Reading | MRR | $3,375 | $3,375 | $0 | Match | Finance | ☐ |

Store the signed tables in the client's shared drive and link them from `docs/decisions.md`. Then add each signed figure to `seeds/golden_numbers.csv` (Guide 07), so the nightly build checks it forever.

Last step: open each leadership dashboard for the same months and check it shows the signed figures. A right mart behind a dashboard with a wrong filter is still a wrong number in front of a leader.

---

## 4. The Security Review

Run this review with the client's IT or cloud admin. Save the outputs in the access list (section 6).

| ☐ | Check | How |
| --- | --- | --- |
| ☐ | No personal logins in any loader (every source uses an integration user) | Integration register, "Auth" column |
| ☐ | No keys or passwords in Git, ever (including old commits) | Turn on GitHub secret scanning, or run a scanner such as gitleaks over the full history |
| ☐ | No service account key files exist, except one for `sa-bi-reader` if the BI tool cannot sign in any other way | Command 2 below (run it for each account). A BI key lives only in the BI tool's own store, owned by the client |
| ☐ | Least privilege: each account has only the roles in Guide 02 | Command 1 below, compared line by line |
| ☐ | Personal columns sit only where agreed (`dim_member`, `member_xref`, `dim_company.billing_email`), and `sa-bi-reader` reads only what dashboards need | Query 3 below, plus `bq show` on the `marts` dataset to see who can read it |
| ☐ | Door data, if loaded, appears in marts only as company-level totals | No per-person door table in `marts` |
| ☐ | HR and people data are not in the warehouse at all | Query 4 below returns zero rows |
| ☐ | Every dataset is in `europe-west2` | Query 5 below |
| ☐ | Audit logs are on and kept | Admin Activity logs are always on 📘; BigQuery data access logs are on by default 📘 (check current docs); agree how long logs are kept |

```
# 1. Who has which role on each project (repeat for <client>-data-dev)
gcloud projects get-iam-policy <client>-data-prod \
  --flatten="bindings[].members" --format="table(bindings.role, bindings.members)"
#   Look for: roles/owner or roles/editor on anyone but data-admins@
#             any user: address from our company (remove it at handover)
#             service accounts with more than their Guide 02 roles

# 2. Service account keys: expect only Google-managed keys, no user-managed ones
gcloud iam service-accounts keys list --managed-by=user \
  --iam-account=sa-dbt@<client>-data-prod.iam.gserviceaccount.com
```

```
-- 3. Personal-looking columns in marts. Expect ONLY the agreed ones.
select table_name, column_name
from `<client>-data-prod.marts.INFORMATION_SCHEMA.COLUMNS`
where regexp_contains(lower(column_name),
      r'email|phone|first_name|last_name|card|address');

-- 4. HR-looking columns anywhere in the data project. Expect ZERO rows.
select table_schema, table_name, column_name
from `<client>-data-prod.region-europe-west2.INFORMATION_SCHEMA.COLUMNS`
where regexp_contains(lower(column_name), r'salary|payroll|sickness|absence|appraisal|ni_number');

-- 5. Every dataset's region. Expect only europe-west2.
select schema_name, location
from `<client>-data-prod.region-europe-west2.INFORMATION_SCHEMA.SCHEMATA`;
-- Also: bq ls --format=prettyjson to catch any dataset created in another region.
```

⚠️ A name search is a first check, not proof. Also read the column list of each mart the BI tool can see, by eye, with the client's data owner, and write down what was agreed. Note that "Site Staff" cost as one GL total per site is allowed; anything per person is not.

---

## 5. The Cost Review

The brief says it "cannot become a six figure operation" (✅ brief). Compare the real bills for the last full month with the plan. Example layout (all figures made up):

| Item | Plan / month | Actual / month | Where to look | Note |
| --- | --- | --- | --- | --- |
| BigQuery queries | $50 | $65 | Query below | Who scans most? |
| BigQuery storage | $12.50 | $10 | Billing report |  |
| Fivetran | $500 | $600 | Fivetran usage page | Which connector grew? |
| Cloud Run, Scheduler, Secret Manager | $6.25 | $3.75 | Billing report |  |
| BI tool licences | Client's existing cost ❓ | ? | Client's BI contract | The BI tool is under review (✅ brief) |

```
-- Who scanned the most data in the last 30 days?
select user_email,
       round(sum(total_bytes_billed) / pow(1024, 4), 3) as tib_billed,
       count(*) as queries
from `<client>-data-prod.region-europe-west2.INFORMATION_SCHEMA.JOBS_BY_PROJECT`
where creation_time >= timestamp_sub(current_timestamp(), interval 30 day)
group by user_email order by tib_billed desc;
-- Multiply TiB by the current on-demand price per TiB (check Google's price page).
```

Anything more than 25% over plan (made up threshold) needs a reason and a fix, written in `docs/decisions.md`. Check that budget alerts (Guide 02) go to a **client** group, not to us.

---

## 6. The Documentation Set to Hand Over

Chapter 36 explains the thinking: docs live in the client's systems, are generated from the real system where possible, and are done only when someone new can use them. For this pipeline, hand over these:

| Document | Where it lives | Made from | Done when |
| --- | --- | --- | --- |
| Integration register | `docs/integration-register.md` | Guide 01 section 8, kept up to date | Every row ☑ syncing ☑ tested ☑ signed off |
| Runbook | `docs/runbook.md` | Guide 08 | One entry per alert; each tried by a client person |
| Decisions log | `docs/decisions.md` | Written on the day of each decision | Every definition, threshold and "why" is there, with date and who decided (role) |
| Data dictionary | dbt docs site (private) | `dbt docs generate` (Guide 07) | Every mart column has a description; exposures list each dashboard |
| Data flow diagram | `docs/` | Guide 01's big picture + dbt lineage | Shows every source, loader, dataset and dashboard, with refresh times |
| KPI definitions | dbt column descriptions + `docs/decisions.md` | Agreed with Finance and Ops | Every dashboard KPI has a formula, a source mart and an owner (role) |
| Access list | Client shared drive | IAM export (section 4) + vendor admin lists | Every human, group and service account, with its roles and owner |
| Signed reconciliations | Client shared drive | Section 3 | 3 closed months, Finance and Ops signed |
| `README.md` | Repo root | Guide 01 layout | A new engineer can run a dev build from it alone |

🛠 The test for every document: someone who never met us can **run, fix and change** the system with it (Chapter 36). Docs say **where** a secret lives, never the secret itself.

---

## 7. Access Handover and Secret Rotation

On handover day, nothing may depend on our own accounts. Most things should already be in the client's name from day one (Guide 01); this step removes **us**.

| Thing | Move to | Remove |
| --- | --- | --- |
| Cloud projects (`<client>-data-prod`, `<client>-data-dev`) | Owner: `data-admins@`. Daily work: `data-engineers@`, `data-analysts@` (read) | Our personal users, any role |
| Git repository | Admin: client `data-admins@` people; code owners: client engineers | Our users; any deploy keys we added |
| Fivetran account | Account owner and billing: client | Our Fivetran users |
| Secret Manager | Admin: `data-admins@`. Read secrets: only the service accounts that need them | Our access to secret values |
| Source integration users (NetSuite, HubSpot, Nexudus, ACT) | Owned by the client admin of each system | Any password or token we ever saw (rotate below) |
| BI tool: the BigQuery connection and the dashboards | Connection runs as `sa-bi-reader`; dashboards owned by client BI users | Dashboards or data sources published under our names |
| Alerts, budgets, scheduler jobs | Send to client groups and channels | Our email addresses |

**Rotate every secret on handover day.** We saw them during the build, so they must change. Do one at a time:

```
 FOR EACH SECRET (nexudus-api-token, act-api-key, alert-webhook-url, Fivetran logins,
                  and the BI tool's BigQuery key if it needs one)
 1. Client admin makes a new token in the source system
 2. Add it as a NEW version in Secret Manager (or re-enter it in Fivetran)
      gcloud secrets versions add nexudus-api-token --data-file=new_token.txt
      (then delete new_token.txt)
 3. Run the job by hand and check it works
      gcloud run jobs execute extract-nexudus --region=europe-west2 --wait
 4. Disable the old version in Secret Manager
 5. Client admin revokes the old token in the source system
 6. Next morning: freshness green? Then tick it off
```

Then remove our accounts, and run the IAM command from section 4 again. Our company's addresses should appear nowhere. If a support agreement continues, the client gives us **their** accounts with the smallest roles that agreement needs, ideally time-limited (the brief: Work.Life accounts only ✅).

---

## 8. The Handover Sessions: Tell, Show, Do, Prove

This follows Chapter 36. Handover is proved by what the client's team **does**, not by how many slides we show.

| Step | What happens (pipeline examples) | Done when |
| --- | --- | --- |
| **1. Tell** | Recorded walk-throughs: the big picture, each loader, the dbt layers, tests, the nightly order, how dashboards connect to the marts, costs, security | Recordings saved in the client's shared drive |
| **2. Show** | We run each runbook entry live while they watch: re-run a failed job, add a site to the seed, add a golden number, rotate a secret | Every runbook entry shown once |
| **3. Do** | The client team runs each runbook entry; we only answer questions | Each entry done by at least 2 client people |
| **4. Prove** | The client team runs the live service from the docs alone (two weeks in Chapter 36). We break things in a test setup without warning; they fix them using only the runbook | Drills passed; every gap found in the docs is fixed |

Good fire drills for this stack:

-   The Nexudus extractor fails because its token was "revoked" (a disabled test version).
-   The golden test fails because Finance "renamed" a site value.
-   A Fivetran connector is paused and freshness turns red.
-   A dashboard shows last week's numbers: the team must find whether the nightly job, a loader or the BI tool's own refresh is the cause.
-   A new plan code arrives and the `accepted_values` test fails: the team must ask Ops how many desks it holds.

The key moment: **the client team runs a fix from the runbook themselves**, start to finish, and the next nightly run is green. If they needed to call us, the runbook gets fixed and the drill is repeated.

---

## 9. The Support Period After Handover

Agree this in writing before handover. A simple shape (all made up):

| Item | Example |
| --- | --- |
| Length | 4 weeks of close support, then the normal support agreement (if any) |
| What is covered | Questions, bugs in our code, help with runbooks. Not new features. |
| Response time | Next working day; same day if a board number is wrong |
| How to ask | One shared channel or ticket queue, owned by the client |
| Weekly check | 15 minutes: failed runs, alerts, cost, open questions |
| Ends when | Four weeks with no help needed for normal runs, and the last fixes are in the runbook |

During support, every question we answer becomes a runbook line or a doc fix. Every wrong number found becomes a new golden test (Chapter 36).

---

## 10. Common Problems and Fixes

| Problem | Fix |
| --- | --- |
| Nobody on the client side will sign off | Sign-off owners were not named early. Escalate to the client sponsor; do not go live without it. |
| A number differs and nobody knows why | Do not lower the bar to hit a date. Move go-live, or go live with only the signed-off KPIs. |
| A dashboard and the sign-off table disagree, but the mart is right | The dashboard has its own filter, date logic or extract schedule. Fix the dashboard to use the mart's columns as they are. |
| A job breaks right after we remove our accounts | Something still used a personal login. Fix it with a service account, then repeat the IAM check. |
| Alerts still go to us | Change alert channels and budget emails to client groups; test again. |
| The client team cannot follow a runbook | The runbook is wrong, not the team. Rewrite it with them and repeat the drill. |

---

## 11. The Final One-Page Checklist (Done When)

| ☐ | Check |
| --- | --- |
| ☐ | Every integration "done" (Guide 01, section 9); register complete |
| ☐ | Two weeks of clean nightly runs (made up threshold) |
| ☐ | Every alert tested by breaking things on purpose, and received by a client group |
| ☐ | Last 3 closed months reconciled: Finance signed money, Ops signed members and occupancy |
| ☐ | Signed figures added to the golden-number test; leadership dashboards show the same figures |
| ☐ | Security review passed: no personal logins, no keys in Git, no stray key files, least privilege, `sa-bi-reader` read only and limited to what dashboards need, no HR data, door data company-level only, all in `europe-west2`, audit logs on |
| ☐ | Cost review done; actuals within plan or explained |
| ☐ | Documents handed over: register, runbook, decisions log, data dictionary, data flow, KPI definitions, access list, signed reconciliations, README |
| ☐ | Ownership moved: cloud projects, Git, Fivetran, Secret Manager, BI connection and dashboards, alerts |
| ☐ | Every secret rotated on handover day; old versions disabled and revoked |
| ☐ | Our accounts removed (IAM check shows none) |
| ☐ | Tell, Show, Do, Prove done; the client team fixed a drill from the runbook alone |
| ☐ | Support period agreed in writing |

---

## What's Next?

That is the whole playbook. 🎉 For the next client, go back to Guide 01 — Start Here and begin again with the questions and the access list. Fix anything in these guides that did not match what you found, and write down why.

For the full documentation and handover thinking behind this guide, read Chapter 36 — Documentation & Handover. For how dashboards sit on top of the marts, see Chapter 18 (the BI layer).

---

# Staff Training 01 — Start Here: Which System Does What

> Source file: `staff-training/training-01-start-here.html` · Staff Training — running the business in each system (for new staff)

Hi! 🙏 Welcome to the team. This training is for **everyone who runs a coworking business day to day**: front desk and community staff, site managers, sales, billing and finance. It shows you how to do your everyday jobs in each system, step by step.

A coworking business like this one runs on a handful of systems: **Nexudus** for members, contracts and bookings, **HubSpot** for sales, **NetSuite** for the accounts, a **door access** system, and a few **Excel** sheets. Each system does one job well. The trouble starts when people use the wrong system for a job, or skip a step, because then the systems stop agreeing with each other.

⚠️ **Read this first.** This training shows **our standard way of working** for a new coworking business set up like Work.Life. Menu names and screens change when vendors update their products, so if a button has moved, check the vendor's own help centre (📘). Example members, companies and prices come from **Mini Work.Life**, a **made-up** company used across this series. Your company's plans, prices and site names will be different.

What we will cover in this guide:

-   The systems in one picture
-   Which system is "the truth" for what
-   One member's journey through every system
-   Which training to take for your job
-   Getting your logins
-   The rules everyone follows

The labels used in this training:

| Label | Meaning |
| --- | --- |
| 📘 Vendor-documented | How the tool works, from the vendor's own help pages. Screens may have changed. |
| 🛠 Our standard | Our chosen way of working. Your manager may adjust it, but everyone should do it the same way. |
| ❓ Ask your manager | Depends on your company's own setup |

---

## 1. The Systems in One Picture

```
                         ┌──────────────────────┐
   Website enquiry ────► │  HubSpot             │  leads, tours, deals, renewals
                         │  (sales)             │
                         └──────────┬───────────┘
                                    │ deal won
                                    ▼
                         ┌──────────────────────┐        ┌──────────────────────┐
   Member portal / app ─►│  Nexudus             │ ─────► │  Door access         │
   (bookings)            │  (members, contracts,│ access │  (ACT365)            │
                         │   bookings, invoices)│ ◄───── │  who can open which  │
                         └──────────┬───────────┘ check- │  door                │
                                    │ invoices    ins    └──────────────────────┘
                                    ▼
                         ┌──────────────────────┐        ┌──────────────────────┐
                         │  NetSuite            │ ◄───── │  Excel               │
                         │  (the accounts)      │        │  budget, capacity    │
                         └──────────────────────┘        └──────────────────────┘
```

| System | What it does | Who uses it most | Training |
| --- | --- | --- | --- |
| **Nexudus** | The heart of the business: members, companies (called "teams"), plans, contracts, offices and desks, meeting room bookings, invoices, check-ins. Members also use its portal and app. | Front desk, community, site managers, billing | 02, 03 |
| **HubSpot** | Sales: every enquiry, tour, quote and deal, plus the renewals pipeline | Sales, marketing | 04 |
| **NetSuite** | The official accounts: income, costs, payments, the profit and loss per site, the month-end close | Finance | 05 |
| **Door access (ACT365)** | Who can open which door, and a record of who did | Site managers, IT | 06 |
| **Act! CRM** (only if you have old records in it) | An older sales system. A new business normally does not need it. | Sales (read only) | 06 |
| **Excel** | The yearly budget and the capacity list (how many desks and offices each site can sell) | Finance, operations | 07 |

💡 A note on the name "ACT". At Work.Life, the brief only says "ACT", and it is not clear whether that means **ACT365** door access or the **Act!** sales CRM. For a new business we cover both: ACT365 if you need door access, and Act! only if you are bringing old sales records across. 🛠 Our standard for a new business is HubSpot for sales, so Act! is not needed day to day.

---

## 2. Which System Is "the Truth" for What

When two systems disagree, this table says which one wins. Change the information **in the system that owns it**, and let it flow to the others.

| Information | The truth lives in | Not in |
| --- | --- | --- |
| A possible customer, a tour, a quote, a deal | HubSpot | Nexudus, email, a notebook |
| A signed member: their contract, plan, price, office, start and end date | Nexudus | HubSpot, a spreadsheet |
| A meeting room booking | Nexudus | A paper diary or a shared calendar |
| An invoice sent to a member | Nexudus (then copied to NetSuite) | Made by hand in NetSuite |
| The official income and costs of a site | NetSuite | Nexudus reports, Excel |
| Who can open which door | Set from Nexudus, held in ACT365 | Given by hand at the door system and then forgotten |
| The budget and how many desks each site can sell | The Excel templates (one owner each) | Personal copies |

❓ HubSpot and Nexudus can be connected so that contacts and companies stay in step (📘 vendor-documented). Ask your manager whether your company uses that sync, and which fields it copies. It changes some steps in Guides 02 and 04.

---

## 3. One Member's Journey Through Every System

Meet Priya (a made-up member from Mini Work.Life). Follow them through the business and see which system each step happens in, and who does it.

| # | What happens | System | Who | Guide |
| --- | --- | --- | --- | --- |
| 1 | Priya fills in the website form asking about desks | HubSpot (new contact + deal) | Automatic, then sales | 04 |
| 2 | Sales calls Priya and books a tour of Soho | HubSpot (deal stage: tour booked) | Sales | 04 |
| 3 | Priya takes a coworking plan from 1 October | HubSpot (deal won) → Nexudus (customer, team, contract) | Sales, then front desk | 04, 02 |
| 4 | Priya gets their card or app access for the doors | Nexudus → ACT365 | Automatic if connected, else site manager | 06 |
| 5 | Priya's first invoice goes out, and they pay | Nexudus (invoice, payment) → NetSuite | Billing, finance | 03, 05 |
| 6 | Priya books a meeting room for Thursday | Nexudus (booking, extra charge) | Priya in the app, or front desk | 02 |
| 7 | Six months later, Priya's company moves into Office 101: an **upgrade** | Nexudus (end old contract, start new one, same team) + HubSpot (upgrade deal) | Sales, front desk | 08 |
| 8 | At month end, finance closes the books | NetSuite | Finance | 05 |
| 9 | Near the end of the term, the renewal comes up | HubSpot (renewal deal) | Sales / account manager | 04 |
| 10 | If one day Priya's company leaves: notice, reason, last invoice, door access removed | Nexudus, HubSpot, ACT365, NetSuite | Everyone, in order | 08 |

💡 Step 7 is the one people get wrong most often. If you **cancel** Priya's coworking plan and create their office as a brand new customer, the business reports will show a member leaving and a stranger joining, instead of a happy member growing. Guide 08 shows the right way.

---

## 4. Which Training to Take for Your Job

| Your job | Must take | Good to know |
| --- | --- | --- |
| Front desk / community | 01, 02, 08 | 06 (door access), 03 (billing questions) |
| Site manager | 01, 02, 06, 08 | 03, 07 |
| Sales / account manager | 01, 04, 08 | 02 (how a deal becomes a contract) |
| Billing | 01, 03, 08 | 05 |
| Finance | 01, 05, 07 | 03, 08 |
| IT / systems admin | 01, 06 | All of them, to support others |

Each guide ends with short **practice tasks**. Do them in a test or training area if your company has one (❓ ask your manager), never on a real member's account.

---

## 5. Getting Your Logins

| System | Ask | What you should get |
| --- | --- | --- |
| Nexudus | Your site manager | An admin login with only the rights your job needs (for example front desk cannot change prices) |
| HubSpot | The sales or CRM admin | A user seat in your team |
| NetSuite | The finance systems admin | A role that matches your finance job |
| Door access | The site manager or IT | Admin access only if you manage doors; otherwise just your own card |
| Excel templates | The file owner | Edit rights only if you own a sheet; otherwise view only |
| Dashboards | The data owner | View access |

🛠 Never share a login, and never use someone else's. Every change in these systems records who made it. If you need a right you do not have, ask for it.

---

## 6. The Rules Everyone Follows

| # | Rule | Why |
| --- | --- | --- |
| 1 | **Search before you create.** Look for the person or company first, in every system. | Duplicates split one member's history in two |
| 2 | **Change it where it lives** (section 2), not in a copy. | Otherwise the systems stop agreeing |
| 3 | **Always pick the right site.** | Income and costs land at the wrong site otherwise |
| 4 | **Use the drop-down lists**; do not type your own values. | "Soho", "soho" and "SOHO " count as three different sites to a computer |
| 5 | **Upgrades, downgrades and moves are not leavers.** Follow Guide 08. | Keeps the member's history and the retention numbers right |
| 6 | **Write down the reason** when someone leaves. | The business learns why people go |
| 7 | **Remove door access on the last day.** | A leaver should not be able to walk in |
| 8 | **Protect members' personal details.** No screenshots of member records in chat; no exports to your own computer unless your job needs it. | It is personal data, and members trust us with it |
| 9 | **Ask when unsure.** | A quick question is cheaper than fixing a wrong contract later |

---

## What's Next?

Front desk, community and site teams: go to Staff Training 02 — Nexudus for Front Desk and Community. Sales: go to Staff Training 04 — HubSpot for Sales. Finance: go to Staff Training 05 — NetSuite for Finance. 🚀

Want to understand these systems more deeply? The series chapters go further: Nexudus (Ch 07), HubSpot (Ch 10), NetSuite (Ch 09), ACT (Ch 08), Excel (Ch 06).

---

# Staff Training 02 — Nexudus for Front Desk and Community

> Source file: `staff-training/training-02-nexudus-front-desk.html` · Staff Training — running the business in each system (for new staff)

Hi again! 🙏 This guide is for **front desk, community and site staff**. You will spend most of your day in **Nexudus**: finding members, setting up new teams, booking meeting rooms, letting guests in and recording when someone leaves. Every one of these jobs is shown task by task: when you do it, the steps, what to check, and the mistake people make most often.

⚠️ **About the menu names.** Nexudus menu paths in this guide are written from memory and marked 📘. Nexudus updates its screens, so if a menu has moved, search the Nexudus help centre for the task name. Many things depend on how your company set up its account. Where that is the case you will see ❓ **ask your manager how your account is set up**. All members, prices and dates come from **Mini Work.Life**, a made-up company.

What we will cover in this guide:

-   The words Nexudus uses, and the two portals
-   Find a member or a team (always first)
-   Add a new team and its members after a deal is won
-   Choose the right location
-   Create a contract
-   Day passes and on-demand use
-   Meeting room bookings: make, change, cancel
-   Visitors and guests
-   Check-ins and what they mean
-   Recording notice and the reason for leaving
-   Upgrades, downgrades and moves (the Nexudus part)
-   Member portal and app questions
-   Your daily and weekly checklist
-   Practice tasks and a quick check

---

## 1. The Words Nexudus Uses, and the Two Portals

| Nexudus word | What it means for you | Mini Work.Life example |
| --- | --- | --- |
| **Location** | One site (building) | Soho, Reading |
| **Customer** | One person who uses the space | Priya Sharma |
| **Team** | The company the person works for. One team, many customers, usually one bill payer. | Pixel Chai Studio |
| **Plan** | The type of membership and its normal price | Unlimited Coworking $400, Flex 10 Days $225, Private Office (priced per office) |
| **Resource** | Something that can be booked or given to a team: a meeting room, an office, a desk | Office 101 (4 people), Brick Lane meeting room ($56.25/hour) |
| **Contract** | Customer or team + plan + office or desk + start date + price + term | K002: Pixel Chai, Office 101, from 1 Apr 2026, $3,000 |
| **Booking** | A meeting room or desk reserved for a time | B1001: Brick Lane, 3 Sep 2026, 10:00–12:00 |
| **Check-in** | A record that someone came into the building | A door tap or front desk check-in |

```
   ADMIN PORTAL (you, the staff)            MEMBER PORTAL / APP (members)
   ─────────────────────────────            ─────────────────────────────
   Customers, teams, contracts              Book rooms and desks
   Bookings for anyone                      See and pay invoices
   Check-ins, visitors                      See credits left
   Notes, notice, reports                   Invite visitors
              └──────── both write into the SAME records ────────┘
```

📘 Both portals change the same records. If a member books a room in the app, you see it in the admin portal straight away, and the other way round.

---

## 2. Find a Member or a Team (Always First)

**When:** before every other task. Before you add anyone, book anything or answer a question.

1.  📘 Open **Customers** (or the search box at the top of the admin portal).
2.  Search by **email address** first. It is the most exact. Then try the surname, then the company name.
3.  Also search **Teams** for the company name. Try a short part of the name: "pixel", not "Pixel Chai Studio Ltd".
4.  Open the record and check the **location**, the **team** and whether the record is **active or archived**.

**What to check:** archived records also count. A past member coming back should be brought back on their old record (❓ ask your manager how), not created again.

**Common mistake:** searching once by full name, finding nothing because of a typo or a different spelling, and creating a duplicate. In other systems the same company can be "Kite & Key Recruitment" or "Kite and Key Recruitment Ltd". Try more than one spelling.

---

## 3. Add a New Team and Its Members After a Deal Is Won

**When:** sales tells you a deal is **won** in HubSpot (Guide 04). Not before. A tour or a quote is not a member yet.

1.  Search first (section 2) for both the company and every person.
2.  📘 **Teams → add new**. Type the company's **legal name** exactly as on the signed agreement. Add the **billing email** (for example accounts@pixelchai.co.uk in the lab).
3.  📘 **Customers → add new** for each person: first name, last name, work email, and the **location** they will use.
4.  Add each customer to the team, and mark the **team admin / bill payer** (in the lab, Priya is the admin for Pixel Chai).
5.  ❓ **HubSpot link.** If your company uses the HubSpot ↔ Nexudus sync (📘 vendor-documented: contacts ↔ customers, companies ↔ teams), the team and people may already exist, made by the sync. Then you **do not create them again**; you check them and fill in what is missing. If your company stores the Nexudus customer ID in HubSpot (in the lab: `nexudus_customer_id = M001`), copy it across as your manager shows you.
6.  Now create the contract (section 5).

**What to check:** every person is in the right team; the bill payer is set; the email is spelled right (the welcome email goes there).

**Common mistake:** putting the company name only in a free text "company" box on the person and never adding them to the team. 📘 Nexudus has both a team and a company name field on a customer. 🛠 Our standard: **the team is the truth**. Always use the team.

---

## 4. Choose the Right Location

**When:** every time you create a customer, contract or booking.

1.  📘 Check the **location selector** (usually at the top of the admin portal) shows the site you mean before you create anything.
2.  Pick the location from the list. Never type it.
3.  For a contract, the location is **where the office or desk is**, not where the company's head office is.

**Why it matters:** income lands at the site on the contract. In the lab, Kite & Key's "home site" is still Reading, but Fatima's current contract (K007) is at Soho. That is why Mini Work.Life counts 6 members at Soho and 6 at Reading by contract site, but 5 and 7 by home site. One small choice changes the numbers.

**Common mistake:** staff who cover two sites create a contract while the selector still shows the other site.

---

## 5. Create a Contract

**When:** right after the team and people exist, and only with the signed agreement in front of you.

1.  Open the customer (the bill payer) or the team. 📘 Go to **Contracts → add new**.
2.  Choose the **plan** from the list (for example Private Office).
3.  For an office, choose the **office** as the dedicated resource (for example Office 101).
4.  Set the **start date** exactly as signed. Set the **end date** or term if it is fixed (K002 runs 1 Apr 2026 – 31 Mar 2027). Rolling contracts (like Ravi's K004) have no end date.
5.  Set the **price** (see the discount box below).
6.  Check the deposit, booking credits and notice period match the agreement (❓ some of these may come from the plan automatically).
7.  Save. Open the contract again and read every field once more.

**The discount question.** Office 101 lists at **$3,250**. Pixel Chai pays **$3,000**, a 7.7% discount. There are two common ways to enter this:

| Way | What you enter | What the invoice shows |
| --- | --- | --- |
| A. Lower price | Price $3,000 | One line, $3,000 |
| B. List price + discount | Price $3,250 and a discount of $250 | $3,250 and −$250 |

❓ **Ask your manager which way your company uses**, and always use that one. Way B makes discounts easy to see in reports. Mixing both ways makes discounts impossible to count. Front desk staff usually should not change prices at all without approval.

**What to check:** plan, office, location, start date, price, end date. Six things. Compare them with the signed agreement.

**Common mistake:** wrong start date. It changes the first invoice and every report on when the member joined.

---

## 6. Day Passes and On-Demand Use

**When:** someone walks in for a day, or a member on a part-time plan comes in.

-   **A visitor buying one day:** 📘 Nexudus can sell day passes (also called time passes or products). Search first, create the person if new, then sell the pass so it is charged and recorded. ❓ Ask your manager whether walk-ins buy in the portal, at a tablet, or through you, and how they pay.
-   **A member on a part-time plan** (in the lab, Flex 10 Days, $225 a month for 10 day passes): their plan gives them a number of days. 📘 A day is used when they check in or book a desk, depending on setup. ❓ Ask how days are counted in your account.

**Common mistake:** letting a walk-in sit for free "just this once" without recording it. If it is not in Nexudus, it did not happen: no income, no record of who was in the building.

---

## 7. Meeting Room Bookings: Make, Change, Cancel

**Make a booking (for a member who asks you):**

1.  Find the member (section 2).
2.  📘 Open **Bookings** or the calendar view, pick the **location**, then the room.
3.  Choose the date, start and end time, and the **member** it is for (the right person, so it bills the right team).
4.  Check the price shown. Brick Lane is $56.25 an hour, so 10:00–12:00 is $112.50 (booking B1001 in the lab).
5.  Save. 📘 The member normally gets a confirmation email.

**Change a booking:** open the booking and change the time or room. Do not cancel and rebook unless you must; changing keeps the history in one place.

**Cancel a booking:** open the booking and cancel it. 📘 Cancelled bookings are kept as a separate record, not wiped out. Whether a late cancellation is still charged depends on your cancellation rules (❓ ask your manager).

**Charges and credits:**

-   Meeting rooms are charged per hour. 📘 The charge is added to the team's account and usually billed later (Guide 03).
-   Some plans include **free hours** (booking credits). 📘 When credits are used, the booking shows $0. That is normal. The room was still used.
-   If something went wrong (in the lab, the AV failed during Pixel Chai's booking on 24 Sep), **do not delete the booking** to "refund" it. Tell billing, who will raise a credit note (Guide 03).

**Common mistake:** booking under your own name or a generic "front desk" customer for a member. The charge then goes to nobody, and room use is counted wrongly.

---

## 8. Visitors and Guests

**When:** a member is expecting a guest, or someone arrives at the desk to see a member.

1.  📘 Members can register visitors in the portal or app. Check the visitor list for today first.
2.  If the guest is not listed, contact the member before letting the guest in.
3.  📘 Record the visitor in Nexudus (name, who they are visiting, time) if your account uses the visitor feature. ❓ Ask your manager.
4.  Give the guest the right access for the day only (❓ a guest pass, a temporary card, or a member escorts them; see Guide 06).

**Common mistake:** treating a regular "guest" who comes every day as a visitor. If someone works here most days, they should be a customer on the team's contract. Tell your site manager.

---

## 9. Check-ins and What They Mean

📘 A check-in is a record that someone came into the building. It can come from the door system, from Wi-Fi, from a tablet, or from you checking someone in by hand.

| Check-ins tell you | Check-ins do not tell you |
| --- | --- |
| Who actually comes in, and how often | Who pays (that is the contract) |
| A team that is slowly coming in less | Why they come in less |
| Day passes used on part-time plans (❓ if set up that way) | How long someone stayed, unless they also check out |

💡 In the lab, GreenRoot Foods went from 73% of their people badging in one week, to 40%, to 23%, to almost nobody. That is a warning sign worth telling your site manager about, months before any notice arrives. 🛠 Talk about it at **team level**, never by watching one person. Check-in data is personal data.

**Common mistake:** checking people in "to be helpful" when they did not come. It makes the attendance numbers wrong.

---

## 10. Recording Notice and the Reason for Leaving

**When:** a member tells you (by email, at the desk, or through the account manager) that they want to leave.

1.  Get the notice **in writing** (an email is fine) and forward it to your site manager and sales/account manager.
2.  📘 Open the **contract** and record the **notice date** (the day they told us) and the **end date** (the last day of their contract or notice period).
3.  Record the **reason**. ❓ If your Nexudus contract has a reason field, use the drop-down list. If not, your company may record it in HubSpot instead (Guide 04). Ask which.
4.  Add a short note of what they said in their own words.
5.  Do **not** end the contract today, and do **not** delete or archive anything. The contract runs until its end date.
6.  On the last day: door access removed (Guide 06), keys and cards back, final checks.

**Lab example:** Brightline Legal (contract K003, Office 103, $1,750) gave notice on **30 Apr 2026**. Their contract ended on **30 Jun 2026**. Reason: "moving to hybrid". That record is what lets the business count Brightline as the one company that left in 2026.

**Common mistake:** deleting the member, or ending the contract on the day notice is given. Deleting wipes out history; ending early stops billing for months the member still owes.

---

## 11. Upgrades, Downgrades and Moves (the Nexudus Part)

When a team grows, shrinks or moves site, that is **not** a leaver. The full process (who agrees it, the HubSpot deal, door access) is in **Guide 08**. Here is just what you do in Nexudus:

```
   PRIYA'S UPGRADE (lab)

   K001  Unlimited Coworking, Soho, $400    1 Oct 2025 ──► 31 Mar 2026  (ended, reason: upgrade)
                                                                 │  same team, next day
   K002  Private Office, Office 101, $3,000 (list $3,250)   1 Apr 2026 ──► 31 Mar 2027
```

1.  On the **same team and same customer**, set the old contract's end date to the day before the new one starts. If your account has a reason field, choose "upgrade", "downgrade" or "transfer", not "left".
2.  Create the new contract (section 5) on the same team.
3.  For a move between sites (in the lab, Fatima: Flex 10 Days at Reading, K006, ended 31 Jul 2026; Unlimited Coworking at Soho, K007, from 1 Aug 2026), the new contract uses the **new location**.

**Common mistake:** archiving the old customer and creating a new one for the new contract. The reports then show a member leaving and a stranger joining.

---

## 12. Member Portal and App Questions

| Member says | What to do |
| --- | --- |
| "I can't log in." | Check their email on their customer record is right. 📘 Use the password reset link on the portal login page. Never ask for or type their password. |
| "I can't book that room." | Check the room is open to their plan and location, and the time is inside opening hours. ❓ Some rooms may be limited to certain plans. |
| "Where are my free hours?" | 📘 Credits left are shown in the portal. ❓ Ask your manager whether unused hours roll over or end at month end. |
| "My invoice is wrong." | Do not change it. Note the details and pass it to billing (Guide 03). |
| "Please add my new colleague." | Only on the bill payer's or team admin's request, in writing. Then add them to the team (section 3). |

---

## 13. Your Daily and Weekly Checklist

| When | Check |
| --- | --- |
| Every morning | Today's meeting room bookings and visitor list; rooms are set up |
| Every evening | Walk-ins and day passes all recorded; any problems (AV failure, room not ready) sent to billing and the site manager |
| Every evening | Any notice received today is recorded with dates and reason |
| Weekly | New starters next week: team, people, contract and door access all ready |
| Weekly | Leavers next week: end dates set, door access removal booked for the last day |
| Weekly | Search for duplicates you may have made (same email twice); tell your manager rather than deleting |
| Weekly | Teams coming in much less than before: tell your site manager (team level only) |

---

## Practice Tasks

Do these in a **training or test area** (❓ ask your manager if your company has one; a Nexudus free trial also works), **never on real members**. Use Mini Work.Life.

1.  Create the team **Pixel Chai Studio** with Priya Sharma as team admin, then add Arjun Mehta, Leah Brooks and Tom Okafor to the same team.
2.  Create Priya's first contract: Unlimited Coworking, Soho, $400, from 1 Oct 2025.
3.  Do the upgrade: end it on 31 Mar 2026 and create Private Office, Office 101, from 1 Apr 2026 to 31 Mar 2027 at $3,000 (list $3,250). Write down which discount way you used.
4.  Book Brick Lane for Priya on 3 Sep 2026, 10:00–12:00. Check the price is $112.50. Then make an extra practice booking that is not in the lab (made up): Carnaby for Ravi Patel on 8 Sep 2026, 14:00–15:00 ($37.50), and cancel it. Find where the cancelled booking went.
5.  Record Brightline Legal's notice on 30 Apr 2026, end date 30 Jun 2026, reason "moving to hybrid", without deleting anything.
6.  Search for "kite and key". Do you find "Kite & Key Recruitment"? What would you try next?

---

## Quick Check

**1. A company says they signed yesterday. What do you do before creating anything?**

_Check the deal is won in HubSpot, then search Nexudus for the company and every person (by email first) so you do not make duplicates._

**2. A member gives notice today. Do you end their contract today?**

_No. Record the notice date, the end date and the reason. The contract keeps running until its end date. Never delete._

**3. Priya's team moves from coworking to an office. Is that a leaver?**

_No, it is an upgrade. End the old contract and start the new one on the same team and customer. Full flow in Guide 08._

**4. The projector failed in a booked room. Should you delete the booking so they are not charged?**

_No. Keep the booking and tell billing, who will raise a credit note._

**5. Why does the location on a contract matter?**

_Income and occupancy are counted at the contract's location. The wrong site makes both sites' numbers wrong._

---

## What's Next?

Next: Staff Training 03 — Nexudus for Billing and Payments, where you see what happens to all those contracts and bookings when the invoices go out. 🚀

Back to the start: Staff Training 01 — Start Here. Want the deeper story behind Nexudus? Read Chapter 07 — Nexudus.

Keep learning, keep building! See you in the next one!

---

# Staff Training 03 — Nexudus for Billing and Payments

> Source file: `staff-training/training-03-nexudus-billing.html` · Staff Training — running the business in each system (for new staff)

Hi again! 🙏 This guide is for **billing staff**, and for site managers who want to understand where invoices come from. In a coworking business, almost every invoice is made by **Nexudus** from the contracts and bookings that front desk staff set up (Guide 02). Your job is to check the invoices before they go out, fix mistakes the right way, follow up payments, and hand a clean month over to finance.

⚠️ **About the menu names.** Nexudus menu paths are written from memory and marked 📘. If a menu has moved, search the Nexudus help centre for the task name. Billing is the area where accounts differ most (billing day, how part months are charged, payment providers, reminders). Where it depends on your setup you will see ❓ **ask your manager how your account is set up**. Members, prices and dates come from **Mini Work.Life**, a made-up company. Any timeline or amount not in the lab is marked (made up).

What we will cover in this guide:

-   How invoicing works: the billing cycle
-   Part months (pro-rata) for mid-month starts and leavers
-   Checking the invoice run before it goes out
-   Financial accounts: why each product must map to the right income account
-   Credit notes: never edit or delete an invoice
-   Payments and payment methods
-   Failed payments and chasing
-   Deposits
-   One-off charges: meeting rooms and extras
-   Refunds
-   Your month-end checklist and the handover to finance
-   Practice tasks and a quick check

---

## 1. How Invoicing Works: The Billing Cycle

Coworking billing has two rhythms at the same time:

| What | When it is billed | Lab example (September 2026) |
| --- | --- | --- |
| **Plans and offices** (the same every month) | **In advance**, at the start of the month it covers, like rent | Pixel Chai, invoice dated 1 Sep: "Office 101 September", $3,000 |
| **Meeting rooms and extras** (usage) | **In arrears**, after the use, on a later run | Pixel Chai, invoice dated 30 Sep: "Meeting rooms September", $506.25 (5 Brick Lane bookings, 9 hours × $56.25) |

```
   CONTRACT ──► CHARGE ──► INVOICE ──► PAYMENT ──► BANK
   (front desk)  (what is   (what we    (what the   (cash)
                  due)       billed)     member paid)
```

📘 Nexudus raises invoices from contracts and from charges (bookings, products) waiting to be billed. Usually one invoice goes to the **team's bill payer**, not to each person. All lab amounts here are before VAT. UK VAT at 20% is added on the invoice ($3,000 + $600 = $3,600).

❓ Ask your manager:

-   Is the billing day the 1st for everyone, or each contract's start date?
-   Does the billing run happen automatically, or does someone in billing start it?
-   Are meeting rooms billed on a separate invoice (as in the lab), or added to next month's invoice?

---

## 2. Part Months (Pro-Rata) for Mid-Month Starts and Leavers

**When:** a contract starts or ends on a day that is not the billing day.

Lab example: Ravi Patel (Nomad Analytics, contract K004, Unlimited Coworking $400) started on **15 January 2025**. Three common ways to charge that first month (amounts worked out by us, made up):

| Way | First charge | After that |
| --- | --- | --- |
| By calendar days | 15–31 Jan = 17 of 31 days → $400 × 17 ÷ 31 = **$219.35** | $400 on the 1st of each month |
| Bill from the start date | $400 on 15 Jan, covering 15 Jan – 14 Feb | $400 on the 15th of each month |
| No part month | $400 (full) or $0 (free) | $400 on the 1st |

📘 Nexudus can work out part months for you; how it does it is a setting. ❓ Ask your manager which way your account uses, and never work it out by hand differently for one member.

**What to check:** the first invoice of every new contract and the last invoice of every leaver. These are where most billing mistakes are.

**Common mistake:** a leaver whose contract ends mid-month gets a full month in advance, and nobody credits the unused days. If your rules say part months are credited, check the credit was made.

---

## 3. Checking the Invoice Run Before It Goes Out

**When:** before every billing run is sent to members. 🛠 Our standard: nobody sends a run without this check.

1.  📘 Open the billing area and look at the **preview** or the list of **draft invoices** for the run, if your account has one (❓ ask your manager).
2.  Compare the **number of invoices** with last month. A big change needs a reason (new members, leavers).
3.  Compare the **total** with last month. In the lab, Soho's September office and coworking total is **$3,800** (Office 101 $3,000 + Ravi $400 + Fatima $400).
4.  Check **new starters**: is there a first invoice, with the right part month (section 2)?
5.  Check **leavers**: no invoice after their end date. In the lab, Brightline (ended 30 Jun 2026) must have no July invoice.
6.  Check **discounts** look right. Pixel Chai pays $3,000 for an office listed at $3,250.
7.  Check each invoice goes to the team's **billing email** (for example accounts@pixelchai.co.uk).
8.  Only then send.

```
   RUN CHECK (made-up example sheet)
   ┌─────────────────────┬────────────┬────────────┬──────────────┐
   │                     │ Last month │ This month │ Why changed? │
   ├─────────────────────┼────────────┼────────────┼──────────────┤
   │ Number of invoices  │            │            │              │
   │ Total before VAT    │            │            │              │
   │ New starters billed │            │            │              │
   │ Leavers NOT billed  │            │            │              │
   └─────────────────────┴────────────┴────────────┴──────────────┘
```

**Common mistake:** fixing a wrong price on the invoice itself. Fix the **contract** (or ask front desk to) so next month is right too, then fix this month with a credit note.

---

## 4. Financial Accounts: Each Product to the Right Income Account

📘 In Nexudus settings, each plan, product and room type is linked to a **financial account** (an accounting code). This is set up by **finance**, not by billing or front desk. It decides which line of the profit and loss (P&L) the money lands on.

| Invoice line (lab) | Income account |
| --- | --- |
| "Office 101 September" | 4000 Office |
| Unlimited Coworking, Flex 10 Days | 4010 Coworking |
| "Brick Lane 2h" | 4100 Meeting Rooms |
| Event hire | 4200 Events |

**Why it matters:** if a new product is linked to the wrong account, meeting room income might show up as office income. The total is right, but every report about what earns money is wrong.

**What to do:** when you see a new product or plan on an invoice, check it has a financial account. If it is missing or looks wrong, tell finance. Do not change the mapping yourself.

---

## 5. Credit Notes: Never Edit or Delete an Invoice

**When:** an invoice that has already been sent is wrong, or the member should get money off (goodwill, a fault, a billing mistake).

🛠 **The rule:** once an invoice is issued, you never edit it and never delete it. You raise a **credit note** that reduces it. The invoice and the credit note together show the true amount, and anyone can see what happened and why.

**Lab example: CN-2609-01.** On 24 Sep 2026 the AV failed during Pixel Chai's 2-hour Brick Lane booking (B1007, $112.50). The business gave a goodwill credit of **$112.50** before VAT ("Goodwill credit - AV failure 24 Sep"), against 4100 Meeting Rooms.

1.  Find the invoice that held the booking (in the lab, the September meeting rooms invoice, $506.25).
2.  📘 From the invoice, choose to raise a **credit note** (❓ the button name depends on your Nexudus version).
3.  Credit only the right line and amount: $112.50 for B1007, not the whole invoice.
4.  Write a clear **reason**. If there is a reason list, use it.
5.  Get approval if your rules need it (❓ ask who can approve credits, and up to what amount).
6.  Send the credit note to the bill payer.

💡 **Where are credit notes raised?** In Mini Work.Life, CN-2609-01 was raised **only in NetSuite**, so Nexudus still says Soho invoiced $4,456.25 while NetSuite says $4,343.75. A $112.50 gap that confuses everyone. ❓ Ask your manager whether credit notes are raised in Nexudus or in NetSuite at your company, and stick to one place.

**Common mistake:** deleting a cancelled booking or editing the invoice down to $393.75 "so it is right". The history is gone, and finance's numbers no longer match Nexudus.

---

## 6. Payments and Payment Methods

| Method | How it usually works |
| --- | --- |
| Card saved on the account | 📘 Taken automatically when the invoice is raised, through a payment provider connected to Nexudus |
| Direct Debit | 📘 Collected through a connected provider a few days after the invoice |
| Bank transfer | The member pays into the bank; someone marks the invoice paid (by hand or by matching) |

❓ Ask your manager which payment providers your account uses, and whether bank transfers are marked as paid in Nexudus, in NetSuite, or both.

**To record a bank transfer by hand (📘 if your setup does this in Nexudus):**

1.  Find the invoice by its number or the team name.
2.  Check the amount received matches the invoice total **including VAT** (for example $3,600, not $3,000).
3.  Record the payment with the date it arrived in the bank, not today's date.
4.  If the amount is different, do not mark it fully paid. Tell your manager.

---

## 7. Failed Payments and Chasing

**When:** a card is declined, a Direct Debit bounces, or a transfer does not arrive by the due date.

A **made-up** chasing timeline. ❓ Your company sets its own steps, and Nexudus may send some reminders automatically (📘 if set up):

```
   Day 0   Payment fails or invoice is due      → automatic notice / email (made up)
   Day 3   Friendly reminder from billing        (made up)
   Day 10  Second reminder + call the bill payer (made up)
   Day 21  Final notice; site manager told       (made up)
   Day 30  Manager decides next step: payment plan, use deposit,
           limit bookings, or pass to finance     (made up)
```

-   Be polite. Most failed payments are an expired card.
-   Keep a note of every contact on the team's record.
-   ❓ Ask your manager whether unpaid members lose booking or door access, and who decides. Never cut access on your own.
-   Writing off a debt (giving up on it) is finance's decision, never billing's.

💡 A team that suddenly stops paying, like a team that stops coming in, may be about to leave. Tell your site manager.

---

## 8. Deposits

Many operators take a security deposit on offices. The lab has no deposits, so here is a made-up one: Pixel Chai paid a **$3,000 deposit (made up)** when Office 101 started on 1 Apr 2026.

-   A deposit is **not income**. It is money we hold and owe back.
-   When the team leaves, it is returned in full, or partly used to pay an unpaid invoice, and the rest returned.
-   📘 Nexudus can record deposits, but how depends on setup (a deposit record or an invoice line). ❓ Ask your manager how your account records them and who approves returning one.

**Common mistake:** counting a deposit as a normal payment, so the month's income looks higher than it is.

---

## 9. One-Off Charges: Meeting Rooms and Extras

**When:** anything not covered by the plan: meeting rooms, printing, a locker, catering, an event.

1.  Meeting rooms: 📘 the charge is made automatically when the booking is made (Guide 02). Free hours from booking credits show as $0, which is normal.
2.  Extras: 📘 add a **charge** (or "product") to the team, using the product from the list so it maps to the right account (section 4). Do not type a free text line with your own price.
3.  Check it shows on the next usage invoice.

Lab check: in September, Soho meeting rooms came to **$656.25** (Pixel Chai $506.25, Nomad Analytics $75, Kite & Key $75). Soho's office and coworking $3,800 + $656.25 = **$4,456.25** invoiced in Nexudus.

---

## 10. Refunds

A **credit note** reduces what the member owes. A **refund** sends money back. They are two steps.

1.  First raise the credit note (section 5).
2.  If the member has already paid and has no other unpaid invoice, the credit can be refunded. Otherwise it can be used against their next invoice.
3.  ❓ Ask your manager who approves refunds and how the money is sent back (through the payment provider, or a bank transfer from finance).
4.  Record the refund so Nexudus and NetSuite both show it.

**Common mistake:** refunding money without a credit note. The invoice still says the member owes the full amount.

---

## 11. Your Month-End Checklist and the Handover to Finance

| # | Check | Lab example |
| --- | --- | --- |
| 1 | All billing runs for the month are sent (advance and usage) | 1 Sep office/coworking run; 30 Sep meeting rooms run |
| 2 | All credit notes for the month are raised and approved | CN-2609-01, $112.50 |
| 3 | Invoiced total per site agrees with your run checks | Soho $4,456.25 before credits |
| 4 | Payments received are recorded; unpaid list is up to date | (made up) |
| 5 | New products or plans this month all have a financial account | Ask finance if unsure |
| 6 | Deposits taken or returned are listed for finance | (none in the lab) |
| 7 | Send finance a short note: totals per site, credits, anything unusual | "Soho $4,456.25 invoiced; one $112.50 goodwill credit" |

```
   NEXUDUS (invoices, credits, payments)
        │
        │   ❓ how? a connector, a scheduled import, or by hand
        ▼
   NETSUITE (the official accounts)  ──►  finance closes the month (Guide 05)
```

❓ **How invoices reach NetSuite depends on your setup.** Ask your manager whether it is automatic, and what billing must do before finance closes the month (for example "all credits raised by the 2nd working day", made up).

💡 Remember: **invoiced** (Nexudus) and **recognised income** (NetSuite) are not always the same number. In the lab, Soho invoiced $4,456.25 and NetSuite shows $4,343.75 because of the $112.50 credit. Finance's number is the official one.

---

## Practice Tasks

Do these in a **training or test area** (❓ ask your manager; a Nexudus free trial also works), **never on real members**. Use Mini Work.Life.

1.  Work out Pixel Chai's September 2026 bill: office $3,000 + meeting rooms $506.25. What is the total before VAT? With 20% VAT?
2.  Raise a $112.50 credit note against the Brick Lane booking on 24 Sep (B1007) with the reason "Goodwill credit - AV failure 24 Sep". Check the invoice itself did not change.
3.  Work out Ravi's first charge if K004 ($400, from 15 Jan 2025) is charged by calendar days. Then find which part-month setting your training account uses.
4.  Fill in the run check sheet (section 3) for Soho in September: invoices, total, starters, leavers.
5.  Find the financial accounts settings and check Brick Lane bookings map to 4100 Meeting Rooms.
6.  Write the email you would send on "Day 3" of the made-up chasing timeline. Keep it short and friendly.

---

## Quick Check

**1. An invoice that was already sent has the wrong amount. What do you do?**

_Do not edit or delete it. Raise a credit note for the wrong part, fix the contract so next month is right, and tell the member._

**2. Why does Soho show $4,456.25 in Nexudus but $4,343.75 in NetSuite in the lab?**

_The $112.50 credit note CN-2609-01 was raised only in NetSuite. Credit notes should be raised in one agreed place._

**3. A member paid a $3,000 deposit (made up). Is it income for the month?**

_No. It is money held and owed back, not income._

**4. A new product shows up on an invoice with no financial account. Who fixes it?**

_Finance. Billing spots it and tells them, but does not change the mapping._

**5. When are offices billed, and when are meeting rooms billed?**

_Offices and plans in advance at the start of the month; meeting rooms and extras in arrears, after use (check your own account's setup)._

---

## What's Next?

Next: Staff Training 04 — HubSpot for Sales, where the deals that become contracts begin. 🚀

Back to the start: Staff Training 01 — Start Here. Front desk side of Nexudus: Staff Training 02. Want the deeper story? Read Chapter 07 — Nexudus and Chapter 42 — Membership Billing.

Keep learning, keep building! See you in the next one!

---

# Staff Training 04 — HubSpot for Sales: Leads, Tours, Deals and Renewals

> Source file: `staff-training/training-04-hubspot-sales.html` · Staff Training — running the business in each system (for new staff)

Hi! 🙏 This guide is for **sales and account managers**. HubSpot is where every possible customer lives, from the first website enquiry to the signed deal, and later the renewal. If it is not in HubSpot, nobody else can see it or follow it up.

Each section is one job, written as steps. No technical knowledge needed.

⚠️ **Read this first.** Menu paths below are from HubSpot's own help pages and from memory (📘). HubSpot changes its screens often, so if a button has moved, check the vendor's help centre. Pipeline stages, drop-down lists and day counts marked 🛠 are **our standard** for a new coworking business; your manager may adjust them. Examples come from **Mini Work.Life**, a **made-up** company.

What we will cover in this guide:

-   What lives in HubSpot (and what does not)
-   Our sales pipeline stages
-   Logging a new enquiry
-   Booking and recording a tour
-   Sending a proposal: list price and discount
-   Marking a deal won, and the handover to the front desk
-   Marking a deal lost, with a reason
-   Renewals and upgrades
-   Tasks and follow-ups
-   Duplicates and merging
-   Lifecycle stages
-   Your weekly sales checklist

---

## 1. What Lives in HubSpot

HubSpot has three main kinds of record, and they link to each other (📘 vendor-documented):

```
   CONTACT (a person) ────── linked ────── COMPANY (an organisation)
        │                                       │
        └────────── linked ────── DEAL ─────────┘
                                   │  sits in a PIPELINE, at a STAGE
                                   └── calls, emails, meetings, notes, tasks
```

| Record | What it is | Mini Work.Life example |
| --- | --- | --- |
| Contact | One person. HubSpot treats the email address as unique. | Ben Carter, Ortho Robotics |
| Company | One organisation. Often matched by its website domain. | Ortho Robotics (orthorobotics.ai) |
| Deal | One chance to sell something, with an amount, a stage and a close date | "Ortho Robotics - Office 202", $5,250 a month |

Remember the rule from Guide 01: HubSpot is the truth for **enquiries, tours, quotes and deals**. Once a customer signs, their **contract, plan, price and dates live in Nexudus**. Never change a member's price in HubSpot and expect billing to follow.

🛠 **Deal amount = the monthly price**, not the full contract value. $5,250 means $5,250 a month. Everyone must enter it the same way, or the pipeline report adds monthly and yearly numbers together.

---

## 2. Our Sales Pipeline Stages

HubSpot comes with a default sales pipeline whose stages are named for general sales (📘, check the help centre for the current list). An admin can rename them (📘 typically under Settings → Objects → Deals → Pipelines; check the help centre if it moved). 🛠 Our standard uses two pipelines with coworking stages:

```
   NEW BUSINESS pipeline
   ENQUIRY ──► TOUR BOOKED ──► TOUR DONE ──► PROPOSAL SENT ──► CLOSED WON
                                                         └──► CLOSED LOST (reason)

   RENEWALS pipeline
   RENEWAL DUE ──► IN TALKS ──► PROPOSAL SENT ──► CLOSED WON (renewed)
                                            └──► CLOSED LOST (leaving, reason)
```

| Stage 🛠 | Move a deal here when… | Must be filled in first |
| --- | --- | --- |
| Enquiry | Someone has asked about space | Contact, company, site wanted, lead source |
| Tour booked | A date and time is agreed | A meeting logged on the deal, with the date |
| Tour done | They have seen the space | Tour notes: what they need, how many desks, start date |
| Proposal sent | A price is in writing | Product, list price, quoted price, term, expected close date |
| Closed won | They have signed | See section 6 |
| Closed lost | They said no, or went silent past our cut-off | Lost reason from the drop-down (section 7) |

💡 Why two pipelines? A renewal is money we **already have**. In Mini Work.Life the open pipeline is $8,750 a month: Ortho Robotics $5,250 (new) + the GreenRoot renewal $3,500. But GreenRoot already pays $3,375, so only $125 of that renewal is new money. Mixing the two makes the sales picture look bigger than it is.

---

## 3. Log a New Enquiry

To log a new enquiry (website form, phone call, walk-in or broker):

1.  **Search first.** Use the search bar at the top for the person's email, name and company name (📘). Try the email domain too (for example "orthorobotics.ai"). If they already exist, use that record.
2.  If not found, create the **contact**: Contacts → Create contact (📘). Enter first name, last name, email, phone.
3.  Create or link the **company**. Add the website domain; HubSpot can link contacts to companies by email domain (📘). Check the contact now shows under the company.
4.  Fill in **lead source** 🛠 with our two fields: _lead source type_ (drop-down: Website, Broker, Referral, Walk-in, Other) and _lead source detail_ (the broker's name, or "referred by another member company"). HubSpot also fills some built-in source fields by itself for website visits (📘); do not overwrite those.
5.  Create the **deal** from the company record (📘 the Deals card on the right side). Name it "Company - Product" (for example "Ortho Robotics - Office 202"). Pipeline: New Business. Stage: Enquiry. Pick the **site** and **product** from the drop-downs.
6.  Check: the deal is linked to **both** the contact and the company, and the deal owner is you.

🛠 Lead source is set **once**, at the first enquiry. If the same company comes back a year later for a renewal or an upgrade, do not change it. It records how they first found us.

❓ If your website form creates contacts by itself, ask your manager whether it also creates the deal, or whether you do that by hand.

---

## 4. Book and Record a Tour

To book a tour:

1.  Open the deal. Log or schedule a **meeting** on it (📘 the activity buttons near the top of the record), with the date, time and site.
2.  Tell the site's front desk who is coming and when (🛠 so they can greet the visitor and have the space ready).
3.  Move the deal to **Tour booked** (drag the card on the board view, or change the Deal stage field).

After the tour, the same day:

1.  Add a **note** on the deal: number of desks, office or coworking, wanted start date, budget, other spaces they are looking at.
2.  Move the deal to **Tour done**.
3.  Set the **expected close date** and a **task** for your next step (section 9).
4.  If they did not turn up, log it as a no-show and set a task to call them. Do not move the stage forward.

Mini Work.Life example: Ortho Robotics came through a broker (OfficeFinder, a made-up name) on 2 Sep 2026, toured Reading Office 202 and wants 10 desks from November. Stage: Tour done. Expected close: 31 Oct.

---

## 5. Send a Proposal: List Price and Discount

To send a proposal:

1.  Get the **list price** for the office or plan from your price list (❓ ask your manager where the current price list lives).
2.  On the deal, fill in 🛠 our fields: _product_, _site_, _term (months)_, _list price per month_, _quoted price per month_. Put the quoted monthly price in **Amount**.
3.  If the quote is below list, write the **reason** in a note (for example "longer term").
4.  Send the proposal. ❓ Some companies use HubSpot's own quotes feature (📘 it needs products set up first); others send a separate document. Ask your manager which, and who approves discounts.
5.  Move the deal to **Proposal sent**. Attach or log the email so the proposal is on the record.

Mini Work.Life example: Pixel Chai Studio's Office 101 has a list price of $3,250 a month. They signed at $3,000 for a 12-month term. Discount = ($3,250 − $3,000) ÷ $3,250 = **7.7%**. Because both prices were on the deal, anyone can see the discount and why.

❓ Never promise a rent-free month or a special deal before asking your manager. Each kind of discount is set up differently in Nexudus and in the accounts.

---

## 6. Mark a Deal Won, and Hand It Over

To mark a deal won:

1.  Make sure the signed agreement is attached or logged on the deal.
2.  Fill in every field below, then move the deal to **Closed won**.
3.  Send the handover to the site's front desk (🛠 below) so they can create the contract in Nexudus.

| Field | Example (Pixel Chai, Office 101) | Why |
| --- | --- | --- |
| Close date | 14 Mar 2026 | The day it was won, not the day you remembered to update it |
| Amount (per month) | $3,000 | Must match the price on the signed agreement |
| List price per month | $3,250 | Shows the discount |
| Site | Soho (from the drop-down) | Income lands at the right site |
| Product | Private Office | Office, coworking, meeting room or event |
| Term (months) | 12 | Tells everyone when the renewal comes up |
| Start date | 1 Apr 2026 | The front desk needs it for the contract |
| Deal type 🛠 | Upgrade (they had a hot desk before) | New, renewal or upgrade (section 8) |

**The handover** 🛠. Send the front desk: company name, contact, site, office or plan, monthly price, start date, term, and the deal link. The front desk then creates the customer, team and contract in Nexudus (see Guide 02).

```
   HubSpot: deal CLOSED WON ──► handover to front desk ──► Nexudus: customer + team + contract
                                                                │
                                         Nexudus ID copied back ◄┘  (by the sync, or by hand ❓)
```

💡 **The Nexudus ID.** 🛠 Our HubSpot has two extra fields: _nexudus_customer_id_ on the contact and _nexudus_team_id_ on the company. They link the HubSpot record to the right Nexudus record, so nobody has to match by name. Nexudus has a HubSpot connection that can keep contacts and companies in step (📘 vendor-documented: contacts ↔ customers, companies ↔ teams, deals → opportunities). ❓ Ask your manager whether your company uses it. If it does, the IDs may fill in by themselves. If not, copy the IDs into HubSpot by hand once the front desk confirms the contract.

✅ Check a week later: the won amount in HubSpot equals the contract price in Nexudus. If they differ, someone changed the price late. Find out which one is right and fix it in the system that owns it.

---

## 7. Mark a Deal Lost, With a Reason

To mark a deal lost:

1.  Move the deal to **Closed lost**.
2.  Pick the **lost reason** from the drop-down 🛠: price, location, space/size, hybrid/remote, company closed, competitor, other.
3.  Add a short note with the details in their own words.
4.  If there was a second reason, use the optional second-reason field 🛠.
5.  Set the close date to the day they said no.

| Mini Work.Life deal | What they said | Lost reason (drop-down) |
| --- | --- | --- |
| Lumen Yoga - Event Space | "Price too high" | price |
| Brightline - Renewal 2026 | "Moving to hybrid; downsizing to home working" | hybrid/remote (second reason: space/size) |

💡 Why a drop-down? Free text cannot be counted. A drop-down answers "what were our top three reasons for losing deals this year?" in seconds.

---

## 8. Renewals and Upgrades

**When to open a renewal deal.** 🛠 Our standard: open it in the Renewals pipeline **120 days before the contract end date** (made up; your manager will set the real number). The reason: a member with a notice period can give notice weeks before the end. If the renewal talk has not started by then, it happens on their terms.

To open a renewal deal:

1.  Each month, look up the contracts ending in the next 120 days. ❓ Ask your manager whether you get this list from Nexudus or from a HubSpot view.
2.  Create a deal on the company: pipeline **Renewals**, name "Company - Renewal YYYY", stage **Renewal due**, deal type **Renewal**.
3.  Amount = the **proposed new monthly price**. Note the current price too.
4.  Expected close date = well before the contract end date.
5.  Talk to the site manager. They know how the member is getting on day to day.

Mini Work.Life example, GreenRoot Foods (Reading, Office 201, $3,375 a month, ends 31 Dec 2026):

```
   15 Sep 2026   renewal deal opened (107 days before the end; our standard says 120)
                 proposal sent at $3,500 a month (+$125)      stage: Proposal sent
   30 Nov 2026   expected close
   31 Dec 2026   contract ends
```

💡 If GreenRoot leaves, the business loses $3,375 a month. If they renew, it gains only $125. So a renewal is mostly **protecting** money we already have. Treat it as seriously as a new sale.

To set up a useful view 📘: on the Deals list, filter pipeline = Renewals and close date = next 90 days, then save the view. GreenRoot ($3,500, close 30 Nov) should show up.

**Upgrades.** When a member moves to a bigger space (for example a hot desk to an office), 🛠 create a **new deal** on the same company with deal type **Upgrade**. Do not create a new company. Pixel Chai's "Office 101" deal was an upgrade from a hot desk: same company, same history. In Nexudus, the front desk follows Guide 08 so the move is not counted as a member leaving.

❓ Downgrades and moves to another site: ask your manager whether these get a deal too.

---

## 9. Tasks and Follow-Ups

To set a follow-up:

1.  On the deal, create a **task** (📘 the Task button in the activity area). Give it a clear title ("Call Ben: answer on Office 202") and a due date.
2.  Check your tasks every morning (📘 there is a Tasks list in the CRM menu).
3.  When it is done, mark it complete and log what happened as a note or call.

🛠 Our rules: every open deal has **one task with a future date**. No deal sits in the same stage for more than 30 days (made up) without a note saying why. Log calls and emails on the deal, not only in your inbox.

---

## 10. Duplicates and Merging the Right Way

HubSpot spots duplicate contacts by email. If the same person was entered as _priya@pixelchai.co.uk_ and _Priya.Sharma@pixelchai.co.uk_, HubSpot sees two different people. Their history is split in two.

To merge two records of the same person or company:

1.  Be sure they really are the same person (same company, same phone, same person on the calls).
2.  Decide which record to **keep**: 🛠 the one with the **Nexudus ID** filled in. If neither has one, keep the older one.
3.  Open the record you want to keep. Use Actions → Merge (📘; check the help centre if it moved) and pick the other record.
4.  Read the merge screen carefully; it shows which record is kept. ❓ Which field values win can depend on HubSpot's rules, so check the email, phone and owner afterwards.
5.  Check: deals, notes and emails from both records now show on the kept record.

⚠️ A merge cannot be fully undone (📘 check the help centre). If you are unsure, ask your manager first. Never "fix" a duplicate by deleting one record: you lose its history.

---

## 11. Lifecycle Stages

Every contact has a **lifecycle stage** (📘 built-in): Subscriber → Lead → Marketing Qualified Lead → Sales Qualified Lead → Opportunity → Customer → Evangelist (plus "Other").

| Stage | 🛠 For us it means | Example |
| --- | --- | --- |
| Lead | Has made an enquiry | Ben Carter on 2 Sep |
| Opportunity | Tour done, proposal coming | Ben today |
| Customer | Has signed a contract | Priya, Ravi, Emma |
| Evangelist | Has referred someone to us | Ravi referred Emma (GreenRoot) |

⚠️ Lifecycle stage normally only moves forward (📘). A member who leaves still shows "Customer". So **never count current members from lifecycle stage**. 🛠 We add a _member status_ drop-down on the company (prospect, active, left). Current members are counted from Nexudus contracts.

---

## 12. Your Weekly Sales Checklist

| # | Check 🛠 | Done? |
| --- | --- | --- |
| 1 | Every new enquiry this week has a contact, company, deal, site and lead source | ☐ |
| 2 | Every tour this week is logged, with notes, and the stage moved | ☐ |
| 3 | Every open deal has a task with a future date | ☐ |
| 4 | Close dates in the past on open deals are fixed (won, lost or a new date) | ☐ |
| 5 | Every won deal has close date, amount, list price, site, product, term, start date, deal type, and the front desk has the handover | ☐ |
| 6 | Every lost deal has a lost reason from the drop-down | ☐ |
| 7 | Contracts ending in the next 120 days (made up) have a renewal deal | ☐ |
| 8 | Nexudus IDs filled in for last week's new customers (if not synced ❓) | ☐ |
| 9 | Duplicates you spotted are merged or reported | ☐ |

A quick health check from Mini Work.Life: 5 deals closed, 3 won, so the win rate is **3/5 = 60%**. But one of the two losses was a renewal, so always report new-business and renewal win rates separately.

---

## 13. Practice Tasks

Do these in a **training area or sandbox only** (❓ ask your manager if one exists; a free HubSpot account also works, as in Chapter 10). Never practise on real customers.

1.  Create Ortho Robotics (company, domain orthorobotics.ai), Ben Carter (contact) and the deal "Ortho Robotics - Office 202", Reading, $5,250 a month, lead source type Broker, detail OfficeFinder. Move it to Tour done.
2.  Move Ortho to Proposal sent and add a task to call Ben in 3 days.
3.  Create the Pixel Chai Office 101 deal as Closed won: $3,000 a month, list $3,250, 12 months, Soho, deal type Upgrade, close date 14 Mar 2026. Work out the discount (answer: 7.7%).
4.  Create the Lumen Yoga event deal and mark it Closed lost with reason "price".
5.  Open a renewal deal for GreenRoot: Renewals pipeline, $3,500, expected close 30 Nov 2026. Save a view of renewals closing in the next 90 days and check it appears.
6.  Create Priya twice with two emails (priya@pixelchai.co.uk and Priya.Sharma@pixelchai.co.uk). Give one a Nexudus ID (M001). Merge them, keeping the one with the ID.
7.  Add up your open pipeline. Answer: $8,750 a month, of which $5,250 is new business and $3,500 is a renewal.

---

## Quick check

**1. A customer signs. Which system holds their price from now on?**
_Nexudus. HubSpot keeps the deal history, but the contract, price and dates live in Nexudus._

**2. What must be filled in before you mark a deal won?**
_Close date, monthly amount, list price, site, product, term, start date and deal type, plus the signed agreement. Then send the handover to the front desk._

**3. Why is the GreenRoot renewal not $3,500 of new money?**
_GreenRoot already pays $3,375 a month. Only the $125 increase is new; the rest is money we would lose if they left._

**4. You find two records for the same person. Which do you keep?**
_The one with the Nexudus ID (or the older one if neither has it). Merge, never delete._

**5. Can you count current members from lifecycle stage "Customer"?**
_No. It only moves forward, so people who left still show as customers. Count members from Nexudus contracts._

---

## What's Next?

Next: Staff Training 05 — NetSuite for Finance, to see what happens to the money after a deal becomes a contract. Back to the start: Staff Training 01 — Start Here. Want to go deeper? Read Chapter 10 — HubSpot in the series. 🚀

---

# Staff Training 05 — NetSuite for Finance: The Accounts and the Month-End Close

> Source file: `staff-training/training-05-netsuite-finance.html` · Staff Training — running the business in each system (for new staff)

Hi! 🙏 This guide is for the **finance team**. NetSuite holds the official accounts: every dollar of income and cost, for every site. When leadership asks "did Soho make money last month?", the answer comes from NetSuite, after you have closed the month. So the care you take here decides whether the business can trust its own numbers.

Each section is one job, written as steps: "To do X: 1… 2… 3… then check…". You do not need to know how NetSuite works inside.

⚠️ **Read this first.** Menu paths below are from NetSuite's own help pages and from memory (📘). NetSuite screens differ between companies and change with updates, so if a menu has moved, check the vendor's help centre. Steps marked 🛠 are **our standard**. This is basic how-to only, not accounting or tax advice: for anything about VAT, leases or how to treat an item, **follow your finance lead's policy**. Examples come from **Mini Work.Life**, a **made-up** company with two sites, Soho and Reading.

What we will cover in this guide:

-   The chart of accounts for a coworking business
-   Tagging every line with the site
-   How member invoices arrive from Nexudus, and checking them
-   Recording supplier bills
-   Credit notes
-   Prepayments and accruals in plain words
-   Bank reconciliation basics
-   The month-end close, day by day
-   Reports to run: site P&L and budget vs actual
-   Reconciling Nexudus with NetSuite

---

## 1. The Chart of Accounts

The **chart of accounts** is the list of "buckets" money goes into. Every invoice line and every bill line must land in the right bucket, or the reports mix things up. You can see the list in NetSuite under 📘 Lists → Accounting → Accounts (check the help centre if it moved).

Here is the Mini Work.Life chart for the profit and loss (your company's numbers and names will differ; ❓ ask your finance lead for the real list):

| Account | Name | Type | Used for |
| --- | --- | --- | --- |
| 4000 | Office Revenue | Income | Private office fees |
| 4010 | Coworking Revenue | Income | Hot desk and coworking plans |
| 4100 | Meeting Room Revenue | Income | Meeting room bookings |
| 4200 | Event Revenue | Income | Event space hire (no rows in September) |
| 5000 | Rent | Expense (site) | Rent for the building |
| 5010 | Business Rates | Expense (site) | Council business rates |
| 5020 | Service Charge | Expense (site) | Landlord's service charge |
| 5100 | Utilities | Expense (site) | Energy |
| 5200 | Site Staff | Expense (site) | Staff working at the site |
| 5300 | Cleaning | Expense (site) | Cleaning contracts |
| 6000 | Central Overheads | Expense (central) | Head office costs shared out to sites |

💡 **Why the right income account matters.** Leadership watches office, coworking and meeting room income separately. If a meeting room charge lands in 4000, the office numbers look better than they are and meeting rooms look worse. The pattern is simple: **4xxx = income, 5xxx = site costs, 6xxx = central costs**.

🛠 Never create a new account yourself. If something does not fit, ask your finance lead. A new account changes every report.

---

## 2. Tag Every Line With the Site

NetSuite can tag each transaction line with extra labels called **segments** (📘): _subsidiary_, _location_, _department_, _class_, and sometimes custom ones. One of these is used for the **site**. Mini Work.Life uses **location** (Soho, Reading).

❓ Ask your finance lead **which segment your company uses for the site**: location, department, class or a separate subsidiary. Then use it on **every line**, every time.

To check a transaction is tagged:

1.  Open the invoice, bill or journal.
2.  Look at each line, not just the top of the form. A site can be set on the header and still be different, or empty, on a line.
3.  Fix any empty or wrong site before you save. If the transaction is already in a closed month, ask your finance lead first.

⚠️ A cost with no site tag disappears from every site's P&L. A cost with the wrong site makes one site look worse and another better.

---

## 3. Member Invoices From Nexudus

Member invoices are created in **Nexudus** by the billing team (Guide 03), not typed by hand in NetSuite. How they get into NetSuite **depends on your setup** (❓ ask your finance lead): it could be an automatic connector, a file import, or one summary journal per month. Whatever the route, your job is the same: **check that what arrived matches what Nexudus sent**.

To check the month's member invoices (🛠 our standard, after each billing run):

1.  Get the Nexudus invoice total for the month, by site and by income type (ask billing, or run the Nexudus report).
2.  In NetSuite, run the income accounts (4000–4200) for the same month, by site (section 9).
3.  Compare them line by line. Every difference must have a reason (section 10).
4.  Spot-check a few invoices: right customer, right account, right site, net amount (VAT on its own line).
5.  Check customer names. In Mini Work.Life, NetSuite says "Green Root Foods Ltd" and "Kite and Key Recruitment Ltd" while Nexudus says "GreenRoot Foods" and "Kite & Key Recruitment". ❓ Ask whether NetSuite customers carry the Nexudus ID, so they can be matched without guessing.

Mini Work.Life, September 2026: the office and coworking invoices are dated 1 Sep (billed in advance); the meeting room invoices are dated 30 Sep (billed after use).

💡 VAT is not income. It is money owed to HMRC and sits in its own account. If a revenue number is exactly 20% too high, someone used the total including VAT. Follow your finance lead's policy for VAT.

---

## 4. Record Supplier Bills

To enter a supplier bill (📘 usually Transactions → Payables → Enter Bills; check the help centre if it moved):

1.  **Search for the supplier first**. Do not create a second copy of a supplier that already exists.
2.  Enter the supplier's bill number, the bill date and the due date.
3.  On each line: the right **expense account**, the **amount** (net, as a positive number), and the **site**.
4.  If one bill covers two sites, split it into two lines, one per site.
5.  Attach the PDF of the bill. Save, and send for approval if your company uses approvals (❓).
6.  Check: the total matches the supplier's PDF, and every line has a site.

| Bill (Mini Work.Life, Sep 2026) | Account | Soho | Reading |
| --- | --- | --- | --- |
| Rent | 5000 | $5,625 | $1,625 |
| Business rates | 5010 | $1,125 | $312.50 |
| Service charge | 5020 | $500 | $187.50 |
| Utilities (energy) | 5100 | $437.50 | $250 |
| Cleaning | 5300 | $375 | $187.50 |
| Site staff (payroll journal, not a bill) | 5200 | $1,500 | $500 |
| **Site direct costs** |  | **$9,562.50** | **$3,062.50** |

Costs are entered as **positive** amounts. The report then takes them away from income. Site staff costs come from payroll as a **journal** (📘 Transactions → Financial → Make Journal Entries), split by site. ❓ Who posts payroll and how it is split is your finance lead's policy.

---

## 5. Credit Notes

A **credit note** (NetSuite calls it a **credit memo**) reduces what a customer owes for something already invoiced. 🛠 Never edit or delete a sent invoice. Always raise a credit note.

To raise a credit memo in NetSuite (📘 usually Transactions → Customers → Issue Credit Memo, or from the invoice; check the help centre):

1.  Pick the customer, and link the credit to the original invoice if you can.
2.  Use the **same income account and site** as the original charge.
3.  Write a clear memo with the reason and date.
4.  Get approval if your policy needs it (❓).

Mini Work.Life example: **CN-2609-01**, −$112.50, account 4100 Meeting Room Revenue, Soho, Pixel Chai Studio, "Goodwill credit - AV failure 24 Sep".

⚠️ **Raise each credit note in one place only.** In Mini Work.Life, this credit was raised in NetSuite only, so Nexudus still shows the full $112.50 as billed. That is why the two systems differ (section 10). ❓ Ask your finance lead whether credit notes should be raised in Nexudus (and flow to NetSuite) or in NetSuite, and stick to it.

---

## 6. Prepayments and Accruals in Plain Words

The accounts show income and costs in the month they **belong to**, not the month the bill or cash arrives. A few adjustments make that happen. Your finance lead decides how each is done; this is just what the words mean.

| Word | Plain meaning | Coworking example (made up) |
| --- | --- | --- |
| Accrual | A cost that belongs to this month, but the bill has not arrived yet. You add an estimate now. | September energy bill arrives 15 Oct. Finance adds $437.50 to September as an estimate. |
| Prepayment | A cost paid in advance for several months. You spread it over those months. | Rent billed quarterly at $16,875. It shows as $5,625 a month. |
| Deferred income | A member pays in advance for several months. You count it as income month by month as it is earned. | A member prepays a year at $40,500. Income is $3,375 a month. |

🛠 Keep a simple list of every accrual and prepayment, with the amount and the month it should reverse or end. ❓ NetSuite has features that can reverse or spread these for you (📘); ask your finance lead which ones your company uses.

---

## 7. Bank Reconciliation Basics

A **bank reconciliation** proves that NetSuite's bank account matches the real bank statement.

To reconcile the bank (📘 NetSuite has a bank reconciliation or "match bank data" screen under the Transactions → Bank menu; the name differs by version, so check the help centre):

1.  Get the bank statement (or the bank feed) for the month.
2.  Match each bank line to a NetSuite transaction: member payments to invoices, supplier payments to bills.
3.  For bank lines with no match (bank fees, a payment with no invoice), find out what they are and record them, or ask.
4.  For NetSuite items with no bank line (a payment recorded twice?), investigate.
5.  Check: the NetSuite bank balance after matching equals the statement's closing balance. Save the reconciliation.

(Mini Work.Life has no payment data, so there is no lab example here.)

---

## 8. The Month-End Close, Day by Day

Closing the month means: get everything in, check it, then **lock** the month so the numbers cannot change. Until it is locked, every number is **provisional**. 🛠 Here is a made-up timeline (WD = working day after month end). Your finance lead sets the real one.

| When (made up) | Task | Mini Work.Life example |
| --- | --- | --- |
| Last days of the month | Remind site teams to send all bills; billing runs the usage invoices | Meeting room invoices dated 30 Sep |
| WD1 | Cut-off: make sure each bill and invoice is in the right month | September energy bills dated 30 Sep |
| WD2 | Payroll journal, split by site | $1,500 Soho, $500 Reading |
| WD2–3 | Accruals and prepayments (section 6) | None in the lab |
| WD3 | Central cost allocation journal (❓ the key, for example by desks, is your finance lead's decision) | $1,250 Soho, $625 Reading (account 6000) |
| WD3–4 | Reconciliations: bank, money owed to us, money we owe, VAT, Nexudus vs NetSuite | Soho −$112.50 explained (section 10) |
| WD4–5 | Run reports, compare to budget and last month, chase anything odd, write notes on the reasons | Soho −62% vs budget |
| WD5–7 | Finance lead signs off; the period is locked | September locked |

To lock the period (📘 NetSuite has accounting periods with a period close checklist, typically under Setup → Accounting → Manage Accounting Periods; check the help centre). The checklist can lock money owed to us (A/R), money we owe (A/P) and then everything, step by step (📘). 🛠 Only the finance lead locks or reopens a period.

⚠️ If you find a mistake after the lock, do not ask for the period to be reopened straight away. Tell your finance lead. Small items are usually fixed in the current month; reopening changes a number leadership has already seen.

---

## 9. Reports to Run

**Site P&L.** Run the income statement (📘 Reports → Financial → Income Statement, or a saved report your company built; check the help centre), for the month, split or filtered by the site segment.

| Sep 2026 (Mini Work.Life) | Soho | Reading |
| --- | --- | --- |
| Office revenue (4000) | $3,000 | $3,375 |
| Coworking revenue (4010) | $800 | $0 |
| Meeting room revenue (4100, after the credit) | $543.75 | $250 |
| **Revenue** | **$4,343.75** | **$3,625** |
| Site direct costs (5000–5300) | $9,562.50 | $3,062.50 |
| **Contribution** (revenue − direct costs) | **−$5,218.75** | **+$562.50** |
| Central overheads (6000) | $1,250 | $625 |
| **After central costs** | **−$6,468.75** | **−$62.50** |

**Budget vs actual.** The budget lives in the **Excel budget template**, not in NetSuite (Guide 07). ❓ Ask whether your company also loads it into NetSuite.

To compare (🛠):

1.  Take actual revenue and direct costs per site from the NetSuite report.
2.  Take the budget for the same site and month from the Excel template (use the agreed version only).
3.  Variance = actual − budget. For revenue, negative is bad. For costs, positive is bad. Mark each one as good or bad so nobody misreads a sign.

| Sep 2026 | Actual | Budget | Variance |
| --- | --- | --- | --- |
| Soho revenue | $4,343.75 | $11,500 | −$7,156.25 (−62%) bad |
| Soho direct costs | $9,562.50 | $9,562.50 | $0 on budget |
| Reading revenue | $3,625 | $4,000 | −$375 (−9%) bad |
| Reading direct costs | $3,062.50 | $3,062.50 | $0 on budget |

---

## 10. Reconcile Nexudus Invoiced vs NetSuite Recognised

Nexudus shows what was **invoiced**. NetSuite shows the official **revenue**. They often differ, and that is fine, **as long as every difference has a reason**. 🛠 Do this every month, for every site, before the lock.

```
   SOHO, SEP 2026              NEXUDUS invoiced   NETSUITE revenue   difference
   Office 101 (Pixel Chai)           $3,000            $3,000             $0
   Coworking (2 members)               $800              $800             $0
   Meeting rooms                       $656.25              $543.75           −$112.50  ← CN-2609-01
                                     ──────            ──────           ────
   Total                             $4,456.25            $4,343.75           −$112.50  ✅ explained

   READING, SEP 2026                 $3,625            $3,625             $0  ✅
```

To reconcile:

1.  Put the Nexudus invoiced total (net of VAT) and the NetSuite income total side by side, per site, per income type.
2.  For each difference, find the transaction that explains it: a credit note raised in one system only, a journal, a prepaid invoice, an invoice in the wrong month or at the wrong site.
3.  Write the reason next to it. A difference you can explain is fine. One you cannot explain is a problem: fix it before the lock.
4.  Keep the reconciliation with the month's close papers.

---

## 11. Practice Tasks

Do these in a **training area or sandbox only** (❓ ask your manager if your company has a NetSuite sandbox). If there is none, use the lab file `netsuite_gl_sep2026.csv` in Excel, as in Chapter 09. Never practise on live accounts.

1.  Enter the Soho rent bill: $5,625, account 5000, site Soho, dated 1 Sep 2026. Check the site is on the line.
2.  Enter one bill that covers both sites: energy $437.50 Soho + $250 Reading on two lines.
3.  Raise credit memo CN-2609-01: −$112.50, account 4100, Soho, Pixel Chai Studio, with a clear memo.
4.  Using the lab file, build the Soho and Reading P&L. Check your answers: revenue $4,343.75 and $3,625; contribution −$5,218.75 and +$562.50; after central −$6,468.75 and −$62.50.
5.  Compare to the Excel budget for September (Soho $11,500, Reading $4,000). Check: −$7,156.25 and −$375.
6.  Reconcile Soho: Nexudus $4,456.25 vs NetSuite $4,343.75. Name the transaction that explains the −$112.50.
7.  Write your own close checklist for next month, with a date for each step.

---

## Quick check

**1. A Soho meeting room charge was posted to 4000 Office Revenue. Why does it matter if the total is still right?**
_Office income looks too high and meeting room income too low, so leadership gets the wrong picture of what sells._

**2. A bill line has no site. What happens?**
_The cost is missing from every site's P&L, so the site looks better than it is. Always tag every line._

**3. Why is Soho's September revenue $4,343.75 in NetSuite but $4,456.25 in Nexudus?**
_The $112.50 goodwill credit memo CN-2609-01 was raised in NetSuite only. The difference is fully explained._

**4. Before the month is locked, are the numbers final?**
_No, they are provisional. Accruals, credit notes, payroll and allocation journals can still change them._

**5. You find a mistake in a locked month. What do you do?**
_Tell your finance lead. Small items are usually fixed in the current month; only the finance lead decides to reopen a period._

---

## What's Next?

Next: Staff Training 06 — Door Access and Act! CRM. Back to the start: Staff Training 01 — Start Here. Want to go deeper? Read Chapter 09 — NetSuite in the series. 🚀

---

# Staff Training 06 — Door Access (ACT365) and the Act! CRM

> Source file: `staff-training/training-06-door-access-and-act-crm.html` · Staff Training — running the business in each system (for new staff)

Hi again! 🙏 This guide is for **site managers, front desk and IT staff** who look after the doors, and for **sales staff** who may find old records in an older CRM. It has two parts. **Part A** covers **ACT365**, the door access system: who can open which door, and how to give and take away access. **Part B** covers the **Act! CRM**, which you only need if your company has old sales records in it.

⚠️ **Before you start.** ACT365 is usually set up and sold by a **security installer**, so every building is set up a little differently. This guide explains the ideas and our standard way of working (🛠). It does not give exact button names, because we cannot promise them. For those, check the ACT365 help centre or ask your installer (📘 / ❓). Example people, cards and doors come from **Mini Work.Life**, a **made-up** company. A note on the name: at Work.Life itself, the brief only says "ACT", and it is not clear whether that means ACT365 or Act!. That is why this guide covers both.

What we will cover in this guide:

-   Part A: how door access works, in plain words
-   Nexudus connected or not connected: what changes for you
-   Giving access to a new member
-   Changing access when a member upgrades or moves site
-   Removing access on the last day, and lost cards
-   Staff, contractors and visitors
-   Door event reports: personal data, who may look and why
-   The weekly access check
-   Part B: the Act! CRM (only if you have old records)
-   Practice tasks and a quick check

---

## 1. How Door Access Works, in Plain Words

Every controlled door has a small **reader** next to it. A person shows a **card**, a **fob** or (if your setup allows it) their **phone**. The reader asks the system: "Is this person allowed through this door, right now?" The door opens or stays shut, and the system writes down what happened.

```
   Priya taps card ──► READER on the door ──► ACT365 (in the cloud)
                                                 │
                       "Is this card in a group  │
                        that may open this door  │
                        at this time?"           │
                                                 ▼
                           ✅ Access Granted   or   ❌ Access Denied
                                                 │
                                   EVENT written down (time, door, card)
```

| Word | What it means | Mini Work.Life example (made up) |
| --- | --- | --- |
| **Cardholder** | A person who has been given access | CH-1001 Priya Sharma |
| **Credential** | The thing they show the reader: card, fob, PIN, or phone (❓ ask your installer which ones your building supports) | Card 04A1B2C301 |
| **Door** | A door with a reader on it | Soho Main Entrance, Soho Office 101 Door |
| **Access group** | A named set of doors a person may open. You put people into groups; you do not give doors one by one. | "Soho Office 101" = main entrance + office 101. "Soho Coworking" = main entrance only. |
| **Schedule** | The days and times a group works (for example weekdays only, or all hours). 📘 How schedules are set up depends on your installer's setup. | Not in the lab files |
| **Event** | One tap at one door, granted or denied | EV00005: Leah Brooks, Soho Main Entrance, 1 Sep, Access Granted |

🛠 The golden rule: **access follows the contract**. A person may open a door only while they have an active contract (or booking) that includes it. The contract lives in Nexudus, so Nexudus decides, and ACT365 does what it is told.

---

## 2. Nexudus Connected or Not Connected

Nexudus can be connected to ACT365. Your company either uses that link or does not. ❓ Ask your manager which one you have, because it changes almost every task below.

|  | Connected (📘 Nexudus documents this integration) | Not connected |
| --- | --- | --- |
| How groups are set up | One ACT365 group for each Nexudus pass, plan, desk and office. Set up once by IT or the installer. | Groups set up by hand, usually one per office and one per coworking floor |
| New member gets access | Nexudus adds them to the right group when their contract or booking starts | A site manager adds them by hand in ACT365 |
| Member leaves | Nexudus removes them when the contract ends or is cancelled | A site manager removes them by hand, on the last day |
| Check-ins | Door taps can be sent back to Nexudus as check-ins (optional) | None, unless something else records them |
| Your main job | Keep the **contract right** in Nexudus, and check the result | Do every access change yourself, the same day, and never forget one |

💡 Even when connected, things can go wrong: a card number typed wrongly, a contract left open, a group not mapped to a new office. That is why section 7 has a weekly check.

---

## 3. Giving Access to a New Member

Do this only after the contract exists in Nexudus (see Guide 08 for the full joiner flow).

| Step | Connected | Not connected |
| --- | --- | --- |
| 1 | Check the member's contract in Nexudus: right site, right office or plan, right start date | Same |
| 2 | Give the member their card or fob, or send the phone invite (❓ how your setup issues these) | Same |
| 3 | Record the card number on the member's Nexudus record, exactly as printed (📘 check the Nexudus and ACT365 help centres for which field) | Create the cardholder in ACT365 with the member's name and **the same email as in Nexudus**, and the card number |
| 4 | Wait for the sync, then check the cardholder appears in the right group in ACT365 | Put the cardholder in the right group (for example "Soho Office 101") |
| 5 | Ask the member to test the main door and their office door while you are there | Same |

🛠 Always store the **Nexudus email** on the ACT365 cardholder. It is the only way to match a card to a member later. In the lab file every member card has one; the cleaner's card (CH-9001) has none, because the cleaner is not a member.

---

## 4. Changing Access on an Upgrade or a Move

When a member's contract changes, their access must change on the same day the new contract starts.

| Change | Lab example (made up) | Access change |
| --- | --- | --- |
| Upgrade to an office | Priya: hot desk (K001) ended 31 Mar 2026, Office 101 (K002) from 1 Apr 2026 | From "Soho Coworking" to "Soho Office 101" on 1 Apr |
| Downgrade to coworking | None in the lab | From the office group to the coworking group on the new start date |
| Transfer between sites | Fatima (Kite & Key): Reading Flex 10 (K006) ended 31 Jul, Soho hot desk (K007) from 1 Aug 2026 | Reading access removed, "Soho Coworking" added, on 1 Aug. The lab card now shows "Soho Coworking". |

**Connected:** end the old contract and start the new one correctly in Nexudus, and the groups follow. Then check ACT365 on the start day. **Not connected:** move the cardholder between groups yourself on the start day. Keep the **same card and the same cardholder**. Do not create a second cardholder for the same person.

---

## 5. Removing Access on the Last Day, and Lost Cards

🛠 Rule 7 from Guide 01: **remove door access on the last day**. A leaver should not be able to walk in.

| Situation | What to do |
| --- | --- |
| A company leaves | Connected: check the contract end date in Nexudus is right, and on the day after the last day check every person in that company is out of the group. Not connected: remove each person from the group at the end of the last day. Collect cards and fobs if your company asks for them back (❓). |
| One person leaves a company that stays | Remove that one person only. The company's other people keep access. |
| A lost or stolen card | Turn off that card straight away (📘 check the ACT365 help centre for how to block or remove a card). Issue a new card to the same cardholder. Update the card number in Nexudus if you store it there. ❓ Ask whether your company charges for a new card. |
| A member with an unpaid bill | Do not remove access on your own. ❓ Ask your manager; this is a business decision. |

💡 **A real example from the lab.** Brightline left on 30 Jun 2026, and both their cards show "removed". On 2 Sep, Daniel Hughes tried their old card at Soho Main Entrance. The event says _Access Denied - Card Not In Group_. The removal worked. 🙂

🛠 **Do not delete** a leaver's cardholder record unless your company's rules say so (❓). Remove them from all groups instead, so their past events still make sense.

---

## 6. Staff, Contractors and Visitors

| Who | 🛠 Our standard |
| --- | --- |
| Our own staff | A cardholder in a staff group for the sites they work at. Created by IT or the site manager when they start, removed on their last day. Staff are not in Nexudus as members. |
| Contractors (cleaners, repair people) | A cardholder in a contractor group, with a schedule if possible. No Nexudus email. Lab example: CH-9001, group "All Doors (Contractor)". Check these cards every month; contractors change often. |
| Visitors and day guests | Signed in by front desk and let in by a member or staff, or given a short-term pass if your setup allows it (❓ ask your manager or installer). Never lend a member's or staff card. |

---

## 7. Door Event Reports: Personal Data

A door log shows **when a named person came in, every day**. Under UK GDPR that is **personal data**. Members trust us not to watch them.

| Reason to look | Allowed? | How |
| --- | --- | --- |
| A security incident (a break-in, a theft, a door forced open) | Yes, by the site manager or IT, for that incident only | Look at the doors and times of the incident. Write down why you looked. |
| Checking that a removed card is really blocked | Yes | Look for "Access Denied" on that card, like the Daniel example above |
| Business use: is a company still using its office? | Yes, but **company level only** | Totals per company per week, never one named person. For example, "GreenRoot's weekly badge-in rate fell from 73% to 23% in September". |
| "When did this person come in last week?" out of interest | **No** | Do not look |
| Checking when our own staff arrive | **No**, not through this system | Staff data is HR data. Ask HR. |

💡 How to count visits fairly: people tap more than one door (Priya taps the main entrance, then the office door). So count **people per day at the main entrance**, not taps. The lab has 276 events in September, but far fewer visits. Times in exports may be in UTC (one hour behind London in summer), so check before you report by hour.

---

## 8. The Weekly Access Check

🛠 Once a week, the site manager compares **active cards** with **active contracts**. It takes ten minutes and catches most mistakes.

```
   1. Export active cardholders for your site from ACT365   (📘 check help centre)
   2. Export active members for your site from Nexudus
   3. Match them on email
   4. Look at what does NOT match:

      Card active, no active contract    → a leaver kept access. Remove it.
      Active contract, no card           → a member cannot get in. Fix it.
      Card in the wrong group            → wrong office or site. Fix the group.
      Card with no email                 → staff or contractor? Check it is meant to be there.
```

Lab example on 30 Sep 2026 (made up): 15 cardholders. 2 are "removed" (Brightline). 1 is the contractor. The other 12 are active and match the 12 active members (4 Pixel Chai, Ravi, Fatima, 6 GreenRoot). All clean. ✅

---

## 9. Part B — The Act! CRM (Only If You Have Old Records)

**Act!** is an older sales CRM: contacts, companies, opportunities (deals), activities and notes. 🛠 For a new business our standard is **HubSpot for all sales** (see Guide 04). You only need Act! if your company has old sales records in it.

| Do | Do not |
| --- | --- |
| Use Act! **read only**, to look up history: who a company is, past quotes, why a deal was lost | Add new contacts, deals or notes in Act! |
| Copy anything useful into HubSpot (as a note on the HubSpot record) | Keep using Act! alongside HubSpot. Two sales systems means two different pipelines and nobody knows which is true. |
| Ask the CRM admin if you cannot find something | Export contacts to your own computer |

**Moving old records to HubSpot, once.** ❓ This is a job for IT and the data team, not for each sales person. The usual shape is:

```
   1. Export contacts, companies and opportunities from Act!   (📘 check Act! help centre)
   2. Clean them: one spelling per company, emails in lower case,
      free-text reasons turned into drop-down values
   3. Match each record to HubSpot and Nexudus (search before you create!)
   4. Import into HubSpot once, keep a frozen copy for the data team
   5. Turn Act! to read only, then switch it off on an agreed date
```

💡 Why cleaning matters, from the lab: in Act! Priya's email is _Priya.Sharma@pixelchai.co.uk_ and the company is "Pixel Chai Studio Ltd". In Nexudus it is _priya@pixelchai.co.uk_ and "Pixel Chai Studio". Without matching, one member becomes two. And Brightline's lost reason in Act! is free text ("Moving to hybrid; downsizing to home working"); in HubSpot it should become a drop-down value such as hybrid/remote.

---

## 10. Practice Tasks

Do these in a training area only (❓ ask your manager), never on a real member's card. You can also use the lab files `act365_cardholders.csv` and `act365_door_events_sep2026.csv`.

1.  In the cardholders file, find which group Priya is in, and which group Ravi is in. Why are they different?
2.  Find the two "removed" cards. Which company were they, and when did that company leave?
3.  Find the one "Access Denied" event. Which card, which door, which day? What does it prove?
4.  Do the weekly access check from section 8 with the lab files and `members.csv`. Do you get 12 matches?
5.  Write down, without looking anything up, what you would do in the first five minutes if a member says their card was stolen.
6.  A colleague asks "what time did Hannah from GreenRoot get in on Monday?" just out of interest. Write your reply.

---

## Quick check

**1. Where does the decision "may this person open this door" really come from?**
_From the contract in Nexudus. ACT365 holds the access, but access follows the contract._

**2. A member upgrades from a hot desk to an office. Do you make a new cardholder?**
_No. Keep the same cardholder and card, and move them to the office group on the day the new contract starts._

**3. When must a leaver's access be removed?**
_On the last day. Remove them from all groups; do not delete the record unless your rules say so._

**4. Can you use door events to see how often a company uses its office?**
_Yes, but only as company-level totals per week, never one named person's arrivals._

**5. Your company has old records in Act!. Can sales keep logging calls there?**
_No. Use Act! read only for history. All new sales work goes in HubSpot._

---

## What's Next?

Next: Staff Training 07 — Excel: The Budget and Capacity Sheets. Then the most important one for everyone, Guide 08 — Joiner, Mover, Leaver, which shows where door access fits in each flow. 🚀

Back to Staff Training 01 — Start Here. Want more depth? Read Chapter 08 — ACT.

---

# Staff Training 07 — Excel: The Budget and Capacity Sheets

> Source file: `staff-training/training-07-excel-budget-capacity.html` · Staff Training — running the business in each system (for new staff)

Hi again! 🙏 This guide is for **finance and operations staff**, and for **site managers** who tell them about changes at their site. Most of the business runs in proper systems, but two important lists still live in Excel: the **budget** and the **capacity** list. The dashboards read them every day, so a small slip in Excel can quietly change the numbers leaders see.

⚠️ **Before you start.** This guide shows **our standard way of working** (🛠). Example sites and numbers come from **Mini Work.Life**, a **made-up** company; the lab file is `excel_capacity_budget_2026.csv`. Your company's columns, sites and file location may be different (❓ ask your manager).

What we will cover in this guide:

-   What the two sheets are, and who owns each
-   Where the file lives
-   The template rules
-   Setting the budget for a new year
-   Changing capacity when a site adds or removes desks
-   Version history
-   What breaks when the rules are broken
-   A checklist, practice tasks and a quick check

---

## 1. What the Two Sheets Are

| Sheet | What it holds | Owner (🛠) | Used for |
| --- | --- | --- | --- |
| **Budget** | For each site and each month: the planned revenue, planned direct costs and planned occupancy | Finance | "Revenue vs budget" on the dashboards and in the board pack |
| **Capacity** | For each site (and month): how many desks and offices the site can really sell | Operations | Desk occupancy: desks taken ÷ sellable desks |

Why Excel? Nexudus knows which offices exist, but after a refit its numbers are often out of date. And the budget is made once a year by finance. So these two lists are kept in Excel, with strict rules, and loaded into the data warehouse on a schedule.

In the lab file both sheets sit together in one table, one row per site per month:

| site_code | month | sellable_desks | budget_revenue_usd | budget_desk_occupancy | budget_direct_costs_usd | notes |
| --- | --- | --- | --- | --- | --- | --- |
| SOHO | 2026-07 | 34 | 11250 | 0.85 | 9500 |  |
| SOHO | 2026-08 | 34 | 11250 | 0.85 | 9500 | August is quiet - holidays |
| SOHO | 2026-09 | 34 | 11500 | 0.85 | 9562.50 |  |
| RDG | 2026-07 | 31 | 3875 | 0.20 | 3000 |  |
| RDG | 2026-08 | 31 | 3875 | 0.20 | 3000 |  |
| RDG | 2026-09 | 31 | 4000 | 0.20 | 3062.50 | Ortho Robotics could fill O202 from Nov |

💡 `sellable_desks` is the capacity part (operations). The `budget_...` columns are the budget part (finance). ❓ Your company may keep them as two tabs or two files; the rules below are the same either way. If one file has two owners, agree who may edit which columns.

---

## 2. Where the File Lives

| Rule | Why |
| --- | --- |
| 🛠 **One shared location** (for example a named SharePoint, OneDrive or Google Drive folder; ❓ ask your manager which) | The data load reads the file from that exact place |
| 🛠 **Never rename or move the file** without telling the data owner first | The load cannot find a moved file, so the dashboards keep showing old numbers |
| 🛠 **No copies.** No "Budget_FINAL_v2.xlsx" on your desktop or in email. | With two copies, nobody knows which one is true |
| 🛠 **Edit rights only for owners.** Everyone else views. | Fewer people editing means fewer slips |

---

## 3. The Template Rules

A computer reads this file, not a person. Computers are strict. Follow every rule, every time.

| # | Rule | Wrong | Right |
| --- | --- | --- | --- |
| 1 | **Do not rename, move, add or delete columns** | Renaming `sellable_desks` to "Desks (sellable)" | Leave the header row exactly as it is. Need a new column? Ask the data owner. |
| 2 | **Site from the drop-down list only** | "Soho", "soho ", "Soho site (new)" | SOHO |
| 3 | **One row per site per month** | Two rows for SOHO 2026-09, or one row covering "Jul–Sep" | Exactly one row for each site and month |
| 4 | **Month in the agreed format** | "Sept 26", "09/2026" | 2026-09 (or whatever the template says; ❓) |
| 5 | **Numbers as numbers, not text** | "$11,500", "9.2k", "85%" typed as text, "TBC" | 11500 and 0.85. Leave a cell empty if unknown, and say why in `notes`. |
| 6 | **No merged cells** | Merging the SOHO cells across three months to look tidy | Repeat SOHO on every row |
| 7 | **No totals, subtotals or blank rows inside the table** | A "Total Soho" row under September | Totals go on a separate tab, or in the dashboard |
| 8 | **Do not type over a formula** "just this month" | Typing 9500 over a calculated cell | Change the inputs, or write a note and tell the owner |
| 9 | **Notes go in the notes column** | Cell colours or comments to explain a number | Plain text in `notes`, like "August is quiet - holidays" |

---

## 4. Setting the Budget for a New Year

Finance does this once a year, after the budget is agreed.

| Step | Who | What |
| --- | --- | --- |
| 1 | Finance | Agree the new year's numbers (outside this file, in any working sheets you like) |
| 2 | Finance | Open the **shared** file. Add rows for every site and every month of the new year, at the bottom of the table. Do not delete last year's rows (❓ unless the data owner says the template keeps one year only). |
| 3 | Finance | Paste **values only** (not formats or formulas) into the budget columns |
| 4 | Finance | Check: number of new rows = number of sites × 12. No blank site codes. No text in number columns. |
| 5 | Operations | Fill in `sellable_desks` for the new rows (see section 5) |
| 6 | Finance | Tell the data owner the new year is in. Next day, check one site's "budget" figure on the dashboard matches the file. |

💡 A budget that changes during the year: ❓ ask finance whether you replace the numbers (and keep the old version in version history) or keep the original budget and add a separate forecast. Do not mix the two in the same columns.

---

## 5. Changing Capacity When a Site Adds or Removes Desks

Capacity changes when a site is refitted, an office is split or joined, or desks are taken out for a meeting room.

```
   Site manager:  "From 1 March, Office 102 is split into two offices,
                   and we lose 2 desks."                   (made-up example)
         │
         ▼
   Operations (capacity owner):
     1. Change sellable_desks for that site, from that month onwards only
     2. Do NOT change past months (history must stay as it was)
     3. Write the reason in notes ("Office 102 split, -2 desks")
         │
         ▼
   Tell the data owner     AND     tell the Nexudus admin
   (dashboards)                    (offices and desks in Nexudus must match)
```

🛠 Why past months stay: September's desk occupancy at Soho was 6 ÷ 34 = 17.6%. If someone changed September to 30 desks later, September's number would quietly change to 20%, and last month's board pack would no longer match.

---

## 6. Version History

Files in a shared folder keep earlier versions. 📘 In SharePoint and OneDrive this is usually under the file's "Version history"; check the vendor's help centre for your tool.

-   Use it to see **who changed what, and when**.
-   Use it to **go back** if someone breaks the template. Tell the data owner when you do.
-   Because version history exists, you never need your own backup copy.

---

## 7. What Breaks When the Rules Are Broken

| Mistake | What happens |
| --- | --- |
| Column renamed or moved | The data load stops, or loads the wrong column. Dashboards show yesterday's numbers or blanks. |
| "Soho " with a space | That row matches no site and silently drops out. Soho's budget looks too low. |
| Two rows for the same site and month | The budget is counted twice. Soho's September budget becomes $23,000. |
| "$11,500" typed as text | Read as blank or rejected. "Revenue vs budget" goes missing. |
| A totals row inside the table | Counted as if it were a site. Totals double. |
| File moved or copied | The load reads the old file. Your changes never reach the dashboards. |

💡 A good data setup has checks that stop a bad file loading and warn the data owner. That protects the dashboards, but it means the numbers stop updating until someone fixes the file. Either way, the fix starts with you.

---

## 8. Checklist Before You Save

```
   EXCEL BUDGET / CAPACITY: CHECK BEFORE YOU CLOSE THE FILE
   [ ] I edited the shared file, not a copy
   [ ] Header row untouched (no renamed, moved, new or deleted columns)
   [ ] Every site code picked from the drop-down
   [ ] Exactly one row per site per month
   [ ] Every number is a number (no $, no %, no "TBC")
   [ ] No merged cells, no totals or blank rows inside the table
   [ ] Past months unchanged (unless finance asked for a correction)
   [ ] Reason written in notes for any change
   [ ] Data owner told (and Nexudus admin, for capacity changes)
```

---

## 9. Practice Tasks

Use a **copy** of `excel_capacity_budget_2026.csv` in a training folder, never the real shared file.

1.  What is Soho's total budget revenue for July to September? (Answer: 11,250 + 11,250 + 11,500 = $34,000.) And Reading's? (3,875 + 3,875 + 4,000 = $11,750.)
2.  Soho's budget occupancy is 0.85 of 34 sellable desks. How many desks is that? (About 29.) Soho's actual September occupancy was 6 of 34. What would you ask finance about this budget?
3.  Add the rows for October 2026 for both sites, following every rule. Use made-up numbers. Check you added exactly 2 rows.
4.  Made-up change: Reading takes 1 desk out from November. Which rows do you change, and which do you leave alone? Who do you tell?
5.  Break it on purpose (in your copy only): type "$11,500" as text in one cell, and add a "Total" row. Write down how each would hurt the dashboards.

---

## Quick check

**1. Who owns the budget numbers, and who owns sellable desks?**
_Finance owns the budget. Operations owns capacity (sellable desks)._

**2. You want a column for "budget meeting room revenue". Can you just add it?**
_No. Ask the data owner first; a new column can break the data load._

**3. A site loses 2 desks from March. Do you change January and February too?**
_No. Change March onwards only, write the reason in notes, and tell the data owner and the Nexudus admin._

**4. Why not keep your own copy of the file to work on?**
_Because the load reads only the shared file, and two copies means nobody knows which is true. Version history is your backup._

---

## What's Next?

Next, the guide everyone must take: Staff Training 08 — Joiner, Mover, Leaver: What to Do in Every System. 🚀

Back to Staff Training 01 — Start Here. Want more depth? Read Chapter 06 — Excel.

---

# Staff Training 08 — Joiner, Mover, Leaver: What to Do in Every System

> Source file: `staff-training/training-08-joiner-mover-leaver.html` · Staff Training — running the business in each system (for new staff)

Hi again! 🙏 This is **the most important guide in the training**, and it is for everyone: front desk, site managers, sales, billing and finance. Every member does three things in their life with us: they **join**, they sometimes **move** (bigger, smaller, another site, a new term), and one day they **leave**. Each of these touches four or five systems, and each step must happen in the right order, by the right person.

Get these flows right and the systems agree, members get in the door on day one, invoices are right, and the business reports tell the truth about who joined, who grew and who left.

⚠️ **Before you start.** This is **our standard way of working** (🛠). Screen names change, so check the vendor's help centre (📘) when a button has moved. Example members and prices come from **Mini Work.Life**, a **made-up** company (lab files `contracts.csv`, `members.csv`, `act_opportunities.csv`). Notice periods, deposits and how part-months are charged depend on your own contracts and setup (❓ ask your manager).

What we will cover in this guide:

-   The one rule behind all of this
-   Joiner: a new member company, and one more person in an existing company
-   Movers: upgrade, downgrade, transfer between sites, renewal
-   Leaver: a whole company leaving, and one person leaving a company that stays
-   Why it matters: the "wrong way" example
-   Printable checklists for each flow
-   Practice tasks and a quick check

---

## 1. The One Rule Behind All of This

🛠 **The company (the Nexudus "team") is the member.** A contract is just what they have right now. When what they have changes, we **end the old contract and start a new one on the same team**. We never cancel the member and create them again as a stranger.

The reports then read each contract end like this (from Chapter 07):

```
   A contract ENDS. Does the SAME team have another contract
   starting soon after (within about 30 days; the business sets the exact gap)?

     YES, same site, higher price  →  UPGRADE    (a member growing 🎉)
     YES, same site, lower price   →  DOWNGRADE  (smaller, but still here)
     YES, different site           →  TRANSFER   (moved, not lost)
     YES, same office, new term    →  RENEWAL    (stayed)
     NO                            →  CHURN      (they left: record the reason)
```

This only works if **you** keep the same team, put real dates in, and record notice and reasons. That is what every flow below does.

---

## 2. Joiner: A New Member Company

Lab example: **GreenRoot Foods**. The deal "GreenRoot - Office 201" was won on 10 Dec 2025 at $3,375 a month. The contract (K005) runs 1 Jan to 31 Dec 2026 for Office 201 at Reading, and 6 people joined on 1 Jan.

| # | Step | System | Who |
| --- | --- | --- | --- |
| 1 | Mark the deal **Closed Won**, with the won price, start date and site. Check the company and main contact are linked to the deal. | HubSpot | Sales |
| 2 | Send the signed agreement and details (people, start date, price, office) to the site team. ❓ Your company may use a form or a HubSpot task for this. | HubSpot / email | Sales |
| 3 | **Search first**, then create the **team** (the company) with the billing contact and billing email | Nexudus | Front desk / site manager |
| 4 | Create a **customer** for each person and add them to the team. Same email as in HubSpot. | Nexudus | Front desk |
| 5 | Create the **contract**: plan, office, site, start date, end date (or none if rolling), price. The price must match the won price in HubSpot. | Nexudus | Front desk / site manager |
| 6 | Take the **deposit** if your company asks for one (❓ how it is recorded) | Nexudus | Billing |
| 7 | Give **door access** to each person (automatic if Nexudus is connected; otherwise by hand). Test on day one. | ACT365 | Site manager (Guide 06) |
| 8 | Check the **first invoice**: right price, right site, part-month charged the way your setup says (❓) | Nexudus → NetSuite | Billing (Guide 03) |
| 9 | **Welcome**: tour, Wi-Fi, app login, house rules | Nexudus app, in person | Community / front desk |
| 10 | Check the office is in the **capacity** list (only if it is new) | Excel | Operations (Guide 07) |

**One more person in an existing company.** Made-up example: Nomad Analytics (Ravi's company, hot desk at Soho) takes on a colleague who also wants a hot desk.

| # | Step | System | Who |
| --- | --- | --- | --- |
| 1 | Search for the person. Create the customer and add them to the **existing** team. Never create a second "Nomad Analytics". | Nexudus | Front desk |
| 2 | If they need their own plan, add a contract **on the same team** (made up: Unlimited Coworking, $400). If they share an office the company already pays for, no new contract; just check the office has room. | Nexudus | Front desk |
| 3 | Add the contact to the company in HubSpot. If it is extra sales (a new plan), log a deal too (❓ your sales rules). | HubSpot | Sales / front desk |
| 4 | Give door access | ACT365 | Site manager |

💡 Check capacity before adding people to an office. Pixel Chai's Office 101 holds 4 people, and Pixel Chai already has 4. A fifth person means a bigger office (an upgrade), not a squeeze.

---

## 3. Mover: Upgrade

Lab example: **Priya at Pixel Chai**. Priya had Unlimited Coworking at Soho (K001, $400, from 1 Oct 2025). The upgrade deal "Pixel Chai - Office 101" was won on 14 Mar 2026: $3,250 list, won at $3,000 (a 7.7% discount for a 12-month term).

| # | Step | System | Who |
| --- | --- | --- | --- |
| 1 | Log the upgrade as a **new deal on the same company** and mark it Closed Won at $3,000. Do not create a new company. | HubSpot | Sales |
| 2 | **End** the old contract K001 on **31 Mar 2026**, with the end reason "upgrade" if your setup has that field (❓). Do **not** cancel the customer or the team. | Nexudus | Front desk / site manager |
| 3 | **Start** the new contract K002 on **1 Apr 2026**: Private Office, Office 101, $3,000 (list $3,250), end 31 Mar 2027, on the **same team** | Nexudus | Front desk / site manager |
| 4 | Add the 3 new people (Arjun, Leah, Tom, all joined 1 Apr) to the same team | Nexudus | Front desk |
| 5 | Door access: Priya moves from "Soho Coworking" to "Soho Office 101" on 1 Apr; the 3 new people go into "Soho Office 101". Same card for Priya. | ACT365 | Site manager |
| 6 | Check the April invoice shows the office, not the hot desk. Here the change is on a month boundary, so no part-month. A mid-month change would need a part-month charge or credit (❓ how your setup does it). | Nexudus → NetSuite | Billing |

---

## 4. Mover: Downgrade

No downgrade in the lab. Made-up example: a company moves from a 4-person office to two hot desks at the same site.

| # | Step | System | Who |
| --- | --- | --- | --- |
| 1 | Log the change on the same company (❓ as a deal or a note, by your sales rules). Record **why** (for example "team got smaller"). | HubSpot | Sales / account manager |
| 2 | Check the notice terms of the old contract before agreeing the date (❓) | Nexudus / signed agreement | Site manager |
| 3 | End the office contract on its last day; start the new hot desk contracts the next day, **same team** | Nexudus | Front desk |
| 4 | Move people from the office group to the coworking group; remove anyone who is leaving | ACT365 | Site manager |
| 5 | Check the next invoice, and any deposit change (❓) | Nexudus → NetSuite | Billing |
| 6 | Tell sales the office is free to sell | HubSpot | Site manager |

---

## 5. Mover: Transfer Between Sites

Lab example: **Fatima at Kite & Key**. Fatima had Flex 10 Days at Reading (K006, $225, 1 Feb to 31 Jul 2026), then moved to Unlimited Coworking at Soho (K007, $400, from 1 Aug, rolling).

| # | Step | System | Who |
| --- | --- | --- | --- |
| 1 | Agree the move and the date. Both site managers know. | Email / in person | Old and new site managers |
| 2 | End K006 at Reading on **31 Jul** (end reason "transfer" if you have the field) | Nexudus | Old site |
| 3 | Start K007 at **Soho** on **1 Aug**, same team, same customer. Pick the right site: this decides where the income lands. | Nexudus | New site |
| 4 | Remove Reading access; add "Soho Coworking". Same card. | ACT365 | Site managers |
| 5 | Update the company's site in HubSpot if you track it there (❓) | HubSpot | Sales |
| 6 | Check the August invoice is at Soho, at $400 | Nexudus → NetSuite | Billing |

💡 For the business, nobody left. For Reading it is a loss, and for Soho a gain. The reports can show both, but only if the team stays the same.

---

## 6. Mover: Renewal

Lab example: **GreenRoot**. Contract K005 (Office 201, $3,375) ends **31 Dec 2026**. The renewal deal "GreenRoot - Renewal 2027" was opened on 15 Sep 2026, and a proposal went out at $3,500. Stage: Proposal Sent.

| # | Step | System | Who |
| --- | --- | --- | --- |
| 1 | Open a **renewal deal** in the Renewals pipeline, 🛠 **120 days before the term ends** (made up; the same rule as Guide 04), so it starts well before the notice window. GreenRoot's was opened on 15 Sep, only 107 days before 31 Dec, so later than our standard. | HubSpot | Account manager / sales |
| 2 | Talk to the member; send the proposal; move the deal through its stages | HubSpot | Account manager |
| 3a | If they sign: deal Closed Won. Then in Nexudus, **either** start a new contract the day after the old one ends (same team, same office, new price and term) **or** extend the existing contract. ❓ Ask your manager which one your company uses, and always do it the same way. | HubSpot, Nexudus | Sales, then front desk |
| 3b | If they say no: deal Closed Lost with the lost reason, and follow the Leaver flow (section 7) | HubSpot | Sales |
| 4 | Check the first invoice at the new price | Nexudus → NetSuite | Billing |

💡 Door access does not change on a renewal, unless the office changes. But keep an eye out: GreenRoot's door use fell from 73% to about 0 across September. If the renewal is open and the team has stopped coming in, tell the account manager this week.

---

## 7. Leaver: A Whole Company Leaves

Lab example: **Brightline Legal**. Office 103 at Soho (K003, $1,750, 2 people). The renewal deal opened 1 Mar 2026. Brightline gave notice on **30 Apr 2026**, reason "moving to hybrid". The contract ended on **30 Jun 2026**.

| When | Step | System | Who |
| --- | --- | --- | --- |
| Notice day (30 Apr) | Record the **notice date** and the **reason** on the contract (❓ which fields your setup has). Set the contract end date (30 Jun). **Do not delete or cancel anything.** | Nexudus | Site manager |
| Notice day | Mark the renewal deal **Closed Lost** with the lost reason from the drop-down (here: hybrid/remote), plus a short note | HubSpot | Account manager |
| Notice day | Tell sales the office will be free from 1 Jul, so they can start selling it | HubSpot | Site manager |
| Notice period | Keep billing as normal. Agree the move-out date, key and card return, and the office check. | Nexudus | Billing, site manager |
| Last invoice | Check the last invoice covers up to the end date only, and nothing is billed after it. Settle any extras (meeting rooms) and any unpaid invoices. | Nexudus → NetSuite | Billing |
| Deposit | Return the deposit, or use it against unpaid amounts, by your rules (❓). The lab has no deposits. | Nexudus / NetSuite | Billing, finance |
| Last day (30 Jun) | Contract ends on its own on the end date. Check it shows as ended, not deleted. | Nexudus | Site manager |
| Last day | **Remove door access** for both people; collect cards. (In the lab both Brightline cards show "removed", and an old card was denied on 2 Sep.) | ACT365 | Site manager |
| After | Make sure the company is shown as a former customer, not a current one (❓ your HubSpot setup). Lifecycle stage does not move backwards by itself. | HubSpot | Sales |
| After | Offboarding: remove Wi-Fi and app access, empty the office, forward post (❓ how long) | Nexudus, in person | Front desk |

**One person leaves a company that stays.** Made-up example: one of GreenRoot's 6 people leaves GreenRoot.

| # | Step | System | Who |
| --- | --- | --- | --- |
| 1 | The company's main contact tells us. Note the date. | Nexudus (note) | Front desk |
| 2 | Remove the person from the team, or mark them as left (❓ your setup). Do not touch the company's office contract. | Nexudus | Front desk |
| 3 | If the person had their own plan, end that contract (end reason "left") | Nexudus | Front desk |
| 4 | Remove door access for that person only | ACT365 | Site manager |
| 5 | Update the contact in HubSpot (no longer at the company) | HubSpot | Sales |

---

## 8. Why It Matters: The "Wrong Way" Example

Imagine a busy front desk takes a shortcut: for Priya's upgrade and Fatima's transfer, they **cancel** the old member and **create a brand new customer**. Here is what the 2026 reports would say:

| 2026 report | Wrong way (cancel and create new) | Right way (same team) |
| --- | --- | --- |
| Companies that left | 3 (Pixel Chai, Brightline, Kite & Key) | **1** (Brightline) |
| Monthly income lost to leavers | $2,375 (K001 + K003 + K006) | **$1,750** (Brightline only) |
| New monthly income from new members | $7,000 (K002 + K005 + K006 + K007) | **$3,600** (GreenRoot + Kite & Key's first plan) |
| Priya's history | Split across two "people"; looks like a leaver and a stranger | One member who grew from $400 to $3,000 |
| Kite & Key | Reading "lost a customer", Soho "won one" | One member who moved site |

The wrong way makes the business look like it loses members three times faster than it does, and hides its best news (a member growing). Leaders could make real decisions on fake numbers. Five extra minutes doing it the right way prevents all of it.

---

## 9. Printable Checklists

```
JOINER: NEW COMPANY                          Who
[ ] HubSpot deal Closed Won, price + start   Sales
[ ] Details handed to the site team          Sales
[ ] Searched first; team created in Nexudus  Front desk
[ ] Each person added as customer (same email) Front desk
[ ] Contract: plan, office, SITE, dates, price Front desk / site mgr
[ ] Price matches the won deal               Front desk
[ ] Deposit taken (if used)                  Billing
[ ] Door access given and tested             Site manager
[ ] First invoice checked                    Billing
[ ] Welcome done                             Community
```

```
MOVER: UPGRADE / DOWNGRADE / TRANSFER        Who
[ ] New deal (or note) on the SAME company   Sales
[ ] Old contract ENDED (not cancelled), reason Front desk / site mgr
[ ] New contract starts next day, SAME team  Front desk / site mgr
[ ] Right site on the new contract           Front desk
[ ] Door group changed on start day, same card Site manager
[ ] Next invoice checked (part-month?)       Billing
[ ] Freed office told to sales               Site manager
```

```
MOVER: RENEWAL                               Who
[ ] Renewal deal opened 120 days before end  Account manager
[ ] Won: new term or extension (our one way) Sales, front desk
[ ] Lost: Closed Lost + reason → Leaver flow  Sales
[ ] Invoice at new price checked             Billing
```

```
LEAVER: WHOLE COMPANY                        Who
[ ] Notice date + reason recorded            Site manager
[ ] End date set; NOTHING deleted            Site manager
[ ] HubSpot deal Closed Lost + lost reason   Account manager
[ ] Sales told the space is coming free      Site manager
[ ] Last invoice up to end date only         Billing
[ ] Deposit returned / applied               Billing, finance
[ ] Door access removed on last day; cards back Site manager
[ ] Shown as former customer in HubSpot      Sales
[ ] Wi-Fi, app, post, office check           Front desk

LEAVER: ONE PERSON, COMPANY STAYS
[ ] Person removed / marked left in Nexudus  Front desk
[ ] Own contract ended (if any)              Front desk
[ ] Door access removed for that person only Site manager
[ ] HubSpot contact updated                  Sales
```

---

## 10. Practice Tasks

Do these in a training area only (❓ ask your manager), never on real members. Use `contracts.csv` and `act_opportunities.csv` to check your answers.

1.  Using the rule in section 1, label each ended contract in `contracts.csv` (K001, K003, K006) as upgrade, downgrade, transfer, renewal or churn. (Answers: upgrade, churn, transfer.)
2.  In the training area, do Priya's upgrade end to end: end the hot desk on 31 Mar, start Office 101 on 1 Apr on the same team, and write down the door group change.
3.  Do Fatima's transfer. Which site should the August invoice show?
4.  GreenRoot signs the renewal at $3,500 from 1 Jan 2027 (made up). List every step, system and person, in order.
5.  Brightline gives notice. Write the five things you do on notice day and on the last day.
6.  A colleague says "it's quicker to cancel and re-create". Explain in two sentences why not, using numbers from section 8.

---

## Quick check

**1. A member moves from a hot desk to an office at the same site. What do you do in Nexudus?**
_End the old contract on its last day and start the new one the next day, on the same team. Never cancel the member and re-create them._

**2. Brightline gives notice. What two things must you record?**
_The notice date and the reason. And do not delete anything._

**3. Kite & Key moves from Reading to Soho. Is that a leaver?**
_No, it is a transfer. Same team, new contract at the new site, door access changed, invoice at the new site._

**4. When should a renewal deal be opened?**
_120 days before the term ends (our made-up standard), well before the notice window. GreenRoot's was opened 15 Sep for a 31 Dec end: 107 days, so later than the standard._

**5. One person leaves a company that stays. Whose door access do you remove?**
_That one person's only. The company's contract and other people stay as they are._

---

## What's Next?

You have finished the core staff training. 🎉 Go back to Staff Training 01 — Start Here to pick the guides for your job. 🚀

Want more depth? Read Chapter 07 — Nexudus (the upgrade, transfer and churn rule) and Chapter 29 — Member Retention Reporting.

---

# Draft Answers to the Client Questions (Q&A)

> Source file: `Q&A.md`

Please respond to the following. Where something depends on decisions we have not yet made, tell us what you would need from us to firm it up.

> **Draft answers** taken from the series (mainly Chapter 33, with detail from Chapters 23–36). All costs are **estimates**. The $937.50 day rate is **made up**. The Soho example uses lab numbers, not real Work.Life figures.

---

### 1. Feasibility and approach

**Can you build the Phase 1 capability described above on our existing BigQuery warehouse? What architecture and approach would you recommend, in plain terms?**

**Yes. We build it on your existing BigQuery warehouse. We don't replace anything you already run.**

In simple terms:

1. **BigQuery** stores your business data, as it does today.
2. **A safe copy (`ai_safe`)** holds only approved tables. Personal data (individual members, door events, CRM contacts) is never copied. The AI can read this copy and nothing else.
3. **dbt** holds one agreed formula for each KPI, such as revenue, occupancy and churn. Finance and Operations agree them. The AI never makes up its own.
4. **Your board pack** gives business context: targets, and why each KPI matters.
5. **The AI assistant** lets leaders ask questions in plain English, after signing in with their Work.Life account. Each answer shows the number, the definition used and how fresh the data is. If it can't answer reliably, it says so.
6. **A weekly digest and alerts** tell leaders about important changes without being asked.

**Example:** a leader asks, "What was Soho's revenue in September?" The assistant looks in the safe copy, uses the agreed revenue definition, and replies with the figure and the definition it used.

```
   Nexudus · NetSuite · ACT · Excel · HubSpot
            │  (unchanged: Fivetran / Python, run by your data partner)
            ▼
   BigQuery: raw ──► dbt staging ──► dbt marts ──► Tableau / future BI tool
                                        │
                                        │ scheduled copy of APPROVED tables only
                                        ▼
                              ai_safe  (safe copy)
                                        │  read-only
                                        ▼
            KPI definitions ──►  AI assistant  ◄── business context (board pack)
                                        │
                     Work.Life sign-in ─┤──► chat answers   ──► weekly digest / alerts
```

**The key point:** we add a safe AI layer on top of your existing data system. We don't replace it.

**To firm this up, we need:** read access to BigQuery and the dbt project, so we can confirm the tables and KPIs are there.

---

### 2. Timeline

**What could realistically be delivered by a 3 month mark and a 6 month mark, and what would need to be true on our side for that to happen?**

**By month 3 (end of December 2026):** the assistant is live for the leadership team, tested on the board-pack KPIs.
**By month 6 (end of March 2027):** it answers more questions, sends alerts, and your team can run it without us.

| By month 3 (end of December 2026) | By month 6 (end of March 2027) |
|---|---|
| Safe copy built, and the list of allowed data signed off | Answers "why" questions too (by site, product, company) |
| Board-pack KPIs defined once and agreed with Finance | Alerts when a number crosses an agreed limit; early warning notes |
| Assistant live for leaders, with Work.Life sign-in | Accuracy test re-run every month |
| Accuracy test passed (50 test questions) | Full handover: your team runs it from the documents |
| Weekly summary for leaders | Check if the wider team is ready; a Phase 2 plan |
| Documents written as we go | |

**What we need from you, and when:**

- **Week 1:** read access to BigQuery and the dbt project.
- **Week 2:** a recent board pack and your KPI definitions.
- **November:** a named Finance person who can agree definitions and check test answers.
- **Early on:** details of your sign-in system.
- **Early December:** 2–3 leaders to try it first.

**Honest note:** if definitions or access are late, the launch moves too. We'd rather go live in January with trusted numbers than in December with untested ones.

---

### 3. What you need from us

**Data access, preparation, decisions or resources you would require from Work.Life.**

**About half a day a week from your side, on average.** Most of it falls in two busy periods:

- **Months 1–2:** agreeing the KPI definitions.
- **Months 2–3:** checking the test answers.

The most important person is a **Finance owner** who can agree the money definitions.

| When | What we need | From whom | Why |
|---|---|---|---|
| Before we start | Names and roles of the leadership team; a budget range | Ops & IT | The number of users drives cost and access |
| Week 1 | Read access to BigQuery, the dbt project and each source; which region and project | Ops & IT + data partner | We can't check anything without it |
| Week 1 | What "ACT" is, and what data comes from it today | Ops & IT | Door data and CRM data have different privacy rules |
| Week 2 | A recent board pack and its KPI definitions (occupancy, churn, revenue, contribution) | Finance + leadership | It is the business context |
| Week 2 | Your current "safe extract" rule; test, staff and internal accounts to leave out | Ops & IT | The list of allowed data follows your existing rule |
| Week 3 | Your sign-in system (Google Workspace, Microsoft 365, other); where the digest goes (email, Slack, Teams) | Ops & IT | Needed to design sign-in and the weekly digest |
| Week 3 | How sites are tagged in NetSuite; how far back NetSuite history goes, and where any older finance history is | Finance | Needed for every site profit and trend question |
| Week 4 | HubSpot sync status: which fields, which direction, who owns what | Sales & membership | Which system holds the truth while HubSpot takes over |
| Week 4 | Agreement on the accuracy pass mark | Leadership | The pass mark must be agreed before testing |
| Weeks 6–10 | Correct answers for the test questions, from closed months; the month-end close calendar | Finance + reporting owner | This is the accuracy test itself |
| Week 10 | 2–3 leaders for a two-week trial | Leadership | Real questions before launch |
| Any time | Status of the BI tool review; any existing AI usage policy | Ops & IT | So the new BI tool and the AI share one set of definitions |

---

### 4. Cost

**One off build cost, plus indicative ongoing annual running cost at two levels: leadership team only, and wider team access. How would you manage and cap usage or token costs?**

**Build (one-off): about $78,750 (estimate).** $60,000 for the 3-month launch, and $18,750 for months 4–6 and the handover.

**Running cost per year: about $27,500 for the leadership team, or about $53,125 for the wider team (estimates).** Both are far below the "six figure operation" you ruled out.

| Running cost per year (estimate) | Leadership only (10 users, assumed) | Wider team (70 users, assumed) |
|---|---|---|
| AI usage (tokens, including test runs) | $3,125 | $4,375 |
| BigQuery (queries and storage of the safe copy) | $625 | $1,250 |
| Hosting, scheduling, logs | $1,250 | $2,500 |
| **Technology total** | **$5,000** | **$8,125** |
| Support (2 or 4 days a month, made-up day rate) | $22,500 | $45,000 |
| **Total per year** | **~$27,500** | **~$53,125** |

**Our assumptions** (to agree with you):

- A **made-up** day rate of $937.50.
- Leaders: 10 users × 8 questions a working day. Wider team: 70 users × 3 questions a working day. 21 working days a month.
- About $0.0375 per question, using example AI prices. Test runs are the biggest AI cost.
- BigQuery stays inside its free monthly allowance. **Check current pricing** before relying on any figure.
- Your current pipeline and BI tool costs don't change, and aren't included.
- Wider team access also needs the role-based access work from Phase 2, which we haven't priced, as you asked.

**How we keep costs under control:**

- A hard monthly limit on AI spend. The service pauses instead of overspending.
- A daily question limit per user.
- A limit on how many steps the assistant can take per question.
- A limit on how much data one BigQuery query can read.
- Saved answers for repeated questions (the same KPI asked twice in a day costs once).
- A monthly cost report.

**The key point:** the technology is cheap. The real cost is people's time, so we keep support small and predictable.

**To firm this up, we need:** the real number of users at each level, and a budget range.

---

### 5. Security

**How would you secure the environment? Access control, data isolation, and anything you would recommend we never connect. Any recommendations for our internal AI usage policy are welcome.**

**Only Work.Life accounts can get in. The AI can only read the safe copy. Everything runs inside your own Google Cloud project.**

- **Who can get in:** people sign in with their existing Work.Life account. Only a named leadership group is allowed. No shared logins. Operations & IT Systems checks the list every month.
- **What the AI can read:** only the safe copy (`ai_safe`), and only to read. It can't see raw tables, source systems or any other data, and it can't change anything.
- **Safe data only:** a written list of allowed tables and columns, following the same principle as your current reporting extracts, and signed off by you. No names, emails, phone numbers or card numbers. No door data in Phase 1. If door data is added later (for example to predict churn in Phase 2), it will only be weekly totals per company, for groups of 5 or more people, never single door taps.
- **Never connect:** the HR system or any staff data; raw personal data; live source systems; payment or bank details; email inboxes and shared drives. Staff costs appear only as finance totals.
- **The AI model:** runs through your Google Cloud project on business terms, where your data is not used to train the model (we'd confirm these terms with you). Every question, query and answer is logged, so you can check what was asked and what data was used.

**Ideas for your AI usage policy:**

- Use only approved tools for company data.
- Never paste member or staff personal data into public AI tools.
- Treat an AI answer as a draft until it shows its sources.
- Name an owner for each approved tool.
- Review the policy every six months.

**To firm this up, we need:** your sign-in system (Google Workspace, Microsoft 365 or other), your current "safe extract" rule, and what "ACT" is.

---

### 6. Accuracy

**How do you handle accuracy and the risk of confidently wrong answers? What testing and validation would you recommend before the leadership team trusts it, and how would the accuracy against actuals check work in practice?**

**We agree with you: accuracy decides whether it launches. Nobody relies on the assistant until it passes a test against your real results, agreed in advance with Finance and Operations.**

1. **Prevent mistakes:** the AI never does its own maths. Every number comes from a query that uses an agreed KPI definition. Each answer shows the definition, the period and how fresh the data is (for example "September is not yet closed in NetSuite").
2. **Say "I can't answer that":** if a question can't be answered reliably (no agreed definition, the month isn't closed, the data isn't in the safe copy), the assistant says so instead of guessing. An honest "I can't answer that reliably" is a pass. A confident wrong number is a fail.
3. **Test:** together we write **50 test questions** ("golden questions"): 30 board-pack KPI questions (tier 1), 15 "why" questions (tier 2) and 5 questions it must refuse (tier 3). Finance and Operations write down the correct answers from closed months in NetSuite and the board pack.
4. **Pass mark:** our suggestion, to agree with your leaders:
   - Tier 1: **all 30 correct** for the last 3 closed months.
   - Tier 2: at least 90% correct (judged by your reviewers). Every miss must be a refusal or a warning note, never a wrong number.
   - Tier 3: refused every time.
   - **Zero confidently wrong answers.**
   - The same question asked three times gives the same number.
5. **Keep checking:** after launch, the test questions run again after every change, and every month after Finance closes the books. If a test fails, the change is not released.

**The monthly check, in practice:** when Finance closes the month, the assistant answers the tier 1 questions for that month and we compare them with the board pack. Any difference is checked before the board pack goes out.

**To firm this up, we need:** your agreement on the pass mark, a Finance person to write the correct answers, and your month-end close calendar.

---

### 7. Resilience

**How does your solution stay source agnostic if we change a system feeding the warehouse?**

**The AI never reads a source system directly. It reads business tables (sites, companies, contracts by month, bookings, finance lines) and KPI definitions. If a source system changes, only the dbt models that read that source change. The assistant, its definitions and its tests stay the same.**

**Your example, HubSpot:**

1. As HubSpot becomes the main member system, the dbt models switch member details from Nexudus to HubSpot.
2. A matching table (`member_xref`) keeps one fixed ID for each member and company across both systems.
3. The tables the AI reads (`dim_company`, `fct_contract_month`) keep the same columns and meaning.
4. The test questions prove it: if they pass before and after the switch, the change is safe.

No AI instruction, KPI definition or test mentions "Nexudus" or "HubSpot" by name.

**To firm this up, we need:** the HubSpot sync status (which fields, which direction, who owns what) and a rough date for the switch.

---

### 8. Documentation and handover

**How is the build documented and handed over so it is not dependent on one person?**

**We write the documents while we build, and keep them in your own repository. The handover is proven, not just promised: before month 6 ends, your team runs the service for two weeks using only the documents, while we just watch.**

The documents cover:

- how it's built, and how the data flows
- the list of allowed data
- every KPI definition, and who owns it
- the test questions, and how to run them
- step-by-step guides for common tasks: add a user, add a KPI, fix a failed data refresh, fix a failed accuracy test, handle a cost alert
- the cost model
- a decision log: why things are built the way they are

**To firm this up, we need:** where you'd like the documents kept, and who on your side will run the service.

---

### 9. Support and resourcing

**What does ongoing support look like, and what capability, if any, would we need to hold in house?**

**You don't need to hire anyone. We provide a small monthly support agreement, and two people you already have take on light roles.**

| Us (support agreement) | You (in house) |
|---|---|
| Monitoring, data refresh and cost checks | **KPI owner** (whoever owns reporting today; we'd need to know who that is): keeps definitions and test answers up to date, about half a day a week |
| Monthly accuracy test after the month-end close | **Service owner** (Operations & IT Systems): access checks, budget, approvals, about half a day a month |
| Adding or changing KPIs and context | |
| Updates to the AI model and platform | |
| 2 days a month (leadership) or 4 (wider team) | |

Your current data partner keeps running the pipeline up to the marts. The split is clear: they own everything from the source systems to the marts; the AI layer only reads the safe copy.

**To firm this up, we need:** who owns reporting today, and how your data partner will be involved.

---

### 10. Scalability

**How would Phase 1 extend to the Phase 2 use cases in section 4 without a significant rebuild?**

**Each Phase 2 idea reuses the same safe copy, the same KPI definitions and the same accuracy tests. Nothing is rebuilt; we only add on top.** As you asked, none of this is priced.

| Phase 2 use case | What Phase 1 already gives | What gets added later |
|---|---|---|
| Real-time member & retention reporting | Agreed member and churn definitions; scheduled summaries | More frequent data refresh; retention views in the BI tool |
| Churn & renewal prediction + context packs | Contract history by month; agreed churn and transfer definitions; tests | A table of contract changes; weekly attendance per company and renewal-deal tables (no individual contacts, groups of 5 or more only); a risk score; a "renewal pack" template |
| Forecasting (resident revenue, net member movements, seasonality, meeting rooms) | Clean monthly history per site in `fct_site_month_kpis` | Forecast models; the assistant explains their results |
| Role-based access & agents | Sign-in, logs, one safe copy | Roles that limit what each site or team sees; approved automations |

---

# Lab Data (Mini Work.Life CSV files)

> Source folder: `lab-data/` · All names, companies and figures are made up. All money is in US dollars (converted from the original pounds at an assumed rate of 1 pound = 1.25 dollars, made up).

Every chapter example uses these files. Each file is shown in full below as plain CSV text.

## act365_cardholders.csv

ACT365 door-access cardholders and their access groups. (15 rows)

Columns: cardholder_id,first_name,last_name,card_number,group,nexudus_customer_email,status

```csv
cardholder_id,first_name,last_name,card_number,group,nexudus_customer_email,status
CH-1001,Priya,Sharma,04A1B2C301,Soho Office 101,priya@pixelchai.co.uk,active
CH-1002,Arjun,Mehta,04A1B2C302,Soho Office 101,arjun@pixelchai.co.uk,active
CH-1003,Leah,Brooks,04A1B2C303,Soho Office 101,leah@pixelchai.co.uk,active
CH-1004,Tom,Okafor,04A1B2C304,Soho Office 101,tom@pixelchai.co.uk,active
CH-1005,Daniel,Hughes,04A1B2C305,,daniel@brightlinelegal.co.uk,removed
CH-1006,Sara,Kim,04A1B2C306,,sara@brightlinelegal.co.uk,removed
CH-1007,Ravi,Patel,04A1B2C307,Soho Coworking,ravi@nomadanalytics.io,active
CH-1014,Fatima,Ali,04A1B2C314,Soho Coworking,fatima@kiteandkey.co.uk,active
CH-2008,Emma,Clarke,04B1C2D308,Reading Office 201,emma@greenrootfoods.com,active
CH-2009,Olu,Adeyemi,04B1C2D309,Reading Office 201,olu@greenrootfoods.com,active
CH-2010,Jack,Turner,04B1C2D310,Reading Office 201,jack@greenrootfoods.com,active
CH-2011,Mei,Lin,04B1C2D311,Reading Office 201,mei@greenrootfoods.com,active
CH-2012,Hannah,Wood,04B1C2D312,Reading Office 201,hannah@greenrootfoods.com,active
CH-2013,Sam,Ellis,04B1C2D313,Reading Office 201,sam@greenrootfoods.com,active
CH-9001,Cleaner,SparkleClean,04F0F0F001,All Doors (Contractor),,active
```

## act365_door_events_sep2026.csv

ACT365 door events for September 2026. Door data is personal data: only use it at company level. (276 rows)

Columns: event_id,event_time_utc,site,door,cardholder_id,cardholder_name,event_type

```csv
event_id,event_time_utc,site,door,cardholder_id,cardholder_name,event_type
EV00005,2026-09-01T07:02:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00006,2026-09-01T07:04:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00009,2026-09-01T07:06:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00010,2026-09-01T07:08:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00011,2026-09-01T07:50:00Z,RDG,Reading Main Entrance,CH-2012,Hannah Wood,Access Granted
EV00012,2026-09-01T07:52:30Z,RDG,Reading Office 201 Door,CH-2012,Hannah Wood,Access Granted
EV00007,2026-09-01T07:59:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00008,2026-09-01T07:59:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00001,2026-09-01T08:54:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00002,2026-09-01T08:56:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00003,2026-09-01T09:41:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00004,2026-09-01T09:43:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00013,2026-09-01T09:57:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00014,2026-09-01T09:59:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00017,2026-09-02T07:16:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00018,2026-09-02T07:18:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00015,2026-09-02T07:20:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00016,2026-09-02T07:22:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00021,2026-09-02T07:34:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00022,2026-09-02T07:36:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00029,2026-09-02T08:01:00Z,RDG,Reading Main Entrance,CH-2012,Hannah Wood,Access Granted
EV00030,2026-09-02T08:03:30Z,RDG,Reading Office 201 Door,CH-2012,Hannah Wood,Access Granted
EV00276,2026-09-02T08:14:00Z,SOHO,Soho Main Entrance,CH-1005,Daniel Hughes,Access Denied - Card Not In Group
EV00031,2026-09-02T09:14:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00019,2026-09-02T09:16:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00032,2026-09-02T09:16:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00027,2026-09-02T09:17:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00020,2026-09-02T09:18:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00028,2026-09-02T09:19:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00025,2026-09-02T09:25:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00026,2026-09-02T09:27:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00023,2026-09-02T09:48:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00024,2026-09-02T09:50:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00042,2026-09-03T07:01:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00037,2026-09-03T07:16:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00038,2026-09-03T07:18:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00047,2026-09-03T08:01:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00048,2026-09-03T08:03:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00045,2026-09-03T08:21:00Z,RDG,Reading Main Entrance,CH-2010,Jack Turner,Access Granted
EV00046,2026-09-03T08:23:30Z,RDG,Reading Office 201 Door,CH-2010,Jack Turner,Access Granted
EV00043,2026-09-03T08:32:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00044,2026-09-03T08:34:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00033,2026-09-03T08:43:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00034,2026-09-03T08:45:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00049,2026-09-03T09:10:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00050,2026-09-03T09:12:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00041,2026-09-03T09:13:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00035,2026-09-03T09:36:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00036,2026-09-03T09:38:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00039,2026-09-03T09:58:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00040,2026-09-03T09:59:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00055,2026-09-04T07:19:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00056,2026-09-04T07:21:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00066,2026-09-04T07:27:00Z,RDG,Reading Main Entrance,CH-2012,Hannah Wood,Access Granted
EV00067,2026-09-04T07:29:30Z,RDG,Reading Office 201 Door,CH-2012,Hannah Wood,Access Granted
EV00059,2026-09-04T07:57:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00057,2026-09-04T07:59:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00058,2026-09-04T07:59:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00060,2026-09-04T08:07:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00061,2026-09-04T08:09:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00053,2026-09-04T08:25:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00054,2026-09-04T08:27:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00051,2026-09-04T08:45:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00052,2026-09-04T08:47:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00068,2026-09-04T09:20:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00069,2026-09-04T09:22:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00064,2026-09-04T09:38:00Z,RDG,Reading Main Entrance,CH-2010,Jack Turner,Access Granted
EV00062,2026-09-04T09:40:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00065,2026-09-04T09:40:30Z,RDG,Reading Office 201 Door,CH-2010,Jack Turner,Access Granted
EV00063,2026-09-04T09:42:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00078,2026-09-07T07:05:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00079,2026-09-07T07:07:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00070,2026-09-07T08:04:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00071,2026-09-07T08:06:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00072,2026-09-07T08:26:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00073,2026-09-07T08:28:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00076,2026-09-07T08:30:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00077,2026-09-07T08:32:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00082,2026-09-07T09:17:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00083,2026-09-07T09:19:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00080,2026-09-07T09:38:00Z,RDG,Reading Main Entrance,CH-2010,Jack Turner,Access Granted
EV00081,2026-09-07T09:40:30Z,RDG,Reading Office 201 Door,CH-2010,Jack Turner,Access Granted
EV00074,2026-09-07T09:56:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00075,2026-09-07T09:58:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00090,2026-09-08T07:03:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00091,2026-09-08T07:05:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00088,2026-09-08T07:14:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00084,2026-09-08T07:32:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00085,2026-09-08T07:34:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00092,2026-09-08T08:02:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00093,2026-09-08T08:04:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00086,2026-09-08T08:14:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00089,2026-09-08T08:14:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00087,2026-09-08T08:16:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00094,2026-09-08T09:04:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00095,2026-09-08T09:06:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00096,2026-09-08T09:19:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00097,2026-09-08T09:21:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00104,2026-09-09T07:04:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00102,2026-09-09T07:36:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00103,2026-09-09T07:38:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00107,2026-09-09T08:24:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00098,2026-09-09T08:25:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00108,2026-09-09T08:26:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00099,2026-09-09T08:27:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00105,2026-09-09T08:34:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00106,2026-09-09T08:36:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00100,2026-09-09T09:40:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00101,2026-09-09T09:42:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00120,2026-09-10T07:00:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00121,2026-09-10T07:02:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00115,2026-09-10T07:09:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00117,2026-09-10T07:11:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00116,2026-09-10T07:11:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00118,2026-09-10T07:41:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00119,2026-09-10T07:43:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00113,2026-09-10T07:49:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00114,2026-09-10T07:51:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00128,2026-09-10T08:00:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00129,2026-09-10T08:02:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00109,2026-09-10T08:40:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00124,2026-09-10T08:41:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00110,2026-09-10T08:42:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00125,2026-09-10T08:43:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00126,2026-09-10T08:49:00Z,RDG,Reading Main Entrance,CH-2012,Hannah Wood,Access Granted
EV00127,2026-09-10T08:51:30Z,RDG,Reading Office 201 Door,CH-2012,Hannah Wood,Access Granted
EV00111,2026-09-10T09:40:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00112,2026-09-10T09:42:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00122,2026-09-10T09:44:00Z,RDG,Reading Main Entrance,CH-2010,Jack Turner,Access Granted
EV00123,2026-09-10T09:46:30Z,RDG,Reading Office 201 Door,CH-2010,Jack Turner,Access Granted
EV00150,2026-09-11T07:15:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00151,2026-09-11T07:17:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00130,2026-09-11T07:21:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00131,2026-09-11T07:23:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00146,2026-09-11T07:31:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00147,2026-09-11T07:33:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00132,2026-09-11T07:44:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00133,2026-09-11T07:46:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00140,2026-09-11T07:58:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00141,2026-09-11T07:59:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00134,2026-09-11T08:05:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00135,2026-09-11T08:07:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00148,2026-09-11T08:11:00Z,RDG,Reading Main Entrance,CH-2012,Hannah Wood,Access Granted
EV00149,2026-09-11T08:13:30Z,RDG,Reading Office 201 Door,CH-2012,Hannah Wood,Access Granted
EV00136,2026-09-11T08:43:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00137,2026-09-11T08:45:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00138,2026-09-11T08:51:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00139,2026-09-11T09:07:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00142,2026-09-11T09:18:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00143,2026-09-11T09:20:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00144,2026-09-11T09:57:00Z,RDG,Reading Main Entrance,CH-2010,Jack Turner,Access Granted
EV00145,2026-09-11T09:59:30Z,RDG,Reading Office 201 Door,CH-2010,Jack Turner,Access Granted
EV00160,2026-09-14T07:54:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00161,2026-09-14T07:56:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00154,2026-09-14T08:06:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00155,2026-09-14T08:08:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00152,2026-09-14T08:14:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00153,2026-09-14T08:16:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00164,2026-09-14T08:56:00Z,RDG,Reading Main Entrance,CH-2010,Jack Turner,Access Granted
EV00166,2026-09-14T08:58:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00165,2026-09-14T08:58:30Z,RDG,Reading Office 201 Door,CH-2010,Jack Turner,Access Granted
EV00167,2026-09-14T08:59:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00162,2026-09-14T09:15:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00163,2026-09-14T09:17:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00156,2026-09-14T09:49:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00158,2026-09-14T09:51:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00157,2026-09-14T09:51:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00159,2026-09-14T09:53:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00174,2026-09-15T07:11:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00175,2026-09-15T07:13:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00183,2026-09-15T07:18:00Z,RDG,Reading Main Entrance,CH-2012,Hannah Wood,Access Granted
EV00184,2026-09-15T07:20:30Z,RDG,Reading Office 201 Door,CH-2012,Hannah Wood,Access Granted
EV00168,2026-09-15T07:37:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00169,2026-09-15T07:39:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00172,2026-09-15T08:40:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00173,2026-09-15T08:42:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00176,2026-09-15T08:44:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00179,2026-09-15T09:10:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00180,2026-09-15T09:12:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00170,2026-09-15T09:15:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00171,2026-09-15T09:17:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00185,2026-09-15T09:19:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00186,2026-09-15T09:21:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00181,2026-09-15T09:23:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00182,2026-09-15T09:25:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00177,2026-09-15T09:57:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00178,2026-09-15T09:59:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00193,2026-09-16T07:16:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00187,2026-09-16T07:24:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00189,2026-09-16T07:24:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00188,2026-09-16T07:26:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00190,2026-09-16T07:26:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00194,2026-09-16T09:11:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00195,2026-09-16T09:15:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00196,2026-09-16T09:17:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00191,2026-09-16T09:45:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00192,2026-09-16T09:47:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00199,2026-09-17T07:48:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00201,2026-09-17T07:49:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00200,2026-09-17T07:50:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00197,2026-09-17T09:07:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00198,2026-09-17T09:09:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00202,2026-09-17T09:20:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00203,2026-09-17T09:22:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00210,2026-09-18T07:18:00Z,RDG,Reading Main Entrance,CH-2013,Sam Ellis,Access Granted
EV00211,2026-09-18T07:20:30Z,RDG,Reading Office 201 Door,CH-2013,Sam Ellis,Access Granted
EV00206,2026-09-18T08:19:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00207,2026-09-18T08:21:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00208,2026-09-18T09:20:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00209,2026-09-18T09:22:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00204,2026-09-18T09:48:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00205,2026-09-18T09:50:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00212,2026-09-21T08:04:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00213,2026-09-21T08:06:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00219,2026-09-21T08:42:00Z,RDG,Reading Main Entrance,CH-2012,Hannah Wood,Access Granted
EV00220,2026-09-21T08:44:30Z,RDG,Reading Office 201 Door,CH-2012,Hannah Wood,Access Granted
EV00214,2026-09-21T08:51:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00215,2026-09-21T08:53:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00216,2026-09-21T08:57:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00217,2026-09-21T09:28:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00218,2026-09-21T09:30:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00225,2026-09-22T07:55:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00226,2026-09-22T07:57:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00227,2026-09-22T08:18:00Z,RDG,Reading Main Entrance,CH-2009,Olu Adeyemi,Access Granted
EV00228,2026-09-22T08:20:30Z,RDG,Reading Office 201 Door,CH-2009,Olu Adeyemi,Access Granted
EV00223,2026-09-22T08:34:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00224,2026-09-22T08:36:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00221,2026-09-22T09:51:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00222,2026-09-22T09:53:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00229,2026-09-23T07:20:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00230,2026-09-23T07:22:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00233,2026-09-23T07:54:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00234,2026-09-23T07:56:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00236,2026-09-23T07:57:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00237,2026-09-23T07:59:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00231,2026-09-23T08:43:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00232,2026-09-23T08:45:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00235,2026-09-23T09:51:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00248,2026-09-24T07:11:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00249,2026-09-24T07:13:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00250,2026-09-24T07:56:00Z,RDG,Reading Main Entrance,CH-2010,Jack Turner,Access Granted
EV00251,2026-09-24T07:58:30Z,RDG,Reading Office 201 Door,CH-2010,Jack Turner,Access Granted
EV00244,2026-09-24T08:04:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00245,2026-09-24T08:06:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00246,2026-09-24T08:08:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00247,2026-09-24T08:17:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00240,2026-09-24T08:25:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00241,2026-09-24T08:27:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00242,2026-09-24T09:21:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00243,2026-09-24T09:23:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00238,2026-09-24T09:56:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00239,2026-09-24T09:58:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00255,2026-09-25T07:16:00Z,RDG,Reading Main Entrance,CH-2011,Mei Lin,Access Granted
EV00256,2026-09-25T07:18:30Z,RDG,Reading Office 201 Door,CH-2011,Mei Lin,Access Granted
EV00254,2026-09-25T08:53:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00252,2026-09-25T09:15:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00253,2026-09-25T09:17:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00261,2026-09-28T07:04:00Z,RDG,Reading Main Entrance,CH-2008,Emma Clarke,Access Granted
EV00262,2026-09-28T07:06:30Z,RDG,Reading Office 201 Door,CH-2008,Emma Clarke,Access Granted
EV00259,2026-09-28T07:40:00Z,SOHO,Soho Main Entrance,CH-1003,Leah Brooks,Access Granted
EV00260,2026-09-28T07:42:30Z,SOHO,Soho Office 101 Door,CH-1003,Leah Brooks,Access Granted
EV00257,2026-09-28T08:01:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00258,2026-09-28T08:03:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00267,2026-09-29T08:42:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00263,2026-09-29T08:54:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00264,2026-09-29T08:56:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00265,2026-09-29T09:45:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00266,2026-09-29T09:47:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
EV00268,2026-09-30T07:38:00Z,SOHO,Soho Main Entrance,CH-1001,Priya Sharma,Access Granted
EV00269,2026-09-30T07:40:30Z,SOHO,Soho Office 101 Door,CH-1001,Priya Sharma,Access Granted
EV00274,2026-09-30T08:01:00Z,SOHO,Soho Main Entrance,CH-1007,Ravi Patel,Access Granted
EV00272,2026-09-30T08:56:00Z,SOHO,Soho Main Entrance,CH-1004,Tom Okafor,Access Granted
EV00273,2026-09-30T08:58:30Z,SOHO,Soho Office 101 Door,CH-1004,Tom Okafor,Access Granted
EV00275,2026-09-30T09:24:00Z,SOHO,Soho Main Entrance,CH-1014,Fatima Ali,Access Granted
EV00270,2026-09-30T09:33:00Z,SOHO,Soho Main Entrance,CH-1002,Arjun Mehta,Access Granted
EV00271,2026-09-30T09:35:30Z,SOHO,Soho Office 101 Door,CH-1002,Arjun Mehta,Access Granted
```

## act_contacts.csv

Contacts in the Act! sales CRM (the older sales system). (7 rows)

Columns: Contact,Company,E-mail,Phone,Title,ID/Status,Referred By,Create Date

```csv
Contact,Company,E-mail,Phone,Title,ID/Status,Referred By,Create Date
Priya Sharma,Pixel Chai Studio Ltd,Priya.Sharma@pixelchai.co.uk,07700 900101,Founder,Customer,Website,2025-09-12
Daniel Hughes,Brightline Legal LLP,daniel.hughes@brightlinelegal.co.uk,07700 900102,Partner,Former Customer,Broker - OfficeFinder,2025-05-20
Ravi Patel,Nomad Analytics,ravi@nomadanalytics.io,07700 900103,Founder,Customer,Walk-in,2024-12-30
Emma Clarke,GreenRoot Foods Ltd,emma.clarke@greenrootfoods.com,07700 900104,CEO,Customer,Referral - Ravi Patel,2025-11-02
Fatima Ali,Kite & Key Recruitment,fatima@kiteandkey.co.uk,07700 900105,Founder,Customer,Website,2026-01-20
Ben Carter,Ortho Robotics,ben@orthorobotics.ai,07700 900106,COO,Prospect,Broker - OfficeFinder,2026-09-02
Nina Gomez,Lumen Yoga,nina@lumenyoga.co.uk,07700 900107,Owner,Lost Prospect,Website,2026-06-11
```

## act_opportunities.csv

Deals in the Act! sales CRM: stage, status, quoted and won monthly value (USD), dates and reasons. (7 rows)

Columns: Opportunity Name,Company,Contact,Stage,Status,Product,Site,Quoted Monthly USD,Won Monthly USD,Open Date,Est Close Date,Actual Close Date,Reason

```csv
Opportunity Name,Company,Contact,Stage,Status,Product,Site,Quoted Monthly USD,Won Monthly USD,Open Date,Est Close Date,Actual Close Date,Reason
Pixel Chai - Office 101,Pixel Chai Studio Ltd,Priya Sharma,Closed Won,Won,Private Office,Soho,3250,3000,2026-02-01,2026-03-15,2026-03-14,Upgrade from hot desk; 7.7% discount for 12m term
Brightline - Office 103,Brightline Legal LLP,Daniel Hughes,Closed Won,Won,Private Office,Soho,1750,1750,2025-05-20,2025-06-15,2025-06-10,
Brightline - Renewal 2026,Brightline Legal LLP,Daniel Hughes,Closed Lost,Lost,Private Office,Soho,1812.5,,2026-03-01,2026-05-31,2026-04-30,Moving to hybrid; downsizing to home working
GreenRoot - Office 201,GreenRoot Foods Ltd,Emma Clarke,Closed Won,Won,Private Office,Reading,3375,3375,2025-11-02,2025-12-15,2025-12-10,
GreenRoot - Renewal 2027,GreenRoot Foods Ltd,Emma Clarke,Proposal Sent,Open,Private Office,Reading,3500,,2026-09-15,2026-11-30,,Renewal due 31 Dec 2026
Ortho Robotics - Office 202,Ortho Robotics,Ben Carter,Tour Done,Open,Private Office,Reading,5250,,2026-09-02,2026-10-31,,Wants 10 desks from Nov
Lumen Yoga - Event Space,Lumen Yoga,Nina Gomez,Closed Lost,Lost,Event,Soho,750,,2026-06-11,2026-07-01,2026-06-25,Price too high
```

## bookings_sep2026.csv

Meeting room bookings in September 2026, with hours and price (USD). (10 rows)

Columns: booking_id,resource_code,site_code,member_id,company_id,booking_date,start_time,end_time,hours,price_usd,status

```csv
booking_id,resource_code,site_code,member_id,company_id,booking_date,start_time,end_time,hours,price_usd,status
B1001,SOHO-MR-BRICK,SOHO,M001,C001,2026-09-03,10:00,12:00,2,112.5,confirmed
B1002,SOHO-MR-CARN,SOHO,M007,C003,2026-09-07,14:00,15:00,1,37.5,confirmed
B1003,SOHO-MR-BRICK,SOHO,M001,C001,2026-09-10,10:00,12:00,2,112.5,confirmed
B1004,SOHO-MR-BRICK,SOHO,M002,C001,2026-09-14,09:00,10:00,1,56.25,confirmed
B1005,SOHO-MR-BRICK,SOHO,M001,C001,2026-09-17,10:00,12:00,2,112.5,confirmed
B1006,SOHO-MR-CARN,SOHO,M014,C005,2026-09-21,11:00,13:00,2,75,confirmed
B1007,SOHO-MR-BRICK,SOHO,M001,C001,2026-09-24,10:00,12:00,2,112.5,confirmed
B1008,SOHO-MR-CARN,SOHO,M007,C003,2026-09-28,15:00,16:00,1,37.5,confirmed
B1009,RDG-MR-THAMES,RDG,M008,C004,2026-09-04,09:00,12:00,3,150,confirmed
B1010,RDG-MR-THAMES,RDG,M009,C004,2026-09-18,13:00,15:00,2,100,confirmed
```

## companies.csv

The member companies (Pixel Chai, Brightline Legal, Nomad Analytics, GreenRoot Foods, Kite & Key). (5 rows)

Columns: company_id,company_name,industry,billing_email,home_site

```csv
company_id,company_name,industry,billing_email,home_site
C001,Pixel Chai Studio,Design agency,accounts@pixelchai.co.uk,SOHO
C002,Brightline Legal,Legal services,finance@brightlinelegal.co.uk,SOHO
C003,Nomad Analytics,Data consultancy,ravi@nomadanalytics.io,SOHO
C004,GreenRoot Foods,Food startup,ap@greenrootfoods.com,RDG
C005,Kite & Key Recruitment,Recruitment,fatima@kiteandkey.co.uk,RDG
```

## contracts.csv

Contracts K001–K007: who has which plan and resource at which site, price and list price (USD), start and end dates, notice date and end reason. (7 rows)

Columns: contract_id,company_id,member_id,plan_code,resource_code,site_code,start_date,end_date,monthly_price_usd,list_price_usd,notice_given_on,end_reason

```csv
contract_id,company_id,member_id,plan_code,resource_code,site_code,start_date,end_date,monthly_price_usd,list_price_usd,notice_given_on,end_reason
K001,C001,M001,P-HOT,SOHO-HOT,SOHO,2025-10-01,2026-03-31,400,400,,upgrade
K002,C001,M001,P-OFFICE,SOHO-O101,SOHO,2026-04-01,2027-03-31,3000,3250,,
K003,C002,M005,P-OFFICE,SOHO-O103,SOHO,2025-07-01,2026-06-30,1750,1750,2026-04-30,left
K004,C003,M007,P-HOT,SOHO-HOT,SOHO,2025-01-15,,400,400,,
K005,C004,M008,P-OFFICE,RDG-O201,RDG,2026-01-01,2026-12-31,3375,3375,,
K006,C005,M014,P-FLEX10,RDG-HOT,RDG,2026-02-01,2026-07-31,225,225,,transfer
K007,C005,M014,P-HOT,SOHO-HOT,SOHO,2026-08-01,,400,400,,
```

## excel_capacity_budget_2026.csv

The Excel capacity and budget sheet: sellable desks, budget revenue (USD), budget occupancy and budget direct costs (USD) per site and month. (6 rows)

Columns: site_code,month,sellable_desks,budget_revenue_usd,budget_desk_occupancy,budget_direct_costs_usd,notes

```csv
site_code,month,sellable_desks,budget_revenue_usd,budget_desk_occupancy,budget_direct_costs_usd,notes
SOHO,2026-07,34,11250,0.85,9500,
SOHO,2026-08,34,11250,0.85,9500,August is quiet - holidays
SOHO,2026-09,34,11500,0.85,9562.5,
RDG,2026-07,31,3875,0.20,3000,
RDG,2026-08,31,3875,0.20,3000,
RDG,2026-09,31,4000,0.20,3062.5,Ortho Robotics could fill O202 from Nov
```

## members.csv

The people in those companies, with role, join date and status. (14 rows)

Columns: member_id,first_name,last_name,email,company_id,role,joined_on,status

```csv
member_id,first_name,last_name,email,company_id,role,joined_on,status
M001,Priya,Sharma,priya@pixelchai.co.uk,C001,Founder,2025-10-01,active
M002,Arjun,Mehta,arjun@pixelchai.co.uk,C001,Designer,2026-04-01,active
M003,Leah,Brooks,leah@pixelchai.co.uk,C001,Designer,2026-04-01,active
M004,Tom,Okafor,tom@pixelchai.co.uk,C001,Developer,2026-04-01,active
M005,Daniel,Hughes,daniel@brightlinelegal.co.uk,C002,Partner,2025-07-01,left
M006,Sara,Kim,sara@brightlinelegal.co.uk,C002,Solicitor,2025-07-01,left
M007,Ravi,Patel,ravi@nomadanalytics.io,C003,Founder,2025-01-15,active
M008,Emma,Clarke,emma@greenrootfoods.com,C004,CEO,2026-01-01,active
M009,Olu,Adeyemi,olu@greenrootfoods.com,C004,Operations,2026-01-01,active
M010,Jack,Turner,jack@greenrootfoods.com,C004,Sales,2026-01-01,active
M011,Mei,Lin,mei@greenrootfoods.com,C004,Product,2026-01-01,active
M012,Hannah,Wood,hannah@greenrootfoods.com,C004,Marketing,2026-01-01,active
M013,Sam,Ellis,sam@greenrootfoods.com,C004,Finance,2026-01-01,active
M014,Fatima,Ali,fatima@kiteandkey.co.uk,C005,Founder,2026-02-01,active
```

## netsuite_gl_sep2026.csv

NetSuite general ledger lines for September 2026: invoices, bills, journals and a credit memo (USD). (23 rows)

Columns: tran_id,tran_date,tran_type,account,account_name,account_type,location,entity,memo,amount_usd

```csv
tran_id,tran_date,tran_type,account,account_name,account_type,location,entity,memo,amount_usd
INV-2609-01,2026-09-01,Invoice,4000,Office Revenue,Income,Soho,Pixel Chai Studio Ltd,Office 101 September,3000
INV-2609-02,2026-09-01,Invoice,4010,Coworking Revenue,Income,Soho,Nomad Analytics,Unlimited Coworking September,400
INV-2609-03,2026-09-01,Invoice,4010,Coworking Revenue,Income,Soho,Kite and Key Recruitment Ltd,Unlimited Coworking September,400
INV-2609-04,2026-09-01,Invoice,4000,Office Revenue,Income,Reading,Green Root Foods Ltd,Office 201 September,3375
INV-2609-05,2026-09-30,Invoice,4100,Meeting Room Revenue,Income,Soho,Pixel Chai Studio Ltd,Meeting rooms September,506.25
INV-2609-06,2026-09-30,Invoice,4100,Meeting Room Revenue,Income,Soho,Nomad Analytics,Meeting rooms September,75
INV-2609-07,2026-09-30,Invoice,4100,Meeting Room Revenue,Income,Soho,Kite and Key Recruitment Ltd,Meeting rooms September,75
INV-2609-08,2026-09-30,Invoice,4100,Meeting Room Revenue,Income,Reading,Green Root Foods Ltd,Meeting rooms September,250
CN-2609-01,2026-09-30,Credit Memo,4100,Meeting Room Revenue,Income,Soho,Pixel Chai Studio Ltd,Goodwill credit - AV failure 24 Sep,-112.5
BILL-2609-01,2026-09-01,Vendor Bill,5000,Rent,Expense,Soho,Soho Estates Ltd,September rent,5625
BILL-2609-02,2026-09-01,Vendor Bill,5010,Business Rates,Expense,Soho,Westminster City Council,September rates,1125
BILL-2609-03,2026-09-01,Vendor Bill,5020,Service Charge,Expense,Soho,Soho Estates Ltd,September service charge,500
BILL-2609-04,2026-09-30,Vendor Bill,5100,Utilities,Expense,Soho,British Gas Business,September energy,437.5
BILL-2609-05,2026-09-30,Vendor Bill,5300,Cleaning,Expense,Soho,SparkleClean Ltd,September cleaning,375
JE-2609-01,2026-09-30,Journal,5200,Site Staff,Expense,Soho,Payroll,September site staff allocation,1500
BILL-2609-06,2026-09-01,Vendor Bill,5000,Rent,Expense,Reading,Thames Valley Properties,September rent,1625
BILL-2609-07,2026-09-01,Vendor Bill,5010,Business Rates,Expense,Reading,Reading Borough Council,September rates,312.5
BILL-2609-08,2026-09-01,Vendor Bill,5020,Service Charge,Expense,Reading,Thames Valley Properties,September service charge,187.5
BILL-2609-09,2026-09-30,Vendor Bill,5100,Utilities,Expense,Reading,British Gas Business,September energy,250
BILL-2609-10,2026-09-30,Vendor Bill,5300,Cleaning,Expense,Reading,SparkleClean Ltd,September cleaning,187.5
JE-2609-02,2026-09-30,Journal,5200,Site Staff,Expense,Reading,Payroll,September site staff allocation,500
JE-2609-03,2026-09-30,Journal,6000,Central Overheads,Expense,Soho,Allocation,September central cost allocation,1250
JE-2609-04,2026-09-30,Journal,6000,Central Overheads,Expense,Reading,Allocation,September central cost allocation,625
```

## plans.csv

Membership plans and their monthly prices (USD). (3 rows)

Columns: plan_code,plan_name,type,monthly_price_usd,min_term_months,includes

```csv
plan_code,plan_name,type,monthly_price_usd,min_term_months,includes
P-HOT,Unlimited Coworking,coworking,400,1,Any free hot desk Mon-Fri; meeting rooms charged per hour
P-FLEX10,Flex 10 Days,coworking,225,1,10 day passes per month at any site; meeting rooms charged per hour
P-OFFICE,Private Office,office,priced per office,3,Dedicated lockable office; meeting rooms charged per hour
```

## resources.csv

Things that can be rented (hot desks, offices, flex desks, meeting rooms) with capacity and list price (USD). (10 rows)

Columns: resource_code,site_code,resource_type,name,capacity_people,list_price_usd,price_unit

```csv
resource_code,site_code,resource_type,name,capacity_people,list_price_usd,price_unit
SOHO-O101,SOHO,private_office,Office 101,4,3250,month
SOHO-O102,SOHO,private_office,Office 102,8,6250,month
SOHO-O103,SOHO,private_office,Office 103,2,1750,month
SOHO-HOT,SOHO,hot_desk_area,Soho Coworking Floor,20,400,member/month
SOHO-MR-BRICK,SOHO,meeting_room,Brick Lane,8,56.25,hour
SOHO-MR-CARN,SOHO,meeting_room,Carnaby,4,37.5,hour
RDG-O201,RDG,private_office,Office 201,6,3375,month
RDG-O202,RDG,private_office,Office 202,10,5250,month
RDG-HOT,RDG,hot_desk_area,Reading Coworking Floor,15,400,member/month
RDG-MR-THAMES,RDG,meeting_room,Thames,10,50,hour
```

## sites.csv

The two lab sites (Soho and Reading). (2 rows)

Columns: site_code,site_name,city,office_desks,hot_desks,meeting_rooms,sellable_sqft,opened

```csv
site_code,site_name,city,office_desks,hot_desks,meeting_rooms,sellable_sqft,opened
SOHO,Work.Life Soho (lab),London,14,20,2,3200,2019-03-01
RDG,Work.Life Reading (lab),Reading,16,15,1,2900,2021-09-01
```
