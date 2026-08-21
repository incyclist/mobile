import { StyleSheet } from 'react-native';

/**
 * Style entries shared verbatim (or near-verbatim) between `Video/View.tsx` and its Storybook
 * counterpart `Video/TestView.tsx` - extracted to remove duplication flagged by SonarCloud
 * (FIXES_BACKLOG.md item #63). `elevationFull`'s background color is the one value that
 * genuinely differs between the two (the real view uses a fully transparent overlay, the test
 * view a faint highlight so the mocked screenshot background stays visible), so it stays a
 * parameter.
 */
export const createSharedRideViewStyles = (elevationFullBackgroundColor: string) => StyleSheet.create({
    dashboardContainer: {
        position: 'absolute',
        top: 0,
        zIndex: 10,
    },
    dashboardCompact: {
        left: 0,
        right: 0,
    },
    dashboardTablet: {
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    elevationPreviewTablet: {
        position: 'absolute',
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    elevationPreviewCompact: {
        position: 'absolute',
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    elevationFull: {
        flex: 1,
        height: '100%',
        backgroundColor: elevationFullBackgroundColor,
    },
    menuButtonContainer: {
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
