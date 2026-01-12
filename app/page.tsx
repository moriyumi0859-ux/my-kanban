"use client";

import React, { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { 
  DndContext, 
  closestCorners, 
  DragEndEvent, 
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors 
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "./Column";
import { supabase } from "./supabase";

const COLUMNS = [
  { id: "todo", title: "TODO" },
  { id: "doing", title: "進行中" },
  { id: "done", title: "完了" },
];

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // 入力用
  const [newTaskContent, setNewTaskContent] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [passInput, setPassInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const savedUser = localStorage.getItem("kanban-user");
    if (savedUser) {
      setUserName(savedUser);
      setIsLoggedIn(true);
    }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    if (data) {
      setTasks(data.map(t => ({ ...t, id: String(t.id) })));
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask || activeTask.user_name !== userName) return; // 自分以外のタスクなら動かさない

    // 落とそうとしている場所（over）がカラムそのものか、別のタスクか判定
    const isOverAColumn = COLUMNS.some(col => col.id === overId);
    const overColumnId = isOverAColumn ? overId : tasks.find(t => t.id === overId)?.status;

    if (overColumnId && activeTask.status !== overColumnId) {
      setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: overColumnId } : t));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const activeTask = tasks.find(t => t.id === activeId);
    
    if (activeTask && activeTask.user_name === userName) {
      // DB更新
      await supabase.from("tasks").update({ status: activeTask.status }).eq("id", activeId);
      
      if (active.id !== over.id) {
        const oldIndex = tasks.findIndex((t) => t.id === activeId);
        const newIndex = tasks.findIndex((t) => t.id === String(over.id));
        if (newIndex !== -1) {
          setTasks((items) => arrayMove(items, oldIndex, newIndex));
        }
      }
    }
  };

  // --- (addTask, deleteTask, login 等の関数は今のままでOKですが、エラー防止のため簡略化して同梱します) ---
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    const { data } = await supabase.from("tasks").insert([{ content: newTaskContent, status: "todo", due_date: newDueDate || null, user_name: userName }]).select();
    if (data) {
      setTasks([...tasks, { ...data[0], id: String(data[0].id) }]);
      setNewTaskContent("");
    }
  };

  const deleteTask = async (id: string) => {
    const t = tasks.find(task => task.id === id);
    if (t?.user_name !== userName) return alert("自分以外のタスクは消せません");
    if (window.confirm("削除しますか？")) {
      await supabase.from("tasks").delete().eq("id", id);
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const updateTaskDate = async (id: string, date: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, due_date: date } : t));
    await supabase.from("tasks").update({ due_date: date }).eq("id", id);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Kanban Login</h2>
          <div className="flex flex-col gap-4">
            <input type="text" placeholder="名前" className="p-3 border rounded-xl" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
            <input type="password" placeholder="暗証番号" className="p-3 border rounded-xl" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button onClick={async () => {
              const { data } = await supabase.from("users").select("*").eq("name", loginInput).eq("password", passInput).single();
              if (data) { setUserName(data.name); setIsLoggedIn(true); localStorage.setItem("kanban-user", data.name); fetchTasks(); }
              else alert("失敗");
            }} className="bg-blue-600 text-white p-3 rounded-xl font-bold">ログイン</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-blue-600">Project Board</h1>
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full shadow-sm border">
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-bold">{userName} さん</span>
          <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem("kanban-user"); }} className="text-red-500 text-sm">ログアウト</button>
        </div>
      </div>

      <div className="max-w-md mx-auto mb-12 bg-white p-4 rounded-2xl shadow-sm border">
        <form onSubmit={addTask} className="flex flex-col gap-3">
          <input type="text" value={newTaskContent} onChange={(e) => setNewTaskContent(e.target.value)} placeholder="タスクを入力..." className="p-3 rounded-xl border" />
          <button type="submit" className="bg-blue-600 text-white py-2 rounded-xl font-bold">追加</button>
        </form>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 justify-center overflow-x-auto">
          {COLUMNS.map((col) => (
            <Column 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              tasks={tasks.filter(t => t.status === col.id)} 
              currentUserName={userName} 
              onDelete={deleteTask} 
              onUpdateDate={updateTaskDate} 
            />
          ))}
        </div>
      </DndContext>
    </main>
  );
}