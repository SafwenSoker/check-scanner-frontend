import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { DocumentAnalysis } from '../models/document.model';
import { Environment } from '../models/environment.interface';


declare let __config: Environment;


export interface PredictionResult {
  type: 'cheque' | 'versement';
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentAnalysisService {
  private apiUrl = "http://localhost:8000";
  private progressSubject = new BehaviorSubject<number>(0);
  public progress$ = this.progressSubject.asObservable();

  constructor(private http: HttpClient) { }

  predictDocument(file: File): Observable<PredictionResult> {
    const formData = new FormData();
    formData.append('file', file);
    this.setProgress(25); // Détection du type
    return this.http.post<PredictionResult>(`${this.apiUrl}/predict`, formData);
  }

  analyzeCheque(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    this.setProgress(50); // Extraction des données
    return this.http.post<any>(`${this.apiUrl}/cheque`, formData);
  }

  analyzeVersement(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    this.setProgress(50); // Extraction des données
    return this.http.post<any>(`${this.apiUrl}/versement`, formData);
  }

  setProgress(value: number): void {
    this.progressSubject.next(value);
  }

  resetProgress(): void {
    this.progressSubject.next(0);
  }

  // Service pour l'historique local
  saveToHistory(data: DocumentAnalysis): void {
    const history = JSON.parse(localStorage.getItem('documentHistory') || '[]');
    history.unshift(data);
    localStorage.setItem('documentHistory', JSON.stringify(history));
  }

  getHistory(): DocumentAnalysis[] {
    return JSON.parse(localStorage.getItem('documentHistory') || '[]');
  }
}
