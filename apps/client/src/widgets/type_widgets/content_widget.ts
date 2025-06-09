import TypeWidget from "./type_widget.js";
import ElectronIntegrationOptions from "./options/appearance/electron_integration.js";
import ThemeOptions from "./options/appearance/theme.js";
import FontsOptions from "./options/appearance/fonts.js";
import MaxContentWidthOptions from "./options/appearance/max_content_width.js";
import KeyboardShortcutsOptions from "./options/shortcuts.js";
import HeadingStyleOptions from "./options/text_notes/heading_style.js";
import TableOfContentsOptions from "./options/text_notes/table_of_contents.js";
import HighlightsListOptions from "./options/text_notes/highlights_list.js";
import TextAutoReadOnlySizeOptions from "./options/text_notes/text_auto_read_only_size.js";
import DateTimeFormatOptions from "./options/text_notes/date_time_format.js";
import CodeEditorOptions from "./options/code_notes/code_editor.js";
import CodeAutoReadOnlySizeOptions from "./options/code_notes/code_auto_read_only_size.js";
import CodeMimeTypesOptions from "./options/code_notes/code_mime_types.js";
import ImageOptions from "./options/images/images.js";
import SpellcheckOptions from "./options/spellcheck.js";
import PasswordOptions from "./options/password/password.js";
import ProtectedSessionTimeoutOptions from "./options/password/protected_session_timeout.js";
import EtapiOptions from "./options/etapi.js";
import BackupOptions from "./options/backup.js";
import SyncOptions from "./options/sync.js";
import SearchEngineOptions from "./options/other/search_engine.js";
import TrayOptions from "./options/other/tray.js";
import NoteErasureTimeoutOptions from "./options/other/note_erasure_timeout.js";
import RevisionsSnapshotIntervalOptions from "./options/other/revisions_snapshot_interval.js";
import RevisionSnapshotsLimitOptions from "./options/other/revision_snapshots_limit.js";
import NetworkConnectionsOptions from "./options/other/network_connections.js";
import HtmlImportTagsOptions from "./options/other/html_import_tags.js";
import AdvancedSyncOptions from "./options/advanced/sync.js";
import DatabaseIntegrityCheckOptions from "./options/advanced/database_integrity_check.js";
import VacuumDatabaseOptions from "./options/advanced/vacuum_database.js";
import DatabaseAnonymizationOptions from "./options/advanced/database_anonymization.js";
import BackendLogWidget from "./content/backend_log.js";
import AttachmentErasureTimeoutOptions from "./options/other/attachment_erasure_timeout.js";
import RibbonOptions from "./options/appearance/ribbon.js";
import MultiFactorAuthenticationOptions from './options/multi_factor_authentication.js';
import LocalizationOptions from "./options/i18n/i18n.js";
import CodeBlockOptions from "./options/text_notes/code_block.js";
import EditorOptions from "./options/text_notes/editor.js";
import ShareSettingsOptions from "./options/other/share_settings.js";
import AiSettingsOptions from "./options/ai_settings.js";
import type FNote from "../../entities/fnote.js";
import type NoteContextAwareWidget from "../note_context_aware_widget.js";
import { t } from "../../services/i18n.js";
import LanguageOptions from "./options/i18n/language.js";
import type BasicWidget from "../basic_widget.js";
import CodeTheme from "./options/code_notes/code_theme.js";
import RelatedSettings from "./options/related_settings.js";

const TPL = /*html*/`<div class="note-detail-content-widget note-detail-printable">
    <style>
        .type-contentWidget .note-detail {
            height: 100%;
        }

        .note-detail-content-widget {
            height: 100%;
        }

        .note-detail-content-widget-content {
            padding: 15px;
            height: 100%;
        }

        .note-detail.full-height .note-detail-content-widget-content {
            padding: 0;
        }
    </style>

    <div class="note-detail-content-widget-content"></div>
</div>`;

