export function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${fullScreen ? "h-screen" : "h-64"}`}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
