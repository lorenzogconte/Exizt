import { View, Text, TextInput, TouchableOpacity, Alert} from 'react-native'
import { Link } from 'expo-router'
import React, { useState } from 'react'
import axios from 'axios';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = async () => {
        try {
            const response = await axios.post('http://10.0.2.2:8000/signup/', {
                email,
                username,
                password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            Alert.alert('Success', 'Account created successfully!');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                // Handle Axios specific errors
                if (error.response) {
                    // The server responded with a status code outside of 2xx range
                    const errorMessage = error.response.data.message || 'Something went wrong.';
                    Alert.alert('Error', errorMessage);
                } else if (error.request) {
                    // The request was made but no response was received
                    Alert.alert('Error', 'No response from server. Check your connection.');
                } else {
                    // Something happened in setting up the request
                    Alert.alert('Error', 'Failed to make request.');
                }
            } else {
                // Handle non-Axios errors
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        }
    };

    return (
        <View className="flex-1 justify-center items-center">
            <TextInput
                placeholder='Email'
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                placeholder='Username'
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-md" onPress={handleSignUp}>
                <Text className="text-white font-bold">Sign Up</Text>
            </TouchableOpacity>
            
            <Link href={'/login'} asChild>
                <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-md">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
};

export default SignUp