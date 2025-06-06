import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserModel } from '../models/userModel';
import { FriendRequest } from '../models/requestModel';
import { API_URL } from '@env';

export const useFriendships = () => {
  const [friends, setFriends] = useState<UserModel[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  // Update counts whenever data changes
  useEffect(() => {
    setFriendsCount(friends.length);
  }, [friends]);

  useEffect(() => {
    setUnreadRequestsCount(friendRequests.length);
  }, [friendRequests]);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/friendships/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      const transformedFriends: UserModel[] = response.data.map((friend: any) => ({
        id: friend.user.id,
        username: friend.user.username,
        email: friend.user.email,
        name: friend.name,
        avatar: friend.avatar,
      }));
      
      setFriends(transformedFriends);
      setError(null);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
      
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return;
      }
      
      const response = await axios.get(`${API_URL}/requests/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      setFriendRequests(response.data.received_requests || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching friend requests:', err);
      
    }
  };

  const sendFriendRequest = async (username: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to send friend requests');
        return false;
      }
      console.log("username:", username);
      console.log("token:", token);
      const response = await axios.post(`${API_URL}/send-request/`, 
        { username: username }, 
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        return true;
      } else {
        throw new Error(response.data.error || 'Failed to send request');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      Alert.alert('Error', 'Failed to send friend request');
      return false;
    }
  };

  const handleFriendRequest = async (request_id: number, action: 'accept' | 'reject') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to accept friend requests');
        return false;
      }

      const response = await axios.post(`${API_URL}/handle-request/`, 
        { 
            request_id, 
            action
        }, 
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const request = friendRequests.find(req => req.id === request_id);
        if (request) {
          // Add to friends list
          setFriends(prevFriends => [...prevFriends, request.sender]);
          // Remove from requests
          setFriendRequests(prevRequests => 
            prevRequests.filter(req => req.id !== request_id)
          );
        }
        return true;
      } else {
        throw new Error(response.data.message || `Failed to ${action} request`);
      }
    } catch (err) {
        console.error(`Error ${action}ing friend request:`, err);
        Alert.alert('Error', `Failed to ${action} friend request`);
        return false;
    }
  };

  const removeFriend = async (friendId: number | string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to unfollow users');
        return false;
      }
      
      const response = await axios.post(`${API_URL}/delete-friend/`, 
        { friend_id: friendId }, 
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        // Update local state to remove the friend
        setFriends(prevFriends => 
          prevFriends.filter(friend => friend.id !== friendId)
        );
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to remove friend');
      }
    } catch (err) {
      console.error('Error removing friend:', err);
      Alert.alert('Error', 'Failed to remove friend');
      return false;
    }
  };

  // This function could be used in the UI to check if a request is pending
  const isRequestPending = (userId: number) => {
    return false; // This would typically be implemented with server-side state
  };

  return {
    friends,
    friendRequests,
    friendsCount,
    unreadRequestsCount,
    isLoading,
    error,
    fetchFriends,
    fetchFriendRequests,
    sendFriendRequest,
    handleFriendRequest,
    removeFriend,
    isRequestPending
  };
};