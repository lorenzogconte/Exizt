import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { UserModel, saveProfile } from '../models/userModel';
import { API_URL } from '@env';

export function useAuth() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dailyScreenTimeGoal, setDailyScreenTimeGoal] = useState(2); // Default: 2 hours
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Add validation errors state
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: '',
    name: ''
  });

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if the user is authenticated
  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const isAuth = !!token;
      setIsAuthenticated(isAuth);
      return isAuth;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Validation functions
  const validateEmail = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return false;
    } else if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email' }));
      return false;
    }
    setErrors(prev => ({ ...prev, email: '' }));
    return true;
  };
  
  const validatePassword = () => {
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return false;
    } else if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, password: '' }));
    return true;
  };
  
  const validateUsername = () => {
    if (!username) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return false;
    } else if (username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, username: '' }));
    return true;
  };
  
  const validateName = () => {
    if (!name) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
      return false;
    } else if (name.length < 2) {
      setErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: '' }));
    return true;
  };

  // Login logic
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      console.log("API URL:", API_URL);
      
      const response = await axios.post(`${API_URL}/login/`, {
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const token = response.data.token;
      const profileData: UserModel = {
        id: response.data.profile.user.id || 0,
        username: response.data.profile.user.username || 'Not available',
        email: response.data.profile.user.email || 'Not available',
        name: response.data.profile.name || 'None',
        avatar: response.data.profile.avatar || null,
      };

      if (token) {
        await AsyncStorage.setItem('authToken', token);
        await saveProfile(profileData);
        console.log("Token saved:", token);
        setIsAuthenticated(true);
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
        console.log('Unexpected error:', error);
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Updated signup logic
  const handleSignUp = async () => {
    // Validate all fields one last time
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isUsernameValid = validateUsername();
    const isNameValid = validateName();
    
    if (!isEmailValid || !isPasswordValid || !isUsernameValid || !isNameValid) {
      Alert.alert('Error', 'Please correct the errors before submitting');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_URL}/signup/`, {
        email,
        username,
        password,
        name,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // Store user data in AsyncStorage (without the password)
      if (response.data && response.data.user_id) {
        const userData: UserModel = {
          id: response.data.user_id,
          username,
          email,
          name,
          dailyScreenTimeGoal: dailyScreenTimeGoal * 60, // Convert to minutes before saving
        };
        
        await saveProfile(userData);
      }
      
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

  // Logout function
  const logout = async () => {
    try {
      // Clear auth token and profile data
      const keysToRemove = [
        'authToken',
        '@localProfile' // From UserModel, which we can see in userModel.ts
      ];
      
      await AsyncStorage.multiRemove(keysToRemove);
      
      // Reset authentication state
      setIsAuthenticated(false);
      
      // Reset form fields
      resetForm();
      
      // Navigate to login screen
      router.replace('/(auth)/login');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out completely. Please try again.');
      return false;
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setName('');
    setDailyScreenTimeGoal(2);
    setErrors({
      email: '',
      password: '',
      username: '',
      name: ''
    });
  };

  return {
    // Form fields
    username,
    setUsername,
    password,
    setPassword,
    email,
    setEmail,
    name,
    setName,
    dailyScreenTimeGoal,
    setDailyScreenTimeGoal,
    
    // Validation
    errors,
    validateEmail,
    validatePassword,
    validateUsername,
    validateName,
    
    // Actions
    handleLogin,
    handleSignUp,
    resetForm,
    isLoading,

    isAuthenticated,
    checkAuthStatus,
    logout, 
  };
}