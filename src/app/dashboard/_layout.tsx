import AntDesign from "@expo/vector-icons/AntDesign";
import { Tabs } from "expo-router";
import { StatusBar } from "react-native";

export default function DashboardLayout() {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
        showHideTransition={"fade"}
      />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => <AntDesign name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "My Profile",
            headerShown: false,
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => <AntDesign name="user" size={24} color={color} />,
          }}
        />
        {/* Hide the details routes from the tab bar/navigation */}
        <Tabs.Screen name="details" options={{ href: null }} />
        <Tabs.Screen name="details/[login]" options={{ href: null }} />
        <Tabs.Screen name="details/index" options={{ href: null }} />
        {/* Also hide legacy profile/[login] if present */}
        <Tabs.Screen name="profile/[login]" options={{ href: null }} />
      </Tabs>
    </>
  );
}
