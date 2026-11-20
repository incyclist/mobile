import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { fn } from 'storybook/test';
import { RouteServersDialogView } from './RouteServersDialogView';
import {
    addProps,
    listProps,
    KNOWN_ADDED,
    KNOWN_AVAILABLE,
    KNOWN_CHECKING,
    KNOWN_ERROR,
    REMOVE_WITH_ROUTES,
    REMOVE_WITHOUT_ROUTES,
    SERVER_ALPINE,
    SERVER_LOADING,
    SERVER_LOCAL,
    SERVER_UNREACHABLE,
} from './RouteServersDialog.mock';

// The `compact` arg selects the phone layout of the content. The surrounding Dialog follows the
// size of the browser window: use a tablet viewport (e.g. 1024x600) for the Tablet* stories and
// a phone viewport (e.g. 800x360) for the Phone* stories.
const meta: Meta<typeof RouteServersDialogView> = {
    title: 'Components/RouteServersDialog',
    component: RouteServersDialogView,
    args: {
        visible: true,
        compact: false,
        onClose: fn(),
        onBack: fn(),
        onShowAdd: fn(),
        onShowManualEntry: fn(),
        onAddKnown: fn(),
        onRetryKnown: fn(),
        onSetManualUrl: fn(),
        onSetManualName: fn(),
        onCheckAndAdd: fn(),
        onCheck: fn(),
        onAdd: fn(),
        onConfirmAddEmpty: fn(),
        onCancelAddEmpty: fn(),
        onRequestRemove: fn(),
        onSetRemoveRoutes: fn(),
        onConfirmRemove: fn(),
        onCancelRemove: fn(),
    },
};

export default meta;

type Story = StoryObj<typeof RouteServersDialogView>;

const PHONE = { compact: true };

// On a device the confirmation is presented after the list; mounting both at once would stack
// the (translucent) list over the confirmation in the browser. Open it a moment later, as the
// dialog service does after a tap on Remove.
const WithDelayedRemoveDialog = (props: React.ComponentProps<typeof RouteServersDialogView>) => {
    const [show, setShow] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setShow(true), 600);
        return () => clearTimeout(timer);
    }, []);
    const withoutDialog = { ...props.displayProps, removeDialog: undefined };
    return <RouteServersDialogView {...props} displayProps={show ? props.displayProps : withoutDialog} />;
};

const renderWithDelayedRemoveDialog = (args: React.ComponentProps<typeof RouteServersDialogView>) => (
    <WithDelayedRemoveDialog {...args} />
);
const SERVERS = [SERVER_ALPINE, SERVER_UNREACHABLE, SERVER_LOADING, SERVER_LOCAL];
const KNOWN = [KNOWN_AVAILABLE, KNOWN_ADDED, KNOWN_CHECKING];

// ---- list ----

export const TabletList: Story = { args: { displayProps: listProps(SERVERS) } };
export const PhoneList: Story = { args: { ...PHONE, displayProps: listProps(SERVERS) } };
export const TabletEmpty: Story = { args: { displayProps: listProps([]) } };
export const PhoneEmpty: Story = { args: { ...PHONE, displayProps: listProps([]) } };

// ---- remove ----

export const TabletRemoveWithRoutes: Story = {
    render: renderWithDelayedRemoveDialog,
    args: { displayProps: listProps(SERVERS, { removeDialog: REMOVE_WITH_ROUTES }) },
};
export const TabletRemoveWithoutRoutes: Story = {
    render: renderWithDelayedRemoveDialog,
    args: { displayProps: listProps(SERVERS, { removeDialog: REMOVE_WITHOUT_ROUTES }) },
};
export const PhoneRemoveWithRoutes: Story = {
    render: renderWithDelayedRemoveDialog,
    args: { ...PHONE, displayProps: listProps(SERVERS, { removeDialog: REMOVE_WITH_ROUTES }) },
};

// ---- add: known servers ----

export const TabletAddWithKnown: Story = { args: { displayProps: addProps(KNOWN) } };
export const TabletAddWithoutKnown: Story = { args: { displayProps: addProps([]) } };
export const TabletAddKnownError: Story = { args: { displayProps: addProps([KNOWN_AVAILABLE, KNOWN_ERROR]) } };
export const PhoneAddStart: Story = { args: { ...PHONE, displayProps: addProps(KNOWN) } };
export const PhoneAddWithoutKnown: Story = { args: { ...PHONE, displayProps: addProps([]) } };

// ---- add: manual entry on tablet ----

