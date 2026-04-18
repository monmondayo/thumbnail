"use client";

import { Download, Save, FileImage, Trash2, FolderOpen, Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  onNameChange: (v: string) => void;
  onSave: () => void;
  onOpenSaved: () => void;
  onExport: (format: "png" | "jpeg") => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saving?: boolean;
};

export default function Toolbar({
  name,
  onNameChange,
  onSave,
  onOpenSaved,
  onExport,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saving,
}: Props) {
  return (
    <div className="h-14 shrink-0 border-b border-zinc-800 bg-zinc-900 px-4 flex items-center gap-3">
      <div className="font-bold text-lg tracking-tight text-violet-300">
        Thumbmaker
      </div>
      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="無題のサムネイル"
        className="bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-2 py-1 text-sm text-zinc-200 w-64"
      />
      <div className="flex items-center gap-1 ml-auto">
        <IconBtn onClick={onUndo} disabled={!canUndo} title="元に戻す (Cmd+Z)">
          <Undo2 className="w-4 h-4" />
        </IconBtn>
        <IconBtn onClick={onRedo} disabled={!canRedo} title="やり直す (Cmd+Shift+Z)">
          <Redo2 className="w-4 h-4" />
        </IconBtn>
        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <IconBtn onClick={onOpenSaved} title="保存済み">
          <FolderOpen className="w-4 h-4" />
        </IconBtn>
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "保存中..." : "保存"}
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <button
          onClick={() => onExport("png")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm"
        >
          <FileImage className="w-4 h-4" />
          PNG
        </button>
        <button
          onClick={() => onExport("jpeg")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-sm"
        >
          <Download className="w-4 h-4" />
          JPEG
        </button>
        <div className="w-px h-6 bg-zinc-800 mx-1" />
        <IconBtn onClick={onClear} title="キャンバスをクリア" className="text-rose-300 hover:text-rose-200">
          <Trash2 className="w-4 h-4" />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  title,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-md hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent",
        className
      )}
    >
      {children}
    </button>
  );
}
