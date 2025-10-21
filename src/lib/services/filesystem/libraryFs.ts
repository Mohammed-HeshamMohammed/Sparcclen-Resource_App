import type { Category, Resource, Tag } from '@/types';

export interface LibraryBinFile {
  categorySegment: string | null;
  subcategorySegment: string | null;
  fileName: string;
  items: Record<string, unknown>[];
}

export type LibrarySegmentsMap = Record<
  string,
  {
    segment: string;
    subsegments: Record<string, string>;
  }
>;

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createUuid = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `lib-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
};

const normalizeArrayOfRecords = (items: unknown[]): Record<string, unknown>[] =>
  items.reduce<Record<string, unknown>[]>((acc, item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      acc.push(item as Record<string, unknown>);
    }
    return acc;
  }, []);

export async function listLibraryBinFiles(options?: {
  categorySegment?: string | null;
  subcategorySegment?: string | null;
}): Promise<LibraryBinFile[]> {
  if (typeof window === 'undefined' || !window.api?.resources?.listLibraryBins) {
    return [];
  }

  const payload: Record<string, string> = {};
  if (options?.categorySegment && typeof options.categorySegment === 'string') {
    payload.category = options.categorySegment;
  }
  if (options?.subcategorySegment && typeof options.subcategorySegment === 'string') {
    payload.subcategory = options.subcategorySegment;
  }

  const response = await window.api.resources.listLibraryBins(payload);

  if (!response?.ok || !Array.isArray(response.files)) {
    return [];
  }

  return response.files.map((file: {
    categorySegment: unknown;
    subcategorySegment: unknown;
    fileName: unknown;
    items: unknown;
  }) => ({
    categorySegment: typeof file.categorySegment === 'string' ? file.categorySegment : null,
    subcategorySegment: typeof file.subcategorySegment === 'string' ? file.subcategorySegment : null,
    fileName: typeof file.fileName === 'string' ? file.fileName : 'library.bin',
    items: normalizeArrayOfRecords(Array.isArray(file.items) ? file.items : []),
  }));
}

export function buildLibraryCategories(files: LibraryBinFile[]): {
  categories: Category[];
  segmentsMap: LibrarySegmentsMap;
} {
  const now = new Date().toISOString();

  const categoryMap = new Map<
    string,
    {
      segment: string;
      count: number;
      subcategories: Map<string, { segment: string; count: number }>;
    }
  >();

  files.forEach((file) => {
    const rawCategory = (file.categorySegment || '').trim() || 'General';
    const categorySlug = slugify(rawCategory) || 'general';

    const existing = categoryMap.get(categorySlug) ?? {
      segment: rawCategory,
      count: 0,
      subcategories: new Map<string, { segment: string; count: number }>(),
    };

    existing.segment = rawCategory;
    existing.count += file.items.length;

    if (file.subcategorySegment) {
      const rawSub = file.subcategorySegment.trim();
      const subSlug = slugify(rawSub) || 'subcategory';
      const subExisting = existing.subcategories.get(subSlug) ?? { segment: rawSub, count: 0 };
      subExisting.segment = rawSub;
      subExisting.count += file.items.length;
      existing.subcategories.set(subSlug, subExisting);
    }

    categoryMap.set(categorySlug, existing);
  });

  const segmentsMap: LibrarySegmentsMap = {};

  const categories: Category[] = Array.from(categoryMap.entries())
    .map(([slug, data], index) => {
      const subcategories = Array.from(data.subcategories.entries())
        .map(([subSlug, subData], subIndex) => ({
          id: `${slug}::${subSlug}`,
          slug: subSlug,
          title: subData.segment,
          description: null,
          parent_id: slug,
          sort_order: subIndex,
          item_count: subData.count,
          created_at: now,
          updated_at: now,
        }))
        .sort((a, b) => a.title.localeCompare(b.title));

      segmentsMap[slug] = {
        segment: data.segment,
        subsegments: subcategories.reduce<Record<string, string>>((acc, sub) => {
          acc[sub.id] = sub.title;
          return acc;
        }, {}),
      };

      return {
        id: slug,
        slug,
        title: data.segment,
        description: null,
        parent_id: null,
        sort_order: index,
        item_count: data.count,
        created_at: now,
        updated_at: now,
        subcategories,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return { categories, segmentsMap };
}

export function buildLibraryResources(files: LibraryBinFile[]): Resource[] {
  const now = new Date().toISOString();
  const seen = new Set<string>();
  const resources: Resource[] = [];

  files.forEach((file) => {
    const categorySegment = (file.categorySegment || '').trim() || 'General';
    const categorySlug = slugify(categorySegment) || 'general';
    const subcategorySegment = file.subcategorySegment ? file.subcategorySegment.trim() : null;
    const subcategorySlug = subcategorySegment ? slugify(subcategorySegment) || null : null;
    const subcategoryId = subcategorySlug ? `${categorySlug}::${subcategorySlug}` : null;

    file.items.forEach((item) => {
      const uuid =
        typeof item.uuid === 'string' && item.uuid.trim().length > 0
          ? item.uuid.trim()
          : createUuid();

      if (seen.has(uuid)) return;
      seen.add(uuid);

      const title =
        typeof item.title === 'string' && item.title.trim().length > 0
          ? item.title.trim()
          : 'Untitled Entry';
      const description = typeof item.description === 'string' ? item.description : null;
      const url = typeof item.url === 'string' ? item.url : null;
      const classification =
        typeof item.classification === 'string' ? item.classification : null;
      const platform =
        typeof (item as Record<string, unknown>).platform === 'string'
          ? ((item as Record<string, unknown>).platform as string)
          : null;

      const colors = Array.isArray(item.colors)
        ? (item.colors as unknown[]).filter((value): value is string => typeof value === 'string')
        : [];

      const tagStrings = Array.isArray(item.tags)
        ? (item.tags as unknown[]).filter((value): value is string => typeof value === 'string')
        : [];

      const tags: Tag[] = tagStrings.map((tagValue, index) => {
        const cleaned = tagValue.trim();
        const tagSlug = slugify(cleaned) || `${index}`;
        return {
          id: `${tagSlug}-${uuid}`,
          name: cleaned || 'Tag',
          slug: tagSlug || cleaned.toLowerCase(),
          usage_count: 0,
          created_at: now,
        };
      });

      resources.push({
        id: uuid,
        slug: `${slugify(title)}-${uuid.slice(0, 8)}`,
        title,
        description,
        url,
        category_id: categorySlug,
        subcategory_id: subcategoryId,
        resource_type: classification || 'library',
        thumbnail_url: null,
        thumbnail_type: null,
        colors: colors.length > 0 ? colors : null,
        metadata: {
          classification,
          platform,
          sourceFile: file.fileName,
          categorySegment,
          subcategorySegment,
          original: item,
        },
        view_count: 0,
        date_added: now,
        created_at: now,
        updated_at: now,
        tags: tags.length > 0 ? tags : undefined,
        is_favorite: false,
      });
    });
  });

  return resources;
}
