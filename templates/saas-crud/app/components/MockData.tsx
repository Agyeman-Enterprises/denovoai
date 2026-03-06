type Module = { name: string; version: string; channel: string };

export function MockData({ modules }: { modules: Module[] }) {
  const hasPosts = modules.some((m) => m.name === "posts");
  const hasListings = modules.some((m) => m.name === "listings");
  const hasComments = modules.some((m) => m.name === "comments");
  const hasMedia = modules.some((m) => m.name === "media_upload");

  if (!hasPosts && !hasListings) return null;

  return (
    <section className="card">
      <h3>Sample Content</h3>
      {hasPosts && (
        <div style={{ marginBottom: 12 }}>
          <h4>Posts</h4>
          <div className="grid">
            {["Welcome!", "How to grow tomatoes", "Show your garden"].map((title, i) => (
              <div className="module" key={i}>
                <h5>{title}</h5>
                <p className="muted">by user{i + 1}</p>
                {hasComments && <p className="pill">comments enabled</p>}
                {hasMedia && <p className="pill">media uploads</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {hasListings && (
        <div>
          <h4>Listings</h4>
          <div className="grid">
            {[
              { title: "Organic basil", price: "$5" },
              { title: "Garden tools bundle", price: "$25" },
              { title: "Planter box", price: "$40" }
            ].map((item, i) => (
              <div className="module" key={i}>
                <h5>{item.title}</h5>
                <p className="muted">{item.price}</p>
                <p className="pill">orders</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
