"use client";

import React, { useState, useEffect } from "react";
import { LogOut, User, Plus } from "lucide-react";
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

  // マウスでのドラッグ感度を調整（クリックとドラッグの誤認を防ぐ）
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
      console.error(error);
    } else if (data) {
      // 全てのタスクIDを確実に文字列に変換してステートに保存
      setTasks(data.map((t: any) => ({ ...t, id: String(t.id) })));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("name", loginInput)
      .eq("password", passInput)
      .single();

    if (data) {
      setUserName(data.name);
      setIsLoggedIn(true);
      localStorage.setItem("kanban-user", data.name);
      fetchTasks();
    } else {
      alert("名前または暗証番号が正しくありません。");
    }
  };

  const handleRegister = async () => {
    if (!loginInput || !passInput) return;
    const { error } = await supabase
      .from("users")
      .insert([{ name: loginInput, password: passInput }]);
    
    if (error) alert("登録に失敗しました: " + error.message);
    else alert("登録に成功しました！そのままログインしてください。");
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

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
      alert("追加に失敗しました。");
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
    const overId = String(over.id);

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask || activeTask.user_name !== userName) return;

    // 移動先のカラムIDを見つける
    const overColumnId = COLUMNS.some((col) => col.id === overId)
      ? overId
      : tasks.find((t) => t.id === overId)?.status;

    if (overColumnId && activeTask.status !== overColumnId) {
      setTasks((prev) => 
        prev.map((t) => (t.id === activeId ? { ...t, status: overColumnId } : t))
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = tasks.find((t) => t.id === activeId);

    if (activeTask && activeTask.user_name === userName) {
      // データベースを更新
      await supabase.from("tasks").update({ status: activeTask.status }).eq("id", activeId);

      if (activeId !== overId) {
        setTasks((items) => {
          const oldIndex = items.findIndex((t) => t.id === activeId);
          const newIndex = items.findIndex((t) => t.id === overId);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    }
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task?.user_name !== userName) return;
    
    if (window.confirm("このタスクを削除しますか？")) {
      await supabase.from("tasks").delete().eq("id", id);
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const updateTaskDate = async (id: string, date: string) => {
    const task = tasks.find(t => t.id === id);
    if (task?.user_name !== userName) return;

    setTasks(prev => prev.map(t => t.id === id ? { ...t, due_date: date } : t));
    await supabase.from("tasks").update({ due_date: date || null }).eq("id", id);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Kanban Login</h2>
          <div className="space-y-4">
            <input className="border w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="名前" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
            <input className="border w-full p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" type="password" placeholder="暗証番号" value={passInput} onChange={e => setPassInput(e.target.value)} />
            <button onClick={handleLogin} className="bg-blue-600 text-white w-full p-3 rounded-xl font-bold hover:bg-blue-700 transition-all">ログイン</button>
            <button onClick={handleRegister} className="text-blue-600 text-sm font-medium hover:underline">新規ユーザー登録はこちら</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Project Board</h1>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <User size={18} className="text-blue-600" />
            <span className="font-bold text-slate-700">{userName} さん</span>
            <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem("kanban-user"); }} className="text-slate-400 hover:text-red-500 ml-2">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto mb-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={addTask} className="flex flex-col gap-3">
            <input className="border border-slate-100 p-3 flex-1 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} placeholder="新しいタスクを入力..." />
            <div className="flex gap-2">
              <input className="border border-slate-100 p-2 rounded-xl text-sm flex-1 outline-none" type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95">追加</button>
            </div>
          </form>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 justify-center overflow-x-auto pb-8">
            {COLUMNS.map(col => (
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
      </div>
    </main>
  );
}