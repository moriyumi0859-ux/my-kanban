"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import { 
  DndContext, closestCorners, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay 
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { supabase } from "./supabase";

const COLUMNS = [{ id: "todo", title: "TODO" }, { id: "doing", title: "進行中" }, { id: "done", title: "完了" }];

export default function Home() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [passInput, setPassInput] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    const saved = localStorage.getItem("kanban-user");
    if (saved) { setUserName(saved); setIsLoggedIn(true); }
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    if (data) setTasks(data.map((t: any) => ({ ...t, id: String(t.id) })));
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    const { data } = await supabase.from("tasks").insert([{ 
      content: newTaskContent, status: "todo", due_date: newDueDate || null, user_name: userName 
    }]).select();
    if (data) {
      setTasks([...tasks, { ...data[0], id: String(data[0].id) }]);
      setNewTaskContent(""); setNewDueDate("");
    }
  };

  const deleteTask = async (id: string) => {
    if (window.confirm("このタスクを削除しますか？")) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (!error) setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateTaskDate = async (id: string, date: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, due_date: date } : t));
    await supabase.from("tasks").update({ due_date: date || null }).eq("id", id);
  };

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const activeTask = tasks.find(t => t.id === activeIdStr);
    if (!activeTask || activeTask.user_name !== userName) return;
    const overColId = COLUMNS.some(c => c.id === overIdStr) ? overIdStr : tasks.find(t => t.id === overIdStr)?.status;
    if (overColId && activeTask.status !== overColId) {
      setTasks(prev => prev.map(t => t.id === activeIdStr ? { ...t, status: overColId } : t));
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const activeTask = tasks.find(t => t.id === String(active.id));
    if (activeTask && activeTask.user_name === userName) {
      await supabase.from("tasks").update({ status: activeTask.status }).eq("id", active.id);
      if (active.id !== over.id) {
        setTasks(prev => {
          const oldIdx = prev.findIndex(t => t.id === String(active.id));
          const newIdx = prev.findIndex(t => t.id === String(over.id));
          return arrayMove(prev, oldIdx, newIdx);
        });
      }
    }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-80 text-center">
        <h2 className="text-xl font-bold mb-4">Kanban Login</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const { data } = await supabase.from("users").select("*").eq("name", loginInput).eq("password", passInput).single();
          if (data) { setUserName(data.name); setIsLoggedIn(true); localStorage.setItem("kanban-user", data.name); fetchTasks(); }
          else { alert("ログイン失敗"); }
        }}>
          <input className="border w-full p-2 rounded mb-2 outline-none" placeholder="名前" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
          <input className="border w-full p-2 rounded mb-4 outline-none" type="password" placeholder="暗証番号" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button type="submit" className="bg-blue-600 text-white w-full p-2 rounded font-bold">ログイン</button>
        </form>
      </div>
    </div>
  );

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-bold text-blue-600">Project Board</h1>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border shadow-sm">
            <User size={16} /> <span className="font-bold text-sm">{userName} さん</span>
            <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem("kanban-user"); }} className="text-red-500 text-xs ml-2 font-bold">ログアウト</button>
          </div>
        </div>

        <form onSubmit={addTask} className="max-w-md mx-auto mb-10 flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm border">
          <input className="border p-2 rounded-lg outline-none" value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} placeholder="タスクを入力..." />
          <div className="flex gap-2">
            <input className="border p-2 rounded-lg text-sm flex-1 outline-none" type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">追加</button>
          </div>
        </form>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 justify-center">
            {COLUMNS.map(col => (
              <Column key={col.id} id={col.id} title={col.title} tasks={tasks.filter(t => t.status === col.id)} currentUserName={userName} onDelete={deleteTask} onUpdateDate={updateTaskDate} />
            ))}
          </div>
          <DragOverlay>
            {activeId ? <TaskCard id={activeId} content={tasks.find(t => t.id === activeId)?.content} due_date={tasks.find(t => t.id === activeId)?.due_date} userName={tasks.find(t => t.id === activeId)?.user_name} currentUserName={userName} onDelete={() => {}} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
}