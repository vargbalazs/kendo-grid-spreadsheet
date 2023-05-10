import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import {
  CellSelectionItem,
  GridComponent,
  NavigationCell,
} from '@progress/kendo-angular-grid';

@Directive({
  selector: '[selectingWithShift]',
})
export class SelectingWithShiftDirective implements OnInit, OnDestroy {
  @Input() selectedCells: CellSelectionItem[] = [];
  @Input() multipleSelectRowOffset: number = 1;
  @Input() multipleSelectColumnOffset: number = 1;
  @Input() gridData: any[] = [];

  @Output() selectedCellsChange = new EventEmitter<CellSelectionItem[]>();
  @Output() multipleSelectRowOffsetChange = new EventEmitter<number>();
  @Output() multipleSelectColumnOffsetChange = new EventEmitter<number>();

  private arrowKeys: string[] = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ];
  private unsubKeydown!: () => void;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private grid: GridComponent
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
      switch (e.key) {
        case 'ArrowRight':
          // exit, if we reached the right edge
          if (this.rightEndReached()) return;
          // if we selected some cell in a row to the left and step backwards to right, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, 0, 0) &&
            this.multipleSelectColumnOffset === 1
          ) {
            this.removeLastSelectedCell();
          }
          // if we selected some cell in a row to the left and step backwards to right, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, 0, 1) &&
            this.multipleSelectColumnOffset === 1
          ) {
            this.removeLastSelectedCell();
            this.markCellAsSelected(this.grid.activeCell, 0, 1);
            this.updateSelectedCells();
            return;
          }
          // if we select or remove multiple columns
          if (
            this.cellIsSelected(this.grid.activeCell, -1, 0) ||
            this.cellIsSelected(this.grid.activeCell, 1, 0)
          ) {
            // if we step backwards from a left selection, then remove the columns
            if (this.cellIsSelected(this.grid.activeCell, 0, 1)) {
              this.removeMultipleSelectedColumnCells(this.grid.activeCell);
              this.multipleSelectColumnOffset--;
              if (
                this.grid.activeCell.colIndex + 1 ===
                this.selectedCells[0].columnKey
              )
                this.multipleSelectRowOffset = 1;
              this.updateState();
              return;
            } else {
              // if we are extending the selection, then add columns
              if (this.multipleSelectColumnOffset > 1)
                this.removeLastSelectedCell();
              this.markMultipleColumnCellsAsSelected(
                this.grid.activeCell,
                this.multipleSelectColumnOffset,
                1
              );
              this.multipleSelectColumnOffset++;
              this.multipleSelectRowOffset =
                Math.abs(
                  this.grid.activeCell.dataRowIndex -
                    this.selectedCells[0].itemKey
                ) + 1;
            }
          }
          this.markCellAsSelected(this.grid.activeCell, 0, 0);
          this.markCellAsSelected(this.grid.activeCell, 0, 1);
          this.updateState();
          break;
        case 'ArrowLeft':
          // exit, if we reached the left edge
          if (this.leftEndReached()) return;
          // if we selected some cell in a row to the right and step backwards to left, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, 0, 0) &&
            this.multipleSelectColumnOffset === 1
          ) {
            this.removeLastSelectedCell();
          }
          // if we selected some cell in a row to the right and step backwards to left, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, 0, -1) &&
            this.multipleSelectColumnOffset === 1
          ) {
            this.removeLastSelectedCell();
            this.markCellAsSelected(this.grid.activeCell, 0, -1);
            this.updateSelectedCells();
            return;
          }
          // if we select or remove multiple columns
          if (
            this.cellIsSelected(this.grid.activeCell, -1, 0) ||
            this.cellIsSelected(this.grid.activeCell, 1, 0)
          ) {
            // if we step backwards from a right selection, then remove the columns
            if (this.cellIsSelected(this.grid.activeCell, 0, -1)) {
              this.removeMultipleSelectedColumnCells(this.grid.activeCell);
              this.multipleSelectColumnOffset--;
              if (
                this.grid.activeCell.colIndex - 1 ===
                this.selectedCells[0].columnKey
              ) {
                this.multipleSelectRowOffset = 1;
              }
              this.updateState();
              return;
            } else {
              // if we are extending the selection, then add columns
              if (this.multipleSelectColumnOffset > 1)
                this.removeLastSelectedCell();
              this.markMultipleColumnCellsAsSelected(
                this.grid.activeCell,
                this.multipleSelectColumnOffset,
                -1
              );
              this.multipleSelectColumnOffset++;
              this.multipleSelectRowOffset =
                Math.abs(
                  this.grid.activeCell.dataRowIndex -
                    this.selectedCells[0].itemKey
                ) + 1;
            }
          }
          this.markCellAsSelected(this.grid.activeCell, 0, 0);
          this.markCellAsSelected(this.grid.activeCell, 0, -1);
          this.updateState();
          break;
        case 'ArrowUp':
          // exit, if we reached the upper edge
          if (this.topEndReached()) return;
          // if we selected some cell in a column downwards and step backwards, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, 0, 0) &&
            this.multipleSelectRowOffset === 1
          ) {
            this.removeLastSelectedCell();
          }
          // if we selected some cell in a column downwards and step backwards, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, -1, 0) &&
            this.multipleSelectRowOffset === 1
          ) {
            this.removeLastSelectedCell();
            this.markCellAsSelected(this.grid.activeCell, -1, 0);
            this.updateSelectedCells();
            return;
          }
          // if we select or remove multiple rows
          if (
            this.cellIsSelected(this.grid.activeCell, 0, -1) ||
            this.cellIsSelected(this.grid.activeCell, 0, 1)
          ) {
            // if we step backwards from a down selection, then remove the rows
            if (this.cellIsSelected(this.grid.activeCell, -1, 0)) {
              this.removeMultipleSelectedRowCells(this.grid.activeCell);
              this.multipleSelectRowOffset--;
              if (
                this.grid.activeCell.dataRowIndex - 1 ===
                this.selectedCells[0].itemKey
              )
                this.multipleSelectColumnOffset = 1;
              this.updateSelectedCells();
              return;
            } else {
              // if we are extending the selection, then add rows
              if (this.multipleSelectRowOffset > 1)
                this.removeLastSelectedCell();
              this.markMultipleRowCellsAsSelected(
                this.grid.activeCell,
                this.multipleSelectRowOffset,
                -1
              );
              this.multipleSelectRowOffset++;
              this.multipleSelectColumnOffset =
                Math.abs(
                  this.grid.activeCell.colIndex -
                    this.selectedCells[0].columnKey
                ) + 1;
            }
          }
          this.markCellAsSelected(this.grid.activeCell, 0, 0);
          this.markCellAsSelected(this.grid.activeCell, -1, 0);
          this.updateState();
          break;
        case 'ArrowDown':
          // exit, if we reached the bottom edge
          if (this.bottomEndReached()) return;
          // if we selected some cell in a column upwards and step backwards, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, 0, 0) &&
            this.multipleSelectRowOffset === 1
          ) {
            this.removeLastSelectedCell();
          }
          // if we selected some cell in a column upwards and step backwards, then remove the last selected cell
          if (
            this.cellIsSelected(this.grid.activeCell, 1, 0) &&
            this.multipleSelectRowOffset === 1
          ) {
            this.removeLastSelectedCell();
            this.markCellAsSelected(this.grid.activeCell, 1, 0);
            this.updateSelectedCells();
            return;
          }
          // if we select or remove multiple rows
          if (
            this.cellIsSelected(this.grid.activeCell, 0, -1) ||
            this.cellIsSelected(this.grid.activeCell, 0, 1)
          ) {
            // if we step backwards from an up selection, then remove the rows
            if (this.cellIsSelected(this.grid.activeCell, 1, 0)) {
              this.removeMultipleSelectedRowCells(this.grid.activeCell);
              this.multipleSelectRowOffset--;
              if (
                this.grid.activeCell.dataRowIndex + 1 ===
                this.selectedCells[0].itemKey
              )
                this.multipleSelectColumnOffset = 1;
              this.updateState();
              return;
            } else {
              // if we are extending the selection, then add rows
              if (this.multipleSelectRowOffset > 1)
                this.removeLastSelectedCell();
              this.markMultipleRowCellsAsSelected(
                this.grid.activeCell,
                this.multipleSelectRowOffset,
                1
              );
              this.multipleSelectRowOffset++;
              this.multipleSelectColumnOffset =
                Math.abs(
                  this.grid.activeCell.colIndex -
                    this.selectedCells[0].columnKey
                ) + 1;
            }
          }
          this.markCellAsSelected(this.grid.activeCell, 0, 0);
          this.markCellAsSelected(this.grid.activeCell, 1, 0);
          this.updateState();
          break;
      }
    }
  }

  // returns a boolean, indicating if a cell is selected or not
  cellIsSelected(
    cell: NavigationCell,
    rowOffset: number,
    columnOffset: number
  ): boolean {
    return this.selectedCells.some(
      (item) =>
        item.itemKey === cell.dataRowIndex + rowOffset &&
        item.columnKey === cell.colIndex + columnOffset
    );
  }

  // marks a cell as selected, adding it to and recreate the 'selectedCells' array (because of triggering the change detection)
  markCellAsSelected(
    cell: NavigationCell,
    rowOffset: number,
    columnOffset: number
  ) {
    this.selectedCells = [
      ...this.selectedCells,
      {
        itemKey: cell.dataRowIndex + rowOffset,
        columnKey: cell.colIndex + columnOffset,
      },
    ];
  }

  // simple method for removing the last selected cell
  removeLastSelectedCell() {
    this.selectedCells = this.selectedCells.slice(
      0,
      this.selectedCells.length - 1
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
    return this.grid.activeCell.dataRowIndex + 1 === this.gridData.length;
  }

  // marks multiple cells in a row as selected
  markMultipleRowCellsAsSelected(
    activeCell: NavigationCell,
    rowOffset: number,
    direction: number
  ) {
    const firstSelectedItem = this.selectedCells[0];
    // if we start selecting cells to the right in a row and go up or down
    if (firstSelectedItem.columnKey < activeCell.colIndex) {
      for (let i = firstSelectedItem.columnKey; i < activeCell.colIndex; i++) {
        this.selectedCells = [
          ...this.selectedCells,
          {
            itemKey: firstSelectedItem.itemKey + rowOffset * direction,
            columnKey: i,
          },
        ];
      }
    } else {
      // if we start selecting cells to the left in a row and go up or down
      for (
        let i = activeCell.colIndex + 1;
        i <= firstSelectedItem.columnKey;
        i++
      ) {
        this.selectedCells = [
          ...this.selectedCells,
          {
            itemKey: firstSelectedItem.itemKey + rowOffset * direction,
            columnKey: i,
          },
        ];
      }
    }
  }

  // marks multiple cells in a column as selected
  markMultipleColumnCellsAsSelected(
    activeCell: NavigationCell,
    columnOffset: number,
    direction: number
  ) {
    const firstSelectedItem = this.selectedCells[0];
    // if we start selecting cells to the bottom in a column and go left or right
    if (firstSelectedItem.itemKey < activeCell.dataRowIndex) {
      for (
        let i = firstSelectedItem.itemKey;
        i < activeCell.dataRowIndex;
        i++
      ) {
        this.selectedCells = [
          ...this.selectedCells,
          {
            itemKey: i,
            columnKey: firstSelectedItem.columnKey + columnOffset * direction,
          },
        ];
      }
    } else {
      // if we start selecting cells to the top in a column and go left or right
      for (
        let i = activeCell.dataRowIndex + 1;
        i <= firstSelectedItem.itemKey;
        i++
      ) {
        this.selectedCells = [
          ...this.selectedCells,
          {
            itemKey: i,
            columnKey: firstSelectedItem.columnKey + columnOffset * direction,
          },
        ];
      }
    }
  }

  // removes a given cell from the selected cells array
  removeSelectedCell(dataRowIndex: number, columnIndex: number) {
    const index = this.selectedCells.findIndex(
      (item) => item.itemKey === dataRowIndex && item.columnKey === columnIndex
    );
    this.selectedCells.splice(index, 1);
    this.selectedCells = [...this.selectedCells];
  }

  // removes multiple selected cells in a row in one shot
  removeMultipleSelectedRowCells(activeCell: NavigationCell) {
    const firstSelectedItem = this.selectedCells[0];
    // if we go from a right selection backwards to left
    if (firstSelectedItem.columnKey < activeCell.colIndex) {
      for (let i = firstSelectedItem.columnKey; i <= activeCell.colIndex; i++) {
        this.removeSelectedCell(activeCell.dataRowIndex, i);
      }
    } else {
      // if we go from a left selection backwards to right
      for (let i = activeCell.colIndex; i <= firstSelectedItem.columnKey; i++) {
        this.removeSelectedCell(activeCell.dataRowIndex, i);
      }
    }
  }

  // removes multiple selected cells in a column in one shot
  removeMultipleSelectedColumnCells(activeCell: NavigationCell) {
    const firstSelectedItem = this.selectedCells[0];
    // if we go from a down selection backwards to up
    if (firstSelectedItem.itemKey < activeCell.dataRowIndex) {
      for (
        let i = firstSelectedItem.itemKey;
        i <= activeCell.dataRowIndex;
        i++
      ) {
        this.removeSelectedCell(i, activeCell.colIndex);
      }
    } else {
      // if we go from an up selection backwards to down
      for (
        let i = activeCell.dataRowIndex;
        i <= firstSelectedItem.itemKey;
        i++
      ) {
        this.removeSelectedCell(i, activeCell.colIndex);
      }
    }
  }

  // simple method for getting the last selected cell
  getLastSelectedCell(): CellSelectionItem {
    return this.selectedCells[this.selectedCells.length - 1];
  }

  // resets the state
  resetState() {
    this.selectedCells = [];
    this.multipleSelectRowOffset = 1;
    this.multipleSelectColumnOffset = 1;
    this.selectedCellsChange.emit(this.selectedCells);
    this.multipleSelectRowOffsetChange.emit(this.multipleSelectRowOffset);
    this.multipleSelectColumnOffsetChange.emit(this.multipleSelectColumnOffset);
  }

  // updates the state in order to get the grid component render the selected cells correctly
  updateSelectedCells() {
    this.selectedCellsChange.emit(this.selectedCells);
  }

  // updates everything and emits the appr. events
  updateState() {
    this.selectedCellsChange.emit(this.selectedCells);
    this.multipleSelectRowOffsetChange.emit(this.multipleSelectRowOffset);
    this.multipleSelectColumnOffsetChange.emit(this.multipleSelectColumnOffset);
  }
}
