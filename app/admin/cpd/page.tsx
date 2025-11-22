'use client';

import { Construction } from 'lucide-react';

export default function AdminCPDPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CPD Article Management</h1>
        <p className="mt-2 text-gray-600">
          Manage professional development resources
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Construction className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6">
          CPD management feature is under development. You'll be able to:
        </p>
        <ul className="text-left max-w-md mx-auto space-y-2 text-gray-700">
          <li>• Create CPD articles and courses</li>
          <li>• Set subscription tier requirements</li>
          <li>• Track user progress and completions</li>
          <li>• Issue CPD certificates</li>
          <li>• Organize by topic and level</li>
        </ul>
      </div>
    </div>
  );
}

