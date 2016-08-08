export {version} from './build/package';

export {default as parse} from './src/parse';
export {definition, definitions} from './src/definitions';

export {default as selector} from './src/parsers/event-selector';
export {default as signal} from './src/parsers/signal';
export {default as signalUpdates} from './src/parsers/signal-updates';
export {default as stream} from './src/parsers/stream';

export {marktypes, isMarkType} from './src/parsers/marks/marktypes';

export {default as Scope} from './src/Scope';
export {default as DataScope} from './src/DataScope';
