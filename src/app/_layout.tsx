import { Stack } from 'expo-router';
import "../../global.css";
import colors from "../constants/Colors"

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen name='index' options={{ title : 'Exizt', 
                                                headerStyle: { backgroundColor: '#000000' }, 
                                                headerTintColor: '#FFFFFF',
                                                headerTitleStyle: {
                                                    fontSize: 26,
                                                },
                                                headerTitleAlign: 'center'}} 
            />
        </Stack>
    );
}