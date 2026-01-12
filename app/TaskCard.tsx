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

  // 期限チェック：文字列で比較
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const isUrgent = due_date && due_date <= todayStr;

  // --- 【強調表示のロジック】 ---
  // 自分のタスク：青い光の枠 (ring) をつける
  // 他人のタスク：少し背景をグレーにして透明度を下げる
  const myTaskClass = isMine 
    ? "ring-2 ring-blue-400 border-blue-200 bg-white" 
    : "bg-slate-50/50 border-gray-100 opacity-80";

  const urgentClass = isUrgent ? "bg-red-50 border-red-300" : "";

  return (
    <div 
      ref={setNodeRef} style={style} 
      className={`p-4 rounded-xl border-2 transition-all shadow-sm ${myTaskClass} ${urgentClass} ${
        isOverlay ? "border-blue-500 shadow-xl scale-105" : ""
      }`}
    >
      <div {...attributes} {...listeners} className={isMine ? "cursor-grab" : "cursor-default"}>
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1">
            <p className={`text-[10px] font-bold ${isMine ? "text-blue-600" : "text-gray-400"}`}>
              {userName} {isMine && "(あなた)"}
            </p>
          </div>
          {due_date === todayStr && <span className="text-[10px] text-red-600 font-bold">本日!</span>}
        </div>
        <p className={`text-sm font-medium ${isUrgent ? "text-red-700" : "text-slate-700"}`}>
          {content}
        </p>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
        <div className={`flex items-center gap-1 ${isUrgent ? "text-red-500" : "text-gray-400"}`}>
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
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
