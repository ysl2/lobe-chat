import { CodeInterpreter, Result } from '@e2b/code-interpreter';

import { toolsEnv } from '@/config/tools';

interface ProcessMessage {
  error: boolean;
  line: string;
  /**
   * Unix epoch in nanoseconds
   */
  timestamp: number;
}

export class Sandbox {
  async run(
    code: string,
    callbacks?: {
      onResult?: (data: Result) => void;
      onStderr?: (msg: ProcessMessage) => void;
      onStdout?: (msg: ProcessMessage) => void;
    },
  ) {
    const sandbox = await CodeInterpreter.create({
      apiKey: toolsEnv.E2B_API_KEY,
    });
    await sandbox.notebook.execCell(code);

    const data = await sandbox.notebook.execCell(code, {
      onResult: callbacks?.onResult,
      onStderr: callbacks?.onStderr,
      onStdout: callbacks?.onStdout,
    });

    await sandbox.close();

    return data;
  }
}
