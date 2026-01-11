import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Calendar } from "lucide-react";

interface TaskCardProps {
  id: string;
  content: string;
  due_date?: string; // 期限を追加
  onDelete: (id: string) => void;
}

export function TaskCard({ id, content, due_date, onDelete }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200 group relative"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <p className="text-gray-800 font-medium mb-2">{content}</p>
        
        {/* 期限があれば表示 */}
        {due_date && (
          <div className="flex items-center text-[10px] text-blue-600 font-bold bg-blue-50 w-fit px-2 py-0.5 rounded border border-blue-100">
            <Calendar size={12} className="mr-1" />
            <span>期限: {due_date}</span>
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(id)}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}