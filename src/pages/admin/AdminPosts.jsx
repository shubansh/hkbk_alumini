import { MessageSquare, AlertCircle } from 'lucide-react';

export default function AdminPosts() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm text-center max-w-md">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Posts Management</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          The forum and posts management system is currently under development. This module will allow you to moderate discussions and community updates.
        </p>
        <div className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-4 py-2 rounded-full">
          <AlertCircle className="w-4 h-4" /> Coming in next update
        </div>
      </div>
    </div>
  );
}
