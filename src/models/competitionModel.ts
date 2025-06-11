import { UserModel } from './userModel';

export interface Competition {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  participants_count: number;
  creator: UserModel;
  created_at?: string;
  participants?: UserModel[];
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  winner?: UserModel;
}

export interface CompetitionParticipant {
  id: number;
  user: UserModel;
  competition: Competition;
  joined_at: string;
  position?: number;
  average_daily_use?: number;
}

export interface Invitation {
  id: number;
  sender: UserModel
  recipient: UserModel;
  competition: Competition
  created_at: Date;
  updated_at?: Date;
  status?: 'pending' | 'accepted' | 'rejected' | 'expired';
}