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
  const [newDueDate, setNewDueDate] = useState(""); // 日付用のState

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: true });
      if (error) console.error(error);
      else setTasks(data || []);
    };
    fetchTasks();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      content: newTaskContent,
      status: "todo",
      due_date: newDueDate || null, // 日付があれば保存
    };

    setTasks([...tasks, newTask]);
    setNewTaskContent("");
    setNewDueDate("");

    const { error } = await supabase.from("tasks").insert([newTask]);
    if (error) console.error(error);
  };

  const deleteTask = async (id: string) => {
    if (window.confirm("削除しますか？")) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await supabase.from("tasks").delete().eq("id", id);
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

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-900">
      <h1 className="text-4xl font-extrabold mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Project Board</h1>

      {/* 入力フォーム */}
      <div className="max-w-md mx-auto mb-12 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <form onSubmit={addTask} className="flex flex-col gap-3">
          <input
            type="text"
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            placeholder="何をしますか？"
            className="p-3 rounded-xl border border-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all font-bold">追加</button>
          </div>
        </form>
      </div>

      <DndContext collisionDetection={closestCorners} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex gap-6 justify-center">
          {COLUMNS.map((col) => (
            <Column key={col.id} id={col.id} title={col.title} tasks={tasks.filter(t => t.status === col.id)} onDelete={deleteTask} />
          ))}
        </div>
      </DndContext>
    </main>
  );
}