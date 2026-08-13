// ==========================================
// NAVIGATION DYNAMIQUE PAR PROFIL - TailorPro
// ==========================================

import React, { useRef, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
    View,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Text,
    Animated,
    Modal,
    Pressable,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@hooks/useProfile';

// ── Écrans app principale ──
import {
    DashboardScreen,
    ClientsListScreen,
    ClientDetailsScreen,
    AddClientScreen,
    MeasurementsScreen,
    AddMeasurementsScreen,
    FicheDetailsScreen,
    CompareFichesScreen,
    RealisationsScreen,
    AddRealisationScreen,
    RealisationDetailsScreen,
    EditRealisationScreen,
    GalerieScreen,
    RechercheScreen,
    ComptabiliteScreen,
    ClientPaiementsScreen,
    RecuScreen,
    //CommandeKanbanScreen,
    TissusScreen,
    AddTissuScreen,
    TissuDetailsScreen,
    EditTissuScreen,
    PaymentsScreen,
    AddPaymentScreen,
    OrdersListScreen,
    AddOrderScreen,
    CatalogScreen,
    ModelDetailsScreen,
    StatisticsScreen,
} from '../screens';

// ── Nouveaux écrans catalogue ──
import { AddCatalogModelScreen } from '@screens/Catalog/AddCatalogModel';
import { EditCatalogModelScreen } from '@screens/Catalog/EditCatalogModelScreen';

// ── Écrans auth & onboarding ──
import { WelcomeScreen } from '@screens/Welcome/WelcomeScreen';
import { LoginScreen } from '@components/Auth';
import { RegisterScreen } from '@components/Account';
import { ClientRegisterScreen } from '@components/ClientRegisterScreen';
import { ChooseProfileScreen } from '@components/ChooseProfileScreen';
import { ClientWelcomeScreen } from '@components/Clientwelcomescreen';
import { TailorSetupScreen } from '@components/Tailorsetupscreen';
import { ClientOrdersScreen } from '@screens/Orders/ClientOrdersScreen';
import { OnboardingScreen } from '@screens/Onboarding/Onboardingscreen';
import { BiometricAuthScreen } from '@components/Biometricauthscreen';
import { ProfileScreen } from '@screens/Userprofile/Profilescreen';
import { EditClientScreen } from '@screens/Clients/EditClientScreen';
import { SettingsScreen } from '@screens/Settings/SettingsScreen';
import {OrderDetailsScreen} from "@screens/Orders/OrderDetailsScreen";
import { nativeDriver } from '@utils/animation';

// ==========================================
// PALETTE
// ==========================================

const PALETTE = {
    bg:      '#0E0B14',
    surface: '#1A1528',
    border:  '#2E2845',
    text:    '#FFFFFF',
    sub:     'rgba(255,255,255,0.5)',
    muted:   '#8A8594',
    gold:    '#D4AF37',
    goldBg:  'rgba(212,175,55,0.12)',
    goldRim: 'rgba(212,175,55,0.25)',
    purple:  '#2E0057',
    success: '#4ADE80',
    error:   '#EF4444',
    warning: '#F59E0B',
    navBg:   '#FFFFFF',
    navBorder: 'rgba(0,0,0,0.07)',
};

// ==========================================
// TYPAGES
// ==========================================

export type RootStackParamList = {
    Dashboard: undefined;
    MainTabs: undefined;
    ClientDetails: { clientId: string };
    AddClient: undefined;
    EditClient: { clientId: string };
    Measurements: { clientId: string };
    AddMeasurements: { clientId: string; typeVetement?: string };
    FicheDetails: { ficheId: string; clientId: string };
    CompareFiches: { ficheId1: string; ficheId2: string; clientId: string };
    Payments: { clientId: string };
    AddPayment: { clientId: string; orderId?: string };
    AddOrder: { clientId?: string };
    OrderDetails: { orderId: string };
    // ── Module 11 Galerie ──
    Galerie: undefined;
    // ── Module 10 Recherche globale ──
    Recherche: undefined;
    // ── Module 9 Comptabilité ──
    Comptabilite: undefined;
    // ── Module 8 Paiements ──
    ClientPaiements: { clientId: string };
    Recu: {
        amount: number; typePaiement: string; modePaiement: string;
        date: string; notes?: string; clientName: string;
        commandeNumero?: string; totalAmount: number;
        paidAmount: number; remaining: number;
    };
    // ── Kanban commandes ──
    CommandeKanban: undefined;
    // ── Tissus ──
    Tissus: undefined;
    AddTissu: { preType?: string };
    TissuDetails: { tissuId: string };
    EditTissu: { tissuId: string };
    // ── Réalisations ──
    Realisations: { clientId: string };
    AddRealisation: { clientId: string; commandeId?: string; modeleId?: string };
    RealisationDetails: { realisationId: string; clientId: string };
    EditRealisation: { realisationId: string; clientId: string };
    // ── Catalogue ──
    ModelDetails: { modelId: string };
    AddCatalogModel: undefined;
    EditCatalogModel: { modelId: string };
    // ──────────────
    Statistics: undefined;
    Clients: undefined;
    Login: undefined;
    Register: undefined;
    RegisterClient: undefined;
    ForgotPassword: undefined;
    Welcome: undefined;
    ChooseProfile: undefined;
    ClientWelcome: undefined;
    TailorSetup: undefined;
    Onboarding: undefined;
    BiometricAuth: undefined;
    Profile: undefined;
    Settings: undefined;
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

const Stack     = createNativeStackNavigator<RootStackParamList>();
const TailorTab = createBottomTabNavigator<TailorTabParamList>();
const ClientTab = createBottomTabNavigator<ClientTabParamList>();

// ==========================================
// MENU DIRECTIONNEL (bouton Plus)
// ==========================================

interface PlusMenuItem {
    key: string;
    label: string;
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
}

interface PlusMenuProps {
    visible: boolean;
    onClose: () => void;
    items: PlusMenuItem[];
}

const PlusMenu: React.FC<PlusMenuProps> = ({ visible, onClose, items }) => {
    const anim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.spring(anim, {
            toValue: visible ? 1 : 0,
            useNativeDriver: nativeDriver,
            tension: 80,
            friction: 12,
        }).start();
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
            <Pressable style={styles.menuOverlay} onPress={onClose}>
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            </Pressable>

            <View style={styles.menuContainer} pointerEvents="box-none">
                {items.map((item, i) => {
                    const translateY = anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                    });
                    const opacity = anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                    });

                    return (
                        <Animated.View
                            key={item.key}
                            style={[
                                styles.menuItemWrap,
                                { opacity, transform: [{ translateY }] },
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => { onClose(); item.onPress(); }}
                                activeOpacity={0.75}
                            >
                                <View style={styles.menuIconBox}>
                                    <Feather name={item.icon} size={20} color={PALETTE.gold} />
                                </View>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    );
                })}
            </View>
        </Modal>
    );
};

