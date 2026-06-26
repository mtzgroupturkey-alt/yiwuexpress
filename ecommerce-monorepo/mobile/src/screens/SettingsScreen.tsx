import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  List,
  Switch,
  Divider,
  Button,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function SettingsScreen() {
  const router = useRouter()
  const [pushNotifications, setPushNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [orderUpdates, setOrderUpdates] = useState(true)
  const [promotions, setPromotions] = useState(false)
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('token')
          await AsyncStorage.removeItem('user')
          router.replace('/login')
        },
      },
    ])
  }

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return
    }
    // Implement password change API call
    setChangePasswordVisible(false)
    Alert.alert('Success', 'Password changed successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion API call
            Alert.alert('Account Deleted', 'Your account has been deleted.')
            router.replace('/login')
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Settings
        </Text>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Account
          </Text>
          
          <List.Item
            title="Edit Profile"
            description="Update your personal information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/profile')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Change Password"
            description="Update your password"
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setChangePasswordVisible(true)}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Company Information"
            description="Manage your company details"
            left={(props) => <List.Icon {...props} icon="office-building" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Info', 'Company settings coming soon')}
            style={styles.listItem}
          />
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Notifications
          </Text>
          
          <List.Item
            title="Push Notifications"
            description="Receive notifications on your device"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                color="#0ea5e9"
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Email Notifications"
            description="Receive email updates"
            left={(props) => <List.Icon {...props} icon="email" />}
            right={() => (
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                color="#0ea5e9"
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Order Updates"
            description="Get notified about order status"
            left={(props) => <List.Icon {...props} icon="package-variant" />}
            right={() => (
              <Switch
                value={orderUpdates}
                onValueChange={setOrderUpdates}
                color="#0ea5e9"
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Promotions"
            description="Receive special offers and deals"
            left={(props) => <List.Icon {...props} icon="tag" />}
            right={() => (
              <Switch
                value={promotions}
                onValueChange={setPromotions}
                color="#0ea5e9"
              />
            )}
            style={styles.listItem}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            App
          </Text>
          
          <List.Item
            title="Language"
            description="English"
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Info', 'Language settings coming soon')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Currency"
            description="USD ($)"
            left={(props) => <List.Icon {...props} icon="currency-usd" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Info', 'Currency settings coming soon')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Privacy Policy"
            left={(props) => <List.Icon {...props} icon="shield-check" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Info', 'Privacy policy coming soon')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Terms of Service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Info', 'Terms of service coming soon')}
            style={styles.listItem}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={[styles.sectionTitle, styles.dangerTitle]}>
            Danger Zone
          </Text>
          
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          buttonColor="#ef4444"
        >
          Logout
        </Button>

        <Text variant="bodySmall" style={styles.version}>
          Version 1.0.0
        </Text>
      </ScrollView>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog
          visible={changePasswordVisible}
          onDismiss={() => setChangePasswordVisible(false)}
        >
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setChangePasswordVisible(false)}>Cancel</Button>
            <Button onPress={handleChangePassword}>Change</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
    color: '#1f2937',
  },
  section: {
    marginTop: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
    color: '#1f2937',
  },
  listItem: {
    backgroundColor: 'white',
  },
  dangerTitle: {
    color: '#ef4444',
  },
  dangerButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerButtonText: {
    color: '#dc2626',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
  version: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 16,
  },
  dialogInput: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
})
