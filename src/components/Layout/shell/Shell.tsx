import {useState, useEffect, useCallback} from 'react';
import { ResourceSidebar, ResourceGrid, ResourceDetailModal } from '@/components/Resources';
import { TopBar } from './TopBar';
import { SkeletonLoader } from '@/components/ui';
import { Settings, Profile } from '@/components/User';
import {useKeyboardShortcuts} from '@/hooks/useKeyboardShortcuts';
// useTheme from '@/components/Layout' available if needed
import type {Category, Resource, SearchFilters}
from '@/types';
import {
    getCategories,
    getResources,
    searchResources,
    toggleFavorite,
    incrementViewCount
} from '@/lib/services';
import {useAuth} from '@/lib/auth';
import {debounce} from '@/lib/utils';

export function Shell() {
    // Theme context is available but not currently used in this component
    const {user} = useAuth();
    const [categories, setCategories] = useState < Category[] > ([]);
    const [resources, setResources] = useState < Resource[] > ([]);
    const [activeCategory, setActiveCategory] = useState < string | null > (null);
    const [activeSubcategory, setActiveSubcategory] = useState < string | null > (null);
    const [searchQuery, setSearchQuery] = useState('');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [selectedResource, setSelectedResource] = useState < Resource | null > (null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    const loadCategories = async () => {
        try {
            setIsLoadingCategories(true);
            const data = await getCategories();
            setCategories(data);
            // Don't auto-select first category - show all items by default
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setIsLoadingCategories(false);
        }
    };

    const loadResources = useCallback(async () => {
        setIsLoading(true);
        try {
            let data: Resource[];

            if (searchQuery || favoritesOnly) {
                const filters: SearchFilters = {
                    query: searchQuery,
                    categoryId: activeCategory,
                    subcategoryId: activeSubcategory,
                    tags: [],
                    favoritesOnly,
                    resourceType: null
                };
                data = await searchResources(filters, user?.id);
            } else {
                data = await getResources(activeCategory || undefined, activeSubcategory || undefined);
            }

            setResources(data);
        } catch (error) {
            console.error('Failed to load resources:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeCategory, activeSubcategory, searchQuery, favoritesOnly, user?.id]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadResources();
    }, [loadResources]);

    const debouncedSearch = useCallback(
        (query: string) => {
            const debouncedFn = debounce(() => {
                setSearchQuery(query);
            }, 250);
            debouncedFn();
        }, 
        []
    );

    const handleSearchChange = (query : string) => {
        debouncedSearch(query);
    };

    const handleSelectCategory = (categoryId : string, subcategoryId? : string) => {
        setActiveCategory(categoryId);
        setActiveSubcategory(subcategoryId || null);
        setSearchQuery('');
        setFavoritesOnly(false);
        // Close profile and settings when navigating to dashboard
        setShowProfile(false);
        setShowSettings(false);
    };

    const handleToggleFavorite = async (resourceId : string) => {
        if (!user) 
            return;
        

        try {
            const result = await toggleFavorite(resourceId, user.id);

            setResources((prev) => prev.map((r) => r.id === resourceId ? {
                ...r,
                is_favorite: result.favorite
            } : r));

            if (selectedResource ?. id === resourceId) {
                setSelectedResource((prev) => prev ? {
                    ...prev,
                    is_favorite: result.favorite
                } : null);
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    const handleOpenResource = async (resource : Resource) => {
        setSelectedResource(resource);

        if (user) {
            try {
                await incrementViewCount(resource.id);
                setResources((prev) => prev.map((r) => r.id === resource.id ? {
                    ...r,
                    view_count: r.view_count + 1
                } : r));
            } catch (error) {
                console.error('Failed to increment view count:', error);
            }
        }
    };

    const handleOpenExternal = (url : string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleOpenSettings = () => {
        setShowSettings(true);
        setShowProfile(false);
    };

    const handleOpenProfile = () => {
        setShowProfile(true);
        setShowSettings(false);
    };

    const handleToggleFavoritesView = () => {
        setFavoritesOnly((prev) => !prev);
    };

    useKeyboardShortcuts([
        {
            key: 'k',
            ctrlKey: true,
            handler: () => {
                const searchInput = document.querySelector('input[type="text"]')as HTMLInputElement;
                searchInput ?. focus();
            },
            description: 'Focus search'
        }, {
            key: 'f',
            ctrlKey: true,
            handler: handleToggleFavoritesView,
            description: 'Toggle favorites'
        }, {
            key: 'Escape',
            handler: () => {
                if (selectedResource) {
                    setSelectedResource(null);
                }
            },
            description: 'Close modal'
        },
    ]);

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-gray-900 dark:bg-gray-800">

            <div className="flex-1 flex overflow-hidden relative">
                {
                isLoadingCategories ? (
                    <div className="w-[360px] flex-shrink-0">
                        <SkeletonLoader type="sidebar"/>
                    </div>
                ) : (
                    <ResourceSidebar onSelectCategory={handleSelectCategory}
                        onOpenSettings={handleOpenSettings}
                        onOpenProfile={handleOpenProfile}/>
                )
            }

                <main className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950 rounded-l-3xl rounded-r-2xl relative z-10 shadow-xl my-2 mr-2.5">
                    {
                    !showSettings && !showProfile && (
                        <div className="pt-4">
                            <TopBar searchQuery={searchQuery}
                                onSearchChange={handleSearchChange}
                                onToggleFavoritesView={handleToggleFavoritesView}
                                favoritesOnly={favoritesOnly}
                                categories={categories}
                                activeCategory={activeCategory}
                                activeSubcategory={activeSubcategory}
                                onSelectCategory={handleSelectCategory}
                                onClearCategoryFilter={
                                    () => {
                                        setActiveCategory(null);
                                        setActiveSubcategory(null);
                                    }
                                }/>
                        </div>
                    )
                }
                    {
                    showProfile ? (
                        <Profile/>) : showSettings ? (
                        <Settings/>) : (
                        <ResourceGrid resources={resources}
                            onOpenResource={handleOpenResource}
                            onToggleFavorite={handleToggleFavorite}
                            isLoading={isLoading}/>
                    )
                } </main>
            </div>

            <ResourceDetailModal resource={selectedResource}
                onClose={
                    () => setSelectedResource(null)
                }
                onToggleFavorite={handleToggleFavorite}
                onOpenExternal={handleOpenExternal}/>
        </div>
    );
}
