import { Tabs } from 'expo-router';
import React from 'react'
import { View, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../assets/colors.js';
const homeIcon = require('../../../assets/images/home.png');
const trophyIcon = require('../../../assets/images/trophy.png');
const profileIcon = require('../../../assets/images/profile.png');

const TabIcon = ({ focused, iconName, title, isPadlock }: any) => {
    if (focused) {
        return (
            <View
                className="flex-row items-center justify-center min-w-[140px] min-h-16 mt-4 bg-darkgreen rounded-full"
            >
                {isPadlock ? (
                    <Ionicons name="lock-closed" size={24} color={colors.verylightgreen} />
                ) : (
                    <Image 
                        source={iconName}
                        className= {
                            iconName === homeIcon
                            ? "ml-8 w-6 h-6"
                            : "w-6 h-6"
                        }
                        style={{ tintColor: colors.verylightgreen }}
                    />
                )}
                <Text 
                    className= {
                        iconName === profileIcon
                        ? "text-secondary text-base font-semibold ml-2 mr-8 text-verylightgreen"
                        :
                        "text-secondary text-base font-semibold ml-2 text-verylightgreen"
                    }>
                    {title}
                </Text>
            </View>
        );
    } else {
        return (
            <View
                className="flex flex-row w-full flex-1 items-center justify-center min-w-[112px] min-h-16 mt-4 rounded-full"
            >
                {isPadlock ? (
                    <Ionicons name="lock-closed" size={24} color={colors.lightgrey} />
                ) : (
                    <Image 
                        source={iconName}
                        className="w-6 h-6"
                        style={{ tintColor: colors.lightgrey }}
                    />
                )}
            </View>
        );
    }
};

const _Layout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarStyle: {
                    backgroundColor: colors.quitedarkgreen,
                    borderRadius: 50,
                    marginHorizontal: 20,
                    marginBottom: 25,
                    height: 52,
                    position: 'absolute',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.quitedarkgreen,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{ 
                    title: 'Home',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            focused={focused} 
                            iconName={homeIcon}
                            title="Home"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="blockingcontrol"
                options={{
                    title: 'Controls',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            focused={focused}
                            isPadlock={true}
                            title="Controls"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="competitions"
                options={{ 
                    title: 'Competitions',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            focused={focused} 
                            iconName={trophyIcon}
                            title="Competitions"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{ 
                    title: 'Profile',
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            focused={focused} 
                            iconName={profileIcon}
                            title="Profile"
                        />
                    ),
                }}
                initialParams={{ isCurrentUser: true }}
            />
            <Tabs.Screen
                name="appgrouplimits"
                options={{
                    href: null,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="competitiondetail"
                options={{
                    href: null,
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}

export default _Layout