export type Screen = 'INTAKE' | 'IMPACT' | 'NEXUS' | 'ACTION' | 'MENU';

export interface IntakeItem {
  id: string;
  title: string;
  status: 'VERIFYING' | 'READY' | 'COMPLETED';
  timestamp: string;
  description: string;
  type?: string[];
  priority?: 'High' | 'Medium' | 'Low';
  imageUrl?: string;
}

export interface ActionStep {
  id: number;
  title: string;
  status: 'RECOMMENDED' | 'READY' | 'PENDING' | 'COMPLETED';
  description?: string;
  instructions?: string[];
  actionText?: string;
  icon?: string;
  locationInfo?: string;
}
