import { Stack } from 'expo-router';
import "../../global.css";
import colors from '../../assets/colors.js';

export default function RootLayout() {
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