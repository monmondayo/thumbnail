"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import type {
  EditorElement,
  EditorState,
  GradientConfig,
  ImageElement,
  ShapeElement,
  TextElement,
} from "@/lib/types";

type Props = {
  state: EditorState;
  selectedIds: string[];
  editingId?: string | null;
  onSelect: (id: string | null, opts?: { additive?: boolean }) => void;
  onChange: (el: EditorElement) => void;
  onEditText: (id: string, editor: { x: number; y: number; width: number; height: number; rotation: number }) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  stageScale: number;
};

export default function Canvas({
  state,
  selectedIds,
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
    if (selectedIds.length === 0) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const nodes = selectedIds
      .map((id) => stage.findOne<Konva.Node>(`#${id}`))
      .filter((node): node is Konva.Node => Boolean(node));
    if (nodes.length > 0) {
      tr.nodes(nodes);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedIds, state.elements, stageRef]);

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
                onSelect={(evt) =>
                  onSelect(el.id, {
                    additive: evt.evt.shiftKey || evt.evt.metaKey || evt.evt.ctrlKey,
                  })
                }
                onChange={onChange}
              />
            );
          }
          if (el.type === "shape") {
            return (
              <ShapeNode
                key={el.id}
                element={el}
                onSelect={(evt) =>
                  onSelect(el.id, {
                    additive: evt.evt.shiftKey || evt.evt.metaKey || evt.evt.ctrlKey,
                  })
                }
                onChange={onChange}
              />
            );
          }
          return (
            <TextNode
              key={el.id}
              element={el}
              onSelect={(evt) =>
                onSelect(el.id, {
                  additive: evt.evt.shiftKey || evt.evt.metaKey || evt.evt.ctrlKey,
                })
              }
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

/** Convert a gradient config + bounding box into Konva gradient props. */
function gradientToKonva(
  g: GradientConfig | undefined,
  width: number,
  height: number
): Record<string, unknown> | null {
  if (!g || !g.enabled || g.stops.length < 2) return null;
  const stops = g.stops.slice().sort((a, b) => a.offset - b.offset);
  const flatStops = stops.flatMap((s) => [s.offset, s.color]);
  if (g.type === "radial") {
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.max(width, height) / 2;
    return {
      fillPriority: "radial-gradient",
      fillRadialGradientStartPoint: { x: cx, y: cy },
      fillRadialGradientStartRadius: 0,
      fillRadialGradientEndPoint: { x: cx, y: cy },
      fillRadialGradientEndRadius: r,
      fillRadialGradientColorStops: flatStops,
    };
  }
  // linear
  const rad = ((g.angle - 90) * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  // Line that spans the full bounding box diagonal in the requested direction
  const halfDiag = Math.sqrt(width * width + height * height) / 2;
  const dx = Math.cos(rad) * halfDiag;
  const dy = Math.sin(rad) * halfDiag;
  return {
    fillPriority: "linear-gradient",
    fillLinearGradientStartPoint: { x: cx - dx, y: cy - dy },
    fillLinearGradientEndPoint: { x: cx + dx, y: cy + dy },
    fillLinearGradientColorStops: flatStops,
  };
}

function ImageNode({
  element,
  onSelect,
  onChange,
}: {
  element: ImageElement;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (el: EditorElement) => void;
}) {
  const [img] = useImage(element.src, "anonymous");
  const cropMetrics = useMemo(() => {
    if (!img) return undefined;
    const left = Math.max(0, Math.min(95, element.crop?.left ?? 0));
    const right = Math.max(0, Math.min(95, element.crop?.right ?? 0));
    const top = Math.max(0, Math.min(95, element.crop?.top ?? 0));
    const bottom = Math.max(0, Math.min(95, element.crop?.bottom ?? 0));

    const sourceX = (img.width * left) / 100;
    const sourceY = (img.height * top) / 100;
    const sourceWidth = Math.max(1, img.width - sourceX - (img.width * right) / 100);
    const sourceHeight = Math.max(1, img.height - sourceY - (img.height * bottom) / 100);

    // Keep pixel density by shrinking destination rect with the same crop ratio.
    const dstX = element.x + (element.width * left) / 100;
    const dstY = element.y + (element.height * top) / 100;
    const dstWidth = Math.max(1, element.width * (1 - (left + right) / 100));
    const dstHeight = Math.max(1, element.height * (1 - (top + bottom) / 100));

    return {
      crop: {
        x: sourceX,
        y: sourceY,
        width: sourceWidth,
        height: sourceHeight,
      },
      dst: {
        x: dstX,
        y: dstY,
        width: dstWidth,
        height: dstHeight,
      },
    };
  }, [img, element.crop]);

  return (
    <KonvaImage
      id={element.id}
      image={img}
      crop={cropMetrics?.crop}
      x={cropMetrics?.dst.x ?? element.x}
      y={cropMetrics?.dst.y ?? element.y}
      width={cropMetrics?.dst.width ?? element.width}
      height={cropMetrics?.dst.height ?? element.height}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity ?? 1}
      cornerRadius={element.cornerRadius ?? 0}
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

function ShapeNode({
  element,
  onSelect,
  onChange,
}: {
  element: ShapeElement;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (el: EditorElement) => void;
}) {
  const gradProps = useMemo(
    () => gradientToKonva(element.gradient, element.width, element.height),
    [element.gradient, element.width, element.height]
  );
  const common = {
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    scaleX: element.scaleX,
    scaleY: element.scaleY,
    opacity: element.opacity ?? 1,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    shadowEnabled: element.shadowEnabled ?? false,
    shadowColor: element.shadowColor,
    shadowBlur: element.shadowBlur,
    shadowOffsetX: element.shadowOffsetX,
    shadowOffsetY: element.shadowOffsetY,
    shadowOpacity: element.shadowOpacity,
    draggable: true,
    onMouseDown: onSelect,
    onTouchStart: onSelect,
    onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
      onChange({ ...element, x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target;
      onChange({
        ...element,
        x: node.x(),
        y: node.y(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
        rotation: node.rotation(),
      });
    },
  };

  if (element.shape === "ellipse") {
    // Render Ellipse with its (x,y) as the top-left corner (match rect semantics)
    return (
      <Ellipse
        {...common}
        x={element.x + element.width / 2}
        y={element.y + element.height / 2}
        radiusX={element.width / 2}
        radiusY={element.height / 2}
        fill={gradProps ? undefined : element.fill}
        {...(gradProps ?? {})}
        onDragEnd={(e) =>
          onChange({
            ...element,
            x: e.target.x() - element.width / 2,
            y: e.target.y() - element.height / 2,
          })
        }
        onTransformEnd={(e) => {
          const node = e.target as Konva.Ellipse;
          onChange({
            ...element,
            x: node.x() - (element.width * node.scaleX()) / 2,
            y: node.y() - (element.height * node.scaleY()) / 2,
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation(),
          });
        }}
      />
    );
  }

  return (
    <Rect
      {...common}
      width={element.width}
      height={element.height}
      cornerRadius={element.cornerRadius}
      fill={gradProps ? undefined : element.fill}
      {...(gradProps ?? {})}
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
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (el: EditorElement) => void;
  onEdit: (rect: { x: number; y: number; width: number; height: number; rotation: number }) => void;
}) {
  // For gradient on text we need the actual rendered text bounds. We use fontSize
  // and line-count/width heuristics because Konva gradient coordinates are in the
  // node's local space. A full-bounding-box gradient works well for most cases.
  const textHeight = element.fontSize * element.lineHeight * Math.max(1, element.text.split("\n").length);
  const gradProps = useMemo(
    () => gradientToKonva(element.gradient, element.width, textHeight),
    [element.gradient, element.width, textHeight]
  );

  return (
    <KonvaText
      id={element.id}
      text={element.text}
      x={element.x}
      y={element.y}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fontStyle={element.fontStyle}
      fill={gradProps ? undefined : element.fill}
      {...(gradProps ?? {})}
      stroke={element.stroke}
      strokeWidth={element.strokeWidth}
      fillAfterStrokeEnabled
      lineJoin="round"
      align={element.align}
      width={element.width}
      lineHeight={element.lineHeight}
      letterSpacing={element.letterSpacing ?? 0}
      rotation={element.rotation}
      scaleX={element.scaleX}
      scaleY={element.scaleY}
      opacity={element.opacity ?? 1}
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
