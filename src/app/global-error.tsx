"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#faf7f2", color: "#1d1b18", margin: 0 }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 600 }}>MyTailor is having a moment</h1>
            <p style={{ color: "#6b6358", marginTop: 12 }}>Something went wrong on our side. Please try again.</p>
            <button
              onClick={reset}
              style={{ marginTop: 24, height: 44, padding: "0 22px", borderRadius: 999, border: 0, background: "#1d1b18", color: "#faf7f2", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
