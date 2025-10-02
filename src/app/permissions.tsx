import React, { useEffect } from 'react';
import { View, Text, Button, TouchableOpacity } from 'react-native';
import { useAppBlock } from '../hooks/useAppBlock';

export default function PermissionRequired() {
  const {
    hasNormalPermission,
    hasBlockPermission,
    checkPermission,
    openAccessibilitySettings,
  } = useAppBlock();

  useEffect(() => {
    checkPermission();
  }, []);

  const PermissionCheckbox = ({
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
        opacity: checked ? 0.6 : 1,
      }}
      disabled={checked}
      onPress={onPress}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: checked ? '#4CAF50' : '#888',
          backgroundColor: checked ? '#4CAF50' : '#fff',
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {checked && (
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
        )}
      </View>
      <Text style={{ fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Permissions Required
      </Text>
      <Text style={{ textAlign: 'center', marginBottom: 24 }}>
        You need to grant all required permissions for the app to work correctly.
      </Text>
      <PermissionCheckbox
        label="Accessibility Permission"
        checked={hasNormalPermission}
        onPress={() => openAccessibilitySettings('normal')}
      />
      <PermissionCheckbox
        label="Overlay Permission"
        checked={hasBlockPermission}
        onPress={() => openAccessibilitySettings('blocking')}
      />
      <PermissionCheckbox
        label="Battery Optimization Exemption"
        checked={false} // Assuming we don't track this state for now
        onPress={() => openAccessibilitySettings('battery')}
      />
      <Button
        title="Check Again"
        onPress={() => {
          checkPermission();
          checkBlockPermission();
        }}
      />
    </View>
  );
}