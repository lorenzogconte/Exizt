import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Modal, Switch } from 'react-native';
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
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsError, setTermsError] = useState('');
    const [termsModalVisible, setTermsModalVisible] = useState(false);
    
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
            if (!termsAccepted) {
                setTermsError('You must accept the Terms and Conditions to continue');
                isValid = false;
            } else {
                setTermsError('');
                isValid = true;
            }
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

    const TermsAndConditionsModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={termsModalVisible}
            onRequestClose={() => setTermsModalVisible(false)}
        >
            <View className="flex-1 justify-center items-center bg-black/80">
                <View className="bg-gray-800 w-11/12 h-4/5 rounded-lg p-4">
                    <Text className="text-verylightgreen text-2xl font-bold mb-4">Terms & Conditions</Text>
                    
                    <ScrollView className="flex-1 mb-4">
                        <Text className="text-white font-bold mb-2">Terms and Conditions for Exizt</Text>
                        <Text className="text-lightgrey mb-4">Last Updated: June 16, 2025</Text>
                        
                        <Text className="text-white font-bold mt-2">1. ACCEPTANCE OF TERMS</Text>
                        <Text className="text-lightgrey mb-2">
                            By accessing and using Exizt, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our service.
                        </Text>
                        
                        <Text className="text-white font-bold mt-2">2. PRIVACY POLICY</Text>
                        <Text className="text-lightgrey mb-2">
                            Your use of Exizt is also subject to our Privacy Policy, which describes how we collect and use your personal information.
                        </Text>
                        
                        <Text className="text-white font-bold mt-2">3. USAGE DATA</Text>
                        <Text className="text-lightgrey mb-2">
                            Exizt collects and analyzes your device usage statistics to provide screen time monitoring and app blocking features. This data is used solely for the purpose of providing the service and improving your digital wellbeing.
                        </Text>
                        
                        <Text className="text-white font-bold mt-2">4. APP BLOCKING</Text>
                        <Text className="text-lightgrey mb-2">
                            You acknowledge that the app blocking feature is designed to help you manage your digital wellbeing, and you agree not to use it in ways that could cause harm or disruption to your device or other services.
                        </Text>
                        
                        <Text className="text-white font-bold mt-2">5. LIMITATION OF LIABILITY</Text>
                        <Text className="text-lightgrey mb-2">
                            Exizt is provided "as is" without warranties of any kind, either express or implied. We are not liable for any damages arising from your use of the service.
                        </Text>
                        
                        <Text className="text-white font-bold mt-2">6. ACCOUNT INFORMATION</Text>
                        <Text className="text-lightgrey mb-2">
                            You are responsible for maintaining the confidentiality of your account information and password. You agree to notify us immediately of any unauthorized use of your account.
                        </Text>
                        
                        <Text className="text-white font-bold mt-2">7. TERMINATION</Text>
                        <Text className="text-lightgrey mb-4">
                            We reserve the right to terminate or suspend your account at any time without prior notice for conduct that we believe violates these Terms or is harmful to other users of Exizt, us, or third parties, or for any other reason.
                        </Text>
                    </ScrollView>
                    
                    <TouchableOpacity 
                        onPress={() => setTermsModalVisible(false)}
                        className="bg-verylightgreen py-3 rounded-md"
                    >
                        <Text className="text-black font-bold text-center">Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
    
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
                            
                            <View className="flex-row justify-between w-full mt-2">
                                <Text className="text-lightgrey text-xs">1 hr</Text>
                                <Text className="text-lightgrey text-xs">6 hrs</Text>
                            </View>
                        </View>

                        {/* Terms and Conditions Toggle */}
                        <View className="w-full mb-4">
                            <View className="flex-row items-center mb-1">
                                <Switch
                                    trackColor={{ false: '#3e3e3e', true: '#9BE8A3' }}
                                    thumbColor={termsAccepted ? '#ffffff' : '#f4f3f4'}
                                    onValueChange={() => {
                                        setTermsAccepted(!termsAccepted);
                                        if (!termsAccepted) setTermsError('');
                                    }}
                                    value={termsAccepted}
                                    style={{ marginRight: 10 }}
                                />
                                <Text className="text-lightgrey flex-1">
                                    I accept the 
                                    <Text 
                                        className="text-verylightgreen underline"
                                        onPress={() => setTermsModalVisible(true)}
                                    > Terms and Conditions</Text>
                                </Text>
                            </View>
                            {termsError ? <Text className="text-red-500 text-xs pl-1 mb-2">{termsError}</Text> : null}
                        </View>
                        
                        <TermsAndConditionsModal />

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