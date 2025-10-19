import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Modal, 
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ScrollView, TextInput} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import colors from '../../../assets/colors.js';
import { useCompetitions } from '../../hooks/useCompetitions';
import { Competition, CompetitionParticipant } from '../../models/competitionModel';
import { CompetitionForm, CompetitionFormData } from '../../components/CompetitionForm';

export default function CompetitionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const competitionId = Number(id);
  const { getCompetitionDetails, inviteToCompetition, leaveCompetition, removeParticipant, updateCompetition } = useCompetitions();
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserCreator, setIsUserCreator] = useState(false);
  
  // Edit modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [formData, setFormData] = useState<CompetitionFormData>({
    title: '',
    description: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Invite friends modal states
  const [inviteFriendsModalVisible, setInviteFriendsModalVisible] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  
  useEffect(() => {
    fetchCompetitionDetails();
  }, [competitionId]);
  
  const fetchCompetitionDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getCompetitionDetails(competitionId);

      if (data) {
        setCompetition(data.competition);
        setParticipants(data.participants || []);
        console.log('Fetched participants:', data.participants);
        // Debug userId and creator.id
        const userId = await AsyncStorage.getItem('userId');
        const creatorId = data.competition?.creator?.id;
        console.log('DEBUG userId from AsyncStorage:', userId, 'type:', typeof userId);
        console.log('DEBUG creatorId from competition:', creatorId, 'type:', typeof creatorId);
        setIsUserCreator(data.isCreator);

        if (data.competition) {
          setFormData({
            title: data.competition.title,
            description: data.competition.description || '',
            start_date: new Date(data.competition.start_date),
            end_date: new Date(data.competition.end_date)
          });
        }
      } else {
        setError('Could not load competition details');
      }
    } catch (err) {
      console.error('Error in fetchCompetitionDetails:', err);
      setError('Failed to load competition details');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditCompetition = async () => {
    if (!formData.title.trim()) {
        setErrorMessage('Please enter a competition name');
        return;
    }
    if (formData.start_date >= formData.end_date) {
        setErrorMessage('End date must be after start date');
        return;
    }
    try {
        setIsSubmitting(true);
        setErrorMessage('');
        
        const updatedCompetition = await updateCompetition(
        competitionId,
        {
            title: formData.title,
            description: formData.description,
            start_date: formData.start_date.toISOString(),
            end_date: formData.end_date.toISOString(),
        }
        );
        if (updatedCompetition) {
        setEditModalVisible(false);
        fetchCompetitionDetails(); // Refresh data
        } else {
        setErrorMessage('Failed to update competition');
        }
    } catch (err) {
        console.error('Error in handleEditCompetition:', err);
        setErrorMessage('An error occurred. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleInviteFriend = async () => {
    if (!friendUsername.trim()) {
      setInviteError('Please enter a username');
      return;
    }
    
    if (invitedFriends.includes(friendUsername)) {
      setInviteError('You have already invited this friend');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError('');
      
      const success = await inviteToCompetition(competitionId, friendUsername);
      
      if (success) {
        setInvitedFriends([...invitedFriends, friendUsername]);
        setFriendUsername('');
      } else {
        setInviteError('Could not invite this user');
      }
    } catch (err) {
      console.error('Error inviting friend:', err);
      setInviteError('An error occurred while sending the invitation');
    } finally {
      setIsInviting(false);
    }
  };
  
  const handleLeaveCompetition = async () => {
    Alert.alert(
      "Leave Competition",
      "Are you sure you want to leave this competition? Your progress will be lost.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Leave", 
          style: "destructive",
          onPress: async () => {
            const success = await leaveCompetition(competitionId);
            if (success) {
              router.back();
            }
          }
        }
      ]
    );
  };
  
  const renderParticipantItem = ({ item, index }: { item: CompetitionParticipant, index: number }) => (
  <View className="bg-gray-800 rounded-lg p-4 mb-3 flex-row items-center">
    <Text className="text-white font-bold w-8 text-center">{index + 1}</Text>

    <View className="flex-row items-center flex-1">
      {item.user && item.user.avatar ? (
        <Image 
          source={{ uri: item.user.avatar }} 
          className="w-10 h-10 rounded-full mr-3" 
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-purple-700 justify-center items-center mr-3">
          <Text className="text-white text-lg font-bold">
            {item.user && item.user.username
              ? item.user.username.charAt(0).toUpperCase()
              : "?"}
          </Text>
        </View>
      )}
      <View>
        <Text className="text-white">{item.user && item.user.username ? item.user.username : "Unknown"}</Text>
        {competition && item.user && item.user.id === competition.creator.id && (
          <View className="bg-verylightgreen rounded-full px-2 py-1 mt-1 items-center">
            <Text className="text-black text-xs font-bold">Creator</Text>
          </View>
        )}
      </View>
    </View>

    {competition && competition.status === 'active' && (
      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={16} color={colors.lightgrey} />
        <Text className="text-lightgrey text-sm ml-1">
          {(() => {
            const minutes = item.average_daily_use !== null && item.average_daily_use !== undefined
              ? Math.round(item.average_daily_use)
              : null;
            if (minutes === null) return 'N/A';
            if (minutes < 60) return `${minutes}m`;
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
          })()}
        </Text>
      </View>
    )}
  </View>
);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black pt-12">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.verylightgreen} />
          <Text className="text-lightgrey mt-2">Loading competition details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !competition) {
    return (
      <SafeAreaView className="flex-1 bg-black pt-12">
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color={colors.lightgrey} />
          <Text className="text-red-500 text-center mt-2">{error || 'Competition not found'}</Text>
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="bg-verylightgreen px-4 py-2 rounded-md mt-4"
          >
            <Text className="text-black font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black pt-12">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 mb-4">
        <TouchableOpacity onPress={() => router.replace('/(tabs)/competitions')}>
          <Ionicons name="arrow-back" size={24} color={colors.verylightgreen} />
        </TouchableOpacity>
        <Text className="text-verylightgreen text-xl font-bold">Competition Details</Text>
        {isUserCreator ? (
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            <Ionicons name="pencil" size={24} color={colors.verylightgreen} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>
      
      {/* Competition Info */}
      <View className="bg-gray-800 rounded-lg p-4 mx-4 mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-verylightgreen font-bold text-xl">{competition.title}</Text>
          {competition.status === 'active' && (
            <View className="bg-green-500 px-2 py-1 rounded">
              <Text className="text-black text-xs font-bold">ACTIVE</Text>
            </View>
          )}
          {competition.status === 'upcoming' && (
            <View className="bg-yellow-400 px-2 py-1 rounded">
              <Text className="text-black text-xs font-bold">UPCOMING</Text>
            </View>
          )}
          {competition.status === 'completed' && (
            <View className="bg-gray-600 px-2 py-1 rounded">
              <Text className="text-white text-xs font-bold">COMPLETED</Text>
            </View>
          )}
        </View>
        
        <Text className="text-lightgrey mb-3">
          {competition.description || 'No description provided.'}
        </Text>
        
        <View className="flex-row mb-2">
          <View className="flex-row items-center flex-1">
            <Ionicons name="calendar-outline" size={16} color={colors.lightgrey} />
            <Text className="text-lightgrey text-sm ml-1">
              {new Date(competition.start_date).toLocaleDateString()} - {new Date(competition.end_date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={16} color={colors.lightgrey} />
          <Text className="text-lightgrey text-sm ml-1">{competition.participant_count} participants</Text>
        </View>
        
        <View className="flex-row items-center mt-3">
          <Text className="text-lightgrey text-xs">Created by </Text>
          <Text className="text-verylightgreen text-xs">@{competition.creator.username}</Text>
        </View>
      </View>
      
      {/* Participants/Leaderboard Section */}
      <View className="flex-row justify-between items-center px-4 mb-2">
        <Text className="text-white font-bold text-lg">
          {competition.status === 'active' ? 'Leaderboard' : 'Participants'}
        </Text>
        {isUserCreator && (
          <TouchableOpacity onPress={() => setInviteFriendsModalVisible(true)}>
            <Text className="text-verylightgreen">Invite Friends</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Participants List */}
      <FlatList
        data={participants}
        renderItem={renderParticipantItem}
        keyExtractor={(item) => item.id.toString()}
        className="px-4"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-lightgrey text-center">No participants yet</Text>
          </View>
        }
      />
      
      {/* Edit Competition Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/95">
            <SafeAreaView className="flex-1">
              <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-800">
                <Text className="text-verylightgreen text-xl font-bold">Edit Competition</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={colors.lightgrey} />
                </TouchableOpacity>
              </View>
              
              <CompetitionForm
                formData={formData}
                setFormData={setFormData}
                startDatePickerOpen={startDatePickerOpen}
                setStartDatePickerOpen={setStartDatePickerOpen}
                endDatePickerOpen={endDatePickerOpen}
                setEndDatePickerOpen={setEndDatePickerOpen}
                errorMessage={errorMessage}
                isSubmitting={isSubmitting}
                onSubmit={handleEditCompetition}
                submitButtonText="Save Changes"
                isEditMode={true}
                participants={participants}
                inviteParticipant={(username) => inviteToCompetition(competitionId, username)}
                removeParticipant={(participantId) => removeParticipant(competitionId, participantId)}
                isCreator={isUserCreator}
                competitionStatus={competition?.status}
              />
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Invite Friends Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteFriendsModalVisible}
        onRequestClose={() => setInviteFriendsModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 bg-black/95">
            <SafeAreaView className="flex-1">
              <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-800">
                <Text className="text-verylightgreen text-xl font-bold">Invite Friends</Text>
                <TouchableOpacity onPress={() => setInviteFriendsModalVisible(false)}>
                  <Text className="text-verylightgreen">Done</Text>
                </TouchableOpacity>
              </View>
              
              <View className="p-4 flex-1">
                {/* Friend Username Input */}
                <View className="flex-row items-center mb-4">
                  <TextInput
                    className="bg-gray-800 text-white p-3 rounded-md flex-1 mr-2"
                    placeholder="Enter username"
                    placeholderTextColor="#6b7280"
                    value={friendUsername}
                    onChangeText={setFriendUsername}
                  />
                  <TouchableOpacity 
                    className={`bg-verylightgreen p-3 rounded-md ${isInviting ? 'opacity-50' : ''}`}
                    onPress={handleInviteFriend}
                    disabled={isInviting}
                  >
                    {isInviting ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Ionicons name="send" size={18} color="#000" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Error Message */}
                {inviteError ? (
                  <Text className="text-red-500 mb-4">{inviteError}</Text>
                ) : null}
                
                {/* Invited Friends List */}
                {invitedFriends.length > 0 && (
                  <>
                    <Text className="text-lightgrey mt-4 mb-2">Invited Friends:</Text>
                    <ScrollView className="flex-1">
                      {invitedFriends.map((username, index) => (
                        <View key={index} className="bg-gray-800 p-3 rounded-md mb-2 flex-row items-center">
                          <View className="w-8 h-8 rounded-full bg-purple-700 justify-center items-center mr-3">
                            <Text className="text-white font-bold">
                              {username.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <Text className="text-white">{username}</Text>
                          <Ionicons name="checkmark-circle" size={16} color={colors.verylightgreen} style={{ marginLeft: 'auto' }} />
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}