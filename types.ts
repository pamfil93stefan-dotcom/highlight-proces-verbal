
export enum PhotoAngle {
  FRONT = 'Față',
  BACK = 'Spate',
  LEFT = 'Lateral Stânga',
  RIGHT = 'Lateral Dreapta'
}

export interface PhotoData {
  angle: PhotoAngle;
  base64: string | null;
}

export interface ReportItem {
  id: string;
  name: string;
  serialNumber: string;
  condition: string;
  photos: PhotoData[];
}

export interface ProcesVerbal {
  id: string;
  title: string;
  date: string;
  createdAt: number;
  location: string;
  predator: string;
  primitor: string;
  participants: string;
  purpose: string;
  items: ReportItem[];
  observations: string;
  signaturePredator: string | null;
  signaturePrimitor: string | null;
  status: 'draft' | 'completed';
}
