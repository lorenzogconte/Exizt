import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '@env';

// Types for our competitions data
export interface User {
  id: number;
  username: string;
  name: string;
  avatar?: string;
}

export interface Competition {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  participants_count: number;
  creator: User;
  is_active: boolean;
  created_at: string;
}

export interface CompetitionInvitation {
  id: number;
  competition: Competition;
  sender: User;
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
}

export const useCompetitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [invitations, setInvitations] = useState<CompetitionInvitation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all competitions the user is part of
  const fetchCompetitions = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        setError('You need to be logged in to view competitions');
        return;
      }
      
      const response = await axios.get(`${API_URL}/competitions/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      setCompetitions(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching competitions:', err);
      setError('Failed to fetch competitions');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch competition invitations
  const fetchInvitations = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        return;
      }
      
      const response = await axios.get(`${API_URL}/competitions/invitations/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      setInvitations(response.data.filter((inv: CompetitionInvitation) => inv.status === 'pending'));
    } catch (err) {
      console.error('Error fetching competition invitations:', err);
    }
  };

  // Accept a competition invitation
  const acceptInvitation = async (invitationId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to accept invitations');
        return false;
      }
      
      const response = await axios.post(
        `${API_URL}/competitions/invitations/${invitationId}/accept/`, 
        {},
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        // Remove from invitations list
        setInvitations(prevInvitations => 
          prevInvitations.filter(inv => inv.id !== invitationId)
        );
        
        // Add to competitions list
        const acceptedInvitation = invitations.find(inv => inv.id === invitationId);
        if (acceptedInvitation) {
          setCompetitions(prevCompetitions => [
            ...prevCompetitions, 
            acceptedInvitation.competition
          ]);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      Alert.alert('Error', 'Failed to accept invitation');
      return false;
    }
  };

  // Decline a competition invitation
  const declineInvitation = async (invitationId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to decline invitations');
        return false;
      }
      
      const response = await axios.post(
        `${API_URL}/competitions/invitations/${invitationId}/decline/`, 
        {},
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        // Remove from invitations list
        setInvitations(prevInvitations => 
          prevInvitations.filter(inv => inv.id !== invitationId)
        );
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error declining invitation:', err);
      Alert.alert('Error', 'Failed to decline invitation');
      return false;
    }
  };

  // Create a new competition
  const createCompetition = async (competitionData: {
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    invited_users?: number[];
  }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to create competitions');
        return null;
      }
      
      const response = await axios.post(
        `${API_URL}/competitions/create/`, 
        competitionData,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 201) {
        const newCompetition = response.data;
        setCompetitions(prevCompetitions => [...prevCompetitions, newCompetition]);
        return newCompetition;
      }
      
      return null;
    } catch (err) {
      console.error('Error creating competition:', err);
      Alert.alert('Error', 'Failed to create competition');
      return null;
    }
  };

  // Invite a friend to join a competition
  const inviteToCompetition = async (competitionId: number, userId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to send invitations');
        return false;
      }
      
      const response = await axios.post(
        `${API_URL}/competitions/${competitionId}/invite/`, 
        { user_id: userId },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.status === 201;
    } catch (err) {
      console.error('Error inviting to competition:', err);
      Alert.alert('Error', 'Failed to send invitation');
      return false;
    }
  };

  // Get competition details
  const getCompetitionDetails = async (competitionId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to view competition details');
        return null;
      }
      
      const response = await axios.get(`${API_URL}/competitions/${competitionId}/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error fetching competition details:', err);
      Alert.alert('Error', 'Failed to fetch competition details');
      return null;
    }
  };

  // Leave a competition
  const leaveCompetition = async (competitionId: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to leave a competition');
        return false;
      }
      
      const response = await axios.post(
        `${API_URL}/competitions/${competitionId}/leave/`, 
        {},
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.status === 200) {
        setCompetitions(prevCompetitions => 
          prevCompetitions.filter(comp => comp.id !== competitionId)
        );
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error leaving competition:', err);
      Alert.alert('Error', 'Failed to leave competition');
      return false;
    }
  };

  // Initial data load
  useEffect(() => {
    fetchCompetitions();
    fetchInvitations();
  }, []);

  return {
    competitions,
    invitations,
    isLoading,
    error,
    fetchCompetitions,
    fetchInvitations,
    acceptInvitation,
    declineInvitation,
    createCompetition,
    inviteToCompetition,
    getCompetitionDetails,
    leaveCompetition
  };
};