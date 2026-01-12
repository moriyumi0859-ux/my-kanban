"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Calendar, AlertCircle, User } from "lucide-react";

interface TaskCardProps {
  id: string;
  content: string;
  due_date?: string;
  userName?: string; // ← 追加: 誰が作ったかを表示するため
  onDelete: (id: string) => void;
  onUpdateDate: (id: string, newDate: string) => void;
}

export function TaskCard({ id, content, due_date, userName, onDelete, onUpdateDate }: TaskCardProps) {
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

    if (diffDays <= 0) return "urgent"; 
    if (diffDays <= 3) return "warning"; 
    return "normal";
  };

  const status = getDueStatus();

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl shadow-sm mb-3 border border-gray-200 group relative">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        {/* タスク内容 */}
        <p className="text-gray-800 font-medium mb-2">{content}</p>
        
        <div className="flex flex-wrap gap-2 items-center">
          {/* 期限バッジ */}
          {due_date && (
            <div className={`flex items-center text-[10px] font-bold w-fit px-2 py-0.5 rounded border ${
              status === "urgent" ? "bg-red-50 text-red-600 border-red-100" :
              status === "warning" ? "bg-amber-50 text-amber-600 border-amber-100" :
              "bg-blue-50 text-blue-600 border-blue-100"
            }`}>
              {status === "urgent" && <AlertCircle size={10} className="mr-1" />}
              <Calendar size={10} className="mr-1" />
              <span>{due_date}</span>
            </div>
          )}

          {/* ★追加: 担当者(作成者)バッジ */}
          <div className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
            <User size={10} className="mr-1 text-slate-400" />
            <span>{userName || "不明"}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
        {/* 期限変更入力 */}
        <input 
          type="date" 
          className="text-[10px] border-none p-0 cursor-pointer text-gray-400 bg-transparent focus:ring-0"
          value={due_date || ""}
          onChange={(e) => onUpdateDate(id, e.target.value)}
        />

        {/* 削除ボタン */}
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