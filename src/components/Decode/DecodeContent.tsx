// Decode TSX File
// explains what Decode does and introduces the terms
// Decode, Opcode, Operands, Control Unit, Instruction Decoder

import React from "react";

type GlossaryTerms = {
    term: string;
    short: string; // one-liner description
    description: string; // longer description
    accent: "emerald" | "amber"; // color for the card
}

const GLOSSARY: GlossaryTerms[] = [
    {
        term: "Opcode",
        short: "Part of the instruction that tells what operation to perform.",
        description: "Short for 'operation code'. It's the part of the instruction that tells the CPU which action to take (e.g., ADD, MOV, SUB, or JMP). This is read first to figure out everything else.",
        accent: "emerald",
    },
    {
        term: "Operand(s)",
        short: "Values or addresses that the instruction operates on.",
        description: "These are the data items that the instruction uses or modifies. For example, in the instruction 'ADD R1, R2', the operands are R1 and R2.",
        accent: "amber",
    },
    {
        term: "Control Unit",
        short: "The part of the CPU that directs the flow of data and operations.",
        description: "Once the opcode is known, the Control Unit generates control signals that tell the rest of the CPU how to execute the instruction, such as which data paths to use.",
        accent: "amber",
    },
    {
        term: "Instruction Decoder",
        short: "The circuit that interprets the instruction and separates it into parts.",
        description: "A hardware component that takes the instruction from the Instruction Register (IR) and splits it into its opcode and operand fields.",
        accent: "emerald",
    },  
];

export default function DecodeContent() {
    return (
        <section className="space-y-6 font-mono">
            {/* Section heading */}
            <div>
                <h2 className="text-xs uppercase tracking-[0.25em] text-red-400 font-bold">
                    Stage 02 · Decode
                </h2>
                <h3 className="mt-1 text-2xl font-black text-slate-100 uppercase tracking-tight">
                    Decoding Instructions
                </h3>
                <p className="mt-3 w-full text-xs sm:text-sm text-left leading-relaxed text-stone-400 font-sans">
                    Once the Fetch stage finishes, the instruction in the {" "} <span className="font-mono text-stone-200 text-[11px] bg-stone-900 px-1.5 py-0.5 border border-stone-850 rounded inline-block mx-1">IR</span> 
                    (Instruction Register) is ready to be decoded. These are raw bits that are unrecognizable unless interpreted and split
                    into recognizable parts. That splitting and interpretation is the core of the decode stage.
                </p>
            </div>

            {/* Each term in glossary has their own cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                {GLOSSARY.map((item) => (
                    <GlossaryCard key={item.term} {...item} />
                ))}
            </div>

            <div className="rounded border border-stone-900 bg-stone-950/40 p-5">
                <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
                    Decode stage splits instruction into two things:
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-400">
                    <li> A separated {" "}
                        <span className="font-mono text-red-400 font-bold">opcode</span> +{" "}
                        <span className="font-mono text-stone-200 font-bold">operand(s)</span> pair
                    </li>
                    <li>
                        A route from Control Unit to tell Execute stage what to do next
                    </li>
                </ol>
            </div>
        </section>
    );
}

// GlossaryCard to display each term in glossary
function GlossaryCard({ term, short, description }: GlossaryTerms) {
    return (
        <details 
            className="group rounded border-2 border-stone-400 p-5 bg-cover bg-center bg-no-repeat transition-all duration-200 open:border-red-600 shadow-sm open:shadow-md relative overflow-hidden"
            style={{ backgroundImage: "url('/paper-texture.jpg')" }}
        >
            <summary className="cursor-pointer list-none select-none">
                <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black tracking-wide text-stone-950 group-open:text-red-700 transition-colors">
                        {term}
                    </span>
                    <span className="text-stone-600 font-bold transition-transform group-open:rotate-45 text-sm group-open:text-red-700">
                        +
                    </span>
                </div>
                <p className="mt-1 text-xs font-sans font-medium text-stone-800 leading-snug">{short}</p>
            </summary>
            
            <p className="mt-3 border-t border-stone-300 pt-3 text-[11px] font-sans leading-relaxed text-stone-600">
                {description}
            </p>
        </details>
    );
}
