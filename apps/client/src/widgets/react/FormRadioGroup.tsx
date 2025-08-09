interface FormRadioProps {
    name: string;
    currentValue?: string;
    values: {
        value: string;
        label: string;
    }[];
    onChange(newValue: string): void;
}

export default function FormRadioGroup({ name, values, currentValue, onChange }: FormRadioProps) {
    return (
        <>
            {(values || []).map(({ value, label }) => (
                <div className="form-check">
                    <label className="form-check-label tn-radio">
                        <input
                            className="form-check-input"
                            type="radio"
                            name={name}
                            value={value}
                            checked={value === currentValue}
                        onChange={e => onChange((e.target as HTMLInputElement).value)} />
                        {label}
                    </label>
                </div>
            ))}
        </>
    );
}