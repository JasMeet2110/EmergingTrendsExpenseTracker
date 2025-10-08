import AsyncStorage from "@react-native-async-storage/async-storage";

const USERS_KEY = "users";
const SESSION_KEY = "session";

export type UserData = {
  email: string;
  password: string;
};

export async function saveUser(user: UserData): Promise<void> {
  const users: UserData[] = JSON.parse((await AsyncStorage.getItem(USERS_KEY)) || "[]");
  users.push(user);
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function findUser(email: string): Promise<UserData | undefined> {
  const users: UserData[] = JSON.parse((await AsyncStorage.getItem(USERS_KEY)) || "[]");
  return users.find((u) => u.email === email);
}

export async function setSession(email: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, email);
}

export async function getSession(): Promise<string | null> {
  return await AsyncStorage.getItem(SESSION_KEY);
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
