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

  // --- 追加：期限チェック (既存のロジックを壊さないよう変数を定義) ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = due_date ? new Date(due_date) : null;
  if (deadline) deadline.setHours(0, 0, 0, 0);

  const isUrgent = deadline && deadline <= today; // 当日または期限切れ

  return (
    <div 
      ref={setNodeRef} style={style} 
      className={`p-4 rounded-xl border-2 transition-all shadow-sm ${
        // 判定：期限が今日以前なら赤、そうでなければ白(元の色)
        isUrgent ? "bg-red-50 border-red-300" : "bg-white border-gray-50"
      } ${
        isOverlay ? "border-blue-500 shadow-xl scale-105" : isMine ? "border-blue-100" : ""
      }`}
    >
      <div {...attributes} {...listeners} className={isMine ? "cursor-grab" : "cursor-default"}>
        <p className="text-[10px] text-gray-400 font-bold mb-1">{userName}</p>
        <p className={`text-sm font-medium ${isUrgent ? "text-red-700" : "text-slate-700"}`}>{content}</p>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
        <div className={`flex items-center gap-1 ${isUrgent ? "text-red-500 font-bold" : "text-gray-400"}`}>
          {due_date && (
            <>
              <Calendar size={12} />
              <span className="text-[10px]">{due_date} {isUrgent && deadline?.getTime() === today.getTime() ? "(本日!)" : ""}</span>
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