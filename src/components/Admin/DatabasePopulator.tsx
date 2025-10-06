import { useRef, useState } from 'react';
import { hybridStorage } from '../../lib/database/hybridStorage';
import { populateDatabaseFromDirectories, populateDatabaseFromJsonString } from '../../lib/database/populateDatabase';

interface PopulateResult {
  success: boolean;
  categoriesCreated: number;
  resourcesCreated: number;
  tagsCreated: number;
  errors: string[];
}

export function DatabasePopulator() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PopulateResult | null>(null);
  const [sourceType, setSourceType] = useState<'directory' | 'json'>('directory');
  const [jsonFilePath, setJsonFilePath] = useState('');
  const [selectedJsonName, setSelectedJsonName] = useState<string>('');
  const [selectedDirFilesCount, setSelectedDirFilesCount] = useState<number>(0);

  const jsonFileInputRef = useRef<HTMLInputElement | null>(null);
  const dirInputRef = useRef<HTMLInputElement | null>(null);

  const handlePopulate = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let populateResult: PopulateResult;

      if (sourceType === 'json') {
        // Prefer selected file over manual path
        const file = jsonFileInputRef.current?.files?.[0] || null;
        if (file) {
          const text = await file.text();
          populateResult = await populateDatabaseFromJsonString(text);
        } else {
          // Fallback to existing path-based flow (e.g., when running in Electron)
          populateResult = await populateDatabaseFromDirectories('json', jsonFilePath || undefined);
        }
      } else {
        // Directory mode: we show a folder picker; current population uses static structure
        // The selected files are not required by the current population logic, but we still open the picker
        populateResult = await populateDatabaseFromDirectories('directory');
      }
      setResult(populateResult);

      if (populateResult.success) {
        console.log('🎉 Database populated successfully!');
        console.log(`📊 Summary:
          - Categories: ${populateResult.categoriesCreated}
          - Resources: ${populateResult.resourcesCreated}
          - Tags: ${populateResult.tagsCreated}`);

        if (populateResult.errors.length > 0) {
          console.warn('⚠️ Some errors occurred:', populateResult.errors);
        }
      } else {
        console.error('❌ Database population failed:', populateResult.errors);
      }
    } catch (error) {
      console.error('💥 Critical error during population:', error);
      setResult({
        success: false,
        categoriesCreated: 0,
        resourcesCreated: 0,
        tagsCreated: 0,
        errors: [`Critical error: ${error}`],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Database Populator
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This tool will populate your local database with categories and sample resources.
          {(() => {
            const info = hybridStorage.getStorageInfo();
            if (info.type === 'localStorage') {
              return (
                <span className="block text-sm text-amber-600 dark:text-amber-400 mt-2">
                  Note: Running in browser mode with localStorage (~5-10MB). Large datasets may hit quota.
                </span>
              );
            }
            return (
              <span className="block text-sm text-emerald-600 dark:text-emerald-400 mt-2">
                Using Electron filesystem storage at {info.dataDir}. Quota is effectively the disk size.
              </span>
            );
          })()}
        </p>

        {/* Source Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Population Source
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="directory"
                checked={sourceType === 'directory'}
                onChange={(e) => setSourceType(e.target.value as 'directory' | 'json')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Directory Structure</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="json"
                checked={sourceType === 'json'}
                onChange={(e) => setSourceType(e.target.value as 'directory' | 'json')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">JSON File</span>
            </label>
          </div>
        </div>

        {/* Pickers */}
        {sourceType === 'directory' && (
        <div className="mb-6">
          <input
            ref={dirInputRef}
            type="file"
            style={{ display: 'none' }}
            {...({ webkitdirectory: true } as any)}
            multiple
            onChange={(e) => {
              const files = e.target.files;
              setSelectedDirFilesCount(files ? files.length : 0);
            }}
          />
          <button
            type="button"
            onClick={() => dirInputRef.current?.click()}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded border border-gray-300 dark:border-gray-700"
          >
            Choose Folder
          </button>
          {selectedDirFilesCount > 0 && (
            <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">{selectedDirFilesCount} files selected</span>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Select a folder. Current logic uses a predefined directory structure to populate the database.
          </p>
        </div>
        )}

        {sourceType === 'json' && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <input
              ref={jsonFileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                setSelectedJsonName(file ? file.name : '');
              }}
            />
            <button
              type="button"
              onClick={() => jsonFileInputRef.current?.click()}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded border border-gray-300 dark:border-gray-700"
            >
              Choose JSON File
            </button>
            {selectedJsonName && (
              <span className="text-sm text-gray-600 dark:text-gray-400">{selectedJsonName}</span>
            )}
          </div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or enter JSON file path (Electron only)
          </label>
          <input
            type="text"
            value={jsonFilePath}
            onChange={(e) => setJsonFilePath(e.target.value)}
            placeholder="e.g., sample-data.json"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pick a JSON file from your computer or provide a local path if running under Electron.
          </p>
        </div>
        )}

        <button
          onClick={handlePopulate}
          disabled={isLoading || (sourceType === 'json' && !selectedJsonName && !jsonFilePath.trim())}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          {isLoading ? 'Populating Database...' : `Populate from ${sourceType === 'directory' ? 'Directory' : 'JSON File'}`}
        </button>

        {result && (
          <div className="mt-6">
            <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
              {result.success ? '✅ Success!' : '❌ Failed'}
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.categoriesCreated}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.resourcesCreated}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Resources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {result.tagsCreated}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tags</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Errors:</h4>
                <div className="space-y-2">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 dark:text-red-300 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      {error.includes('quota') ? (
                        <>
                          <div className="font-medium">Storage Quota Exceeded</div>
                          <div className="mt-1">
                            Your browser's local storage is limited to ~5-10MB. The database population was partially successful,
                            creating {result.categoriesCreated} categories, {result.resourcesCreated} resources, and {result.tagsCreated} tags.
                          </div>
                          <div className="mt-2 text-xs">
                            This is normal - try clearing some browser data or use a smaller dataset for testing.
                          </div>
                        </>
                      ) : (
                        error
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
