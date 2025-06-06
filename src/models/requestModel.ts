import { UserModel } from './userModel';

export type FriendRequest = {
  id: number;
  sender: UserModel;  // We'll map the API's 'sender' to 'from'
  createdAt: Date;
  status?: string;  // Adding status field which appears in the API response
}