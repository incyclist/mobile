import { Avatar } from 'incyclist-services';
import { AVATAR_DEFAULT_COLORS, AvatarColors } from '../../assets/avatars/male-paths';

/**
 * Maps the simple, published `Avatar` shape (`{helmet, shirt}`) onto the richer per-part color set
 * the shared rider figure (`../assets/avatars/male-paths`) actually draws with. Only `helmet`/
 * `shirt` map onto real parts — everything else (skin, hair, glasses, ...) keeps its default so a
 * two-color `Avatar` value still reads as a recognizable rider without those extra parts modeled.
 *
 * One definition, shared by every renderer of a previous rider's identity — `PrevRiderAvatar`
 * (tablet list row) and `FreeMap`'s marker `AvatarConfig` (map) — so the list and the map always
 * derive the same rider's colors from the same code path.
 */
export const avatarToConfig = (avatar: Avatar): AvatarColors => {
    const overrides: Partial<AvatarColors> = {
        helmOuter: avatar.helmet,
        helmInner: avatar.helmet,
        shirt: avatar.shirt,
        shirtStripe: avatar.shirt,
    };
    return { ...AVATAR_DEFAULT_COLORS, ...overrides };
};