// ==========================================
// ICÔNE D'ONGLET STANDARD
// ==========================================

interface TabIconProps {
    name: keyof typeof Feather.glyphMap;
    focused: boolean;
    badge?: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, badge }) => (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
        <Feather
            name={name}
            size={21}
            color={focused ? PALETTE.gold : PALETTE.muted}
            strokeWidth={focused ? 2 : 1.6}
        />
        {badge && <View style={styles.badge} />}
    </View>
);

// ==========================================
// BOUTON PLUS CUSTOM (tab bar button)
// ==========================================

interface PlusTabButtonProps {
    onPress: () => void;
    isOpen: boolean;
}

const PlusTabButton: React.FC<PlusTabButtonProps> = ({ onPress, isOpen }) => {
    const rotate = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.spring(rotate, {
            toValue: isOpen ? 1 : 0,
            useNativeDriver: nativeDriver,
            tension: 100,
            friction: 10,
        }).start();
    }, [isOpen]);

    const rotateInterp = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'],
    });

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={styles.plusTabWrap}
        >
            <View style={[styles.plusBtn, isOpen && styles.plusBtnOpen]}>
                <Animated.View style={{ transform: [{ rotate: rotateInterp }] }}>
                    <Feather name="plus" size={22} color={PALETTE.gold} strokeWidth={2.2} />
                </Animated.View>
            </View>
            <Text style={styles.plusLabel}>Plus</Text>
        </TouchableOpacity>
    );
};

