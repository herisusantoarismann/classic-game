import React from "react";
import { Keyboard } from "lucide-react";

export const DesktopControlsBox: React.FC = () => {
    return (
        <div className="flex flex-col gap-3.5 p-4 rounded-xl bg-[#fdfbf7] border-2.5 border-[#1e2229] shadow-[4px_4px_0px_#1e2229] text-[#1e2229]">
            <div className="flex items-center justify-between border-b-2 border-[#e6dfd1] pb-2">
                <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-[#144299]" />
                    <h4 className="font-mono text-xs font-black uppercase tracking-wider text-[#1e2229]">
                        PANDUAN KONTROL DESKTOP
                    </h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#ffd23f] px-1.5 py-0.5 rounded border border-[#1e2229]">
                    KEYBOARD
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-[#ece7db] text-[#1e2229] border-2 border-[#1e2229] font-bold shadow-[1px_1px_0px_#1e2229]">
                        W / ↑ / 2
                    </span>
                    <span className="text-[#4b5260] font-semibold">Atas</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-[#ece7db] text-[#1e2229] border-2 border-[#1e2229] font-bold shadow-[1px_1px_0px_#1e2229]">
                        S / ↓ / 8
                    </span>
                    <span className="text-[#4b5260] font-semibold">Bawah</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-[#ece7db] text-[#1e2229] border-2 border-[#1e2229] font-bold shadow-[1px_1px_0px_#1e2229]">
                        A / ← / 4
                    </span>
                    <span className="text-[#4b5260] font-semibold">Kiri</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-[#ece7db] text-[#1e2229] border-2 border-[#1e2229] font-bold shadow-[1px_1px_0px_#1e2229]">
                        D / → / 6
                    </span>
                    <span className="text-[#4b5260] font-semibold">Kanan</span>
                </div>

                <div className="col-span-2 flex items-center justify-between pt-2 border-t-2 border-[#e6dfd1]">
                    <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-[#ece7db] text-[#1e2229] border-2 border-[#1e2229] font-bold shadow-[1px_1px_0px_#1e2229]">
                            Space / 5
                        </span>
                        <span className="text-[#4b5260] font-semibold">
                            Aksi / OK
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-[#ece7db] text-[#1e2229] border-2 border-[#1e2229] font-bold shadow-[1px_1px_0px_#1e2229]">
                            Esc / Q
                        </span>
                        <span className="text-[#4b5260] font-semibold">
                            Kembali
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
