import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../assets/colors.js';
import { NativeModules } from 'react-native';
import { useRouter } from 'expo-router';

const { BlockModule } = NativeModules;

export default function FocusModeControlScreen() {
	const router = useRouter();
	const [apps, setApps] = useState<any[]>([]);
	const [selectedApps, setSelectedApps] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [focusModeActive, setFocusModeActive] = useState(false);

		const [toggling, setToggling] = useState(false);
		const [modalVisible, setModalVisible] = useState(false);

	useEffect(() => {
		BlockModule.getInstalledApplications().then((result: any) => {
			let appList = [];
			if (Array.isArray(result)) {
				appList = result;
			} else if (result && typeof result === 'object' && result.length !== undefined) {
				for (let i = 0; i < result.length; i++) {
					appList.push(result[i]);
				}
			}
			setApps(appList);
			setLoading(false);
		});
		BlockModule.getFocusMode().then((active: boolean) => {
			setFocusModeActive(active);
		});
		// Fetch selected apps for focus mode
		if (BlockModule.getFocusModeSelectedApps) {
			BlockModule.getFocusModeSelectedApps().then((selected: string[] | undefined) => {
				console.log('Fetched selected apps for focus mode:', selected);
				if (selected) {
					setSelectedApps(selected);
				}
			});
		}
	}, []);

	const toggleAppSelection = (packageName: string) => {
		setSelectedApps(prev =>
			prev.includes(packageName)
				? prev.filter(pkg => pkg !== packageName)
				: [...prev, packageName]
		);
	};

	const saveFocusModeApps = async () => {
		setSaving(true);
		try {
			await BlockModule.setFocusModeSelectedApps(selectedApps);
			// router.back(); // Removed to stay on screen
		} catch (e) {
			// handle error
		}
		setSaving(false);
	};

	const handleToggleFocusMode = async () => {
		setToggling(true);
		try {
			await BlockModule.setFocusMode(!focusModeActive);
			setFocusModeActive(!focusModeActive);
		} catch (e) {
			// handle error
		}
		setToggling(false);
	};

	return (
		<View style={{ flex: 1, backgroundColor: 'black', paddingTop: 32 }}>
			<View style={{ alignItems: 'center', marginBottom: 16 }}>
				<Text style={{ color: colors.verylightgreen, fontWeight: 'bold', fontSize: 22 }}>Focus Mode</Text>
			</View>
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<View style={{ width: '100%', alignItems: 'center' }}>
					<TouchableOpacity
						style={{ backgroundColor: focusModeActive ? colors.verylightgreen : colors.gray, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}
						onPress={handleToggleFocusMode}
						disabled={toggling}
					>
						<Ionicons
							name="moon"
							size={20}
							color={focusModeActive ? colors.black : colors.lightgrey}
							style={{ marginRight: 8 }}
						/>
						<Text style={{ fontWeight: 'bold', color: focusModeActive ? colors.black : colors.lightgrey, fontSize: 16 }}>
							{focusModeActive ? 'Turn Off Focus Mode' : 'Turn On Focus Mode'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={{ backgroundColor: colors.gray, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 24, marginBottom: 18 }}
						onPress={() => setModalVisible(true)}
					>
						<Text style={{ fontWeight: 'bold', color: colors.lightgrey, fontSize: 16 }}>Selected apps</Text>
					</TouchableOpacity>
				</View>
				{loading && (
					<View style={{ justifyContent: 'center', alignItems: 'center' }}>
						<ActivityIndicator size="large" color={colors.verylightgreen} />
					</View>
				)}
			</View>
			{/* Modal for editing selected apps */}
			{modalVisible && (
				<View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
					<View style={{ backgroundColor: '#222', borderRadius: 18, width: '90%', maxHeight: '80%', padding: 16 }}>
						<Text style={{ color: colors.verylightgreen, fontWeight: 'bold', fontSize: 20, marginBottom: 12 }}>Select Apps</Text>
						<FlatList
							data={apps}
							keyExtractor={item => item.packageName}
							style={{ maxHeight: 400 }}
							renderItem={({ item }) => (
								<TouchableOpacity
									key={item.packageName}
									style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#333' }}
									onPress={() => toggleAppSelection(item.packageName)}
								>
									{/* App icon, same as index screen */}
									{item.iconBase64 ? (
										<Image
											source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
											style={{ width: 32, height: 32, borderRadius: 8, marginRight: 14 }}
											resizeMode="contain"
										/>
									) : (
										<View style={{ width: 32, height: 32, borderRadius: 8, marginRight: 14, backgroundColor: colors.gray, justifyContent: 'center', alignItems: 'center' }}>
											<Ionicons name="apps" size={20} color={colors.lightgrey} />
										</View>
									)}
									<Text style={{ color: '#fff', fontSize: 15, flex: 1 }}>{item.appName}</Text>
									<Ionicons
										name={selectedApps.includes(item.packageName) ? 'checkbox' : 'square-outline'}
										size={22}
										color={selectedApps.includes(item.packageName) ? colors.verylightgreen : colors.lightgrey}
									/>
								</TouchableOpacity>
							)}
						/>
						<TouchableOpacity
							style={{ backgroundColor: colors.verylightgreen, paddingVertical: 12, borderRadius: 12, marginTop: 18 }}
							onPress={async () => {
								await saveFocusModeApps();
								setModalVisible(false);
							}}
						>
							<Text style={{ color: colors.black, fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>Save Selection</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={{ marginTop: 10, alignSelf: 'center' }}
							onPress={() => setModalVisible(false)}
						>
							<Text style={{ color: colors.lightgrey, fontSize: 15 }}>Cancel</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}
		</View>
	);
// ...existing code...
}
