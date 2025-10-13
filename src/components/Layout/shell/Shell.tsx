import {useState, useEffect, useCallback} from 'react';
import { ResourceSidebar, ResourceGrid, ResourceDetailModal } from '@/components/Resources';
import { RoleManagement } from '@/components/Admin/RoleManagement';
import { Dashboard } from '@/components/Dashboard';
import { TopBar } from './TopBar';
import { SkeletonLoader } from '@/components/ui';
import { Settings, Profile } from '@/components/User';
import {useKeyboardShortcuts} from '@/hooks/useKeyboardShortcuts';
import { favoritesService } from '@/lib/services/favoritesService';
// useTheme from '@/components/Layout' available if needed
import type {Category, Resource, SearchFilters}
from '@/types';
import {
    getCategories,
    getResources,
    searchResources,
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
    const [showRoles, setShowRoles] = useState(false);
    // Active main tab: Dashboard or Library
    const [activeTab, setActiveTab] = useState<'Dashboard' | 'Library'>('Dashboard');
    const [userFavorites, setUserFavorites] = useState<string[]>([]);

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

    // Load user favorites
    useEffect(() => {
        const loadFavorites = async () => {
            if (user?.id && user?.email) {
                try {
                    const favorites = await favoritesService.getFavorites(user.id, user.email, true);
                    setUserFavorites(favorites);
                    // Sync with online in background
                    favoritesService.syncWithOnline(user.id, user.email);
                } catch (error) {
                    console.error('Error loading favorites:', error);
                }
            }
        };
        loadFavorites();
    }, [user]);

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
        // Close profile and settings when navigating within library
        setShowProfile(false);
        setShowSettings(false);
    };

    const handleToggleFavorite = async (resourceId : string) => {
        if (!user?.id || !user?.email) return;
        try {
            const isFav = userFavorites.includes(resourceId);
            let success = false;
            
            if (isFav) {
                success = await favoritesService.removeFavorite(user.id, user.email, resourceId);
                if (success) {
                    setUserFavorites(prev => prev.filter(id => id !== resourceId));
                }
            } else {
                success = await favoritesService.addFavorite(user.id, user.email, resourceId);
                if (success) {
                    setUserFavorites(prev => [...prev, resourceId]);
                }
            }
            
            if (success) {
                // Update resource state
                setResources((prev) => prev.map((r) => r.id === resourceId ? { ...r, is_favorite: !isFav } : r));
                if (selectedResource?.id === resourceId) {
                    setSelectedResource((prev) => prev ? { ...prev, is_favorite: !isFav } : null);
                }
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
                setResources((prev) => prev.map((r) => r.id === resource.id ? { ...r, view_count: (r.view_count || 0) + 1 } : r));
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
        setActiveCategory(null);
        setActiveSubcategory(null);
        setSearchQuery('');
        setFavoritesOnly(false);
    };

    const handleOpenLibraryCategory = (slug: string) => {
        setActiveTab('Library');
        setShowProfile(false);
        setShowSettings(false);
        setShowRoles(false);

        const slugify = (s: string) => s.toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        const normalize = (s: string) => s.toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]/g, '');

        const normSlug = normalize(slug);
        const match = categories.find((c: any) => {
            const nm = (c?.name || '').toString();
            const cslug = slugify(nm);
            const normName = normalize(nm);
            const normCslug = normalize(cslug);
            return (
                cslug === slug ||
                cslug.includes(slug) ||
                slug.includes(cslug) ||
                normName === normSlug ||
                normCslug === normSlug ||
                normSlug.includes(normName) ||
                normName.includes(normSlug)
            );
        });

        if (match) {
            setActiveCategory(match.id);
            setActiveSubcategory(null);
        } else {
            setActiveCategory(null);
            setActiveSubcategory(null);
        }
        setSearchQuery('');
        setFavoritesOnly(false);
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
            description: 'Focus search'
        },
        {
            key: 'f',
            ctrlKey: true,
            handler: handleToggleFavoritesView,
            description: 'Toggle favorites'
        },
        {
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
                {isLoadingCategories ? (
                    <div className="w-[360px] flex-shrink-0">
                        <SkeletonLoader type="sidebar"/>
                    </div>
                ) : (
                    <ResourceSidebar
                        onOpenSettings={handleOpenSettings}
                        onOpenProfile={handleOpenProfile}
                        onOpenRoles={handleOpenRoles}
                        onOpenDashboard={handleOpenDashboard}
                        onOpenLibrary={handleOpenLibrary}
                        onOpenLibraryCategory={handleOpenLibraryCategory}
                        isLibraryActive={activeTab === 'Library'}
                    />
                )}

                <main className="flex-1 overflow-hidden flex flex-col bg-gray-50 dark:bg-gray-950 rounded-l-3xl rounded-r-2xl relative z-10 shadow-xl my-2 mr-2.5">
                    {!showSettings && !showProfile && !showRoles && activeTab === 'Library' && (
                        <div className="pt-8">
                            <TopBar
                                searchQuery={searchQuery}
                                onSearchChange={handleSearchChange}
                                onToggleFavoritesView={handleToggleFavoritesView}
                                favoritesOnly={favoritesOnly}
                                categories={categories}
                                activeCategory={activeCategory}
                                activeSubcategory={activeSubcategory}
                                onSelectCategory={handleSelectCategory}
                                onClearCategoryFilter={() => {
                                    setActiveCategory(null);
                                    setActiveSubcategory(null);
                                }}
                            />
                        </div>
                    )}

                    {showProfile ? (
                        <Profile/>
                    ) : showSettings ? (
                        <Settings/>
                    ) : showRoles ? (
                        <RoleManagement/>
                    ) : (
                        activeTab === 'Dashboard' ? (
                            <Dashboard
                                resources={resources}
                                categories={categories}
                                onOpenResource={handleOpenResource}
                                onToggleFavorite={handleToggleFavorite}
                                onOpenLibrary={handleOpenLibrary}
                                onOpenProfile={handleOpenProfile}
                                onOpenSettings={handleOpenSettings}
                                onOpenRoles={handleOpenRoles}
                            />
                        ) : (
                            <ResourceGrid
                                resources={resources}
                                onOpenResource={handleOpenResource}
                                onToggleFavorite={handleToggleFavorite}
                                isLoading={isLoading}
                            />
                        )
                    )}
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
