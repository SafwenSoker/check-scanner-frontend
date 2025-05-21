import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
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
  isDragging = false;
  pdfSrc: string | Uint8Array | { url: string } | undefined;
  filePreviewUrl: SafeUrl = '';
  imagePreviewUrl: string = '';
  private objectUrls: string[] = [];
  private progressSubscription: Subscription | undefined;
  private toast: any;

  constructor(
    private documentService: DocumentAnalysisService,
    private messageService: MessageService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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
    try {
      if (event.files && event.files.length > 0) {
        console.log("Processing p-fileUpload files");
        // Pour l'upload avancé avec multiple=true
        this.selectedFiles = [...this.selectedFiles, ...event.files];
      } else if (event.target && event.target.files && event.target.files.length > 0) {
        console.log("Processing standard input files");
        // Pour l'input file standard
        const newFiles = Array.from(event.target.files) as File[];
        this.selectedFiles = [...this.selectedFiles, ...newFiles];
      }
      
      // Toujours mettre à jour le fichier sélectionné après avoir ajouté des fichiers
      if (this.selectedFiles.length > 0) {
        this.selectedFile = this.selectedFiles[0];
        console.log("Selected files:", this.selectedFiles.length, "Selected file:", this.selectedFile.name);
        
        // Handle PDF preview if the selected file is a PDF
        if (this.selectedFile.type.includes('pdf')) {
          this.loadPdfPreview(this.selectedFile);
        } else {
          // Reset PDF source if not a PDF file
          this.pdfSrc = undefined;
        }
        
        this.showInfoToast('Fichier(s) sélectionné(s) avec succès');
      }
    } catch (error) {
      console.error("Error in onFileSelect:", error);
      this.showErrorToast('Erreur lors de la sélection des fichiers');
    }
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
    this.isDragging = true;
    const dropZone = document.querySelector('.drop-zone-container');
    if (dropZone) {
      dropZone.classList.add('active');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const dropZone = document.querySelector('.drop-zone-container');
    if (dropZone) {
      dropZone.classList.remove('active');
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
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
        
        // Handle PDF preview if the selected file is a PDF
        if (this.selectedFile && this.selectedFile.type.includes('pdf')) {
          this.loadPdfPreview(this.selectedFile);
        } else {
          // Reset PDF source if not a PDF file
          this.pdfSrc = undefined;
        }
        
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
  
  // Simple method to get direct image URL for display
  getImageUrl(): string {
    if (!this.selectedFile || !this.isImageFile(this.selectedFile.name)) {
      return '';
    }
    
    try {
      // Create a new URL for the image file
      return URL.createObjectURL(this.selectedFile);
    } catch (error) {
      console.error('Error creating image URL:', error);
      return '';
    }
  }
  
  // Method to get a direct object URL for PDF files
  getPdfObjectUrl(): SafeResourceUrl | null {
    if (!this.selectedFile || !this.selectedFile.type.includes('pdf')) {
      return null;
    }
    
    try {
      // Create a new URL for the PDF file
      const objectUrl = URL.createObjectURL(this.selectedFile);
      // Store it for cleanup later
      this.objectUrls.push(objectUrl);
      // Return a sanitized URL
      return this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
    } catch (error) {
      console.error('Error creating PDF object URL:', error);
      return null;
    }
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
      console.error('No file selected for preview');
      return '';
    }
    
    try {
      // Créer une URL pour l'aperçu du fichier
      const url = URL.createObjectURL(this.selectedFile);
      console.log('Generated preview URL:', url);
      return url;
    } catch (error) {
      console.error('Error creating object URL:', error);
      return '';
    }
  }
  
  getFilePreviewForCard(file: File): string {
    // Créer une URL pour l'aperçu du fichier dans la carte
    return URL.createObjectURL(file);
  }
  
  selectFile(index: number): void {
    console.log('DEBUG: Selecting file at index:', index);
    if (index >= 0 && index < this.selectedFiles.length) {
      // Store the selected file
      this.selectedFile = this.selectedFiles[index];
      console.log('DEBUG: Selected file:', this.selectedFile.name, 'Type:', this.selectedFile.type, 'Size:', this.selectedFile.size);
      
      // Clean up any previous object URLs to prevent memory leaks
      this.cleanupObjectUrls();
      
      if (this.selectedFile) {
        // Simple approach for image files
        if (this.isImageFile(this.selectedFile.name)) {
          console.log('DEBUG: File is an image, creating base64 preview');
          // Use base64 encoding for images instead of object URLs
          this.createBase64Preview(this.selectedFile);
          
          // Reset PDF source if not a PDF file
          this.pdfSrc = undefined;
        }
        // Handle PDF preview if the selected file is a PDF
        else if (this.selectedFile.type.includes('pdf')) {
          console.log('DEBUG: File is PDF, preparing to load PDF preview');
          // Reset image preview URL
          this.imagePreviewUrl = '';
          this.filePreviewUrl = '';
          
          // Reset PDF source first to ensure the UI updates
          this.pdfSrc = undefined;
          
          // Then load the new PDF with a slight delay to ensure UI updates
          setTimeout(() => {
            if (this.selectedFile) {
              console.log('DEBUG: Loading PDF preview');
              this.loadPdfPreview(this.selectedFile);
            }
          }, 200);
        } else {
          console.log('DEBUG: File is neither PDF nor image, type:', this.selectedFile.type);
          this.imagePreviewUrl = '';
          this.filePreviewUrl = '';
          this.pdfSrc = undefined;
        }
      } else {
        console.error('DEBUG ERROR: Selected file is null after assignment');
      }
    } else {
      console.error('DEBUG ERROR: Invalid file index:', index, 'Files length:', this.selectedFiles.length);
    }
  }
  
  /**
   * Creates a base64 preview for image files
   */
  private createBase64Preview(file: File): void {
    console.log('DEBUG: Creating base64 preview for file:', file.name);
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      console.log('DEBUG: FileReader onload event fired for base64');
      try {
        // Get the base64 string
        const base64String = e.target.result;
        console.log('DEBUG: Base64 string created, length:', base64String.length);
        
        // Set the image preview URL to the base64 string
        this.imagePreviewUrl = base64String;
        console.log('DEBUG: Image preview URL set to base64 string');
        
        // Also set the SafeUrl for Angular binding
        this.filePreviewUrl = this.sanitizer.bypassSecurityTrustUrl(base64String);
        console.log('DEBUG: Safe URL created from base64');
        
        // Force change detection
        this.cdr.detectChanges();
      } catch (error) {
        console.error('DEBUG ERROR: Error creating base64 preview:', error);
        this.imagePreviewUrl = '';
        this.filePreviewUrl = '';
      }
    };
    
    reader.onerror = (error) => {
      console.error('DEBUG ERROR: FileReader error during base64 creation:', error);
      this.imagePreviewUrl = '';
      this.filePreviewUrl = '';
    };
    
    // Read the file as a data URL (base64)
    console.log('DEBUG: Starting to read file as data URL');
    reader.readAsDataURL(file);
    console.log('DEBUG: Read as data URL operation initiated');
  }
  
  /**
   * Cleans up any object URLs created to prevent memory leaks
   */
  private cleanupObjectUrls(): void {
    this.objectUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Error revoking object URL:', e);
      }
    });
    this.objectUrls = [];
  }
  
  /**
   * Loads a PDF file for preview
   * @param file The PDF file to load
   */
  private loadPdfPreview(file: File): void {
    console.log('Loading PDF preview for:', file.name);
    
    // Use FileReader to read the file as an ArrayBuffer
    const reader = new FileReader();
    
    reader.onload = (e: any) => {
      try {
        // Get the ArrayBuffer
        const arrayBuffer = e.target.result;
        console.log('PDF ArrayBuffer loaded, size:', arrayBuffer.byteLength);
        
        // Convert to Uint8Array which is compatible with pdf-viewer
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log('PDF Uint8Array created, length:', uint8Array.length);
        
        // Set the PDF source to the Uint8Array
        this.pdfSrc = uint8Array;
        console.log('PDF source set to Uint8Array');
        
        // Force change detection to update the UI
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error processing PDF data:', error);
        this.pdfSrc = undefined;
        this.showErrorToast('Erreur lors du traitement du PDF');
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading PDF file:', error);
      this.pdfSrc = undefined;
      this.showErrorToast('Erreur lors de la lecture du fichier PDF');
    };
    
    // Read the file as an ArrayBuffer
    console.log('Starting to read PDF as ArrayBuffer');
    reader.readAsArrayBuffer(file);
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
    console.log(message)
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
