import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, Image, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';

export default function ProfileScreen() {
    const [userData, setUserData] = useState({
        username: 'Not available',
        email: 'Not available',
        name: 'None',
        avatarURL: null
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Changed from https to http (you might need SSL configured for https)
                const response = await axios.get('http://10.0.2.2:8000/profile/');
                setUserData({
                    username: response.data.username || 'Not available',
                    email: response.data.email || 'Not available',
                    name: response.data.name || 'None',
                    avatarURL: response.data.avatarURL || null
                });
            } catch (err) {
                console.error('Error fetching user data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const { username, email, name, avatarURL } = userData;

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
    );
    
    if (error) return (
        <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.profileContainer}>
                <View style={styles.avatarContainer}>
                    {avatarURL ? (
                        <Image 
                            source={{ uri: avatarURL }} 
                            style={styles.avatar} 
                        />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <Text style={styles.placeholderText}>
                                {username && username.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Username:</Text>
                        <Text style={styles.value}>{username}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Email:</Text>
                        <Text style={styles.value}>{email}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{name}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Avatar URL:</Text>
                        <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                            {avatarURL || 'None'}
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

// Complete styles implementation
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    profileContainer: {
        padding: 20,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    placeholderAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#6200ee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
    },
    infoContainer: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 10,
    },
    label: {
        width: '30%',
        fontWeight: 'bold',
        color: '#555',
    },
    value: {
        width: '70%',
        color: '#333',
    },
});