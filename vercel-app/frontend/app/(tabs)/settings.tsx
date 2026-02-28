import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { API_URL } from '../../config';

interface User {
  id: string;
  name: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      const userName = await AsyncStorage.getItem('currentUserName');

      if (userId && userName) {
        setCurrentUser({ id: userId, name: userName });
      }

      const usersRes = await fetch(`${API_URL}/api/users`);
      const usersData = await usersRes.json();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const switchUser = async (user: User) => {
    try {
      await AsyncStorage.setItem('currentUserId', user.id);
      await AsyncStorage.setItem('currentUserName', user.name);
      setCurrentUser(user);
      Alert.alert('Success', `Switched to ${user.name}`);
    } catch (error) {
      console.error('Error switching user:', error);
    }
  };

  const logout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('currentUserId');
            await AsyncStorage.removeItem('currentUserName');
            router.replace('/');
          },
        },
      ]
    );
  };

  const otherUser = users.find((u) => u.id !== currentUser?.id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={50} color="#6366f1" />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser?.name || 'Guest'}</Text>
              <Text style={styles.userLabel}>Currently logged in</Text>
            </View>
          </View>
        </View>

        {otherUser && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => switchUser(otherUser)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#6366f1" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Switch to {otherUser.name}</Text>
              <Text style={styles.menuSubtitle}>Change active user</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About</Text>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="wallet-outline" size={24} color="#6366f1" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Shared Expenses</Text>
            <Text style={styles.menuSubtitle}>Version 1.0.0</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="cash-outline" size={24} color="#6366f1" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Currency</Text>
            <Text style={styles.menuSubtitle}>Danish Kroner (DKK)</Text>
          </View>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Ionicons name="heart-outline" size={24} color="#ef4444" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Made for</Text>
            <Text style={styles.menuSubtitle}>Matias & Agustina</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#888', marginTop: 4 },
  content: { padding: 20 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 16, padding: 20, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  userInfo: { marginLeft: 15 },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  userLabel: { color: '#888', fontSize: 14, marginTop: 2 },
  sectionHeader: { marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: '#888', fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 10 },
  menuIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center' },
  menuContent: { flex: 1, marginLeft: 15 },
  menuTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  menuSubtitle: { color: '#888', fontSize: 13, marginTop: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, padding: 16, marginTop: 30, gap: 10 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
