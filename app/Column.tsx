"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  id: string;
  title: string;
  tasks: any[];
  currentUserName: string;
  onDelete: (id: string) => void;
  onUpdateDate: (id: string, newDate: string) => void;
}

export function Column({ id, title, tasks, currentUserName, onDelete, onUpdateDate }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  // IDを確実に文字列の配列にする
  const taskIds = tasks.map((t) => String(t.id));

  return (
    <div ref={setNodeRef} className="bg-slate-200/50 backdrop-blur-sm p-5 rounded-2xl w-80 min-h-[600px] border border-slate-200 flex flex-col">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{title}</h2>
        <span className="bg-slate-300 text-slate-600 px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 min-h-[150px]">
          {tasks.map((task) => (
            <TaskCard 
              key={String(task.id)} // ここをStringにする
              id={String(task.id)}  // ここをStringにする
              content={task.content} 
              due_date={task.due_date} 
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