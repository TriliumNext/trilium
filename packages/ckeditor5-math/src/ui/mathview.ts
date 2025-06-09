import { View, type Locale } from 'ckeditor5';
import type { KatexOptions } from '../typings-external.js';
import { renderEquation } from '../utils.js';

export default class MathView extends View {
	public declare value: string;
	public declare display: boolean;
	public previewUid: string;
	public previewClassName: Array<string>;
	public katexRenderOptions: KatexOptions;
	public engine:
		| 'mathjax'
		| 'katex'
		| ( ( equation: string, element: HTMLElement, display: boolean ) => void );
	public lazyLoad: undefined | ( () => Promise<void> );

	constructor(
		engine:
			| 'mathjax'
			| 'katex'
			| ( (
				equation: string,
				element: HTMLElement,
				display: boolean,
			) => void ),
		lazyLoad: undefined | ( () => Promise<void> ),
		locale: Locale,
		previewUid: string,
		previewClassName: Array<string>,
		katexRenderOptions: KatexOptions
	) {
		super( locale );

		this.engine = engine;
		this.lazyLoad = lazyLoad;
		this.previewUid = previewUid;
		this.katexRenderOptions = katexRenderOptions;
		this.previewClassName = previewClassName;

		this.set( 'value', '' );
		this.set( 'display', false );

		this.on( 'change', () => {
			if ( this.isRendered ) {
				this.updateMath();
			}
		} );

		this.setTemplate( {
			tag: 'div',
			attributes: {
				class: [ 'ck', 'ck-math-preview', 'ck-reset_all-excluded' ]
			}
		} );
	}

	public updateMath(): void {
		if ( this.element ) {
			void renderEquation(
				this.value,
				this.element,
				this.engine,
				this.lazyLoad,
				this.display,
				true,
				this.previewUid,
				this.previewClassName,
				this.katexRenderOptions
			);
		}
	}

	public override render(): void {
		super.render();
		this.updateMath();
	}
}
