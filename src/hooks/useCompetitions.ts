import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_URL } from '@env';
import { Competition, Invitation, CompetitionParticipant } from '../models/competitionModel';
import { UserModel } from '../models/userModel';

export const useCompetitions = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
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
      const response = await axios.get(`${API_URL}/competitions/active`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      // Map creator to a flat user object
      const competitions = response.data.map((comp: any) => ({
        ...comp,
        creator: {
          id: comp.creator.user.id,
          username: comp.creator.user.username,
          email: comp.creator.user.email,
          avatar: comp.creator.avatar,
          name: comp.creator.name
        },
      }));
      console.log("Competition 1:", competitions);
      setCompetitions(competitions);
      setError(null);
    } catch (err : any) {
      if (err.response) {
        console.log('Server responded with error', err.response.status, err.response.data);
      } else if (err.request) {
        console.log('No response received. Request:', err.request);
      } else {
        console.log('Axios error:', err.message);
      }
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
      
      // Convert the API response dates to string format for consistency
      const formattedInvitations = response.data.map((inv: any) => ({
        ...inv,
        created_at: inv.created_at ? inv.created_at.toString() : new Date().toISOString(),
        updated_at: inv.updated_at ? inv.updated_at.toString() : undefined
      }));
      
      setInvitations(formattedInvitations.filter((inv: Invitation) => inv.status === 'pending'));
    } catch (err) {
      console.error('Error fetching competition invitations:', err);
    }
  };

  const handleInvitation = async (invitationId: number, action: 'accept' | 'decline') => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', `You need to be logged in to ${action} invitations`);
        return false;
      }
      
      const response = await axios.post(
        `${API_URL}/competitions/invitations/handle/`, 
        {
          invitation_id: invitationId,
          action: action
        },
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
        
        // If accepting, add to competitions list
        if (action === 'accept') {
          const acceptedInvitation = invitations.find(inv => inv.id === invitationId);
          if (acceptedInvitation) {
            setCompetitions(prevCompetitions => [
              ...prevCompetitions, 
              acceptedInvitation.competition
            ]);
          }
          
          // Refresh competitions list to get updated data
          await fetchCompetitions();
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error(`Error ${action}ing invitation:`, err);
      Alert.alert('Error', `Failed to ${action} invitation`);
      return false;
    }
  };

  // Create a new competition
  const createCompetition = async (competitionData: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
  }): Promise<Competition | null> => {
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
  const inviteToCompetition = async (competitionId: number, username: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to send invitations');
        return false;
      }
      console.log('DEBUG inviteToCompetition payload:', { competition_id: competitionId, username });
      const response = await axios.post(
        `${API_URL}/competitions/invitations/send/`, 
        { 
          competition_id: competitionId,
          username: username 
        },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("Invitation response:", response.data);
      return response.status === 201;
    } catch (err) {
      console.error('Error inviting to competition:', err);
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.message || 
                            err.response.data.error || 
                            'Failed to send invitation';
        console.log('DEBUG inviteToCompetition error response:', err.response.data);
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to send invitation');
      }
      return false;
    }
  };

  const removeParticipant = async (competitionId: number, participantId: number): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to remove participants');
        return false;
      }
      
      const response = await axios.delete(
        `${API_URL}/competitions/${competitionId}/participants/${participantId}/`, 
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.status === 200;
    } catch (err) {
      console.error('Error removing participant:', err);
      
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.message || 
                            err.response.data.error || 
                            'Failed to remove participant';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to remove participant');
      }
      
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
      console.log("Competition details response:", response.data);

      const userId = await AsyncStorage.getItem('userId');

      let isCreator = false;
      let creatorId = undefined;
      if (response.data.creator) {
        if (response.data.creator.user && response.data.creator.user.id !== undefined) {
          creatorId = response.data.creator.user.id;
        } else if (response.data.creator.id !== undefined) {
          creatorId = response.data.creator.id;
        }
      }
      if (userId && creatorId !== undefined) {
        isCreator = creatorId.toString() === userId;
        console.log('DEBUG [useCompetitions] userId:', userId, 'type:', typeof userId, 'creatorId:', creatorId, 'type:', typeof creatorId, 'isCreator:', isCreator);
      }

      // Use the leaderboard data directly from the backend
      const participants = response.data.leaderboard || [];

      const participantsWithRanks = participants.map((participant : any, index : number) => ({
        ...participant,
        user: participant.user && participant.user.user
          ? {
              id: participant.user.user.id,
              username: participant.user.user.username,
              email: participant.user.user.email,
              avatar: participant.user.avatar,
              name: participant.user.name
            }
          : {
              username: participant.username || "Unknown",
              id: participant.user_id || participant.id,
              avatar: participant.avatar || null,
              name: participant.name || ""
            },
        rank: participant.rank || index + 1,
        average_daily_use: participant.average_daily_usage ?? participant.average_daily_use ?? null
      }));

        // Flatten creator object for consistency
        let competitionData = { ...response.data };
        if (competitionData.creator && competitionData.creator.user) {
          competitionData.creator = {
            id: competitionData.creator.user.id,
            username: competitionData.creator.user.username,
            email: competitionData.creator.user.email,
            avatar: competitionData.creator.avatar,
            name: competitionData.creator.name
          };
        }
        // Map total_participants to participant_count for frontend compatibility
        competitionData.participant_count = competitionData.total_participants;

        return {
          competition: competitionData,
          participants: participantsWithRanks,
          isCreator: isCreator,
          totalParticipants: competitionData.total_participants || participants.length,
          rankedParticipants: competitionData.ranked_participants || 0
        };
    } catch (err) {
      console.error('Error fetching competition details:', err);
      
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data.message || 
                            err.response.data.error || 
                            'Failed to fetch competition details';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to fetch competition details');
      }
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

  // Update an existing competition
  const updateCompetition = async (
    competitionId: number,
    competitionData: {
      title: string;
      description: string;
      start_date: string;
      end_date: string;
      participants?: number[]; // Add participants as optional field
    }
  ): Promise<Competition | null> => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'You need to be logged in to update competitions');
        return null;
      }
      // Log the payload for debugging
      console.log('DEBUG updateCompetition id:', competitionId, 'data:', competitionData);
      const payload = { ...competitionData };
      if (competitionData.participants) {
        payload.participants = competitionData.participants;
      }
      const response = await axios.put(
        `${API_URL}/competitions/${competitionId}/update/`,
        payload,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("Update competition response:", response.data);
      if (response.status === 200) {
        setCompetitions(prevCompetitions =>
          prevCompetitions.map(comp =>
            comp.id === competitionId
              ? {
                  ...comp,
                  title: competitionData.title,
                  description: competitionData.description,
                  start_date: competitionData.start_date,
                  end_date: competitionData.end_date
                  // Do NOT update participants here, as backend returns full object
                }
              : comp
          )
        );
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Error updating competition:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('DEBUG updateCompetition error response:', err.response.data);
        const errorMessage = err.response.data.message ||
                            err.response.data.error ||
                            JSON.stringify(err.response.data) ||
                            'Failed to update competition';
        Alert.alert('Error', errorMessage);
      } else {
        Alert.alert('Error', 'Failed to update competition');
      }
      return null;
    }
  };

  return {
    competitions,
    invitations,
    isLoading,
    error,
    fetchCompetitions,
    fetchInvitations,
    handleInvitation,
    createCompetition,
    inviteToCompetition,
    removeParticipant,
    getCompetitionDetails,
    leaveCompetition,
    updateCompetition
  };
};