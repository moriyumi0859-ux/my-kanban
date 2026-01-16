"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { User, Users } from "lucide-react";
import { 
  DndContext, closestCorners, DragEndEvent, DragOverEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects
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
  
  // --- プレゼンス用の状態：今ログインしている人のリスト ---
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  useEffect(() => {
    const saved = localStorage.getItem("kanban-user");
    if (saved) { setUserName(saved); setIsLoggedIn(true); }
    fetchTasks();

    if (!isLoggedIn || !userName) return;

    // --- リアルタイム監視 & プレゼンス設定 ---
    const channel = supabase.channel("room-1", {
      config: { presence: { key: userName } }
    });

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, (payload) => {
        if (payload.new.user_name !== userName) {
          alert(`${payload.new.user_name}さんが新しいタスクを追加しました！`);
          fetchTasks(); 
        }
      })
      // 誰かがログイン/ログアウトした時の動き
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // ログイン中の名前だけを抽出してリストにする
        const names = Object.keys(state);
        setOnlineUsers(names);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // 自分の存在をみんなに知らせる
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userName, isLoggedIn]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (data) setTasks(data.map((t: any) => ({ ...t, id: String(t.id) })));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await supabase.from("users").select("*").eq("name", loginInput).eq("password", passInput).single();
    if (data) {
      setUserName(data.name); setIsLoggedIn(true);
      localStorage.setItem("kanban-user", data.name);
      fetchTasks();
    } else { alert("ログイン失敗"); }
  };

  const handleRegister = async () => {
    if (!loginInput || !passInput) return alert("入力してください");
    const { error } = await supabase.from("users").insert([{ name: loginInput, password: passInput }]);
    if (error) alert("登録失敗"); else alert("登録成功！");
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    const { data } = await supabase.from("tasks").insert([{ 
      content: newTaskContent, status: "todo", due_date: newDueDate || null, user_name: userName 
    }]).select();
    if (data) {
      setTasks(prev => [...prev, { ...data[0], id: String(data[0].id) }]);
      setNewTaskContent(""); setNewDueDate("");
    }
  };

  const deleteTask = async (id: string) => {
    if (window.confirm("削除しますか？")) {
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
    const activeTask = tasks.find(t => t.id === activeIdStr);
    if (!activeTask || activeTask.user_name !== userName) return;

    const overColId = COLUMNS.some(c => c.id === String(over.id)) 
      ? String(over.id) 
      : tasks.find(t => t.id === String(over.id))?.status;

    if (overColId && activeTask.status !== overColId) {
      setTasks(prev => prev.map(t => t.id === activeIdStr ? { ...t, status: overColId } : t));
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const activeTask = tasks.find(t => t.id === activeIdStr);

    if (activeTask && activeTask.user_name === userName) {
      const oldIndex = tasks.findIndex((t) => t.id === activeIdStr);
      const newIndex = tasks.findIndex((t) => t.id === overIdStr);
      if (activeIdStr !== overIdStr && newIndex !== -1) {
        setTasks((prev) => arrayMove(prev, oldIndex, newIndex));
      }
      await supabase.from("tasks").update({ status: activeTask.status }).eq("id", active.id);
    }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-6">Kanban Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="border w-full p-3 rounded-xl outline-none" placeholder="名前" value={loginInput} onChange={e => setLoginInput(e.target.value)} />
          <input className="border w-full p-3 rounded-xl outline-none" type="password" placeholder="暗証番号" value={passInput} onChange={e => setPassInput(e.target.value)} />
          <button type="submit" className="bg-blue-600 text-white w-full p-3 rounded-xl font-bold">ログイン</button>
          <button type="button" onClick={handleRegister} className="text-blue-600 text-sm hover:underline block w-full">新規ユーザー登録</button>
        </form>
      </div>
    </div>
  );

  return (
    <main className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-blue-600 tracking-tight">Project Board</h1>
            {/* --- ログイン中のメンバー一覧を表示 --- */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {onlineUsers.map((name, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm" title={name}>
                    {name.substring(0, 1)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 font-medium ml-1">
                {onlineUsers.length}人がオンライン
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border-2 border-blue-100 shadow-sm">
            <div className="relative">
              <div className="bg-blue-100 p-2 rounded-full">
                <User size={20} className="text-blue-600" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-800">{userName} さん</span>
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  作業中
                </span>
              </div>
              <button 
                onClick={() => { setIsLoggedIn(false); localStorage.removeItem("kanban-user"); window.location.reload(); }} 
                className="text-slate-400 text-[10px] text-left hover:text-red-500 transition-colors font-medium underline"
              >
                ログアウトする
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={addTask} className="max-w-md mx-auto mb-10 flex flex-col gap-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <input className="border-slate-200 border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 transition-all" value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} placeholder="新しいタスクを計画しましょう" />
          <div className="flex gap-2">
            <input className="border-slate-200 border p-3 rounded-xl text-sm flex-1 outline-none" type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold transition-colors">追加</button>
          </div>
        </form>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 justify-center">
            {COLUMNS.map(col => (
              <Column key={col.id} id={col.id} title={col.title} tasks={tasks.filter(t => t.status === col.id)} currentUserName={userName} onDelete={deleteTask} onUpdateDate={updateTaskDate} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
            {activeId ? (
              <TaskCard id={activeId} content={tasks.find(t => t.id === activeId)?.content} due_date={tasks.find(t => t.id === activeId)?.due_date} userName={tasks.find(t => t.id === activeId)?.user_name} currentUserName={userName} onDelete={() => {}} isOverlay />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
}