export interface Scene {
  marktype: string;
}

export class Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SceneItem {
  bounds: Bounds;
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

export type SceneGroup = SceneRect;

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