export type OptionPages = "_optionsAppearance" | "_optionsShortcuts" | "_optionsTextNotes" | "_optionsCodeNotes" | "_optionsImages" | "_optionsSpellcheck" | "_optionsPassword" | "_optionsMFA" | "_optionsEtapi" | "_optionsBackup" | "_optionsSync" | "_optionsAi" | "_optionsOther" | "_optionsLocalization" | "_optionsAdvanced";

const CONTENT_WIDGETS: Record<OptionPages | "_backendLog", (typeof NoteContextAwareWidget)[]> = {
    _optionsAppearance: [
        ThemeOptions,
        FontsOptions,
        ElectronIntegrationOptions,
        MaxContentWidthOptions,
        RibbonOptions
    ],
    _optionsShortcuts: [
        KeyboardShortcutsOptions
    ],
    _optionsTextNotes: [
        EditorOptions,
        HeadingStyleOptions,
        CodeBlockOptions,
        TableOfContentsOptions,
        HighlightsListOptions,
        TextAutoReadOnlySizeOptions,
        DateTimeFormatOptions
    ],
    _optionsCodeNotes: [
        CodeEditorOptions,
        CodeTheme,
        CodeMimeTypesOptions,
        CodeAutoReadOnlySizeOptions
    ],
    _optionsImages: [
        ImageOptions
    ],
    _optionsSpellcheck: [
        SpellcheckOptions
    ],
    _optionsPassword: [
        PasswordOptions,
        ProtectedSessionTimeoutOptions
    ],
    _optionsMFA: [MultiFactorAuthenticationOptions],
    _optionsEtapi: [
        EtapiOptions
    ],
    _optionsBackup: [
        BackupOptions
    ],
    _optionsSync: [
        SyncOptions
    ],
    _optionsAi: [AiSettingsOptions],
    _optionsOther: [
        SearchEngineOptions,
        TrayOptions,
        NoteErasureTimeoutOptions,
        AttachmentErasureTimeoutOptions,
        RevisionsSnapshotIntervalOptions,
        RevisionSnapshotsLimitOptions,
        HtmlImportTagsOptions,
        ShareSettingsOptions,
        NetworkConnectionsOptions
    ],
    _optionsLocalization: [
        LocalizationOptions,
        LanguageOptions
    ],
    _optionsAdvanced: [
        AdvancedSyncOptions,
        DatabaseIntegrityCheckOptions,
        DatabaseAnonymizationOptions,
        VacuumDatabaseOptions
    ],
    _backendLog: [
        BackendLogWidget
    ]
};

/**
 * Type widget that displays one or more widgets based on the type of note, generally used for options and other interactive notes such as the backend log.
 *
 * One important aspect is that, like its parent {@link TypeWidget}, the content widgets don't receive all events by default and they must be manually added
 * to the propagation list in {@link TypeWidget.handleEventInChildren}.
 */
export default class ContentWidgetTypeWidget extends TypeWidget {
    private $content!: JQuery<HTMLElement>;
    private widget?: BasicWidget;

    static getType() {
        return "contentWidget";
    }

    doRender() {
        this.$widget = $(TPL);
        this.$content = this.$widget.find(".note-detail-content-widget-content");

        super.doRender();
    }

    async doRefresh(note: FNote) {
        this.$content.empty();
        this.children = [];

        const contentWidgets = [
            ...((CONTENT_WIDGETS as Record<string, typeof NoteContextAwareWidget[]>)[note.noteId]),
            RelatedSettings
        ];
        this.$content.toggleClass("options", note.noteId.startsWith("_options"));

        if (contentWidgets) {
            for (const clazz of contentWidgets) {
                const widget = new clazz();

                if (this.noteContext) {
                    await widget.handleEvent("setNoteContext", { noteContext: this.noteContext });
                }
                this.child(widget);

                this.$content.append(widget.render());
                this.widget = widget;
                await widget.refresh();
            }
        } else {
            this.$content.append(t("content_widget.unknown_widget", { id: note.noteId }));
        }
    }

}
