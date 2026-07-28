// Dotted version comparison (e.g. app/OS versions: "1.0.19"). Missing trailing components are
// treated as 0, so '1.0' is considered equal to '1.0.0'.
export const isVersionAtLeast = (version: string, minVersion: string): boolean => {
    const versionParts = version.split('.').map(Number);
    const minParts = minVersion.split('.').map(Number);
    const len = Math.max(versionParts.length, minParts.length);
    for (let i = 0; i < len; i++) {
        const v = versionParts[i] ?? 0;
        const m = minParts[i] ?? 0;
        if (v > m) return true;
        if (v < m) return false;
    }
    return true;
};
