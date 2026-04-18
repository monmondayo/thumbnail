"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Image as KonvaImage, Transformer } from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import type { EditorElement, EditorState, ImageElement, TextElement } from "@/lib/types";

type Props = {
  state: EditorState;
  selectedId: string | null;
  editingId?: string | null;
  onSelect: (id: string | null) => void;
  onChange: (el: EditorElement) => void;
  onEditText: (id: string, editor: { x: number; y: number; width: number; height: number; rotation: number }) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  stageScale: number;
};

export default function Canvas({
  state,
  selectedId,
  editingId,
  onSelect,
  onChange,
  onEditText,
  stageRef,
  stageScale,
}: Props) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne<Konva.Node>(`#${selectedId}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedId, state.elements, stageRef]);

  return (
    <Stage
      ref={stageRef}
      width={state.canvasWidth * stageScale}
      height={state.canvasHeight * stageScale}
      scaleX={stageScale}
      scaleY={stageScale}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
      onTouchStart={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
      style={{ background: state.backgroundColor, cursor: "default" }}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={state.canvasWidth}
          height={state.canvasHeight}
          fill={state.backgroundColor}
          listening={false}
        />
        {state.elements.map((el) => {
          if (!el.visible) return null;
          if (el.id === editingId) return null;
          if (el.type === "image") {
            return (
              <ImageNode
                key={el.id}
                element={el}
                onSelect={() => onSelect(el.id)}
                onChange={onChange}
              />
            );
          }
          return (
            <TextNode
              key={el.id}
              element={el}
              onSelect={() => onSelect(el.id)}
              onChange={onChange}
              onEdit={(rect) => onEditText(el.id, rect)}
            />
          );
        })}
        <Transformer
          ref={transformerRef}
          rotateEnabled
          keepRatio={false}
          ignoreStroke
          anchorStroke="#a78bfa"
          anchorFill="#fafafa"
          borderStroke="#a78bfa"
          borderDash={[4, 4]}
          anchorSize={10}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 8 || newBox.height < 8) return oldBox;
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
}

function ImageNode({
  element,
  onSelect,
  onChange,
}: {
  element: ImageElement;
  onSelect: () => void;
  onChange: (el: EditorElement) => void;
}) {
  const [img] = useImage(element.src, "anonymous");
  return (
    <KonvaImage
      id={element.id}
      image={img}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({ ...element, x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          ...element,
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    />
  );
}

function TextNode({
  element,
  onSelect,
  onChange,
  onEdit,
}: {
  element: TextElement;
  onSelect: () => void;
  onChange: (el: EditorElement) => void;
  onEdit: (rect: { x: number; y: number; width: number; height: number; rotation: number }) => void;
}) {
  return (
    <KonvaText
      id={element.id}
      text={element.text}
      x={element.x}
      y={element.y}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fontStyle={element.fontStyle}
      fill={element.fill}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      fillAfterStrokeEnabled
      lineJoin="round"
      align={element.align}
      width={element.width}
      lineHeight={element.lineHeight}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      shadowEnabled={element.shadowEnabled}
      shadowColor={element.shadowColor}
      shadowBlur={element.shadowBlur}
      shadowOffsetX={element.shadowOffsetX}
      shadowOffsetY={element.shadowOffsetY}
      shadowOpacity={element.shadowOpacity}
      draggable
      onMouseDown={onSelect}
      onTouchStart={onSelect}
      onTap={onSelect}
      onDblClick={(e) => {
        const node = e.target as Konva.Text;
        onEdit({
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height(),
          rotation: node.rotation(),
        });
      }}
      onDblTap={(e) => {
        const node = e.target as Konva.Text;
        onEdit({
          x: node.x(),
          y: node.y(),
          width: node.width(),
          height: node.height(),
          rotation: node.rotation(),
        });
      }}
      onDragEnd={(e) => onChange({ ...element, x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target as Konva.Text;
        onChange({
          ...element,
          x: node.x(),
          y: node.y(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
          rotation: node.rotation(),
        });
      }}
    />
  );
}
