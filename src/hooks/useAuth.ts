import { useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export function useAuth() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Login logic
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post('http://10.0.2.2:8000/login/', {
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const token = response.data.token;
      
      if (token) {
        await AsyncStorage.setItem('authToken', token);
        console.log("Token saved:", token);
        router.replace('/(tabs)/profile');
      } else {
        console.error("No token received in login response");
        Alert.alert('Login Error', 'Authentication failed - no token received');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage = error.response.data.message || 'Invalid credentials';
          Alert.alert('Error', errorMessage);
        } else if (error.request) {
          Alert.alert('Error', 'No response from server. Check your connection.');
        } else {
          Alert.alert('Error', 'Failed to make request.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Signup logic
  const handleSignUp = async () => {
    if (!email || !username || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post('http://10.0.2.2:8000/signup/', {
        email,
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      Alert.alert(
        'Success', 
        'Account created successfully!',
        [
          {
            text: 'Login Now',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage = error.response.data.message || 'Something went wrong.';
          Alert.alert('Error', errorMessage);
        } else if (error.request) {
          Alert.alert('Error', 'No response from server. Check your connection.');
        } else {
          Alert.alert('Error', 'Failed to make request.');
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return {
    username,
    setUsername,
    password,
    setPassword,
    handleLogin,
    email,
    setEmail,
    handleSignUp,
    isLoading,
    resetForm
  };
}