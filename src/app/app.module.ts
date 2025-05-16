import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DocumentAnalyzerComponent } from './components/document-analyzer/document-analyzer.component';
import { SharedModule } from './components/common/common.module';

// PrimeNG Modules
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    AppComponent,
    DocumentAnalyzerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ToastModule,
    FileUploadModule,
    TableModule,
    CardModule,
    ButtonModule,
    SharedModule
  ],
  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