// ==========================================
// LABEL D'ONGLET
// ==========================================

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
    </Text>
);

// ==========================================
// 1. NAVIGATOR COUTURIER (5 onglets)
// ==========================================

const TailorTabNavigator = ({ navigation }: any) => {
    const [plusOpen, setPlusOpen] = useState(false);
    const insets = useSafeAreaInsets();

    const plusItems: PlusMenuItem[] = [
        {
            key: 'galerie',
            label: 'Galerie',
            icon: 'image',
            onPress: () => { setPlusOpen(false); navigation.navigate('Galerie'); },
        },
        {
            key: 'recherche',
            label: 'Recherche',
            icon: 'search',
            onPress: () => { setPlusOpen(false); navigation.navigate('Recherche'); },
        },
        {
            key: 'comptabilite',
            label: 'Comptabilité',
            icon: 'trending-up',
            onPress: () => { setPlusOpen(false); navigation.navigate('Comptabilite'); },
        },
        {
            key: 'statistics',
            label: 'Statistiques',
            icon: 'bar-chart-2',
            onPress: () => navigation.navigate('Statistics'),
        },
        {
            key: 'payments',
            label: 'Paiements',
            icon: 'credit-card',
            onPress: () => navigation.navigate('Payments', { clientId: '' }),
        },
        {
            key: 'profile',
            label: 'Profil',
            icon: 'user',
            onPress: () => navigation.navigate('Profile'),
        },
        {
            key: 'settings',
            label: 'Réglages',
            icon: 'settings',
            onPress: () => { /* navigate to settings */ },
        },
    ];

    return (
        <>
            <TailorTab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: [
                        styles.tabBar,
                        { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 },
                    ],
                    tabBarActiveTintColor: PALETTE.gold,
                    tabBarInactiveTintColor: PALETTE.muted,
                    tabBarShowLabel: true,
                }}
            >
                <TailorTab.Screen
                    name="Accueil"
                    component={DashboardScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
                        tabBarLabel: ({ focused }) => <TabLabel label="Accueil" focused={focused} />,
                    }}
                />
                <TailorTab.Screen
                    name="Clients"
                    component={ClientsListScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <TabIcon name="users" focused={focused} />,
                        tabBarLabel: ({ focused }) => <TabLabel label="Clients" focused={focused} />,
                    }}
                />

                {/* ── Bouton Plus central ── */}
                <TailorTab.Screen
                    name="Plus"
                    component={StatisticsScreen}
                    options={{
                        tabBarButton: () => (
                            <PlusTabButton
                                onPress={() => setPlusOpen(true)}
                                isOpen={plusOpen}
                            />
                        ),
                        tabBarLabel: () => null,
                    }}
                />

                <TailorTab.Screen
                    name="Commandes"
                    component={OrdersListScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <TabIcon name="shopping-bag" focused={focused} />,
                        tabBarLabel: ({ focused }) => <TabLabel label="Commandes" focused={focused} />,
                    }}
                />
                <TailorTab.Screen
                    name="Catalogue"
                    component={CatalogScreen}
                    options={{
                        tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} />,
                        tabBarLabel: ({ focused }) => <TabLabel label="Catalogue" focused={focused} />,
                    }}
                />
            </TailorTab.Navigator>

            <PlusMenu
                visible={plusOpen}
                onClose={() => setPlusOpen(false)}
                items={plusItems}
            />
        </>
    );
};

