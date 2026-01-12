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

// 判定部分をこのように書き換えてみてください
  const isMine = userName?.trim() === currentUserName?.trim();

  // テスト用：もし自分なら「背景を黄色」にする（絶対に気づく色）
  const myTaskClass = isMine 
    ? "border-blue-500 bg-yellow-50 shadow-md ring-4 ring-blue-400" 
    : "border-gray-200 bg-slate-50 opacity-60";　

  // --- 【視認性を極限まで上げたデザイン設定】 ---
  // 自分のタスク：青い太枠 + 影 + 外側の光
  // 他人のタスク：薄い背景 + 文字を薄く
  const appearanceClass = isMine 
    ? "border-blue-500 bg-white shadow-md ring-4 ring-blue-100" 
    : "border-gray-200 bg-slate-50 opacity-60 grayscale-[0.5]";

  // 期限切れ・当日の赤い背景（自分のタスクの時だけより赤く）
  const urgentClass = isUrgent ? "bg-red-50 border-red-400 ring-red-100" : "";

  return (
    <div 
      ref={setNodeRef} style={style} 
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${appearanceClass} ${urgentClass} ${
        isOverlay ? "border-blue-600 shadow-2xl scale-105" : ""
      }`}
    >
      <div {...attributes} {...listeners} className={isMine ? "cursor-grab" : "cursor-default"}>
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1">
            {/* 自分の名前にアイコンを添える */}
            <p className={`text-[10px] font-black ${isMine ? "text-blue-700" : "text-gray-400"}`}>
              {isMine ? "★ " : ""}{userName} {isMine && "(あなた)"}
            </p>
          </div>
          {due_date === todayStr && (
            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold animate-pulse">
              本日!
            </span>
          )}
        </div>
        <p className={`text-sm font-bold ${isUrgent ? "text-red-700" : isMine ? "text-slate-800" : "text-gray-500"}`}>
          {content}
        </p>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <div className={`flex items-center gap-1 ${isUrgent ? "text-red-500" : "text-gray-400"}`}>
          {due_date && (
            <>
              <Calendar size={12} />
              <span className="text-[10px] font-bold">{due_date}</span>
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