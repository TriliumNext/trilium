import type { OptionPages } from "../../content_widget";
import OptionsWidget from "../options_widget";

const TPL = `\
<div class="options-section">
    <h4>Related settings</h4>

    <nav class="related-settings use-tn-links">
        <li>Color scheme for code blocks in text notes</li>
        <li>Color scheme for code notes</li>
    </nav>

    <style>
        .related-settings {
            padding: 0;
            margin: 0;
            list-style-type: none;
        }
    </style>
</div>
`;

interface RelatedSettingsConfig {
    items: {
        title: string;
        targetPage: OptionPages;
    }[];
}

const RELATED_SETTINGS: Record<string, RelatedSettingsConfig> = {
    "_optionsAppearance": {
        items: [
            {
                title: "Color scheme for code blocks in text notes",
                targetPage: "_optionsTextNotes"
            },
            {
                title: "Color scheme for code notes",
                targetPage: "_optionsCodeNotes"
            }
        ]
    }
};

export default class RelatedSettings extends OptionsWidget {

    doRender() {
        this.$widget = $(TPL);

        const config = this.noteId && RELATED_SETTINGS[this.noteId];
        if (!config) {
            return;
        }

        const $relatedSettings = this.$widget.find(".related-settings");
        $relatedSettings.empty();
        for (const item of config.items) {
            const $item = $("<li>");
            const $link = $("<a>").text(item.title);

            $item.append($link);
            $link.attr("href", `#root/_hidden/_options/${item.targetPage}`);
            $relatedSettings.append($item);
        }
    }

    isEnabled() {
        return (!!this.noteId && this.noteId in RELATED_SETTINGS);
    }

}
