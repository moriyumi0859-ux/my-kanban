"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { LogOut, User } from "lucide-react";
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

  // --- 修正箇所：通知機能を追加した useEffect ---
  useEffect(() => {
    const saved = localStorage.getItem("kanban-user");
    if (saved) { setUserName(saved); setIsLoggedIn(true); }
    fetchTasks();

    // リアルタイム監視の設定
    const channel = supabase
      .channel("realtime-tasks")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, (payload) => {
        // 自分以外の人が追加した時だけ通知する
        if (payload.new.user_name !== userName) {
          alert(`${payload.new.user_name}さんが新しいタスクを追加しました！`);
          fetchTasks(); 
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [userName]); // userNameが変わった際にも再設定されるようにします

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
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
      alert("名前または暗証番号が正しくありません。");
    }
  };

  const handleRegister = async () => {
    if (!loginInput || !passInput) {
      alert("名前と暗証番号を入力してください。");
      return;
    }
    const { error } = await supabase.from("users").insert([{ name: loginInput, password: passInput }]);
    if (error) alert("登録に失敗しました。既に同じ名前が使われている可能性があります。");
    else alert("登録成功！そのままログインしてください。");
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

  const handleDragEnd = async (e: DragEndEvent) =>