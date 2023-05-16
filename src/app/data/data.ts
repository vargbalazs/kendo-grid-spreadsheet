import { RowType } from '../enums/row-type.enum';
import { Row } from '../model/row.model';

export const rows: Row[] = generateData();

function generateData(): Row[] {
  let rows: Row[] = [];
  for (let i = 1; i <= 10; i++) {
    rows.push({
      id: i,
      rowType: RowType.DATA,
      accountNumber: Math.round(Math.random() * 1000).toString(),
      jan: Math.round(Math.random() * 1000),
      feb: Math.round(Math.random() * 1000),
      mar: Math.round(Math.random() * 1000),
      apr: Math.round(Math.random() * 1000),
      may: Math.round(Math.random() * 1000),
      jun: Math.round(Math.random() * 1000),
      jul: Math.round(Math.random() * 1000),
      aug: Math.round(Math.random() * 1000),
      sep: Math.round(Math.random() * 1000),
      oct: Math.round(Math.random() * 1000),
      nov: Math.round(Math.random() * 1000),
      dec: Math.round(Math.random() * 1000),
    });
  }
  rows.splice(5, 0, {
    id: 11,
    rowType: RowType.CALCULATED,
    accountNumber: 'sum',
  });
  rows.splice(8, 0, {
    id: 12,
    rowType: RowType.CALCULATED,
    accountNumber: 'sum',
  });

  return rows;
}
