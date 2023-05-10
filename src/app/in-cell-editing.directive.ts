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
import { FormGroup } from '@angular/forms';
import {
  CellCloseEvent,
  CellSelectionItem,
  CreateFormGroupArgs,
  GridComponent,
} from '@progress/kendo-angular-grid';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[inCellEditing]',
})
export class InCellEditingDirective implements OnInit, OnDestroy {
  @Input() selectedCells: CellSelectionItem[] = [];
  @Input() multipleSelectRowOffset: number = 1;
  @Input() multipleSelectColumnOffset: number = 1;
  @Input() inCellEditingFormGroup!: (args: CreateFormGroupArgs) => FormGroup;
  @Input() gridData: any[] = [];

  @Output() selectedCellsChange = new EventEmitter<CellSelectionItem[]>();
  @Output() multipleSelectRowOffsetChange = new EventEmitter<number>();
  @Output() multipleSelectColumnOffsetChange = new EventEmitter<number>();
  @Output() gridDataChange = new EventEmitter<any[]>();

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
  private unsubKeydown!: () => void;
  private unsubClick!: () => void;
  private unsubDblClick!: () => void;

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

    this.unsubClick = this.renderer.listen(this.el.nativeElement, 'click', () =>
      this.onClick()
    );

    this.unsubDblClick = this.renderer.listen(
      this.el.nativeElement,
      'dblclick',
      () => this.onDblClick()
    );

    this.cellClose$ = this.grid.cellClose.subscribe((cellCloseEvent) => {
      this.onCellClose(cellCloseEvent);
    });
  }

  ngOnDestroy(): void {
    this.unsubKeydown();
    this.unsubClick();
    this.unsubDblClick();
    this.cellClose$.unsubscribe();
  }

  onKeydown(e: KeyboardEvent): void {
    // exit on tab
    if (e.key === 'Tab') return;

    // if we enter in edit mode or leave it with enter
    if (
      this.grid.activeCell.dataItem && // cell is a data cell
      e.key === 'Enter' &&
      this.grid.activeCell.colIndex != 0 // column is editable - this should be parametized later
    ) {
      this.noFocusingWithArrowKeys = !this.noFocusingWithArrowKeys;
      this.resetState();
      // this.dataRowIndex = this.grid.activeCell.dataRowIndex;
      // this.columnIndex = this.grid.activeCell.colIndex;
    }

    // if we enter in edit mode via typing any numbers
    if (
      this.grid.activeCell.dataItem && // we presss a key on a data cell
      this.grid.activeCell.colIndex != 0 && // columns with [editable]=false are out
      Number(e.key) && // only numbers
      !this.grid.isEditingCell() // we are not in edit mode elsewhere in the grid
    ) {
      this.noFocusingWithArrowKeys = false;
      // get the column field name (key)
      this.key = Object.keys(this.grid.activeCell.dataItem)[
        this.grid.activeCell.colIndex
      ];
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

  onClick() {
    this.resetState();
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
      //this.rows[this.dataRowIndex] = this.originalDataItem;
      this.gridData[this.dataRowIndex] = this.originalDataItem;
      this.gridDataChange.emit(this.gridData);
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
    this.multipleSelectRowOffset = 1;
    this.multipleSelectColumnOffset = 1;
    this.selectedCellsChange.emit(this.selectedCells);
    this.multipleSelectRowOffsetChange.emit(this.multipleSelectRowOffset);
    this.multipleSelectColumnOffsetChange.emit(this.multipleSelectColumnOffset);
  }
}
