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
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
    if (error) console.error(error);
    if (data) setTasks(data.map((t: any) => ({ ...t, id: String(t.id) })));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from("users").select("*").eq("name", loginInput).eq("password", passInput).single();
    if (data) {
      setUserName(data.name);
      setIsLoggedIn(true);
      localStorage.setItem("kanban-user", data.name);
      fetchTasks();
    } else {
      alert("ログイン失敗");
    }
  };

  const handleRegister = async () => {
    const { error } = await supabase.from("users").insert([{ name: loginInput, password: passInput }]);
    if (error) alert("登録失敗: " + error.message);
    else alert("登録成功！ログインしてください");
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    
    // 確実にデータを送るためのログ
    console.log("送信データ:", { content: newTaskContent, user_name: userName });

    const { data, error } = await supabase
      .from("tasks")
      .insert([{ 
        content: newTaskContent, 
        status: "todo", 
        due_date: newDueDate || null, 
        user_name: userName 
      }])
      .select();

    if (error) {
      alert("追加エラー: " + error.message);
    } else if (data) {
      setTasks([...tasks, { ...data[0], id: String(data[0].id) }]);
      setNewTaskContent("");
      setNewDueDate("");
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask || activeTask.user_name !== userName) return;
    const overId = String(over.id);
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
      await supabase.from("tasks").update({ status: activeTask.status }).eq("id", activeId);
      if (active.id !== over.id) {
        const oldIndex = tasks.findIndex((t) => t.id === activeId);
        const newIndex = tasks.findIndex((t) => t.id === String(over.id));
        if (newIndex !== -1) setTasks((items) => arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-md w-80 text-center">
          <h2 className="mb-4 font-bold">ログイン</h2>
          <input className="border w-full p-2 mb-2" placeholder="名前" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
          <input className="border w-full p-2 mb-4" type="password" placeholder="暗証番号" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button onClick={handleLogin} className="bg-blue-600 text-white w-full p-2 rounded mb-2">ログイン</button>
          <button onClick={handleRegister} className="text-blue-600 text-sm">新規登録</button>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Project Board</h1>
          <div className="text-sm">{userName} さん</div>
        </div>

        <form onSubmit={addTask} className="mb-8 flex gap-2">
          <input className="border p-2 flex-1 rounded" value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} placeholder="タスク..." />
          <input className="border p-2 rounded text-sm" type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
          <button type="submit" className="bg-blue-600 text-white px-4 rounded">追加</button>
        </form>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4">
            {COLUMNS.map(col => (
              <Column key={col.id} id={col.id} title={col.title} tasks={tasks.filter(t => t.status === col.id)} currentUserName={userName} onDelete={() => {}} onUpdateDate={() => {}} />
            ))}
          </div>
        </DndContext>
      </div>
    </main>
  );
}