import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { getTransactions, deleteTransaction, LocalTxn } from "../utils/storage";

import MonthSlider from "../components/MonthSlider";
import { useMonthrange } from "../hooks/useMonthrange";

const ROW_HEIGHT = 68;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "2-digit" }).format(d);
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [user] = useState({ uid: "local-user" });

  const { monthStart, monthEnd, label: MonthLabel, prev, next } = useMonthrange();

  const [txns, setTxns] = useState<LocalTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    const all = await getTransactions();
    // filter by month range
    const filtered = all.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d < monthEnd;
    });
    // sort newest → oldest
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTxns(filtered);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadTransactions();
  }, [monthStart.getTime(), monthEnd.getTime()]);

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of txns) {
      if (t.amount >= 0) income += t.amount;
      else expense += Math.abs(t.amount);
    }
    return { income, expense, net: income - expense };
  }, [txns]);

  const remaining = totals.net;
  const progressUsed = totals.income > 0 ? Math.min((totals.expense / totals.income) * 100, 100) : 0;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => loadTransactions(), 400);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      await loadTransactions();
    } catch (e: any) {
      Alert.alert("Delete error", e?.message || "Couldn't delete item.");
    }
  };

  const renderItem = ({ item }: { item: LocalTxn }) => {
    const isIncome = item.amount >= 0;
    return (
      <TouchableOpacity
        onLongPress={() => handleDelete(item.id)}
        style={styles.txnRow}
      >
        <View style={styles.txnLeft}>
          <Text style={styles.txnTitle} numberOfLines={1}>{item.title || "(No title)"}</Text>
          <Text style={styles.txnMeta}>{item.category || "Uncategorized"} • {formatDate(item.date)}</Text>
        </View>
        <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
          {isIncome ? "+" : "-"}{formatCurrency(Math.abs(Number(item.amount ?? 0)))}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <Text style={styles.heading}>Welcome To Your Expense Tracker!</Text>
        <MonthSlider label={MonthLabel} onPrev={prev} onNext={next} />

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.income]}>{formatCurrency(totals.income)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryValue, styles.expense]}>{formatCurrency(totals.expense)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, totals.net >= 0 ? styles.income : styles.expense]}>
              {formatCurrency(totals.net)}
            </Text>
          </View>
        </View>

        <View style={styles.topMetrics}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressUsed}%` }]} />
          </View>
          <Text style={styles.remainingLabel}>
            Remaining: {formatCurrency(remaining)} ({Math.round(progressUsed)}% used)
          </Text>

          <TouchableOpacity
            style={styles.breakdownButton}
            onPress={() => navigation.navigate("PieChart")}
          >
            <Text style={styles.breakdownText}>View Spending Breakdown 📊</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.listWrap, { maxHeight: ROW_HEIGHT * 5 }]}>
          {loading ? (
            <View style={{ paddingTop: 24 }}><ActivityIndicator /></View>
          ) : (
            <FlatList
              data={txns}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[styles.breakdownButton, { backgroundColor: "#111827", marginTop: 0 }]}
            onPress={() => navigation.navigate("NewTransactionScreen")}
          >
            <Text style={[styles.breakdownText, { color: "white" }]}>Add New Transaction →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  page: { flex: 1 },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center", paddingTop: 8 },

  summaryCard: {
    marginTop: 12, marginHorizontal: 16, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#E5E7EB", flexDirection: "row", justifyContent: "space-between",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  summaryItem: { alignItems: "center", flex: 1 },
  summaryLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  income: { color: "#16A34A" },
  expense: { color: "#DC2626" },
  topMetrics: { marginTop: 12, marginHorizontal: 16 },
  progressBar: { height: 12, backgroundColor: "#E5E7EB", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#10B981" },
  remainingLabel: { marginTop: 6, fontSize: 12, color: "#6B7280" },
  breakdownButton: { marginTop: 12, padding: 12, backgroundColor: "#3B82F6", borderRadius: 8, alignItems: "center" },
  breakdownText: { color: "white", fontWeight: "600" },

  listWrap: { marginTop: 8 },
  sep: { height: 10 },
  txnRow: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  txnLeft: { flexShrink: 1, paddingRight: 8 },
  txnTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  txnMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  amount: { fontSize: 16, fontWeight: "700", minWidth: 90, textAlign: "right" },

  bottomBar: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: "transparent" },
});
