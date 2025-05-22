export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Landing Page Analyzer
        </h1>
        <p className="text-gray-600 mb-8">
          Analyze your landing page against best-practice criteria
        </p>
        <a
          href="/tool"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Analysis
        </a>
      </div>
    </main>
  )
}