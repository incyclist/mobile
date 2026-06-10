// ... (existing imports, add)
import { RideSettings } from '../RideSettings';

// ... (inside NavigationBar component)
    const [showPlaceholder, setShowPlaceholder] = useState(false);
    const [showRideSettings, setShowRideSettings] = useState(false); // Added
    const [showGear, setShowGear] = useState(false);

// ... (update handleSectionPress)
    const handleSectionPress = useCallback((label: string) => {
        switch (label) {
            case 'Apps':
                setShowAppsDialog(true);
                break;
            case 'Support':
                setShowSettings(false);
                setShowSupport(true);
                break;
            case 'Gear':
                setShowSettings(false);
                setShowGear(true);
                break;
            case 'Ride':
                setShowSettings(false);
                setShowRideSettings(true);
                break;
            default:
                setShowSettings(false);
                setShowPlaceholder(true);
                break;
        }
    }, []);

// ... (add handler)
    const handleRideSettingsClose = useCallback(() => setShowRideSettings(false), []);

// ... (update return/JSX)
            {showSupport && <SupportSettings onClose={handleSupportClose} />}
            {showPlaceholder && <SettingsPlaceholder onClose={handlePlaceholderClose} />}
            {showRideSettings && <RideSettings onClose={handleRideSettingsClose} />}
            {showGear && <GearSettings onClose={handleGearClose} />}