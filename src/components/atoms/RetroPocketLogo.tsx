import React, { useId } from "react";

interface RetroPocketLogoProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "responsive";
    className?: string;
    showShadow?: boolean;
}

const defaultSizeMap = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    responsive: "",
};

export const RetroPocketLogo: React.FC<RetroPocketLogoProps> = ({
    size = "responsive",
    className = "",
    showShadow = true,
}) => {
    const uniqueId = useId().replace(/:/g, "_");
    const sizeClass = size === "responsive" ? "" : defaultSizeMap[size];

    // Colors designed for ultra-crisp, high-contrast visibility at all screen scales (16px to 512px)
    const chassisBlue = "#144299";
    const chassisBevel = "#2563eb";
    const faceplateIvory = "#f7f4ed";
    const faceplateBorder = "#1e2229";
    const lcdGreen = "#8b9a73";
    const pixelDark = "#142410";
    const goldAmber = "#ffd23f";
    const keyPutty = "#ded9cd";

    return (
        <div
            className={`relative shrink-0 select-none ${sizeClass} ${
                showShadow ? "drop-shadow-[2px_2px_0px_#1e2229]" : ""
            } ${className}`}
            aria-label="RetroPocket Arcade Logo"
        >
            <svg
                viewBox="0 0 512 512"
                width="100%"
                height="100%"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full block"
            >
                <defs>
                    {/* Isolated, unique-ID gradient definitions to prevent browser display:none bugs */}
                    <linearGradient
                        id={`gradBlue_${uniqueId}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#1b52bc" />
                        <stop offset="100%" stopColor="#103680" />
                    </linearGradient>

                    <linearGradient
                        id={`gradLcd_${uniqueId}`}
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#95a67c" />
                        <stop offset="100%" stopColor="#7e8d67" />
                    </linearGradient>

                    <linearGradient
                        id={`gradGold_${uniqueId}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                    >
                        <stop offset="0%" stopColor="#ffe67a" />
                        <stop offset="100%" stopColor="#d99b00" />
                    </linearGradient>
                </defs>

                {/* 1. Chunky Outer Inked Shadow / Border */}
                <rect
                    x="16"
                    y="16"
                    width="480"
                    height="480"
                    rx="108"
                    fill="#1e2229"
                />

                {/* 2. Nokia Cobalt Blue Chassis Frame */}
                <rect
                    x="24"
                    y="24"
                    width="464"
                    height="464"
                    rx="100"
                    fill={chassisBlue}
                />

                {/* 3D Top-Left Bevel Sheen */}
                <path
                    d="M 124 28 L 388 28 C 452 28 480 56 480 120 L 480 136 C 476 80 440 44 384 40 L 128 40 C 72 44 36 80 32 136 L 32 120 C 32 56 60 28 124 28 Z"
                    fill={chassisBevel}
                    opacity="0.6"
                />

                {/* 3. Inner Hardware Faceplate (Warm Off-White Ivory Putty) */}
                <rect
                    x="54"
                    y="54"
                    width="404"
                    height="404"
                    rx="68"
                    fill={faceplateIvory}
                    stroke={faceplateBorder}
                    strokeWidth="12"
                />

                {/* 4. Top Earpiece Grill (Authentic 3 Perforated Slits) */}
                <rect
                    x="200"
                    y="74"
                    width="112"
                    height="14"
                    rx="7"
                    fill="#1e2229"
                />
                <rect
                    x="214"
                    y="78"
                    width="16"
                    height="6"
                    rx="3"
                    fill="#8d8778"
                />
                <rect
                    x="248"
                    y="78"
                    width="16"
                    height="6"
                    rx="3"
                    fill="#8d8778"
                />
                <rect
                    x="282"
                    y="78"
                    width="16"
                    height="6"
                    rx="3"
                    fill="#8d8778"
                />

                {/* Phosphor Green Power LED Diode */}
                <circle cx="394" cy="81" r="9" fill="#1e2229" />
                <circle cx="394" cy="81" r="6" fill="#2ecc71" />
                <circle cx="392" cy="79" r="2" fill="#d4fedb" />

                {/* 5. Outer Bezel & Nokia Olive LCD Screen */}
                <rect
                    x="82"
                    y="106"
                    width="348"
                    height="198"
                    rx="22"
                    fill="#1e2229"
                />
                <rect
                    x="94"
                    y="118"
                    width="324"
                    height="174"
                    rx="14"
                    fill={lcdGreen}
                />

                {/* LCD Status Indicators: Signal & Battery */}
                <g fill={pixelDark} opacity="0.45">
                    <rect x="108" y="132" width="3.5" height="4" rx="0.5" />
                    <rect x="114" y="130" width="3.5" height="6" rx="0.5" />
                    <rect x="120" y="128" width="3.5" height="8" rx="0.5" />
                    <rect x="126" y="126" width="3.5" height="10" rx="0.5" />

                    <rect
                        x="384"
                        y="127"
                        width="22"
                        height="9"
                        rx="1.5"
                        stroke={pixelDark}
                        strokeWidth="1.5"
                        fill="none"
                    />
                    <rect x="406" y="130" width="2" height="3" rx="0.5" />
                    <rect x="387" y="129" width="4" height="5" />
                    <rect x="393" y="129" width="4" height="5" />
                    <rect x="399" y="129" width="4" height="5" />
                </g>

                {/* ======================================================== */}
                {/* HERO PIXEL EMBLEM: BOLD "R" MONOGRAM AS PIXEL SNAKE LOOP */}
                {/* ======================================================== */}
                <g fill={pixelDark}>
                    {/* Vertical Spine (5 blocks) */}
                    <rect x="186" y="148" width="20" height="20" rx="2" />
                    <rect x="186" y="172" width="20" height="20" rx="2" />
                    <rect x="186" y="196" width="20" height="20" rx="2" />
                    <rect x="186" y="220" width="20" height="20" rx="2" />
                    <rect x="186" y="244" width="20" height="20" rx="2" />{" "}
                    {/* Snake Tail */}
                    {/* Top Bar of "R" */}
                    <rect x="210" y="148" width="20" height="20" rx="2" />
                    <rect x="234" y="148" width="20" height="20" rx="2" />
                    <rect x="258" y="148" width="20" height="20" rx="2" />
                    {/* Right Curve of "R" */}
                    <rect x="258" y="172" width="20" height="20" rx="2" />
                    {/* Mid Crossbar of "R" */}
                    <rect x="210" y="196" width="20" height="20" rx="2" />
                    <rect x="234" y="196" width="20" height="20" rx="2" />
                    <rect x="258" y="196" width="20" height="20" rx="2" />
                    {/* Diagonal Snake Leg / Head */}
                    <rect x="234" y="220" width="20" height="20" rx="2" />
                    <rect x="258" y="244" width="20" height="20" rx="2" />
                    {/* Snake Eye on Head */}
                    <rect
                        x="270"
                        y="248"
                        width="4"
                        height="4"
                        fill={lcdGreen}
                    />
                    {/* Snake Tongue Flick */}
                    <rect x="280" y="253" width="7" height="2.5" />
                    <rect x="287" y="250.5" width="3.5" height="2.5" />
                    <rect x="287" y="255.5" width="3.5" height="2.5" />
                    {/* The Golden Apple / Bonus Dot (radiant and high contrast) */}
                    <circle
                        cx="320"
                        cy="254"
                        r="11"
                        fill={goldAmber}
                        stroke={pixelDark}
                        strokeWidth="3"
                    />
                    {/* Apple Stem */}
                    <rect
                        x="319"
                        y="239"
                        width="2.5"
                        height="4.5"
                        rx="0.5"
                        fill={pixelDark}
                    />
                </g>

                {/* 6. Keypad Controls Architecture */}
                {/* Left Softkey */}
                <rect
                    x="96"
                    y="328"
                    width="84"
                    height="34"
                    rx="10"
                    fill="#1e2229"
                />
                <rect
                    x="96"
                    y="323"
                    width="84"
                    height="34"
                    rx="10"
                    fill={keyPutty}
                    stroke="#1e2229"
                    strokeWidth="5"
                />
                <rect
                    x="122"
                    y="337"
                    width="32"
                    height="6"
                    rx="3"
                    fill={chassisBlue}
                />

                {/* Right Softkey */}
                <rect
                    x="332"
                    y="328"
                    width="84"
                    height="34"
                    rx="10"
                    fill="#1e2229"
                />
                <rect
                    x="332"
                    y="323"
                    width="84"
                    height="34"
                    rx="10"
                    fill={keyPutty}
                    stroke="#1e2229"
                    strokeWidth="5"
                />
                <rect
                    x="358"
                    y="337"
                    width="32"
                    height="6"
                    rx="3"
                    fill="#c0392b"
                />

                {/* Center Sculpted Navi-Key D-Pad */}
                <rect
                    x="206"
                    y="318"
                    width="100"
                    height="92"
                    rx="26"
                    fill="#1e2229"
                />
                <rect
                    x="206"
                    y="312"
                    width="100"
                    height="92"
                    rx="26"
                    fill={chassisBlue}
                    stroke="#1e2229"
                    strokeWidth="6"
                />

                {/* Directional Arrow Notches */}
                <path
                    d="M256 320 L263 328 L249 328 Z"
                    fill="#60a5fa"
                    opacity="0.85"
                />
                <path
                    d="M256 394 L263 386 L249 386 Z"
                    fill="#60a5fa"
                    opacity="0.85"
                />
                <path
                    d="M216 358 L224 351 L224 365 Z"
                    fill="#60a5fa"
                    opacity="0.85"
                />
                <path
                    d="M296 358 L288 351 L288 365 Z"
                    fill="#60a5fa"
                    opacity="0.85"
                />

                {/* Radiant Amber Gold Center Pip (Tactile D-Pad Core) */}
                <circle cx="256" cy="360" r="17" fill="#1e2229" />
                <circle
                    cx="256"
                    cy="358"
                    r="16"
                    fill={goldAmber}
                    stroke="#1e2229"
                    strokeWidth="4"
                />
                <circle cx="252" cy="354" r="4" fill="#ffffff" opacity="0.65" />

                {/* Bottom Numpad Domes */}
                <circle cx="138" cy="402" r="18" fill="#1e2229" />
                <circle
                    cx="138"
                    cy="397"
                    r="17"
                    fill={keyPutty}
                    stroke="#1e2229"
                    strokeWidth="4.5"
                />
                <circle cx="138" cy="397" r="3.5" fill="#64748b" />

                <circle cx="256" cy="414" r="17" fill="#1e2229" />
                <circle
                    cx="256"
                    cy="409"
                    r="16"
                    fill={keyPutty}
                    stroke="#1e2229"
                    strokeWidth="4.5"
                />
                <circle cx="256" cy="409" r="3.5" fill="#64748b" />

                <circle cx="374" cy="402" r="18" fill="#1e2229" />
                <circle
                    cx="374"
                    cy="397"
                    r="17"
                    fill={keyPutty}
                    stroke="#1e2229"
                    strokeWidth="4.5"
                />
                <circle cx="374" cy="397" r="3.5" fill="#64748b" />

                {/* 7. MMC Memory Card Gold Pins (Bottom Rim) */}
                <rect
                    x="208"
                    y="444"
                    width="96"
                    height="9"
                    rx="2"
                    fill="#1e2229"
                />
                <rect
                    x="212"
                    y="445"
                    width="11"
                    height="7"
                    rx="1"
                    fill={goldAmber}
                />
                <rect
                    x="230"
                    y="445"
                    width="11"
                    height="7"
                    rx="1"
                    fill={goldAmber}
                />
                <rect
                    x="248"
                    y="445"
                    width="11"
                    height="7"
                    rx="1"
                    fill={goldAmber}
                />
                <rect
                    x="266"
                    y="445"
                    width="11"
                    height="7"
                    rx="1"
                    fill={goldAmber}
                />
                <rect
                    x="284"
                    y="445"
                    width="11"
                    height="7"
                    rx="1"
                    fill={goldAmber}
                />
            </svg>
        </div>
    );
};
