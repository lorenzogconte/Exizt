import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../assets/colors.js';
import React, { useState, useEffect } from 'react';
import { useAppBlock } from '../../hooks/useAppBlock';
import { NativeModules } from 'react-native';
import { useRouter } from 'expo-router';

const { BlockModule } = NativeModules;

export default function BlockingControlScreen() {
    const router = useRouter();

    const {
        isFocusModeActive,
        getFocusMode,
        setFocusMode,
    } = useAppBlock();

    const [isScrollBlocked, setIsScrollBlocked] = useState(false);

    useEffect(() => {
        BlockModule.getViewBlocker().then((enabled: boolean) => {
        setIsScrollBlocked(enabled);
        });
    }, []);

    useEffect(() => {
        getFocusMode();
    }, []);
      
    const toggleFocusMode = () => {
        setFocusMode(!isFocusModeActive);
    };
    
    const handleScrollBlocked = (enabled: boolean) => {
        setIsScrollBlocked(enabled);
        BlockModule.setViewBlocker(enabled);
    };

    return (
        <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity
                style={{ width: '80%', backgroundColor: colors.gray, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                onPress={() => router.push('/appgrouplimits')}
            >
                <Ionicons
                    name="timer-outline"
                    size={18}
                    color={colors.lightgrey}
                    style={{ marginRight: 8 }}
                />
                <Text style={{ color: colors.lightgrey, fontWeight: 'bold' }}>Usage Limits</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={{ width: '80%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: isFocusModeActive ? colors.verylightgreen : colors.gray }}
                onPress={toggleFocusMode}
            >
                <Ionicons
                    name="moon"
                    size={18}
                    color={isFocusModeActive ? colors.black : colors.lightgrey}
                    style={{ marginRight: 8 }}
                />
                <Text style={{ fontWeight: 'bold', color: isFocusModeActive ? colors.black : colors.lightgrey }}>
                    Focus Mode
                </Text>
            </TouchableOpacity>

            <View style={{ width: '80%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 8 }}>Block Scrolling</Text>
                <Switch
                    value={isScrollBlocked}
                    onValueChange={handleScrollBlocked}
                    thumbColor={isScrollBlocked ? '#B2FF59' : '#fff'}
                    trackColor={{ false: '#444', true: '#B2FF59' }}
                />
            </View>
        </View>
    );
}
