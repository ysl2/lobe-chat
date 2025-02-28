export interface CodeInterpreterContent {
  code: string;
  results?: CodeInterpreterResult[];
  type: 'python';
}

export interface CodeInterpreterResult {
  extra?: any;
  html?: string | undefined;
  javascript?: string | undefined;
  jpeg?: string | undefined;
  json?: string | undefined;
  latex?: string | undefined;
  markdown?: string | undefined;
  pdf?: string | undefined;
  png?: string | undefined;
  svg?: string | undefined;
  text?: string | undefined;
}
