import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  InteractionManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import { v4 as uuidv4 } from "uuid";
import { saveTransaction } from "../utils/storage";

const maskDate = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  const y = d.slice(0, 4),
    m = d.slice(4, 6),
    day = d.slice(6, 8);
  if (d.length <= 4) return y;
  if (d.length <= 6) return `${y}-${m}`;
  return `${y}-${m}-${day}`;
};

const isValidDateYYYYMMDD = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const CATEGORIES = [
  "Groceries",
  "Transport",
  "Rent",
  "Dining",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

export default function NewTransactionScreen({ navigation }: any) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isIncome, setIsIncome] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
  if (isSubmitting) return;

  if (!title.trim()) return alert("Please enter a title");
  const rawAmt = Number(amount);
  if (isNaN(rawAmt) || rawAmt <= 0) return alert("Enter valid amount");
  if (!isValidDateYYYYMMDD(date)) return alert("Invalid date format");
  if (!category.trim()) return alert("Select a category");

  setIsSubmitting(true);

  try {
    const signedAmount = isIncome ? Math.abs(rawAmt) : -Math.abs(rawAmt);
    const txDate = new Date(`${date}T00:00:00`);

    await saveTransaction({
      id: uuidv4(),
      title: title.trim(),
      amount: signedAmount,
      date: txDate.toISOString(),
      category,
      description: description.trim(),
    });

    InteractionManager.runAfterInteractions(() => {
      const parent = navigation.getParent();
      if (parent?.canGoBack()) parent.goBack();
      else navigation.navigate("Tabs", { screen: "Home" });
    });
  } catch (error) {
    alert("Error saving transaction: " + (error as any).message);
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ backgroundColor: "white" }}>
          <Text style={styles.label}>Transaction Title</Text>
          <TextInput
            placeholder="Ex. Salary, Bonus, Groceries, etc."
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            autoCapitalize="sentences"
          />

          <Text style={styles.label}>Amount</Text>
          <TextInput
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType={Platform.select({
              ios: "decimal-pad",
              android: "number-pad",
            })}
            inputMode="decimal"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
          <TextInput
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={(txt) => {
              const masked = maskDate(txt);
              setDate(masked);
              if (dateError) setDateError(null);
            }}
            onBlur={() => {
              if (date && !isValidDateYYYYMMDD(date)) {
                setDateError("Enter a valid date as YYYY-MM-DD");
              }
            }}
            style={[styles.input, dateError ? { borderColor: "#E11D48" } : null]}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={10}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}

          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={category}
              onValueChange={(v) => setCategory(v)}
              dropdownIconColor="#111827"
            >
              <Picker.Item label="Select a category..." value="" />
              {CATEGORIES.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            placeholder="Add a note"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            multiline
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, isIncome && styles.toggleButtonActive]}
              onPress={() => setIsIncome(true)}
              disabled={isIncome}
            >
              <Text
                style={[styles.toggleText, isIncome && styles.toggleTextActive]}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isIncome && styles.toggleButtonActive]}
              onPress={() => setIsIncome(false)}
              disabled={!isIncome}
            >
              <Text
                style={[styles.toggleText, !isIncome && styles.toggleTextActive]}
              >
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                isSubmitting && { opacity: 0.6 },
              ]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F4F6" },
  contentContainer: { padding: 16, paddingBottom: 32, gap: 10 },

  label: { fontWeight: "700", color: "#111827", marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 14, android: 10 }),
    color: "#111827",
    marginBottom: 12,
  },
  errorText: { color: "#E11D48", marginTop: -6, marginBottom: 10 },

  pickerWrap: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },

  toggleRow: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 14 },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 10,
    alignItems: "center",
  },
  toggleButtonActive: { backgroundColor: "#3B82F6" },
  toggleText: { color: "#3B82F6", fontWeight: "700", fontSize: 16 },
  toggleTextActive: { color: "white" },

  buttonGroup: { marginTop: "auto" },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 6,
  },
  saveButton: { backgroundColor: "#16A34A" },
  cancelButton: { backgroundColor: "#DC2626" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
