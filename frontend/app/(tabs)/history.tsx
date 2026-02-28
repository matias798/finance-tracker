import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

export default function HistoryScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      // Load users
      const usersRes = await fetch(`${BACKEND_URL}/api/users`);
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Load ALL items
      const itemsRes = await fetch(`${BACKEND_URL}/api/items`);
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

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unknown';
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-DK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.typeTag}>
          <Ionicons
            name={item.type === 'cart' ? 'cart-outline' : 'receipt-outline'}
            size={14}
            color={item.type === 'cart' ? '#f59e0b' : '#10b981'}
          />
          <Text
            style={[
              styles.typeText,
              { color: item.type === 'cart' ? '#f59e0b' : '#10b981' },
            ]}
          >
            {item.type === 'cart' ? 'Shopping' : 'Expense'}
          </Text>
        </View>
        {item.isDivided && (
          <View style={styles.dividedTag}>
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text style={styles.dividedText}>Divided</Text>
          </View>
        )}
      </View>

      <View style={styles.itemBody}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.itemMeta}>
            Created by {getUserName(item.createdBy)}
            {item.type === 'expense' && item.paidBy && (
              <Text> • Paid by {getUserName(item.paidBy)}</Text>
            )}
          </Text>
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

  const cartItems = items.filter((i) => i.type === 'cart');
  const expenseItems = items.filter((i) => i.type === 'expense');
  const dividedExpenses = expenseItems.filter((i) => i.isDivided);
  const totalExpenses = expenseItems.reduce((sum, i) => sum + i.amount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>All your transactions</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="cart-outline" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{cartItems.length}</Text>
          <Text style={styles.statLabel}>In Cart</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="receipt-outline" size={24} color="#10b981" />
          <Text style={styles.statValue}>{expenseItems.length}</Text>
          <Text style={styles.statLabel}>Expenses</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#6366f1" />
          <Text style={styles.statValue}>{dividedExpenses.length}</Text>
          <Text style={styles.statLabel}>Divided</Text>
        </View>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalAmount}>{totalExpenses.toFixed(2)} DKK</Text>
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
            <Ionicons name="time-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubtext}>
              Start adding items to your shopping list or expenses
            </Text>
          </View>
        }
      />
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
  statsRow: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: '#888',
    fontSize: 16,
  },
  totalAmount: {
    color: '#6366f1',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
  },
  itemCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dividedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dividedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  itemBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  itemDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  itemMeta: {
    color: '#888',
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
  halfAmount: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
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
    textAlign: 'center',
  },
});
