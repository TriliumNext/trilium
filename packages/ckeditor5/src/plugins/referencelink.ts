import { Command, Element, LinkEditing, Plugin, toWidget, viewToModelPositionOutsideModelElement, Widget } from "ckeditor5";

export default class ReferenceLink extends Plugin {
	static get requires() {
		return [ ReferenceLinkEditing ];
	}
}

class ReferenceLinkCommand extends Command {

	override execute({ href }: { href: string }) {
		if (!href?.trim()) {
			return;
		}

		const editor = this.editor;

		// make sure the referenced note is in cache before adding the reference element
		glob.getReferenceLinkTitle(href).then(() => {
			editor.model.change(writer => {
				const placeholder = writer.createElement('reference', {href});

				// ... and insert it into the document.
				editor.model.insertContent(placeholder);

				// Put the selection on the inserted element.
				writer.setSelection(placeholder, 'after');
			});
		});
	}

	override refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
        this.isEnabled = selection.focus !== null && model.schema.checkChild(selection.focus.parent as Element, 'reference');
	}
}

class ReferenceLinkEditing extends Plugin {
	static get requires() {
		return [ Widget, LinkEditing ];
	}

	init() {
		this._defineSchema();
		this._defineConverters();

		this.editor.commands.add( 'referenceLink', new ReferenceLinkCommand( this.editor ) );

		this.editor.editing.mapper.on(
			'viewToModelPosition',
			viewToModelPositionOutsideModelElement( this.editor.model,
					viewElement => viewElement.hasClass( 'reference-link' ) )
		);

        this.editor.plugins.get("LinkEditing")._registerLinkOpener(() => {
            // Prevent reference links from being opened in a new browser tab.
            // This works even if the link is not a reference link, since it is handled by Trilium.
            return true;
        });
	}

	_defineSchema() {
		const schema = this.editor.model.schema;

		schema.register( 'reference', {
			// Allow wherever a text is allowed:
			allowWhere: '$text',

			isInline: true,

			// The inline widget is self-contained, so it cannot be split by the caret, and it can be selected:
			isObject: true,

			allowAttributes: [ 'href', 'uploadId', 'uploadStatus' ]
		} );
	}

	_defineConverters() {
		const editor = this.editor;
		const conversion = editor.conversion;

		conversion.for( 'upcast' ).elementToElement( {
			view: {
				name: 'a',
				classes: [ 'reference-link' ]
			},
			model: ( viewElement, { writer: modelWriter } ) => {
				const href = viewElement.getAttribute('href');

				return modelWriter.createElement( 'reference', { href } );
			}
		} );

		conversion.for( 'editingDowncast' ).elementToElement( {
			model: 'reference',
			view: ( modelItem, { writer: viewWriter } ) => {
				const href = modelItem.getAttribute('href') as string;

				const referenceLinkView = viewWriter.createContainerElement( 'a', {
						href,
						class: 'reference-link'
					},
					{
						renderUnsafeAttributes: [ 'href' ]
					} );

				const noteTitleView = viewWriter.createUIElement('span', {}, function( domDocument ) {
					const domElement = this.toDomElement( domDocument );

					const editorEl = editor.editing.view.getDomRoot();
					const component = glob.getComponentByEl<EditorComponent>(editorEl);

					component.loadReferenceLinkTitle($(domElement), href);

					return domElement;
				});

				viewWriter.insert( viewWriter.createPositionAt( referenceLinkView, 0 ), noteTitleView );

				// Enable widget handling on a reference element inside the editing view.
				return toWidget( referenceLinkView, viewWriter );
			}
		} );

		conversion.for( 'dataDowncast' ).elementToElement( {
			model: 'reference',
			view: ( modelItem, { writer: viewWriter } ) => {
				const href = modelItem.getAttribute('href') as string;

				const referenceLinkView = viewWriter.createContainerElement( 'a', {
					href: href,
					class: 'reference-link'
				} );

				const title = glob.getReferenceLinkTitleSync(href);

				const innerText = viewWriter.createText(title);
				viewWriter.insert(viewWriter.createPositionAt(referenceLinkView, 0), innerText);

				return referenceLinkView;
			}
		} );
	}
}
