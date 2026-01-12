"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Calendar, GripVertical } from "lucide-react";

export function TaskCard({ id, content, due_date, userName, currentUserName, onDelete, onUpdateDate }: any) {
  // idを確実に文字列として扱う
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(id) });

  const isMine = userName === currentUserName;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white p-4 rounded-xl mb-3 border-2 transition-all group relative ${
        isMine ? "border-blue-400 shadow-md" : "border-gray-100 shadow-sm"
      }`}
    >
      <div {...attributes} {...listeners} className={isMine ? "cursor-grab active:cursor-grabbing" : "cursor-default"}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${isMine ? "bg-blue-500" : "bg-gray-400"}`}>
              {initial}
            </div>
            <span className={isMine ? "text-blue-600" : "text-gray-500"}>{userName}</span>
          </div>
          {isMine && <GripVertical size={14} className="text-gray-300" />}
        </div>
        <p className="text-gray-800 text-sm mb-2">{content}</p>
      </div>
      
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
        <input type="date" className="text-[10px] text-gray-400 border-none p-0" value={due_date || ""} onChange={(e) => onUpdateDate(id, e.target.value)} />
        <button onClick={() => onDelete(id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
      </div>
    </div>
  );
}