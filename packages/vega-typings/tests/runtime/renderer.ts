import {
  CanvasHandler,
  Renderer,
  Renderers,
  renderModule,
  Scene,
  SceneGroup,
  SceneItem,
  SceneLegendItem,
  SceneLine,
  SceneRect,
  SceneSymbol,
  SceneText,
  sceneVisit,
  View,
} from 'vega';

type SceneRenderer = (scene: Scene) => void;

const group: SceneRenderer = (outerScene: Scene) => {
  sceneVisit(outerScene, sceneGroupOrItem => {
    const group = sceneGroupOrItem as SceneGroup;
    group.context.background;
    group.items.length;
    group.height;
    group.width;
    sceneVisit(group, item => {
      const innerScene = item as Scene;
      rootRenderer(innerScene);
    });
  });
};

const rect: SceneRenderer = (scene: Scene) => {
  sceneVisit(scene, sceneGroupOrItem => {
    const rect = sceneGroupOrItem as SceneRect;
    rect.fill;
    rect.height;
    rect.width;
    rect.x;
    rect.y;
  });
};

const legend: SceneRenderer = (scene: Scene) => {
  const legendMap: { [role: string]: (item: SceneItem) => void } = {
    'legend-title': item => {
      const textItem = item as SceneText;
      textItem.text;
    },
    'legend-symbol': item => {
      const symbol = item as SceneSymbol & SceneLegendItem;
      symbol.datum;
      symbol.shape;
      symbol.size;
    },
  };
  sceneVisit(scene, sceneGroupOrItem => {
    const sceneItem = sceneGroupOrItem as SceneItem;
    legendMap[sceneItem.mark.role](sceneItem);
  });
};

const rule: SceneRenderer = (scene: Scene) => {
  sceneVisit(scene, sceneGroupOrItem => {
    const line = sceneGroupOrItem as SceneLine;
    line.opacity;
    line.stroke;
    line.strokeWidth;
    line.x;
    line.y;
    line.x2;
    line.y2;
  });
};

const text: SceneRenderer = (scene: Scene) => {
  sceneVisit(scene, sceneGroupOrItem => {
    const text = sceneGroupOrItem as SceneText;
    text.align;
    text.angle;
    text.baseline;
    text.fill;
    text.font;
    text.fontSize;
    text.text;
    text.x;
    text.y;
  });
};

const sceneRenderers: { [id: string]: SceneRenderer } = {
  group,
  legend,
  rect,
  rule,
  text,
};

const rootRenderer: SceneRenderer = (scene: Scene) => {
  scene.bounds;
  scene.clip;
  scene.interactive;
  scene.items.length;
  const renderer = sceneRenderers[scene.marktype];
  scene.name;
  scene.role;
  renderer(scene);
};

class TestRenderer extends Renderer {
  _render(scene: Scene, items: SceneItem[]) {
    rootRenderer(scene);
    return this;
  }
}

class TestView extends View {
  renderer(renderer: Renderers | 'test'): this
  renderer(): Renderers
  renderer(renderer?: Renderers | 'test') {
    if (!renderer) {
      return super.renderer();
    }
    return super.renderer(renderer as Renderers);
  }
}

renderModule('test', { handler: CanvasHandler, renderer: TestRenderer });
