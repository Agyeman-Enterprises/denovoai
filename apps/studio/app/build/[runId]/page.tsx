"use client"

import { useState } from "react"

export default function BuildResultPage() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="page">

      <nav className="card" aria-label="Top navigation" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontWeight:700}}>DeNovo</div>
        <div style={{display:'flex', gap:18, alignItems:'center'}}>
          <a className="view-link">Studio</a>
          <a className="view-link">My Apps</a>
          <a className="view-link">Docs</a>
        </div>
      </nav>

      <main>

        <section className="card hero">
          <div className="hero-title">Your App Is Ready</div>
          <div className="hero-sub">TodoFlow — A lightweight app for managing tasks</div>

          <div className="cta-group">
            <button className="btn-primary">Launch App</button>
            <button className="btn-ghost">Preview</button>
            <button className="btn-ghost">Export Code</button>
          </div>
        </section>

        <section className="card">
          <div className="muted">TodoFlow — Live Preview</div>
          <div className="preview-box" role="region" aria-label="App preview">App preview will render here</div>
        </section>

        <section className="card">
          <h3>Capabilities Installed</h3>
          <div className="capabilities-grid">
            {[
              ["Authentication", "Secure login system"],
              ["Task Management", "Create and organize tasks"],
              ["Notifications", "Reminder alerts"],
              ["Analytics", "Usage insights"],
              ["Settings", "Application configuration"],
              ["User Profiles", "Account management"]
            ].map(([title, desc]) => (
              <div key={title} className="capability-card">
                <h3>{title}</h3>
                <p className="muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>How DeNovo Built Your App</h3>
          <div className="timeline">
            {[
              "Request interpreted",
              "Architecture selected",
              "Modules assembled",
              "Interface generated",
              "System tested",
              "Application deployed"
            ].map((step) => (
              <div key={step} className="timeline-step">
                <div className="dot" aria-hidden/>
                <div>{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{textAlign:'center'}}>
          <div className="cta-group" style={{justifyContent:'center'}}>
            <button className="btn-primary">Launch App</button>
            <button className="btn-ghost">Dashboard</button>
            <button className="btn-ghost">Export Code</button>
          </div>
        </section>

        <section className="card">
          <button onClick={() => setShowDetails(!showDetails)} className="view-link">
            {showDetails ? "Hide technical details" : "View technical details"}
          </button>

          {showDetails && (
            <div className="artifact-view" style={{marginTop:12}}>
              <pre className="json-display">{
`{
  "app_name": "TodoFlow",
  "mode": "utility_app",
  "features": ["tasks", "notifications"],
  "deployment": "vercel"
}`
              }</pre>
            </div>
          )}
        </section>

      </main>

      <footer className="muted" style={{textAlign:'center', padding:'28px 0'}}>DeNovo — Build software instantly</footer>
    </div>
  )
}
