import { template } from 'lodash-es';

export const hydrationPrompt = (prompt: string, context: any) => {
  const compiler = template(prompt, { interpolate: /{{([\S\s]+?)}}/g });
  return compiler(context);
};
