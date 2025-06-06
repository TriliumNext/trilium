import OptionsWidget from "../options_widget.js";

const TPL = `
<div class="options-section">
    <h4>Custom Date/Time Format (Alt+T)</h4>

    <p>
        Define a custom format for the date and time inserted using the Alt+T shortcut.
        Uses <a href="https://day.js.org/docs/en/display/format" target="_blank" rel="noopener noreferrer">Day.js format tokens</a>.
        Refer to the Day.js documentation for valid tokens.
    </p>
<p>
    <strong>Important:</strong> If you provide a format string that Day.js does not recognize
    (e.g., mostly plain text without valid <a href="https://day.js.org/docs/en/display/format" target="_blank" rel="noopener noreferrer">Day.js tokens</a>),
    the text you typed might be inserted literally. If the format string is left empty,
    or if Day.js encounters a critical internal error with your format,
    a default format (e.g., YYYY-MM-DD HH:mm) will be used.
</p>

    <div class="form-group">
        <label for="customDateTimeFormatInput" style="margin-right: 10px;">Format String:</label>
        <input type="text" id="customDateTimeFormatInput" class="form-control custom-datetime-format-input" placeholder="e.g., DD/MM/YYYY HH:mm:ss or dddd, MMMM D" style="width: 300px; display: inline-block;">
    </div>
    <p style="margin-top: 5px;">
        <em>Examples of valid Day.js formats:</em>
        <code>YYYY-MM-DD HH:mm</code> (Default-like),
        <code>DD.MM.YYYY</code>,
        <code>MMMM D, YYYY h:mm A</code>,
        <code>[Today is] dddd</code>
    </p>
</div>
`;

export default class DateTimeFormatOptions extends OptionsWidget {
    doRender() {
        this.$widget = $(TPL);
        this.$formatInput = this.$widget.find(
            "input.custom-datetime-format-input"
        );

        //listen to input
        this.$formatInput.on("input", () => {
            const formatString = this.$formatInput.val();

            this.updateOption("customDateTimeFormatString", formatString);
        });

        return this.$widget; //render method to return the widget
    }

    async optionsLoaded(options) {
        const currentFormat = options.customDateTimeFormatString || "";


        if (this.$formatInput) {
            this.$formatInput.val(currentFormat);
        } else {

            console.warn(
                "DateTimeFormatOptions: $formatInput not initialized when optionsLoaded was called. Attempting to find again."
            );
            const inputField = this.$widget.find(
                "input.custom-datetime-format-input"
            );
            if (inputField.length) {
                this.$formatInput = inputField;
                this.$formatInput.val(currentFormat);
            } else {
                console.error(
                    "DateTimeFormatOptions: Could not find format input field in optionsLoaded."
                );
            }
        }
    }
}
