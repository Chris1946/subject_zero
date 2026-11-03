import { lazy } from "react";
import { RoundDefinition } from "../types";
import { Round4Scene } from "./Scene";

export const round4Definition: RoundDefinition = {
  id: 4,
  themeKey: "round4",
  Scene: Round4Scene,
  toolRegistry: {
    timestamp_reconstruction: lazy(() =>
      import("./tools/TimestampReconstruction").then((m) => ({
        default: m.TimestampReconstruction,
      }))
    ),
    access_records: lazy(() =>
      import("./tools/AccessRecords").then((m) => ({
        default: m.AccessRecords,
      }))
    ),
    keyword_recovery: lazy(() =>
      import("./tools/KeywordRecovery").then((m) => ({
        default: m.KeywordRecovery,
      }))
    ),
  },
};

export default round4Definition;
