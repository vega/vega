import { OnTrigger, Transform } from '.';

export interface FieldParam {
  field: string;
}
export type DataType = 'boolean' | 'number' | 'date' | 'string';
export type Parse =
  | 'auto'
  | {
      [f: string]: DataType | string;
    };
export interface FormatJSON {
  type: 'json';
  parse?: Parse;
  property?: string;
  copy?: boolean;
}
export interface FormatSV {
  type: 'csv' | 'tsv';
  parse?: Parse;
}
export interface FormatDSV extends FormatSV {
  delimiter: string;
}
export type FormatTopoJSON = {
  type: 'topojson';
  property?: string;
} & (
  | {
      feature: 'string';
    }
  | {
      mesh?: 'string';
    });
export type Format = FormatJSON | FormatSV | FormatDSV | FormatTopoJSON | { parse: Parse };
export type Data = (
  | {
      source: string;
    }
  | {
      values: Datum[];
    }
  | {
      url: string;
    }
  | {}) & {
  name: string;
  on?: OnTrigger[];
  format?: Format;
  transform?: Transform[];
};
export type Datum = any;
