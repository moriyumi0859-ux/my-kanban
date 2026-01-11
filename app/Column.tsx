import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  id: string;
  title: string;
  tasks: any[];
  onDelete: (id: string) => void;
  onUpdateDate: (id: string, newDate: string) => void; // 期限更新用の定義を追加
}

export function Column({ id, title, tasks, onDelete, onUpdateDate }: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="bg-slate-200/50 backdrop-blur-sm p-5 rounded-2xl w-80 min-h-[600px] border border-slate-200 flex flex-col">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{title}</h2>
        <span className="bg-slate-300 text-slate-600 px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
      </div>

      <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
        <div className="flex-1 min-h-[150px]">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              id={task.id} 
              content={task.content} 
              due_date={task.due_date} 
              onDelete={onDelete} 
              onUpdateDate={onUpdateDate} // TaskCardへ更新機能を渡す
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}