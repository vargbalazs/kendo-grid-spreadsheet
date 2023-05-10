import {
  OnInit,
  Input,
  OnDestroy,
  Directive,
  ElementRef,
  Renderer2,
} from '@angular/core';

import { GridComponent } from '@progress/kendo-angular-grid';

@Directive({
  selector: '[changeCellFocusWithTab]',
})
export class ChangeCellFocusWithTabDirective implements OnInit, OnDestroy {
  @Input() wrap = true;

  private unsubKeydown!: () => void;

  constructor(
    private grid: GridComponent,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.unsubKeydown = this.renderer.listen(
      this.el.nativeElement,
      'keydown',
      (e) => this.onKeydown(e)
    );
  }

  ngOnDestroy(): void {
    this.unsubKeydown();
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Tab') {
      // Handle just tabs
      return;
    }

    let activeRow = this.grid.activeRow;
    if (!activeRow || !activeRow.dataItem) {
      // Not on an editable row
      return;
    }

    if (this.grid.isEditingCell() && !this.grid.closeCell()) {
      // Content validation failed, keep focus in cell
      e.preventDefault();
      return;
    }

    const nav = e.shiftKey
      ? this.grid.focusPrevCell(this.wrap)
      : this.grid.focusNextCell(this.wrap);

    if (!nav) {
      // No next cell to navigate to
      return;
    }

    // Prevent the focus from moving to the next element
    e.preventDefault();
  }
}