// ==========================================
// 2. NAVIGATOR CLIENT (4 onglets épurés)
// ==========================================

const ClientTabNavigator = ({ navigation }: any) => {
    const { profile } = useProfile();
    const myId = profile?.id ?? '';
    const insets = useSafeAreaInsets();

    return (
        <ClientTab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar,
                    { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 },
                ],
                tabBarActiveTintColor: PALETTE.gold,
                tabBarInactiveTintColor: PALETTE.muted,
            }}
        >
            <ClientTab.Screen
                name="Accueil"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
                    tabBarLabel: ({ focused }) => <TabLabel label="Accueil" focused={focused} />,
                }}
            />
            <ClientTab.Screen
                name="Commandes"
                component={ClientOrdersScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon name="shopping-bag" focused={focused} />,
                    tabBarLabel: ({ focused }) => <TabLabel label="Commandes" focused={focused} />,
                }}
            />
            <ClientTab.Screen
                name="Catalogue"
                component={CatalogScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} />,
                    tabBarLabel: ({ focused }) => <TabLabel label="Catalogue" focused={focused} />,
                }}
            />
            <ClientTab.Screen
                name="Mesures"
                component={MeasurementsScreen}
                initialParams={{ clientId: myId }}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon name="scissors" focused={focused} />,
                    tabBarLabel: ({ focused }) => <TabLabel label="Mesures" focused={focused} />,
                }}
            />
        </ClientTab.Navigator>
    );
};

// ==========================================
// 3. AIGUILLEUR GLOBAL
// ==========================================

