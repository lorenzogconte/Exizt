import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router'

export default function index() {
  return (
    <View className='flex-1 bg-verydarkgreen justify-center items-center'>
        <Link href={'/login'} asChild>
          <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-md">
            <Text className="text-white font-bold">Login</Text>
          </TouchableOpacity>
        </Link>
    </View>
  );
}