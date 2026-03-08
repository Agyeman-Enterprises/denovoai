export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center lg:text-left">
          DeNovo AI Platform
        </h1>
      </div>

      <div className="relative flex place-items-center">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-semibold">
            AI-Powered Development Platform
          </h2>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Building applications with intelligent automation
          </p>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            Studio
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Visual development environment
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            Orchestrator
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Automated workflow management
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            Templates
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Pre-built project templates
          </p>
        </div>

        <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
          <h3 className="mb-3 text-2xl font-semibold">
            Analytics
          </h3>
          <p className="m-0 max-w-[30ch] text-sm opacity-50">
            Performance insights and metrics
          </p>
        </div>
      </div>
    </main>
  )
}

