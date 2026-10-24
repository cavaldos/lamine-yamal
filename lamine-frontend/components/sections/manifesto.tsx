const TEXT =
  "Một cậu bé từ Rocafonda. Khoác áo số 10 của Barcelona. Vô địch châu Âu năm 16 tuổi, vô địch thế giới năm 19 tuổi. Đây là kho lưu trữ mọi khoảnh khắc ấy.";

// Big statement whose words light up one by one as it scrolls through the
// viewport. Pure CSS (scroll-driven animation, see .manifesto in globals.css).
export default function Manifesto() {
  const words = TEXT.split(" ");
  return (
    <section aria-label="Giới thiệu" className="relative">
      <div className="mx-auto max-w-[1280px] border-x border-line px-6 py-28 md:px-10 md:py-40">
        <p className="manifesto max-w-5xl font-display text-3xl leading-[1.12] font-medium tracking-[-0.03em] sm:text-5xl md:text-6xl">
          {words.map((w, i) => {
            // Each word gets its own slice of the paragraph's scroll range.
            const start = 8 + (i / words.length) * 42;
            return (
              <span
                key={i}
                className="manifesto-word"
                style={{ animationRange: `cover ${start.toFixed(1)}% cover ${(start + 6).toFixed(1)}%` }}
              >
                {w}{" "}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
