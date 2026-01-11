"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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

  // アプリ起動時にデータを読み込む
  useEffect(() => {
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
      setTasks(data || []);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    // Supabaseに送るデータを整理
    const taskData = {
      content: newTaskContent,
      status: "todo",
      due_date: newDueDate || null, // 空文字の場合はnullにして送る
    };

    // 1. まずSupabaseへ保存を試みる
    const { data, error } = await supabase
      .from("tasks")
      .insert([taskData])
      .select(); // 挿入したデータを取得する設定

    if (error) {
      // エラーが出た場合は具体的な理由を表示
      alert(`保存に失敗しました。\n理由: ${error.message}\n(ヒント: Supabaseの列名が due_date になっているか確認してください)`);
      console.error("Supabase Error:", error);
    } else {
      // 2. 成功したら画面のリストに追加（IDはSupabaseが発行したものを使う）
      if (data) {
        setTasks([...tasks, data[0]]);
        setNewTaskContent("");
        setNewDueDate("");
      }
    }
  };

  const updateTaskDate = async (id: string, newDate: string) => {
    // 見た目を先に更新
    setTasks(prev => prev.map(t => t.id === id ? { ...t, due_date: newDate } : t));

    const { error } = await supabase
      .from("tasks")
      .update({ due_date: newDate || null })
      .eq("id", id);

    if (error) {
      alert("日付の保存に失敗しました: " + error.message);
    }
  };

  const deleteTask = async (id: string) => {
    if (window.confirm("削除しますか？")) {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) {
        alert("削除に失敗しました: " + error.message);
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
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
      
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", activeId);
      if (error) console.error("移動の保存に失敗:", error.message);
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

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <h1 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Project Board</h1>

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
        <div className="flex gap-6 justify-center">
          {COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} title={col.title} tasks={tasks.filter(t => t.status === col.id)} onDelete={deleteTask} onUpdateDate={updateTaskDate} />
          ))}
        </div>
      </DndContext>
    </main>
  );
}