import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router'

export default function index() {
  return (
    <View className='flex-1 bg-black justify-center items-center'>
        <Link href={'/sign-in'} asChild>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-md">
            <Text className="text-white font-bold">Authentication</Text>
          </TouchableOpacity>
        </Link>
    </View>
  );
}