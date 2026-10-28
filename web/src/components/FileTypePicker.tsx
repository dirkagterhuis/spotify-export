import { FileTypeSchema, type FileType } from '../fileType'

type FileTypePickerProps = {
    value: FileType
    onChange: (fileType: FileType) => void
    disabled?: boolean
}

// Controlled: the parent owns the selected value; this component only renders it and reports changes.
export function FileTypePicker({ value, onChange, disabled = false }: FileTypePickerProps) {
    return (
        <fieldset className="file-type-picker" disabled={disabled}>
            <legend>
                Please select in which file format you would like to retrieve your playlists:
            </legend>
            <div className="centre">
                {FileTypeSchema.options.map((fileType) => (
                    <label key={fileType}>
                        <input
                            type="radio"
                            name="fileType"
                            value={fileType}
                            checked={value === fileType}
                            onChange={() => onChange(fileType)}
                        />
                        {fileType}
                    </label>
                ))}
            </div>
        </fieldset>
    )
}
