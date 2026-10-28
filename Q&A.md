Please respond to the following. Where something depends on decisions we have not yet made, tell us what you would need from us to firm it up.

> **Draft answers** taken from the series (mainly Chapter 33, with detail from Chapters 23–36). All costs are **estimates**. The $937.50 day rate is **made up**. The Soho example uses lab numbers, not real Work.Life figures.

---

## 1. Feasibility and approach

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

## 2. Timeline

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

## 3. What you need from us

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

## 4. Cost

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

## 5. Security

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

## 6. Accuracy

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

## 7. Resilience

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

## 8. Documentation and handover

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

## 9. Support and resourcing

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

## 10. Scalability

**How would Phase 1 extend to the Phase 2 use cases in section 4 without a significant rebuild?**

**Each Phase 2 idea reuses the same safe copy, the same KPI definitions and the same accuracy tests. Nothing is rebuilt; we only add on top.** As you asked, none of this is priced.

| Phase 2 use case | What Phase 1 already gives | What gets added later |
|---|---|---|
| Real-time member & retention reporting | Agreed member and churn definitions; scheduled summaries | More frequent data refresh; retention views in the BI tool |
| Churn & renewal prediction + context packs | Contract history by month; agreed churn and transfer definitions; tests | A table of contract changes; weekly attendance per company and renewal-deal tables (no individual contacts, groups of 5 or more only); a risk score; a "renewal pack" template |
| Forecasting (resident revenue, net member movements, seasonality, meeting rooms) | Clean monthly history per site in `fct_site_month_kpis` | Forecast models; the assistant explains their results |
| Role-based access & agents | Sign-in, logs, one safe copy | Roles that limit what each site or team sees; approved automations |
