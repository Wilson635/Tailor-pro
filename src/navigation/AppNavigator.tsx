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
    ForgotPassword: undefined;
    Clients: undefined;
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
