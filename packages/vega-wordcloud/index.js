import {register} from 'vega-dataflow';

import Wordcloud from './src/Wordcloud';
import WordcloudDefinition from './definitions/Wordcloud';

register(WordcloudDefinition, Wordcloud);

export {transform, definition} from 'vega-dataflow';
