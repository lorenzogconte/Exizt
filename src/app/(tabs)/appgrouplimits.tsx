import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList, Image } from 'react-native';
import { TimerPicker } from 'react-native-timer-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppBlock } from '../../hooks/useAppBlock';

export default function AppGroupLimits() {
	const {
		installedApps,
		appGroups,
		saveAppGroup,
		getAppGroups,
		fetchInstalledApps,
	} = useAppBlock();

	const [modalVisible, setModalVisible] = useState(false);
	const [groupName, setGroupName] = useState('');
	const [selectedApps, setSelectedApps] = useState<string[]>([]);
		const [selectedHour, setSelectedHour] = useState(0);
		const [selectedMinute, setSelectedMinute] = useState(0);

	useEffect(() => {
		fetchInstalledApps();
		getAppGroups();
	}, []);

		const handleCreateGroup = async () => {
				const totalMinutes = selectedHour * 60 + selectedMinute;
				if (!groupName || selectedApps.length === 0 || totalMinutes === 0) return;
				await saveAppGroup({
					name: groupName,
					apps: selectedApps,
					timeLimit: totalMinutes
				});
			setModalVisible(false);
			setGroupName('');
			setSelectedApps([]);
			getAppGroups();
		};

			return (
				<View className="flex-1 bg-black p-4">
					<Text className="text-green text-2xl font-bold mb-6">Usage limits</Text>
					<FlatList
						data={appGroups}
						keyExtractor={(item) => item.name}
						renderItem={({ item }) => (
							<View className="bg-gray-800 p-3 rounded-xl mb-3">
								<Text className="text-white font-bold">{item.name}</Text>
								<Text className="text-lightgrey">Apps: {item.apps.join(', ')}</Text>
								<Text className="text-green">Limit: {item.limit} min</Text>
							</View>
						)}
					/>
					<Modal visible={modalVisible} animationType="slide" transparent>
						<View className="flex-1 justify-center items-center bg-black bg-opacity-70">
							<View className="bg-gray-900 rounded-2xl p-6 w-11/12">
								<Text className="font-bold text-lg mb-2 text-white">Create App Group</Text>
								<TextInput
									placeholder="Group Name"
									value={groupName}
									onChangeText={setGroupName}
									className="bg-gray-800 rounded-lg p-2 mb-2 text-white"
									placeholderTextColor="#aaa"
								/>
								<Text className="mb-2 text-white">Select Apps:</Text>
								<FlatList
									data={installedApps}
									keyExtractor={(item) => item.packageName}
									style={{ maxHeight: 180 }}
									renderItem={({ item }) => (
										<TouchableOpacity
											className="flex-row items-center justify-between mb-2 bg-gray-800 rounded-lg px-2 py-1"
											onPress={() => {
												setSelectedApps(selectedApps.includes(item.packageName)
													? selectedApps.filter(pkg => pkg !== item.packageName)
													: [...selectedApps, item.packageName]);
											}}
										>
											<View className="flex-row items-center">
												{item.iconBase64 ? (
													<Image
														source={{ uri: `data:image/jpeg;base64,${item.iconBase64}` }}
														style={{ width: 28, height: 28, borderRadius: 6, marginRight: 10 }}
													/>
												) : (
													<View className="w-7 h-7 bg-gray-700 rounded-md items-center justify-center mr-2">
														<Text className="text-white font-bold">
															{item.appName?.charAt(0).toUpperCase() || item.packageName.split('.').pop()?.charAt(0).toUpperCase() || 'A'}
														</Text>
													</View>
												)}
												<Text className="text-white" numberOfLines={1} style={{ maxWidth: 120 }}>{item.appName}</Text>
											</View>
											<Ionicons
												name={selectedApps.includes(item.packageName) ? 'radio-button-on' : 'radio-button-off'}
												size={22}
												color={selectedApps.includes(item.packageName) ? '#00E676' : '#aaa'}
											/>
										</TouchableOpacity>
									)}
								/>
								<View className="mb-2">
									<Text className="text-white mb-2">Time Limit:</Text>
									<TimerPicker
										initialValue={{ hours: selectedHour, minutes: selectedMinute, seconds: 0 }}
										onDurationChange={({ hours = 0, minutes = 0 }) => {
											setSelectedHour(hours);
											setSelectedMinute(minutes);
										}}
										maximumHours={23}
										maximumMinutes={59}
										hideSeconds
										styles={{
											theme: 'dark',
											pickerContainer: { backgroundColor: '#222', borderRadius: 12, padding: 8 },
											pickerItem: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
										}}
									/>
								</View>
								<View className="flex-row justify-between mt-4">
									<TouchableOpacity onPress={() => setModalVisible(false)} className="bg-verylightgreen p-2 rounded-lg min-w-[80px] items-center">
										<Text className="text-black font-bold">Cancel</Text>
									</TouchableOpacity>
									<TouchableOpacity onPress={handleCreateGroup} className="bg-green p-2 rounded-lg min-w-[80px] items-center">
										<Text className="text-white font-bold">Save</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					</Modal>
					{/* Floating + button */}
					<TouchableOpacity
						className="absolute bottom-28 right-8 bg-green rounded-full w-16 h-16 items-center justify-center shadow-lg"
						onPress={() => setModalVisible(true)}
						style={{ elevation: 6 }}
					>
						<Ionicons name="add" size={36} color="#fff" />
					</TouchableOpacity>
				</View>
			);
}
