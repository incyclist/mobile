import React from 'react';
import Svg, { Circle, Line, Path, Rect, G } from 'react-native-svg';

const A = '#dd9933'; // amber — matches colors.buttonPrimary
const W = '#FFFFFF'; // white

interface Props {
    size?: number;
}

export const WorkoutTrainerIllustration = ({ size = 200 }: Props) => (
    <Svg viewBox="0 0 240 200" width={size} height={size * (200 / 240)}>

        {/* ── TRAINER STAND ──────────────────────────────────── */}
        {/* Left support arm */}
        <Line x1="155" y1="148" x2="132" y2="183" stroke={A} strokeWidth="5" strokeLinecap="round" />
        {/* Right support arm */}
        <Line x1="155" y1="148" x2="178" y2="183" stroke={A} strokeWidth="5" strokeLinecap="round" />
        {/* Base bar */}
        <Line x1="126" y1="183" x2="184" y2="183" stroke={A} strokeWidth="6" strokeLinecap="round" />
        {/* Flywheel ring (inside rear wheel, represents resistance unit) */}
        <Circle cx="155" cy="148" r="16" stroke={A} strokeWidth="3" fill="none" />

        {/* Front wheel riser block */}
        <Rect x="46" y="180" width="34" height="9" rx="3" fill={A} />

        {/* ── WHEELS ─────────────────────────────────────────── */}
        <Circle cx="65" cy="148" r="33" stroke={W} strokeWidth="3" fill="none" />
        <Circle cx="65" cy="148" r="4" fill={W} />

        <Circle cx="155" cy="148" r="33" stroke={W} strokeWidth="3" fill="none" />
        <Circle cx="155" cy="148" r="4" fill={W} />

        {/* ── FRAME ──────────────────────────────────────────── */}
        {/* Seat tube */}
        <Line x1="106" y1="88" x2="113" y2="150" stroke={A} strokeWidth="4.5" strokeLinecap="round" />
        {/* Top tube */}
        <Line x1="106" y1="88" x2="70" y2="96" stroke={A} strokeWidth="4.5" strokeLinecap="round" />
        {/* Down tube */}
        <Line x1="70" y1="96" x2="113" y2="150" stroke={A} strokeWidth="4.5" strokeLinecap="round" />
        {/* Chain stay */}
        <Line x1="113" y1="150" x2="155" y2="148" stroke={A} strokeWidth="4.5" strokeLinecap="round" />
        {/* Seat stay */}
        <Line x1="155" y1="148" x2="106" y2="88" stroke={A} strokeWidth="4.5" strokeLinecap="round" />
        {/* Fork */}
        <Line x1="70" y1="96" x2="65" y2="148" stroke={A} strokeWidth="4.5" strokeLinecap="round" />

        {/* ── COCKPIT ────────────────────────────────────────── */}
        {/* Stem */}
        <Line x1="70" y1="96" x2="57" y2="76" stroke={A} strokeWidth="4.5" strokeLinecap="round" />
        {/* Drop bar horizontal section */}
        <Line x1="46" y1="74" x2="62" y2="77" stroke={A} strokeWidth="5.5" strokeLinecap="round" />
        {/* Drop bar lower curve (hoods) */}
        <Line x1="46" y1="74" x2="43" y2="85" stroke={A} strokeWidth="4.5" strokeLinecap="round" />

        {/* ── SADDLE ─────────────────────────────────────────── */}
        <Line x1="94" y1="83" x2="118" y2="83" stroke={A} strokeWidth="5.5" strokeLinecap="round" />

        {/* ── CRANKS & PEDALS ────────────────────────────────── */}
        {/* Down-stroke crank */}
        <Line x1="113" y1="150" x2="107" y2="165" stroke={A} strokeWidth="3.5" strokeLinecap="round" />
        {/* Pedal (near) */}
        <Line x1="101" y1="165" x2="113" y2="166" stroke={A} strokeWidth="4" strokeLinecap="round" />
        {/* Up-stroke crank */}
        <Line x1="113" y1="150" x2="119" y2="135" stroke={A} strokeWidth="3.5" strokeLinecap="round" />
        {/* Pedal (far) */}
        <Line x1="113" y1="134" x2="125" y2="135" stroke={A} strokeWidth="4" strokeLinecap="round" />

        {/* ── RIDER ──────────────────────────────────────────── */}
        {/* Head */}
        <Circle cx="50" cy="54" r="12" fill={W} />
        {/* Helmet (arc over head) */}
        <Path d="M38 52 Q50 31 62 52" fill={A} />

        {/* Torso — aggressive forward lean */}
        <Line x1="55" y1="65" x2="101" y2="84" stroke={W} strokeWidth="7" strokeLinecap="round" />

        {/* Near arm (reaching to drops) */}
        <Line x1="63" y1="70" x2="54" y2="78" stroke={W} strokeWidth="4.5" strokeLinecap="round" />
        <Line x1="54" y1="78" x2="43" y2="79" stroke={W} strokeWidth="4.5" strokeLinecap="round" />

        {/* Near leg — downstroke */}
        <Line x1="101" y1="84" x2="111" y2="120" stroke={W} strokeWidth="6.5" strokeLinecap="round" />
        <Line x1="111" y1="120" x2="107" y2="164" stroke={W} strokeWidth="5.5" strokeLinecap="round" />

        {/* Far leg — upstroke */}
        <Line x1="101" y1="84" x2="97" y2="114" stroke={W} strokeWidth="6.5" strokeLinecap="round" />
        <Line x1="97" y1="114" x2="119" y2="135" stroke={W} strokeWidth="5.5" strokeLinecap="round" />

        {/* ── POWER BOLT ─────────────────────────────────────── */}
        <Path d="M207 50 L198 74 L205 74 L196 99 L213 70 L205 70 Z" fill={A} />

        {/* ── MOTION LINES ───────────────────────────────────── */}
        <G opacity={0.35}>
            <Line x1="8" y1="113" x2="26" y2="113" stroke={W} strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="4" y1="127" x2="22" y2="127" stroke={W} strokeWidth="2.5" strokeLinecap="round" />
            <Line x1="10" y1="141" x2="28" y2="141" stroke={W} strokeWidth="2.5" strokeLinecap="round" />
        </G>
    </Svg>
);
