import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-5xl font-bold text-gray-900">404</h1>
      <h2 className="mt-2 text-2xl font-medium text-gray-700">Page Not Found</h2>
      <p className="mt-4 text-center text-gray-600">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/admin/dashboard" className="mt-6 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
        Go to Dashboard
      </Link>
    </div>
  );
}


