import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthScreen from "../screens/AuthScreen";
import Tabs from "./Tabs";
import NewTransaction from "../screens/NewTransactionScreen";
import { getSession } from "../utils/auth";

const Root = createNativeStackNavigator();

export default function RootNavigator() {
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Listen for changes every focus or session write
  useEffect(() => {
    const checkSession = async () => {
      const s = await getSession();
      setSession(s);
      setLoading(false);
    };
    checkSession();

    const interval = setInterval(checkSession, 500); // tiny auto-check for updates
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Root.Screen name="Tabs" component={Tabs} />
          <Root.Screen
            name="NewTransaction"
            component={NewTransaction}
            options={{ presentation: "modal" }}
          />
        </>
      ) : (
        <Root.Screen name="Auth" component={AuthScreen} />
      )}
    </Root.Navigator>
  );
}
