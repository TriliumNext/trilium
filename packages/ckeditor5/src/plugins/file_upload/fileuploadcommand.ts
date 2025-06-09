import { Command, FileRepository, Model, type NodeAttributes, type Writer } from "ckeditor5";

interface FileUploadOpts {
    file: File[];
}

export default class FileUploadCommand extends Command {
	override refresh() {
		this.isEnabled = true;
	}

	/**
	 * Executes the command.
	 *
	 * @fires execute
	 * @param {Object} options Options for the executed command.
	 * @param {File|Array.<File>} options.file The file or an array of files to upload.
	 */
	override execute( options: FileUploadOpts ) {
		const editor = this.editor;
		const model = editor.model;

		const fileRepository = editor.plugins.get( FileRepository );

		model.change( writer => {
			const filesToUpload = options.file;
			for ( const file of filesToUpload ) {
				uploadFile( writer, model, fileRepository, file );
			}
		} );
	}
}

/**
 * 	Handles uploading single file.
 */
function uploadFile( writer: Writer, model: Model, fileRepository: FileRepository, file: File ) {
	const loader = fileRepository.createLoader( file );

	// Do not throw when upload adapter is not set. FileRepository will log an error anyway.
	if ( !loader ) {
		return;
	}

	insertFileLink( writer, model, { href: '', uploadId: loader.id }, file );
}

function insertFileLink( writer: Writer, model: Model, attributes: NodeAttributes = {}, file: File ) {
	const placeholder = writer.createElement( 'reference', attributes );
	model.insertContent( placeholder, model.document.selection );
	writer.insertText( ' ', placeholder, 'after' );
}
