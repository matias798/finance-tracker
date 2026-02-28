import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Item {
  id: string;
  name: string;
  amount: number;
  currency: string;
  type: 'cart' | 'expense';
  paidBy: string | null;
  isDivided: boolean;
  createdAt: string;
  createdBy: string;
}

interface User {
  id: string;
  name: string;
}

export default function CartScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      const userName = await AsyncStorage.getItem('currentUserName');
      
      if (userId && userName) {
        setCurrentUser({ id: userId, name: userName });
      }

      // Load users
      const usersRes = await fetch(`${BACKEND_URL}/api/users`);
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Load cart items
      const itemsRes = await fetch(`${BACKEND_URL}/api/items?type=cart`);
      const itemsData = await itemsRes.json();
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const addItem = async () => {
    if (!newItemName.trim() || !newItemAmount || !currentUser) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          amount: parseFloat(newItemAmount),
          type: 'cart',
          createdBy: currentUser.id,
        }),
      });

      if (response.ok) {
        setNewItemName('');
        setNewItemAmount('');
        setModalVisible(false);
        loadData();
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${BACKEND_URL}/api/items/${itemId}`, {
                method: 'DELETE',
              });
              loadData();
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          },
        },
      ]
    );
  };

  const openPurchaseModal = (item: Item) => {
    setSelectedItem(item);
    setPurchaseModalVisible(true);
  };

  const markAsPurchased = async (paidByUserId: string) => {
    if (!selectedItem) return;

    try {
      await fetch(
        `${BACKEND_URL}/api/items/${selectedItem.id}/move-to-expense?paid_by=${paidByUserId}`,
        { method: 'PUT' }
      );
      setPurchaseModalVisible(false);
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error('Error marking as purchased:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Unknown';
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemMeta}>
          Added by {getUserName(item.createdBy)}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>
          {item.amount.toFixed(2)} {item.currency}
        </Text>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openPurchaseModal(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => deleteItem(item.id)}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping List</Text>
        <Text style={styles.headerSubtitle}>
          Hello, {currentUser?.name || 'Guest'}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total to Buy</Text>
        <Text style={styles.summaryAmount}>{totalAmount.toFixed(2)} DKK</Text>
        <Text style={styles.summaryCount}>{items.length} items</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>No items in your shopping list</Text>
            <Text style={styles.emptySubtext}>Tap + to add items</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Shopping Item</Text>

            <TextInput
              style={styles.input}
              placeholder="Item name"
              placeholderTextColor="#666"
              value={newItemName}
              onChangeText={setNewItemName}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount (DKK)"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              value={newItemAmount}
              onChangeText={setNewItemAmount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setModalVisible(false);
                  setNewItemName('');
                  setNewItemAmount('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.addBtn]}
                onPress={addItem}
              >
                <Text style={styles.addBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Purchase Modal */}
      <Modal
        visible={purchaseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPurchaseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Who paid for this?</Text>
            <Text style={styles.modalSubtitle}>{selectedItem?.name}</Text>

            <View style={styles.userSelectButtons}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.userSelectBtn}
                  onPress={() => markAsPurchased(user.id)}
                >
                  <Ionicons
                    name={
                      user.name === 'Matias' ? 'man-outline' : 'woman-outline'
                    }
                    size={30}
                    color="#fff"
                  />
                  <Text style={styles.userSelectName}>{user.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.modalBtn, styles.cancelBtn, { marginTop: 15 }]}
              onPress={() => {
                setPurchaseModalVisible(false);
                setSelectedItem(null);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 14,
  },
  summaryAmount: {
    color: '#6366f1',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 5,
  },
  summaryCount: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  itemCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  itemMeta: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    color: '#6366f1',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemActions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  actionBtn: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginTop: 15,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6366f1',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0c0c0c',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#2a2a3e',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#6366f1',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userSelectButtons: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
  },
  userSelectBtn: {
    backgroundColor: '#6366f1',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  userSelectName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
});
