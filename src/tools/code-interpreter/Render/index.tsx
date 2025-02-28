import { Highlighter } from '@lobehub/ui';
import { memo } from 'react';

import { BuiltinRenderProps } from '@/types/tool';
import { CodeInterpreterContent, CodeInterpreterResult } from '@/types/tool/codeInterpreter';

const CodeInterpreter = memo<BuiltinRenderProps<CodeInterpreterContent>>(({ content }) => {
  const results: CodeInterpreterResult[] | null = content.results || null;

  return (
    <div>
      代码：
      <Highlighter language={content.type === 'python' ? 'python' : 'text'}>
        {content?.code}
      </Highlighter>
      运行结果：
      {results &&
        results.map((result, index) => {
          return <div key={index}>{result.text}</div>;
        })}
    </div>
  );
});

export default CodeInterpreter;
