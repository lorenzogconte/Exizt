import { Stack } from 'expo-router';
import "../../global.css";

export default function RootLayout() {
    return <Stack>
        <Stack.Screen
            name="(tabs)"
            options={{ headerShown: true }}
        />
        <Stack.Screen
            name="(auth)"
            options={{ headerShown: true }}
        />
    </Stack>
}