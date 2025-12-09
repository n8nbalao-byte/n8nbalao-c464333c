import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, X } from 'lucide-react';
import { getIconFromKey } from '@/lib/icons';
import { Category, updateCategory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SortableCategoryItemProps {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (key: string) => void;
}

function SortableCategoryItem({ category, onEdit, onDelete }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getIconFromKey(category.icon || 'package');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm ${
        isDragging ? 'ring-2 ring-primary' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      
      <Icon className="h-5 w-5 text-gray-600" />
      
      <span className="flex-1 font-medium text-gray-800">{category.label}</span>
      
      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
        {category.key}
      </span>
      
      <button
        onClick={() => onEdit(category)}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
      
      {!category.isSystem && (
        <button
          onClick={() => onDelete(category.key)}
          className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface SortableCategoriesProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  onEdit: (cat: Category) => void;
  onDelete: (key: string) => void;
}

export function SortableCategories({
  categories,
  onCategoriesChange,
  onEdit,
  onDelete,
}: SortableCategoriesProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<Category[]>(categories);

  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.key === active.id);
      const newIndex = items.findIndex((item) => item.key === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onCategoriesChange(newItems);

      // Update sort order in database
      for (let i = 0; i < newItems.length; i++) {
        const cat = newItems[i];
        if (cat.sortOrder !== i) {
          await updateCategory(cat.key, { sortOrder: i });
        }
      }

      toast({ title: 'Ordem atualizada', description: 'A ordem das categorias foi salva.' });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((category) => (
            <SortableCategoryItem
              key={category.key}
              category={category}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
