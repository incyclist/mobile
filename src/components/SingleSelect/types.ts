import { SelectOption } from 'incyclist-services';

export type SingleSelectProps = {
    label?: string;
    labelWidth?: number;
    options: SelectOption<any>[];
    selected?: any;
    onValueChange: (value: any) => void;
};