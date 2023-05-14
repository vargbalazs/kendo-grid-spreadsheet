import {
  Directive,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  CellCloseEvent,
  CellSelectionItem,
  ColumnComponent,
  CreateFormGroupArgs,
  GridComponent,
  GridDataResult,
} from '@progress/kendo-angular-grid';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[inCellEditing]',
})
export class InCellEditingDirective implements OnInit, OnDestroy {
  @Input() selectedCells: CellSelectionItem[] = [];
  @Input() inCellEditingFormGroup!: (args: CreateFormGroupArgs) => FormGroup;

  @Output() selectedCellsChange = new EventEmitter<CellSelectionItem[]>();

  private noFocusingWithArrowKeys: boolean = false;
  private key: string = '';
  private dataRowIndex!: number;
  private columnIndex!: number;
  private originalDataItem: any;
  private arrowKeys: string[] = [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
  ];
  private cellClose$!: Subscription;
  private columns!: ColumnComponent[];

  constructor(private grid: GridComponent) {}

  ngOnInit(): void {
    this.cellClose$ = this.grid.cellClose.subscribe((cellCloseEvent) => {
      this.onCellClose(cellCloseEvent);
    });
  }

  ngOnDestroy(): void {
    this.cellClose$.unsubscribe();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    // exit on tab
    if (e.key === 'Tab') return;

    // get the columns in the order as in the template, without hidden ones
    this.columns = (<ColumnComponent[]>this.grid.columnList.toArray()).filter(
      (c) => !c.hidden
    );

    // if we enter in edit mode or leave it with enter
    if (
      this.grid.activeCell.dataItem && // cell is a data cell
      e.key === 'Enter' &&
      !this.isColumnNotEditable(
        this.columns[this.grid.activeCell.colIndex].field
      ) // column is editable
    ) {
      this.noFocusingWithArrowKeys = !this.noFocusingWithArrowKeys;
      this.resetState();
      // this.dataRowIndex = this.grid.activeCell.dataRowIndex;
      // this.columnIndex = this.grid.activeCell.colIndex;
      this.storeOriginalValues();
    }

    // if we enter in edit mode via typing any numbers
    if (
      this.grid.activeCell.dataItem && // we presss a key on a data cell
      !this.isColumnNotEditable(
        this.columns[this.grid.activeCell.colIndex].field
      ) && // column is editable
      Number(e.key) && // only numbers
      !this.grid.isEditingCell() // we are not in edit mode elsewhere in the grid
    ) {
      this.noFocusingWithArrowKeys = false;
      // get the column field name (key)
      this.key = this.columns[this.grid.activeCell.colIndex].field;
      // store the original values (if we hit escape, we can set the value to the old one)
      this.storeOriginalValues();
      // set the field value to undefined - with this we start fresh in the cell
      this.grid.activeCell.dataItem[this.key] = undefined;
      // step into edit mode
      this.editCell();
    }

    // if we are in edit mode (not via enter key), then if we press the arrow keys, we change the focus
    if (this.grid.isEditingCell() && !this.noFocusingWithArrowKeys) {
      if (this.arrowKeys.includes(e.key)) {
        this.grid.closeCell();
        this.grid.focusCell(
          this.grid.activeCell.rowIndex,
          this.grid.activeCell.colIndex
        );
      }
    }
  }

  @HostListener('click', ['$event'])
  onClick() {
    // if we are not selecting cells with the mouse
    // if (!this.mouseSelection) this.resetState();
    // if (this.selectedCells.length === 0) this.resetState();
    // if we click an other data cell except the edited one, then close it
    if (this.grid.activeCell.dataItem) {
      const sameCell =
        this.columnIndex === this.grid.activeCell.colIndex &&
        this.dataRowIndex === this.grid.activeCell.dataRowIndex;
      if (!sameCell) {
        this.grid.closeCell();
        this.noFocusingWithArrowKeys = false;
      }
    }
  }

  @HostListener('dblclick', ['$event'])
  onDblClick() {
    if (this.grid.activeCell.dataItem) {
      this.noFocusingWithArrowKeys = true;
      // store the original values
      this.storeOriginalValues();
      // step into edit mode
      this.editCell();
    }
  }

  editCell() {
    // put the cell in edit mode with the appr. data item
    const args: CreateFormGroupArgs = {
      dataItem: this.grid.activeCell.dataItem,
      isNew: false,
      sender: this.grid,
      rowIndex: this.grid.activeCell.rowIndex,
    };
    this.grid.editCell(
      this.grid.activeCell.dataRowIndex,
      this.grid.activeCell.colIndex,
      this.inCellEditingFormGroup(args)
    );
  }

  onCellClose(args: CellCloseEvent): void {
    // if we hit escape, then restore the original value
    if ((<KeyboardEvent>args.originalEvent)?.key === 'Escape') {
      const gridData = (<GridDataResult>this.grid.data).data;
      gridData[this.dataRowIndex] = this.originalDataItem;
      this.noFocusingWithArrowKeys = false;
      this.resetState();
    }
  }

  storeOriginalValues() {
    // before editing, we store all the relevant original values
    this.dataRowIndex = this.grid.activeCell.dataRowIndex;
    this.columnIndex = this.grid.activeCell.colIndex;
    this.originalDataItem = {};
    Object.assign(this.originalDataItem, this.grid.activeCell.dataItem);
  }

  resetState() {
    this.selectedCells = [];
    this.selectedCellsChange.emit(this.selectedCells);
  }

  isColumnNotEditable(fieldName: string) {
    const columns = <ColumnComponent[]>this.grid.columnList.toArray();
    const nonEditableColumns = columns.filter((c) => !c.editable);
    return nonEditableColumns.some((c) => c.field === fieldName);
  }
}
