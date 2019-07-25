import { OnTrigger, Transforms, SignalRef } from '.';

export type DataType = 'boolean' | 'number' | 'date' | 'string';
export type Parse =
  | 'auto'
  | {
      [f: string]: DataType | string;
    };
export interface FormatJSON {
  type: 'json';
  parse?: Parse;
  property?: string | SignalRef;
  copy?: boolean;
}
export interface FormatSV {
  type: 'csv' | 'tsv';
  header?: string[];
  parse?: Parse;
}
export interface FormatDSV {
  type: 'dsv';
  header?: string[];
  parse?: Parse;
  delimiter: string;
}
export type FormatTopoJSON = {
  type: 'topojson';
  property?: string;
} & (
  | {
      feature: string;
    }
  | {
      mesh: string;
      filter: 'interior' | 'exterior' | null;
    });
export type Format = FormatJSON | FormatSV | FormatDSV | FormatTopoJSON | { parse: Parse };

export interface BaseData {
  name: string;
  on?: OnTrigger[];
  format?: Format | SignalRef;
  transform?: Transforms[];
}

export type SourceData = {
  source: string | string[];
} & BaseData;

export type ValuesData = {
  values: Datum[] | object;
} & BaseData;

export type UrlData = {
  url: string | SignalRef;
} & BaseData;

export type Data = SourceData | ValuesData | UrlData | BaseData;
export type Datum = any;
