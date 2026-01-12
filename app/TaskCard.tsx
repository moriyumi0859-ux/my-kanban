"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Calendar, AlertCircle, User, GripVertical } from "lucide-react";

interface TaskCardProps {
  id: string;
  content: string;
  due_date?: string;
  userName?: string;
  currentUserName?: string;
  onDelete: (id: string) => void;
  onUpdateDate: (id: string, newDate: string) => void;
}

export function TaskCard({ id, content, due_date, userName, currentUserName, onDelete, onUpdateDate }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const isMine = userName === currentUserName;

  const style = {
    transform: CSS.Translate.toString(transform), // Transform より Translate の方が動作が安定します
    transition,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const getDueStatus = () => {
    if (!due_date) return "none";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(due_date);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "urgent"; 
    if (diffDays <= 3) return "warning"; 
    return "normal";
  };

  const status = getDueStatus();
  const initial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white p-4 rounded-xl mb-3 border-2 transition-all group relative ${
        isMine 
          ? "border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
          : "border-gray-100 shadow-sm"
      }`}
    >
      {/* ドラッグを反応させるための「透明なカバー」または「ハンドル」が必要です。
          カード全体をドラッグ可能にするために、以下の div に listeners を集約します。
      */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
              isMine ? "bg-blue-600" : "bg-slate-400"
            }`}>
              {initial}
            </div>
            <span className={`text-[11px] font-bold ${isMine ? "text-blue-600" : "text-slate-500"}`}>
              {userName || "不明"}
            </span>
          </div>
          {/* ドラッグできることを示すアイコン */}
          <GripVertical size={14} className="text-slate-300" />
        </div>

        <p className="text-gray-800 font-medium mb-3">{content}</p>
        
        {due_date && (
          <div className={`flex items-center text-[10px] font-bold w-fit px-2 py-0.5 rounded border mb-1 ${
            status === "urgent" ? "bg-red-50 text-red-600 border-red-100" :
            status === "warning" ? "bg-amber-50 text-amber-600 border-amber-100" :
            "bg-blue-50 text-blue-600 border-blue-100"
          }`}>
            <Calendar size={10} className="mr-1" />
            <span>{due_date}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
        <input 
          type="date" 
          className="text-[10px] border-none p-0 cursor-pointer text-gray-400 bg-transparent focus:ring-0"
          value={due_date || ""}
          onChange={(e) => onUpdateDate(id, e.target.value)}
        />
        <button 
          onClick={() => onDelete(id)} 
          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}