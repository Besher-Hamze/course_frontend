'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-3xl font-bold text-gray-900">Something went wrong</h1>
      <p className="mt-4 text-center text-gray-600">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <div className="mt-6 flex space-x-3">
        <Button
          onClick={reset}
          variant="default"
        >
          Try again
        </Button>
        <Button
          onClick={() => window.location.href = '/admin/dashboard'}
          variant="outline"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
