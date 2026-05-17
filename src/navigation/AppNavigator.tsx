// ==========================================
// NAVIGATION DYNAMIQUE PAR PROFIL - TailorPro
// ==========================================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';

import { COLORS, Typography } from '@constants/theme';
import { useProfile } from '@hooks/useProfile';

// ── Écrans app principale ──
import {
    DashboardScreen,
    ClientsListScreen,
    ClientDetailsScreen,
    AddClientScreen,
    MeasurementsScreen,
    AddMeasurementsScreen,
    PaymentsScreen,
    AddPaymentScreen,
    OrdersListScreen,
    AddOrderScreen,
    CatalogScreen,
    ModelDetailsScreen,
    StatisticsScreen,
} from '../screens';

// ── Écrans auth & onboarding ──
import { WelcomeScreen } from "@screens/Welcome/WelcomeScreen";
import { LoginScreen } from '@components/Auth';
import { RegisterScreen } from '@components/Account';
import { ClientRegisterScreen } from '@components/ClientRegisterScreen';
import { ChooseProfileScreen } from '@components/ChooseProfileScreen';
import { ClientWelcomeScreen } from '@components/Clientwelcomescreen';
import { TailorSetupScreen } from '@components/Tailorsetupscreen';
import { ClientOrdersScreen } from '@screens/Orders/ClientOrdersScreen';

// ==========================================
// TYPAGES DES PARAMS DE NAVIGATION
// ==========================================

export type RootStackParamList = {
    MainTabs: undefined;
    ClientDetails: { clientId: string };
    AddClient: undefined;
    Measurements: { clientId: string };
    AddMeasurements: { clientId: string };
    Payments: { clientId: string };
    AddPayment: { clientId: string; orderId?: string };
    AddOrder: { clientId?: string };
    ModelDetails: { modelId: string };
    Statistics: undefined;
    Login: undefined;
    Register: undefined;
    RegisterClient: undefined;
    ForgotPassword: undefined;
    Clients: undefined;
    Welcome: undefined;
    ChooseProfile: undefined;
    ClientWelcome: undefined;
    TailorSetup: undefined;
};

export type TailorTabParamList = {
    Accueil: undefined;
    Clients: undefined;
    Commandes: undefined;
    Catalogue: undefined;
    Plus: undefined;
};

export type ClientTabParamList = {
    Accueil: undefined;
    Commandes: undefined;
    Catalogue: undefined;
    Mesures: { clientId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const TailorTab = createBottomTabNavigator<TailorTabParamList>();
const ClientTab = createBottomTabNavigator<ClientTabParamList>();

// ── Composant d'icône réutilisable ──
const TabBarIcon = ({ name, focused }: { name: keyof typeof Feather.glyphMap; focused: boolean }) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Feather name={name} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
    </View>
);

// Onglet "Plus" pour le Couturier
const PlusScreen = () => (
    <View style={styles.plusContainer}>
        <StatisticsScreen />
    </View>
);

// ==========================================
// 1. NAVIGATOR POUR LE COUTURIER (5 Onglets)
// ==========================================
const TailorTabNavigator = () => (
    <TailorTab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarLabelStyle: styles.tabBarLabel,
        }}
    >
        <TailorTab.Screen
            name="Accueil"
            component={DashboardScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }}
        />
        <TailorTab.Screen
            name="Clients"
            component={ClientsListScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="users" focused={focused} /> }}
        />
        <TailorTab.Screen
            name="Commandes"
            component={OrdersListScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="shopping-bag" focused={focused} /> }}
        />
        <TailorTab.Screen
            name="Catalogue"
            component={CatalogScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="grid" focused={focused} /> }}
        />
        <TailorTab.Screen
            name="Plus"
            component={PlusScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="more-horizontal" focused={focused} /> }}
        />
    </TailorTab.Navigator>
);

