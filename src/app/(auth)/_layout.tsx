import { Stack } from 'expo-router'

const AuthLayout = () => {
    return <Stack>
        <Stack.Screen
        name="sign-in"
        options={{ 
          title: "Sign In", 
          headerShown: false 
        }}
      />
    </Stack>
}

export default AuthLayout