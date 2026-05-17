// ==========================================
// ÉCRAN BIENVENUE - TailorPro
// ==========================================

import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StatusBar,
    ScrollView,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import type { RootStackParamList} from "../../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;


export const WelcomeScreen : React.FC<Props> = ({ navigation }) => {
    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    backgroundColor: "#FFFFFF",
                    paddingHorizontal: 22,
                    paddingTop: 58,
                    paddingBottom: 40,
                }}
            >
                {/* ── HEADER ── */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                        style={{
                            width: 75,
                            height: 75,
                            borderRadius: 20,
                            backgroundColor: "#1A0033",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Image
                            source={require("../../assets/images/icon.png")}
                            style={{ width: 52, height: 52, resizeMode: "contain" }}
                        />
                    </View>

                    <Text
                        style={{
                            marginLeft: 14,
                            fontSize: 31,
                            fontWeight: "900",
                            color: "#120022",
                            letterSpacing: -1,
                        }}
                    >
                        Tailor
                        <Text style={{ color: "#D4AF37" }}>Pro</Text>
                    </Text>
                </View>

                {/* ── TITRE ── */}
                <View style={{ marginTop: 42 }}>
                    <Text
                        style={{
                            fontSize: 42,
                            fontWeight: "900",
                            color: "#121212",
                            letterSpacing: -1,
                        }}
                    >
                        Bienvenue !
                    </Text>
                    <Text
                        style={{
                            marginTop: 12,
                            fontSize: 20,
                            lineHeight: 32,
                            color: "#3A3A3A",
                            fontWeight: "500",
                        }}
                    >
                        Gérez votre atelier{"\n"}simplement et efficacement.
                    </Text>
                </View>

                {/* ── IMAGE ── */}
                <View
                    style={{
                        marginTop: 24,
                        position: "relative",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Image
                        source={require("../../assets/images/welcome.png")}
                        style={{ width: "115%", height: 260, resizeMode: "cover" }}
                    />
                    <LinearGradient
                        colors={["#FFFFFF", "transparent"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ position: "absolute", top: 0, width: "112%", height: 5 }}
                    />
                    <LinearGradient
                        colors={["transparent", "#FFFFFF"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ position: "absolute", bottom: 0, width: "112%", height: 6 }}
                    />
                </View>

                {/* ── BOUTONS ── */}
                <View style={{ marginTop: 15 }}>

                    {/* SE CONNECTER */}
                    <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <LinearGradient
                            colors={["#2E0057", "#18002E"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                height: 64,
                                borderRadius: 20,
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>
                                Se connecter
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* CRÉER UN COMPTE */}
                    <TouchableOpacity
                        activeOpacity={0.92}
                        onPress={() => navigation.navigate("ChooseProfile")}
                        style={{
                            height: 64,
                            borderRadius: 20,
                            justifyContent: "center",
                            alignItems: "center",
                            borderWidth: 1.5,
                            borderColor: "#D8D8D8",
                            marginTop: 18,
                            backgroundColor: "#FFFFFF",
                            marginBottom: 10,
                        }}
                    >
                        <Text style={{ color: "#1F1F1F", fontSize: 20, fontWeight: "700" }}>
                            Créer un compte
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    );
}