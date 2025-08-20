import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 18, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 10 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: '#555' },

  grid: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  card: { width: '48%', borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 4 },
  cardTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  boxRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  bold: { fontWeight: 700 },

  section: { marginBottom: 10, borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },
  listItem: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },

  saleGroup: { marginBottom: 8 },
  subTitle: { fontSize: 10, fontWeight: 700, marginBottom: 4 },

  footer: { position: 'absolute', bottom: 18, left: 18, right: 18, fontSize: 9, textAlign: 'center', color: '#666' }
});

function formatMoney(v) {
  if (v == null) return '0';
  try {
    return new Intl.NumberFormat('fr-FR').format(v) + ' FCFA';
  } catch {
    return String(v);
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return '-'; }
}

function groupByRef(arr) {
  return (arr || []).reduce((acc, item) => {
    const key = item.ref || '—';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export default function DailyReportPdfDocument({ report }) {
  const r = report || {};
  const sales = Array.isArray(r.sales) ? r.sales : [];
  const debts = Array.isArray(r.debts) ? r.debts : [];
  const reglements = Array.isArray(r.reglementDebts) ? r.reglementDebts : [];
  const sortieCaisse = Array.isArray(r.sortieCaisse) ? r.sortieCaisse : [];

  const groupedSales = groupByRef(sales);
  const groupedDebts = groupByRef(debts);
  const groupedReglements = groupByRef(reglements);

  const totalRevenus = (r.revenueCash || 0) + (r.revenueWave || 0) + (r.revenueOrangeMoney || 0);
  const totalDettes = debts.reduce((s, d) => s + (d.total || 0), 0);
  const totalReglements = reglements.reduce((s, d) => s + (d.total || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.title}>Détails du rapport journalier</Text>
          <Text style={styles.meta}>Date : {formatDate(r.date)}</Text>
          <Text style={styles.meta}>Activité : {r.business?.name || '-'}</Text>
        </View>

        {/* Résumé général & Revenus (deux colonnes) */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations générales</Text>
            <View style={styles.boxRow}><Text>Activité</Text><Text style={styles.bold}>{r.business?.name || '-'}</Text></View>

            <View style={{ marginTop: 6 }}>
              <Text style={styles.subTitle}>Sortie de caisse</Text>
              {sortieCaisse.length === 0 ? (
                <Text>-</Text>
              ) : (
                sortieCaisse.map((s, idx) => (
                  <View key={s._id || idx} style={styles.boxRow}>
                    <Text>{s.description}</Text>
                    <Text style={styles.bold}>{formatMoney(s.total)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={{ marginTop: 6 }}>
              <View style={styles.boxRow}><Text>Versement Tata Diarra</Text><Text style={styles.bold}>{formatMoney(r.versementTataDiara)}</Text></View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Résumé des revenus</Text>
            <View style={styles.boxRow}><Text>Espèces</Text><Text style={styles.bold}>{formatMoney(r.revenueCash)}</Text></View>
            <View style={styles.boxRow}><Text>Wave</Text><Text style={styles.bold}>{formatMoney(r.revenueWave)}</Text></View>
            <View style={styles.boxRow}><Text>Orange Money</Text><Text style={styles.bold}>{formatMoney(r.revenueOrangeMoney)}</Text></View>
            <View style={{ marginTop: 6 }}>
              <Text style={styles.subTitle}>Total Revenus</Text>
              <Text style={styles.bold}>{formatMoney(totalRevenus)}</Text>
            </View>
          </View>
        </View>

        {/* Ventes groupées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ventes</Text>
          {Object.keys(groupedSales).length === 0 ? (
            <Text>- Aucune vente enregistrée -</Text>
          ) : (
            Object.entries(groupedSales).map(([ref, items]) => (
              <View key={ref} style={styles.saleGroup}>
                <Text style={styles.subTitle}>Réf: {ref} ({items.length} ligne{items.length > 1 ? 's' : ''})</Text>
                {items.map((i, idx) => (
                  <View key={i._id || idx} style={styles.listItem}>
                    <Text>{i.description}</Text>
                    <Text style={styles.bold}>{formatMoney(i.total)}</Text>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Dettes & Règlements */}
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <View style={{ width: '48%', borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 4 }}>
            <Text style={styles.sectionTitle}>Dettes ({debts.length})</Text>
            {Object.keys(groupedDebts).length === 0 ? (
              <Text>- Aucune dette -</Text>
            ) : (
              Object.entries(groupedDebts).map(([ref, items]) => (
                <View key={ref} style={{ marginBottom: 6 }}>
                  <Text style={styles.subTitle}>Réf: {ref} ({items.length} ligne{items.length > 1 ? 's' : ''})</Text>
                  {items.map((d, idx) => (
                    <View key={d._id || idx} style={styles.listItem}>
                      <Text>{d.description}</Text>
                      <Text style={styles.bold}>{formatMoney(d.total)}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}

            <View style={{ marginTop: 6 }}>
              <Text style={styles.bold}>Total Dettes: {formatMoney(totalDettes)}</Text>
            </View>
          </View>

          <View style={{ width: '48%', borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 4 }}>
            <Text style={styles.sectionTitle}>Règlements de dettes ({reglements.length})</Text>
            {Object.keys(groupedReglements).length === 0 ? (
              <Text>- Aucun règlement -</Text>
            ) : (
              Object.entries(groupedReglements).map(([ref, items]) => (
                <View key={ref} style={{ marginBottom: 6 }}>
                  <Text style={styles.subTitle}>Réf: {ref} ({items.length} ligne{items.length > 1 ? 's' : ''})</Text>
                  {items.map((rItem, idx) => (
                    <View key={rItem._id || idx} style={styles.listItem}>
                      <Text>{rItem.description}</Text>
                      <Text style={styles.bold}>{formatMoney(rItem.total)}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}

            <View style={{ marginTop: 6 }}>
              <Text style={styles.bold}>Total Règlements: {formatMoney(totalReglements)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>Rapport journalier généré — {new Date().toLocaleString('fr-FR')}</Text>
      </Page>
    </Document>
  );
}
