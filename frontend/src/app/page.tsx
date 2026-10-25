import BlurText from "@/components/BlurText";
import CircularText from "@/components/CircularText";
import CountUp from "@/components/CountUp";
import DecryptedText from "@/components/DecryptedText";
import DepthText from "@/components/DepthText";
import GlitchText from "@/components/GlitchText";
import RotatingText from "@/components/RotatingText";
import ScrollFloat from "@/components/ScrollFloat";
import ScrollReveal from "@/components/ScrollReveal";
import ScrollVelocity from "@/components/ScrollVelocity";
import SplitText from "@/components/SplitText";
import TextPressure from "@/components/TextPressure";

const FEED = [
  "Youngest ever to debut for Barça · 16y 1d",
  "Youngest La Liga goalscorer · 16y 87d",
  "Youngest Euro goalscorer · 16y 362d",
  "Euro 2024 champion · one day after his 17th birthday",
  "Youngest Barça scorer in El Clásico · 17y 105d",
  "First two-time Kopa winner",
  "World champion with Spain · 19y 6d",
  "50 goals in Europe's big five · youngest ever",
];

const SCENES = [
  {
    date: "16 · 10 · 2023",
    place: "Spotify Camp Nou",
    age: "16y 1d",
    head: "He was sent on at half-time, to a standing ovation.",
    body: "Fifty minutes were all he needed to become the youngest player ever to pull on the Barça shirt, and the first teenager to be applauded like a senior. Three months later the goals started.",
    tag: "Debut",
  },
  {
    date: "08 · 10 · 2023",
    place: "La Liga · matchday 8",
    age: "16y 87d",
    head: "Eleven days younger than the boy he replaced.",
    body: "A first senior goal made him the youngest scorer in the history of La Liga — eleven days younger than Fabrice Olinga, a record that had stood since 2012. Nobody expected it to be the safe one.",
    tag: "First goal",
  },
  {
    date: "09 · 07 · 2024",
    place: "Munich · semi-final",
    age: "16y 362d",
    head: "The whole tournament hinged on a boy who had not finished school.",
    body: "A strike from the edge of the area against France made him the youngest goalscorer in European Championship history — and UEFA later named it the goal of the tournament.",
    tag: "Goal of the tournament",
  },
  {
    date: "14 · 07 · 2024",
    place: "Olympiastadion · final",
    age: "17y 1d",
    head: "Youngest player to win a major international trophy.",
    body: "An assist for Nico Williams' opener, Spain 2–1 England, and a place in the record books that Pelé held for sixty-eight years — beaten by 248 days.",
    tag: "Champion",
  },
  {
    date: "26 · 10 · 2024",
    place: "Santiago Bernabéu",
    age: "17y 105d",
    head: "The Bernabéu went quiet, and he kept going.",
    body: "The third of four in a Clásico won 4–0 on the road, making him the youngest goalscorer in the history of the fixture for Barcelona.",
    tag: "El Clásico",
  },
  {
    date: "31 · 08 · 2026",
    place: "Camp Nou · matchday 3",
    age: "19y 49d",
    head: "Fifty goals, and the record he broke belonged to Mbappé.",
    body: "Two more in a 5–2 win over Rayo Vallecano took him to 51 for the club and made him the youngest player in the history of Europe's big five leagues to reach fifty.",
    tag: "The record",
  },
];

const TROPHIES = [
  {
    name: "FIFA World Cup",
    year: "2026",
    line: "Youngest player ever to hold both the European Championship and the World Cup. 19 years, 6 days.",
    big: true,
  },
  {
    name: "UEFA European Championship",
    year: "2024",
    line: "Won the day after his 17th birthday. Young Player of the Tournament.",
    big: true,
  },
  {
    name: "La Liga",
    year: "2024–25 · 2025–26",
    line: "Back-to-back titles, and the league's Player of the Season award for 2025–26 as the club's top scorer.",
    big: false,
  },
  {
    name: "Copa del Rey & Supercopa",
    year: "2024–25",
    line: "The two cups that completed Barcelona's domestic treble under Hansi Flick.",
    big: false,
  },
];

