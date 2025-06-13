import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { UserModel, loadProfile, saveProfile } from '../models/userModel';
import { API_URL } from '@env';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ImagePickerAsset } from 'expo-image-picker';

export function useProfile() {
  const [userData, setUserData] = useState<UserModel>({
    id: 0,
    username: 'Not available',
    email: 'Not available',
    name: 'None',
    avatar: 'None',
    dailyScreenTimeGoal: 0,
    focusMode: false
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit profile related states
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [imageFile, setImageFile] = useState<ImagePickerAsset | null>(null);

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Reset form fields when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditName(userData.name || '');
      setEditAvatar(userData.avatar || '');
    }
  }, [isEditing, userData]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // First try to get profile from AsyncStorage
      const localProfile = await loadProfile();
      
      // If we have a local profile, use it immediately to prevent UI flicker
      if (localProfile) {
        console.log("Using locally stored profile data");
        setUserData(localProfile);
        setLoading(false);
        return;
      }
      
      // Then try to get a fresh version from the API (regardless of whether local data exists)
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        // If no token and we didn't find local data, we can't load profile
        if (!localProfile) {
          setError('No authentication found');
        }
        setLoading(false);
        return;
      }
      
      // Only make API request if we have a token
      try {
        console.log("Refreshing profile data from API");
        const response = await axios.get(`${API_URL}/profile/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        const freshProfileData: UserModel = {
          id: response.data.user.id || 0,
          username: response.data.user.username || 'Not available',
          email: response.data.user.email || 'Not available',
          name: response.data.name || 'None',
          avatar: response.data.avatar || null,
          dailyScreenTimeGoal: response.data.dailyScreenTimeGoal || 0,
          focusMode: response.data.focusMode || false,
        };
        
        // Update UI with fresh data
        setUserData(freshProfileData);
        
        // Save updated profile to AsyncStorage
        await saveProfile(freshProfileData);
        
        // Clear any previous errors
        setError(null);
      } catch (apiError) {
        console.error('Error refreshing profile from API:', apiError);
        
        // Only set error if we don't have local data
        if (!localProfile) {
          setError('Failed to load profile data');
        }
      }
    } catch (err) {
      console.error('General error in fetchUserData:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Function to start editing profile
  const startEditing = () => {
    setIsEditing(true);
  };

  // Function to cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
  };

  // Function to validate form fields
  const validateForm = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return false;
    }
    return true;
  };

  const saveProfileChanges = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsUpdating(true);
      
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      const formData = new FormData();
      formData.append('name', editName);
      if (imageFile) {
        const fileExtension = imageFile.uri.split('.').pop();
        const fileName = `avatar-${Date.now()}.${fileExtension}`;
        const fileToUpload = {
          uri: imageFile.uri,
          name: fileName,
          type: `image/${fileExtension}`
        };
        
        formData.append('avatar', fileToUpload as any);
      } else if (editAvatar) {
        // If it's a URL and not a new file
        formData.append('avatar_url', editAvatar);
      }

      // Send update to API using FormData
      const response = await axios.put(
        `${API_URL}/profile/update/`,
        formData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (response.status === 200) {
        // Update local state with response data
        const updatedProfile = {
          ...userData,
          name: editName,
          avatar: response.data.avatar || editAvatar, // Use the URL returned from server
        };
        
        setUserData(updatedProfile);
        
        // Save to AsyncStorage
        await saveProfile(updatedProfile);
        
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update the return object to include setImageFile
  return {
    userData,
    loading,
    error,
    isEditing,
    isUpdating,
    editName,
    setEditName,
    editAvatar,
    setEditAvatar,
    imageFile,
    setImageFile,
    startEditing,
    cancelEditing,
    saveProfileChanges
  };
};