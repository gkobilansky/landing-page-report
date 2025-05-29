interface CacheNotificationProps {
  onForceRescan: () => void
  isLoading: boolean
}

export default function CacheNotification({ onForceRescan, isLoading }: CacheNotificationProps) {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-blue-200 text-sm">
                Returning cached result, since we already scanned this URL today
              </p>
            </div>
          </div>
          <button
            onClick={onForceRescan}
            disabled={isLoading}
            className="ml-4 px-4 py-2 bg-blue-600 text-blue-100 rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Force Rescan
          </button>
        </div>
      </div>
    </div>
  )
}