import React from 'react';

// Web-compatible stubs for react-native-svg — render as real SVG elements in the browser.
// This avoids the TurboModuleRegistry.getEnforcing() call that fires at module init
// inside react-native-svg's fabric native spec files.

export const Svg = ({ children, width, height, viewBox, style, ...props }: any) => (
    <svg width={width} height={height} viewBox={viewBox} style={style} {...props}>
        {children}
    </svg>
);
export default Svg;

export const G = ({ children, ...props }: any) => <g {...props}>{children}</g>;

export const Path = ({ d, fill, stroke, strokeWidth, strokeLinecap, strokeLinejoin, ...props }: any) => (
    <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}
        strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} {...props} />
);

export const Rect = ({ x, y, width, height, fill, stroke, strokeWidth, rx, ry, ...props }: any) => (
    <rect x={x} y={y} width={width} height={height}
        fill={fill} stroke={stroke} strokeWidth={strokeWidth} rx={rx} ry={ry} {...props} />
);

export const Circle = ({ cx, cy, r, fill, stroke, strokeWidth, ...props }: any) => (
    <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />
);

export const Line = ({ x1, y1, x2, y2, stroke, strokeWidth, strokeDasharray, ...props }: any) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} {...props} />
);

export const Text = ({ children, x, y, fill, fontSize, fontWeight, textAnchor, ...props }: any) => (
    <text x={x} y={y} fill={fill} fontSize={fontSize}
        fontWeight={fontWeight} textAnchor={textAnchor} {...props}>
        {children}
    </text>
);

export const Defs = ({ children }: any) => <defs>{children}</defs>;

export const Mask = ({ children, id, ...props }: any) => (
    <mask id={id} {...props}>{children}</mask>
);

export const Polygon = ({ points, fill, stroke, strokeWidth, ...props }: any) => (
    <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />
);

export const Polyline = ({ points, fill, stroke, strokeWidth, ...props }: any) => (
    <polyline points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} {...props} />
);

export const Ellipse = ({ cx, cy, rx, ry, fill, stroke, ...props }: any) => (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} stroke={stroke} {...props} />
);

export const ClipPath = ({ children, id, ...props }: any) => (
    <clipPath id={id} {...props}>{children}</clipPath>
);

export const LinearGradient = ({ children, id, ...props }: any) => (
    <linearGradient id={id} {...props}>{children}</linearGradient>
);

export const RadialGradient = ({ children, id, ...props }: any) => (
    <radialGradient id={id} {...props}>{children}</radialGradient>
);

export const Stop = ({ offset, stopColor, stopOpacity, ...props }: any) => (
    <stop offset={offset} stopColor={stopColor} stopOpacity={stopOpacity} {...props} />
);

export const Use = ({ href, ...props }: any) => <use href={href} {...props} />;

export const Symbol = ({ children, id, viewBox, ...props }: any) => (
    <symbol id={id} viewBox={viewBox} {...props}>{children}</symbol>
);

export const Image = ({ href, x, y, width, height, ...props }: any) => (
    <image href={href} x={x} y={y} width={width} height={height} {...props} />
);

export const SvgUri = ({ uri, width, height, style, ...props }: any) => (
    <img src={uri} width={width} height={height} style={style} alt="" {...props} />
);

export const SvgXml = (_props: any) => null;
export const SvgFromXml = (_props: any) => null;
export const SvgCss = (_props: any) => null;
export const SvgWithCss = (_props: any) => null;
