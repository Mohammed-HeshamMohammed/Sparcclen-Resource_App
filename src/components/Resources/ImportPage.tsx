import { useState } from 'react';
import {
  Brain,
  Globe,
  FlaskConical,
  BookOpen,
  Wrench,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { notify } from '@/lib/toast';

type CategoryType = 'ai-and-ml' | 'web-and-design' | 'rnd' | 'studying' | 'tools';
type SubcategoryType = string;

interface Subcategory {
  id: SubcategoryType;
  label: string;
  description: string;
}

const subcategories: Record<CategoryType, Subcategory[]> = {
  'ai-and-ml': [
    { id: 'tools', label: 'Tools', description: 'AI and ML development tools and frameworks' },
    { id: 'guides', label: 'Guides', description: 'Tutorials and guides for AI/ML concepts' },
    { id: 'offline-llms', label: 'Free Offline LLMs', description: 'Free offline Large Language Models content' },
    { id: 'training-ml', label: 'Training ML', description: 'Machine learning training materials and courses' },
    { id: 'vision', label: 'Vision', description: 'Computer vision and image processing resources' }
  ],
  'web-and-design': [
    { id: 'colors', label: 'Colors', description: 'Color palettes and design systems' },
    { id: 'mockups', label: 'Mockups', description: 'Website and app mockup templates' },
    { id: 'ui-ux-plugins', label: 'UI/UX Plugins', description: 'Design plugins and extensions' },
    { id: 'tools', label: 'Tools', description: 'Web development and design tools' },
    { id: 'fonts', label: 'Fonts', description: 'Typography and font collections' },
    { id: 'library', label: 'Library', description: 'Design assets and component libraries' }
  ],
  rnd: [
    { id: 'research-papers', label: 'Research Papers', description: 'Academic research papers and publications' },
    { id: 'innovation', label: 'Innovation', description: 'Innovation methodologies and frameworks' }
  ],
  studying: [
    { id: 'books', label: 'Books', description: 'Educational books and textbooks' },
    { id: 'roadmaps', label: 'Roadmaps', description: 'Learning paths and study roadmaps' },
    { id: 'youtube-videos', label: 'YouTube Videos', description: 'Educational video content' }
  ],
  tools: [
    { id: 'editing', label: 'Editing', description: 'Content editing and processing tools' },
    { id: 'video-generation', label: 'Video Generation', description: 'AI-powered video creation tools' }
  ]
};

const categories = [
  {
    id: 'ai-and-ml' as CategoryType,
    label: 'AI & ML',
    icon: Brain,
    description: 'AI and machine learning resources, tools, and guides.'
  },
  {
    id: 'web-and-design' as CategoryType,
    label: 'Web & Design',
    icon: Globe,
    description: 'Web development and design assets, tools, and libraries.'
  },
  {
    id: 'rnd' as CategoryType,
    label: 'RnD',
    icon: FlaskConical,
    description: 'Research papers, innovation frameworks, and experimental work.'
  },
  {
    id: 'studying' as CategoryType,
    label: 'Studying',
    icon: BookOpen,
    description: 'Educational books, learning roadmaps, and video content.'
  },
  {
    id: 'tools' as CategoryType,
    label: 'Tools',
    icon: Wrench,
    description: 'Development tools for editing and content creation.'
  }
];

const requiredFields = [
  { key: 'title', description: 'Resource title' },
  { key: 'description', description: 'Brief description' },
  { key: 'url', description: 'Valid URL to resource' }
];

const optionalFields = [
  { key: 'tags', description: 'Array of tags' },
  { key: 'difficulty', description: 'Skill level' },
  { key: 'estimatedTime', description: 'Time estimate' },
  { key: 'author', description: 'Resource creator' },
  { key: 'language', description: 'Language code' },
  { key: 'thumbnail', description: 'Thumbnail image URL' },
  { key: 'subcategory', description: 'Subcategory (auto-assigned if omitted)' },
  { key: 'category', description: 'Category (auto-assigned if omitted)' }
];

type ImportedRecord = Record<string, unknown> & { uuid: string };

interface ConfirmationModal {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'normal' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ImportPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ai-and-ml');
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryType>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCeoImporting, setIsCeoImporting] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal | null>(null);

  const selectedCategoryInfo = categories.find(cat => cat.id === selectedCategory);
  const SelectedIcon = selectedCategoryInfo?.icon;
  const activeSubcategories = subcategories[selectedCategory] ?? [];
  const selectedSubcategoryInfo = selectedSubcategory
    ? activeSubcategories.find(sub => sub.id === selectedSubcategory)
    : undefined;
  const hasSubcategories = activeSubcategories.length > 0;

  const sanitizeFolderSegment = (label: string) =>
    label
      .replace(/&/g, 'and')
      .replace(/[:*?"<>|]/g, '')
      .replace(/[/\\]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim() || 'General';

  const sanitizeFileStem = (label: string) =>
    label
      .replace(/&/g, 'and')
      .replace(/[:*?"<>|]/g, '')
      .replace(/[/\\]+/g, '-')
      .replace(/\s+/g, '-')
      .trim()
      .toLowerCase() || 'library';

  const generateUuid = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `uuid-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  };

  const processImagesInEntry = async (entry: Record<string, unknown>, sourceDir: string): Promise<Record<string, unknown>> => {
    const processedEntry = { ...entry };
    const imageFields = ['screen', 'screenshot', 'thumbnail'];
    
    for (const field of imageFields) {
      const imagePath = entry[field];
      if (typeof imagePath === 'string' && imagePath.trim()) {
        try {
          const imageResult = await window.api!.resources.readImageAsBase64(sourceDir, imagePath);
          if (imageResult.ok && imageResult.base64Data && imageResult.mimeType) {
            // Replace the path with base64 data URL
            processedEntry[field] = `data:${imageResult.mimeType};base64,${imageResult.base64Data}`;
          } else {
            console.warn(`Failed to load image ${imagePath}:`, imageResult.error);
            // Keep the original path if image loading fails
          }
        } catch (error) {
          console.warn(`Error processing image ${imagePath}:`, error);
          // Keep the original path if there's an error
        }
      }
    }
    
    return processedEntry;
  };

  const showConfirmationDialog = (modal: Omit<ConfirmationModal, 'isOpen' | 'onCancel'>) => {
    setConfirmationModal({
      ...modal,
      isOpen: true,
      onCancel: () => setConfirmationModal(null),
    });
  };

  const proceedWithNormalImport = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Pick and parse JSON file
      const filePickResult = await window.api!.resources.pickJsonFile();
      if (!filePickResult || filePickResult.canceled) {
        return;
      }

      if (!filePickResult.data) {
        throw new Error(filePickResult.error || 'No data was returned from the selected file.');
      }

      const parsedJson = JSON.parse(filePickResult.data);
      
      // Step 2: Normalize JSON to array format
      const normalizeToArray = (value: unknown): Record<string, unknown>[] => {
        if (Array.isArray(value)) return value;
        if (value && typeof value === 'object') {
          const obj = value as Record<string, unknown>;
          if (Array.isArray(obj.entries)) return obj.entries;
          return [obj];
        }
        throw new Error('JSON must contain an object or array of objects.');
      };

      const rawEntries = normalizeToArray(parsedJson);
      
      // Step 3: Process entries, add UUIDs, and embed images
      const sourceDir = filePickResult.filePath ? filePickResult.filePath.replace(/[/\\][^/\\]*$/, '') : '';
      const processedEntries: ImportedRecord[] = [];
      
      for (let index = 0; index < rawEntries.length; index++) {
        const entry = rawEntries[index];
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          throw new Error(`Entry ${index + 1} must be a JSON object.`);
        }
        
        const record = entry as Record<string, unknown>;
        const existingUuid = typeof record.uuid === 'string' ? record.uuid.trim() : '';
        
        // Process images in the entry
        const entryWithImages = await processImagesInEntry(record, sourceDir);
        
        processedEntries.push({
          ...entryWithImages,
          uuid: existingUuid || generateUuid(),
        } as ImportedRecord);
      }
      
      // Step 4: Generate target file path
      const categorySegment = sanitizeFolderSegment(selectedCategoryInfo?.label ?? selectedCategory);
      const folderSegments = ['library', categorySegment];
      if (selectedSubcategoryInfo) {
        folderSegments.push(sanitizeFolderSegment(selectedSubcategoryInfo.label));
      }
      
      const sourceName = filePickResult.fileName ?? 'library.json';
      const fileStem = sanitizeFileStem(sourceName.replace(/\.[^.]+$/, ''));
      const targetFileName = `${fileStem || 'library'}.bin`;
      
      // Step 5: Load existing entries from target .bin file (if it exists)
      let existingEntries: Record<string, unknown>[] = [];
      
      // Use the same folder segments for listing as we do for saving
      const listParams = {
        category: categorySegment, // Use display name, not ID
        subcategory: selectedSubcategoryInfo ? sanitizeFolderSegment(selectedSubcategoryInfo.label) : null
      };
      
      const existingBinsResult = await window.api!.resources.listLibraryBins(listParams);
      
      if (existingBinsResult?.ok) {
        const targetBinFile = existingBinsResult.files.find(file => file.fileName === targetFileName);
        if (targetBinFile?.items) {
          existingEntries = targetBinFile.items as Record<string, unknown>[];
        }
      }
      
      // Step 6: Detect duplicates by title
      const existingTitles = new Set(
        existingEntries
          .map(entry => typeof entry.title === 'string' ? entry.title.toLowerCase().trim() : '')
          .filter(Boolean)
      );
      
      const uniqueEntries: ImportedRecord[] = [];
      let duplicatesFound = 0;
      
      for (const entry of processedEntries) {
        const title = typeof entry.title === 'string' ? entry.title.toLowerCase().trim() : '';
        
        if (title && existingTitles.has(title)) {
          duplicatesFound++;
        } else {
          uniqueEntries.push(entry);
          // Add to existing titles set to prevent duplicates within the same import
          if (title) existingTitles.add(title);
        }
      }
      
      // Step 7: Handle case where no new entries to add
      if (uniqueEntries.length === 0) {
        const message = duplicatesFound > 0 
          ? `All ${duplicatesFound} ${duplicatesFound === 1 ? 'resource was a' : 'resources were'} duplicate${duplicatesFound === 1 ? '' : 's'} and skipped`
          : 'No resources to import';
          
        const title = duplicatesFound > 0 
          ? `Import Complete • ${duplicatesFound} Duplicate${duplicatesFound === 1 ? '' : 's'} Detected`
          : 'Import Complete';
          
        notify.warning(message, { title, duration: 6000 });
        return;
      }
      
      // Step 8: Save combined entries (existing + new unique entries)
      const allEntries = [...existingEntries, ...uniqueEntries];
      const payload = JSON.stringify(allEntries, null, 2);
      
      const saveResult = await window.api!.resources.saveLibraryBin(folderSegments, targetFileName, payload);
      
      if (!saveResult?.ok) {
        throw new Error(saveResult.error || 'Failed to save the library file.');
      }
      
      // Step 9: Show success notification
      let successMessage = `Successfully imported ${uniqueEntries.length} ${uniqueEntries.length === 1 ? 'resource' : 'resources'}`;
      let toastTitle = 'Import Complete';
      
      if (duplicatesFound > 0) {
        successMessage += ` • ${duplicatesFound} ${duplicatesFound === 1 ? 'duplicate' : 'duplicates'} detected and skipped`;
        toastTitle = `Import Complete • ${duplicatesFound} Duplicate${duplicatesFound === 1 ? '' : 's'} Skipped`;
      }
      
      notify.success(successMessage, {
        title: toastTitle,
        duration: 6000
      });
      
      // Success message handled by toast notification
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error during import.';
      notify.error(message, {
        title: 'Import Failed',
        duration: 8000
      });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    // Validation checks
    if (!selectedCategory) {
      notify.warning('Please select a category first', {
        title: 'Category Required',
        duration: 5000
      });
      return;
    }

    if (hasSubcategories && !selectedSubcategory) {
      notify.warning('Please choose a subcategory before importing', {
        title: 'Subcategory Required',
        duration: 5000
      });
      setError('Please choose a subcategory before importing.');
      return;
    }

    if (typeof window === 'undefined' || !window.api?.resources) {
      notify.error('Imports are only available in the desktop application', {
        title: 'Desktop App Required',
        duration: 6000
      });
      return;
    }

    // Show confirmation dialog
    const categoryName = selectedCategoryInfo?.label ?? selectedCategory;
    const subcategoryName = selectedSubcategoryInfo?.label ?? '';
    const location = subcategoryName ? `${categoryName} > ${subcategoryName}` : categoryName;
    
    showConfirmationDialog({
      title: 'Confirm Import',
      message: `Import resources to "${location}"?\n\n• New resources will be added to the existing list\n• Duplicate resources (by title) will be automatically skipped\n• This action cannot be undone`,
      confirmText: 'Import Resources',
      cancelText: 'Cancel',
      variant: 'normal',
      onConfirm: () => {
        setConfirmationModal(null);
        proceedWithNormalImport();
      },
    });
  };

  const proceedWithSystemImport = async () => {
    setError(null);
    setIsCeoImporting(true);

    try {
      const filePickResult = await window.api!.resources.pickJsonFile();
      if (!filePickResult || filePickResult.canceled) {
        return;
      }

      if (!filePickResult.data) {
        throw new Error(filePickResult.error || 'No data was returned from the selected file.');
      }

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(filePickResult.data);
      } catch {
        throw new Error('The selected file is not valid JSON.');
      }

      const normalizeToArray = (value: unknown): Record<string, unknown>[] => {
        if (Array.isArray(value)) {
          return value as Record<string, unknown>[];
        }
        if (value && typeof value === 'object') {
          const candidate = value as Record<string, unknown>;
          if (Array.isArray(candidate.entries)) {
            return candidate.entries as Record<string, unknown>[];
          }
          return [candidate];
        }
        throw new Error('The JSON file must contain an object or an array of objects.');
      };

      // Process entries with image embedding
      const sourceDir = filePickResult.filePath ? filePickResult.filePath.replace(/[/\\][^/\\]*$/, '') : '';
      const rawEntries = normalizeToArray(parsedJson);
      const entries = [];
      
      for (let index = 0; index < rawEntries.length; index++) {
        const entry = rawEntries[index];
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          throw new Error(`Entry ${index + 1} must be a JSON object.`);
        }
        
        const record = entry as Record<string, unknown>;
        const existingUuid = typeof record.uuid === 'string' ? record.uuid.trim() : '';
        
        // Process images in the entry
        const entryWithImages = await processImagesInEntry(record, sourceDir);
        
        entries.push({
          ...entryWithImages,
          uuid: existingUuid || generateUuid(),
        });
      }

      const payload = JSON.stringify(entries, null, 2);

      const categorySegment = sanitizeFolderSegment(selectedCategoryInfo?.label ?? selectedCategory);
      const folderSegments = ['library', categorySegment];
      if (selectedSubcategoryInfo) {
        folderSegments.push(sanitizeFolderSegment(selectedSubcategoryInfo.label));
      }

      const sourceName = filePickResult.fileName ?? 'library.json';
      const fileStem = sanitizeFileStem(sourceName.replace(/\.[^.]+$/, ''));
      const outputFileName = `${fileStem || 'library'}.bin`;
      const saveResult = await window.api!.resources.saveLibraryBin(folderSegments, outputFileName, payload);
      if (!saveResult?.ok) {
        throw new Error(saveResult?.error || 'Failed to save the library file.');
      }

      // Success notification - top positioned for system import
      notify.success(`Successfully imported ${entries.length} ${entries.length === 1 ? 'resource' : 'resources'}`, {
        title: 'System Import Complete',
        duration: 6000,
        position: 'top-right'
      });
      // Success message handled by toast notification
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error during system import.';
      
      // Error notification - top positioned for system import
      notify.error(message, {
        title: 'System Import Failed',
        duration: 8000,
        position: 'top-right'
      });
      setError(message);
    } finally {
      setIsCeoImporting(false);
    }
  };

  const handleCeoImport = async () => {
    // Validation: Category selection
    if (!selectedCategory) {
      notify.warning('Please select a category first', {
        title: 'Category Required',
        duration: 5000,
        position: 'top-right'
      });
      return;
    }

    // Validation: Subcategory selection (if required)
    if (hasSubcategories && !selectedSubcategory) {
      notify.warning('Please choose a subcategory before importing', {
        title: 'Subcategory Required',
        duration: 5000,
        position: 'top-right'
      });
      return;
    }

    // Validation: Desktop app check
    if (typeof window === 'undefined' || !window.api?.resources) {
      notify.error('System imports are only available in the desktop application', {
        title: 'Desktop App Required',
        duration: 6000,
        position: 'top-right'
      });
      return;
    }

    // Show confirmation dialog
    const categoryName = selectedCategoryInfo?.label ?? selectedCategory;
    const subcategoryName = selectedSubcategoryInfo?.label ?? '';
    const location = subcategoryName ? `${categoryName} > ${subcategoryName}` : categoryName;
    
    showConfirmationDialog({
      title: '⚠️ System Import Warning',
      message: `This will COMPLETELY RESET all existing resources in "${location}"!\n\n• All current resources in this category/subcategory will be DELETED\n• Only the new imported resources will remain\n• This action is IRREVERSIBLE\n\nAre you absolutely sure you want to proceed?`,
      confirmText: 'Yes, Reset Everything',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: () => {
        setConfirmationModal(null);
        proceedWithSystemImport();
      },
    });
  };

  return (
    <div className="h-full app-page-surface flex flex-col">
      {/* Fixed Header */}
      <div className="px-6 py-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Import Resources</h1>
        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-4xl mb-8">
          Import curated resources with a guided workflow. Choose the destination category, refine with a subcategory, and upload JSON that follows the required schema to keep your collection consistent.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-6 py-8 space-y-20 max-w-7xl mx-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
            <div className="flex h-full flex-col gap-4 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-200">
                  {SelectedIcon ? <SelectedIcon className="h-6 w-6" /> : <CheckCircle className="h-6 w-6 text-blue-500" />}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Current selection</p>
                  <p className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                    {selectedCategoryInfo?.label ?? 'Choose a category'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-700/80 dark:text-blue-200/70">
                {selectedCategoryInfo ? (
                  hasSubcategories ? (
                    selectedSubcategoryInfo ? (
                      <>Subcategory: {selectedSubcategoryInfo.label}</>
                    ) : (
                      'Select a subcategory to narrow the import.'
                    )
                  ) : (
                    'This category does not require a subcategory.'
                  )
                ) : (
                  'Start by selecting a category below.'
                )}
              </p>
            </div>
            <div className="flex h-full flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Process overview</p>
              <div className="mt-3 space-y-3 text-sm leading-5 text-slate-600 dark:text-slate-300">
                {['Choose a category to define where the resources belong.', 'Refine with a subcategory or confirm that none is needed.', 'Prepare JSON that matches the schema and import.'].map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span><strong className="font-semibold">Step {idx + 1}.</strong> {text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Category Selection</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="max-w-7xl mx-auto">
              <div className="rounded-3xl border-2 border-gray-200 bg-white p-10 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 1</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Choose a category</h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-white">Pick the resource family that best matches the content you plan to import.</p>
                  </div>
                  <span className="self-start rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200">
                    {selectedCategoryInfo?.label ?? 'Not selected'}
                  </span>
                </div>
                <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map(category => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <label
                        key={category.id}
                        className={`group relative flex items-start gap-4 rounded-2xl border-2 p-6 transition-all duration-200 ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 dark:border-blue-500 dark:bg-blue-900/30'
                            : 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={isActive}
                          onChange={e => {
                            setSelectedCategory(e.target.value as CategoryType);
                            setSelectedSubcategory('');
                            setError(null);
                          }}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-4">
                          <Icon className={`h-14 w-14 transition-colors duration-200 ${
                            isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-200'
                          }`} />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-slate-900 dark:text-white">{category.label}</span>
                              {isActive && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">Selected</span>}
                            </div>
                            <p className="text-sm leading-relaxed text-slate-600 transition-colors duration-200 dark:text-slate-300">{category.description}</p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Import & Validation</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
              <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 2</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Refine the focus</h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-white">Pick a subcategory to keep your resources organized.</p>
                  </div>
                  <span className="self-start rounded-full border border-purple-200/70 bg-purple-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-600 dark:border-purple-700/60 dark:bg-purple-900/30 dark:text-purple-200">
                    {selectedSubcategoryInfo?.label ?? (hasSubcategories ? 'None selected' : 'Not required')}
                  </span>
                </div>

                {hasSubcategories ? (
                  <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {activeSubcategories.map(subcategory => {
                      const isActive = selectedSubcategory === subcategory.id;
                      return (
                        <label
                          key={subcategory.id}
                          className={`group relative flex flex-col gap-3 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/10 dark:border-purple-500 dark:bg-purple-900/30'
                              : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-500/40'
                          }`}
                        >
                          <input
                            type="radio"
                            name="subcategory"
                            value={subcategory.id}
                            checked={isActive}
                            onChange={e => {
                              setSelectedSubcategory(e.target.value);
                              setError(null);
                            }}
                            className="sr-only"
                          />
                          <div className="flex items-center justify-between gap-3">
                            <span className={`text-sm font-semibold ${isActive ? 'text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'}`}>
                              {subcategory.label}
                            </span>
                            {isActive ? (
                              <CheckCircle className="h-5 w-5 text-purple-500" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-300 transition-colors duration-200 group-hover:bg-purple-400 dark:bg-slate-600 dark:group-hover:bg-purple-400"></span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{subcategory.description}</p>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-7 text-center dark:border-gray-600 dark:bg-gray-900">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">No subcategories required</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This category currently imports everything at the top level. You can proceed directly to the JSON upload.</p>
                  </div>
                )}

                {selectedSubcategoryInfo && (
                  <div className="mt-6 flex justify-center">
                    <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 text-sm text-purple-700 dark:border-purple-600/70 dark:bg-purple-900/40 dark:text-purple-100">
                      You will import resources into <strong>{selectedSubcategoryInfo.label}</strong> under <strong>{selectedCategoryInfo?.label}</strong>.
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 3</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Prepare your JSON</h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-white">Use the schema template. You can upload arrays with multiple resources at once.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                  <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-track]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-500">
                    <span className="text-blue-600 dark:text-blue-400">[</span>{'\n'}
                    <span className="text-gray-600 dark:text-gray-400 ml-2">{`{`}</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"title": </span><span className="text-green-600 dark:text-green-400">"Introduction to Machine Learning"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"description": </span><span className="text-green-600 dark:text-green-400">"Comprehensive guide to ML basics with hands-on examples"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"url": </span><span className="text-green-600 dark:text-green-400">"https://example.com/ml-intro"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"tags": </span><span className="text-blue-600 dark:text-blue-400">[</span><span className="text-green-600 dark:text-green-400">"machine-learning"</span><span className="text-gray-600 dark:text-gray-400">, </span><span className="text-green-600 dark:text-green-400">"python"</span><span className="text-blue-600 dark:text-blue-400">]</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"difficulty": </span><span className="text-green-600 dark:text-green-400">"Beginner"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"estimatedTime": </span><span className="text-green-600 dark:text-green-400">"2 hours"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"author": </span><span className="text-green-600 dark:text-green-400">"Dr. Sarah Chen"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"language": </span><span className="text-green-600 dark:text-green-400">"en"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"thumbnail": </span><span className="text-green-600 dark:text-green-400">"https://example.com/ml-thumb.jpg"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"subcategory": </span><span className="text-green-600 dark:text-green-400">"guides"</span><span className="text-gray-600 dark:text-gray-400">,</span>{'\n'}
                    <span className="text-purple-600 dark:text-purple-400 ml-4">"category": </span><span className="text-green-600 dark:text-green-400">"ai-and-ml"</span>{'\n'}
                    <span className="text-gray-600 dark:text-gray-400 ml-2">{`}`}</span>{'\n'}
                    <span className="text-blue-600 dark:text-blue-400">]</span>
                  </pre>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                  <button
                    onClick={handleImport}
                    disabled={(hasSubcategories && !selectedSubcategory) || isLoading}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-lg font-semibold transition-all duration-200 ${
                      (hasSubcategories && !selectedSubcategory) || isLoading
                        ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white shadow-lg shadow-blue-600/20 hover:-translate-y-px hover:shadow-xl'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Importing…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6" />
                        <span>Import resources</span>
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Schema Validation</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 4</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Match the schema</h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-white">Validate each resource against the required and optional fields.</p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-8 xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 to-red-600"></div>
                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Required fields</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {requiredFields.map(field => (
                      <div key={field.key} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50/90 via-white to-red-50/80 p-5 shadow-lg ring-2 ring-red-400/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:ring-red-500 hover:scale-[1.02] dark:from-red-950/40 dark:via-gray-900 dark:to-red-950/30 dark:ring-red-600/60 dark:hover:ring-red-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-500/5 to-transparent opacity-50"></div>
                        <div className="relative flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="inline-flex items-center rounded-full bg-red-500/15 px-3 py-1 text-sm font-semibold text-red-700 dark:bg-red-400/15 dark:text-red-300 text-left">
                              {field.key}
                            </div>
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 break-words text-left">{field.description}</p>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 transition-all duration-300 group-hover:bg-red-500/25 group-hover:scale-110 dark:bg-red-400/15 dark:group-hover:bg-red-400/25 flex-shrink-0">
                            <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400"></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Optional fields</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {optionalFields.map(field => (
                      <div key={field.key} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-blue-50/80 p-5 shadow-lg ring-2 ring-blue-400/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:ring-blue-500 hover:scale-[1.02] dark:from-blue-950/40 dark:via-gray-900 dark:to-blue-950/30 dark:ring-blue-600/60 dark:hover:ring-blue-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-transparent opacity-50"></div>
                        <div className="relative flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 text-left">
                              {field.key}
                            </div>
                            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 break-words text-left">{field.description}</p>
                          </div>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15 transition-all duration-300 group-hover:bg-blue-500/25 group-hover:scale-110 dark:bg-blue-400/15 dark:group-hover:bg-blue-400/25 flex-shrink-0">
                            <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Additional Resources</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
              <div className="rounded-3xl border-l-4 border-amber-400 bg-white p-8 shadow-lg dark:border-amber-500/70 dark:bg-gray-900">
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200">Helpful tips</h3>
                <p className="mt-2 text-sm text-amber-800/90 dark:text-amber-100/80">
                  You can omit the <code className="rounded bg-amber-100 px-1.5 py-0.5 text-sm dark:text-black">category</code> and <code className="rounded bg-amber-100 px-1.5 py-0.5 text-sm dark:text-black">subcategory</code> fields and they will default to your selections above.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-amber-800/90 dark:text-amber-100/80">
                  <li>Bundle resources with similar metadata to speed up review.</li>
                  <li>Use descriptive titles and concise descriptions to help teammates find resources faster.</li>
                </ul>
              </div>

              <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-8 shadow-xl shadow-slate-100/50 backdrop-blur-sm dark:border-slate-700/60 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-900/80 dark:shadow-slate-900/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-60"></div>
                <div className="relative space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 blur-sm"></div>
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200/50 dark:from-blue-900/30 dark:to-indigo-900/30 dark:ring-blue-700/50">
                        <svg className="h-7 w-7 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600/80 dark:text-blue-400/80">System Import</p>
                        <div className="h-1 w-1 rounded-full bg-blue-500/60"></div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">JSON Files</span>
                      </div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300">Import System Files</h3>
                    </div>
                  </div>
                  
                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Import JSON library files directly into the system with automatic duplicate detection, validation, and smart categorization.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCeoImport}
                    disabled={isCeoImporting}
                    className="group/btn relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 dark:shadow-blue-900/25 dark:hover:shadow-blue-800/40"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"></div>
                    <div className="relative flex items-center justify-center gap-3">
                      {isCeoImporting ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <div className="flex space-x-1">
                              <div className="h-1 w-1 rounded-full bg-white animate-pulse"></div>
                              <div className="h-1 w-1 rounded-full bg-white animate-pulse" style={{animationDelay: '0.2s'}}></div>
                              <div className="h-1 w-1 rounded-full bg-white animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                          </div>
                          <span className="font-semibold">Processing files...</span>
                        </>
                      ) : (
                        <>
                          <div className="rounded-lg bg-white/20 p-1.5 transition-all duration-300 group-hover/btn:bg-white/30">
                            <Upload className="h-5 w-5" />
                          </div>
                          <span className="font-semibold text-lg">Select JSON File</span>
                          <div className="ml-auto opacity-60 transition-all duration-300 group-hover/btn:opacity-100 group-hover/btn:translate-x-1">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={confirmationModal.onCancel}></div>
          <div className="relative w-full max-w-lg mx-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50">
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    confirmationModal.variant === 'danger' 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {confirmationModal.variant === 'danger' ? (
                      <AlertCircle className={`h-6 w-6 text-red-600 dark:text-red-400`} />
                    ) : (
                      <Upload className={`h-6 w-6 text-blue-600 dark:text-blue-400`} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {confirmationModal.title}
                    </h3>
                  </div>
                </div>
                
                <div className="mb-8">
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {confirmationModal.message}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={confirmationModal.onCancel}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    {confirmationModal.cancelText}
                  </button>
                  <button
                    onClick={confirmationModal.onConfirm}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors duration-200 ${
                      confirmationModal.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-500/30'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30'
                    }`}
                  >
                    {confirmationModal.confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
