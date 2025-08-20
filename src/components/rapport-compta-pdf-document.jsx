import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Optionnel: charger une fonte si tu veux (ex: Inter)
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' })

const styles = StyleSheet.create({
  page: { padding: 18, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 8 },
  titleRow: { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  titleBlock: { flexDirection: "column" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: '#555' },

  card: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 4, marginBottom: 8 },
  cardTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  gridRow: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: '33%', padding: 6 },
  gridItemInner: { borderWidth: 1, borderColor: '#eee', padding: 6, borderRadius: 4 },

  twoCols: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  col: { width: '48%' },
  listRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },

  smallMuted: { fontSize: 9, color: '#555' },
  bold: { fontWeight: 700 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },

  footer: { position: 'absolute', bottom: 18, left: 18, right: 18, fontSize: 9, textAlign: 'center', color: '#666' },

  platformBox: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 4, marginBottom: 6 },
  smallSpacing: { marginBottom: 4 }
});

function formatMoney(value) {
  if (value == null) return '0';
  try {
    return new Intl.NumberFormat('fr-FR').format(value);
  } catch (e) {
    return String(value);
  }
}

export default function RapportComptaPdfDocument({ report }) {
  const { date, banques = [], caissePrincipale = {}, plateformes = [], dettes = [] } = report || {};

  // sécurité: assure des tableaux
  const banquesList = Array.isArray(banques) ? banques : [];
  const entrees = Array.isArray(caissePrincipale.entrees) ? caissePrincipale.entrees : [];
  const sorties = Array.isArray(caissePrincipale.sorties) ? caissePrincipale.sorties : [];
  const plateformesList = Array.isArray(plateformes) ? plateformes : [];
  const dettesList = Array.isArray(dettes) ? dettes : [];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header avec titre + meta (bouton download sur UI -> pas dans PDF) */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Détails Rapport Comptable</Text>
              <Text style={styles.meta}>Date : {date ? new Date(date).toLocaleDateString('fr-FR') : '—'}</Text>
              <Text style={[styles.meta, styles.smallSpacing]}>Généré depuis l'application</Text>
            </View>
            <View>
              {/* petit encart résumé caisse */}
              <View style={{ ...styles.card, padding: 6 }}>
                <Text style={styles.cardTitle}>Caisse Principale</Text>
                <Text style={styles.listRow}><Text>Caisse :</Text><Text style={styles.bold}>{formatMoney(caissePrincipale.montant)}</Text></Text>
              </View>
            </View>
          </View>
        </View>

        {/* Banques - grid (3 colonnes) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Banques</Text>
          <View style={styles.gridRow}>
            {banquesList.length === 0 ? (
              <Text>—</Text>
            ) : (
              banquesList.map((b, i) => (
                <View key={b._id || b.nom || i} style={styles.gridItem}>
                  <View style={styles.gridItemInner}>
                    <Text style={{ fontWeight: 700 }}>{b.nom}</Text>
                    <Text style={styles.smallMuted}>Montant</Text>
                    <Text style={styles.bold}>{formatMoney(Number(b.montant))}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Flux: Entrees / Sorties */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flux</Text>
          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Entrées</Text>
              {entrees.length === 0 ? <Text>—</Text> : (
                entrees.map((e, idx) => (
                  <View key={e._id || idx} style={styles.listRow}>
                    <Text style={{ width: '70%' }}>{e.business?.name ?? e.description ?? '—'}</Text>
                    <Text style={{ width: '30%', textAlign: 'right' }}>{formatMoney(e.montant)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Sorties</Text>
              {sorties.length === 0 ? <Text>—</Text> : (
                sorties.map((s, idx) => (
                  <View key={s._id || idx} style={styles.listRow}>
                    <Text style={{ width: '70%' }}>{s.description}</Text>
                    <Text style={{ width: '30%', textAlign: 'right' }}>{formatMoney(s.montant)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Plateformes */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transferts d'argent</Text>
          {plateformesList.length === 0 ? <Text>—</Text> : (
            plateformesList.map((p, idx) => (
              <View key={p._id || p.nom || idx} style={styles.platformBox}>
                <Text style={{ fontSize: 11, fontWeight: 700 }}>{p.nom}</Text>
                <View style={{ marginTop: 6 }}>
                  <View style={styles.listRow}><Text>Fond de caisse</Text><Text>{formatMoney(p.fondDeCaisse)}</Text></View>
                  <View style={styles.listRow}><Text>UV disponible</Text><Text>{formatMoney(p.uvDisponible)}</Text></View>
                  <View style={styles.listRow}><Text>Total dépôt</Text><Text>{formatMoney(p.totalDepot)}</Text></View>
                  <View style={styles.listRow}><Text>Total retrait</Text><Text>{formatMoney(p.totalRetrait)}</Text></View>
                  {p.commission != null && (<View style={styles.listRow}><Text>Commission</Text><Text>{formatMoney(p.commission)}</Text></View>)}

                  {Array.isArray(p.dettes) && p.dettes.length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: 700 }}>Dettes</Text>
                      {p.dettes.map((d, j) => (
                        <View key={d._id || j} style={styles.listRow}>
                          <Text>{d.description}</Text>
                          <Text>{formatMoney(d.montant)} — {d.status}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Dettes racines */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dettes</Text>
          {dettesList.length === 0 ? <Text>—</Text> : (
            dettesList.map((d, idx) => (
              <View key={d._id || idx} style={styles.listRow}>
                <Text style={{ width: '70%' }}>{d.description}</Text>
                <Text style={{ width: '30%', textAlign: 'right' }}>{formatMoney(d.montant)}{d.status ? ` — ${d.status}` : ''}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.footer}>Rapport généré — {new Date().toLocaleString('fr-FR')}</Text>
      </Page>
    </Document>
  );
}
