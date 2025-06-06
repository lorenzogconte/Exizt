import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import "../../global.css";
import colors from '../../assets/colors.js';

// Prevent auto-hiding the splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const router = useRouter();
    const [appIsReady, setAppIsReady] = useState(false);
    
    // Check auth status when app starts
    useEffect(() => {
        async function checkAuthAndPrepare() {
            try {
                // Check if user is logged in
                const token = await AsyncStorage.getItem('authToken');
                
                if (!token) {
                    // If no token found, redirect to login after a short delay
                    setTimeout(() => {
                        router.replace('/(auth)/login');
                    }, 100);
                }
            } catch (error) {
                console.error('Failed to check authentication:', error);
                // On error, safer to redirect to login
                setTimeout(() => {
                    router.replace('/(auth)/login');
                }, 100);
            } finally {
                // Mark app as ready
                setAppIsReady(true);
                
                // Hide splash screen with a small delay
                setTimeout(async () => {
                    await SplashScreen.hideAsync();
                }, 200);
            }
        }
        
        checkAuthAndPrepare();
    }, []);
    
    // While checking auth status, show nothing
    if (!appIsReady) {
        return null;
    }
    
    return <Stack screenOptions={{
        contentStyle: { backgroundColor: colors.deepblue }
        }} >
        <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
        />
        <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
        />
    </Stack>
}