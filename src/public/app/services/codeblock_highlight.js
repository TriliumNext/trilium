const highlight_codeblock = (editor, codeblock_node)=>{
        editor.model.change((writer)=> {
            let selection_pos = editor.model.document.selection.getLastPosition();
            const language = codeblock_node.getAttribute('language');
            let childs = [];
            codeblock_node.getChildren().forEach(node => childs.push(node));
            writer.remove(writer.createRangeIn(codeblock_node));
            childs.forEach(node =>{
                if(node.is("text") && !node.getAttribute("hljs-class")){
                    let highlightedHtml = hljs.highlight(node.data, { language: language }).value;
                    let dom = new DOMParser().parseFromString('<div>' + highlightedHtml + '</div>', "text/xml");
                    for (let child_node of dom.children[0].childNodes) {
                        // This is to avoid some weird issue when pasting multi-line string into code block.
                        // The linebreakers would be converted to softbreak (<br>) in code blocks. 
                        // When editing, it works well/
                        // when pasting, the <br> would be inserted but the original linebreaker would not be removed, result in extra empty lines.
                        // This may due to some event listener order issues. 
                        // To solve, manully trim linebreakers.
                        // 

                        let text_content = child_node.textContent;
                        if (text_content.endsWith("\r") || text_content.endsWith("\n")){
                            text_content = text_content.substring(0, text_content.length - 1);
                            // the position need to decrement... otherwise it would be invalid due to the trimming.
                            selection_pos.path[1]-=1;
                        }
                        if (child_node.nodeName === 'span') {
                            writer.appendText(text_content, {'hljs-class': child_node.className}, codeblock_node)
                        } else if (child_node.nodeName === '#text') {
                            writer.appendText(text_content, codeblock_node)
                        }
                    }
                }else{
                    writer.append(node, codeblock_node);
                }
            });
            writer.setSelection(selection_pos);
        })
    };

export function add_codeblock_highlight(editor){
    editor.model.schema.extend('$text', {
        allowAttributes: [ 'hljs-class' ]
    });

    editor.conversion.for('downcast')
        .attributeToElement( {
            model: {
                name: '$text',
                key: 'hljs-class'
            },
            view: ( modelAttr, { writer } ) => {
                return writer.createAttributeElement(
                    'span', {class: modelAttr, 'span-type': "hljs"}
                );
            }
        });
    
    editor.model.document.on('change:data', () => {
            let parent_node = editor.model.document.selection.getLastPosition().parent;
            if (parent_node.name==="codeBlock") {
                highlight_codeblock(editor, parent_node);
            }
    });
};

export function force_highlight_codeblocks(editor) {
    editor.model.document.getRoots().forEach(root=>{
        root.getChildren().forEach(node=>{
            if (node.name==="codeBlock") {
                highlight_codeblock(editor, node);
            }
        })
    });
}

