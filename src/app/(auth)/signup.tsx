import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import React, { useState, useMemo } from 'react';
import colors from '../../../assets/colors.js';
import { useAuth } from '../../hooks/useAuth';

const SignUp = () => {
    // Get all auth-related functionality from useAuth hook
    const { 
        email, 
        setEmail, 
        username, 
        setUsername, 
        password, 
        setPassword,
        name,
        setName,
        dailyScreenTimeGoal,
        setDailyScreenTimeGoal,
        validateEmail,
        validatePassword,
        validateUsername,
        validateName,
        errors,
        handleSignUp,
        isLoading 
    } = useAuth();

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;
    
    const goToNextStep = () => {
        let isValid = false;
        
        switch (currentStep) {
            case 1:
                isValid = validateEmail() && validatePassword();
                break;
            case 2:
                isValid = validateUsername();
                break;
            case 3:
                isValid = validateName();
                break;
            case 4:
                isValid = true;
                break;
        }
        
        if (isValid) {
            setCurrentStep(Math.min(currentStep + 1, totalSteps));
            console.log(`Moved to step ${currentStep + 1}`);
        }
    };
    
    const goToPreviousStep = () => {
        setCurrentStep(Math.max(currentStep - 1, 1));
    };

    const progressBar = useMemo(() => {
        console.log(`Rendering progress bar for step ${currentStep}`);
        return (
            <View className="flex-row w-full mb-8">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <View 
                        key={index} 
                        className={`h-1.5 flex-1 ${
                            index < currentStep ? 'bg-verylightgreen' : 'bg-gray-700'
                        } ${index !== totalSteps - 1 ? 'mr-1' : ''}`} 
                    />
                ))}
            </View>
        );
    }, [currentStep, totalSteps]);
    
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Email & Password
                return (
                    <>
                        <Text className="text-verylightgreen text-3xl font-bold mb-2">Create Account</Text>
                        <Text className="text-lightgrey mb-8 text-center">Enter your email and password to get started</Text>
                        
                        <View className="w-full mb-4">
                            <TextInput
                                placeholder="Email"
                                placeholderTextColor={colors.lightgrey}
                                value={email}
                                onChangeText={setEmail}
                                onBlur={() => validateEmail()}
                                className={`bg-black border ${errors.email ? 'border-red-500' : 'border-lightgrey'} w-full rounded-md p-3 mb-1 text-lightgrey`}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {errors.email ? <Text className="text-red-500 text-xs pl-1">{errors.email}</Text> : null}
                        </View>
                        
                        <View className="w-full mb-6">
                            <TextInput
                                placeholder="Password (min. 8 characters)"
                                placeholderTextColor={colors.lightgrey}
                                value={password}
                                onChangeText={setPassword}
                                onBlur={() => validatePassword()}
                                secureTextEntry
                                className={`bg-black border ${errors.password ? 'border-red-500' : 'border-lightgrey'} w-full rounded-md p-3 mb-1 text-lightgrey`}
                            />
                            {errors.password ? <Text className="text-red-500 text-xs pl-1">{errors.password}</Text> : null}
                        </View>
                        
                        <TouchableOpacity 
                            onPress={goToNextStep}
                            className="w-full py-3 rounded-md bg-verylightgreen mb-6"
                        >
                            <Text className="text-black font-bold text-center text-lg">Continue</Text>
                        </TouchableOpacity>
                        
                        <View className="flex-row items-center mt-4">
                            <Text className="text-lightgrey mr-2">Already have an account?</Text>
                            <Link href="/login" asChild>
                                <TouchableOpacity>
                                    <Text className="text-verylightgreen font-bold">Login</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </>
                );
                
            case 2: // Username
                return (
                    <>
                        <Text className="text-verylightgreen text-3xl font-bold mb-2">Choose Username</Text>
                        <Text className="text-lightgrey mb-8 text-center">Pick a unique username for your account</Text>
                        
                        <View className="w-full mb-6">
                            <TextInput
                                placeholder="Username"
                                placeholderTextColor={colors.lightgrey}
                                value={username}
                                onChangeText={setUsername}
                                onBlur={() => validateUsername()}
                                className={`bg-black border ${errors.username ? 'border-red-500' : 'border-lightgrey'} w-full rounded-md p-3 mb-1 text-lightgrey`}
                                autoCapitalize="none"
                            />
                            {errors.username ? <Text className="text-red-500 text-xs pl-1">{errors.username}</Text> : null}
                        </View>
                        
                        <View className="flex-row justify-between w-full">
                            <TouchableOpacity 
                                onPress={goToPreviousStep}
                                className="w-5/12 py-3 rounded-md bg-gray-700"
                            >
                                <Text className="text-white font-bold text-center">Back</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={goToNextStep}
                                className="w-5/12 py-3 rounded-md bg-verylightgreen"
                            >
                                <Text className="text-black font-bold text-center">Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                );
                
            case 3: // Name
                return (
                    <>
                        <Text className="text-verylightgreen text-3xl font-bold mb-2">Your Name</Text>
                        <Text className="text-lightgrey mb-8 text-center">How should we call you?</Text>
                        
                        <View className="w-full mb-6">
                            <TextInput
                                placeholder="Full name"
                                placeholderTextColor={colors.lightgrey}
                                value={name}
                                onChangeText={setName}
                                onBlur={() => validateName()}
                                className={`bg-black border ${errors.name ? 'border-red-500' : 'border-lightgrey'} w-full rounded-md p-3 mb-1 text-lightgrey`}
                            />
                            {errors.name ? <Text className="text-red-500 text-xs pl-1">{errors.name}</Text> : null}
                        </View>
                        
                        <View className="flex-row justify-between w-full">
                            <TouchableOpacity 
                                onPress={goToPreviousStep}
                                className="w-5/12 py-3 rounded-md bg-gray-700"
                            >
                                <Text className="text-white font-bold text-center">Back</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={goToNextStep}
                                className="w-5/12 py-3 rounded-md bg-verylightgreen"
                            >
                                <Text className="text-black font-bold text-center">Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                );
                
            case 4: // Screen Time Goal
                return (
                    <>
                        <Text className="text-verylightgreen text-3xl font-bold mb-2">Screen Time Goal</Text>
                        <Text className="text-lightgrey mb-8 text-center">Set your maximum daily screen time</Text>
                        
                        <View className="items-center mb-8">
                            <Text className="text-white text-5xl font-bold mb-2">{dailyScreenTimeGoal} hr</Text>
                            <Text className="text-lightgrey text-center">Maximum daily screen time</Text>
                        </View>
                        
                        {/* Custom Hour Selection Bar */}
                        <View className="w-full mb-8">
                            {/* Hour buttons */}
                            <View className="flex-row justify-between w-full mb-4">
                                {[1, 2, 3, 4, 5, 6].map((hour) => (
                                    <TouchableOpacity 
                                        key={hour}
                                        onPress={() => setDailyScreenTimeGoal(hour)}
                                        className={`w-12 h-12 rounded-full items-center justify-center ${
                                            dailyScreenTimeGoal === hour 
                                                ? 'bg-verylightgreen' 
                                                : 'bg-gray-700'
                                        }`}
                                    >
                                        <Text 
                                            className={`font-bold ${
                                                dailyScreenTimeGoal === hour 
                                                    ? 'text-black' 
                                                    : 'text-white'
                                            }`}
                                        >
                                            {hour}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            {/* Visual progress bar */}
                            <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <View 
                                    className="h-full bg-verylightgreen" 
                                    style={{ 
                                        width: `${(dailyScreenTimeGoal / 6) * 100}%` 
                                    }}
                                />
                            </View>
                            
                            {/* Labels */}
                            <View className="flex-row justify-between w-full mt-2">
                                <Text className="text-lightgrey text-xs">1 hr</Text>
                                <Text className="text-lightgrey text-xs">6 hrs</Text>
                            </View>
                        </View>
                        
                        {/* Keep the existing buttons */}
                        <View className="flex-row justify-between w-full">
                            <TouchableOpacity 
                                onPress={goToPreviousStep}
                                className="w-5/12 py-3 rounded-md bg-gray-700"
                            >
                                <Text className="text-white font-bold text-center">Back</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={handleSignUp}
                                disabled={isLoading}
                                className={`w-5/12 py-3 rounded-md ${isLoading ? 'bg-gray-500' : 'bg-verylightgreen'}`}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#000000" />
                                ) : (
                                    <Text className="text-black font-bold text-center">Sign Up</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </>
                );
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <View className="flex-1 justify-center items-center bg-black p-8">
                {progressBar}
                {renderStepContent()}
            </View>
        </ScrollView>
    );
};

export default SignUp;