/**
 * https://github.com/TriliumNext/Notes/issues/1002
 */

import { Command, DocumentSelection, Element, Node, Plugin, Range } from 'ckeditor5';
export default class MoveBlockUpDownPlugin extends Plugin {

    init() {
        const editor = this.editor;

        editor.commands.add('moveBlockUp', new MoveBlockUpCommand(editor));
        editor.commands.add('moveBlockDown', new MoveBlockDownCommand(editor));

		// Use native DOM capturing to intercept Ctrl/Alt + ↑/↓, 
		// as plugin-level keystroke handling may fail when the selection is near an object.
        this.bindMoveBlockShortcuts(editor);
    }
	
	bindMoveBlockShortcuts(editor: any) {
		editor.editing.view.once('render', () => {
			const domRoot = editor.editing.view.getDomRoot();
			if (!domRoot) return;

			const handleKeydown = (e: KeyboardEvent) => {
				const keyMap = {
					ArrowUp: 'moveBlockUp',
					ArrowDown: 'moveBlockDown'
				};

				const command = keyMap[e.key];
				const isCtrl = e.ctrlKey || e.metaKey;
				const hasModifier = (isCtrl || e.altKey) && !(isCtrl && e.altKey);

				if (command && hasModifier) {
					e.preventDefault();
					e.stopImmediatePropagation();
					editor.execute(command);
				}
			};

			domRoot.addEventListener('keydown', handleKeydown, { capture: true });
		});
	}

}

abstract class MoveBlockUpDownCommand extends Command {

	abstract getSibling(selectedBlock: Element): Node | null;
    abstract get offset(): "before" | "after";

	override execute() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedBlocks = this.getSelectedBlocks(selection);
		const isEnabled = selectedBlocks.length > 0
			&& selectedBlocks.every(block => !!this.getSibling(block));

		if (!isEnabled) {
			return;
		}
		
		const movingBlocks = this.offset === 'before'
            ? selectedBlocks
            : [...selectedBlocks].reverse();

        // Store selection offsets
		const firstBlock = selectedBlocks[0];
		const lastBlock = selectedBlocks[selectedBlocks.length - 1];
		const startOffset = model.document.selection.getFirstPosition()?.offset ?? 0;
		const endOffset = model.document.selection.getLastPosition()?.offset ?? 0;

		model.change((writer) => {
			// Move blocks
			for (const block of movingBlocks) {
				const sibling = this.getSibling(block);
				if (sibling) {
					const range = model.createRangeOn(block);
					writer.move(range, sibling, this.offset);
				}
			}

			// Restore selection
			let range: Range;
			const maxStart = firstBlock.maxOffset ?? startOffset;
			const maxEnd = lastBlock.maxOffset ?? endOffset;
			// If original offsets valid within bounds, restore partial selection
			if (startOffset <= maxStart && endOffset <= maxEnd) {
				const clampedStart = Math.min(startOffset, maxStart);
				const clampedEnd = Math.min(endOffset, maxEnd);
				range = writer.createRange(
					writer.createPositionAt(firstBlock, clampedStart),
					writer.createPositionAt(lastBlock, clampedEnd)
				);
			} else { // Fallback: select entire moved blocks (handles tables)
				range = writer.createRange(
					writer.createPositionBefore(firstBlock),
					writer.createPositionAfter(lastBlock)
				);
			}
			writer.setSelection(range);
			this.editor.editing.view.focus();

			this.scrollToSelection();
		});
    }
	
	getSelectedBlocks(selection: DocumentSelection) {
		const blocks = [...selection.getSelectedBlocks()];
		const resolved: Element[] = [];

		// Selects elements (such as Mermaid) when there are no blocks
		if (!blocks.length) {
			const selectedObj = selection.getSelectedElement();
			if (selectedObj) {
				return [selectedObj];
			}
		}

		for (const block of blocks) {
			let el: Element = block;
			// Traverse up until the parent is the root ($root) or there is no parent
			while (el.parent && el.parent.name !== '$root') {
				el = el.parent as Element;
			}
			resolved.push(el);
		}

		// Deduplicate adjacent duplicates (e.g., nested selections resolving to same block)
		return resolved.filter((blk, idx) => idx === 0 || blk !== resolved[idx - 1]);
	}
	
	scrollToSelection() {
		// Ensure scroll happens in sync with DOM updates
		requestAnimationFrame(() => {
			this.editor.editing.view.scrollToTheSelection();
		});
	};
}

class MoveBlockUpCommand extends MoveBlockUpDownCommand {

    getSibling(selectedBlock: Element) {
        return selectedBlock.previousSibling;
    }

    get offset() {
        return "before" as const;
    }

}

class MoveBlockDownCommand extends MoveBlockUpDownCommand {

	/** @override */
	getSibling(selectedBlock: Element) {
		return selectedBlock.nextSibling;
	}

	/** @override */
	get offset() {
		return "after" as const;
	}
}