interface AppNavigatorProps {
    session: Session | null;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ session }) => {
    const { profile, loading } = useProfile();

    if (session && loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color={PALETTE.gold} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {session ? (
                <>
                    <Stack.Screen name="MainTabs">
                        {(props) =>
                            profile?.role === 'client'
                                ? <ClientTabNavigator {...props} />
                                : <TailorTabNavigator {...props} />
                        }
                    </Stack.Screen>

                    {/* ── Clients ── */}
                    <Stack.Screen name="ClientDetails"   component={ClientDetailsScreen} />
                    <Stack.Screen name="AddClient"       component={AddClientScreen} />
                    <Stack.Screen name="EditClient"      component={EditClientScreen} />

                    {/* ── Mesures ── */}
                    <Stack.Screen name="Measurements"    component={MeasurementsScreen} />
                    <Stack.Screen name="AddMeasurements" component={AddMeasurementsScreen} />
                    <Stack.Screen name="FicheDetails"    component={FicheDetailsScreen} />
                    <Stack.Screen name="CompareFiches"   component={CompareFichesScreen} />
                    <Stack.Screen name="Galerie"             component={GalerieScreen} />
                    <Stack.Screen name="Recherche"           component={RechercheScreen} />
                    <Stack.Screen name="Comptabilite"        component={ComptabiliteScreen} />
                    <Stack.Screen name="ClientPaiements"     component={ClientPaiementsScreen} />
                    <Stack.Screen name="Recu"                component={RecuScreen} />
                    {/*<Stack.Screen name="CommandeKanban"      component={CommandeKanbanScreen} />*/}
                    <Stack.Screen name="Tissus"              component={TissusScreen} />
                    <Stack.Screen name="AddTissu"            component={AddTissuScreen} />
                    <Stack.Screen name="TissuDetails"        component={TissuDetailsScreen} />
                    <Stack.Screen name="EditTissu"           component={EditTissuScreen} />
                    <Stack.Screen name="Realisations"        component={RealisationsScreen} />
                    <Stack.Screen name="AddRealisation"      component={AddRealisationScreen} />
                    <Stack.Screen name="RealisationDetails"  component={RealisationDetailsScreen} />
                    <Stack.Screen name="EditRealisation"     component={EditRealisationScreen} />

                    {/* ── Paiements ── */}
                    <Stack.Screen name="Payments"        component={PaymentsScreen} />
                    <Stack.Screen name="AddPayment"      component={AddPaymentScreen} />

                    {/* ── Commandes ── */}
                    <Stack.Screen name="AddOrder"        component={AddOrderScreen} />
                    <Stack.Screen name="OrderDetails"  component={OrderDetailsScreen} />

                    {/* ── Catalogue ── */}
                    <Stack.Screen name="ModelDetails"     component={ModelDetailsScreen} />
                    <Stack.Screen name="AddCatalogModel"  component={AddCatalogModelScreen} />
                    <Stack.Screen name="EditCatalogModel" component={EditCatalogModelScreen} />

                    {/* ── Divers ── */}
                    <Stack.Screen name="Statistics"      component={StatisticsScreen} />
                    <Stack.Screen name="Profile"         component={ProfileScreen} />
                    <Stack.Screen name="Settings"        component={SettingsScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Onboarding"    component={OnboardingScreen} />
                    <Stack.Screen name="Welcome"        component={WelcomeScreen} />
                    <Stack.Screen name="Login"          component={LoginScreen} />
                    <Stack.Screen name="BiometricAuth"  component={BiometricAuthScreen} />
                    <Stack.Screen name="Register"       component={RegisterScreen} />
                    <Stack.Screen name="ChooseProfile"  component={ChooseProfileScreen} />
                    <Stack.Screen name="RegisterClient" component={ClientRegisterScreen} />
                    <Stack.Screen name="ClientWelcome"  component={ClientWelcomeScreen} />
                    <Stack.Screen name="TailorSetup"    component={TailorSetupScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({

    // ── Loader ──
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PALETTE.bg,
    },

    // ── Tab bar ──
    tabBar: {
        backgroundColor: PALETTE.navBg,
        borderTopWidth: 1,
        borderTopColor: PALETTE.navBorder,
        height: Platform.OS === 'ios' ? 88 : 72,
        paddingTop: 8,
        elevation: 0,
    },

    // ── Icône onglet ──
    tabIconWrap: {
        width: 44,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconWrapActive: {
        backgroundColor: PALETTE.goldBg,
    },

    // ── Badge ──
    badge: {
        position: 'absolute',
        top: 4,
        right: 6,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: PALETTE.gold,
        borderWidth: 1.5,
        borderColor: PALETTE.navBg,
    },

    // ── Label onglet ──
    tabLabel: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.2,
        color: PALETTE.muted,
        marginTop: 2,
    },
    tabLabelActive: {
        color: PALETTE.gold,
    },

    // ── Bouton Plus ──
    plusTabWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 2,
    },
    plusBtn: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: PALETTE.bg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -20,
        ...Platform.select({
            ios: {
                shadowColor: PALETTE.bg,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
            },
            android: { elevation: 8 },
        }),
        borderWidth: 1,
        borderColor: PALETTE.goldRim,
    },
    plusBtnOpen: {
        backgroundColor: PALETTE.surface,
        borderColor: PALETTE.gold,
    },
    plusLabel: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.2,
        color: PALETTE.muted,
        marginTop: 5,
    },

    // ── Menu directionnel ──
    menuOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
    menuContainer: {
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 12,
        paddingHorizontal: 24,
    },
    menuItemWrap: {
        flex: 1,
        maxWidth: 80,
    },
    menuItem: {
        alignItems: 'center',
        gap: 6,
    },
    menuIconBox: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: PALETTE.bg,
        borderWidth: 1,
        borderColor: PALETTE.goldRim,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: PALETTE.bg,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: { elevation: 6 },
        }),
    },
    menuLabel: {
        fontSize: 10,
        fontWeight: '500',
        color: PALETTE.bg,
        letterSpacing: 0.2,
        textAlign: 'center',
    },
});
