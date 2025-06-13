import { useEffect } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import "../../global.css";
import colors from '../../assets/colors.js';

// Keep the splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const segments = useSegments();
    const router = useRouter();
    
    // Check auth and handle navigation on mount and when segments change
    useEffect(() => {
        const checkToken = async () => {
            const token = await AsyncStorage.getItem('authToken');
            console.log('Auth check - token exists:', !!token);
            

            if (!token && segments[0] !== '(auth)') {
                console.log('User is not authenticated, redirecting to login');
                router.replace('/(auth)/login');
            } else if (token && segments[0] === '(auth)') {
                console.log('User is authenticated, redirecting to home');
                router.replace('/(tabs)/');
            }
            await SplashScreen.hideAsync().catch(() => {});
        };
        
        checkToken();
    }, [segments]);

    return (
        <Stack 
            screenOptions={{
                contentStyle: { backgroundColor: colors.black },
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
                name="appblockselection"
                options={{
                    title: "Block Apps",
                    headerShown: false,
                    presentation: "modal"
                }}
            />
                <Stack.Screen
                name="blockscreen"
                options={{
                    title: "App Blocked",
                    headerShown: false,
                    presentation: "fullScreenModal"
                }}
            />
        </Stack>
    );
}