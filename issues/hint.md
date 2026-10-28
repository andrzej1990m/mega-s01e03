## Problem

The booking-v3 date field displays `MM/DD/YYYY`, prompting month-first input, but the form reads the date in the tenant's day-first order. The displayed contract and the form's interpretation disagree.

## Reports covered

**33 unique reports** currently merged into support ticket **#4471**, all submitted through the form, across three booking-v3 tenants:

| Tenant | Reports |
|---|---:|
| alder.physio | 12 |
| copper.studio | 11 |
| pale.harbour | 10 |
| Total | 33 |

Reports were received from 2026-04-17 through 2026-09-22. Count each report ID once. The 34 exported rows in this group include one repeated report; they represent 33 reports, not 34.

The full export contains 412 unique reports: these 33 plus 379 assigned to the separate shared-parser problem. Classification uses tenant locale, booking form and report channel. Fifteen of these reports were incorrectly tagged `parser` at intake; the reporter's browser locale is not the tenant's date contract.

## Evidence and reproduction

Use the booking-v3 form for a day-first tenant such as `copper.studio`. Follow its displayed `MM/DD/YYYY` hint and enter `01/06/2026` intending 6 January. Day-first interpretation produces 1 June instead.

R-41230, `copper.studio`, form, browser locale `en-GB`:

> My client came on 1 June instead of 6 January.

This report is tagged `parser` at intake, but the tenant's booking-v3 form and the form channel place it in the hint group.

## Expected outcome

Make the date hint and the form's date interpretation agree with an explicit tenant date contract. Test both the displayed hint and the submitted date. Keep this issue separate from the shared parser defect; matching symptoms or subjects do not prove a shared cause.

## Source

MEGA.dev S01E03 support-kb export, dated 2026-10-04: `src/lib/data/reports-4471.json`, `src/lib/data/tenants/*.json`, `src/lib/kb/causes.ts`, and `src/lib/kb/locales.ts`. Counts reproduce `uniqueById`, `groupByCause` and the supplied tenant lookup.
