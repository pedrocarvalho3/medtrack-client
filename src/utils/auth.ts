import AsyncStorage from "@react-native-async-storage/async-storage";

export function isLoggedIn() {
  const token = AsyncStorage.getItem("@app:token");
  return !!token;
}
