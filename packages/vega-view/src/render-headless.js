import initializeRenderer from './initialize-renderer';
import {renderModule} from 'vega-scenegraph';

/**
 * Render the current scene in a headless fashion.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
export default function(view, type, scaleFactor) {
  var module = renderModule(type),
      ctr = module && module.headless;
  return !ctr
    ? Promise.reject('Unrecognized renderer type: ' + type)
    : view.runAsync().then(function() {
        return initializeRenderer(view, null, null, ctr, scaleFactor)
          .renderAsync(view._scenegraph.root);
      });
}
