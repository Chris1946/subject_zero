import { lazy } from "react";
import { RoundDefinition } from "../types";
import { Round3Scene } from "./Scene";

export const round3Definition: RoundDefinition = {
  id: 3,
  themeKey: "round3",
  Scene: Round3Scene,
  toolRegistry: {
    cipher: lazy(() =>
      import("./tools/CaesarWheel").then((m) => ({ default: m.CaesarWheel }))
    ),
    script_recovery: lazy(() =>
      import("./tools/ScriptRecovery").then((m) => ({ default: m.ScriptRecovery }))
    ),
    command_recovery: lazy(() =>
      import("./tools/CommandRecovery").then((m) => ({ default: m.CommandRecovery }))
    ),
  },
};

export default round3Definition;
