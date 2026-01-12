"use client";

import React, { useState, useEffect } from "react";
import { Plus, LogOut, User } from "lucide-react";
import { DndContext, closestCorners, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
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
  
  // ログイン管理用のステート
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [loginInput, setLoginInput] = useState("");
  const [passInput, setPassInput] = useState("");

  useEffect(() => {
    // ページを開いたときに、すでにログインしているか確認（簡易版）
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
    
    if (error) console.error("データ取得エラー:", error.message);
    else setTasks(data || []);
  };

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput || !passInput) return;

    // 本来はSupabaseのAuth機能を使いますが、今回は分かりやすさ優先で
    // ユーザーテーブルに名前とパスワードがあるかチェックします
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("name", loginInput)
      .eq("password", passInput)
      .single();

    if (data) {
      setIsLoggedIn(true);
      setUserName(data.name);
      localStorage.setItem("kanban-user", data.name);
    } else {
      alert("名前または暗証番号が違います。先に登録が必要かもしれません。");
    }
  };

  // 新規登録処理
  const handleRegister = async () => {
    if (!loginInput || !passInput) return;
    const { error } = await supabase
      .from("users")
      .insert([{ name: loginInput, password: passInput }]);

    if (error) alert("登録に失敗しました: " + error.message);
    else alert("登録完了！そのままログインしてください。");
  };

  const handleLogout = () => {
    localStorage.removeItem("kanban-user");
    setIsLoggedIn(false);
    setUserName("");
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    const taskData = {
      content: newTaskContent,
      status: "todo",
      due_date: newDueDate || null,
      user_name: userName, // ここで「誰が作ったか」を保存！
    };

    const { data, error } = await supabase.from("tasks").insert([taskData]).select();

    if (error) alert("保存失敗: " + error.message);
    else if (data) {
      setTasks([...tasks, data[0]]);
      setNewTaskContent("");
      setNewDueDate("");
    }
  };

  // --- (updateTaskDate, deleteTask, handleDragOver, handleDragEnd は前回と同じなので省略可ですが、一応含めておきます) ---
  const updateTaskDate = async (id: string, newDate: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, due_date: newDate } : t));
    await supabase.from("tasks").update({ due_date: newDate || null }).eq("id", id);
  };

  const deleteTask = async (id: string) => {
    if (window.confirm("削除しますか？")) {
      await supabase.from("tasks").delete().eq("id", id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleDragOver = async (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;
    const overColumnId = COLUMNS.find(col => col.id === overId) ? overId : tasks.find(t => t.id === overId)?.status;
    if (overColumnId && activeTask.status !== overColumnId) {
      const newStatus = overColumnId as string;
      setTasks((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t)));
      await supabase.from("tasks").update({ status: newStatus }).eq("id", activeId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTasks((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  // ログインしていない時の画面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Kanban Login</h2>
          <div className="flex flex-col gap-4">
            <input type="text" placeholder="名前" className="p-3 border rounded-xl" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
            <input type="password" placeholder="暗証番号" className="p-3 border rounded-xl" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button onClick={handleLogin} className="bg-blue-600 text-white p-3 rounded-xl font-bold">ログイン</button>
            <button onClick={handleRegister} className="text-blue-600 text-sm">新規ユーザー登録はこちら</button>
          </div>
        </div>
      </div>
    );
  }

  // ログイン後の画面
  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <div className="flex justify-between items-center mb-8 max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Project Board</h1>
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-full shadow-sm border">
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-700">{userName} さん</span>
          <button onClick={handleLogout} className="ml-2 p-1 text-slate-400 hover:text-red-500"><LogOut className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="max-w-md mx-auto mb-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={addTask} className="flex flex-col gap-3">
          <input type="text" value={newTaskContent} onChange={(e) => setNewTaskContent(e.target.value)} placeholder="タスクを入力..." className="p-3 rounded-xl border border-slate-100 focus:ring-2 focus:ring-blue-500 shadow-inner" />
          <div className="flex gap-2">
            <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="flex-1 p-2 rounded-xl border border-slate-100 text-sm cursor-pointer" />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md">追加</button>
          </div>
        </form>
      </div>

      <DndContext collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 justify-center overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} title={col.title} tasks={tasks.filter(t => t.status === col.id)} onDelete={deleteTask} onUpdateDate={updateTaskDate} />
          ))}
        </div>
      </DndContext>
    </main>
  );
}