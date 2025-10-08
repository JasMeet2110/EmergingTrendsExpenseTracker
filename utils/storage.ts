import AsyncStorage from "@react-native-async-storage/async-storage";

export type LocalTxn = {
  id: string;
  title: string;
  amount: number;
  date: string; // ISO string
  category: string;
  description?: string;
};

const KEY = "transactions";

export const getTransactions = async (): Promise<LocalTxn[]> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Load error", e);
    return [];
  }
};

export const saveTransaction = async (txn: LocalTxn) => {
  const existing = await getTransactions();
  await AsyncStorage.setItem(KEY, JSON.stringify([txn, ...existing]));
};

export const deleteTransaction = async (id: string) => {
  const existing = await getTransactions();
  const updated = existing.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
};

export const clearAllTransactions = async () => {
  await AsyncStorage.removeItem(KEY);
};
