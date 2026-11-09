import { getCapabilityIconSize, CapabilityIconLayout } from './utils'

const layout = (props: Partial<CapabilityIconLayout> = {}): CapabilityIconLayout => ({
    height: 160,
    size: 'large',
    hasTitle: true,
    hasRoleLabel: false,
    hasToggle: true,
    hasValue: true,
    awaited: false,
    fontScale: 1,
    ...props,
})

describe('getCapabilityIconSize', () => {
    it("never grows past today's size: 64dp on a large tile, 48dp on a small one", () => {
        expect(getCapabilityIconSize(layout({ height: 200 }))).toBe(64)
        expect(getCapabilityIconSize(layout({ height: 140, size: 'small' }))).toBe(48)
    })

    it('a role line takes room from the icon, not from the text', () => {
        const plain = getCapabilityIconSize(layout())
        const withRole = getCapabilityIconSize(layout({ hasRoleLabel: true }))

        expect(plain).toBeDefined()
        expect(withRole).toBeDefined()
        expect(withRole as number).toBeLessThan(plain as number)
    })

    it('a larger font scale takes room from the icon', () => {
        const normal = getCapabilityIconSize(layout())
        const scaled = getCapabilityIconSize(layout({ fontScale: 1.3 }))

        expect(scaled as number).toBeLessThan(normal as number)
    })

    it("the waiting outline's border takes room from the icon", () => {
        const plain = getCapabilityIconSize(layout())
        const awaited = getCapabilityIconSize(layout({ awaited: true }))

        expect(awaited as number).toBeLessThan(plain as number)
    })

    it('is hidden rather than drawn below 24dp', () => {
        // a phone tile (small size) with a role line and the waiting outline
        expect(getCapabilityIconSize(layout({ height: 90, size: 'small', hasRoleLabel: true, awaited: true }))).toBeUndefined()

        for (let height = 40; height <= 200; height += 5) {
            const size = getCapabilityIconSize(layout({ height, size: height > 150 ? 'large' : 'small', hasRoleLabel: true }))
            if (size !== undefined)
                expect(size).toBeGreaterThanOrEqual(24)
        }
    })

    it('a phone tile without a role line still shows the icon', () => {
        expect(getCapabilityIconSize(layout({ height: 90, size: 'small' }))).toBeGreaterThanOrEqual(24)
    })
})
