import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>Denovo AI Platform</title>
        <meta name="description" content="Denovo AI Platform" />
      </Head>
      <main data-testid="home-page" style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        <header>
          <code>Denovo AI Platform</code>
        </header>
        <h1 data-testid="hero-heading">Denovo AI</h1>
        <div data-testid="feature-cards" style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
          <div data-testid="feature-card" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h2>AI Development</h2>
            <p>Build intelligent applications with our AI development tools.</p>
          </div>
          <div data-testid="feature-card" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h2>Smart Templates</h2>
            <p>Accelerate development with AI-powered smart templates.</p>
          </div>
          <div data-testid="feature-card" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h2>Orchestration</h2>
            <p>Orchestrate complex AI workflows with ease.</p>
          </div>
          <div data-testid="feature-card" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
            <h2>Module Engine</h2>
            <p>Compose modular AI components into powerful applications.</p>
          </div>
        </div>
      </main>
    </>
  )
}
