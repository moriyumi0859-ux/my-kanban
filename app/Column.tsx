"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

export function Column({ id, title, tasks, currentUserName, onDelete, onUpdateDate }: any) {
  const { setNodeRef } = useDroppable({ id });
  const taskIds = tasks.map((t: any) => String(t.id));

  return (
    <div ref={setNodeRef} className="bg-slate-200/50 p-4 rounded-2xl w-80 min-h-[500px]">
      <h2 className="font-bold text-slate-600 mb-4 px-2 text-sm">{title}</h2>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {tasks.map((task: any) => (
            <TaskCard 
              key={String(task.id)} id={String(task.id)} content={task.content} 
              due_date={task.due_date} userName={task.user_name} 
              currentUserName={currentUserName} onDelete={onDelete} onUpdateDate={onUpdateDate} 
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}