import { useState } from 'react';
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
  const [dailyScreenTimeGoal, setDailyScreenTimeGoal] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Validation states
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    username: '',
    name: ''
  });

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
      setLoginError('Username or password is wrong');
      return;
    }

    try {
      setIsLoading(true);
      setLoginError('');
      console.log("API URL:", API_URL);
      const response = await axios.post(`${API_URL}/login/`, {
        username,
        password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log("Login response:", response.data);

      const token = response.data.token;
      const localProfile: UserModel = {
        id: response.data.user.user.id || 0,
        username: response.data.user.user.username || 'Not available',
        email: response.data.user.user.email || 'Not available',
        name: response.data.user.name || 'None',
        avatar: response.data.user.avatar || null,
      };

      if (token) {
        await AsyncStorage.setItem('authToken', token);
        await saveProfile(localProfile);
        console.log("Token saved:", token);
        router.replace('/(tabs)/profile');
      } else {
        console.error("No token received in login response");
        setLoginError('Username or password is wrong');
      }
    } catch (error) {
      console.log("Login error:", error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          setLoginError('Username or password is wrong');
        } else if (error.request) {
          setLoginError('No response from server. Check your connection.');
        } else {
          setLoginError('Failed to make request.');
        }
      } else {
        setLoginError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Signup logic
  const handleSignUp = async () => {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isUsernameValid = validateUsername();
    const isNameValid = validateName();
    
    if (!isEmailValid || !isPasswordValid || !isUsernameValid || !isNameValid) {
      Alert.alert('Error', 'Please correct the errors before submitting');
      return;
    }
    
    console.log("API URL:", API_URL);
    console.log("Preparing to sign up with:", { email, username, name });

    try {
      setIsLoading(true);
      console.log("Attempting signup with:", { email, username, name });

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
      
      console.log("Signup response:", response.data);
      
      if (response.data && response.data.user_id) {
        const userData: UserModel = {
          id: response.data.user_id,
          username,
          email,
          name,
          dailyScreenTimeGoal: dailyScreenTimeGoal * 60,
        };
        
        await saveProfile(userData);
        console.log("User profile saved after signup");
      }
      
      Alert.alert(
        'Success', 
        'Account created successfully!',
        [{ text: 'Login Now', onPress: () => router.replace('/login') }]
      );
    } catch (error) {
      console.error("Signup error:", error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage = error.response.data.message || 'Something went wrong.';
          console.log("Server error response:", error.response.data);
          Alert.alert('Error', errorMessage);
        } else if (error.request) {
          console.log("No response received:", error.request);
          Alert.alert('Error', 'No response from server. Check your connection.');
        } else {
          console.log("Error setting up request:", error.message);
          Alert.alert('Error', 'Failed to make request.');
        }
      } else {
        console.log("Unexpected error:", error);
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log("Logging out user...");
      await AsyncStorage.multiRemove(['authToken', '@localProfile']);
      console.log("Auth data cleared");
      resetForm();
      router.replace('/(auth)/login');
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out completely. Please try again.');
      return false;
    }
  };

  // Reset form fields
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
    console.log("Form fields reset");
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
    logout,
    loginError,
    setLoginError,
  };
}