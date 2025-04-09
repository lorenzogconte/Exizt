import { View, Text, TextInput } from 'react-native'

const SignIn = () => {
    return (
        <View className="flex-1 justify-center items-center">
            <TextInput
                placeholder='Email'
            />
            <TextInput
                placeholder="Password"
            />
        </View>
    );
};

export default SignIn