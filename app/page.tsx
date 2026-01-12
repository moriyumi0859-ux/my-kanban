"use client";

import React, { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
import { 
  DndContext, 
  closestCorners, 
  DragStartEvent, // 追加
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
  const [newTaskContent, setNewTaskContent] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [passInput, setPassInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
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
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("データ取得エラー:", error.message);
    } else {
      const formattedTasks = (data || []).map(t => ({
        ...t,
        id: String(t.id)
      }));
      setTasks(formattedTasks);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !passInput) return;
    const { data } = await supabase.from("users").select("*").eq("name", loginInput).eq("password", passInput).single();
    if (data) {
      setIsLoggedIn(true);
      setUserName(data.name);
      localStorage.setItem("kanban-user", data.name);
    } else {
      alert("名前または暗証番号が違います。");
    }
  };

  const handleRegister = async () => {
    if (!loginInput || !passInput) return;
    const { error } = await supabase.from("users").insert([{ name: loginInput, password: passInput }]);
    if (error) alert("登録に失敗しました");
    else alert("登録完了！ログインしてください。");
  };

  const handleLogout = () => {
    localStorage.removeItem("kanban-user");
    setIsLoggedIn(false);
    setUserName("");
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    const taskData = { content: newTaskContent, status: "todo", due_date: newDueDate || null, user_name: userName };
    const { data, error } = await supabase.from("tasks").insert([taskData]).select();
    if (error) alert("保存失敗");
    else if (data) {
      setTasks([...tasks, { ...data[0], id: String(data[0].id) }]);
      setNewTaskContent("");
      setNewDueDate("");
    }
  };

  // --- ドラッグ制御の追加 ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedTask = tasks.find(t => t.id === active.id);
    
    // 自分のタスクでない場合はドラッグを開始させない
    if (draggedTask && draggedTask.user_name !== userName) {
      // dnd-kitはDragStartを直接キャンセルする機能がないため、
      // 実際には handleDragOver と handleDragEnd で処理を止めるようにします。
      console.log("他人のタスクは操作できません");
    }
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const activeTask = tasks.find((t) => t.id === active.id);
    // 【ガード設定】自分のタスクでないなら何もしない
    if (!activeTask || activeTask.user_name !== userName) return;

    const overId = over.id;
    const overColumnId = COLUMNS.find(col => col.id === overId) ? overId : tasks.find(t => t.id === overId)?.status;
    
    if (overColumnId && activeTask.status !== overColumnId) {
      const newStatus = overColumnId as string;
      setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t)));
      await supabase.from("tasks").update({ status: newStatus }).eq("id", active.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    // 【ガード設定】自分のタスクでないなら何もしない
    if (!activeTask || activeTask.user_name !== userName) return;

    setTasks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const updateTaskDate = async (id: string, newDate: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (targetTask?.user_name !== userName) {
      alert("自分のタスク以外の日付は変更できません");
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, due_date: newDate } : t));
    await supabase.from("tasks").update({ due_date: newDate || null }).eq("id", id);
  };

  const deleteTask = async (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    if (targetTask?.user_name !== userName) {
      alert("自分のタスク以外は削除できません");
      return;
    }
    if (window.confirm("削除しますか？")) {
      await supabase.from("tasks").delete().eq("id", id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // --- UI部分は以前と同じ ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Kanban Login</h2>
          <div className="flex flex-col gap-4">
            <input type="text" placeholder="名前" className="p-3 border rounded-xl" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
            <input type="password" placeholder="暗証番号" className="p-3 border rounded-xl" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button onClick={handleLogin} className="bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">ログイン</button>
            <button onClick={handleRegister} className="text-blue-600 text-sm hover:underline">新規ユーザー登録はこちら</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Project Board</h1>
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full shadow-sm border border-slate-200">
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-700">{userName} さん</span>
          <button onClick={handleLogout} className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-md mx-auto mb-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={addTask} className="flex flex-col gap-3">
          <input type="text" value={newTaskContent} onChange={(e) => setNewTaskContent(e.target.value)} placeholder="タスクを入力..." className="p-3 rounded-xl border border-slate-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" />
          <div className="flex gap-2">
            <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="flex-1 p-2 rounded-xl border border-slate-100 text-sm cursor-pointer outline-none" />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md active:scale-95">追加</button>
          </div>
        </form>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart} // 追加
        onDragOver={handleDragOver} 
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 justify-center overflow-x-auto pb-8 px-4">
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