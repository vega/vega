export declare type AutoSizeType = 'pad' | 'fit' | 'fit-x' | 'fit-y' | 'none';
export declare type AutoSize =
  | AutoSizeType
  | {
      type: AutoSizeType;
      resize?: boolean;
      contains?: 'content' | 'padding';
    };
