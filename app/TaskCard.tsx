import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Calendar, AlertCircle } from "lucide-react";

interface TaskCardProps {
  id: string;
  content: string;
  due_date?: string;
  onDelete: (id: string) => void;
  onUpdateDate: (id: string, newDate: string) => void; // 期限変更用
}

export function TaskCard({ id, content, due_date, onDelete, onUpdateDate }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 期限の緊急度をチェックする関数
  const getDueStatus = () => {
    if (!due_date) return "none";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(due_date);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "urgent"; // 今日または期限切れ
    if (diffDays <= 3) return "warning"; // 3日以内
    return "normal";
  };

  const status = getDueStatus();

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200 group relative">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <p className="text-gray-800 font-medium mb-2">{content}</p>
        
        {due_date && (
          <div className={`flex items-center text-[10px] font-bold w-fit px-2 py-0.5 rounded border ${
            status === "urgent" ? "bg-red-50 text-red-600 border-red-100" :
            status === "warning" ? "bg-amber-50 text-amber-600 border-amber-100" :
            "bg-blue-50 text-blue-600 border-blue-100"
          }`}>
            {status === "urgent" && <AlertCircle size={12} className="mr-1" />}
            <Calendar size={12} className="mr-1" />
            <span>期限: {due_date}</span>
          </div>
        )}
      </div>

      {/* 期限を直接クリックして変更できる入力欄（簡易編集機能） */}
      <input 
        type="date" 
        className="mt-2 text-[10px] border-none p-0 cursor-pointer text-gray-400 bg-transparent focus:ring-0"
        onChange={(e) => onUpdateDate(id, e.target.value)}
      />

      <button onClick={() => onDelete(id)} className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
        <Trash2 size={16} />
      </button>
    </div>
  );
}