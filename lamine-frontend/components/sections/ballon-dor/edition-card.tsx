import { Fragment } from "react";
import { Medal } from "@/components/ui/icons";
import ShuffleText from "@/components/ui/shuffle-text";
import { PLAYER, type BallonDorEdition } from "@/lib/content";
import { format } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type Row = { place: number; name: string; points: number; me: boolean };

// One Ballon d'Or edition: where he finished, then the podium as bars, with his own
// bar in gold. Outside the top three, his row follows the podium after a gap.
// `max` is shared by every card, so a bar in one year compares with the others.
export default function EditionCard({
  edition: e,
  max,
  t,
  num,
}: {
  edition: BallonDorEdition;
  max: number;
  t: Dictionary["ballonDor"];
  num: (n: number) => string;
}) {
  const rows: Row[] = e.top.map((p, i) => ({ place: i + 1, ...p, me: i + 1 === e.rank }));
  if (e.rank > rows.length) rows.push({ place: e.rank, name: PLAYER.name, points: e.points, me: true });
  const winner = e.top[0];
  const titleId = `ballon-dor-${e.year}`;

  return (
    <article
      data-reveal="true"
      data-shuffle-host
      aria-labelledby={titleId}
      className="glow-card edge-glow edge-glow-gold flex flex-col overflow-hidden bg-bg p-6 md:p-8"
    >
      {/* Behind the text, faded on the left so it never runs into the place number. */}
      <p
        aria-hidden
        className="text-outline pointer-events-none absolute -top-3 -right-2 -z-10 font-display text-[7.5rem] leading-none font-bold tracking-[-0.05em] [mask-image:linear-gradient(to_right,transparent,black_75%)]"
      >
        {e.year}
      </p>

      <h3 id={titleId} className="hud-label text-muted">
        <ShuffleText text={format(t.edition, { year: e.year })} />
      </h3>

      <p className="mt-6 flex items-baseline gap-3">
        <span className="font-display text-7xl leading-none font-medium tracking-[-0.05em] text-ink-strong">
          #{e.rank}
        </span>
        <span className="hud-label text-faint">
          {t.place} · {format(t.points, { n: num(e.points) })}
        </span>
      </p>
      <p className="mt-3 min-h-6 text-sm text-muted">
        {e.rank === 1 ? (
          <span className="inline-flex items-center gap-2 text-ink">
            <Medal className="h-4 w-4 text-gold" /> {t.winner}
          </span>
        ) : (
          format(t.behind, { n: num(winner.points - e.points), name: winner.name })
        )}
      </p>

      <ol aria-label={format(t.rankingAria, { year: e.year })} className="mt-6 space-y-3 border-t border-line pt-6">
        {rows.map((r, i) => (
          <Fragment key={r.place}>
            {i > 0 && r.place - rows[i - 1].place > 1 && (
              <li aria-hidden className="hud-label pl-7 leading-none text-faint">
                ···
              </li>
            )}
            <li
              title={`${r.place}. ${r.name} · ${format(t.points, { n: num(r.points) })}`}
              className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-baseline gap-x-2 gap-y-1.5"
            >
              <span className="hud-label text-faint tabular-nums">{r.place}</span>
              <span className={`truncate text-sm ${r.me ? "font-medium text-ink-strong" : "text-muted"}`}>
                {r.name}
              </span>
              <span className={`text-sm tabular-nums ${r.me ? "font-medium text-ink-strong" : "text-muted"}`}>
                {num(r.points)}
              </span>
              <span aria-hidden className="col-span-2 col-start-2 block h-2">
                <span
                  data-grow
                  style={{ width: `${(r.points / max) * 100}%` }}
                  className={`block h-full rounded-r-[4px] ${r.me ? "bg-chart-focus" : "bg-chart-rest"}`}
                />
              </span>
            </li>
          </Fragment>
        ))}
      </ol>

      {e.kopa && (
        <p className="hud-label mt-auto flex items-center gap-2 pt-6 text-faint">
          <Medal className="h-3.5 w-3.5 text-gold" /> {t.kopa}
        </p>
      )}
    </article>
  );
}
