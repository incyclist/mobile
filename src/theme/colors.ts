export const colors = {
    background: '#1E1E1E',
    tileIdle: '#3A9CCF',
    tileEmpty: '#9fa4a8',
    tileActive: '#dd9933',
    buttonPrimary: '#dd9933',
    selected: '#dd9933',
    navigationSelected: '#FFFFFF',
    buttonSecondary: '#FFFFFF',
    button: '#EEEEEE',
    text: '#FFFFFF',
    link: '#8cc4ff',
    textPrimary: '#FFFFFF',
    icon:  '#FFFFFF',
    iconSelected: "#000000",
    iconDisabled: '#EEEEEE',    
    
    
    tileFooter: '#1E1E1E',
    listSeparator:  '#EEEEEE',
    dialogBackground: ['rgba(56, 1, 31, 0.975)', 'rgba(26, 4, 86, 0.975)'],
    listItemBackground: 'rgba(26,4,86,0.4)', // ['rgba(56,1,31,0.3),rgba(26,4,86,0.3)'],
    elevationPreviewColor: '#EEEEEE', //  '#7f7f7f'
    dialogBorder: '#ccc',
    switchTrack:  {
        false: '#767577',
        true: 'lightgreen'
    },
    switchThumb:{
        off: '#f4f3f4',
        on: 'green'
    },
    // Pairing page: the status line's dot, and the amber "waiting for this one" outline
    statusDot: {
        red: '#e74c3c',
        green: '#2ecc71',
        amber: '#f5a623',
    },
    pairingWaiting: '#f5a623',
    // a switched-off tile's surface: dimmed, while its text keeps full contrast
    tileDimmed: 'rgba(159, 164, 168, 0.4)',
    helperPanelBackground: 'rgba(30, 36, 46, 0.97)',
    helperTipBackground: 'rgba(0, 0, 0, 0.3)',
    error: '#D32F2F',
    warning: '#FFBF00',
    success: '#4CAF50',
    disabled: '#9fa4a8',
    // Workout ride screen only (workout-mobile-hld.md §5 "Ride screen — layout", session 4.2
    // prototype sign-off): solid black rather than the usual `background` — a workout-only ride
    // has no route/video visuals to show, and black maximises contrast for WorkoutGraph's small
    // axis/tick labels.
    workoutRideBackground: '#000000'
}
