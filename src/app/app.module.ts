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

// PDF Viewer
import { PdfViewerModule } from 'ng2-pdf-viewer';

// Pipes
import { SafePipe } from './pipes/safe.pipe';

@NgModule({
  declarations: [
    AppComponent,
    DocumentAnalyzerComponent,
    SafePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ToastModule,
    FileUploadModule,
    TableModule,
    CardModule,
    ButtonModule,
    SharedModule,
    PdfViewerModule
  ],
  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
