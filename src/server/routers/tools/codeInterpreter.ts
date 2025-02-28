import { z } from 'zod';

import { authedProcedure, router } from '@/libs/trpc';
import { Sandbox } from '@/server/CodeInterpreter';

export const codeInterpreterRouter = router({
  execPython: authedProcedure
    .input(
      z.object({
        code: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const sandbox = new Sandbox();

      const result = await sandbox.run(input.code);

      return result.results;
    }),
});
