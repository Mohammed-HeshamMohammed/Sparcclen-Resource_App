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

  return (
    <div className="mt-1 flex flex-col gap-0.5 pl-12">
      {items.map(({ label, slug, Icon }) => (
        <button
          key={slug}
          className="group w-full h-8 px-3 rounded flex items-center gap-3 sidebar-button"
          onClick={() => onSelect(slug)}
          title={label}
        >
          <Icon className="h-5 w-5 sidebar-icon" />
          <span className="text-sm truncate text-black dark:text-white">{label}</span>
        </button>
      ))}
    </div>
  );
}
