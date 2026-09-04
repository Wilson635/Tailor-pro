// ==========================================
// ÉCRAN COMMANDES & TAILLEURS - CÔTÉ CLIENT
// ==========================================

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatCurrencyShort } from '@utils/formatters';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@constants/theme';
import {RootStackParamList} from "@/src/navigation/AppNavigator";
import {NativeStackScreenProps} from "@react-navigation/native-stack";
import {useProfile} from "@hooks/useProfile";

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

export const ClientOrdersScreen: React.FC<Props> = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { orders } = useAppStore();
    const [searchTailor, setSearchTailor] = useState('');
    const { profile } = useProfile();

    // Séparation des commandes du client connecté
    const activeOrders = orders.filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'delivered');
    const pastOrders = orders.filter(o => o.orderStatus === 'completed' || o.orderStatus === 'delivered');

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Mes Commandes</Text>
                <TouchableOpacity style={styles.actionPill} onPress={() => navigation.navigate('AddOrder', { clientId: profile?.id })}>
                    <Ionicons name="add" size={16} color={COLORS.white} />
                    <Text style={styles.actionPillText}>Commander</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Section 1 : Trouver un Couturier ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trouver un atelier ou un tailleur</Text>
                    <View style={styles.searchBarContainer}>
                        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Rechercher par nom, ville, spécialité..."
                            value={searchTailor}
                            onChangeText={setSearchTailor}
                            placeholderTextColor={COLORS.textMuted}
                        />
                    </View>

                    {/* Proposition d'ateliers partenaires rapides */}
                    <Card style={styles.findTailorCard}>
                        <View style={styles.tailorInfo}>
                            <View style={styles.tailorAvatar}>
                                <Ionicons name="cut-outline" size={20} color={COLORS.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.tailorName}>Atelier Haute Couture Pro</Text>
                                <Text style={styles.tailorSub}>À 1.2 km • Costume, Robes de mariée</Text>
                            </View>
                            <TouchableOpacity style={styles.connectBtn}>
                                <Text style={styles.connectBtnText}>Contacter</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>

                {/* ── Section 2 : Commandes Actives ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>En cours de confection ({activeOrders.length})</Text>
                    {activeOrders.length === 0 ? (
                        <Card style={styles.emptyCard}>
                            <Ionicons name="shirt-outline" size={32} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Aucune commande en cours chez votre couturier.</Text>
                        </Card>
                    ) : (
                        activeOrders.map(order => (
                            <Card key={order.id} style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderName}>{order.clothingType || 'Modèle personnalisé'}</Text>
                                        <Text style={styles.atelierTag}>🧵 {'Mon Tailleur'}</Text>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusText}>{order.orderStatus}</Text>
                                    </View>
                                </View>
                                <View style={styles.orderFooter}>
                                    <Text style={styles.orderPrice}>Total : {formatCurrencyShort(order.totalPrice)}</Text>
                                    {order.remainingAmount > 0 && (
                                        <Text style={styles.orderRemaining}>Reste : {formatCurrencyShort(order.remainingAmount)}</Text>
                                    )}
                                </View>
                            </Card>
                        ))
                    )}
                </View>

                {/* ── Section 3 : Historique Passé ── */}
                {pastOrders.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Historique des commandes</Text>
                        {pastOrders.map(order => (
                            <Card key={order.id} style={[styles.orderCard, styles.pastOrderCard]}>
                                <View style={styles.orderHeader}>
                                    <Text style={styles.pastOrderName}>{order.clothingType || 'Livrable accompli'}</Text>
                                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                                </View>
                                <Text style={styles.orderFooterText}>Livré avec succès • {formatCurrencyShort(order.totalPrice)}</Text>
                            </Card>
                        ))}
                    </View>
                )}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    headerTitle: { fontSize: FONT_SIZES.lg, fontFamily: 'PlusJakartaSans_700Bold', color: COLORS.text },
    actionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm - 2, borderRadius: BORDER_RADIUS.full },
    actionPillText: { fontSize: FONT_SIZES.xs, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.white },
    scrollContent: { padding: SPACING.lg },
    section: { marginBottom: SPACING.xl },
    sectionTitle: { fontSize: FONT_SIZES.sm, fontFamily: 'PlusJakartaSans_700Bold', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: SPACING.md },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md, height: 46, marginBottom: SPACING.sm },
    searchInput: { flex: 1, marginLeft: SPACING.sm, fontSize: FONT_SIZES.sm, color: COLORS.text },
    findTailorCard: { padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
    tailorInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    tailorAvatar: { width: 40, height: 40, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
    tailorName: { fontSize: FONT_SIZES.sm, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.text },
    tailorSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
    connectBtn: { backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md },
    connectBtnText: { fontSize: FONT_SIZES.xs, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.primary },
    emptyCard: { padding: SPACING.xl, alignItems: 'center', gap: SPACING.sm, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.border },
    emptyText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
    orderCard: { padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
    pastOrderCard: { opacity: 0.75, backgroundColor: COLORS.gray100 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderName: { fontSize: FONT_SIZES.md, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.text },
    pastOrderName: { fontSize: FONT_SIZES.sm, fontFamily: 'PlusJakartaSans_500Medium', color: COLORS.textSecondary },
    atelierTag: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 4 },
    statusBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
    statusText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'capitalize' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 0.5, borderTopColor: COLORS.border },
    orderPrice: { fontSize: FONT_SIZES.sm, fontFamily: 'PlusJakartaSans_500Medium', color: COLORS.text },
    orderRemaining: { fontSize: FONT_SIZES.sm, fontFamily: 'PlusJakartaSans_600SemiBold', color: COLORS.error },
    orderFooterText: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: SPACING.xs },
});