import { useState, useEffect } from 'react';
import { ResourceSidebar, ResourceGrid, ResourceDetailModal } from '@/components/Resources';
import { ImportPage } from '@/components/Resources/ImportPage';
import { RoleManagement } from '@/components/Admin/RoleManagement';
import { Dashboard } from '@/components/Dashboard';
import { TopBar } from './TopBar';
import { SkeletonLoader } from '@/components/ui';
import { Settings, Profile } from '@/components/User';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { Category, Resource } from '@/types';
import { incrementViewCount } from '@/lib/services';
import { useLibraryData } from '@/components/Resources/library/useLibraryData';
import { FiltersTap } from '@/components/Resources/library/FiltersTap';
import { useAuth } from '@/lib/auth';

export function Shell() {
  const { user } = useAuth();
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Library' | 'Imports'>('Dashboard');

  const {
    categories,
    resources,
    availableClassifications,
    availableTags,
    activeCategory,
    activeSubcategory,
    classificationFilter,
    tagFilter,
    searchQuery,
    favoritesOnly,
    isLoading,
    isLoadingCategories,
    setSearchQuery,
    setFavoritesOnly,
    handleSelectCategory: selectLibraryCategory,
    clearCategorySelection,
    applyClassificationFilter,
    applyTagFilter,
    patchResourceLocally,
    updateFavoriteLocally,
  } = useLibraryData({
    userId: user?.id ?? null,
    activeTab,
    selectedResource,
    onSelectedResourceChange: setSelectedResource,
  });

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectCategory = (categoryId: string, subcategoryId?: string) => {
    selectLibraryCategory(categoryId, subcategoryId);
    setShowProfile(false);
    setShowSettings(false);
    setShowRoles(false);
  };

  const handleToggleFavorite = async (resourceId: string) => {
    if (!user?.id || !user?.email) return;
    try {
      const raw = localStorage.getItem(`favorites_${user.id}`);
      let favorites: string[] = raw ? JSON.parse(raw) : [];
      const isFav = favorites.includes(resourceId);
      if (isFav) {
        favorites = favorites.filter((id) => id !== resourceId);
      } else {
        favorites.push(resourceId);
      }
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favorites));
      updateFavoriteLocally(resourceId, !isFav);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleOpenResource = async (resource: Resource) => {
    setSelectedResource(resource);
    try {
      await incrementViewCount(resource.id);
      const nextCount = (resource.view_count || 0) + 1;
      patchResourceLocally(resource.id, { view_count: nextCount });
    } catch (error) {
      console.error('Failed to update view count:', error);
    }
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    setShowProfile(false);
    setShowRoles(false);
  };

  const handleOpenProfile = () => {
    setShowProfile(true);
    setShowSettings(false);
    setShowRoles(false);
  };

  const handleOpenRoles = () => {
    setShowRoles(true);
    setShowProfile(false);
    setShowSettings(false);
  };

  const handleOpenDashboard = () => {
    setActiveTab('Dashboard');
    setShowProfile(false);
    setShowSettings(false);
    setShowRoles(false);
  };

  const handleOpenLibrary = () => {
    setActiveTab('Library');
    setShowProfile(false);
    setShowSettings(false);
    setShowRoles(false);
    clearCategorySelection();
    applyClassificationFilter(null);
    applyTagFilter(null);
    setSearchQuery('');
    setFavoritesOnly(false);
  };

  const handleOpenImports = () => {
    setActiveTab('Imports');
    setShowProfile(false);
    setShowSettings(false);
    setShowRoles(false);
    clearCategorySelection();
    applyClassificationFilter(null);
    applyTagFilter(null);
    setSearchQuery('');
    setFavoritesOnly(false);
  };

  const handleOpenLibraryCategory = (slug: string) => {
    setActiveTab('Library');
    setShowProfile(false);
    setShowSettings(false);
    setShowRoles(false);

    const slugify = (s: string) =>
      s
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]/g, '');

    const normSlug = normalize(slug);
    const match = categories.find((category: Category) => {
      const title = (category?.title || '').toString();
      const categorySlug = slugify(title);
      const normTitle = normalize(title);
      const normCategorySlug = normalize(categorySlug);
      return (
        categorySlug === slug ||
        categorySlug.includes(slug) ||
        slug.includes(categorySlug) ||
        normTitle === normSlug ||
        normCategorySlug === normSlug ||
        normSlug.includes(normTitle) ||
        normTitle.includes(normSlug)
      );
    });

    if (match) {
      selectLibraryCategory(match.id);
    } else {
      clearCategorySelection();
    }

    setSearchQuery('');
    setFavoritesOnly(false);
    applyClassificationFilter(null);
    applyTagFilter(null);
  };

  const handleToggleFavoritesView = () => {
    setFavoritesOnly((prev) => !prev);
  };

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      handler: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'f',
      ctrlKey: true,
      handler: handleToggleFavoritesView,
      description: 'Toggle favorites',
    },
    {
      key: 'Escape',
      handler: () => {
        if (selectedResource) {
          setSelectedResource(null);
        }
      },
      description: 'Close modal',
    },
  ]);

  useEffect(() => {
    if (user?.id && user?.email) {
      try {
        const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
        if (storedFavorites) {
          JSON.parse(storedFavorites);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
  }, [user]);

  function handleOpenExternal(_url: string): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="h-full flex flex-col relative bg-[#87CEEB] dark:bg-gray-800">
      <div className="flex-1 flex relative min-h-0">
        {isLoadingCategories ? (
          <div className="w-[360px] flex-shrink-0">
            <SkeletonLoader type="sidebar" />
          </div>
        ) : (
          <ResourceSidebar
            onOpenSettings={handleOpenSettings}
            onOpenProfile={handleOpenProfile}
            onOpenRoles={handleOpenRoles}
            onOpenDashboard={handleOpenDashboard}
            onOpenLibrary={handleOpenLibrary}
            onOpenImports={handleOpenImports}
            onOpenLibraryCategory={handleOpenLibraryCategory}
            isLibraryActive={activeTab === 'Library'}
          />
        )}

        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide bg-[#F0FFFF] dark:bg-gray-950 rounded-l-3xl rounded-r-2xl relative z-10 shadow-xl my-2 mr-2.5">
          {!showSettings && !showProfile && !showRoles && activeTab === 'Library' && (
            <>
              <div className="sticky top-0 z-30 px-6 pt-8 pb-4 bg-transparent dark:bg-transparent">
                <TopBar
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  onToggleFavoritesView={handleToggleFavoritesView}
                  favoritesOnly={favoritesOnly}
                />
              </div>
              <div className="px-6 mb-4">
                <FiltersTap
                  categories={categories}
                  activeCategory={activeCategory}
                  activeSubcategory={activeSubcategory}
                  onSelectCategory={handleSelectCategory}
                  onClearCategoryFilter={() => {
                    clearCategorySelection();
                    applyClassificationFilter(null);
                    applyTagFilter(null);
                  }}
                  classificationOptions={availableClassifications}
                  activeClassification={classificationFilter}
                  onClassificationChange={applyClassificationFilter}
                  tagOptions={availableTags}
                  activeTag={tagFilter}
                  onTagChange={applyTagFilter}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}

          <div className="flex-1 flex flex-col pb-6">
            {showProfile ? (
              <Profile />
            ) : showSettings ? (
              <Settings />
            ) : showRoles ? (
              <RoleManagement />
            ) : activeTab === 'Dashboard' ? (
              <Dashboard
                resources={resources}
                categories={categories}
                onOpenResource={handleOpenResource}
                onOpenLibrary={handleOpenLibrary}
                onOpenProfile={handleOpenProfile}
                onOpenSettings={handleOpenSettings}
                onOpenRoles={handleOpenRoles}
              />
            ) : activeTab === 'Imports' ? (
              <ImportPage />
            ) : (
              <ResourceGrid
                resources={resources}
                onOpenResource={handleOpenResource}
                onToggleFavorite={handleToggleFavorite}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>
      </div>

      <ResourceDetailModal
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onToggleFavorite={handleToggleFavorite}
        onOpenExternal={handleOpenExternal}
      />
    </div>
  );
}
