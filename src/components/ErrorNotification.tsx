interface ErrorNotificationProps {
  error: string
  onReset: () => void
}

export default function ErrorNotification({ error, onReset }: ErrorNotificationProps) {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="border border-red-700 rounded-lg p-6" style={{ backgroundColor: 'var(--color-bg-card)' }}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-200">
              Analysis Failed
            </h3>
            <div className="mt-2 text-sm text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={onReset}
                className="bg-red-700 text-red-100 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}