import { Stack } from 'expo-router'

const AuthLayout = () => {
    return <Stack>
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