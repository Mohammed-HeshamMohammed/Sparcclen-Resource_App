import { Brain, Globe, FlaskConical, BookOpen } from 'lucide-react';

interface LibrarySubmenuProps {
  isOpen: boolean; // Library selected (expanded with labels)
  sidebarOpen: boolean; // Sidebar wide vs collapsed
  onSelect: (slug: string) => void;
}

export function LibrarySubmenu({ isOpen, sidebarOpen, onSelect }: LibrarySubmenuProps) {
  if (!isOpen) return null;
  const items = [
    { label: 'AI & ML', slug: 'ai-and-ml', Icon: Brain },
    { label: 'Web & Design', slug: 'web-and-design', Icon: Globe },
    { label: 'R&D', slug: 'rnd', Icon: FlaskConical },
    { label: 'Studying', slug: 'studying', Icon: BookOpen },
  ];

  return (
    <div className={`${sidebarOpen ? 'ml-8' : 'ml-0'} mt-1 flex flex-col gap-0.5`}>
      {items.map(({ label, slug, Icon }) => (
        <button
          key={slug}
          className="group w-full h-8 px-2 rounded flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700/50"
          onClick={() => onSelect(slug)}
          title={label}
        >
          <Icon className="h-4 w-4" />
          {sidebarOpen ? (
            <span className="text-sm truncate">{label}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
