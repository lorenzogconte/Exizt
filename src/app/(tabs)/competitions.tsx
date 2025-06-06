import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '../../../assets/colors.js';
import { useCompetitions } from '../../hooks/useCompetitions';

export default function CompetitionsScreen() {
  const { 
    competitions, 
    invitations, 
    isLoading, 
    error, 
    acceptInvitation,
    declineInvitation,
    fetchCompetitions,
    fetchInvitations
  } = useCompetitions();
  
  const [invitationsModalVisible, setInvitationsModalVisible] = useState(false);
  
  // Refresh data when component mounts
  useEffect(() => {
    fetchCompetitions();
    fetchInvitations();
  }, []);

  // Handle accepting an invitation
  const handleAcceptInvitation = async (invitationId: number) => {
    const success = await acceptInvitation(invitationId);
    if (success) {
      await fetchCompetitions(); // Refresh competitions list
    }
  };

  // Handle declining an invitation
  const handleDeclineInvitation = async (invitationId: number) => {
    await declineInvitation(invitationId);
  };

  // Navigate to create competition screen
  const navigateToCreateCompetition = () => {
    router.push('/create-competition');
  };

  // Navigate to competition details
  const navigateToCompetitionDetails = (competitionId: number) => {
    router.push({
      pathname: '/competition-details',
      params: { id: competitionId }
    });
  };

  // Render a competition item
  const renderCompetitionItem = ({ item }) => (
    <TouchableOpacity 
      className="bg-gray-800 rounded-lg p-4 mb-3"
      onPress={() => navigateToCompetitionDetails(item.id)}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-verylightgreen font-bold text-xl">{item.name}</Text>
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
      
      <View className="flex-row items-center mt-3">
        <Text className="text-gray-500 text-xs">Created by </Text>
        <Text className="text-verylightgreen text-xs">@{item.creator.username}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render an invitation item
  const renderInvitationItem = ({ item }) => (
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
            <Text className="text-verylightgreen font-bold">{item.competition.name}</Text>
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
          onPress={() => handleDeclineInvitation(item.id)}
        >
          <Text className="text-white font-bold">Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="bg-verylightgreen px-4 py-2 rounded-md"
          onPress={() => handleAcceptInvitation(item.id)}
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
        <View className="flex-row space-x-4">
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
          
          {/* Create Competition Button */}
          <TouchableOpacity onPress={navigateToCreateCompetition}>
            <Ionicons name="add-circle-outline" size={24} color={colors.verylightgreen} />
          </TouchableOpacity>
        </View>
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
        <FlatList
          data={competitions}
          renderItem={renderCompetitionItem}
          keyExtractor={(item) => item.id.toString()}
          className="px-4"
          showsVerticalScrollIndicator={false}
        />
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
              <FlatList
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
    </SafeAreaView>
  );
}