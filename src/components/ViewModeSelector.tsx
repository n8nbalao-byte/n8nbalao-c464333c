import { Grid3X3, LayoutGrid, List } from "lucide-react";
import { useViewMode, ViewMode } from "@/contexts/ViewModeContext";

interface ViewModeSelectorProps {
  className?: string;
}

export function ViewModeSelector({ className = "" }: ViewModeSelectorProps) {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-sm text-gray-500 mr-2">Visualização:</span>
      <button
        onClick={() => setViewMode('compact')}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'compact' 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Cards compactos"
      >
        <Grid3X3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => setViewMode('standard')}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'standard' 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Cards padrão"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-2 rounded-lg transition-colors ${
          viewMode === 'list' 
            ? 'bg-primary text-white' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Lista"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
