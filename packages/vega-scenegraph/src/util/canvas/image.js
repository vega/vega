import {Canvas} from './canvas.js';

export default typeof Image !== 'undefined' ? Image
  : (Canvas && Canvas.Image || null);
