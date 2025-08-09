interface FormFileUploadProps {
    onChange: (files: FileList | null) => void;
    multiple?: boolean;
}

export default function FormFileUpload({ onChange, multiple }: FormFileUploadProps) {
    return (
        <label class="tn-file-input tn-input-field">
            <input type="file" class="form-control-file" multiple={multiple}
                onChange={e => onChange((e.target as HTMLInputElement).files)} />
        </label>
    )
}