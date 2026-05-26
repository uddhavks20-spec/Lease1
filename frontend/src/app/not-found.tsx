export default function NotFound() {
  return (
    <div className="container py-32 text-center space-y-8">
      <div className="text-9xl font-black text-gray-200 dark:text-gray-800">404</div>
      <h1 className="text-4xl font-black text-gray-900 dark:text-white">Page not found</h1>
      <p className="text-gray-500 max-w-md mx-auto">This page doesn&apos;t exist or has been moved.</p>
      <a href="/" className="inline-flex h-12 px-8 items-center justify-center rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all">
        Back to Home
      </a>
    </div>
  )
}