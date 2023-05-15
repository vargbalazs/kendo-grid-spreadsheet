import { Component, ViewChild } from '@angular/core';
import { rows } from './data/data';
import { Row } from './model/row.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  CellSelectionItem,
  CreateFormGroupArgs,
  GridComponent,
  RowClassArgs,
  SelectableSettings,
} from '@progress/kendo-angular-grid';
import { RowType } from './enums/row-type.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'kendo-grid-spreadsheet';
  rows: Row[] = rows;
  formGroup = this.formBuilder.group({
    accountNumber: '',
    jan: 0,
    feb: 0,
    mar: 0,
    apr: 0,
    may: 0,
    jun: 0,
    jul: 0,
    aug: 0,
    sep: 0,
    oct: 0,
    nov: 0,
    dec: 0,
  });
  @ViewChild('grid') grid!: GridComponent;
  selectableSettings: SelectableSettings = {
    cell: true,
  };
  selectedCells: CellSelectionItem[] = [];

  constructor(private formBuilder: FormBuilder) {
    this.createFormGroup = this.createFormGroup.bind(this);
  }

  createFormGroup(args: CreateFormGroupArgs): FormGroup {
    const item = <Row>args.dataItem;
    this.formGroup.reset(item);
    return this.formGroup;
  }

  checkDuplicates(): boolean {
    const unique = this.selectedCells.filter(
      (item1, index) =>
        this.selectedCells.findIndex(
          (item2) =>
            item2.itemKey === item1.itemKey &&
            item2.columnKey === item1.columnKey
        ) === index
    );
    return unique.length === this.selectedCells.length;
  }

  getGridData() {
    console.log(this.rows);
  }

  rowClass = (args: RowClassArgs) => {
    if ((<Row>args.dataItem).rowType === RowType.CALCULATED) {
      return {
        sum: true,
      };
    } else {
      return {};
    }
  };
}
