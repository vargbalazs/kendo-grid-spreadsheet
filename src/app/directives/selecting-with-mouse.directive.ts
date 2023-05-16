import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CellSelectionItem } from '@progress/kendo-angular-grid';

@Directive({
  selector: '[selectingWithMouse]',
})
export class SelectingWithMouseDirective {
  @Input() selectedCells: CellSelectionItem[] = [];

  @Output() selectedCellsChange = new EventEmitter<CellSelectionItem[]>();

  private isMouseDown = false;
  private lastSelectedCell!: CellSelectionItem;
  private rowIndex = -1;
  private colIndex = -1;

  @HostListener('mousedown', ['$event'])
  onMouseDown(e: any) {
    this.selectedCells = [];
    this.isMouseDown = true;
    this.updateState();
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(e: any) {
    this.isMouseDown = false;
  }

  // this event handler is needed, if we move out of the table
  // in this case we set everything to default
  @HostListener('mouseleave', ['$event'])
  onMouseLeave(e: MouseEvent) {
    const target = (<HTMLElement>e.target).parentElement;
    if (
      this.isMouseDown &&
      !target?.hasAttribute('ng-reflect-data-row-index')
    ) {
      this.isMouseDown = false;
      this.selectedCells = [];
      this.updateState();
    }
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    if (this.isMouseDown) {
      e.preventDefault();
      const target = (<HTMLElement>e.target).parentElement;
      // if we move on a data cell
      if (
        target?.hasAttribute('ng-reflect-data-row-index') &&
        target?.hasAttribute('ng-reflect-col-index')
      ) {
        const dataRowIndex = +target.attributes.getNamedItem(
          'ng-reflect-data-row-index'
        )!.value;
        const columnIndex = +target.attributes.getNamedItem(
          'ng-reflect-col-index'
        )!.value;
        // store the first selected cell
        if (this.selectedCells.length === 0)
          this.selectedCells.push({
            itemKey: dataRowIndex,
            columnKey: columnIndex,
          });
        // store the last selected cell
        this.lastSelectedCell = {
          itemKey: dataRowIndex,
          columnKey: columnIndex,
        };
        // mark the cells as selected and update the state only if we move to another cell
        if (
          this.rowIndex != this.lastSelectedCell.itemKey ||
          this.colIndex != this.lastSelectedCell.columnKey
        ) {
          this.markCellsAsSelected(this.lastSelectedCell);
          // update only, if we are in another cell
          if (this.selectedCells.length >= 2) this.updateState();
          this.rowIndex = dataRowIndex;
          this.colIndex = columnIndex;
        }
      }
    }
  }

  // marks the cells as selected in every direction
  markCellsAsSelected(lastSelectedCell: CellSelectionItem) {
    const firstCell = this.getFirstSelectedCell();
    const rowOffset = Math.abs(
      firstCell.itemKey - this.lastSelectedCell.itemKey
    );
    const columnOffset = Math.abs(
      firstCell.columnKey - this.lastSelectedCell.columnKey
    );
    const verticalDirection =
      firstCell.itemKey < this.lastSelectedCell.itemKey ? 1 : -1;
    const horizontalDirection =
      firstCell.columnKey < this.lastSelectedCell.columnKey ? 1 : -1;
    // we always start with the first selected cell, because we can not only add, but remove too
    this.selectedCells = [firstCell];
    for (let i = 0; i <= columnOffset; i++) {
      for (let j = 0; j <= rowOffset; j++) {
        if (
          !this.cellIsSelected({
            itemKey: firstCell.itemKey + j * verticalDirection,
            columnKey: firstCell.columnKey + i * horizontalDirection,
          })
        ) {
          this.selectedCells = [
            ...this.selectedCells,
            {
              itemKey: firstCell.itemKey + j * verticalDirection,
              columnKey: firstCell.columnKey + i * horizontalDirection,
            },
          ];
        }
      }
    }
  }

  // returns a boolean, indicating if a cell is selected or not
  cellIsSelected(cell: CellSelectionItem): boolean {
    return this.selectedCells.some(
      (item) =>
        item.itemKey === cell.itemKey && item.columnKey === cell.columnKey
    );
  }

  // simple method for getting the last selected cell
  getFirstSelectedCell(): CellSelectionItem {
    return this.selectedCells[0];
  }

  // emits the appr. event in order to show the selection on the grid
  updateState() {
    this.selectedCellsChange.emit(this.selectedCells);
  }
}
