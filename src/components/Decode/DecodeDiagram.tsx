// Decode Diagram component

// No game logic but shows which 'box' to highlight, matching the current step in the game

import React from "react";

// Game passes one of these keys (or null) as `activeStage`.
export type DecodeStage =
  | "ir"
  | "decoder"
  | "opcode"
  | "operand"
  | "control-unit"
  | null;

type DecodeDiagramProps = {
  activeStage: DecodeStage;
  resolvedOpcode?: string;
  resolvedOperand?: string;
};

// Handles the highlight styling
function DiagramBox({
  label,
  sublabel,
  active,
  accent,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  accent: "emerald" | "amber" | "slate";
}) {
  const activeBoxes: Record<string, string> = {
    emerald: "border-emerald-400 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/20",
    amber: "border-amber-400 bg-amber-500/10 text-amber-300 shadow-amber-500/20",
    slate: "border-slate-400 bg-slate-500/10 text-slate-200 shadow-slate-500/20",
  };

  return (
    <div className={["rounded border px-4 py-3 text-center font-mono text-xs transition-all duration-300 relative overflow-hidden bg-cover bg-center bg-no-repeat",
      active
        ? `${activeBoxes[accent]} shadow-md scale-105 font-bol`
        : "border-stone-400 text-stone-100 opacity-60",
    ].join(" ")}>
      <div className="font-semibold">{label}</div>
      {sublabel && (
        <div className="mt-1 text-[10px] font-normal text-slate-400">
          {sublabel}
        </div>
      )}
    </div>
  );
}

// arrow element, when active, it glows to show data currently flowing
function Arrow({ active, vertical = false }: { active: boolean; vertical?: boolean }) {
  return (
    <div className={["flex items-center justify-center text-lg transition-colors duration-300",
      vertical ? "rotate-90 sm:rotate-0" : "",
      active ? "text-emerald-400" : "text-slate-600",
    ].join(" ")}
    aria-hidden="true">
      ➜
    </div>
  );
}

export default function DecodeDiagram({
  activeStage,
  resolvedOpcode,
  resolvedOperand,
}: DecodeDiagramProps) {
  // Helper function to determine if a given stage is the active one
  const isActive = (stage: DecodeStage) => activeStage === stage;
  // If the active stage is one of these, then the decoder has already been passed, so we can highlight the decoder box as well.
  const pastDecoder =
    activeStage === "opcode" ||
    activeStage === "operand" ||
    activeStage === "control-unit";

  return (
    <div className="rounded border-2 border-stone-800 bg-stone-950/40 p-6 font-mono">
      <p className="mb-4 text-[10px] uppercase tracking-[0.2em] text-stone-300 border-b border-stone-900 pb-2">
        Decode Data Path
      </p>

      {/* IR to Instruction Decoder*/}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <DiagramBox label="IR" sublabel="Raw Instruction Bits"active={isActive("ir")} accent="slate" />
        <Arrow active={isActive("ir")} />
        <DiagramBox
          label="Instruction Decoder"
          sublabel="Divides bits into fields"
          active={isActive("decoder")}
          accent="slate"
        />
      </div>

      {/* Decoder to Opcode and Operand */}
      <div className="my-3 flex justify-center">
        <Arrow active={pastDecoder} vertical />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DiagramBox
          label="Opcode"
          sublabel={resolvedOpcode ?? "ex. MOV, ADD"}
          active={isActive("opcode")}
          accent="emerald"
        />
        <DiagramBox
          label="Operand(s)"
          sublabel={resolvedOperand ?? "ex. AX, BX"}
          active={isActive("operand")}
          accent="amber"
        />
      </div>

      {/* Control Unit */}
      <div className="my-3 flex justify-center">
        <Arrow active={isActive("control-unit")} vertical />
      </div>

      <div className="flex justify-center">
        <div className="w-full sm:w-2/3">
          <DiagramBox
            label="Control Unit"
            sublabel="Determines execution path"
            active={isActive("control-unit")}
            accent="emerald"
          />
        </div>
      </div>
    </div>
  );
}