export const TabletManualTyping: Story = {
    args: {
        displayProps: addProps(KNOWN, {
            url: 'nas:8080',
            name: 'Nas',
            suggestedName: 'Nas',
            canSubmit: true,
            canCheck: true,
        }),
    },
};
export const TabletManualLocalHttp: Story = {
    args: {
        displayProps: addProps(KNOWN, {
            url: 'http://nas:8080',
            name: 'Home NAS',
            nameTouched: true,
            localNote: "Local server — traffic isn't encrypted. Use this only on your home network.",
            canSubmit: true,
            canCheck: true,
        }),
    },
};
export const TabletManualChecking: Story = {
    args: {
        displayProps: addProps(KNOWN, {
            url: 'https://jan-rides.example/routes',
            name: 'Jan Rides',
            state: 'checking',
        }),
    },
};
export const TabletManualErrors: Story = {
    args: {
        displayProps: addProps(KNOWN, {
            url: 'https://jan-rides.example/routes',
            name: 'Strava',
            nameTouched: true,
            state: 'error',
            urlError: "Couldn't reach this address. Check it, and check that you're online.",
            nameError: "'Strava' is already used as a source in Incyclist. Choose another name.",
            canSubmit: false,
            canCheck: true,
        }),
    },
};
export const TabletManualCheckedAfterHttpSwitch: Story = {
    args: {
        displayProps: addProps(KNOWN, {
            url: 'nas:8080',
            name: 'Nas',
            state: 'checked',
            resolvedUrl: 'http://nas:8080/',
            localNote: "Local server — traffic isn't encrypted.",
            message: 'Found 7 routes.',
            canSubmit: true,
            canCheck: true,
        }),
    },
};
export const TabletManualSuccess: Story = {
    args: {
        displayProps: addProps(KNOWN, {
            url: 'https://routes.jan-rides.example',
            name: 'Jan Rides',
            state: 'success',
            message: 'Found 9 routes.',
        }),
    },
};
export const TabletManualEmptyServer: Story = {
    args: {
        displayProps: addProps(KNOWN, {
            url: 'https://routes.jan-rides.example',
            name: 'Jan Rides',
            state: 'confirm-empty',
            message: 'This server works but has no routes yet. Add it anyway?',
            canSubmit: true,
        }),
    },
};
export const TabletAddFromImportDialog: Story = {
    args: { displayProps: addProps(KNOWN, {}, { origin: 'import' }) },
};

// ---- add: manual entry on phone ----

export const PhoneManualTyping: Story = {
    args: {
        ...PHONE,
        displayProps: addProps(KNOWN, { url: 'nas:8080', canCheck: true }, { view: 'add-manual' }),
    },
};
export const PhoneManualError: Story = {
    args: {
        ...PHONE,
        displayProps: addProps(
            KNOWN,
            {
                url: 'http://videos.example.org',
                state: 'error',
                urlError:
                    'Plain http:// only works for servers on your home network. For servers on the internet, use an https:// address.',
                canCheck: true,
            },
            { view: 'add-manual' }
        ),
    },
};
export const PhoneManualChecking: Story = {
    args: {
        ...PHONE,
        displayProps: addProps(
            KNOWN,
            { url: 'https://routes.jan-rides.example', state: 'checking' },
            { view: 'add-manual' }
        ),
    },
};
export const PhoneManualChecked: Story = {
    args: {
        ...PHONE,
        displayProps: addProps(
            KNOWN,
            {
                url: 'https://routes.jan-rides.example',
                name: 'Jan Rides',
                state: 'checked',
                message: 'Found 9 routes.',
                canSubmit: true,
                canCheck: true,
            },
            { view: 'add-manual' }
        ),
    },
};
export const PhoneManualCheckedInvalidName: Story = {
    args: {
        ...PHONE,
        displayProps: addProps(
            KNOWN,
            {
                url: 'http://192.168.1.20:8080',
                name: '',
                nameTouched: true,
                state: 'checked',
                message: 'Found 7 routes.',
                localNote: "Local server — traffic isn't encrypted.",
                nameError: "Enter a name. It's shown in your route list.",
                canSubmit: false,
                canCheck: true,
            },
            { view: 'add-manual' }
        ),
    },
};
export const PhoneManualEmptyServer: Story = {
    args: {
        ...PHONE,
        displayProps: addProps(
            KNOWN,
            {
                url: 'https://routes.jan-rides.example',
                name: 'Jan Rides',
                state: 'confirm-empty',
                message: 'This server works but has no routes yet. Add it anyway?',
                canSubmit: true,
            },
            { view: 'add-manual' }
        ),
    },
};
