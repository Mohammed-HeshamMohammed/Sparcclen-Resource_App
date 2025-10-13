import { useState } from 'react';
import { Brain, Globe, FlaskConical, BookOpen, Wrench, FileJson, Upload, Crown } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type CategoryType = 'ai-and-ml' | 'web-and-design' | 'rnd' | 'studying' | 'tools' | 'ceo';

export function ImportPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('ai-and-ml');
  const { user } = useAuth();

  // Check if user is CEO
  const isCEO = user?.user_metadata?.role === 'CEO' || user?.app_metadata?.role === 'CEO';

  const categories = [
    {
      id: 'ai-and-ml' as CategoryType,
      label: 'AI & ML',
      icon: Brain,
      description: 'Artificial Intelligence and Machine Learning resources'
    },
    {
      id: 'web-and-design' as CategoryType,
      label: 'Web & Design',
      icon: Globe,
      description: 'Web development and design resources'
    },
    {
      id: 'rnd' as CategoryType,
      label: 'R&D',
      icon: FlaskConical,
      description: 'Research and Development resources'
    },
    {
      id: 'studying' as CategoryType,
      label: 'Studying',
      icon: BookOpen,
      description: 'Educational and study materials'
    },
    {
      id: 'tools' as CategoryType,
      label: 'Tools',
      icon: Wrench,
      description: 'Development tools and utilities'
    },
    {
      id: 'ceo' as CategoryType,
      label: 'CEO',
      icon: Crown,
      description: 'Leadership and executive management resources'
    }
  ];

  const selectedCategoryInfo = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content container without visible scrollbar */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="w-full p-6 space-y-8">
          {/* Header */}
          <div className="text-left space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Import Resources
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Import resources by selecting a category and using the provided JSON format
            </p>
          </div>

          {/* Category Selection and JSON Import - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Select Category
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <label
                      key={category.id}
                      className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory === category.id}
                        onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
                        className="sr-only"
                      />
                      <Icon className={`h-8 w-8 mb-2 ${
                        selectedCategory === category.id
                          ? 'text-blue-500'
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                      <span className={`font-medium text-center ${
                        selectedCategory === category.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {category.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                        {category.description}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* JSON Example and Import Button */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                JSON Format Example
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
{selectedCategory === 'ai-and-ml' && `[
  {
    "title": "Introduction to Machine Learning",
    "description": "Comprehensive guide to ML basics with hands-on examples",
    "url": "https://example.com/ml-intro",
    "tags": ["machine-learning", "python", "scikit-learn", "beginner"],
    "difficulty": "Beginner",
    "estimatedTime": "2 hours",
    "author": "Dr. Sarah Chen",
    "language": "en",
    "thumbnail": "https://example.com/ml-thumb.jpg",
    "category": "ai-and-ml"
  },
  {
    "title": "Deep Learning with TensorFlow",
    "description": "Advanced neural networks and deep learning architectures",
    "url": "https://example.com/tensorflow-guide",
    "tags": ["deep-learning", "tensorflow", "neural-networks", "advanced"],
    "difficulty": "Advanced",
    "estimatedTime": "4 hours",
    "author": "Prof. Michael Rodriguez",
    "language": "en",
    "thumbnail": "https://example.com/tf-thumb.jpg",
    "category": "ai-and-ml"
  }
]`}

{selectedCategory === 'web-and-design' && `[
  {
    "title": "Modern CSS Grid Layouts",
    "description": "Master CSS Grid for responsive web design",
    "url": "https://example.com/css-grid-guide",
    "tags": ["css", "grid", "responsive-design", "frontend"],
    "difficulty": "Intermediate",
    "estimatedTime": "1.5 hours",
    "author": "Emma Thompson",
    "language": "en",
    "thumbnail": "https://example.com/css-grid-thumb.jpg",
    "category": "web-and-design"
  },
  {
    "title": "React Hooks Deep Dive",
    "description": "Complete guide to React Hooks with practical examples",
    "url": "https://example.com/react-hooks",
    "tags": ["react", "hooks", "javascript", "frontend"],
    "difficulty": "Intermediate",
    "estimatedTime": "2.5 hours",
    "author": "Alex Kumar",
    "language": "en",
    "thumbnail": "https://example.com/react-hooks-thumb.jpg",
    "category": "web-and-design"
  }
]`}

{selectedCategory === 'rnd' && `[
  {
    "title": "Research Methodology Fundamentals",
    "description": "Essential research methods for R&D projects",
    "url": "https://example.com/research-methods",
    "tags": ["research", "methodology", "academic", "rnd"],
    "difficulty": "Intermediate",
    "estimatedTime": "3 hours",
    "author": "Dr. Lisa Park",
    "language": "en",
    "thumbnail": "https://example.com/research-thumb.jpg",
    "category": "rnd"
  },
  {
    "title": "Innovation Management Strategies",
    "description": "Managing innovation pipelines and R&D processes",
    "url": "https://example.com/innovation-management",
    "tags": ["innovation", "management", "strategy", "rnd"],
    "difficulty": "Advanced",
    "estimatedTime": "2 hours",
    "author": "Prof. David Wilson",
    "language": "en",
    "thumbnail": "https://example.com/innovation-thumb.jpg",
    "category": "rnd"
  }
]`}

{selectedCategory === 'studying' && `[
  {
    "title": "Effective Study Techniques",
    "description": "Science-backed methods for better learning outcomes",
    "url": "https://example.com/study-techniques",
    "tags": ["studying", "learning", "memory", "productivity"],
    "difficulty": "Beginner",
    "estimatedTime": "1 hour",
    "author": "Dr. Maria Santos",
    "language": "en",
    "thumbnail": "https://example.com/study-thumb.jpg",
    "category": "studying"
  },
  {
    "title": "Note-Taking Strategies",
    "description": "Advanced note-taking methods for different subjects",
    "url": "https://example.com/note-taking",
    "tags": ["note-taking", "studying", "organization", "academic"],
    "difficulty": "Beginner",
    "estimatedTime": "45 minutes",
    "author": "Prof. Robert Kim",
    "language": "en",
    "thumbnail": "https://example.com/notes-thumb.jpg",
    "category": "studying"
  }
]`}

{selectedCategory === 'tools' && `[
  {
    "title": "Git and GitHub Workflow",
    "description": "Complete guide to version control with Git and GitHub",
    "url": "https://example.com/git-workflow",
    "tags": ["git", "github", "version-control", "collaboration"],
    "difficulty": "Intermediate",
    "estimatedTime": "2 hours",
    "author": "Carlos Mendez",
    "language": "en",
    "thumbnail": "https://example.com/git-thumb.jpg",
    "category": "tools"
  },
  {
    "title": "Docker Containerization Guide",
    "description": "Learn Docker for development and deployment",
    "url": "https://example.com/docker-guide",
    "tags": ["docker", "containerization", "devops", "deployment"],
    "difficulty": "Intermediate",
    "estimatedTime": "3 hours",
    "author": "Anna Volkov",
    "language": "en",
    "thumbnail": "https://example.com/docker-thumb.jpg",
    "category": "tools"
  }
]`}

{selectedCategory === 'ceo' && `[
  {
    "title": "CEO Leadership Fundamentals",
    "description": "Essential leadership skills for CEOs and executives",
    "url": "https://example.com/ceo-leadership",
    "tags": ["leadership", "management", "executive", "ceo"],
    "difficulty": "Advanced",
    "estimatedTime": "3 hours",
    "author": "CEO Academy",
    "language": "en",
    "thumbnail": "https://example.com/ceo-leadership-thumb.jpg",
    "category": "ceo"
  },
  {
    "title": "Strategic Decision Making",
    "description": "Advanced strategic thinking and decision-making frameworks",
    "url": "https://example.com/strategic-decisions",
    "tags": ["strategy", "decision-making", "leadership", "ceo"],
    "difficulty": "Advanced",
    "estimatedTime": "2.5 hours",
    "author": "Dr. Jennifer Walsh",
    "language": "en",
    "thumbnail": "https://example.com/strategy-thumb.jpg",
    "category": "ceo"
  }
]`}
                  </pre>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={() => alert(`Import functionality for ${selectedCategoryInfo?.label} category will be implemented here.`)}
                    className="flex items-center space-x-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-lg font-medium"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Import {selectedCategoryInfo?.label} Resources</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CEO Import Button - Only for CEO users */}
          {isCEO && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Crown className="h-8 w-8 text-white mr-2" />
                  <h2 className="text-xl font-semibold text-white">CEO Import Access</h2>
                </div>
                <p className="text-purple-100 mb-4">
                  Import exclusive CEO leadership and management resources
                </p>
                <button
                  onClick={() => alert('CEO import functionality will be implemented here.')}
                  className="flex items-center space-x-2 px-8 py-4 bg-white hover:bg-gray-100 text-purple-600 rounded-lg transition-colors duration-200 text-lg font-bold mx-auto"
                >
                  <Upload className="h-5 w-5" />
                  <span>Import CEO Resources</span>
                </button>
              </div>
            </div>
          )}

          {/* Selected Category Info */}
          {selectedCategoryInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <selectedCategoryInfo.icon className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Selected: {selectedCategoryInfo.label}
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {selectedCategoryInfo.description}
              </p>
            </div>
          )}

          {/* JSON Format Requirements - Full Width Below */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FileJson className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                JSON Format Requirements
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                  Required JSON Structure:
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-xs overflow-x-auto">
{`[
  {
    "title": "Resource Title",
    "description": "Brief description of the resource",
    "url": "https://example.com/resource",
    "tags": ["tag1", "tag2", "tag3"],
    "difficulty": "Beginner|Intermediate|Advanced",
    "estimatedTime": "30 minutes",
    "author": "Resource Author",
    "language": "en|es|fr|de|etc",
    "thumbnail": "https://example.com/thumbnail.jpg",
    "category": "ai-and-ml|web-and-design|rnd|studying|tools"
  }
]`}
                </pre>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Field Requirements:
                  </h4>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">title</code> - Required: Resource title</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">description</code> - Required: Brief description</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">url</code> - Required: Valid URL to resource</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">tags</code> - Optional: Array of tags</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">difficulty</code> - Optional: Skill level</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">estimatedTime</code> - Optional: Time estimate</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">author</code> - Optional: Resource creator</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">language</code> - Optional: Language code</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">thumbnail</code> - Optional: Thumbnail image URL</li>
                    <li><code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">category</code> - Optional: Category (must match selected category)</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  <strong>Note:</strong> The <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">category</code> field should match your selected category above, or it can be omitted and will be automatically assigned based on your selection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
