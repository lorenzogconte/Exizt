import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Modal, 
  SafeAreaView, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '../../../assets/colors.js';
import { useCompetitions } from '../../hooks/useCompetitions';
import { Competition, Invitation } from '../../models/competitionModel';
import { CompetitionForm, CompetitionFormData } from '../../components/CompetitionForm';
export default function CompetitionsScreen() {
  const { 
    competitions, 
    invitations, 
    isLoading, 
    error, 
    handleInvitation,
    fetchCompetitions,
    fetchInvitations,
    createCompetition,
    inviteToCompetition
  } = useCompetitions();
  
  const [invitationsModalVisible, setInvitationsModalVisible] = useState(false);
  const [createCompetitionModalVisible, setCreateCompetitionModalVisible] = useState(false);
  const [inviteFriendsModalVisible, setInviteFriendsModalVisible] = useState(false);
  const [newCompetitionId, setNewCompetitionId] = useState<number | null>(null);
  
  // Form states for creating competition
  const [competitionName, setCompetitionName] = useState('');
  const [competitionDescription, setCompetitionDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // One week from now
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);
  const [createCompetitionError, setCreateCompetitionError] = useState('');
  
  // States for inviting friends
  const [friendUsername, setFriendUsername] = useState('');
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  
  useEffect(() => {
    fetchCompetitions();
    fetchInvitations();
  }, []);

  const navigateToCreateCompetition = () => {
    setCreateCompetitionModalVisible(true);
  };

  const navigateToCompetitionDetails = (competitionId: number) => {
    router.push({
      pathname: '/competitiondetail',
      params: { id: competitionId }
    });
  };
  
  // Reset all form states
  const resetFormStates = () => {
    setCompetitionName('');
    setCompetitionDescription('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setCreateCompetitionError('');
    setFriendUsername('');
    setInvitedFriends([]);
    setInviteError('');
  };

  const handleCreateCompetition = async () => {
    // Form validation
    if (!competitionName.trim()) {
      setCreateCompetitionError('Please enter a competition name');
      return;
    }
    
    if (startDate >= endDate) {
      setCreateCompetitionError('End date must be after start date');
      return;
    }

    try {
      setIsCreatingCompetition(true);
      setCreateCompetitionError('');
      
      const newCompetition = await createCompetition({
        title: competitionName,
        description: competitionDescription,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      });
      
      if (newCompetition) {
        setNewCompetitionId(newCompetition.id);
        setCreateCompetitionModalVisible(false);
        setInviteFriendsModalVisible(true);
      } else {
        setCreateCompetitionError('Failed to create competition');
      }
    } catch (err) {
      console.error('Error in handleCreateCompetition:', err);
      setCreateCompetitionError('An error occurred. Please try again.');
    } finally {
      setIsCreatingCompetition(false);
    }
  };

// Handle inviting a friend
const handleInviteFriend = async () => {
  if (!friendUsername.trim()) {
    setInviteError('Please enter a username');
    return;
  }
  
  if (invitedFriends.includes(friendUsername)) {
    setInviteError('You have already invited this friend');
    return;
  }
  
  if (!newCompetitionId) {
    setInviteError('Competition ID not found');
    return;
  }

  try {
    setIsInviting(true);
    setInviteError('');
    
    // Just send the username to the backend - it will validate friend status
    const success = await inviteToCompetition(newCompetitionId, friendUsername);
    
    if (success) {
      setInvitedFriends([...invitedFriends, friendUsername]);
      setFriendUsername('');
    } else {
      // The error alert is handled in the inviteToCompetition function
      // but we'll set a generic error in the UI
      setInviteError('Could not invite this user');
    }
  } catch (err) {
    console.error('Error inviting friend:', err);
    setInviteError('An error occurred while sending the invitation');
  } finally {
    setIsInviting(false);
  }
};

// Finish the invitation process
const finishInvitations = () => {
  setInviteFriendsModalVisible(false);
  resetFormStates();
  // Navigate to the competition details page if we have a new competition ID
  if (newCompetitionId) {
    navigateToCompetitionDetails(newCompetitionId);
  }
};
  // Render a competition item with proper typing
  const renderCompetitionItem = ({ item }: { item: Competition }) => (
    <TouchableOpacity 
      className="bg-gray-800 rounded-lg p-4 mb-3"
      onPress={() => navigateToCompetitionDetails(item.id)}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-verylightgreen font-bold text-xl">{item.title}</Text>
        {item.is_active ? (
          <View className="bg-green-500 px-2 py-1 rounded">
            <Text className="text-black text-xs font-bold">ACTIVE</Text>
          </View>
        ) : (
          <View className="bg-gray-600 px-2 py-1 rounded">
            <Text className="text-white text-xs">ENDED</Text>
          </View>
        )}
      </View>
      
      <Text className="text-lightgrey mb-3" numberOfLines={2}>
        {item.description || 'No description provided.'}
      </Text>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={16} color={colors.lightgrey} />
          <Text className="text-lightgrey text-sm ml-1">
            {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={16} color={colors.lightgrey} />
          <Text className="text-lightgrey text-sm ml-1">{item.participants_count}</Text>
        </View>
      </View>
      
    </TouchableOpacity>
  );

  // Render an invitation item with proper typing
  const renderInvitationItem = ({ item }: { item: Invitation }) => (
    <View className="bg-gray-800 rounded-lg p-4 mb-3">
      <View className="flex-row items-start mb-3">
        {item.sender.avatar ? (
          <Image 
            source={{ uri: item.sender.avatar }} 
            className="w-10 h-10 rounded-full mr-3" 
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-purple-700 justify-center items-center mr-3">
            <Text className="text-white text-lg font-bold">
              {item.sender.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        
        <View className="flex-1">
          <Text className="text-white">
            <Text className="font-bold">{item.sender.username}</Text>
            <Text> invited you to join </Text>
            <Text className="text-verylightgreen font-bold">{item.competition.title}</Text>
          </Text>
          
          <Text className="text-gray-400 text-xs mt-1">
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      </View>
      
      <Text className="text-lightgrey mb-3" numberOfLines={2}>
        {item.competition.description || 'No description provided.'}
      </Text>
      
      <View className="flex-row mb-2">
        <Text className="text-gray-400 text-xs">Dates: </Text>
        <Text className="text-lightgrey text-xs">
          {new Date(item.competition.start_date).toLocaleDateString()} - {new Date(item.competition.end_date).toLocaleDateString()}
        </Text>
      </View>
      
      <View className="flex-row justify-end space-x-3 mt-2">
        <TouchableOpacity 
          className="bg-red-500 px-4 py-2 rounded-md"
          onPress={() => handleInvitation(item.id, 'decline')}
        >
          <Text className="text-white font-bold">Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-verylightgreen px-4 py-2 rounded-md"
          onPress={() => handleInvitation(item.id, 'accept')}
        >
          <Text className="text-black font-bold">Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-black pt-12">
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className="text-verylightgreen text-2xl font-bold">Competitions</Text>
        
        {/* Invitations Button */}
        <TouchableOpacity 
          onPress={() => setInvitationsModalVisible(true)}
          className="relative"
        >
          <Ionicons name="mail-outline" size={24} color={colors.verylightgreen} />
          {invitations.length > 0 && (
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
              <Text className="text-white text-xs font-bold">{invitations.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main content - Competitions List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.verylightgreen} />
          <Text className="text-lightgrey mt-2">Loading competitions...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="alert-circle-outline" size={48} color={colors.lightgrey} />
          <Text className="text-red-500 text-center mt-2">{error}</Text>
          <TouchableOpacity 
            onPress={fetchCompetitions} 
            className="bg-verylightgreen px-4 py-2 rounded-md mt-4"
          >
            <Text className="text-black font-bold">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : competitions.length > 0 ? (
        <>
          <FlatList<Competition>
            data={competitions}
            renderItem={renderCompetitionItem}
            keyExtractor={(item) => item.id.toString()}
            className="px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 70 }}
          />
          
          <View className="absolute mx-16 mb-20 bottom-2 left-0 right-0 px-4 pb-4 pt-2 bg-black border-t border-gray-800">
            <TouchableOpacity 
              onPress={navigateToCreateCompetition} 
              className="bg-verylightgreen py-3 rounded-md flex-row items-center justify-center"
            >
              <Ionicons name="add" size={18} color="#000" />
              <Text className="text-black font-bold ml-1">Create Competition</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="trophy-outline" size={64} color={colors.lightgrey} />
          <Text className="text-lightgrey text-center mt-4 text-lg">
            You're not participating in any competitions yet
          </Text>
          <TouchableOpacity 
            onPress={navigateToCreateCompetition} 
            className="bg-verylightgreen px-6 py-3 rounded-md mt-6 flex-row items-center"
          >
            <Ionicons name="add" size={18} color="#000" />
            <Text className="text-black font-bold ml-1">Create Competition</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Invitations Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={invitationsModalVisible}
        onRequestClose={() => setInvitationsModalVisible(false)}
      >
        <View className="flex-1 bg-black/90">
          <SafeAreaView className="flex-1">
            <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-800">
              <Text className="text-verylightgreen text-xl font-bold">Competition Invitations</Text>
              <TouchableOpacity onPress={() => setInvitationsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.lightgrey} />
              </TouchableOpacity>
            </View>
            
            {invitations.length > 0 ? (
              <FlatList<Invitation>
                data={invitations}
                renderItem={renderInvitationItem}
                keyExtractor={(item) => item.id.toString()}
                className="p-4"
              />
            ) : (
              <View className="flex-1 justify-center items-center p-4">
                <Ionicons name="mail-outline" size={64} color={colors.lightgrey} />
                <Text className="text-lightgrey text-center mt-4 text-lg">
                  No pending invitations
                </Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

    {/* Create Competition Modal */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={createCompetitionModalVisible}
      onRequestClose={() => setCreateCompetitionModalVisible(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/95">
          <SafeAreaView className="flex-1">
            <View className="px-4 py-3 flex-row justify-between items-center border-b border-gray-800">
              <Text className="text-verylightgreen text-xl font-bold">Create Competition</Text>
              <TouchableOpacity onPress={() => setCreateCompetitionModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.lightgrey} />
              </TouchableOpacity>
            </View>
            
            <CompetitionForm
              formData={{
                title: competitionName,
                description: competitionDescription,
                start_date: startDate,
                end_date: endDate
              }}
              setFormData={(data) => {
                setCompetitionName(data.title);
                setCompetitionDescription(data.description);
                setStartDate(data.start_date);
                setEndDate(data.end_date);
              }}
              startDatePickerOpen={startDatePickerOpen}
              setStartDatePickerOpen={setStartDatePickerOpen}
              endDatePickerOpen={endDatePickerOpen}
              setEndDatePickerOpen={setEndDatePickerOpen}
              errorMessage={createCompetitionError}
              isSubmitting={isCreatingCompetition}
              onSubmit={handleCreateCompetition}
              submitButtonText="Create Competition"
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
                <TouchableOpacity onPress={finishInvitations}>
                  <Text className="text-verylightgreen">Done</Text>
                </TouchableOpacity>
              </View>
              
              <View className="p-4 flex-1">
                <Text className="text-white text-lg mb-2">
                  Competition created successfully!
                </Text>
                <Text className="text-lightgrey mb-6">
                  Invite your friends to join the competition
                </Text>
                
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
                
                {/* Finish Button */}
                <TouchableOpacity 
                  className="bg-verylightgreen py-3 rounded-md flex-row items-center justify-center mt-6"
                  onPress={finishInvitations}
                >
                  <Text className="text-black font-bold">Finish</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}