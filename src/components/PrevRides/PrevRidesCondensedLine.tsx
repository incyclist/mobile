import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, textSizes } from '../../theme';
import { PrevRidesRowProps } from './types';

export interface PrevRidesCondensedLineProps {
    /** The (at most 2) rows the service returns at `visibleRows == 2` — current rider + nearest
     *  rival. Not the full field: composing this line from more than two rows is not this
     *  component's job. */
    rows: PrevRidesRowProps[];
}

/**
 * The phone corner slot's condensed content: "current position + gap to nearest rival" as one
 * line, composed from the two rows fetched at `visibleRows == 2` — this component composes the
 * line itself rather than expecting the service to hand back pre-composed text.
 */
export const PrevRidesCondensedLine = ({ rows }: PrevRidesCondensedLineProps) => {
    const current = rows.find((row) => row.isCurrent);
    const rival = rows.find((row) => !row.isCurrent);

    if (!current) {
        return null;
    }

    const text = rival
        ? `#${current.position} · ${rival.timeGap} to #${rival.position}`
        : `#${current.position}`;

    return (
        <Text style={styles.text} numberOfLines={1} testID="prev-rides-condensed-line">
            {text}
        </Text>
    );
};

const styles = StyleSheet.create({
    text: {
        color: colors.text,
        fontSize: textSizes.tinyText,
        fontWeight: '700',
    },
});
