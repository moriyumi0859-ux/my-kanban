"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, GripVertical } from "lucide-react";

export function TaskCard({ id, content, userName, currentUserName, onDelete, onUpdateDate }: any) {
  // ここで渡す id が SortableContext の items にあるものと一致する必要があります
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: id 
  });

  const isMine = userName === currentUserName;

  const style = {
    // 浮き出る効果を確実に出す設定
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
    position: 'relative' as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-white p-4 rounded-xl mb-3 border-2 transition-all ${
        isDragging 
          ? "border-blue-500 shadow-2xl ring-4 ring-blue-100 scale-105" // ドラッグ中の強調
          : isMine ? "border-blue-200" : "border-gray-100"
      }`}
    >
      <div {...attributes} {...listeners} className={isMine ? "cursor-grab" : "cursor-default"}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-gray-400">{userName}</span>
          {isMine && <GripVertical size={14} className="text-gray-300" />}
        </div>
        <p className="text-sm font-medium text-slate-700">{content}</p>
      </div>
    </div>
  );
}