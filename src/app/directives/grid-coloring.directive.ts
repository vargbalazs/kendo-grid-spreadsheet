import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[gridColoring]',
})
export class GridColoringDirective implements OnInit {
  private rowElements: Element[] = [];

  constructor(private renderer: Renderer2, private el: ElementRef) {}

  ngOnInit(): void {
    //this.renderer.addClass(ariaRoot, 'test');

    const ariaRoot = this.getHtmlElement(
      (<HTMLElement>this.el.nativeElement).children,
      'k-grid-aria-root'
    )?.children[0];
    const gridContainer = this.getHtmlElement(
      ariaRoot!.children,
      'k-grid-container'
    );

    console.log(ariaRoot!.children);
    console.log(gridContainer);
  }

  getHtmlElement(
    elements: HTMLCollection,
    className: string
  ): Element | undefined {
    for (let i = 0; i < elements.length; i++) {
      console.log(elements[i].classList);
      if (elements[i].classList.contains(className)) return elements[i];
    }
    return;
  }
}
