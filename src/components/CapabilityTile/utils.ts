export type CapabilityTileSize = 'small' | 'large'

export interface CapabilityIconLayout {
    /** the tile's height; tiles keep a 1.25 aspect ratio, so this also gives the width */
    height: number
    size: CapabilityTileSize
    hasTitle: boolean
    /** the line that says how the tile relates to the trainer ("Your trainer" / "via your trainer") */
    hasRoleLabel: boolean
    /** the use toggle in the footer, which can be taller than the footer text */
    hasToggle: boolean
    /** whether the icon shares its row with the value column, or has the row to itself */
    hasValue: boolean
    /** the waiting outline's border takes room inside the tile */
    awaited: boolean
    /** the OS font scale: every text line grows with it, the icon has to give way */
    fontScale: number
}

const ASPECT_RATIO = 1.25
// a text line is a little taller than its font size; slightly generous, so the estimate errs
// towards a smaller icon rather than one that runs into the text
const LINE_HEIGHT_FACTOR = 1.25
const MIN_ICON_SIZE = 24
const ICON_MARGIN = 4
const WAITING_BORDER = 3
// the toggle's footprint at its drawn scale (see CapabilityTile), the taller of Android and iOS
const TOGGLE_HEIGHT = 22

// font sizes and vertical padding of the fixed lines, as styled in CapabilityTile
const METRICS: Record<CapabilityTileSize, { maxIcon: number, title: [number, number], device: [number, number], role: [number, number], footer: [number, number] }> = {
    small: { maxIcon: 48, title: [14, 0], device: [12, 0], role: [12, 0], footer: [14, 0] },
    large: { maxIcon: 64, title: [20, 8], device: [16, 8], role: [16, 0], footer: [18, 8] },
}

const lineHeight = ([fontSize, padding]: [number, number], fontScale: number) =>
    fontSize * fontScale * LINE_HEIGHT_FACTOR + padding

/**
 * The size of the capability icon on a tile with a device. The icon is the one part of the tile that
 * gives way: the title, the device name, the role line and the footer keep their size, the icon gets
 * what's left of the tile's height (and of its column's width), up to its regular size. Below 24dp
 * it's left out (undefined) - the title already names the capability.
 */
export const getCapabilityIconSize = (layout: CapabilityIconLayout): number | undefined => {
    const { height, size, hasTitle, hasRoleLabel, hasToggle, hasValue, awaited, fontScale } = layout
    const m = METRICS[size]
    const border = awaited ? 2 * WAITING_BORDER : 0

    const footerText = lineHeight(m.footer, fontScale)
    const footer = hasToggle ? Math.max(footerText, TOGGLE_HEIGHT + m.footer[1]) : footerText
    const fixed = (hasTitle ? lineHeight(m.title, fontScale) : 0)
        + lineHeight(m.device, fontScale)
        + (hasRoleLabel ? lineHeight(m.role, fontScale) : 0)
        + footer

    const byHeight = height - border - fixed - 2 * ICON_MARGIN
    const columnWidth = (height * ASPECT_RATIO - border) / (hasValue ? 2 : 1)
    const byWidth = columnWidth - 2 * ICON_MARGIN

    const iconSize = Math.floor(Math.min(m.maxIcon, byHeight, byWidth))
    return iconSize >= MIN_ICON_SIZE ? iconSize : undefined
}
