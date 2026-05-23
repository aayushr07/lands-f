"use client";

import { useSession } from 'next-auth/react';

export default function Profile() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
      {session ? (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-center">Profile</h1>
          <div className="border-b mb-4 pb-4">
            <p className="text-lg"><strong>Name:</strong> {session.user.name}</p>
            <p className="text-lg"><strong>Email:</strong> {session.user.email}</p>
          </div>
          <h2 className="text-xl font-semibold mb-2">Options</h2>
          <div className="space-y-4">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition duration-200">
              View Transactions
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-md transition duration-200">
              Booking History
            </button>
          </div>
        </div>
      ) : (
        <p className="text-lg">Please log in to see your profile.</p>
      )}
    </div>
  );
}
