import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [MessageService],
})
export class AppComponent {
  uploadedFile: File | null = null;
  analysisResult: any = null;
  loading = false;

  constructor(private http: HttpClient, private messageService: MessageService) {}

  onUpload(event: any) {
    this.uploadedFile = event.files[0];
    if (this.uploadedFile) {
      this.analyzeDocument();
    }
  }

  analyzeDocument() {
    const formData = new FormData();
    formData.append('file', this.uploadedFile!);

    this.loading = true;
    this.http.post<any>('/predict', formData).subscribe({
      next: (predictResponse) => {
        const docType = predictResponse.type;
        const endpoint = docType === 'cheque' ? '/cheque' : '/versement';

        this.http.post<any>(endpoint, formData).subscribe({
          next: (data) => {
            this.analysisResult = data;
            this.loading = false;
            this.messageService.add({ severity: 'success', summary: 'Analyse réussie', detail: `Type: ${docType}` });
          },
          error: () => {
            this.loading = false;
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Échec de l'analyse OCR" });
          },
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Échec de la classification du document' });
      },
    });
  }
}
