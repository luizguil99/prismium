import { useNavigate } from '@remix-run/react';
import { toast } from 'react-toastify';

export default function VerifyEmail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        <div className="animate-pulse">
          <svg
            className="mx-auto h-16 w-16 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Check your email</h2>
        <p className="text-zinc-400">
          We've sent you a verification link. Please check your email to verify your account.
        </p>
        <button
          onClick={() => {
            toast.success('Please check your email to verify your account');
            navigate('/');
          }}
          className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
