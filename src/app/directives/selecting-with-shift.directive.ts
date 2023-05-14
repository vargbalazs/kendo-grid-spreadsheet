import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import {
  CellSelectionItem,
  GridComponent,
  GridDataResult,
} from '@progress/kendo-angular-grid';

@Directive({
  selector: '[selectingWithShift]',
})
export class SelectingWithShiftDirective {
  @Input() selectedCells: CellSelectionItem[] = [];

  @Output() selectedCellsChange = new EventEmitter<CellSelectionItem[]>();

  private arrowKeys: string[] = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ];
  private lastSelectedCell!: CellSelectionItem;
  private rowIndex = -1;
  private colIndex = -1;

  constructor(private grid: GridComponent) {}

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    // if we press any key, but not shift, then reset the state
    if (!e.shiftKey) {
      this.resetState();
    }

    // if we move back from the header row, we can only move back to the same column index, which we had
    // when we moved to the header row, otherwise we cancel the selection
    if (
      e.shiftKey &&
      e.key === 'ArrowDown' &&
      this.grid.activeCell.dataRowIndex === -1
    ) {
      if (
        this.grid.activeCell.colIndex != this.getLastSelectedCell()?.columnKey
      ) {
        this.resetState();
      }
    }

    // if we aren't in edit mode and hold the shift key and press any arrow (selecting)
    if (
      !this.grid.isEditingCell() &&
      e.shiftKey &&
      this.arrowKeys.includes(e.key) &&
      this.grid.activeCell.dataRowIndex != -1 // header
    ) {
      // store the first selected cell
      if (this.selectedCells.length === 0)
        this.selectedCells.push({
          itemKey: this.grid.activeCell.dataRowIndex,
          columnKey: this.grid.activeCell.colIndex,
        });
      switch (e.key) {
        case 'ArrowRight':
          // exit if we reach one of the edges
          if (this.rightEndReached()) return;
          this.lastSelectedCell = {
            itemKey: this.grid.activeCell.dataRowIndex,
            columnKey: this.grid.activeCell.colIndex + 1,
          };
          break;
        case 'ArrowLeft':
          // exit if we reach one of the edges
          if (this.leftEndReached()) return;
          this.lastSelectedCell = {
            itemKey: this.grid.activeCell.dataRowIndex,
            columnKey: this.grid.activeCell.colIndex - 1,
          };
          break;
        case 'ArrowUp':
          // exit if we reach one of the edges
          if (this.topEndReached()) return;
          this.lastSelectedCell = {
            itemKey: this.grid.activeCell.dataRowIndex - 1,
            columnKey: this.grid.activeCell.colIndex,
          };
          break;
        case 'ArrowDown':
          // exit if we reach one of the edges
          if (this.bottomEndReached()) return;
          this.lastSelectedCell = {
            itemKey: this.grid.activeCell.dataRowIndex + 1,
            columnKey: this.grid.activeCell.colIndex,
          };
          break;
      }
      // mark the cells as selected and update the state only if we move to another cell
      if (
        this.rowIndex != this.lastSelectedCell.itemKey ||
        this.colIndex != this.lastSelectedCell.columnKey
      ) {
        this.markCellsAsSelected(this.lastSelectedCell);
        this.updateState();
        this.rowIndex = this.lastSelectedCell.itemKey;
        this.colIndex = this.lastSelectedCell.columnKey;
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

  // indicates, if we reached the right end of the data table
  rightEndReached(): boolean {
    return this.grid.activeCell.colIndex >= this.grid.columns.length - 1;
  }

  // indicates, if we reached the left end of the data table
  leftEndReached(): boolean {
    return this.grid.activeCell.colIndex === 0;
  }

  // indicates, if we reached the top of the data table
  topEndReached(): boolean {
    return this.grid.activeCell.dataRowIndex < 1;
  }

  // indicates, if we reached the bottom end of the data table
  bottomEndReached(): boolean {
    return (
      this.grid.activeCell.dataRowIndex + 1 ===
      (<GridDataResult>this.grid.data).total
    );
  }

  // simple method for getting the last selected cell
  getFirstSelectedCell(): CellSelectionItem {
    return this.selectedCells[0];
  }

  // simple method for getting the last selected cell
  getLastSelectedCell(): CellSelectionItem {
    return this.selectedCells[this.selectedCells.length - 1];
  }

  // resets the state
  resetState() {
    this.selectedCells = [];
    this.selectedCellsChange.emit(this.selectedCells);
  }

  // emits the appr. events in order to show the selection on the grid
  updateState() {
    this.selectedCellsChange.emit(this.selectedCells);
  }
}
