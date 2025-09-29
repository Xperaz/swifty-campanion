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
