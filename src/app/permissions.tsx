import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppBlock } from '../hooks/useAppBlock';
import { useUsageStats } from '../hooks/useUsageStats';
import { useRouter } from 'expo-router';

export default function PermissionRequired() {
  const router = useRouter();

  const {
    hasNormalPermission,
    hasBlockPermission,
    hasBatteryPermission,
    checkPermission,
    openAccessibilitySettings,
  } = useAppBlock();

  const { hasPermission } = useUsageStats();

  useEffect(() => {
    checkPermission('all');
  }, []);

  useEffect(() => {
    if (hasNormalPermission && hasBlockPermission && hasBatteryPermission && hasPermission) {
      router.replace('/');
    }
  }, [hasNormalPermission, hasBlockPermission, hasBatteryPermission, hasPermission]);

  const PermissionRow = ({
    label,
    checked,
    onPress,
  }: {
    label: string;
    checked: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
      }}
      disabled={checked}
      onPress={onPress}
    >
      <Text style={{ fontSize: 16, color: '#fff', marginRight: 12 }}>
        {label}
      </Text>
      {checked && (
        <Text style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: 18 }}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#fff' }}>
        Permissions Required
      </Text>
      <Text style={{ textAlign: 'center', marginBottom: 24, color: '#fff' }}>
        You need to grant all required permissions for the app to work correctly.
      </Text>
      <PermissionRow
        label="Accessibility Permission"
        checked={hasNormalPermission}
        onPress={() => openAccessibilitySettings('normal')}
      />
      <PermissionRow
        label="Time Usage Permission"
        checked={hasPermission}
        onPress={() => openAccessibilitySettings('time')}
      />
      <PermissionRow
        label="Overlay Permission"
        checked={hasBlockPermission}
        onPress={() => openAccessibilitySettings('blocking')}
      />
      <PermissionRow
        label="Battery Optimization Exemption"
        checked={hasBatteryPermission}
        onPress={() => openAccessibilitySettings('battery')}
      />
    </View>
  );
}