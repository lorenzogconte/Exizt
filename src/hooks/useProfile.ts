import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface UserData {
  username: string;
  email: string;
  name: string;
  avatarURL: string | null;
}

export function useProfile() {
  const [userData, setUserData] = useState<UserData>({
    username: 'Not available',
    email: 'Not available',
    name: 'None',
    avatarURL: null
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        
        if (!token) {
          setLoading(false);
          return;
        }
        console.log("Token retrieved:", token);
        
        const response = await axios.get('http://10.0.2.2:8000/profile/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setUserData({
          username: response.data.user.username || 'Not available',
          email: response.data.user.email || 'Not available',
          name: response.data.name || 'None',
          avatarURL: response.data.avatarURL || null
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return {
    userData,
    loading,
    error
  };
}