"use client";

import { useEffect, useRef } from "react";
import type { TextElement } from "@/lib/types";

type Props = {
  element: TextElement;
  rect: { x: number; y: number; width: number; height: number; rotation: number };
  stageScale: number;
  stageOffset: { left: number; top: number };
  onCommit: (text: string) => void;
  onCancel: () => void;
};

export default function TextEditOverlay({ element, rect, stageScale, stageOffset, onCommit, onCancel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    ta.select();
  }, []);

  const scaledW = rect.width * element.scaleX * stageScale;
  const left = stageOffset.left + rect.x * stageScale;
  const top = stageOffset.top + rect.y * stageScale;
  const fontSize = element.fontSize * element.scaleY * stageScale;

  return (
    <textarea
      ref={ref}
      defaultValue={element.text}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onCommit((e.target as HTMLTextAreaElement).value);
        }
      }}
      style={{
        position: "absolute",
        left,
        top,
        width: scaledW,
        height: Math.max(fontSize * element.lineHeight * 1.2, rect.height * element.scaleY * stageScale),
        fontFamily: element.fontFamily,
        fontSize,
        fontWeight: element.fontStyle.includes("bold") ? 700 : 400,
        fontStyle: element.fontStyle.includes("italic") ? "italic" : "normal",
        lineHeight: element.lineHeight,
        textAlign: element.align,
        color: element.fill,
        background: "rgba(0,0,0,0.4)",
        border: "2px dashed #a78bfa",
        outline: "none",
        resize: "none",
        padding: 0,
        margin: 0,
        overflow: "hidden",
        transform: `rotate(${rect.rotation}deg)`,
        transformOrigin: "top left",
        zIndex: 50,
      }}
    />
  );
}
