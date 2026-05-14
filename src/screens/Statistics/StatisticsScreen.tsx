// ==========================================
// ÉCRAN STATISTIQUES - TailorPro
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { Header, Card, StatCard } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface StatisticsScreenProps {
  onBack?: () => void;
}

export const StatisticsScreen: React.FC<StatisticsScreenProps> = ({
  onBack,
}) => {
  const { statistics } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const pieChartData = [
    {
      name: 'Réglées',
      population: 60,
      color: COLORS.success,
      legendFontColor: COLORS.gray600,
      legendFontSize: 12,
    },
    {
      name: 'En attente',
      population: 40,
      color: COLORS.warning,
      legendFontColor: COLORS.gray600,
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="Statistiques"
        showBack
        onBackPress={onBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <TouchableOpacity style={styles.periodSelector}>
          <Text style={styles.periodText}>Ce mois</Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.text} />
        </TouchableOpacity>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Revenus</Text>
              <Text style={styles.statValue}>{formatCurrency(statistics.monthlyRevenue)}</Text>
              <Text style={styles.statTrend}>
                <Text style={styles.trendPositive}>{formatPercentage(statistics.revenueGrowth)}</Text>
              </Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Dépenses</Text>
              <Text style={styles.statValue}>{formatCurrency(statistics.totalExpenses)}</Text>
              <Text style={styles.statTrend}>
                <Text style={styles.trendNegative}>-8%</Text>
              </Text>
            </Card>
          </View>
          
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Bénéfice</Text>
              <Text style={styles.statValue}>{formatCurrency(statistics.netProfit)}</Text>
              <Text style={styles.statTrend}>
                <Text style={styles.trendPositive}>+25%</Text>
              </Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Commandes</Text>
              <Text style={styles.statValue}>{statistics.ordersInProgress + statistics.completedOrders}</Text>
              <Text style={styles.statTrend}>
                <Text style={styles.trendPositive}>+12%</Text>
              </Text>
            </Card>
          </View>
        </View>

        {/* Payment Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répartition des paiements</Text>
          
          <Card style={styles.chartCard}>
            <View style={styles.chartContainer}>
              <PieChart
                data={pieChartData}
                width={width - SPACING.lg * 4}
                height={180}
                chartConfig={{
                  color: () => COLORS.primary,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
            </View>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendLabel}>Réglées</Text>
                <Text style={styles.legendValue}>60%</Text>
                <Text style={styles.legendAmount}>{formatCurrency(750000)}</Text>
              </View>
              
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendLabel}>En attente</Text>
                <Text style={styles.legendValue}>40%</Text>
                <Text style={styles.legendAmount}>{formatCurrency(500000)}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Ionicons name="people-outline" size={24} color={COLORS.primary} />
            <Text style={styles.quickStatValue}>{statistics.totalClients}</Text>
            <Text style={styles.quickStatLabel}>Clients</Text>
          </View>
          
          <View style={styles.quickStatDivider} />
          
          <View style={styles.quickStatItem}>
            <Ionicons name="time-outline" size={24} color={COLORS.warning} />
            <Text style={styles.quickStatValue}>{statistics.ordersInProgress}</Text>
            <Text style={styles.quickStatLabel}>En cours</Text>
          </View>
          
          <View style={styles.quickStatDivider} />
          
          <View style={styles.quickStatItem}>
            <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.success} />
            <Text style={styles.quickStatValue}>{statistics.completedOrders}</Text>
            <Text style={styles.quickStatLabel}>Terminées</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  
  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  // Stats Grid
  statsGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray500,
    marginBottom: SPACING.xs,
  },
  statValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  statTrend: {
    marginTop: SPACING.xs,
  },
  trendPositive: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.success,
  },
  trendNegative: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
  },
  
  // Section
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  
  // Chart
  chartCard: {
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  legendContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray600,
    flex: 1,
  },
  legendValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    width: 40,
  },
  legendAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    textAlign: 'right',
    minWidth: 100,
  },
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  quickStatLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray500,
    marginTop: SPACING.xs,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: COLORS.gray200,
    marginHorizontal: SPACING.md,
  },
});
