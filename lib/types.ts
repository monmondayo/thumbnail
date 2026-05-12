export type BaseElement = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
  opacity?: number;
};

export type GradientStop = { offset: number; color: string };

export type GradientConfig = {
  enabled: boolean;
  type: "linear" | "radial";
  angle: number; // degrees, linear only
  stops: GradientStop[];
};

export type TextElement = BaseElement & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  align: "left" | "center" | "right";
  width: number;
  lineHeight: number;
  letterSpacing?: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  /** Optional gradient fill. When enabled overrides the solid `fill`. */
  gradient?: GradientConfig;
};

export type ImageElement = BaseElement & {
  type: "image";
  src: string;
  width: number;
  height: number;
  isBackground?: boolean;
  cornerRadius?: number;
  /** Crop percentages from each edge (0-95). */
  crop?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

export type ShapeKind = "rect" | "ellipse";

export type ShapeElement = BaseElement & {
  type: "shape";
  shape: ShapeKind;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  gradient?: GradientConfig;
};

export type EditorElement = TextElement | ImageElement | ShapeElement;

export type EditorState = {
  elements: EditorElement[];
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
};

export type SavedThumbnail = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  state: EditorState;
  preview: string;
};
