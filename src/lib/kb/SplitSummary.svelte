<script lang="ts">
  import { split } from '#lib/kb/split-summary';

  const parser = split.groups.find((g) => g.cause === 'parser');
  const hint = split.groups.find((g) => g.cause === 'hint');
</script>

<section aria-label="Computed split of ticket 4471">
  <p class="equation"><strong>{parser?.reports.length ?? 0} parser + {hint?.reports.length ?? 0} hint = {split.total} unique reports</strong></p>
  <p>{split.raw} raw rows; {split.duplicates} overlapping duplicate rows removed by report ID.</p>
  <table>
    <caption>Supplied classifier assignments, not individually confirmed failures</caption>
    <thead>
      <tr><th>Assigned cause</th><th>Unique reports</th><th>Tenants</th><th>Intake tag errors</th><th>Received</th></tr>
    </thead>
    <tbody>
      {#each split.groups as group (group.cause)}
        <tr>
          <td>{group.cause}</td>
          <td>{group.reports.length}</td>
          <td>{group.tenants}</td>
          <td>{group.cause === 'unplaced' ? 'unknown' : group.reports.filter((r) => r.meta.intakeTag !== group.cause).length}</td>
          <td>{group.firstSeen} → {group.lastSeen}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p><strong>{split.tagErrors} intake tag errors</strong>: browser locale and intake tags are clues, not the tenant's date contract.</p>
  <p>{split.deskNotes.length} desk-noted reports remain included in the parser count, not an additional cause:</p>
  <ul>
    {#each split.deskNotes as report (report.id)}
      <li><code>{report.id}</code> — {report.body}</li>
    {/each}
  </ul>
</section>
