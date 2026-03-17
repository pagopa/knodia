import { EnumArrayRenderer } from "./EnumArrayRenderer";
import { RadioRenderer } from "./RadioRenderer";
import { SwitchRenderer } from "./SwitchRenderer";
import {
  enumArrayTester,
  radioTester,
  switchTester,
  textareaTester,
} from "./testers";
import { TextareaRenderer } from "./TextareaRenderer";

export const customRenderers = [
  { renderer: EnumArrayRenderer, tester: enumArrayTester },
  { renderer: RadioRenderer, tester: radioTester },
  { renderer: SwitchRenderer, tester: switchTester },
  { renderer: TextareaRenderer, tester: textareaTester },
];
