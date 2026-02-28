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
import { API_URL } from '../../config';

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

export default function ExpensesScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [selectedPayer, setSelectedPayer] = useState<string>('');

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
        setSelectedPayer(userId);
      }

      const usersRes = await fetch(`${API_URL}/api/users`);
      const usersData = await usersRes.json();
      setUsers(usersData);

      const itemsRes = await fetch(`${API_URL}/api/items?type=expense`);
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

  const addExpense = async () => {
    if (!newItemName.trim() || !newItemAmount || !currentUser || !selectedPayer) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          amount: parseFloat(newItemAmount),
          type: 'expense',
          paidBy: selectedPayer,
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
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    }
  };

  const toggleDivided = async (itemId: string) => {
    try {
      await fetch(`${API_URL}/api/items/${itemId}/toggle-divided`, {
        method: 'PUT',
      });
      loadData();
    } catch (error) {
      console.error('Error toggling divided:', error);
    }
  };

  const deleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/api/items/${itemId}`, {
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

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unknown';
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Unknown';
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => toggleDivided(item.id)}
      >
        <View style={[styles.checkbox, item.isDivided && styles.checkboxChecked]}>
          {item.isDivided && (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.isDivided && styles.itemDivided]}>
          {item.name}
        </Text>
        <Text style={styles.itemMeta}>
          Paid by {getUserName(item.paidBy)}
        </Text>
        {item.isDivided && (
          <Text style={styles.dividedBadge}>Divided ✓</Text>
        )}
      </View>

      <View style={styles.itemRight}>
        <Text style={styles.itemAmount}>
          {item.amount.toFixed(2)} {item.currency}
        </Text>
        {item.isDivided && (
          <Text style={styles.halfAmount}>
            ({(item.amount / 2).toFixed(2)} each)
          </Text>
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteItem(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
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
  const dividedItems = items.filter((item) => item.isDivided);
  const pendingItems = items.filter((item) => !item.isDivided);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <Text style={styles.headerSubtitle}>Track your shared expenses</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryAmount}>{totalAmount.toFixed(2)} DKK</Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Text style={styles.summaryLabel}>Divided</Text>
          <Text style={[styles.summaryAmount, { color: '#10b981' }]}>
            {dividedItems.length}
          </Text>
        </View>
        <View style={[styles.summaryCard, { flex: 1 }]}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryAmount, { color: '#f59e0b' }]}>
            {pendingItems.length}
          </Text>
        </View>
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
            <Ionicons name="receipt-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>No expenses recorded</Text>
            <Text style={styles.emptySubtext}>
              Add expenses or purchase items from cart
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

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
            <Text style={styles.modalTitle}>Add Expense</Text>

            <TextInput
              style={styles.input}
              placeholder="Expense name"
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

            <Text style={styles.selectLabel}>Who paid?</Text>
            <View style={styles.payerButtons}>
              {users.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.payerBtn,
                    selectedPayer === user.id && styles.payerBtnSelected,
                  ]}
                  onPress={() => setSelectedPayer(user.id)}
                >
                  <Text
                    style={[
                      styles.payerBtnText,
                      selectedPayer === user.id && styles.payerBtnTextSelected,
                    ]}
                  >
                    {user.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
                onPress={addExpense}
              >
                <Text style={styles.addBtnText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { padding: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#888', marginTop: 4 },
  summaryRow: { flexDirection: 'row', padding: 20, paddingTop: 10, gap: 10 },
  summaryCard: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, alignItems: 'center' },
  summaryLabel: { color: '#888', fontSize: 12 },
  summaryAmount: { color: '#6366f1', fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  listContent: { padding: 20, paddingTop: 0 },
  itemCard: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  checkboxContainer: { marginRight: 12 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#444', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#10b981', borderColor: '#10b981' },
  itemInfo: { flex: 1 },
  itemName: { color: '#fff', fontSize: 18, fontWeight: '600' },
  itemDivided: { textDecorationLine: 'line-through', color: '#888' },
  itemMeta: { color: '#666', fontSize: 12, marginTop: 4 },
  dividedBadge: { color: '#10b981', fontSize: 12, marginTop: 4 },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { color: '#6366f1', fontSize: 18, fontWeight: 'bold' },
  halfAmount: { color: '#888', fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 4, marginTop: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 18, marginTop: 15 },
  emptySubtext: { color: '#444', fontSize: 14, marginTop: 5, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#6366f1', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#0c0c0c', borderRadius: 12, padding: 16, color: '#fff', fontSize: 16, marginBottom: 12 },
  selectLabel: { color: '#888', fontSize: 14, marginBottom: 10, marginTop: 5 },
  payerButtons: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  payerBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#0c0c0c', alignItems: 'center' },
  payerBtnSelected: { backgroundColor: '#6366f1' },
  payerBtnText: { color: '#888', fontSize: 16, fontWeight: '600' },
  payerBtnTextSelected: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 10 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#2a2a3e' },
  cancelBtnText: { color: '#888', fontSize: 16, fontWeight: '600' },
  addBtn: { backgroundColor: '#6366f1' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
