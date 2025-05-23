import { Text } from "@/src/components/ui/text";
import HomeScreen from "@/src/screens/HomeScreen";
import Login from "@/src/screens/Login";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function Index() {
  const [logged, setLogged] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("@app:token");
      setLogged(!!token);
    };
    checkLogin();
  }, []);

  if (logged === null) {
    return <Text>Loading...</Text>;
  }

  return logged ? (
    <HomeScreen onLogout={() => setLogged(false)} />
  ) : (
    <Login onLoginSuccess={() => setLogged(true)} />
  );
}
