import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

interface User {
  id: string;
  name: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUsers();
  }, []);

  const initializeUsers = async () => {
    try {
      const savedUserId = await AsyncStorage.getItem('currentUserId');
      
      const response = await fetch(`${API_URL}/api/users/init`, {
        method: 'POST',
      });
      const data = await response.json();
      setUsers(data.users);
      
      if (savedUserId) {
        const savedUser = data.users.find((u: User) => u.id === savedUserId);
        if (savedUser) {
          await selectUser(savedUser);
          return;
        }
      }
    } catch (error) {
      console.error('Error initializing users:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectUser = async (user: User) => {
    try {
      await AsyncStorage.setItem('currentUserId', user.id);
      await AsyncStorage.setItem('currentUserName', user.name);
      router.replace('/(tabs)/cart');
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="wallet-outline" size={80} color="#6366f1" />
        <Text style={styles.title}>Shared Expenses</Text>
        <Text style={styles.subtitle}>Who's using the app?</Text>

        <View style={styles.userButtons}>
          {users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={styles.userButton}
              onPress={() => selectUser(user)}
            >
              <Ionicons
                name={user.name === 'Matias' ? 'man-outline' : 'woman-outline'}
                size={40}
                color="#fff"
              />
              <Text style={styles.userName}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 10,
    marginBottom: 40,
  },
  userButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  userButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
  },
});
