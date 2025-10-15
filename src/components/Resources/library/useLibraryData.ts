import { useCallback, useEffect, useRef, useState } from 'react';
import type { Category, Resource, SearchFilters, Tag } from '@/types';
import {
  getCategories,
  getResources,
  searchResources
} from '@/lib/services';
import {
  listLibraryBinFiles,
  buildLibraryCategories,
  buildLibraryResources,
  type LibrarySegmentsMap
} from '@/lib/services';

interface UseLibraryDataOptions {
  userId?: string | null;
  activeTab: 'Dashboard' | 'Library' | 'Imports';
  selectedResource: Resource | null;
  onSelectedResourceChange?: (resource: Resource | null) => void;
}

const readFavoriteSet = (userId?: string | null) => {
  if (!userId || typeof window === 'undefined') {
    return new Set<string>();
  }
  try {
    const raw = window.localStorage.getItem(`favorites_${userId}`);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set<string>(
      parsed.filter((value): value is string => typeof value === 'string')
    );
  } catch {
    return new Set<string>();
  }
};

const shuffleResources = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export function useLibraryData({
  userId,
  activeTab,
  selectedResource,
  onSelectedResourceChange,
}: UseLibraryDataOptions) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [librarySegments, setLibrarySegments] = useState<LibrarySegmentsMap>({});
  const [availableClassifications, setAvailableClassifications] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [classificationFilter, setClassificationFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const orderCache = useRef<Record<string, string[]>>({});
  const selectedResourceRef = useRef<Resource | null>(selectedResource);
  useEffect(() => {
    selectedResourceRef.current = selectedResource;
  }, [selectedResource]);

  const loadCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const canUseLibraryApi =
        typeof window !== 'undefined' && window.api?.resources?.listLibraryBins;

      if (canUseLibraryApi && activeTab === 'Library') {
        const files = await listLibraryBinFiles();
        const { categories: derivedCategories, segmentsMap } =
          buildLibraryCategories(files);
        setCategories(derivedCategories);
        setLibrarySegments(segmentsMap);
      } else {
        const data = await getCategories();
        setCategories(data);
        setLibrarySegments({});
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [activeTab]);

  const loadResources = useCallback(async () => {
    setIsLoading(true);
    try {
      const canUseLibraryApi =
        typeof window !== 'undefined' && window.api?.resources?.listLibraryBins;
      if (canUseLibraryApi && activeTab === 'Library') {
        let categorySegment: string | null = null;
        let subcategorySegment: string | null = null;

        if (activeCategory && librarySegments[activeCategory]) {
          categorySegment = librarySegments[activeCategory].segment;
          if (
            activeSubcategory &&
            librarySegments[activeCategory].subsegments[activeSubcategory]
          ) {
            subcategorySegment =
              librarySegments[activeCategory].subsegments[activeSubcategory];
          }
        }

        const files = await listLibraryBinFiles({
          categorySegment,
          subcategorySegment,
        });

        let derivedResources = buildLibraryResources(files);
        const orderKey = `${categorySegment ?? 'all'}::${subcategorySegment ?? 'all'}`;
        const ids = derivedResources.map((resourceItem: Resource) => resourceItem.id);
        const existingOrder = orderCache.current[orderKey];
        if (!existingOrder) {
          orderCache.current[orderKey] = shuffleResources([...ids]);
        } else {
          const filteredExisting = existingOrder.filter(id => ids.includes(id));
          const missing = ids.filter((id: string) => !filteredExisting.includes(id));
          const updatedOrder = missing.length > 0
            ? [...filteredExisting, ...shuffleResources([...missing])]
            : filteredExisting;
          orderCache.current[orderKey] = updatedOrder;
        }
        const orderIndex = orderCache.current[orderKey]?.reduce<Record<string, number>>((acc, id, index) => {
          acc[id] = index;
          return acc;
        }, {}) ?? {};
        derivedResources.sort((a: Resource, b: Resource) => {
          const indexA = orderIndex[a.id] ?? Number.MAX_SAFE_INTEGER;
          const indexB = orderIndex[b.id] ?? Number.MAX_SAFE_INTEGER;
          return indexA - indexB;
        });

        const classificationSet = new Set<string>();
        const tagSet = new Set<string>();
        derivedResources.forEach((resourceItem: Resource) => {
          const cls =
            typeof resourceItem.metadata?.classification === 'string'
              ? resourceItem.metadata.classification
              : null;
          if (cls) {
            classificationSet.add(cls);
          }
          if (resourceItem.tags) {
            resourceItem.tags.forEach((tag: Tag) => {
              if (tag?.name) {
                tagSet.add(tag.name);
              }
            });
          }
        });
        const sortedClassifications = Array.from(classificationSet).sort((a, b) =>
          a.localeCompare(b)
        );
        setAvailableClassifications(sortedClassifications);
        if (classificationFilter && !classificationSet.has(classificationFilter)) {
          setClassificationFilter(null);
        }

        const sortedTags = Array.from(tagSet).sort((a, b) => a.localeCompare(b));
        setAvailableTags(sortedTags);
        if (tagFilter && !tagSet.has(tagFilter)) {
          setTagFilter(null);
        }

        const favoritesSet = readFavoriteSet(userId);
        derivedResources = derivedResources.map((resource: Resource) => ({
          ...resource,
          is_favorite: favoritesSet.has(resource.id),
        }));

        if (classificationFilter) {
          const filterLower = classificationFilter.toLowerCase();
          derivedResources = derivedResources.filter((resourceItem: Resource) => {
            const cls =
              typeof resourceItem.metadata?.classification === 'string'
                ? resourceItem.metadata.classification
                : null;
            return cls ? cls.toLowerCase() === filterLower : false;
          });
        }

        if (tagFilter) {
          const tagLower = tagFilter.toLowerCase();
          derivedResources = derivedResources.filter((resourceItem: Resource) =>
            resourceItem.tags?.some(tag => tag?.name.toLowerCase() === tagLower)
          );
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          derivedResources = derivedResources.filter((resourceItem: Resource) => {
            if (resourceItem.title.toLowerCase().includes(query)) return true;
            if (
              resourceItem.description &&
              resourceItem.description.toLowerCase().includes(query)
            )
              return true;
            const classification =
              typeof resourceItem.metadata?.classification === 'string'
                ? (resourceItem.metadata.classification as string).toLowerCase()
                : null;
            if (classification && classification.includes(query)) return true;
            if (
              resourceItem.tags &&
              resourceItem.tags.some((tag: Tag) =>
                tag.name.toLowerCase().includes(query)
              )
            ) {
              return true;
            }
            if (
              resourceItem.metadata?.original &&
              typeof resourceItem.metadata.original === 'object'
            ) {
              const original =
                resourceItem.metadata.original as Record<string, unknown>;
              if (
                typeof original.title === 'string' &&
                original.title.toLowerCase().includes(query)
              ) {
                return true;
              }
              if (
                typeof original.description === 'string' &&
                original.description.toLowerCase().includes(query)
              ) {
                return true;
              }
            }
            return false;
          });
        }

        if (favoritesOnly) {
          derivedResources = derivedResources.filter(
            (resource: Resource) => resource.is_favorite
          );
        }

        setResources(derivedResources);

        const currentSelectedId = selectedResourceRef.current?.id;
        if (currentSelectedId) {
          const nextSelected =
            derivedResources.find(
              (resourceItem: Resource) => resourceItem.id === currentSelectedId
            ) || null;
          onSelectedResourceChange?.(nextSelected);
        }
      } else {
        if (availableClassifications.length > 0) {
          setAvailableClassifications([]);
        }
        if (availableTags.length > 0) {
          setAvailableTags([]);
        }
        if (classificationFilter) {
          setClassificationFilter(null);
        }
        if (tagFilter) {
          setTagFilter(null);
        }

        let data: Resource[];

        if (searchQuery || favoritesOnly) {
          const filters: SearchFilters = {
            query: searchQuery,
            categoryId: activeCategory,
            subcategoryId: activeSubcategory,
            tags: [],
            favoritesOnly,
            resourceType: null,
          };
          data = await searchResources(filters, userId || undefined);
        } else {
          data = await getResources(
            activeCategory || undefined,
            activeSubcategory || undefined
          );
        }

        setResources(data);

        const currentSelectedId = selectedResourceRef.current?.id;
        if (currentSelectedId) {
          const nextSelected =
            data.find((resourceItem) => resourceItem.id === currentSelectedId) ||
            null;
          onSelectedResourceChange?.(nextSelected);
        }
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeCategory,
    activeSubcategory,
    activeTab,
    availableClassifications.length,
    availableTags.length,
    classificationFilter,
    tagFilter,
    favoritesOnly,
    librarySegments,
    onSelectedResourceChange,
    searchQuery,
    userId,
  ]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (activeTab === 'Library') {
      loadCategories();
    }
  }, [activeTab, loadCategories]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const handleSelectCategory = useCallback((categoryId: string, subcategoryId?: string) => {
    setActiveCategory(categoryId);
    setActiveSubcategory(subcategoryId ?? null);
    setClassificationFilter(null);
    setTagFilter(null);
    setSearchQuery('');
    setFavoritesOnly(false);
  }, []);

  const clearCategorySelection = useCallback(() => {
    setActiveCategory(null);
    setActiveSubcategory(null);
    setClassificationFilter(null);
    setTagFilter(null);
  }, []);

  const applyClassificationFilter = useCallback((classification: string | null) => {
    setClassificationFilter(classification);
  }, []);

  const applyTagFilter = useCallback((tag: string | null) => {
    setTagFilter(tag);
  }, []);

  const patchResourceLocally = useCallback((resourceId: string, patch: Partial<Resource>) => {
    setResources((prev) =>
      prev.map((resource) =>
        resource.id === resourceId ? { ...resource, ...patch } : resource
      )
    );
    const currentSelected = selectedResourceRef.current;
    if (currentSelected?.id === resourceId) {
      const updated = { ...currentSelected, ...patch };
      selectedResourceRef.current = updated;
      onSelectedResourceChange?.(updated);
    }
  }, [onSelectedResourceChange]);

  const updateFavoriteLocally = useCallback((resourceId: string, isFavorite: boolean) => {
    patchResourceLocally(resourceId, { is_favorite: isFavorite });
  }, [patchResourceLocally]);

  return {
    categories,
    resources,
    librarySegments,
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
    setActiveCategory,
    setActiveSubcategory,
    handleSelectCategory,
    clearCategorySelection,
    applyClassificationFilter,
    applyTagFilter,
    patchResourceLocally,
    updateFavoriteLocally,
  };
}
