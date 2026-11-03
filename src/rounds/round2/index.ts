import { lazy } from "react";
import { RoundDefinition } from "../types";
import { Round2Scene } from "./Scene";

export const round2Definition: RoundDefinition = {
  id: 2,
  themeKey: "round2",
  Scene: Round2Scene,
  toolRegistry: {
    network_session_filter: lazy(() =>
      import("./tools/NetworkSessionFilter").then((m) => ({
        default: m.NetworkSessionFilter,
      }))
    ),
    data_reconstruction: lazy(() =>
      import("./tools/DataReconstruction").then((m) => ({
        default: m.DataReconstruction,
      }))
    ),
    vault_dials: lazy(() =>
      import("./tools/VaultDials").then((m) => ({
        default: m.VaultDials,
      }))
    ),
  },
};

export default round2Definition;
