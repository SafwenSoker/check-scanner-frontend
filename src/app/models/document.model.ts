export interface DocumentAnalysis {
  type: 'cheque' | 'versement';
  confidence: number;
  data: {
    amount?: string;
    date?: string;
    bank?: string;
    [key: string]: any;
  };
  fileName: string;
  analysisDate: string;
}

export interface PredictionResult {
  type: 'cheque' | 'versement';
  confidence: number;
}
