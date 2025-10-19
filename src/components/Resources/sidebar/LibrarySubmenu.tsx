import { Brain, Globe, FlaskConical, BookOpen, Wrench } from 'lucide-react';

interface LibrarySubmenuProps {
  isOpen: boolean; // Library selected (expanded with labels)
  sidebarOpen: boolean; // Sidebar wide vs collapsed
  onSelect: (slug: string) => void;
}

export function LibrarySubmenu({ isOpen, sidebarOpen, onSelect }: LibrarySubmenuProps) {
  if (!isOpen || !sidebarOpen) return null;
  const items = [
    { label: 'AI & ML', slug: 'ai-and-ml', Icon: Brain },
    { label: 'Web & Design', slug: 'web-and-design', Icon: Globe },
    { label: 'R&D', slug: 'rnd', Icon: FlaskConical },
    { label: 'Studying', slug: 'studying', Icon: BookOpen },
    { label: 'Tools', slug: 'tools', Icon: Wrench },
  ];

  // Calculate max height for 3 items (each item is 48px with gap)
  const maxHeight = 3 * 48; // 144px for 3 items

  return (
    <div className="mt-1 pl-12">
      <div 
        className="flex flex-col gap-0 overflow-y-auto scrollbar-submenu pr-1"
        style={{ maxHeight: `${maxHeight}px` }}
      >
        {items.map(({ label, slug, Icon }) => (
          <button
            key={slug}
            className="group w-full h-12 px-3 rounded flex items-center gap-3 sidebar-button flex-shrink-0"
            onClick={() => onSelect(slug)}
            title={label}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <Icon className="h-5 w-5 sidebar-icon" />
            </div>
            <span className="text-sm truncate text-black dark:text-white">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
