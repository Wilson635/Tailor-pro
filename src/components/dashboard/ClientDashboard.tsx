// @components/dashboard/ClientDashboard.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@components/ui';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency, formatRelativeTime } from '@utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '@constants/theme';

export const ClientDashboard: React.FC = () => {
    // Extraction des données filtrées depuis ton store !
    const { orders, activities } = useAppStore();

    // Filtrer les commandes en cours côté client
    const activeOrders = orders.filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'delivered');
    const totalActiveCount = activeOrders.length;

    // Calcul du montant total restant à payer par le client
    const totalRemainingPayment = activeOrders.reduce((sum, o) => sum + (o.remainingAmount || 0), 0);

    // Icones dynamiques pour le fil d'activité du client
    const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'new_order':        return 'shirt-outline';
            case 'payment_received': return 'cash-outline';
            case 'order_completed':  return 'gift-outline';
            default:                 return 'ellipse-outline';
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* ── Carte Statut Client ── */}
            <View style={styles.heroCard}>
                <View style={styles.heroCircle1} />
                <View style={styles.heroCircle2} />

                <Text style={styles.heroLabel}>Mes commandes en cours</Text>
                <Text style={styles.heroAmount}>
                    {totalActiveCount} {totalActiveCount > 1 ? 'Tenues' : 'Tenue'}
                </Text>

                {totalRemainingPayment > 0 && (
                    <View style={styles.paymentAlertPill}>
                        <Ionicons name="wallet-outline" size={12} color={COLORS.error} />
                        <Text style={styles.paymentAlertText}>
                            Reste à régler : {formatCurrency(totalRemainingPayment)}
                        </Text>
                    </View>
                )}
            </View>

            {/* ── Actions Rapides Spécifiques Client ── */}
            <View style={styles.quickRow}>
                <TouchableOpacity style={styles.quickBtn}>
                    <Ionicons name="body-outline" size={22} color={COLORS.primary} />
                    <Text style={styles.quickLabel}>Mes Mesures</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn}>
                    <Ionicons name="images-outline" size={22} color={COLORS.primary} />
                    <Text style={styles.quickLabel}>Catalogue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickBtn}>
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color={COLORS.primary} />
                    <Text style={styles.quickLabel}>Mon Couturier</Text>
                </TouchableOpacity>
            </View>

            {/* ── Liste des commandes du client ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suivi de mes confections</Text>
                {activeOrders.length === 0 ? (
                    <Card style={styles.emptyCard}>
                        <Ionicons name="sparkles-outline" size={28} color={COLORS.gray400} />
                        <Text style={styles.emptyText}>Aucune commande en cours pour le moment.</Text>
                    </Card>
                ) : (
                    activeOrders.map(order => (
                        <Card key={order.id} style={styles.orderCard}>
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderTitle}>{order.clothingType || 'Commande de couture'}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{order.orderStatus}</Text>
                                </View>
                            </View>
                            <Text style={styles.orderSub}>Total : {formatCurrency(order.totalPrice)}</Text>
                        </Card>
                    ))
                )}
            </View>

            {/* ── Historique Récent des Activités du Client ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historique récent</Text>
                <Card padding="none" style={styles.activitiesCard}>
                    {activities.slice(0, 4).map((activity, index) => (
                        <View key={activity.id}>
                            <View style={styles.activityItem}>
                                <View style={styles.activityIconContainer}>
                                    <Ionicons name={getActivityIcon(activity.type)} size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>{activity.title}</Text>
                                    <Text style={styles.activitySubtitle}>{formatRelativeTime(activity.timestamp)}</Text>
                                </View>
                            </View>
                            {index < Math.min(activities.length, 4) - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </Card>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: SPACING.lg, backgroundColor: COLORS.background },
    heroCard: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xxl, padding: SPACING.xl, marginBottom: SPACING.lg, overflow: 'hidden', position: 'relative' },
    heroCircle1: { position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' },
    heroCircle2: { position: 'absolute', bottom: -50, left: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.04)' },
    heroLabel: { fontSize: FONT_SIZES.xs, color: 'rgba(255,255,255,0.6)', fontWeight: FONT_WEIGHTS.medium, textTransform: 'uppercase', letterSpacing: 1 },
    heroAmount: { fontSize: FONT_SIZES.display, fontWeight: FONT_WEIGHTS.bold, color: COLORS.white, marginTop: SPACING.xs },
    paymentAlertPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.2)', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full, marginTop: SPACING.sm, alignSelf: 'flex-start' },
    paymentAlertText: { fontSize: FONT_SIZES.xs, color: '#FCA5A5', fontWeight: FONT_WEIGHTS.semibold },
    quickRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    quickBtn: { flex: 1, backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', gap: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
    quickLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHTS.medium },
    section: { marginBottom: SPACING.lg },
    sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: FONT_WEIGHTS.semibold, color: COLORS.text, marginBottom: SPACING.md },
    orderCard: { padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.sm },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderTitle: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
    statusBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: BORDER_RADIUS.full },
    statusText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: FONT_WEIGHTS.bold, textTransform: 'capitalize' },
    orderSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: SPACING.xs },
    emptyCard: { padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed' },
    emptyText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, textAlign: 'center' },
    activitiesCard: { overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.lg },
    activityItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, gap: SPACING.md },
    activityIconContainer: { width: 36, height: 36, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.gray100, alignItems: 'center', justifyContent: 'center' },
    activityContent: { flex: 1 },
    activityTitle: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.medium, color: COLORS.text },
    activitySubtitle: { fontSize: FONT_SIZES.xs, color: COLORS.textLight, marginTop: 2 },
    divider: { height: 1, backgroundColor: COLORS.gray100, marginLeft: SPACING.xl * 2 },
});