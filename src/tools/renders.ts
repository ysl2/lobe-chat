import { BuiltinRender } from '@/types/tool';

import { CodeInterpreterManifest } from './code-interpreter';
import CodeInterpreter from './code-interpreter/Render';
import { DalleManifest } from './dalle';
import DalleRender from './dalle/Render';
import { WebBrowsingManifest } from './web-browsing';
import WebBrowsing from './web-browsing/Render';

export const BuiltinToolsRenders: Record<string, BuiltinRender> = {
  [CodeInterpreterManifest.identifier]: CodeInterpreter as BuiltinRender,
  [DalleManifest.identifier]: DalleRender as BuiltinRender,
  [WebBrowsingManifest.identifier]: WebBrowsing as BuiltinRender,
};
