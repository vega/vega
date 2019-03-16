export interface Scene {
  bounds: Bounds;
  clip: boolean;
  interactive: boolean;
  items: SceneGroup[];
  marktype: string;
  name: string;
  role: string;
}

export class Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SceneItem {
  bounds: Bounds;
  datum?: object;
  mark: { role: string };
  x: number;
  y: number;
}

export type SceneRect = SceneItem & {
  fill: string;
  height: number;
  width: number;
};

export type SceneLine = SceneItem & {
  opacity: number;
  stroke: string;
  strokeWidth: number;
  x2: number;
  y2: number;
};

export interface SceneContext {
  background?: string;
}

export type SceneGroup = SceneItem & {
  context: SceneContext;
  items: SceneItem[];
  height: number;
  width: number;
  stroke?: string;
};

export type SceneSymbol = SceneItem & {
  fill: string;
  shape: string;
  size: number;
  strokeWidth: number;
};

export type SceneTextBaseline = 'top' | 'middle' | 'bottom';
export type SceneTextAlign = 'left' | 'center' | 'right';

export type SceneText = SceneItem & {
  align: SceneTextAlign;
  angle: number;
  baseline: SceneTextBaseline;
  fill: string;
  font: string;
  fontSize: number;
  text: string;
};

export interface SceneLegendItem {
  datum: {
    index: number;
  };
}

export function sceneVisit(
  scene: Scene | SceneGroup,
  itemCallback: (item: Scene | SceneGroup | SceneItem) => void,
): void;
