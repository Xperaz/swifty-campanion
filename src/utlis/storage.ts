import AsyncStorage from "@react-native-async-storage/async-storage";

export const getToken = async () => {
  try {
    const storedToken = await AsyncStorage.getItem("intra_token");
    const token = storedToken ? JSON.parse(storedToken) : null;
    return token;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const setToken = async (token: any) => {
  try {
    const withCreated = token?.created_at
      ? token
      : { ...token, created_at: Math.floor(Date.now() / 1000) };
    await AsyncStorage.setItem("intra_token", JSON.stringify(withCreated));
  } catch (error) {
    console.log(error);
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem("intra_token");
  } catch (error) {
    console.log(error);
  }
};

export const isTokenExpired = (token: any, skewSeconds: number = 60) => {
  if (!token) return true;
  const created = Number(token.created_at ?? 0);
  const expIn = Number(token.expires_in ?? 0);
  if (!created || !expIn) return false; // if missing data, assume not expired to avoid loops
  const now = Math.floor(Date.now() / 1000);
  return created + expIn - skewSeconds <= now;
};
