import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  saveUser,
  findUser,
  setSession,
  getSession,
} from "../utils/auth";

export default function AuthScreen() {
  const navigation = useNavigation<any>();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        Alert.alert("Missing Fields", "Please enter both email and password.");
        return;
      }

      const existing = await findUser(email.trim().toLowerCase());

      if (isLogin) {
        if (!existing || existing.password !== password.trim()) {
          Alert.alert("Login Failed", "Invalid email or password.");
          return;
        }
        await setSession(existing.email);
        navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: "Tabs" }],
        });
      } else {
        if (existing) {
          Alert.alert("Sign Up Error", "Account already exists.");
          return;
        }
        await saveUser({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
        await setSession(email.trim().toLowerCase());
        Alert.alert("Success", "Account created successfully!");
        navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: "Tabs" }],
        });
      }
    } catch (error: any) {
      Alert.alert("Auth Error", error.message || "Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={StyleSheet.absoluteFill}>
        {cornerCircles.map((c, i) => (
          <View
            key={i}
            style={[
              styles.circle,
              {
                width: c.size,
                height: c.size,
                backgroundColor: c.color,
                top: c.top,
                left: c.left,
                right: c.right,
                bottom: c.bottom,
              },
            ]}
          />
        ))}
      </View>

      <Text style={styles.heading}>Expense Tracker App</Text>

      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "center", paddingHorizontal: 20 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{isLogin ? "Sign In" : "Sign Up"}</Text>

          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth}>
            <Text style={styles.btnText}>
              {isLogin ? "Sign In" : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 12 }}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? Sign Up"
                : "Already have an account? Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get("window");

const cornerCircles = [
  { size: 220, color: "#9baadbff", top: -60, left: -90 },
  { size: 150, color: "#f7d3d3ff", top: -40, right: -40 },
  { size: 160, color: "#b8ecd2ff", bottom: -60, left: -30 },
  { size: 140, color: "#efc4dcff", bottom: -40, right: -40 },
  { size: 100, color: "#f1e1a0ff", top: height / 2 - 130, left: -50 },
  { size: 100, color: "#cec1dcff", bottom: 200, right: -50 },
  { size: 140, color: "#badfb8ff", top: 260, right: 120 },
];

const styles = StyleSheet.create({
  heading: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
    color: "#111827",
    top: 140,
  },
  circle: {
    position: "absolute",
    borderRadius: 9999,
    opacity: 0.5,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  primaryBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  switchText: {
    textAlign: "center",
    color: "#3B82F6",
    fontSize: 14,
  },
});
