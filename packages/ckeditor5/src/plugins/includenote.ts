import { ButtonView, Command, Plugin, toWidget, Widget, type Editor, type Observable } from 'ckeditor5';
import noteIcon from '../icons/note.svg?raw';

export const COMMAND_NAME = 'insertIncludeNote';

export default class IncludeNote extends Plugin {
	static get requires() {
		return [ IncludeNoteEditing, IncludeNoteUI ];
	}
}

class IncludeNoteUI extends Plugin {
	init() {
		const editor = this.editor;
		const t = editor.t;

		// The "includeNote" button must be registered among the UI components of the editor
		// to be displayed in the toolbar.
		editor.ui.componentFactory.add( 'includeNote', locale => {
			// The state of the button will be bound to the widget command.
			const command = editor.commands.get( COMMAND_NAME );

			// The button will be an instance of ButtonView.
			const buttonView = new ButtonView( locale );

			buttonView.set( {
				// The t() function helps localize the editor. All strings enclosed in t() can be
				// translated and change when the language of the editor changes.
				label: t( 'Include note' ),
				icon: noteIcon,
				tooltip: true
			} );

			// Bind the state of the button to the command.
            if (command) {
                buttonView.bind( 'isOn', 'isEnabled' ).to( command as Observable & { value: boolean; } & { isEnabled: boolean; }, 'value', 'isEnabled' );
            }

			// Execute the command when the button is clicked (executed).
			this.listenTo( buttonView, 'execute', () => editor.execute( COMMAND_NAME ) );

			return buttonView;
		} );
	}
}

class IncludeNoteEditing extends Plugin {
	static get requires() {
		return [ Widget ];
	}

	init() {
		this._defineSchema();
		this._defineConverters();

		this.editor.commands.add( COMMAND_NAME, new InsertIncludeNoteCommand( this.editor ) );
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'includeNote', {
			// Behaves like a self-contained object (e.g. an image).
			isObject: true,

			allowAttributes: [ 'noteId', 'boxSize' ],

			// Allow in places where other blocks are allowed (e.g. directly in the root).
			allowWhere: '$block'
		} );
	}

	_defineConverters() {
		const editor = this.editor;
		const conversion = editor.conversion;

		// <includeNote> converters
		conversion.for( 'upcast' ).elementToElement( {
			model: ( viewElement, { writer: modelWriter } ) => {

				return modelWriter.createElement( 'includeNote', {
					noteId: viewElement.getAttribute( 'data-note-id' ),
					boxSize: viewElement.getAttribute( 'data-box-size' ),
				} );
			},
			view: {
				name: 'section',
				classes: 'include-note'
			}
		} );
		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'includeNote',
			view: ( modelElement, { writer: viewWriter } ) => {
				// it would make sense here to downcast to <iframe>, with this even HTML export can support note inclusion
				return viewWriter.createContainerElement( 'section', {
					class: 'include-note',
					'data-note-id': modelElement.getAttribute( 'noteId' ),
					'data-box-size': modelElement.getAttribute( 'boxSize' ),
				} );
			}
		} );
		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'includeNote',
			view: ( modelElement, { writer: viewWriter } ) => {

				const noteId = modelElement.getAttribute( 'noteId' ) as string;
				const boxSize = modelElement.getAttribute( 'boxSize' );

				const section = viewWriter.createContainerElement( 'section', {
					class: 'include-note box-size-' + boxSize,
					'data-note-id': noteId,
					'data-box-size': boxSize
				} );

				const includedNoteWrapper = viewWriter.createUIElement( 'div', {
					class: 'include-note-wrapper',
					"data-cke-ignore-events": true
				}, function( domDocument ) {
					const domElement = this.toDomElement( domDocument );

					const editorEl = editor.editing.view.getDomRoot();
					const component = glob.getComponentByEl<EditorComponent>( editorEl );

					component.loadIncludedNote( noteId, $( domElement ) );

					preventCKEditorHandling( domElement, editor );

					return domElement;
				} );

				viewWriter.insert( viewWriter.createPositionAt( section, 0 ), includedNoteWrapper );

				return toWidget( section, viewWriter, { label: 'include note widget' } );
			}
		} );
	}
}

class InsertIncludeNoteCommand extends Command {
	override execute() {
		const editorEl = this.editor.editing.view.getDomRoot();
		const component = glob.getComponentByEl(editorEl);

		component.triggerCommand('addIncludeNoteToText');
	}

	override refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
        const firstPosition = selection.getFirstPosition();
		const allowedIn = firstPosition && model.schema.findAllowedParent( firstPosition, 'includeNote' );

		this.isEnabled = allowedIn !== null;
	}
}

/**
 * Hack coming from https://github.com/ckeditor/ckeditor5/issues/4465
 * Source issue: https://github.com/zadam/trilium/issues/1117
 */
function preventCKEditorHandling( domElement: HTMLElement, editor: Editor ) {
	// Prevent the editor from listening on below events in order to stop rendering selection.

	// commenting out click events to allow link click handler to still work
	//domElement.addEventListener( 'click', stopEventPropagationAndHackRendererFocus, { capture: true } );
	domElement.addEventListener( 'mousedown', stopEventPropagationAndHackRendererFocus, { capture: true } );
	domElement.addEventListener( 'focus', stopEventPropagationAndHackRendererFocus, { capture: true } );

	// Prevents TAB handling or other editor keys listeners which might be executed on editors selection.
	domElement.addEventListener( 'keydown', stopEventPropagationAndHackRendererFocus, { capture: true } );

	function stopEventPropagationAndHackRendererFocus( evt: Event ) {
		evt.stopPropagation();
		// This prevents rendering changed view selection thus preventing to changing DOM selection while inside a widget.
        //@ts-expect-error: We are accessing a private field.
		editor.editing.view._renderer.isFocused = false;
	}
}
