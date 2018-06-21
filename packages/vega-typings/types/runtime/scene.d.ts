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
  height: number;
  width: number;
};

export type SceneLine = SceneItem & {
  x2: number;
  y2: number;
};

export type SceneGroup = SceneRect;

export type SceneCube = SceneRect & {
  id: number;
  depth: number;
  fill: string;
  z: number;
};

export type SceneSymbol = SceneItem & {
  fill: string;
  shape: string;
  size: number;
  strokeWidth: number;
};

export type SceneText = SceneItem & {
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
  itemCallback: (item: Scene | SceneItem) => void,
): void;
