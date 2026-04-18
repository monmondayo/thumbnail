export type BaseElement = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
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
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
};

export type ImageElement = BaseElement & {
  type: "image";
  src: string;
  width: number;
  height: number;
  isBackground?: boolean;
};

export type EditorElement = TextElement | ImageElement;

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
