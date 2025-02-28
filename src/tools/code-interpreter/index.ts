import { BuiltinToolManifest } from '@/types/tool';

export const CodeInterpreterManifest: BuiltinToolManifest = {
  api: [
    {
      description:
        'Execute python code in a Jupyter notebook cell and returns any result, stdout, stderr, display_data, and error.',
      name: 'executePython',
      parameters: {
        properties: {
          code: {
            description: 'The python code to execute in a single cell.',
            type: 'string',
          },
        },
        required: ['code'],
        type: 'object',
      },
    },
  ],
  identifier: 'code-interpreter',
  meta: {
    avatar: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNvbnRhaW5lciI+PHBhdGggZD0iTTIyIDcuN2MwLS42LS40LTEuMi0uOC0xLjVsLTYuMy0zLjlhMS43MiAxLjcyIDAgMCAwLTEuNyAwbC0xMC4zIDZjLS41LjItLjkuOC0uOSAxLjR2Ni42YzAgLjUuNCAxLjIuOCAxLjVsNi4zIDMuOWExLjcyIDEuNzIgMCAwIDAgMS43IDBsMTAuMy02Yy41LS4zLjktMSAuOS0xLjVaIi8+PHBhdGggZD0iTTEwIDIxLjlWMTRMMi4xIDkuMSIvPjxwYXRoIGQ9Im0xMCAxNCAxMS45LTYuOSIvPjxwYXRoIGQ9Ik0xNCAxOS44di04LjEiLz48cGF0aCBkPSJNMTggMTcuNVY5LjQiLz48L3N2Zz4=`,
    title: 'Code Interpreter',
  },
  systemRole: `
## your job & context
you are a python data scientist. you are given tasks to complete and you run python code to solve them.
- the python code runs in jupyter notebook.
- every time you call \`executePython\` tool, the python code is executed in a separate cell. it's okay to multiple calls to \`executePython\`.
- display visualizations using matplotlib or any other visualization library directly in the notebook. don't worry about saving the visualizations to a file.
- you have access to the internet and can make api requests.
- you also have access to the filesystem and can read/write files.
- you can install any pip package (if it exists) if you need to but the usual packages for data analysis are already preinstalled.
- you can run any python code you want, everything is running in a secure sandbox environment.
`,
  type: 'builtin',
};
