'use client';

import { useState } from 'react';
import { searchModules, quickSearchModules, searchModulesAll, getModuleDetails } from '@/shared/api/catalogue';
import { Module, PaginatedResponse } from '@/shared/api/types';

export default function ModuleTestPage() {
  const [searchResults, setSearchResults] = useState<PaginatedResponse<Module> | null>(null);
  const [quickResults, setQuickResults] = useState<{ data: Module[] } | null>(null);
  const [searchAllResults, setSearchAllResults] = useState<{ data: Module[] } | null>(null);
  const [moduleDetails, setModuleDetails] = useState<{ data: Module } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testFullSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await searchModules({
        search: 'algorithm',
        page: 1,
        limit: 5,
        sortBy: 'code',
        sortOrder: 'asc'
      });
      setSearchResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testQuickSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await quickSearchModules('SC', 10);
      setQuickResults(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testSearchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await searchModulesAll('machine learning', 10);
      setSearchAllResults(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const testModuleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getModuleDetails('SC2001');
      setModuleDetails(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Backend API Integration Test</h1>

      {loading && (
        <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
          Loading...
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Full Search Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">1. Full Module Search (GET /api/modules)</h2>
          <button
            onClick={testFullSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            Test Search (search=&apos;algorithm&apos;, limit=5)
          </button>
          {searchResults && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(searchResults, null, 2)}
              </pre>
              <p className="mt-2 text-sm text-gray-600">
                Found {searchResults.pagination?.total} modules, showing page {searchResults.pagination?.page}
              </p>
            </div>
          )}
        </div>

        {/* Quick Search Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">2. Quick Search - Code & Title Only (GET /api/modules/search)</h2>
          <p className="text-sm text-gray-600 mb-3">Searches only module code and name - faster, more precise</p>
          <button
            onClick={testQuickSearch}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            Test Quick Search (q=&apos;SC&apos;, limit=10)
          </button>
          {quickResults && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(quickResults, null, 2)}
              </pre>
              <p className="mt-2 text-sm text-gray-600">
                Found {quickResults.data?.length} modules
              </p>
            </div>
          )}
        </div>

        {/* Search All Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">3. Deep Search - Including Descriptions (GET /api/modules/search-all)</h2>
          <p className="text-sm text-gray-600 mb-3">Searches code, title, AND description - comprehensive results</p>
          <button
            onClick={testSearchAll}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            disabled={loading}
          >
            Test Search All (q=&apos;machine learning&apos;, limit=10)
          </button>
          {searchAllResults && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(searchAllResults, null, 2)}
              </pre>
              <p className="mt-2 text-sm text-gray-600">
                Found {searchAllResults.data?.length} modules (includes description matches)
              </p>
            </div>
          )}
        </div>

        {/* Module Details Test */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">4. Module Details (GET /api/modules/:code)</h2>
          <button
            onClick={testModuleDetails}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            disabled={loading}
          >
            Test Get Details (code=&apos;SC2001&apos;)
          </button>
          {moduleDetails && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Results:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(moduleDetails, null, 2)}
              </pre>
              <div className="mt-2 text-sm text-gray-600">
                <p><strong>Code:</strong> {moduleDetails.data?.code}</p>
                <p><strong>Name:</strong> {moduleDetails.data?.name}</p>
                <p><strong>AU:</strong> {moduleDetails.data?.au}</p>
                <p><strong>School:</strong> {moduleDetails.data?.school}</p>

              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Make sure backend is running on http://localhost:3000</li>
          <li>Click each test button above</li>
          <li>Check that results appear without errors</li>
          <li>Verify the JSON responses match backend format</li>
        </ol>
      </div>
    </div>
  );
}
