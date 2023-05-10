import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GridModule } from '@progress/kendo-angular-grid';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeCellFocusWithTabDirective } from './tab.directive';
import { InCellEditingDirective } from './in-cell-editing.directive';
import { SelectingWithShiftDirective } from './selecting-with-shift.directive';

@NgModule({
  declarations: [
    AppComponent,
    ChangeCellFocusWithTabDirective,
    InCellEditingDirective,
    SelectingWithShiftDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    GridModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
