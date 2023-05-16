import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnInit,
  Renderer2,
} from '@angular/core';
import {
  ColumnComponent,
  GridComponent,
  GridDataResult,
} from '@progress/kendo-angular-grid';
import { RowType } from '../enums/row-type.enum';

@Directive({
  selector: '[gridColoring]',
})
export class GridColoringDirective implements OnInit, AfterViewInit {
  constructor(
    private renderer: Renderer2,
    private el: ElementRef,
    private grid: GridComponent
  ) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // get the row elements
    // we could use recursion, but if the grid has many data, it would be bad performance
    const ariaRoot = Array.from(
      (<HTMLElement>this.el.nativeElement).children
    ).find((el) => el.classList.contains('k-grid-aria-root'));
    const gridContainer = Array.from(ariaRoot!.children).find((el) =>
      el.classList.contains('k-grid-container')
    );
    const gridContent = Array.from(gridContainer!.children).find((el) =>
      el.classList.contains('k-grid-content')
    );
    const gridTableWrap = Array.from(gridContent!.children).find((el) =>
      el.classList.contains('k-grid-table-wrap')
    );
    const gridTable = Array.from(gridTableWrap!.children).find((el) =>
      el.classList.contains('k-grid-table')
    );
    const tableTBody = Array.from(gridTable!.children).find((el) =>
      el.classList.contains('k-table-tbody')
    );
    const rows = tableTBody!.children;

    // color the calculated rows

    // get the grid data and search for 'rowType' propperty and collect it's index, if it is a CALCULATED row type
    const gridData = (<GridDataResult>this.grid.data).data;
    const sumRowIndexes: number[] = [];

    gridData.forEach((item, index) => {
      if (Object.hasOwn(item, 'rowType')) {
        if (item['rowType'] === RowType.CALCULATED) sumRowIndexes.push(index);
      }
    });

    // add class to the calculated rows
    sumRowIndexes.forEach((index) =>
      this.renderer.addClass(rows[index], 'calculated')
    );

    // color the editable cells

    // // get the editable column indexes
    // const columns = <ColumnComponent[]>this.grid.columnList.toArray();
    // const editableColumnIndexes: number[] = [];
    // columns.forEach((col, index) => {
    //   if (col.editable && !col.hidden) editableColumnIndexes.push(index);
    // });

    // // get the cells excluding calculated rows
    // for (let i = 0; i < rows.length; i++) {
    //   if (!rows[i].classList.contains('calculated')) {
    //     const cells = rows[i].children;
    //     // add a class to each cell, which is in an editable column
    //     Array.from(cells).forEach((cell) => {
    //       if (editableColumnIndexes.includes(+cell.ariaColIndex!))
    //         this.renderer.addClass(cell, 'editable-cell');
    //     });
    //   }
    // }
  }
}
