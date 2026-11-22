import { useRef } from 'react';
import {
    RankMap, StartNoticeInfo, orderOpenSensors, resolvedSummary, showOptionalDivider, splitDevices, startNotice,
} from './phasedStart';
import { StartContentInfo, StartDeviceInfo, StartPhase, StartReadyInfo } from './types';

export type PhasedStartModelInput = {
    devices: StartDeviceInfo[];
    phase: StartPhase | undefined;
    content: StartContentInfo | undefined;
    readyInfo: StartReadyInfo | undefined;
    /** phone: resolved items move into the footer note */
    collapseResolved: boolean;
};

export type PhasedStartModel = {
    controls: StartDeviceInfo[];
    sensors: StartDeviceInfo[];
    /** false when the content is resolved and listed in the footer note instead */
    showContentRow: boolean;
    notice: StartNoticeInfo | undefined;
    footerNote: string | undefined;
    showDivider: boolean;
};

/**
 * Everything the phased start overlay derives from its props: which rows are shown (and in which
 * order), the pinned notice, the footer summary. The sort ranks live as long as the overlay does,
 * so a row never moves down once it has been a problem.
 */
export const usePhasedStartModel = ({ devices, phase, content, readyInfo, collapseResolved }: PhasedStartModelInput): PhasedStartModel => {
    const refRanks = useRef<RankMap>(new Map());

    const split = splitDevices(devices);
    const controls = collapseResolved ? split.openControls : split.controls;
    const sensors = orderOpenSensors(collapseResolved ? split.openSensors : split.sensors, refRanks.current);

    const contentResolved = content?.state === 'ready';
    const showContentRow = !!content && !(collapseResolved && contentResolved);
    const blockingRows = controls.length + (showContentRow ? 1 : 0);

    return {
        controls,
        sensors,
        showContentRow,
        notice: phase === 'ready' ? startNotice(devices, readyInfo, refRanks.current) : undefined,
        footerNote: collapseResolved ? resolvedSummary(split.resolvedControls, content, split.resolvedSensors) : undefined,
        showDivider: showOptionalDivider(collapseResolved, phase, blockingRows, sensors.length),
    };
};
