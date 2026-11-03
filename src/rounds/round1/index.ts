import { lazy } from "react";
import { RoundDefinition } from "../types";
import { Round1Scene } from "./Scene";
import { MonitorWall } from "./extras/MonitorWall";

export const round1Definition: RoundDefinition = {
  id: 1,
  themeKey: "round1",
  Scene: Round1Scene,
  toolRegistry: {
    signal: lazy(() => import("./tools/SignalLamp")),
    table: lazy(() => import("./tools/ProcessTable")),
  },
  extras: {
    MonitorWall,
  },
};

export default round1Definition;
