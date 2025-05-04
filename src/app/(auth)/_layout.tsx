import { Stack } from 'expo-router'
import colors from '../../../assets/colors.js';

const AuthLayout = () => {
    return <Stack screenOptions={{
      contentStyle: { backgroundColor: colors.verydarkgreen }
      }} >
        <Stack.Screen
          name="login"
          options={{ 
            title: "Log In", 
            headerShown: false 
          }}
        />
        <Stack.Screen
          name="signup"
          options={{ 
            title: "Sign Up", 
            headerShown: false 
          }}
        />
    </Stack>
}

export default AuthLayout