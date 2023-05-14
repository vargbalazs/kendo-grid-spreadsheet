import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GridModule } from '@progress/kendo-angular-grid';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeCellFocusWithTabDirective } from './directives/tab.directive';
import { InCellEditingDirective } from './directives/in-cell-editing.directive';
import { SelectingWithShiftDirective } from './directives/selecting-with-shift.directive';
import { SelectingWithMouseDirective } from './directives/selecting-with-mouse.directive';

@NgModule({
  declarations: [
    AppComponent,
    ChangeCellFocusWithTabDirective,
    InCellEditingDirective,
    SelectingWithShiftDirective,
    SelectingWithMouseDirective,
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
