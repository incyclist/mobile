import type { SupportSettingsPageDisplayProps } from 'incyclist-services';

const appInfo = {
    title: 'App info',
    appVersion: '1.2.3',
    uiVersion: '26.10.1',
    uuid: '1f3a9c0e-5d1b-4e7a-9a3c-2c8e0f4b77b2',
    privacyUrl: 'https://incyclist.com/privacy',
    labels: {
        appVersion: 'App version',
        uiVersion: 'UI version',
        uuid: 'UUID',
        privacy: 'Privacy',
        privacyLink: 'Privacy Policy',
    },
    compactVersionText: 'Version: App 1.2.3 · UI 26.10.1',
    uuidActionLabel: 'Share',
};

const EMAIL_BODY = [
    'Hello,',
    '',
    "[Describe your problem here. What did you do, and what happened?]",
    '',
    '--------------------------------------------',
    'Please keep the details below. They help us find your logs.',
    `uuid: ${appInfo.uuid}`,
    `App version: ${appInfo.appVersion}`,
    `UI version: ${appInfo.uiVersion}`,
].join('\r\n');

const helpLinks: SupportSettingsPageDisplayProps['helpLinks'] = [
    { id: 'strava', label: 'Incyclist Strava Club', shortLabel: 'Strava club', url: 'https://strava.com/clubs/1029407' },
    { id: 'slack', label: 'Incyclist Slack Workspace', shortLabel: 'Slack', url: 'https://slack.incyclist.com' },
    {
        id: 'email',
        label: 'support@incyclist.com',
        shortLabel: 'Email',
        url: 'mailto:support@incyclist.com?subject=Incyclist%20support%20request',
        email: {
            address: 'support@incyclist.com',
            subject: 'Incyclist support request',
            body: EMAIL_BODY,
            copyText: `To: support@incyclist.com\r\nSubject: Incyclist support request\r\n\r\n${EMAIL_BODY}`,
            copyLabel: 'Share details',
        },
    },
];

const common = {
    title: 'Support Incyclist',
    promise: 'Incyclist is free and stays free. There is no subscription and nothing to unlock.',
    note: 'Donating is entirely voluntary and changes nothing in the app. You can also help by answering questions in the Strava club or contributing on GitHub.',
    otherHelpLinks: [
        { id: 'strava' as const, label: 'Incyclist Strava Club', url: 'https://strava.com/clubs/1029407' },
        { id: 'github' as const, label: 'GitHub', url: 'https://github.com/incyclist' },
    ],
};

export const SUPPORT_DIRECT_PROPS: SupportSettingsPageDisplayProps = {
    appInfo,
    helpTitle: 'Need help?',
    helpLinks,
    donation: {
        ...common,
        mode: 'direct',
        fundsText: "If you'd like to help, donations pay for the server, app-store fees and code signing.",
        channels: [
            { id: 'paypal', label: 'PayPal', subLabel: 'one-time', url: 'https://www.paypal.com/paypalme/incyclist', primary: true },
            { id: 'github-sponsors', label: 'GitHub Sponsors', subLabel: 'one-time or monthly', url: 'https://github.com/sponsors/incyclist', primary: false },
        ],
    },
};

export const SUPPORT_WEBSITE_PROPS: SupportSettingsPageDisplayProps = {
    appInfo,
    helpTitle: 'Need help?',
    helpLinks,
    donation: {
        ...common,
        mode: 'website',
        channels: [],
        websiteLink: { label: 'Ways to support Incyclist', url: 'https://incyclist.com/#support', host: 'incyclist.com' },
    },
};
