import { EventStream, EventType, WindowEventType } from '..';

export type Runtime = {
  description: string;
  operators: Entry[];
  streams: Stream[];
  updates: any;
  bindings: any;
  eventConfig: any;
  locale?: any;
};

// From Scope.js:Scope:add -> transforms.js
type Entry = { id: id } & (
  | {
      type: 'operator';
      // Adding root property in Scope.finish()
      // Adding root operator node in parseView
      root?: true;
    }
  | { type: 'aggregate'; value?: any; params?: any; parent?: any }
  | { type: 'axisticks'; value?: any; params?: any; parent?: any }
  | { type: 'bound'; value?: any; params?: any; parent?: any }
  | { type: 'collect'; value?: any; params?: any; parent?: any }
  | { type: 'compare'; value?: any; params?: any; parent?: any }
  | { type: 'datajoin'; value?: any; params?: any; parent?: any }
  | { type: 'encode'; value?: any; params?: any; parent?: any }
  | { type: 'expression'; value?: any; params?: any; parent?: any }
  | { type: 'extent'; value?: any; params?: any; parent?: any }
  | { type: 'facet'; value?: any; params?: any; parent?: any }
  | { type: 'field'; value?: any; params?: any; parent?: any }
  | { type: 'key'; value?: any; params?: any; parent?: any }
  | { type: 'legendentries'; value?: any; params?: any; parent?: any }
  | { type: 'load'; value?: any; params?: any; parent?: any }
  | { type: 'mark'; value?: any; params?: any; parent?: any }
  | { type: 'multiextent'; value?: any; params?: any; parent?: any }
  | { type: 'multivalues'; value?: any; params?: any; parent?: any }
  | { type: 'overlap'; value?: any; params?: any; parent?: any }
  | { type: 'params'; value?: any; params?: any; parent?: any }
  | { type: 'prefacet'; value?: any; params?: any; parent?: any }
  | { type: 'projection'; value?: any; params?: any; parent?: any }
  | { type: 'proxy'; value?: any; params?: any; parent?: any }
  | { type: 'relay'; value?: any; params?: any; parent?: any }
  | { type: 'render'; value?: any; params?: any; parent?: any }
  | { type: 'scale'; value?: any; params?: any; parent?: any }
  | { type: 'sieve'; value?: any; params?: any; parent?: any }
  | { type: 'sortitems'; value?: any; params?: any; parent?: any }
  | { type: 'viewlayout'; value?: any; params?: any; parent?: any }
  | { type: 'values'; value?: any; params?: any; parent?: any }
);

// from `Scope.js:Scope:id`
// String if sub id with `:` seperate parent from child id numbers
type id = string | number;

type Stream = {
  id: id;
} & (
  | // from parsers/stream.js:eventStream -> scope.event
  {
      source: 'timer';
      type: number;
    }
  | {
      source: 'view';
      type: EventType;
    }
  | {
      source: 'window';
      type: WindowEventType;
    }
  | ((
      | // from parsers/stream.js:eventStream & nestedStream -> streamParameters
      { stream: id }
      // from parsers/stream.js:mergeStream -> streamParameters
      | { merge: id[] }
    ) & {
      // from parsers/stream.js:streamParameters
      between?: [id, id];
      filter?: expr;
      throttle?: number;
      debounce?: number;
      consume?: true;
    })
);

type expr = { code: string };
