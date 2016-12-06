import initializeRenderer from './initialize-renderer';
import {rendererModule} from './render-types';

/**
 * Render the current scene in a headless fashion.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
export default function(view, type) {
  var module = rendererModule(type);
  return !(module && module.headless)
    ? Promise.reject('Unrecognized renderer type: ' + type)
    : view.runAsync().then(function() {
        return initializeRenderer(view, null, null, module.headless)
          .renderAsync(view._scenegraph.root);
      });
}
