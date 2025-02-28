import { publicProcedure, router } from '@/libs/trpc';

import { searchRouter } from './search';

import { codeInterpreterRouter } from './codeInterpreter';

export const toolsRouter = router({
  codeInterpreter: codeInterpreterRouter,
  healthcheck: publicProcedure.query(() => "i'm live!"),
  search: searchRouter,
});

export type ToolsRouter = typeof toolsRouter;