// ==========================================
// 2. NAVIGATOR POUR LE CLIENT (4 Onglets épurés)
// ==========================================
const ClientTabNavigator = () => {
    const { profile } = useProfile();
    // On passe l'ID utilisateur au composant mesures pour qu'il affiche directement les siennes
    const myId = profile?.id ?? '';

    return (
        <ClientTab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            <ClientTab.Screen
                name="Accueil"
                component={DashboardScreen}
                options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }}
            />
            <ClientTab.Screen
                name="Commandes"
                component={ClientOrdersScreen}
                options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="shopping-bag" focused={focused} /> }}
            />
            <ClientTab.Screen
                name="Catalogue"
                component={CatalogScreen}
                options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="grid" focused={focused} /> }}
            />
            <ClientTab.Screen
                name="Mesures"
                component={MeasurementsScreen}
                initialParams={{ clientId: myId }}
                options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="scissors" focused={focused} /> }}
            />
        </ClientTab.Navigator>
    );
};

// ==========================================
// 3. AIGUILLEUR GLOBAL (MAIN NAVIGATOR)
// ==========================================
interface AppNavigatorProps {
    session: Session | null;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ session }) => {
    const { profile, loading } = useProfile();

    // Pendant qu'on charge le profil depuis Supabase, on affiche un indicateur
    if (session && loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {session ? (
                // 🔓 UTILISATEUR CONNECTÉ
                <>
                    {/* Sélection de la bonne barre d'onglets selon le rôle de l'utilisateur */}
                    <Stack.Screen name="MainTabs">
                        {() => profile?.role === 'client' ? <ClientTabNavigator /> : <TailorTabNavigator />}
                    </Stack.Screen>

                    {/* Écrans de détails accessibles par la stack */}
                    <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
                    <Stack.Screen name="AddClient" component={AddClientScreen} />
                    <Stack.Screen name="Measurements" component={MeasurementsScreen} />
                    <Stack.Screen name="AddMeasurements" component={AddMeasurementsScreen} />
                    <Stack.Screen name="Payments" component={PaymentsScreen} />
                    <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
                    <Stack.Screen name="AddOrder" component={AddOrderScreen} />
                    <Stack.Screen name="ModelDetails" component={ModelDetailsScreen} />
                    <Stack.Screen name="Statistics" component={StatisticsScreen} />
                </>
            ) : (
                // 🔒 UTILISATEUR DÉCONNECTÉ
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ChooseProfile" component={ChooseProfileScreen} />
                    <Stack.Screen name="RegisterClient" component={ClientRegisterScreen} />
                    <Stack.Screen name="ClientWelcome" component={ClientWelcomeScreen} />
                    <Stack.Screen name="TailorSetup" component={TailorSetupScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 80,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tabBarLabel: {
        ...Typography.caption,
        marginTop: 4,
    },
    iconContainer: {
        padding: 6,
        borderRadius: 12,
    },
    iconContainerActive: {
        backgroundColor: COLORS.primaryLight,
    },
    plusContainer: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
});

export default AppNavigator;


/*******

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js'; // 👈 Ajout de l'import du type

import { COLORS, Typography } from '@constants/theme';
import {
    DashboardScreen,
    ClientsListScreen,
    ClientDetailsScreen,
    AddClientScreen,
    MeasurementsScreen,
    AddMeasurementsScreen,
    PaymentsScreen,
    AddPaymentScreen,
    OrdersListScreen,
    AddOrderScreen,
    CatalogScreen,
    ModelDetailsScreen,
    StatisticsScreen,
} from '../screens';
import { WelcomeScreen } from "@screens/Welcome/WelcomeScreen";
import { LoginScreen } from '@components/Auth';      // 👈 Importé depuis votre layout
import { RegisterScreen } from '@components/Account';  // 👈 Importé depuis votre layout
import { ClientRegisterScreen } from '@components/ClientRegisterScreen';
import { ChooseProfileScreen } from '@components/ChooseProfileScreen';
import { ClientWelcomeScreen } from '@components/Clientwelcomescreen';
import { TailorSetupScreen } from '@components/Tailorsetupscreen';

// Types for navigation
export type RootStackParamList = {
    MainTabs: undefined;
    ClientDetails: { clientId: string };
    AddClient: undefined;
    Measurements: { clientId: string };
    AddMeasurements: { clientId: string };
    Payments: { clientId: string };
    AddPayment: { clientId: string; orderId?: string };
    AddOrder: { clientId?: string };
    ModelDetails: { modelId: string };
    Statistics: undefined;
    Login: undefined;
    Register: undefined;
    RegisterClient: undefined;
    ForgotPassword: undefined;
    Clients: undefined;
    Welcome: undefined;
    ChooseProfile: undefined;
    ClientWelcome: undefined;
    TailorSetup: undefined;
};

export type MainTabParamList = {
    Accueil: undefined;
    Clients: undefined;
    Commandes: undefined;
    Catalogue: undefined;
    Plus: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon component
const TabBarIcon = ({
                        name,
                        focused
                    }: {
    name: keyof typeof Feather.glyphMap;
    focused: boolean;
}) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Feather
            name={name}
            size={22}
            color={focused ? COLORS.primary : COLORS.textMuted}
        />
    </View>
);

// Plus/More screen placeholder
const PlusScreen = () => (
    <View style={styles.plusContainer}>
        <StatisticsScreen />
    </View>
);

// Main tab navigator
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            <Tab.Screen
                name="Accueil"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="home" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="users" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Commandes"
                component={OrdersListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="shopping-bag" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Catalogue"
                component={CatalogScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="grid" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Plus"
                component={PlusScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="more-horizontal" focused={focused} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

// 🌟 Typage des props pour recevoir la session Supabase
interface AppNavigatorProps {
    session: Session | null;
}

// Main app navigator
const AppNavigator: React.FC<AppNavigatorProps> = ({ session }) => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            {session ? (
                // 🔓 FLUX AUTHENTIFIÉ (Utilisateur connecté)
                <>
                    <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                    <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
                    <Stack.Screen name="AddClient" component={AddClientScreen} />
                    <Stack.Screen name="Measurements" component={MeasurementsScreen} />
                    <Stack.Screen name="AddMeasurements" component={AddMeasurementsScreen} />
                    <Stack.Screen name="Payments" component={PaymentsScreen} />
                    <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
                    <Stack.Screen name="AddOrder" component={AddOrderScreen} />
                    <Stack.Screen name="ModelDetails" component={ModelDetailsScreen} />
                    <Stack.Screen name="Statistics" component={StatisticsScreen} />
                </>
            ) : (
                // 🔒 FLUX VISITEUR (Utilisateur déconnecté)
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="ChooseProfile" component={ChooseProfileScreen} />
                    <Stack.Screen name="RegisterClient" component={ClientRegisterScreen} />
                    <Stack.Screen name="ClientWelcome" component={ClientWelcomeScreen} />
                    <Stack.Screen name="TailorSetup" component={TailorSetupScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 80,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tabBarLabel: {
        ...Typography.caption,
        marginTop: 4,
    },
    iconContainer: {
        padding: 6,
        borderRadius: 12,
    },
    iconContainerActive: {
        backgroundColor: COLORS.primaryLight,
    },
    plusContainer: {
        flex: 1,
    },
});

export default AppNavigator;
*/

/***********

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS, Typography } from '@constants/theme';
import {
    DashboardScreen,
    ClientsListScreen,
    ClientDetailsScreen,
    AddClientScreen,
    MeasurementsScreen,
    AddMeasurementsScreen,
    PaymentsScreen,
    AddPaymentScreen,
    OrdersListScreen,
    AddOrderScreen,
    CatalogScreen,
    ModelDetailsScreen,
    StatisticsScreen,
} from '../screens';
import {WelcomeScreen} from "@screens/Welcome/WelcomeScreen";

// Types for navigation
export type RootStackParamList = {
    MainTabs: undefined;
    ClientDetails: { clientId: string };
    AddClient: undefined;
    Measurements: { clientId: string };
    AddMeasurements: { clientId: string };
    Payments: { clientId: string };
    AddPayment: { clientId: string; orderId?: string };
    AddOrder: { clientId?: string };
    ModelDetails: { modelId: string };
    Statistics: undefined;
    Login: undefined;
    Register: undefined;
    RegisterClient: undefined;
    ForgotPassword: undefined;
    Clients: undefined;
    Welcome: undefined;
    ChooseProfile: undefined;
};

export type MainTabParamList = {
    Accueil: undefined;
    Clients: undefined;
    Commandes: undefined;
    Catalogue: undefined;
    Plus: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab bar icon component
const TabBarIcon = ({
                        name,
                        focused
                    }: {
    name: keyof typeof Feather.glyphMap;
    focused: boolean;
}) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Feather
            name={name}
            size={22}
            color={focused ? COLORS.primary : COLORS.textMuted}
        />
    </View>
);

// Plus/More screen placeholder
const PlusScreen = () => (
    <View style={styles.plusContainer}>
        <StatisticsScreen />
    </View>
);

// Main tab navigator
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: styles.tabBarLabel,
            }}
        >
            <Tab.Screen
                name="Accueil"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="home" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Clients"
                component={ClientsListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="users" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Commandes"
                component={OrdersListScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="shopping-bag" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Catalogue"
                component={CatalogScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="grid" focused={focused} />
                    ),
                }}
            />
            <Tab.Screen
                name="Plus"
                component={PlusScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabBarIcon name="more-horizontal" focused={focused} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

// Main app navigator
const AppNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen name="ClientDetails" component={ClientDetailsScreen} />
            <Stack.Screen name="AddClient" component={AddClientScreen} />
            <Stack.Screen name="Measurements" component={MeasurementsScreen} />
            <Stack.Screen name="AddMeasurements" component={AddMeasurementsScreen} />
            <Stack.Screen name="Payments" component={PaymentsScreen} />
            <Stack.Screen name="AddPayment" component={AddPaymentScreen} />
            <Stack.Screen name="AddOrder" component={AddOrderScreen} />
            <Stack.Screen name="ModelDetails" component={ModelDetailsScreen} />
            <Stack.Screen name="Statistics" component={StatisticsScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 80,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tabBarLabel: {
        ...Typography.caption,
        marginTop: 4,
    },
    iconContainer: {
        padding: 6,
        borderRadius: 12,
    },
    iconContainerActive: {
        backgroundColor: COLORS.primaryLight,
    },
    plusContainer: {
        flex: 1,
    },
});

export default AppNavigator;
*/

/********

// ==========================================
// NAVIGATION - TailorPro
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS, Typography } from '@constants/theme';

// ── Écrans app principale ──
import {
    DashboardScreen,
    ClientsListScreen,
    ClientDetailsScreen,
    AddClientScreen,
    MeasurementsScreen,
    AddMeasurementsScreen,
    PaymentsScreen,
    AddPaymentScreen,
    OrdersListScreen,
    AddOrderScreen,
    CatalogScreen,
    ModelDetailsScreen,
    StatisticsScreen,
} from '../screens';

// ── Écrans auth ──
import WelcomeScreen        from '../screens/Welcome/WelcomeScreen';
import { LoginScreen }      from '@components/Auth';
import { RegisterScreen }   from '@components/Account';
import ChooseProfileScreen  from '@components/ChooseProfileScreen';
import ClientRegisterScreen from '@components/ClientRegisterScreen';

// ==========================================
// TYPES
// ==========================================

// Stack auth (avant connexion)
export type AuthStackParamList = {
    Welcome:        undefined;
    Login:          undefined;
    Register:       undefined;           // couturier
    RegisterClient: undefined;           // client
    ChooseProfile:  undefined;
    ForgotPassword: undefined;
};

// Stack app (après connexion)
export type RootStackParamList = {
    MainTabs:       undefined;
    ClientDetails:  { clientId: string };
    AddClient:      undefined;
    Measurements:   { clientId: string };
    AddMeasurements:{ clientId: string };
    Payments:       { clientId: string };
    AddPayment:     { clientId: string; orderId?: string };
    AddOrder:       { clientId?: string };
    ModelDetails:   { modelId: string };
    Statistics:     undefined;
    Clients:        undefined;
};

export type MainTabParamList = {
    Accueil:    undefined;
    Clients:    undefined;
    Commandes:  undefined;
    Catalogue:  undefined;
    Plus:       undefined;
};

// ==========================================
// NAVIGATORS
// ==========================================

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Stack     = createNativeStackNavigator<RootStackParamList>();
const Tab       = createBottomTabNavigator<MainTabParamList>();

// ── Icône tab bar ──
const TabBarIcon = ({
                        name, focused,
                    }: {
    name: keyof typeof Feather.glyphMap;
    focused: boolean;
}) => (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
        <Feather name={name} size={22} color={focused ? COLORS.primary : COLORS.textMuted} />
    </View>
);

// ── Onglet "Plus" → Statistiques ──
const PlusScreen = () => (
    <View style={styles.plusContainer}>
        <StatisticsScreen />
    </View>
);

// ── Tab Navigator ──
const MainTabNavigator = () => (
    <Tab.Navigator
        screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarLabelStyle: styles.tabBarLabel,
        }}
    >
        <Tab.Screen
            name="Accueil"
            component={DashboardScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} /> }}
        />
        <Tab.Screen
            name="Clients"
            component={ClientsListScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="users" focused={focused} /> }}
        />
        <Tab.Screen
            name="Commandes"
            component={OrdersListScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="shopping-bag" focused={focused} /> }}
        />
        <Tab.Screen
            name="Catalogue"
            component={CatalogScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="grid" focused={focused} /> }}
        />
        <Tab.Screen
            name="Plus"
            component={PlusScreen}
            options={{ tabBarIcon: ({ focused }) => <TabBarIcon name="more-horizontal" focused={focused} /> }}
        />
    </Tab.Navigator>
);

// ── Stack app principale ──
const AppStackNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="MainTabs"        component={MainTabNavigator} />
        <Stack.Screen name="ClientDetails"   component={ClientDetailsScreen} />
        <Stack.Screen name="AddClient"       component={AddClientScreen} />
        <Stack.Screen name="Measurements"    component={MeasurementsScreen} />
        <Stack.Screen name="AddMeasurements" component={AddMeasurementsScreen} />
        <Stack.Screen name="Payments"        component={PaymentsScreen} />
        <Stack.Screen name="AddPayment"      component={AddPaymentScreen} />
        <Stack.Screen name="AddOrder"        component={AddOrderScreen} />
        <Stack.Screen name="ModelDetails"    component={ModelDetailsScreen} />
        <Stack.Screen name="Statistics"      component={StatisticsScreen} />
    </Stack.Navigator>
);

// ── Stack auth ──
export const AuthNavigator = () => (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <AuthStack.Screen name="Welcome"        component={WelcomeScreen} />
        <AuthStack.Screen name="Login"          component={LoginScreen} />
        <AuthStack.Screen name="Register"       component={RegisterScreen} />
        <AuthStack.Screen name="ChooseProfile"  component={ChooseProfileScreen} />
        <AuthStack.Screen name="RegisterClient" component={ClientRegisterScreen} />
    </AuthStack.Navigator>
);

// ==========================================
// EXPORT PAR DÉFAUT — utilisé dans App.tsx
// (garde juste le Stack app, App.tsx gère auth vs app)
// ==========================================

const AppNavigator = () => <AppStackNavigator />;

export default AppNavigator;

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        height: 80,
        paddingTop: 8,
        paddingBottom: 20,
    },
    tabBarLabel: {
        ...Typography.caption,
        marginTop: 4,
    },
    iconContainer: {
        padding: 6,
        borderRadius: 12,
    },
    iconContainerActive: {
        backgroundColor: COLORS.primaryLight,
    },
    plusContainer: {
        flex: 1,
    },
});
*/