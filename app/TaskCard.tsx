"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, Trash2 } from "lucide-react";

export function TaskCard({ id, content, due_date, userName, currentUserName, onDelete, isOverlay }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(id) });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isMine = userName === currentUserName;

  return (
    <div 
      ref={setNodeRef} style={style} 
      className={`bg-white p-4 rounded-xl border-2 transition-all shadow-sm ${
        isOverlay ? "border-blue-500 shadow-xl scale-105" : isMine ? "border-blue-100" : "border-gray-50"
      }`}
    >
      <div {...attributes} {...listeners} className={isMine ? "cursor-grab" : "cursor-default"}>
        <p className="text-[10px] text-gray-400 font-bold mb-1">{userName}</p>
        <p className="text-sm text-slate-700 font-medium">{content}</p>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
        <div className="flex items-center gap-1 text-gray-400">
          {due_date && (
            <>
              <Calendar size={12} />
              <span className="text-[10px]">{due_date}</span>
            </>
          )}
        </div>
        
        {isMine && !isOverlay && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(id); }} 
            className="text-gray-300 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}