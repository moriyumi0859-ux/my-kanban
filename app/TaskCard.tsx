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

  // --- 【改良版】期限チェックロジック ---
  const getDeadlineStatus = () => {
    if (!due_date) return "normal";

    // 現在の日本時間の日付を YYYY-MM-DD 形式で取得
    const now = new Date();
    const todayStr = now.toLocaleDateString('sv-SE'); // "2026-01-13" のような形式
    
    // 文字列のまま比較することで、時間のズレ（時差）による誤判定を防ぎます
    if (due_date < todayStr) return "overdue"; // 期限切れ
    if (due_date === todayStr) return "today"; // 当日
    return "normal";
  };

  const status = getDeadlineStatus();
  const isUrgent = status === "overdue" || status === "today";

  // 背景色と枠線の判定
  const bgClass = isUrgent 
    ? "bg-red-50 border-red-300" 
    : "bg-white border-gray-100";
    
  const textClass = isUrgent ? "text-red-700 font-bold" : "text-slate-700";

  return (
    <div 
      ref={setNodeRef} style={style} 
      className={`p-4 rounded-xl border-2 transition-all shadow-sm ${bgClass} ${
        isOverlay ? "border-blue-500 shadow-xl scale-105" : isMine ? "border-blue-100" : "border-gray-50"
      }`}
    >
      <div {...attributes} {...listeners} className={isMine ? "cursor-grab" : "cursor-default"}>
        <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] text-gray-400 font-bold">{userName}</p>
          {status === "overdue" && <span className="text-[10px] text-red-600 font-bold">期限切れ</span>}
          {status === "today" && <span className="text-[10px] text-red-600 font-bold">本日まで</span>}
        </div>
        <p className={`text-sm ${textClass}`}>{content}</p>
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