import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserModel = {
  id: number;
  username: string;
  email?: string;
  name?: string;
  avatar?: string;
  dailyScreenTimeGoal?: number;
  focusMode?: boolean;
};

export const saveProfile = async (profile: UserModel) => {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem('@localProfile', jsonValue);
  } catch (e) {
    console.error('Saving error:', e);
  }
};

export const loadProfile = async (): Promise<UserModel | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem('@localProfile');
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Loading error:', e);
    return null;
  }
};