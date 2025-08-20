import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 11 },
  header: { fontSize: 16, marginBottom: 8 },
  section: { marginBottom: 10 },
  row: { display: "flex", flexDirection: "row", marginBottom: 4 },
  colLabel: { width: "40%" },
  colValue: { width: "60%" },
  small: { fontSize: 9 },
  tableHeader: { fontWeight: 700, marginBottom: 4 },
  separator: { height: 1, backgroundColor: "#000", marginVertical: 6 },
});

export default function RapportComptaPdfDocument({ report }) {
  const {
    date,
    banques = [],
    caissePrincipale = {},
    plateformes = [],
    dettes = [],
  } = report || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Rapport comptable</Text>
        <Text style={styles.small}>
          Date: {date ? new Date(date).toLocaleDateString() : "—"}
        </Text>

        <View style={styles.separator} />

        {/* Banques */}
        <View style={styles.section}>
          <Text style={styles.tableHeader}>Banques</Text>
          {banques.length === 0 ? (
            <Text>—</Text>
          ) : (
            banques.map((b) => (
              <View style={styles.row} key={b._id || b.nom}>
                <Text style={styles.colLabel}>{b.nom}</Text>
                <Text style={styles.colValue}>{b.montant ?? "0"}</Text>
              </View>
            ))
          )}
        </View>

        {/* Caisse principale */}
        <View style={styles.section}>
          <Text style={styles.tableHeader}>Caisse principale</Text>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Montant</Text>
            <Text style={styles.colValue}>
              {caissePrincipale?.montant ?? 0}
            </Text>
          </View>

          <Text style={{ marginTop: 6, fontWeight: 700 }}>Entrées</Text>
          {(caissePrincipale?.entrees || []).length === 0 ? (
            <Text>—</Text>
          ) : (
            (caissePrincipale.entrees || []).map((e) => (
              <View style={styles.row} key={e._id || e.description + e.montant}>
                <Text style={styles.colLabel}>
                  {e.business?.name ?? e.description ?? "—"}
                </Text>
                <Text style={styles.colValue}>{e.montant ?? 0}</Text>
              </View>
            ))
          )}

          <Text style={{ marginTop: 6, fontWeight: 700 }}>Sorties</Text>
          {(caissePrincipale?.sorties || []).length === 0 ? (
            <Text>—</Text>
          ) : (
            (caissePrincipale.sorties || []).map((s) => (
              <View style={styles.row} key={s._id || s.description + s.montant}>
                <Text style={styles.colLabel}>{s.description}</Text>
                <Text style={styles.colValue}>{s.montant ?? 0}</Text>
              </View>
            ))
          )}
        </View>

        {/* Plateformes */}
        <View style={styles.section}>
          <Text style={styles.tableHeader}>Plateformes</Text>
          {(plateformes || []).length === 0 ? (
            <Text>—</Text>
          ) : (
            plateformes.map((p) => (
              <View key={p._id || p.nom} style={{ marginBottom: 6 }}>
                <Text style={{ fontWeight: 700 }}>{p.nom}</Text>
                <View style={styles.row}>
                  <Text style={styles.colLabel}>Fond de caisse</Text>
                  <Text style={styles.colValue}>{p.fondDeCaisse ?? "—"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.colLabel}>UV disponible</Text>
                  <Text style={styles.colValue}>{p.uvDisponible ?? "—"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.colLabel}>Total dépôt</Text>
                  <Text style={styles.colValue}>{p.totalDepot ?? "—"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.colLabel}>Total retrait</Text>
                  <Text style={styles.colValue}>{p.totalRetrait ?? "—"}</Text>
                </View>
                {(p.dettes || []).length > 0 && (
                  <>
                    <Text style={{ marginTop: 4 }}>Dettes (plateforme)</Text>
                    {p.dettes.map((d) => (
                      <View
                        style={styles.row}
                        key={d._id || d.description + d.montant}
                      >
                        <Text style={styles.colLabel}>{d.description}</Text>
                        <Text style={styles.colValue}>
                          {d.montant} — {d.status}
                        </Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            ))
          )}
        </View>

        {/* Dettes racines */}
        <View style={styles.section}>
          <Text style={styles.tableHeader}>Dettes (racine)</Text>
          {(dettes || []).length === 0 ? (
            <Text>—</Text>
          ) : (
            dettes.map((d) => (
              <View style={styles.row} key={d._id || d.description + d.montant}>
                <Text style={styles.colLabel}>{d.description}</Text>
                <Text style={styles.colValue}>
                  {d.montant} — {d.status}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.small}>Généré depuis l'application</Text>
      </Page>
    </Document>
  );
}
