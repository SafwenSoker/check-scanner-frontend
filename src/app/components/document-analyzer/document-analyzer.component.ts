import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DocumentAnalysisService } from '../../services/document-analysis.service';
import { DocumentAnalysis } from '../../models/document.model';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { PredictionResult } from '../../services/document-analysis.service';

@Component({
  selector: 'app-document-analyzer',
  templateUrl: './document-analyzer.component.html',
  styleUrls: ['./document-analyzer.component.scss'],
  providers: [MessageService]
})
export class DocumentAnalyzerComponent implements OnInit, OnDestroy {
  @ViewChild('fileInputRef') fileInputRef!: ElementRef;

  isImageFile(fileName: string): boolean {
    return !!fileName.toLowerCase().match(/\.(jpg|jpeg|png)$/i);
  }
  
  openFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  selectedFile: File | null = null;
  selectedFiles: File[] = [];
  analysisResult: DocumentAnalysis | null = null;
  loading = false;
  progress = 0;
  history: DocumentAnalysis[] = [];
  private progressSubscription: Subscription | undefined;
  private toast: any;

  constructor(
    private documentService: DocumentAnalysisService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadHistory();
    this.subscribeToProgress();
  }

  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
  }

  private subscribeToProgress(): void {
    this.progressSubscription = this.documentService.progress$.subscribe(
      (value) => {
        this.progress = value;
        if (value === 100) {
          setTimeout(() => {
            this.progress = 0;
          }, 2000);
        }
      }
    );
  }

  downloadAnalysis(analysis: DocumentAnalysis): void {
    // Générer le nom du fichier basé sur la date et le type
    const date = new Date(analysis.analysisDate).toISOString().split('T')[0];
    const fileName = `analyse_${date}_${analysis.fileName}`;

    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = analysis.data['result']; // Supposant que le résultat est stocké dans data.result
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onFileSelect(event: any): void {
    if (event.files && event.files.length > 0) {
      // Pour l'upload avancé avec multiple=true
      this.selectedFiles = [...this.selectedFiles, ...event.files];
      // Garder le premier fichier comme fichier sélectionné pour la compatibilité
      this.selectedFile = this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
    } else if (event.target && event.target.files && event.target.files.length > 0) {
      // Pour l'input file standard
      const newFiles = Array.from(event.target.files) as File[];
      this.selectedFiles = [...this.selectedFiles, ...newFiles];
      this.selectedFile = this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
    }
    this.showInfoToast('Fichier(s) sélectionné(s) avec succès');
  }
  
  onFileRemove(event: any): void {
    const file = event.file;
    if (file) {
      this.selectedFiles = this.selectedFiles.filter(f => f.name !== file.name);
      this.selectedFile = this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
      this.showInfoToast('Fichier supprimé');
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.querySelector('.drop-zone-container');
    if (dropZone) {
      dropZone.classList.add('active');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.querySelector('.drop-zone-container');
    if (dropZone) {
      dropZone.classList.remove('active');
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = document.querySelector('.drop-zone-container');
    if (dropZone) {
      dropZone.classList.remove('active');
    }
    
    // Assurons-nous que nous avons bien des fichiers dans le transfert
    if (event.dataTransfer && event.dataTransfer.files) {
      console.log('Fichiers déposés:', event.dataTransfer.files.length);
      
      // Convertir FileList en tableau
      const droppedFiles = Array.from(event.dataTransfer.files) as File[];
      if (droppedFiles.length === 0) {
        return;
      }
      
      // Extensions valides
      const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
      
      // Filtrer les fichiers avec des extensions valides
      const validFiles = droppedFiles.filter(file => {
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        return validExtensions.includes(fileExt);
      });
      
      if (validFiles.length > 0) {
        // Ajouter les fichiers valides à la sélection
        this.selectedFiles = [...this.selectedFiles, ...validFiles];
        
        // Mettre à jour le fichier sélectionné pour l'affichage
        this.selectedFile = this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
        
        // Afficher un message de succès
        this.showInfoToast(`${validFiles.length} fichier(s) ajouté(s) avec succès`);
      } else {
        this.showErrorToast('Aucun fichier valide n\'a été déposé. Formats acceptés: JPG, JPEG, PNG, PDF');
      }
    }
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  removeFile(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
      this.selectedFile = this.selectedFiles.length > 0 ? this.selectedFiles[0] : null;
      this.showInfoToast('Fichier supprimé');
    }
  }
  
  clearAllFiles(): void {
    this.selectedFiles = [];
    this.selectedFile = null;
    this.showInfoToast('Tous les fichiers ont été supprimés');
  }
  
  getFilePreviewUrl(): string {
    if (!this.selectedFile) {
      return '';
    }
    
    // Créer une URL pour l'aperçu du fichier
    return URL.createObjectURL(this.selectedFile);
  }
  
  getFilePreviewForCard(file: File): string {
    // Créer une URL pour l'aperçu du fichier dans la carte
    return URL.createObjectURL(file);
  }
  
  selectFile(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFile = this.selectedFiles[index];
    }
  }

  analyzeDocument(): void {
    if (!this.selectedFile) {
      this.showErrorToast('Veuillez sélectionner un fichier');
      return;
    }

    const file = this.selectedFile;
    this.loading = true;
    
    this.documentService.predictDocument(file)
      .subscribe({
        next: (result: PredictionResult) => {
          const type = result.type;
          
          // Analyser selon le type de document
          let analysis$;
          if (type === 'cheque') {
            analysis$ = this.documentService.analyzeCheque(file);
          } else {
            analysis$ = this.documentService.analyzeVersement(file);
          }

          analysis$.subscribe({
            next: (data: any) => {
              this.analysisResult = {
                type,
                confidence: result.confidence,
                data,
                fileName: file.name,
                analysisDate: new Date().toISOString()
              };
              
              // Sauvegarder dans l'historique
              this.documentService.saveToHistory(this.analysisResult);
              this.loadHistory();
              
              this.showSuccessToast('Analyse terminée avec succès');
            },
            error: (error: any) => {
              this.showErrorToast('Erreur lors de l\'analyse du document');
            }
          });
        },
        error: (error: any) => {
          this.showErrorToast('Erreur lors de la détection du type de document');
        },
        complete: () => {
          this.documentService.resetProgress();
          this.loading = false;
        }
      });
  }

  private loadHistory(): void {
    this.history = this.documentService.getHistory();
  }

  private showSuccessToast(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: message,
      life: 5000
    });
  }

  private showErrorToast(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: message,
      life: 5000
    });
  }

  private showInfoToast(message: string): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Information',
      detail: message,
      life: 3000
    });
  }

  // Méthode pour obtenir les clés d'un objet
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