const AWARDS = [
  ["Golden Boy", "2024"],
  ["Kopa Trophy ×2", "2024 · 2025"],
  ["La Liga Player of the Season", "2025–26"],
  ["Ballon d'Or", "2nd, 2025"],
  ["IFFHS World's Best Youth Player", "2024 · 2025"],
  ["Laureus Young Sportsperson of the Year", "2026"],
];

const SEASONS = [
  ["2022–23", "1", "0", "Debut season, one league appearance"],
  ["2023–24", "50", "7", "Left-winger, La Masia to first team"],
  ["2024–25", "55", "18", "Triple, 100th appearance, second Kopa"],
  ["2025–26", "45", "24", "Club top scorer · 17 assists · POTY"],
  ["2026–27", "8", "8", "Fifty goals before his twentieth birthday"],
];

const NUMBERS = [
  ["159", "appearances, all competitions"],
  ["57", "goals for the club"],
  ["17", "assists in 2025–26 alone"],
  ["16", "youngest-player records"],
];

const SEASON_GOALS: [string, number][] = [
  ["2023–24", 7],
  ["2024–25", 18],
  ["2025–26", 24],
  ["2026–27", 8],
];

const MARQUEE_A = [
  "Lamine Yamal",
  "19",
  "FC Barcelona",
  "Spain",
  "La Masia",
  "Right wing",
];
const MARQUEE_B = [
  "World champion",
  "Goal of the tournament",
  "50 goals at 19",
  "16 youngest-player records",
  "100 matches",
];

