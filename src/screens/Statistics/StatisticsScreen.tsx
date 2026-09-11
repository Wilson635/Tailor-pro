// ──────────────────────────────────────────────────────────
// StatisticsScreen — Module 12
// Analytique avancée : graphiques, top clients, top modèles,
// catégories, meilleur mois, filtrage période, export Excel.
// ──────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback } from 'react';
import { showAlert } from '@/src/context/DialogContext';
import {
  View, Text, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { useThemedStyles, type Palette } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '@store/useAppStore';
import { formatCurrency } from '@utils/formatters';
import { exportExcelFile, exportPdfFile } from '@utils/exportFiles';

const { width: W } = Dimensions.get('window');
const CHART_W = W - 32;

const hexAlpha = (hex: string, opacity = 1) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacity})`;
};

// ── Labels catégories ─────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  femme: 'Femme', homme: 'Homme', enfant: 'Enfant',
  mariage: 'Mariage', traditionnel: 'Traditionnel',
  costume: 'Costume', robe: 'Robe', chemise: 'Chemise',
  casual: 'Casual', luxe: 'Luxe', all: 'Autre',
};

const CAT_COLORS = [
  '#6C3EB8', '#D4AF37', '#059669', '#DC2626', '#D97706',
  '#0369A1', '#7C3AED', '#BE185D',
];

// ── Couleurs PieChart statuts ─────────────────────────────
const PIE_PAID    = '#059669';
const PIE_PARTIAL = '#D97706';
const PIE_UNPAID  = '#DC2626';

const SectionTitle = ({ children, style }: { children: string; style?: object }) => {
  const { styles: s } = useThemedStyles(makeStyles);
  return <Text style={[s.sectionTitle, style]}>{children}</Text>;
};

const KpiCard = ({
                   icon, label, value, sub, color, bg,
                 }: {
  icon: string; label: string; value: string;
  sub?: string; color: string; bg: string;
}) => {
  const { styles: s } = useThemedStyles(makeStyles);
  return (
    <View style={[s.kpiCard, { borderLeftColor: color }]}>
      <View style={[s.kpiIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={s.kpiValue}>{value}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
      {sub ? <Text style={s.kpiSub}>{sub}</Text> : null}
    </View>
  );
};

const HBar = ({
                label, value, maxValue, suffix = '', color,
              }: {
  label: string; value: number; maxValue: number;
  suffix?: string; color?: string;
}) => {
  const { colors: P, styles: s } = useThemedStyles(makeStyles);
  const fill = color ?? P.primary;
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
      <View style={s.hBarRow}>
        <Text style={s.hBarLabel} numberOfLines={1}>{label}</Text>
        <View style={s.hBarTrack}>
          <View style={[s.hBarFill, { width: `${Math.max(pct, 2)}%`, backgroundColor: fill }]} />
        </View>
        <Text style={[s.hBarValue, { color: fill }]}>{suffix}{typeof value === 'number' && value > 999 ? formatCurrency(value) : value}</Text>
      </View>
  );
};

// ──────────────────────────────────────────────────────────
// SCREEN
// ──────────────────────────────────────────────────────────
type PeriodKey = 6 | 12 | 24;

export const StatisticsScreen = () => {
  const navigation = useNavigation();
  const { colors: P, styles: s } = useThemedStyles(makeStyles);
  const { clients, orders, realisations, catalog } = useAppStore();

  const [monthCount, setMonthCount] = useState<PeriodKey>(12);
  const [exporting,  setExporting]  = useState(false);

  const chartConfig = useMemo(() => ({
    backgroundColor: P.surface,
    backgroundGradientFrom: P.surface,
    backgroundGradientTo: P.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => hexAlpha(P.primary, opacity),
    labelColor: () => P.sub,
    propsForBackgroundLines: { stroke: P.border },
    barPercentage: 0.55,
  }), [P]);

  // ── Réalisations aplaties ─────────────────────────────
  const allReals = useMemo(
      () => Object.values(realisations).flat(),
      [realisations]
  );

  // ── Plage de dates de la période ──────────────────────
  const periodStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - monthCount + 1, 1);
  }, [monthCount]);

  // ── Commandes dans la période ─────────────────────────
  const periodOrders = useMemo(
      () => orders.filter(o => o.createdAt >= periodStart),
      [orders, periodStart]
  );

  // ── Données mensuelles (CA + nb commandes) ────────────
  const monthlyStats = useMemo(() => {
    const now = new Date();
    return Array.from({ length: monthCount }, (_, i) => {
      const d        = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - i), 1);
      const nextD    = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthOs  = orders.filter(o => o.createdAt >= d && o.createdAt < nextD);
      return {
        label:   d.toLocaleDateString('fr-FR', { month: 'short' }),
        orders:  monthOs.length,
        revenue: monthOs.reduce((s, o) => s + (o.totalPrice ?? 0), 0),
      };
    });
  }, [orders, monthCount]);

  // ── Meilleur mois ─────────────────────────────────────
  const bestMonth = useMemo(() =>
          monthlyStats.reduce(
              (best, m) => m.revenue > best.revenue ? m : best,
              monthlyStats[0] ?? { label: '—', revenue: 0, orders: 0 }
          ),
      [monthlyStats]
  );

  // ── CA total période ──────────────────────────────────
  const totalRevenuePeriod = useMemo(
      () => periodOrders.reduce((s, o) => s + (o.totalPrice ?? 0), 0),
      [periodOrders]
  );

  // ── Stats clients ─────────────────────────────────────
  const clientsStats = useMemo(() => {
    const ordersByClient = new Map<string, number>();
    orders.forEach(o => ordersByClient.set(o.clientId, (ordersByClient.get(o.clientId) ?? 0) + 1));
    const fideles  = [...ordersByClient.values()].filter(c => c > 2).length;
    const nouveaux = clients.filter(c => new Date(c.createdAt) >= periodStart).length;
    return { total: clients.length, nouveaux, fideles };
  }, [clients, orders, periodStart]);

  // ── Top 5 clients (par CA) ────────────────────────────
  const topClients = useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    orders.forEach(o => {
      const e = map.get(o.clientId);
      if (e) { e.total += (o.totalPrice ?? 0); e.count++; }
      else map.set(o.clientId, { name: o.clientName ?? '—', total: o.totalPrice ?? 0, count: 1 });
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [orders]);

  // ── Top 5 modèles ─────────────────────────────────────
  const topModeles = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    allReals.forEach(r => {
      if (!r.modeleId) return;
      const m = catalog.find(c => c.id === r.modeleId);
      if (!m) return;
      const e = map.get(r.modeleId);
      if (e) e.count++;
      else map.set(r.modeleId, { name: m.nom, count: 1 });
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [allReals, catalog]);

  // ── Top catégories ────────────────────────────────────
  const categorieStats = useMemo(() => {
    const map = new Map<string, number>();
    allReals.forEach(r => {
      if (!r.modeleId) return;
      const m = catalog.find(c => c.id === r.modeleId);
      if (!m) return;
      map.set(m.categorie, (map.get(m.categorie) ?? 0) + 1);
    });
    return [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
  }, [allReals, catalog]);

  // ── Répartition statuts paiements ─────────────────────
  const paiementStats = useMemo(() => {
    const paid    = orders.filter(o => o.paymentStatus === 'paid').length;
    const partial = orders.filter(o => o.paymentStatus === 'partial').length;
    const unpaid  = orders.filter(o => o.paymentStatus === 'unpaid').length;
    return { paid, partial, unpaid, total: orders.length };
  }, [orders]);

  // ── Répartition statuts commandes ─────────────────────
  const commandeStats = useMemo(() => {
    const inProgress  = orders.filter(o => ['en_confection','essayage','retouches','in_progress'].includes(o.orderStatus)).length;
    const terminee    = orders.filter(o => ['terminee','completed'].includes(o.orderStatus)).length;
    const livree      = orders.filter(o => ['livree','delivered'].includes(o.orderStatus)).length;
    const annulee     = orders.filter(o => ['annulee','cancelled'].includes(o.orderStatus)).length;
    return { inProgress, terminee, livree, annulee, total: orders.length };
  }, [orders]);

  // ── Données BarChart CA mensuel ───────────────────────
  const barDataRevenu = useMemo(() => ({
    labels:   monthlyStats.map(m => m.label),
    datasets: [{ data: monthlyStats.map(m => Math.max(Math.round((m.revenue ?? 0) / 1000), 0)) }],
  }), [monthlyStats]);

  const barDataCommandes = useMemo(() => ({
    labels:   monthlyStats.map(m => m.label),
    datasets: [{ data: monthlyStats.map(m => m.orders) }],
  }), [monthlyStats]);

  // ── PieChart paiements ────────────────────────────────
  const pieDataPaiements = useMemo(() => {
    const items = [
      { name: 'Payées',    population: paiementStats.paid,    color: PIE_PAID,    legendFontColor: P.text, legendFontSize: 11 },
      { name: 'Part.',     population: paiementStats.partial,  color: PIE_PARTIAL, legendFontColor: P.text, legendFontSize: 11 },
      { name: 'Impayées', population: paiementStats.unpaid,   color: PIE_UNPAID,  legendFontColor: P.text, legendFontSize: 11 },
    ].filter(d => d.population > 0);
    return items.length ? items : [{ name: 'Aucune', population: 1, color: P.border, legendFontColor: P.sub, legendFontSize: 11 }];
  }, [paiementStats, P]);

  // ── PieChart catégories ───────────────────────────────
  const pieDataCategories = useMemo(() => {
    if (categorieStats.length === 0) return [{ name: 'Aucune', population: 1, color: P.border, legendFontColor: P.sub, legendFontSize: 11 }];
    return categorieStats.map(([cat, count], i) => ({
      name:            CAT_LABELS[cat] ?? cat,
      population:      count,
      color:           CAT_COLORS[i % CAT_COLORS.length],
      legendFontColor: P.text,
      legendFontSize:  11,
    }));
  }, [categorieStats, P]);

  // ── Export Excel ────────────────────────────────────────
  const exportExcel = useCallback(async (kind: 'xlsx' | 'pdf' = 'xlsx') => {
    setExporting(true);
    try {
      const data = [
        { Indicateur: 'Clients totaux', Valeur: clientsStats.total, Detail: '' },
        { Indicateur: 'Nouveaux clients', Valeur: clientsStats.nouveaux, Detail: 'période' },
        { Indicateur: 'Clients fidèles', Valeur: clientsStats.fideles, Detail: '> 2 commandes' },
        { Indicateur: 'Commandes', Valeur: orders.length, Detail: '' },
        { Indicateur: 'CA période', Valeur: totalRevenuePeriod, Detail: 'FCFA' },
        { Indicateur: 'Meilleur mois', Valeur: bestMonth.label, Detail: `${bestMonth.revenue} FCFA` },
        ...monthlyStats.map(m => ({ Indicateur: `CA ${m.label}`, Valeur: m.revenue, Detail: `${m.orders} cmd` })),
        ...topClients.map(c => ({ Indicateur: `Client ${c.name}`, Valeur: c.total, Detail: `${c.count} cmd` })),
        ...topModeles.map(m => ({ Indicateur: `Modèle ${m.name}`, Valeur: m.count, Detail: 'réalisations' })),
      ];
      const name = `TailorPro_Statistiques_${monthCount}mois`;
      if (kind === 'pdf') await exportPdfFile(name, 'Statistiques atelier', data);
      else await exportExcelFile(name, data, 'Statistiques');
    } catch {
      showAlert('Erreur', "Impossible d'exporter.");
    } finally {
      setExporting(false);
    }
  }, [monthlyStats, topClients, topModeles, clientsStats, orders, totalRevenuePeriod, bestMonth, monthCount]);

  const askExport = () => {
    showAlert('Exporter', 'Choisissez un format', [
      { text: 'Excel', onPress: () => exportExcel('xlsx') },
      { text: 'PDF', onPress: () => exportExcel('pdf') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  const maxRevenu    = Math.max(...topClients.map(c => c.total), 1);
  const maxModele    = Math.max(...topModeles.map(m => m.count), 1);

  return (
      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => (navigation as any).goBack()}>
            <Ionicons name="arrow-back" size={18} color={P.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.kicker}>Atelier</Text>
            <Text style={s.headerTitle}>Statistiques</Text>
          </View>
          <TouchableOpacity
              style={[s.exportBtn, exporting && { opacity: 0.6 }]}
              onPress={askExport}
              disabled={exporting}
          >
            {exporting
                ? <ActivityIndicator size="small" color={P.gold} />
                : <Ionicons name="download-outline" size={18} color={P.gold} />
            }
          </TouchableOpacity>
        </View>

        {/* Filtre période */}
        <View style={s.periodRow}>
          {([6, 12, 24] as PeriodKey[]).map(n => (
              <TouchableOpacity
                  key={n}
                  style={[s.periodChip, monthCount === n && s.periodChipActive]}
                  onPress={() => setMonthCount(n)}
                  activeOpacity={0.75}
              >
                <Text style={[s.periodText, monthCount === n && s.periodTextActive]}>
                  {n} mois
                </Text>
              </TouchableOpacity>
          ))}
        </View>

        <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
        >
          {/* ── Vue d'ensemble ──────────────────────── */}
          <SectionTitle>Vue d'ensemble</SectionTitle>
          <View style={s.kpiGrid}>
            <KpiCard
                icon="people-outline"
                label="Clients totaux"
                value={String(clientsStats.total)}
                sub={`+${clientsStats.nouveaux} cette période`}
                color={P.primary}
                bg={P.primaryBg}
            />
            <KpiCard
                icon="bag-handle-outline"
                label="Commandes"
                value={String(orders.length)}
                sub={`${commandeStats.inProgress} en cours`}
                color={P.gold}
                bg={P.goldBg}
            />
          </View>
          <View style={[s.kpiGrid, { marginTop: 10 }]}>
            <KpiCard
                icon="trending-up-outline"
                label="CA période"
                value={formatCurrency(totalRevenuePeriod)}
                sub={`${monthCount} derniers mois`}
                color={P.success}
                bg={P.successBg}
            />
            <KpiCard
                icon="star"
                label="Meilleur mois"
                value={bestMonth.label}
                sub={formatCurrency(bestMonth.revenue)}
                color={P.gold}
                bg={P.goldBg}
            />
          </View>

          {/* ── Clients fidèles ──────────────────────── */}
          <View style={[s.card, { marginTop: 16, flexDirection: 'row', alignItems: 'center', padding: 14, gap: 16 }]}>
            <View style={s.fideleStat}>
              <Text style={s.fideleNum}>{clientsStats.fideles}</Text>
              <Text style={s.fideleLabel}>Clients fidèles{'\n'}(> 2 commandes)</Text>
            </View>
            <View style={s.fideleDivider} />
            <View style={s.fideleStat}>
              <Text style={[s.fideleNum, { color: P.primary }]}>{clientsStats.nouveaux}</Text>
              <Text style={s.fideleLabel}>Nouveaux clients{'\n'}cette période</Text>
            </View>
            <View style={s.fideleDivider} />
            <View style={s.fideleStat}>
              <Text style={[s.fideleNum, { color: P.success }]}>{commandeStats.livree}</Text>
              <Text style={s.fideleLabel}>Commandes{'\n'}livrées</Text>
            </View>
          </View>

          {/* ── BarChart CA mensuel ─────────────────── */}
          <SectionTitle style={{ marginTop: 24 }}>Chiffre d'affaires mensuel (×1 000 FCFA)</SectionTitle>
          <View style={s.chartCard}>
            <BarChart
                data={barDataRevenu}
                width={CHART_W - 24}
                height={190}
                chartConfig={chartConfig}
                yAxisLabel=""
                yAxisSuffix="k"
                withInnerLines
                showValuesOnTopOfBars={false}
                fromZero
                style={{ borderRadius: 8, marginLeft: -4 }}
            />
          </View>

          {/* ── BarChart commandes ──────────────────── */}
          <SectionTitle style={{ marginTop: 24 }}>Commandes par mois</SectionTitle>
          <View style={s.chartCard}>
            <BarChart
                data={barDataCommandes}
                width={CHART_W - 24}
                height={170}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => hexAlpha(P.gold, opacity),
                }}
                yAxisLabel=""
                yAxisSuffix=""
                withInnerLines
                showValuesOnTopOfBars={false}
                fromZero
                style={{ borderRadius: 8, marginLeft: -4 }}
            />
          </View>

          {/* ── Top clients ─────────────────────────── */}
          {topClients.length > 0 && (
              <>
                <SectionTitle style={{ marginTop: 24 }}>Top clients (par CA)</SectionTitle>
                <View style={s.card}>
                  {topClients.map((c, i) => (
                      <View key={i}>
                        <HBar
                            label={c.name}
                            value={c.total}
                            maxValue={maxRevenu}
                            color={i === 0 ? P.gold : P.primary}
                        />
                        {i < topClients.length - 1 && <View style={s.divider} />}
                      </View>
                  ))}
                </View>
              </>
          )}

          {/* ── PieChart paiements ──────────────────── */}
          <SectionTitle style={{ marginTop: 24 }}>Répartition des paiements</SectionTitle>
          <View style={s.chartCard}>
            <PieChart
                data={pieDataPaiements}
                width={CHART_W - 24}
                height={160}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="10"
                absolute
            />
            {/* Légende enrichie */}
            <View style={s.pieLegend}>
              {[
                { label: 'Payées',   count: paiementStats.paid,    color: PIE_PAID    },
                { label: 'Part.',    count: paiementStats.partial,  color: PIE_PARTIAL },
                { label: 'Impayées',count: paiementStats.unpaid,   color: PIE_UNPAID  },
              ].map(item => (
                  <View key={item.label} style={s.pieLegendItem}>
                    <View style={[s.pieDot, { backgroundColor: item.color }]} />
                    <Text style={s.pieLegendLabel}>{item.label}</Text>
                    <Text style={[s.pieLegendCount, { color: item.color }]}>{item.count}</Text>
                  </View>
              ))}
            </View>
          </View>

          {/* ── PieChart catégories ─────────────────── */}
          {categorieStats.length > 0 && (
              <>
                <SectionTitle style={{ marginTop: 24 }}>Catégories populaires</SectionTitle>
                <View style={s.chartCard}>
                  <PieChart
                      data={pieDataCategories}
                      width={CHART_W - 24}
                      height={160}
                      chartConfig={chartConfig}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="10"
                      absolute
                  />
                </View>
              </>
          )}

          {/* ── Top modèles ─────────────────────────── */}
          {topModeles.length > 0 && (
              <>
                <SectionTitle style={{ marginTop: 24 }}>Top modèles réalisés</SectionTitle>
                <View style={s.card}>
                  {topModeles.map((m, i) => (
                      <View key={i}>
                        <HBar
                            label={m.name}
                            value={m.count}
                            maxValue={maxModele}
                            suffix=""
                            color={CAT_COLORS[i % CAT_COLORS.length]}
                        />
                        {i < topModeles.length - 1 && <View style={s.divider} />}
                      </View>
                  ))}
                </View>
              </>
          )}

          {/* ── Statuts commandes ───────────────────── */}
          <SectionTitle style={{ marginTop: 24 }}>Statuts des commandes</SectionTitle>
          <View style={s.card}>
            {[
              { label: 'En confection', count: commandeStats.inProgress, color: P.primary },
              { label: 'Terminées',     count: commandeStats.terminee,   color: P.success },
              { label: 'Livrées',       count: commandeStats.livree,     color: P.gold    },
              { label: 'Annulées',      count: commandeStats.annulee,    color: P.error   },
            ].map((item, i, arr) => (
                <View key={item.label}>
                  <View style={s.statutRow}>
                    <View style={[s.statutDot, { backgroundColor: item.color }]} />
                    <Text style={s.statutLabel}>{item.label}</Text>
                    <Text style={[s.statutCount, { color: item.color }]}>{item.count}</Text>
                    <Text style={s.statutPct}>
                      {commandeStats.total > 0
                          ? `${Math.round((item.count / commandeStats.total) * 100)}%`
                          : '0%'}
                    </Text>
                  </View>
                  {i < arr.length - 1 && <View style={s.divider} />}
                </View>
            ))}
          </View>

          {/* ── Export ──────────────────────────────── */}
          <TouchableOpacity
              style={[s.exportFullBtn, exporting && { opacity: 0.6 }]}
              onPress={askExport}
              disabled={exporting}
              activeOpacity={0.85}
          >
            <Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.exportFullBtnText}>
              {exporting ? 'Export en cours…' : 'Exporter Excel ou PDF'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────
const makeStyles = (P: Palette) => ({
  safe:   { flex: 1, backgroundColor: P.pageBg },

  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 0.5, borderColor: P.borderHard,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  kicker: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.gold,
    letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 2,
  },
  headerTitle: { color: P.text, fontSize: 26, fontFamily: 'PlusJakartaSans_800ExtraBold', letterSpacing: -0.6 },
  headerSub:   { color: P.sub, fontSize: 13, marginTop: 4 },
  exportBtn: {
    width: 40, height: 40, borderRadius: 12, marginTop: 4,
    backgroundColor: P.bg, borderWidth: 1, borderColor: P.goldRim,
    justifyContent: 'center', alignItems: 'center',
  },

  periodRow: {
    flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 10, gap: 8,
  },
  periodChip: {
    flex: 1, paddingVertical: 8, borderRadius: 20,
    borderWidth: 0.5, borderColor: P.borderHard,
    alignItems: 'center', backgroundColor: P.surface,
  },
  periodChipActive: { backgroundColor: P.bg, borderColor: P.goldRim },
  periodText:       { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: P.sub },
  periodTextActive: { color: '#fff' },

  sectionTitle: {
    fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', color: P.sub,
    letterSpacing: 0.6, textTransform: 'uppercase',
    marginBottom: 10,
  },

  kpiGrid: { flexDirection: 'row', gap: 10 },
  kpiCard: {
    flex: 1, backgroundColor: P.surface, borderRadius: 16,
    padding: 14, borderLeftWidth: 3, borderWidth: 0.5, borderColor: P.borderHard,
  },
  kpiIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  kpiValue: { fontSize: 16, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  kpiLabel: { fontSize: 10, color: P.sub, marginTop: 2 },
  kpiSub:   { fontSize: 9, color: P.sub, marginTop: 1, fontStyle: 'italic' },

  card: {
    backgroundColor: P.surface, borderRadius: 16,
    overflow: 'hidden' as const, paddingHorizontal: 14,
    borderWidth: 0.5, borderColor: P.borderHard,
  },
  chartCard: {
    backgroundColor: P.surface, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 12,
    borderWidth: 0.5, borderColor: P.borderHard,
  },

  divider: { height: 1, backgroundColor: P.border },

  // Fidèles
  fideleStat:    { flex: 1, alignItems: 'center' },
  fideleNum:     { fontSize: 22, fontFamily: 'PlusJakartaSans_800ExtraBold', color: P.text },
  fideleLabel:   { fontSize: 10, color: P.sub, textAlign: 'center', marginTop: 2, lineHeight: 14 },
  fideleDivider: { width: 1, height: 40, backgroundColor: P.border },

  // HBar
  hBarRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  hBarLabel: { fontSize: 12, color: P.text, width: 90 },
  hBarTrack: { flex: 1, height: 7, borderRadius: 4, backgroundColor: P.primaryBg },
  hBarFill:  { height: 7, borderRadius: 4 },
  hBarValue: { fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold', width: 80, textAlign: 'right' },

  // Pie legend
  pieLegend:     { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4 },
  pieLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pieDot:        { width: 8, height: 8, borderRadius: 4 },
  pieLegendLabel:{ fontSize: 11, color: P.sub },
  pieLegendCount:{ fontSize: 11, fontFamily: 'PlusJakartaSans_700Bold' },

  // Statuts
  statutRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 8 },
  statutDot:  { width: 10, height: 10, borderRadius: 5 },
  statutLabel:{ flex: 1, fontSize: 13, color: P.text, fontFamily: 'PlusJakartaSans_500Medium' },
  statutCount:{ fontSize: 15, fontFamily: 'PlusJakartaSans_800ExtraBold' },
  statutPct:  { fontSize: 11, color: P.sub, width: 36, textAlign: 'right' },

  // Export
  exportFullBtn: {
    marginTop: 24, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center' as const, backgroundColor: P.bg,
    borderRadius: 16, paddingVertical: 15, borderWidth: 1, borderColor: P.goldRim,
  },
  exportFullBtnText: { color: '#fff', fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold' },
});