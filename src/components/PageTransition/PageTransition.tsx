import { ActivityIndicator } from 'react-native';
import { useAppState} from 'incyclist-services';
import { TransitionShell, TNavigationItem } from '../../components';

interface PageTransitionProps {
    selected: TNavigationItem;
}

export const PageTransitionView = ({ selected }: PageTransitionProps) => (
    <TransitionShell selected={selected} disabled={true}>
        <ActivityIndicator size="large" color="white" />
    </TransitionShell>
);

export const PageTransition = () => {
    const appState = useAppState();
    const sourcePage = appState.getPersistedState('page')
    const selected = sourcePage.startsWith('/') ? sourcePage.substring(1) : sourcePage;

    return <PageTransitionView selected={selected} />;
};
