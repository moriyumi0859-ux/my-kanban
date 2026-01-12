"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

export function Column({ id, title, tasks, currentUserName, onDelete, onUpdateDate }: any) {
  const { setNodeRef } = useDroppable({ id });

  // 確実に「文字列の配列」として作成
  const taskIds = tasks.map((t: any) => String(t.id));

  return (
    <div ref={setNodeRef} className="bg-slate-200/50 p-5 rounded-2xl w-80 min-h-[600px] flex flex-col">
      <h2 className="font-bold text-slate-700 mb-5">{title}</h2>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1">
          {tasks.map((task: any) => (
            <TaskCard 
              key={String(task.id)} 
              id={String(task.id)} // ここで渡すIDと
              content={task.content} 
              userName={task.user_name} 
              currentUserName={currentUserName} 
              onDelete={onDelete} 
              onUpdateDate={onUpdateDate}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}