export default function Home() {
  return (
    <main>
      {/* ---------------------------------------------------------- nav */}
      <nav className="nav-in fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-noir/85">
        <div className="mx-auto flex max-w-[86rem] items-center justify-between px-6 py-4 md:px-10">
          <span className="condensed whitespace-nowrap text-chalk/90">
            Lamine Yamal
          </span>
          <span className="data ml-4 border-l border-white/15 pl-4">
            <GlitchText speed={2.4}>19</GlitchText>
          </span>
          <div className="flex gap-6 md:gap-9">
            {[
              ["Route", "#route"],
              ["Cabinet", "#cabinet"],
              ["Numbers", "#numbers"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="data transition-colors duration-300 hover:text-gold"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* --------------------------------------------------------- hero */}
      <header className="pitch relative min-h-[100svh] overflow-hidden pt-28">
        <p
          aria-hidden
          className="drift ghost condensed pointer-events-none absolute -top-4 -right-[6vw] text-[38vw] leading-none select-none"
        >
          19
        </p>

        <div className="relative mx-auto flex min-h-[74svh] max-w-[86rem] flex-col justify-end px-6 pb-14 md:px-10 md:pb-20">
          <p className="data load" style={{ animationDelay: "80ms" }}>
            <DecryptedText
              text="La Masia · since 2007 · right wing"
              speed={26}
              iterations={5}
              className="data"
            />
          </p>
          <h1
            className="condensed load mt-5 whitespace-nowrap text-[14.5vw] leading-[0.9]"
            style={{ animationDelay: "180ms" }}
          >
            Lamine{" "}
            <DepthText text="Yamal" className="load" />
          </h1>

          <div
            className="load mt-9 grid max-w-3xl gap-8 border-t border-white/15 pt-6 md:grid-cols-[1.4fr_1fr]"
            style={{ animationDelay: "300ms" }}
          >
            <BlurText
              as="p"
              className="text-pretty text-lg leading-relaxed text-chalk/85"
              text="Nineteen years old, and already the youngest player to win a World Cup and a European Championship. The record book did not slow him down. He kept scoring in it."
              stagger={0.045}
            />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 self-end">
              {[
                ["Born", "13 · 07 · 2007"],
                ["Position", "Right winger"],
                ["Debut", "Camp Nou, 2023"],
                ["Shirt", "19"],
              ].map(([k, v]) => (
                <div key={k} className="rule pt-2">
                  <dt className="data">{k}</dt>
                  <dd className="mono mt-1 text-sm text-chalk">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="data mt-8">
              ↓ scroll is the{" "}
              <RotatingText
                words={["camera", "timeline", "record book"]}
                className="inline-block text-chalk"
              />
            </p>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------- feed */}
      <div className="rule ticker py-3">
        <div className="ticker-track" aria-hidden>
          {[...FEED, ...FEED].map((item, i) => (
            <span key={i} className="data whitespace-nowrap text-chalk/70">
              {item} <span className="text-grana-lit">◆</span>
            </span>
          ))}
        </div>
        <span className="sr-only">{FEED.join(". ")}</span>
      </div>

      {/* ------------------------------------------------------- tally */}
      <section className="pitch relative">
        <div className="mx-auto h-[220svh] max-w-[86rem] px-6 md:px-10">
          <div className="sticky top-0 flex h-[100svh] flex-col justify-center">
            <div className="grid items-end gap-10 md:grid-cols-[auto_1fr_auto]">
              <p className="tally condensed text-[34vw] leading-[0.78] text-grana-lit sm:text-[26vw] lg:text-[20rem]" />
              <div className="pb-4 md:pb-10">
                <p className="data">Career goals · all competitions</p>
                <BlurText
                  as="p"
                  className="mt-3 max-w-xs text-pretty text-base leading-relaxed text-ash"
                  text="Fifty of them before his twentieth birthday — the youngest player in the history of Europe's big five leagues to get there."
                  stagger={0.05}
                />
              </div>
              <div className="hidden w-full max-w-[19rem] self-end pb-10 md:block">
                <p className="data">Goals per season</p>
                <ul className="mt-5 space-y-4">
                  {SEASON_GOALS.map(([season, goals]) => (
                    <li key={season}>
                      <div className="flex items-baseline justify-between">
                        <span className="data">{season}</span>
                        <span className="mono text-xs text-chalk">{goals}</span>
                      </div>
                      <div className="mt-2 h-px bg-white/15">
                        <div
                          className="h-px bg-grana-lit"
                          style={{ width: `${(goals / 24) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="data mt-10 flex items-center justify-between gap-6 border-t border-white/15 pt-4">
              Updated 19 · 09 · 2026
              <CircularText
                className="data text-gold"
                size={128}
                spin={30}
                text="LA MASIA · CAMP NOU · 19 · LA MASIA · CAMP NOU · 19 · "
              />
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ marquee */}
      <section
        aria-hidden
        className="marquee rule overflow-hidden py-8 md:py-14"
      >
        <ScrollVelocity className="block">
          <div className="marquee-track">
          {[...MARQUEE_A, ...MARQUEE_A].map((item, i) => (
            <span
              key={i}
              className={`condensed text-[13vw] leading-none sm:text-[8vw] lg:text-[6.5rem] ${
                item === "19" ? "text-grana-lit" : "text-chalk"
              }`}
            >
              {item}
              <span className="ml-10 text-gold">✦</span>
            </span>
          ))}
          </div>
          <div className="marquee-track rev mt-2 md:mt-4">
          {[...MARQUEE_B, ...MARQUEE_B].map((item, i) => (
            <span
              key={i}
              className="ghost condensed text-[9vw] leading-none sm:text-[5.6vw] lg:text-[4.5rem]"
            >
              {item}
              <span className="ml-10 text-blau-lit">◆</span>
            </span>
          ))}
          </div>
        </ScrollVelocity>
      </section>

      {/* ------------------------------------------------------- route */}
      <section id="route" className="rule">
        <div className="mx-auto max-w-[86rem] px-6 py-24 md:px-10 md:py-36">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <ScrollFloat
              className="condensed text-[13vw] sm:text-[9vw] lg:text-[7.5rem]"
              text="The route"
            />
            <p className="data md:pb-4">
              6 stops · Camp Nou → Olympiastadion → Bernabéu
            </p>
          </div>
        </div>

        {SCENES.map((s, i) => (
          <article key={s.date} className="relative">
            <div className="mx-auto h-[120svh] max-w-[86rem] px-6 md:px-10">
              <div className="sticky top-0 flex h-[100svh] items-start pt-[18svh]">
                <div className="grid w-full gap-10 border-t border-white/15 pt-8 md:grid-cols-[auto_1.4fr_1fr] md:gap-12">
                  <div className="flex items-start gap-4 md:block">
                    <span className="data beacon inline-block size-2 rounded-full bg-grana-lit" />
                    <p className="data mt-4 md:mt-8">
                      {String(i + 1).padStart(2, "0")} / {SCENES.length}
                    </p>
                    <p className="condensed mt-2 text-4xl text-white/25 md:text-5xl">
                      {s.age}
                    </p>
                  </div>

                  <div className="fly">
                    <p className="data">{s.date}</p>
                    <p className="data mt-2 text-grana-lit">{s.place}</p>
                    <SplitText
                      tag="h3"
                      text={s.head}
                      className="condensed mt-5 text-[7.4vw] leading-[0.94] sm:text-[5vw] lg:text-[3.2rem]"
                      from={{ opacity: 0, y: 34, rotateX: -55 }}
                      to={{ opacity: 1, y: 0, rotateX: 0 }}
                      delay={16}
                      duration={1.1}
                    />
                    <p className="mt-4 max-w-[46ch] text-[0.95rem] text-pretty leading-relaxed text-ash">
                      {s.body}
                    </p>
                    <p className="data mt-5 inline-block border border-white/20 px-3 py-1.5 text-chalk/80">
                      {s.tag}
                    </p>
                  </div>

                  <div className="fly-out hidden self-start md:block">
                    <div className="pitch sweep border border-white/10 p-6">
                      <p className="data">Match sheet</p>
                      <dl className="mt-4 space-y-2.5">
                        {[
                          ["Date", s.date],
                          ["Age", s.age],
                          ["Venue", s.place],
                          ["Record", s.tag],
                        ].map(([k, v]) => (
                          <div
                            key={k}
                            className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-2"
                          >
                            <dt className="data">{k}</dt>
                            <dd className="mono text-right text-xs text-chalk">
                              {v}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ----------------------------------------------------- cabinet */}
      <section id="cabinet" className="rule pitch relative">
        <div className="mx-auto max-w-[86rem] px-6 py-24 md:px-10 md:py-36">
          <div className="flex flex-wrap items-baseline justify-between gap-6">
            <ScrollFloat
              className="condensed text-[13vw] sm:text-[9vw] lg:text-[7.5rem]"
              text="The cabinet"
            />
            <p className="data">Four trophies · two of them for Spain</p>
          </div>

          <div className="reveal cv mt-16 grid gap-px bg-white/12 md:grid-cols-2">
            {TROPHIES.map((t) => (
              <div
                key={t.name}
                className={`sweep relative bg-noir p-8 md:p-12 ${
                  t.big ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-8">
                  <h3
                    className={`condensed ${t.big ? "text-[10vw] sm:text-[7vw] lg:text-[6rem]" : "text-[7vw] sm:text-[5vw] lg:text-[3.4rem]"}`}
                  >
                    {t.name}
                  </h3>
                  <span className="condensed shrink-0 text-3xl text-gold lg:text-4xl">
                    {t.year}
                  </span>
                </div>
                <ScrollReveal
                    className="mt-5 max-w-[52ch] text-pretty leading-relaxed text-ash"
                    text={t.line}
                  />
              </div>
            ))}
          </div>

          <ul className="reveal cv mt-16 grid gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-3">
            {AWARDS.map(([name, year]) => (
              <li
                key={name}
                className="sweep flex items-baseline justify-between gap-6 bg-noir px-6 py-5"
              >
                <span className="text-pretty text-chalk/90">{name}</span>
                <span className="data shrink-0 text-gold">{year}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------- numbers */}
      <section id="numbers" className="rule">
        <div className="mx-auto max-w-[86rem] px-6 py-24 md:px-10 md:py-36">
          <ScrollFloat
            className="condensed text-[13vw] sm:text-[9vw] lg:text-[7.5rem]"
            text="Numbers"
          />

          <dl className="reveal cv mt-14 grid gap-px bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
            {NUMBERS.map(([n, label]) => (
              <div key={label} className="sweep bg-noir px-6 py-8">
                <dd className="condensed text-[5.5rem] leading-none text-grana-lit lg:text-[6.5rem]">
                  <CountUp to={Number(n)} duration={1.8} />
                </dd>
                <dt className="data mt-4">{label}</dt>
              </div>
            ))}
          </dl>

          {/* no .cv here: content-visibility containment breaks baseline alignment across table cells */}
        <table className="reveal mt-16 w-full border-collapse text-left">
            <caption className="sr-only">
              Lamine Yamal appearances and goals by season, all competitions
            </caption>
            <thead>
              <tr className="rule">
                {["Season", "Apps", "Goals", "Note"].map((h) => (
                  <th key={h} scope="col" className="data py-3 pr-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SEASONS.map(([season, apps, goals, note]) => (
                <tr
                  key={season}
                  className="border-b border-white/10 transition-colors duration-300 hover:bg-white/4"
                >
                  <th
                    scope="row"
                    className="mono py-4 pr-4 text-sm font-normal text-chalk"
                  >
                    {season}
                  </th>
                  <td className="mono py-4 pr-4 text-sm text-ash">{apps}</td>
                  <td className="mono py-4 pr-4 text-sm text-chalk">{goals}</td>
                  <td className="py-4 text-pretty text-sm text-ash">{note}</td>
                </tr>
              ))}
              <tr className="border-t border-white/25">
                <th scope="row" className="mono py-4 pr-4 text-sm text-gold">
                  Career
                </th>
                <td className="mono py-4 pr-4 text-sm text-chalk">159</td>
                <td className="mono py-4 pr-4 text-sm text-chalk">57</td>
                <td className="py-4 text-pretty text-sm text-ash">
                  As of 19 · 09 · 2026
                </td>
              </tr>
            </tbody>
          </table>
          <p className="data mt-4">
            All competitions · as of 19 · 09 · 2026 · sources: FC Barcelona,
            UEFA, Wikipedia
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------ footer */}
      <footer className="pitch relative overflow-hidden">
        <p
          aria-hidden
          className="ghost condensed pointer-events-none absolute -bottom-[4vw] -left-[2vw] text-[26vw] leading-none select-none"
        >
          19
        </p>
        <div className="relative mx-auto max-w-[86rem] px-6 py-28 md:px-10 md:py-40">
          <p className="data">Next · the season is young</p>
          <p className="condensed mt-6 text-[15vw] sm:text-[12vw] lg:text-[11rem]">
            <TextPressure
              className="condensed"
              text="Més que"
              min={300}
              max={900}
            />
            <br />
            <DepthText text="un jugador" depthColor="#edbb00" />
          </p>
          <div className="rule mt-12 flex flex-wrap items-center justify-between gap-6 pt-6">
            <p className="max-w-md text-pretty leading-relaxed text-ash">
              A tribute page built from public records — FC Barcelona, UEFA and
              the record books. Not affiliated with the club.
            </p>
            <a
              href="#top"
              className="data border border-white/25 px-5 py-3 text-chalk transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              ↑ Back to the top
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
