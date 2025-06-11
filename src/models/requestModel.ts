import { UserModel } from './userModel';

export type FriendRequest = {
  id: number;
  sender: UserModel;
  createdAt: Date;
  status?: string;
}