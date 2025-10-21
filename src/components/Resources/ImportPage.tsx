import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
import { normalizeToDataUrl } from '@/lib/utils/dataUrl';

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

// 🎛️ RESPONSIVE CONTROL: Change this value to adjust when schema fields switch from 1 to 2 columns
const SCHEMA_FIELDS_BREAKPOINT = 750; // pixels

export function ImportPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ai-and-ml');
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryType>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCeoImporting, setIsCeoImporting] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal | null>(null);
  const [containerWidth, setContainerWidth] = useState(1024);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerRef.current);
    
    // Set initial size
    setContainerWidth(containerRef.current.offsetWidth);

    return () => resizeObserver.disconnect();
  }, []);

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
      const raw = entry[field];
      if (typeof raw !== 'string' || !raw.trim()) continue;

      // 1) If incoming value already looks like base64/JSON data, normalize like Profile cover
      const normalized = normalizeToDataUrl(raw);
      if (normalized) {
        processedEntry[field] = normalized;
        continue;
      }

      // 2) Otherwise, treat as a file path and try to embed as data URL via preload
      try {
        if (!window.api?.resources?.readImageAsBase64) {
          console.warn(`Image processing not available for ${raw}`);
          continue;
        }
        const imageResult = await window.api.resources.readImageAsBase64(sourceDir, raw);
        if (imageResult?.ok && imageResult.base64Data && imageResult.mimeType) {
          processedEntry[field] = `data:${imageResult.mimeType};base64,${imageResult.base64Data}`;
        } else {
          console.warn(`Failed to load image ${raw}:`, imageResult?.error);
        }
      } catch (error) {
        console.warn(`Error processing image ${raw}:`, error);
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
      if (!window.api?.resources?.pickJsonFile) {
        throw new Error('File picker not available. Please ensure you are using the desktop application or that the API is properly initialized.');
      }
      const filePickResult = await window.api.resources.pickJsonFile();
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
      const folderSegments = [categorySegment];
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
      
      let existingBinsResult = null;
      if (window.api?.resources?.listLibraryBins) {
        existingBinsResult = await window.api.resources.listLibraryBins(listParams);
      }
      
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
      
      if (!window.api?.resources?.saveLibraryBin) {
        throw new Error('Save functionality not available. Please ensure you are using the desktop application or that the API is properly initialized.');
      }
      const saveResult = await window.api.resources.saveLibraryBin(folderSegments, targetFileName, payload);
      
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
      if (!window.api?.resources?.pickJsonFile) {
        throw new Error('File picker not available. Please ensure you are using the desktop application or that the API is properly initialized.');
      }
      const filePickResult = await window.api.resources.pickJsonFile();
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
      const folderSegments = [categorySegment];
      if (selectedSubcategoryInfo) {
        folderSegments.push(sanitizeFolderSegment(selectedSubcategoryInfo.label));
      }

      const sourceName = filePickResult.fileName ?? 'library.json';
      const fileStem = sanitizeFileStem(sourceName.replace(/\.[^.]+$/, ''));
      const outputFileName = `${fileStem || 'library'}.bin`;
      if (!window.api?.resources?.saveLibraryBin) {
        throw new Error('Save functionality not available. Please ensure you are using the desktop application or that the API is properly initialized.');
      }
      const saveResult = await window.api.resources.saveLibraryBin(folderSegments, outputFileName, payload);
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
    <div ref={containerRef} className="h-full app-page-surface flex flex-col">
      {/* Fixed Header */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 break-words">Import Resources</h1>
        <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-4xl mb-6 sm:mb-8 break-words">
          Import curated resources with a guided workflow. Choose the destination category, refine with a subcategory, and upload JSON that follows the required schema to keep your collection consistent.
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="px-4 sm:px-6 py-6 sm:py-8 space-y-12 sm:space-y-16 lg:space-y-20 max-w-7xl mx-auto"
        >
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
            <div className="flex h-full flex-col gap-4 rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-800/50 dark:text-blue-200 flex-shrink-0">
                  {SelectedIcon ? <SelectedIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />}
                </div>
                <div className="space-y-1 sm:space-y-1.5 min-w-0">
                  <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-blue-600 dark:text-blue-300">Current selection</p>
                  <p className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-100 break-words">
                    {selectedCategoryInfo?.label ?? 'Choose a category'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-blue-700/80 dark:text-blue-200/70 break-words">
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
            <div className="flex h-full flex-col rounded-2xl sm:rounded-3xl border border-gray-200/80 bg-white p-4 sm:p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-500 dark:text-slate-300">Process overview</p>
                  <div className="mt-3 space-y-3 text-sm leading-5 text-slate-600 dark:text-slate-300">
                {['Choose a category to define where the resources belong.', 'Refine with a subcategory or confirm that none is needed.', 'Prepare JSON that matches the schema and import.'].map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="break-words overflow-hidden text-sm"><strong className="font-semibold">Step {idx + 1}.</strong> {text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6 sm:mb-8 flex items-center gap-2 sm:gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-center">Category Selection</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="max-w-7xl mx-auto">
              <div className="rounded-2xl sm:rounded-3xl border-2 border-gray-200 bg-white p-4 sm:p-6 lg:p-10 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 1</p>
                    <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white break-words">Choose a category</h2>
                    <p className="mt-1 sm:mt-1.5 text-sm text-slate-600 dark:text-white break-words">Pick the resource family that best matches the content you plan to import.</p>
                  </div>
                  <span className="self-start rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-blue-600 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200 break-words max-w-full sm:max-w-32 text-center">
                    {selectedCategoryInfo?.label ?? 'Not selected'}
                  </span>
                </div>
                <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 md:grid md:gap-4 lg:gap-6 md:grid-cols-2 xl:grid-cols-3 md:space-y-0">
                  {categories.map(category => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <label
                        key={category.id}
                        className={`group relative flex items-center sm:items-start gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 lg:p-6 transition-all duration-200 cursor-pointer min-h-[72px] sm:min-h-[80px] lg:min-h-[100px] ${
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
                        <div className="flex items-center sm:items-start gap-3 sm:gap-4 min-w-0 w-full">
                          <Icon className={`h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 flex-shrink-0 transition-colors duration-200 ${
                            isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-200'
                          }`} />
                          <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 min-w-0 flex-1">
                            <div className="flex items-center sm:items-start sm:flex-col lg:flex-row lg:items-center gap-1 sm:gap-1 lg:gap-2">
                              <span className="text-sm sm:text-sm lg:text-base font-semibold text-slate-900 dark:text-white break-words leading-tight">{category.label}</span>
                              {isActive && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-500/20 dark:text-blue-200 flex-shrink-0">Selected</span>}
                            </div>
                            <p className="text-xs sm:text-xs lg:text-sm leading-snug sm:leading-relaxed text-slate-600 transition-colors duration-200 dark:text-slate-300 break-words line-clamp-2 sm:line-clamp-none">{category.description}</p>
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
            <div className="mb-6 sm:mb-8 flex items-center gap-2 sm:gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-center">Import & Validation</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-10">
              <div className="rounded-2xl sm:rounded-3xl border-2 border-gray-200 bg-white p-4 sm:p-6 lg:p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 2</p>
                    <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white break-words">Refine the focus</h2>
                    <p className="mt-1 sm:mt-1.5 text-sm text-slate-600 dark:text-white break-words">Pick a subcategory to keep your resources organized.</p>
                  </div>
                  <span className="self-start rounded-full border border-purple-200/70 bg-purple-50/70 px-3 py-1 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-purple-600 dark:border-purple-700/60 dark:bg-purple-900/30 dark:text-purple-200 text-center max-w-full sm:max-w-none">
                    {selectedSubcategoryInfo?.label ?? (hasSubcategories ? 'None selected' : 'Not required')}
                  </span>
                </div>

                {hasSubcategories ? (
                  <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    {activeSubcategories.map(subcategory => {
                      const isActive = selectedSubcategory === subcategory.id;
                      return (
                        <label
                          key={subcategory.id}
                          className={`group relative flex flex-col gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 transition-all duration-200 cursor-pointer min-h-[70px] sm:min-h-[80px] ${
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
                            <span className={`text-sm font-semibold break-words ${isActive ? 'text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'}`}>
                              {subcategory.label}
                            </span>
                            {isActive ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-300 transition-colors duration-200 group-hover:bg-purple-400 dark:bg-slate-600 dark:group-hover:bg-purple-400 flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 break-words overflow-hidden">{subcategory.description}</p>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 sm:p-7 text-center dark:border-gray-600 dark:bg-gray-900">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <p className="mt-2 sm:mt-3 text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">No subcategories required</p>
                    <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 break-words">This category currently imports everything at the top level. You can proceed directly to the JSON upload.</p>
                  </div>
                )}

                {selectedSubcategoryInfo && (
                  <div className="mt-4 sm:mt-6 flex justify-center">
                    <div className="rounded-xl sm:rounded-2xl border-2 border-purple-200 bg-purple-50 p-3 sm:p-4 text-xs sm:text-sm text-purple-700 dark:border-purple-600/70 dark:bg-purple-900/40 dark:text-purple-100 text-center break-words">
                      You will import resources into <strong>{selectedSubcategoryInfo.label}</strong> under <strong>{selectedCategoryInfo?.label}</strong>.
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl sm:rounded-3xl border-2 border-gray-200 bg-white p-4 sm:p-6 lg:p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 3</p>
                    <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white break-words">Prepare your JSON</h2>
                    <p className="mt-1 sm:mt-1.5 text-sm text-slate-600 dark:text-white break-words">Use the schema template. You can upload arrays with multiple resources at once.</p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 rounded-xl sm:rounded-2xl border-2 border-gray-200 bg-gray-50 p-3 sm:p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                  <pre className="mt-3 sm:mt-4 max-h-60 sm:max-h-72 overflow-auto whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full dark:[&::-webkit-scrollbar-track]:bg-gray-800 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-500">
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

                <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4">
                  <button
                    onClick={handleImport}
                    disabled={(hasSubcategories && !selectedSubcategory) || isLoading}
                    className={`flex w-full items-center justify-center gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 text-base sm:text-lg font-semibold transition-all duration-200 min-h-[52px] sm:min-h-[56px] ${
                      (hasSubcategories && !selectedSubcategory) || isLoading
                        ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                        : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white shadow-lg shadow-blue-600/20 hover:-translate-y-px hover:shadow-xl active:translate-y-0'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        <span>Importing…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
                        <span>Import resources</span>
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="flex items-center gap-2.5 sm:gap-3 rounded-lg sm:rounded-xl border-2 border-red-200 bg-red-50/80 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="break-words">{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-6 sm:mb-8 flex items-center gap-2 sm:gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-center">Schema Validation</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="rounded-2xl sm:rounded-3xl border-2 border-gray-200 bg-white p-4 sm:p-6 lg:p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 4</p>
                <h2 className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">Match the schema</h2>
                <p className="mt-1 sm:mt-1.5 text-sm text-slate-600 dark:text-white">Validate each resource against the required and optional fields.</p>
              </div>

              <div className="mt-4 sm:mt-6 space-y-8 sm:space-y-10">
                {/* Required Fields Section */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex-shrink-0"></div>
                    <h3 className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">Required fields</h3>
                  </div>
                  <div className={`grid gap-2.5 sm:gap-3 ${
                    containerWidth >= SCHEMA_FIELDS_BREAKPOINT ? 'grid-cols-2' : 'grid-cols-1'
                  }`}>
                      {requiredFields.map(field => (
                        <div key={field.key} className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-50/90 via-white to-red-50/80 p-3 sm:p-4 lg:p-5 shadow-lg ring-2 ring-red-400/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:ring-red-500 hover:scale-[1.01] sm:hover:scale-[1.02] dark:from-red-950/40 dark:via-gray-900 dark:to-red-950/30 dark:ring-red-600/60 dark:hover:ring-red-500">
                          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-red-500/5 to-transparent opacity-50"></div>
                          <div className="relative flex items-start justify-between gap-3 sm:gap-4">
                            <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                              <div className="inline-flex items-center rounded-full bg-red-500/15 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-red-700 dark:bg-red-400/15 dark:text-red-300 text-left">
                                {field.key}
                              </div>
                              <p className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300 break-words text-left">{field.description}</p>
                            </div>
                            <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-red-500/15 transition-all duration-300 group-hover:bg-red-500/25 group-hover:scale-110 dark:bg-red-400/15 dark:group-hover:bg-red-400/25 flex-shrink-0">
                              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-red-500 dark:bg-red-400"></span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Optional Fields Section */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0"></div>
                    <h3 className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">Optional fields</h3>
                  </div>
                  <div className={`grid gap-2.5 sm:gap-3 ${
                    containerWidth >= SCHEMA_FIELDS_BREAKPOINT ? 'grid-cols-2' : 'grid-cols-1'
                  }`}>
                    {optionalFields.map(field => (
                      <div key={field.key} className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-blue-50/80 p-3 sm:p-4 lg:p-5 shadow-lg ring-2 ring-blue-400/80 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:ring-blue-500 hover:scale-[1.01] sm:hover:scale-[1.02] dark:from-blue-950/40 dark:via-gray-900 dark:to-blue-950/30 dark:ring-blue-600/60 dark:hover:ring-blue-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-transparent opacity-50"></div>
                        <div className="relative flex items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                            <div className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 text-left">
                              {field.key}
                            </div>
                            <p className="text-xs sm:text-sm leading-relaxed text-gray-700 dark:text-gray-300 break-words text-left">{field.description}</p>
                          </div>
                          <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-blue-500/15 transition-all duration-300 group-hover:bg-blue-500/25 group-hover:scale-110 dark:bg-blue-400/15 dark:group-hover:bg-blue-400/25 flex-shrink-0">
                            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
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
            <div className="mb-6 sm:mb-8 flex items-center gap-2 sm:gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-center">Additional Resources</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
              <div className="rounded-2xl sm:rounded-3xl border-l-4 border-amber-400 bg-white p-4 sm:p-6 lg:p-8 shadow-lg dark:border-amber-500/70 dark:bg-gray-900">
                <h3 className="text-base sm:text-lg font-semibold text-amber-800 dark:text-amber-200">Helpful tips</h3>
                <p className="mt-2 text-xs sm:text-sm text-amber-800/90 dark:text-amber-100/80 break-words">
                  You can omit the <code className="rounded bg-amber-100 px-1 sm:px-1.5 py-0.5 text-xs sm:text-sm dark:text-black">category</code> and <code className="rounded bg-amber-100 px-1 sm:px-1.5 py-0.5 text-xs sm:text-sm dark:text-black">subcategory</code> fields and they will default to your selections above.
                </p>
                <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-amber-800/90 dark:text-amber-100/80">
                  <li className="break-words">Bundle resources with similar metadata to speed up review.</li>
                  <li className="break-words">Use descriptive titles and concise descriptions to help teammates find resources faster.</li>
                </ul>
              </div>

              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-slate-200/60 bg-gradient-to-br from-slate-50 via-white to-slate-50/80 p-4 sm:p-6 lg:p-8 shadow-xl shadow-slate-100/50 backdrop-blur-sm dark:border-slate-700/60 dark:from-slate-800/90 dark:via-slate-800 dark:to-slate-900/80 dark:shadow-slate-900/50">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 opacity-60"></div>
                <div className="relative space-y-4 sm:space-y-5 lg:space-y-6">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 blur-sm"></div>
                      <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200/50 dark:from-blue-900/30 dark:to-indigo-900/30 dark:ring-blue-700/50">
                        <svg className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-blue-600/80 dark:text-blue-400/80">System Import</p>
                        <div className="hidden sm:block h-1 w-1 rounded-full bg-blue-500/60"></div>
                        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">JSON Files</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent dark:from-slate-100 dark:to-slate-300 break-words">Import System Files</h3>
                    </div>
                  </div>
                  
                  <div className="rounded-xl sm:rounded-2xl border border-slate-200/60 bg-slate-50/50 p-3 sm:p-4 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-800/50">
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 break-words">
                      Import JSON library files directly into the system with automatic duplicate detection, validation, and smart categorization.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCeoImport}
                    disabled={isCeoImporting}
                    className="group/btn relative w-full overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-3.5 sm:py-4 text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.01] sm:hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 dark:shadow-blue-900/25 dark:hover:shadow-blue-800/40 min-h-[52px] sm:min-h-[56px] active:scale-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100"></div>
                    <div className="relative flex items-center justify-center gap-2.5 sm:gap-3">
                      {isCeoImporting ? (
                        <>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            <div className="flex space-x-1">
                              <div className="h-1 w-1 rounded-full bg-white animate-pulse"></div>
                              <div className="h-1 w-1 rounded-full bg-white animate-pulse" style={{animationDelay: '0.2s'}}></div>
                              <div className="h-1 w-1 rounded-full bg-white animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                          </div>
                          <span className="font-semibold text-sm sm:text-base">Processing files...</span>
                        </>
                      ) : (
                        <>
                          <div className="rounded-md sm:rounded-lg bg-white/20 p-1 sm:p-1.5 transition-all duration-300 group-hover/btn:bg-white/30">
                            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          <span className="font-semibold text-base sm:text-lg">Select JSON File</span>
                          <div className="ml-auto opacity-60 transition-all duration-300 group-hover/btn:opacity-100 group-hover/btn:translate-x-1">
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      {confirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={confirmationModal.onCancel}></div>
          <div className="relative w-full max-w-lg">
            <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl flex-shrink-0 ${
                    confirmationModal.variant === 'danger' 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {confirmationModal.variant === 'danger' ? (
                      <AlertCircle className={`h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400`} />
                    ) : (
                      <Upload className={`h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
                      {confirmationModal.title}
                    </h3>
                  </div>
                </div>
                
                <div className="mb-6 sm:mb-8">
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line break-words">
                    {confirmationModal.message}
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={confirmationModal.onCancel}
                    className="flex-1 px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 min-h-[44px]"
                  >
                    {confirmationModal.cancelText}
                  </button>
                  <button
                    onClick={confirmationModal.onConfirm}
                    className={`flex-1 px-4 py-2.5 sm:py-3 text-sm font-medium text-white rounded-lg sm:rounded-xl transition-colors duration-200 min-h-[44px] ${
                      confirmationModal.variant === 'danger'
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-500/30 active:bg-red-800'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30 active:bg-blue-800'
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
