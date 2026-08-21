// Skeleton loaders partajate: forme shimmer care imită layout-ul final, în
// locul textelor "Se încarcă..." — percepția de viteză a fintech-urilor mari.
export function Skeleton({ w = "100%", h = 14, r = "var(--radius-sm)", style }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

// Rânduri în forma listelor de acțiuni: avatar + două linii + bloc dreapta.
export function SkeletonRows({ count = 5 }) {
  return (
    <div className="sk-rows">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sk-row">
          <div className="sk sk-avatar" />
          <div className="sk-row-lines">
            <Skeleton w="38%" h={12} />
            <Skeleton w="62%" h={9} />
          </div>
          <Skeleton w={54} h={12} />
        </div>
      ))}
    </div>
  );
}

// Pagină generică în încărcare: titlu + card mare + rânduri.
export function SkeletonPage() {
  return (
    <div className="portfolio-page">
      <Skeleton w="34%" h={26} style={{ marginBottom: "0.6rem" }} />
      <Skeleton w="58%" h={13} style={{ marginBottom: "1.2rem" }} />
      <Skeleton h={130} r="var(--radius-xl)" style={{ marginBottom: "1.2rem" }} />
      <SkeletonRows count={5} />
    </div>
  );
}
