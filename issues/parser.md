## Problem

The shared date parser reads month first although the affected tenants use day-first dates. This reverses the intended day and month for ambiguous dates.

## Reports covered

**379 unique reports** currently merged into support ticket **#4471**, across 11 tenants, received from 2026-04-01 through 2026-10-04.

Count each report ID once. The export has 427 rows but only 412 unique reports: 379 in this group and 33 in the separate booking-v3 hint group. Repeated export rows are not additional reports.

This group contains 204 app reports, 150 email reports and 25 form reports. Classification uses the tenant's locale and booking form, not the reporter's browser locale or `meta.intakeTag`. Of these 379 reports, 23 were incorrectly tagged `hint` at intake.

## Evidence and reproduction

For a day-first tenant, enter an ambiguous date representing 7 April, such as `07/04/2026`, through a path using the shared parser. Month-first parsing produces 4 July instead of 7 April.

R-41200, `harbour.dental`, app:

> Our 7 April reminder went out on 4 July.

R-41205, `morrow.tax`, app, browser locale `en-US`:

> Customer booked 3 October and got an invite for 10 March.

The second report is tagged `hint`, but its tenant and app channel place it in the parser group.

## Scope and uncertainty

The 379 count is the supplied KB classifier's assignment, not 379 independently proven parser failures. Nine reports in this group lack an explicit day/month transposition pair. Five are specifically flagged by `src/lib/data/desk-notes.json`: R-41202, R-41209, R-41236, R-41344 and R-41620. They describe one-day, calendar-boundary or delivery-timing symptoms and need investigation. Keep them visible within this count; do not silently discard them, count them twice, or assert a timezone/DST root cause without evidence.

## Expected outcome

Parse dates according to an explicit, consistent date contract for the tenant. Keep this parser defect separate from the booking-v3 hint defect, because changing the parser alone does not establish that the form's displayed instructions are correct.

## Source

MEGA.dev S01E03 support-kb export, dated 2026-10-04: `src/lib/data/reports-4471.json`, `src/lib/data/tenants/*.json`, `src/lib/kb/causes.ts`, `src/lib/kb/locales.ts`, and `src/lib/data/desk-notes.json`. Counts reproduce `uniqueById`, `groupByCause` and the supplied tenant lookup.
