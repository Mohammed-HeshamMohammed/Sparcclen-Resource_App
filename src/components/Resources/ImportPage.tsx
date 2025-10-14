import { useState } from 'react';
import {
  Brain,
  Globe,
  FlaskConical,
  BookOpen,
  Wrench,
  Upload,
  Crown,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

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

export function ImportPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ai-and-ml');
  const [selectedSubcategory, setSelectedSubcategory] = useState<SubcategoryType>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategoryInfo = categories.find(cat => cat.id === selectedCategory);
  const SelectedIcon = selectedCategoryInfo?.icon;
  const activeSubcategories = subcategories[selectedCategory] ?? [];
  const selectedSubcategoryInfo = selectedSubcategory
    ? activeSubcategories.find(sub => sub.id === selectedSubcategory)
    : undefined;
  const hasSubcategories = activeSubcategories.length > 0;

  const handleImport = async () => {
    if (hasSubcategories && !selectedSubcategory) {
      setError('Please choose a subcategory before importing.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const subcategoryLabel = selectedSubcategoryInfo ? ` (${selectedSubcategoryInfo.label})` : '';
      alert(`Import placeholder: ${selectedCategoryInfo?.label ?? 'Category'}${subcategoryLabel} resources will be processed here.`);
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div style={{ padding: '64px 64px 80px 64px' }} className="mx-auto w-full space-y-20">
          <div className="space-y-5">
            <div className="space-y-3.5">
              <div className="inline-block rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 shadow-lg">
                <h1 className="text-4xl font-extrabold tracking-tight text-white">Import Resources</h1>
              </div>
              <p className="max-w-4xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                Import curated resources with a guided workflow. Choose the destination category, refine with a subcategory, and upload JSON that follows the required schema to keep your collection consistent.
              </p>
            </div>
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
          </div>

          <div>
            <div className="mb-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Category Selection</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600"></div>
            </div>
            <div className="grid gap-8 lg:gap-10 xl:grid-cols-[1.7fr_1fr]">
              <div className="rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 1</p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:!text-black">Choose a category</h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-700">Pick the resource family that best matches the content you plan to import.</p>
                  </div>
                  <span className="self-start rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600 dark:border-blue-700/60 dark:bg-blue-900/30 dark:text-blue-200">
                    {selectedCategoryInfo?.label ?? 'Not selected'}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:gap-5">
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
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:!text-black">Refine the focus</h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-700">Pick a subcategory to keep your resources organized.</p>
                  </div>
                  <span className="self-start rounded-full border border-purple-200/70 bg-purple-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-600 dark:border-purple-700/60 dark:bg-purple-900/30 dark:text-purple-200">
                    {selectedSubcategoryInfo?.label ?? (hasSubcategories ? 'None selected' : 'Not required')}
                  </span>
                </div>

                {hasSubcategories ? (
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:!text-black">Prepare your JSON</h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-700">Use the schema template. You can upload arrays with multiple resources at once.</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border-2 border-gray-200 bg-gray-50 p-5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="h-1 w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                  <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
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
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:!text-black">Match the schema</h2>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-700">Validate each resource against the required and optional fields.</p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-red-500 dark:text-red-300">Required fields</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {requiredFields.map(field => (
                      <div key={field.key} className="rounded-xl border-2 border-red-200/80 bg-red-50/60 px-4 py-3 dark:border-red-800/70 dark:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400 flex-shrink-0"></span>
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold !text-black border border-red-200 dark:border-red-800">
                            {field.key}
                          </span>
                        </div>
                        <p className="text-sm text-red-700/90 dark:text-red-200/90 text-left">{field.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Optional fields</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {optionalFields.map(field => (
                      <div key={field.key} className="rounded-xl border-2 border-slate-200/70 bg-slate-50/70 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400 flex-shrink-0"></span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold !text-black border border-blue-200 dark:border-blue-800">
                            {field.key}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 text-left">{field.description}</p>
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
                  You can omit the <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">category</code> and <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">subcategory</code> fields and they will default to your selections above.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-amber-800/90 dark:text-amber-100/80">
                  <li>Bundle resources with similar metadata to speed up review.</li>
                  <li>Use descriptive titles and concise descriptions to help teammates find resources faster.</li>
                </ul>
              </div>

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 p-8 text-white shadow-xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Crown className="h-9 w-9" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Executive access</p>
                      <h3 className="text-2xl font-bold">CEO Import Portal</h3>
                    </div>
                  </div>
                  <p className="text-base text-white/80">
                    Import high-priority leadership content with elevated privileges and curated review steps.
                  </p>
                  <button
                    onClick={() => alert('CEO import functionality will be implemented here.')}
                    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-6 py-3 text-lg font-semibold text-purple-600 transition-all duration-200 hover:bg-slate-100 hover:shadow-lg"
                  >
                    <Upload className="h-6 w-6" />
                    <span>Import CEO resources</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
