import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from 'react-native-date-picker';
import { format } from 'date-fns';
import colors from '../../assets/colors.js';
import { CompetitionParticipant } from '../models/competitionModel.js';

export interface CompetitionFormData {
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
}

interface CompetitionFormProps {
  formData: CompetitionFormData;
  setFormData: (data: CompetitionFormData) => void;
  startDatePickerOpen: boolean;
  setStartDatePickerOpen: (open: boolean) => void;
  endDatePickerOpen: boolean;
  setEndDatePickerOpen: (open: boolean) => void;
  errorMessage: string;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
  submitButtonText: string;
  // Participant management props
  isEditMode?: boolean;
  participants?: CompetitionParticipant[];
  inviteParticipant?: (username: string) => Promise<boolean>;
  removeParticipant?: (participantId: number) => Promise<boolean>;
  isCreator?: boolean;
}

export const CompetitionForm: React.FC<CompetitionFormProps> = ({
  formData,
  setFormData,
  startDatePickerOpen,
  setStartDatePickerOpen,
  endDatePickerOpen,
  setEndDatePickerOpen,
  errorMessage,
  isSubmitting,
  onSubmit,
  submitButtonText,
  isEditMode = false,
  participants = [],
  inviteParticipant = async () => false,
  removeParticipant = async () => false,
  isCreator = false
}) => {
  // State for participant management
  const [newParticipantUsername, setNewParticipantUsername] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showParticipantSection, setShowParticipantSection] = useState(isEditMode);

  // Remove the fetchCompetitionDetails function - it should be in the parent component

  const handleConfirmStartDate = (date: Date) => {
    setStartDatePickerOpen(false);
    setFormData({
      ...formData,
      start_date: date
    });
  };
  
  const handleConfirmEndDate = (date: Date) => {
    setEndDatePickerOpen(false);
    setFormData({
      ...formData,
      end_date: date
    });
  };

  const handleInviteParticipant = async () => {
    if (!newParticipantUsername.trim()) {
      setInviteError('Please enter a username');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError('');
      
      const success = await inviteParticipant(newParticipantUsername);
      
      if (success) {
        setNewParticipantUsername('');
      } else {
        setInviteError('Could not invite this user');
      }
    } catch (err) {
      console.error('Error inviting participant:', err);
      setInviteError('An error occurred while sending the invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveParticipant = async (participant: CompetitionParticipant) => {
    // Confirm before removing
    Alert.alert(
      "Remove Participant",
      `Are you sure you want to remove ${participant.user.username} from the competition?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: async () => {
            try {
              const success = await removeParticipant(participant.id);
              if (!success) {
                Alert.alert("Error", "Failed to remove participant");
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              Alert.alert("Error", "An error occurred while removing the participant");
            }
          }
        }
      ]
    );
  };

  const renderParticipantItem = ({ item }: { item: CompetitionParticipant }) => (
    <View className="bg-gray-700 rounded-lg p-3 mb-2 flex-row items-center">
      {item.user.avatar ? (
        <Image 
          source={{ uri: item.user.avatar }} 
          className="w-8 h-8 rounded-full mr-3" 
        />
      ) : (
        <View className="w-8 h-8 rounded-full bg-purple-700 justify-center items-center mr-3">
          <Text className="text-white text-sm font-bold">
            {item.user.username.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text className="text-white flex-1">{item.user.username}</Text>
      
      {isCreator && (
        <TouchableOpacity 
          onPress={() => handleRemoveParticipant(item)}
          className="p-2"
        >
          <Ionicons name="close-circle" size={20} color={colors.lightgrey} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView className="p-4 flex-1">
      {/* Competition Name Input */}
      <Text className="text-lightgrey mb-2">Competition Title*</Text>
      <TextInput
        className="bg-gray-800 text-white p-3 rounded-md mb-4"
        placeholder="Enter competition name"
        placeholderTextColor="#6b7280"
        value={formData.title}
        onChangeText={(text) => setFormData({...formData, title: text})}
      />
      
      {/* Description Input */}
      <Text className="text-lightgrey mb-2">Description (Optional)</Text>
      <TextInput
        className="bg-gray-800 text-white p-3 rounded-md mb-4 h-24"
        placeholder="Describe your competition"
        placeholderTextColor="#6b7280"
        multiline={true}
        textAlignVertical="top"
        value={formData.description}
        onChangeText={(text) => setFormData({...formData, description: text})}
      />
      
      {/* Start Date Picker */}
      <Text className="text-lightgrey mb-2">Start Date*</Text>
      <TouchableOpacity 
        className="bg-gray-800 p-3 rounded-md mb-4 flex-row justify-between items-center"
        onPress={() => setStartDatePickerOpen(true)}
      >
        <Text className="text-white">
          {format(formData.start_date, 'MMMM d, yyyy')}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.lightgrey} />
      </TouchableOpacity>
      
      {/* End Date Picker */}
      <Text className="text-lightgrey mb-2">End Date*</Text>
      <TouchableOpacity 
        className="bg-gray-800 p-3 rounded-md mb-6 flex-row justify-between items-center"
        onPress={() => setEndDatePickerOpen(true)}
      >
        <Text className="text-white">
          {format(formData.end_date, 'MMMM d, yyyy')}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.lightgrey} />
      </TouchableOpacity>
      
      {/* Modal Date Pickers */}
      <DatePicker
        modal
        open={startDatePickerOpen}
        date={formData.start_date}
        mode="date"
        minimumDate={new Date()}
        onConfirm={handleConfirmStartDate}
        onCancel={() => setStartDatePickerOpen(false)}
      />
      
      <DatePicker
        modal
        open={endDatePickerOpen}
        date={formData.end_date}
        mode="date"
        minimumDate={new Date(formData.start_date.getTime() + 24 * 60 * 60 * 1000)}
        onConfirm={handleConfirmEndDate}
        onCancel={() => setEndDatePickerOpen(false)}
      />
      
      {/* Participant Management Section (Only in Edit Mode) */}
      {isEditMode && (
        <View className="mt-2 mb-6">
          <TouchableOpacity 
            onPress={() => setShowParticipantSection(!showParticipantSection)}
            className="flex-row items-center mb-3"
          >
            <Text className="text-verylightgreen font-bold text-lg">Participants</Text>
            <Ionicons 
              name={showParticipantSection ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.verylightgreen} 
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          
          {showParticipantSection && (
            <>
              {/* Participant List */}
              {participants.length > 0 ? (
                <FlatList
                  data={participants}
                  renderItem={renderParticipantItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  ListHeaderComponent={
                    <Text className="text-lightgrey mb-2">Current participants ({participants.length})</Text>
                  }
                />
              ) : (
                <Text className="text-gray-500 italic mb-3">No participants yet</Text>
              )}
              
              {/* Invite New Participant (if user is creator) */}
              {isCreator && (
                <>
                  <Text className="text-lightgrey mt-4 mb-2">Invite new participant</Text>
                  <View className="flex-row items-center mb-2">
                    <TextInput
                      className="bg-gray-800 text-white p-3 rounded-md flex-1 mr-2"
                      placeholder="Enter username"
                      placeholderTextColor="#6b7280"
                      value={newParticipantUsername}
                      onChangeText={setNewParticipantUsername}
                    />
                    <TouchableOpacity 
                      className={`bg-verylightgreen p-3 rounded-md ${isInviting ? 'opacity-50' : ''}`}
                      onPress={handleInviteParticipant}
                      disabled={isInviting}
                    >
                      {isInviting ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Ionicons name="send" size={18} color="#000" />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {/* Invite Error Message */}
                  {inviteError ? (
                    <Text className="text-red-500 mb-3">{inviteError}</Text>
                  ) : null}
                </>
              )}
            </>
          )}
        </View>
      )}
      
      {/* Error Message */}
      {errorMessage ? (
        <Text className="text-red-500 mb-4 text-center">{errorMessage}</Text>
      ) : null}
      
      {/* Submit Button */}
      <TouchableOpacity 
        className={`py-3 rounded-md flex-row items-center justify-center mb-6 ${isSubmitting ? 'bg-gray-600' : 'bg-verylightgreen'}`}
        onPress={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <>
            <Ionicons name="checkmark" size={18} color="#000" />
            <Text className="text-black font-bold ml-1">{submitButtonText}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default CompetitionForm;