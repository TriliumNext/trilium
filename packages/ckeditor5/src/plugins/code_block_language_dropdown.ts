import { Editor, CodeBlock, Plugin, type ListDropdownButtonDefinition, Collection, type CodeBlockCommand, ViewModel, createDropdown, addListToDropdown, DropdownButtonView } from "ckeditor5";

/**
 * Toolbar item which displays the list of languages in a dropdown, with the text visible (similar to the headings switcher), as opposed to the default split button implementation.
 */
export default class CodeBlockLanguageDropdown extends Plugin {

    static get requires() {
        return [ CodeBlock ];
    }

    public init() {
        const editor = this.editor;
        const componentFactory = editor.ui.componentFactory;

        const normalizedLanguageDefs = this._getNormalizedAndLocalizedLanguageDefinitions(editor);
        const itemDefinitions = this._getLanguageListItemDefinitions(normalizedLanguageDefs);
        const command: CodeBlockCommand = editor.commands.get( 'codeBlock' )!;

        componentFactory.add("codeBlockDropdown", locale => {
            const dropdownView = createDropdown(this.editor.locale, DropdownButtonView);
            dropdownView.buttonView.set({
                withText: true
            });
            dropdownView.bind( 'isEnabled' ).to( command, 'value', value => !!value );
            dropdownView.buttonView.bind( 'label' ).to( command, 'value', (value) => {
                const itemDefinition = normalizedLanguageDefs.find((def) => def.language === value);
                return itemDefinition?.label;
            });
            dropdownView.on( 'execute', evt => {
                editor.execute( 'codeBlock', {
                    language: ( evt.source as any )._codeBlockLanguage,
                    forceValue: true
                });

                editor.editing.view.focus();
            });
            addListToDropdown(dropdownView, itemDefinitions);
            return dropdownView;
        });
    }

    // Adapted from packages/ckeditor5-code-block/src/codeblockui.ts
    private _getLanguageListItemDefinitions(
		normalizedLanguageDefs: Array<CodeBlockLanguageDefinition>
	): Collection<ListDropdownButtonDefinition> {
		const editor = this.editor;
		const command: CodeBlockCommand = editor.commands.get( 'codeBlock' )!;
		const itemDefinitions = new Collection<ListDropdownButtonDefinition>();

		for ( const languageDef of normalizedLanguageDefs ) {
			const definition: ListDropdownButtonDefinition = {
				type: 'button',
				model: new ViewModel( {
					_codeBlockLanguage: languageDef.language,
					label: languageDef.label,
					role: 'menuitemradio',
					withText: true
				} )
			};

			definition.model.bind( 'isOn' ).to( command, 'value', value => {
				return value === definition.model._codeBlockLanguage;
			} );

			itemDefinitions.add( definition );
		}

		return itemDefinitions;
	}

    // Adapted from packages/ckeditor5-code-block/src/utils.ts
    private _getNormalizedAndLocalizedLanguageDefinitions(editor: Editor) {
        const languageDefs = editor.config.get( 'codeBlock.languages' ) as Array<CodeBlockLanguageDefinition>;
        for ( const def of languageDefs ) {
            if ( def.class === undefined ) {
                def.class = `language-${ def.language }`;
            }
        }
        return languageDefs;
    }

}

interface CodeBlockLanguageDefinition {

	/**
	 * The name of the language that will be stored in the model attribute. Also, when `class`
	 * is not specified, it will be used to create the CSS class associated with the language (prefixed by "language-").
	 */
	language: string;

	/**
	 * The human–readable label associated with the language and displayed in the UI.
	 */
	label: string;

	/**
	 * The CSS class associated with the language. When not specified the `language`
 	 * property is used to create a class prefixed by "language-".
	 */
	class?: string;
}
