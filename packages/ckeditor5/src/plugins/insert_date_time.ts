import { ButtonView, Plugin } from 'ckeditor5';
import dateTimeIcon from '../icons/date-time.svg?raw';

export default class InsertDateTimePlugin extends Plugin {
    init() {
        const editor = this.editor;

        editor.ui.componentFactory.add('dateTime', locale => {
            const view = new ButtonView( locale );

            view.set( {
                label: 'Date time',
                icon: dateTimeIcon,
                tooltip: true
            } );

            // enable only if the editor is not read only
            view.bind('isEnabled').to(editor, 'isReadOnly', isReadOnly => !isReadOnly);

            view.on('execute', () => {
                const editorEl = editor.editing.view.getDomRoot();
                const component = glob.getComponentByEl(editorEl);

                component.triggerCommand('insertDateTimeToText');
                editor.editing.view.focus();
            } );

            return view;
        });
    }
}