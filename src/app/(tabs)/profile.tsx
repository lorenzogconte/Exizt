import React, { useState } from 'react';
import { SafeAreaView, View, Text, Image, ActivityIndicator, TouchableOpacity, Modal, FlatList, Pressable, TextInput, Alert, ScrollView } from 'react-native';
import { useProfile } from '../../hooks/useProfile';
import { useFriendships } from '../../hooks/useFriendships';
import { useAuth } from '../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../assets/colors.js';
import { UserModel } from '../../models/userModel';
import { FriendRequest } from '../../models/requestModel';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image as RNImage } from 'react-native';

export default function ProfileScreen() {
    const { 
        userData, 
        loading, 
        error,
        isEditing,
        isUpdating,
        editName,
        setEditName,
        editAvatar,
        setEditAvatar,
        setImageFile,
        startEditing,
        cancelEditing,
        saveProfileChanges
    } = useProfile();
    
    const { username, email, name, avatar } = userData;
    const params = useLocalSearchParams();
    const isCurrentUser = params.isCurrentUser;
    const { logout } = useAuth();
    
    const { 
        friends, 
        friendRequests, 
        friendsCount, 
        unreadRequestsCount,
        handleFriendRequest,
        removeFriend,
        sendFriendRequest,
        isLoading: friendsLoading
    } = useFriendships();
    
    // State for modals and friend request input
    const [friendsModalVisible, setFriendsModalVisible] = useState(false);
    const [requestsModalVisible, setRequestsModalVisible] = useState(false);
    const [addFriendModalVisible, setAddFriendModalVisible] = useState(false);
    const [friendUsername, setFriendUsername] = useState('');
    const [isRequestSending, setIsRequestSending] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');
    const [requestSuccess, setRequestSuccess] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout? This will clear all your local profile data.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", onPress: logout, style: "destructive" }
            ]
        );
    };
    
    // Loading and error states
    if (loading) return (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#6200ee" />
            <Text className="mt-3 text-base">Loading profile...</Text>
        </View>
    );
    
    if (error) return (
        <View className="flex-1 justify-center items-center p-5">
            <Text className="text-red-500 text-base text-center">{error}</Text>
        </View>
    );

    // Render functions for friends and requests
    const renderFriendItem = ({ item }: {item: UserModel}) => (
        <View className="flex-row items-center justify-between p-4 border-b border-gray-700">
            {item.avatar ? (
                <Image 
                    source={{ uri: item.avatar }} 
                    className="w-10 h-10 rounded-full mr-3"
                />
            ) : (
                <View className="w-10 h-10 rounded-full bg-purple-700 justify-center items-center mr-3">
                    <Text className="text-white text-lg font-bold">
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                </View>
            )}
            <View className="flex-1">
                <Text className="text-white font-bold">{item.username}</Text>
                <Text className="text-lightgrey">{item.name}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => removeFriend(item.id)}
                className="px-3 py-1 bg-red-500 rounded-md"
            >
                <Text className="text-white">Remove friend</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRequestItem = ({ item }: {item: FriendRequest}) => (
        <View className="flex-row items-center justify-between p-4 border-b border-gray-700">
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
                <Text className="text-white font-bold">{item.sender.username}</Text>
                <Text className="text-lightgrey">{item.sender.name}</Text>
            </View>
            <View className="flex-row">
                <TouchableOpacity 
                    onPress={() => handleFriendRequest(item.id, "accept")}
                    className="px-3 py-1 bg-verylightgreen rounded-md mr-2"
                >
                    <Text className="text-black">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => handleFriendRequest(item.id, "reject")}
                    className="px-3 py-1 bg-red-500 rounded-md"
                >
                    <Text className="text-white">Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView className="bg-black flex-1">
            <View className="pt-20">
                {/* Friend Requests Button */}
                <TouchableOpacity 
                    className="absolute top-12 right-4 z-10"
                    onPress={() => setRequestsModalVisible(true)}
                >
                    <View className="relative">
                        <Ionicons name="notifications" size={28} color={colors.verylightgreen} />
                        {unreadRequestsCount > 0 && (
                            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                                <Text className="text-white text-xs font-bold">{unreadRequestsCount}</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                <View className="p-5 items-center">
                    {isEditing ? (
                        // EDIT MODE UI
                        <View className="mb-5 items-center w-full">
                            {/* Avatar Preview with pencil overlay and click-to-edit */}
                            <View className="mb-4">
                                <Pressable
                                    onPress={async () => {
                                        // Request permissions
                                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                                        if (status !== 'granted') {
                                            Alert.alert('Permission Required', 'Please allow access to your photo library to select an avatar');
                                            return;
                                        }
                                        // Launch image picker
                                        const result = await ImagePicker.launchImageLibraryAsync({
                                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                            allowsEditing: true,
                                            aspect: [1, 1],
                                            quality: 0.7,
                                        });
                                        if (!result.canceled && result.assets && result.assets.length > 0) {
                                            const selectedImage = result.assets[0];
                                            setEditAvatar(selectedImage.uri);
                                            setImageFile(selectedImage);
                                        }
                                    }}
                                    style={{ alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <View style={{ position: 'relative' }}>
                                        {editAvatar ? (
                                            <Image 
                                                source={{ uri: editAvatar }} 
                                                className="w-24 h-24 rounded-full" 
                                            />
                                        ) : (
                                            <View className="w-24 h-24 rounded-full bg-purple-700 justify-center items-center">
                                                <Text className="text-white text-4xl font-bold">
                                                    {username && username.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                        )}
                                        {/* Pencil icon overlay - bottom right, slightly overlapping */}
                                        <View style={{ position: 'absolute', bottom: -6, right: -6, backgroundColor: "#AAFA92", borderRadius: 16, padding: 4, elevation: 2 }}>
                                            <Ionicons name="pencil" size={20} color="#000" />
                                        </View>
                                    </View>
                                </Pressable>
                            </View>
                            
                            {/* Edit Form Fields */}
                            <View className="w-full justify-center content-center">
                                    <View className="flex-col items-right mb-2 mr-4">
                                        <Text className="text-white text-lg">Name:</Text>
                                        <View className="border-b border-lightgrey">
                                            <TextInput
                                                value={editName}
                                                onChangeText={setEditName}
                                                placeholder="Your name"
                                                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-md text-xl"
                                                placeholderTextColor="#666"
                                            />
                                        </View>
                                    </View>
                                
                                {/* Action Buttons */}
                                <View className="flex-row justify-between mt-2">
                                    <TouchableOpacity
                                        className="bg-gray-600 px-14 py-2 rounded-full border border-lightgrey"
                                        onPress={cancelEditing}
                                        disabled={isUpdating}
                                    >
                                        <Text className="text-white font-bold">Cancel</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        className="bg-verylightgreen px-8 py-2 rounded-full"
                                        onPress={saveProfileChanges}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <ActivityIndicator size="small" color="#000" />
                                        ) : (
                                            <Text className="text-black font-bold">Save Changes</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    ) : (
                        // NORMAL MODE UI
                        <View className="mb-5 items-center">
                            {avatar ? (
                                <Image 
                                    source={{ uri: avatar }} 
                                    className="w-24 h-24 rounded-full" 
                                />
                            ) : (
                                <View className="w-24 h-24 rounded-full bg-purple-700 justify-center items-center">
                                    <Text className="text-white text-4xl font-bold">
                                        {username && username.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            )}
                            
                            {/* Name and username */}
                            <Text className="text-white text-xl font-bold mt-2">{name}</Text>
                            <Text className="text-lightgrey mb-2">@{username}</Text>

                            {/* Edit Profile Button */}
                            <TouchableOpacity 
                                className="flex-row items-center bg-white px-4 py-1 rounded-full mb-2"
                                onPress={startEditing}
                            >
                                <Ionicons name="pencil" size={14} color={colors.black} />
                                <Text className="text-black ml-1">Edit Profile</Text>
                            </TouchableOpacity>
                            
                            {/* Friends count */}
                            <TouchableOpacity 
                                className="mt-1" 
                                onPress={() => setFriendsModalVisible(true)}
                            >
                                <Text className="text-verylightgreen text-center">
                                    <Text className="font-bold">{friendsCount}</Text> Friends
                                </Text>
                            </TouchableOpacity>

                            {/* Add Friend Button */}
                            <TouchableOpacity 
                                className="flex-row items-center mt-3 bg-verylightgreen px-4 py-2 rounded-full"
                                onPress={() => {
                                    setAddFriendModalVisible(true);
                                    setFriendUsername('');
                                    setRequestMessage('');
                                }}
                            >
                                <Ionicons name="person-add" size={16} color="black" />
                                <Text className="text-black font-bold ml-2">Add Friend</Text>
                            </TouchableOpacity>
                            
                        </View>
                    )}
                    
                    {/* Logout button - only show when not editing */}
                    {!isEditing && (
                        <TouchableOpacity
                            className="bg-red-500 px-8 py-3 rounded-full mt-8 bottom-1" 
                            onPress={handleLogout}
                        >
                            <Text className="text-white font-bold text-center">Logout</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Friends Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={friendsModalVisible}
                    onRequestClose={() => setFriendsModalVisible(false)}
                >
                    <View className="flex-1 bg-black/80 justify-center">
                        <View className="m-5 bg-gray-900 rounded-lg p-5 max-h-3/4">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-verylightgreen text-xl font-bold">Friends</Text>
                                <TouchableOpacity onPress={() => setFriendsModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={colors.lightgrey} />
                                </TouchableOpacity>
                            </View>
                            
                            {friendsLoading ? (
                                <ActivityIndicator size="large" color={colors.verylightgreen} />
                            ) : friends.length > 0 ? (
                                <FlatList
                                    data={friends}
                                    renderItem={renderFriendItem}
                                    keyExtractor={(item) => item.id.toString()}
                                />
                            ) : (
                                <Text className="text-lightgrey text-center py-4">You're not friends with anyone yet.</Text>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Friend Requests Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={requestsModalVisible}
                    onRequestClose={() => setRequestsModalVisible(false)}
                >
                    <View className="flex-1 bg-black/80 justify-center">
                        <View className="m-5 bg-gray-900 rounded-lg p-5 max-h-3/4">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-verylightgreen text-xl font-bold">Friend Requests</Text>
                                <TouchableOpacity onPress={() => setRequestsModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={colors.lightgrey} />
                                </TouchableOpacity>
                            </View>
                            
                            {friendsLoading ? (
                                <ActivityIndicator size="large" color={colors.verylightgreen} />
                            ) : friendRequests.length > 0 ? (
                                <FlatList
                                    data={friendRequests}
                                    renderItem={renderRequestItem}
                                    keyExtractor={(item) => item.id.toString()}
                                />
                            ) : (
                                <Text className="text-lightgrey text-center py-4">No pending friend requests.</Text>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Add Friend Modal */}
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={addFriendModalVisible}
                    onRequestClose={() => {
                        setAddFriendModalVisible(false);
                        setFriendUsername('');
                        setRequestMessage('');
                    }}
                >
                    <View className="flex-1 bg-black/80 justify-center items-center">
                        <View className="bg-gray-900 rounded-lg p-5 w-4/5">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-verylightgreen text-xl font-bold">Add Friend</Text>
                                <TouchableOpacity onPress={() => {
                                    setAddFriendModalVisible(false);
                                    setFriendUsername('');
                                    setRequestMessage('');
                                }}>
                                    <Ionicons name="close" size={24} color={colors.lightgrey} />
                                </TouchableOpacity>
                            </View>

                            {/* Username Input */}
                            <View className="mb-4">
                                <View className="flex-row items-center bg-lightgrey rounded-md px-3">
                                    <TextInput
                                        value={friendUsername}
                                        onChangeText={setFriendUsername}
                                        placeholder="username"
                                        className="flex-1 py-2 text-black"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    {friendUsername.length > 0 && (
                                        <TouchableOpacity onPress={() => setFriendUsername('')}>
                                            <Ionicons name="close-circle" size={20} color={colors.lightgrey} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Status message */}
                            {requestMessage ? (
                                <Text 
                                    className={`mb-4 text-center ${
                                        requestSuccess ? 'text-verylightgreen' : 'text-red-500'
                                    }`}
                                >
                                    {requestMessage}
                                </Text>
                            ) : null}

                            {/* Send Button */}
                            <TouchableOpacity
                                onPress={async () => {
                                    if (!friendUsername.trim()) return;
                                    
                                    setIsRequestSending(true);
                                    try {
                                        const success = await sendFriendRequest(friendUsername.trim());
                                        setRequestSuccess(success);
                                        if (success) {
                                            setRequestMessage(`Friend request sent to @${friendUsername}!`);
                                            setFriendUsername('');
                                        } else {
                                            setRequestMessage('Failed to send friend request');
                                        }
                                    } catch (error) {
                                        console.error('Error sending friend request:', error);
                                        setRequestSuccess(false);
                                        setRequestMessage('Error sending friend request');
                                    } finally {
                                        setIsRequestSending(false);
                                    }
                                }}
                                disabled={isRequestSending || !friendUsername.trim()}
                                className={`py-3 rounded-md ${
                                    isRequestSending || !friendUsername.trim() ? 'bg-gray-500' : 'bg-verylightgreen'
                                }`}
                            >
                                {isRequestSending ? (
                                    <ActivityIndicator size="small" color="#000000" />
                                ) : (
                                    <Text className="text-black font-bold text-center">Send Friend Request</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </ScrollView>
    );
}