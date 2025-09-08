import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 18, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 8 },
  titleRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleBlock: { flexDirection: "column" },
  title: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  meta: { fontSize: 9, color: "#555" },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6 },
  gridRow: { display: "flex", flexDirection: "row", flexWrap: "wrap" },
  gridItem: { width: "33%", padding: 6 },
  gridItemInner: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 6,
    borderRadius: 4,
  },

  twoCols: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  col: { width: "48%" },
  listRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  smallMuted: { fontSize: 9, color: "#555" },
  bold: { fontWeight: 700 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6 },

  footer: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    fontSize: 9,
    textAlign: "center",
    color: "#666",
  },

  platformBox: {
    borderWidth: 1,
    borderColor: "#eee",
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  smallSpacing: { marginBottom: 4 },
});

function toNumber(v) {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(v) {
  const n = toNumber(v);
  try {
    // format sans espace insécable problématique
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " FCFA";
  } catch {
    return String(n) + " FCFA";
  }
}

export default function RapportComptaPdfDocument({ report }) {
  const {
    date,
    banques = [],
    caissePrincipale = {},
    plateformes = [],
    dettes = [],
    versement = null,
  } = report || {};

  const banquesList = Array.isArray(banques) ? banques : [];
  const entrees = Array.isArray(caissePrincipale.entrees) ? caissePrincipale.entrees : [];
  const sorties = Array.isArray(caissePrincipale.sorties) ? caissePrincipale.sorties : [];
  const plateformesList = Array.isArray(plateformes) ? plateformes : [];
  const dettesList = Array.isArray(dettes) ? dettes : [];

  const totalBanques = banquesList.reduce((s, b) => s + toNumber(b?.montant), 0);

  // compte dettes payées / impayées (racine)
  const dettesCounts = dettesList.reduce(
    (acc, d) => {
      const s = (d && d.status) ? d.status : "impayée";
      if (s === "payée") acc.payee += 1;
      else acc.impayee += 1;
      return acc;
    },
    { payee: 0, impayee: 0 }
  );

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Détails Rapport Comptable</Text>
              <Text style={styles.meta}>
                Date : {date ? new Date(date).toLocaleDateString("fr-FR") : "—"}
              </Text>
              <Text style={[styles.meta, styles.smallSpacing]}>
                Généré depuis l'application
              </Text>

              <Text style={[styles.meta, { marginTop: 6 }]}>
                <Text style={styles.bold}>Total banques : </Text>
                {formatMoney(totalBanques)}
              </Text>
            </View>

            <View style={{ width: 180 }}>
              <View style={{ ...styles.card, padding: 6 }}>
                <Text style={styles.cardTitle}>Caisse Principale</Text>
                <Text style={styles.listRow}>
                  <Text>Caisse :</Text>
                  <Text style={styles.bold}>
                    {formatMoney(caissePrincipale?.montant)}
                  </Text>
                </Text>

                <Text style={[styles.smallMuted, { marginTop: 6 }]}>
                  Versement :{" "}
                  {versement ? `${versement.method || "-"} — ${formatMoney(versement.montant)}` : "—"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Banques</Text>
          <View style={styles.gridRow}>
            {banquesList.length === 0 ? (
              <Text>—</Text>
            ) : (
              banquesList.map((b, i) => (
                <View key={b._id || b.nom || i} style={styles.gridItem}>
                  <View style={styles.gridItemInner}>
                    <Text style={{ fontWeight: 700 }}>{b.nom ?? "—"}</Text>
                    <Text style={styles.smallMuted}>Montant</Text>
                    <Text style={styles.bold}>
                      {formatMoney(b.montant)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flux</Text>
          <View style={styles.twoCols}>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Entrées</Text>
              {entrees.length === 0 ? (
                <Text>—</Text>
              ) : (
                entrees.map((e, idx) => {
                  // business peut être {_id, name} ou string id
                  const biz = e?.business;
                  const bizName = biz?.name ?? (typeof biz === "string" ? biz : null);
                  return (
                    <View key={e._id || idx} style={styles.listRow}>
                      <Text style={{ width: "70%" }}>
                        {bizName ? `${bizName}` : (e.description ?? "—")}
                      </Text>
                      <Text style={{ width: "30%", textAlign: "right" }}>
                        {formatMoney(e.montant)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Sorties</Text>
              {sorties.length === 0 ? (
                <Text>—</Text>
              ) : (
                sorties.map((s, idx) => (
                  <View key={s._id || idx} style={styles.listRow}>
                    <Text style={{ width: "70%" }}>{s.description ?? "—"}</Text>
                    <Text style={{ width: "30%", textAlign: "right" }}>
                      {formatMoney(s.montant)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Transferts d'argent (Plateformes)</Text>
          {plateformesList.length === 0 ? (
            <Text>—</Text>
          ) : (
            plateformesList.map((p, idx) => (
              <View key={p._id || p.nom || idx} style={styles.platformBox}>
                <Text style={{ fontSize: 11, fontWeight: 700 }}>{p.nom ?? "—"}</Text>
                <View style={{ marginTop: 6 }}>
                  <View style={styles.listRow}>
                    <Text>Fond de caisse</Text>
                    <Text>{formatMoney(p.fondDeCaisse)}</Text>
                  </View>
                  <View style={styles.listRow}>
                    <Text>UV disponible</Text>
                    <Text>{formatMoney(p.uvDisponible)}</Text>
                  </View>
                  <View style={styles.listRow}>
                    <Text>Recharge UV</Text>
                    <Text>{formatMoney(p.rechargeUV)}</Text>
                  </View>
                  <View style={styles.listRow}>
                    <Text>Total dépôt</Text>
                    <Text>{formatMoney(p.totalDepot)}</Text>
                  </View>
                  <View style={styles.listRow}>
                    <Text>Total retrait</Text>
                    <Text>{formatMoney(p.totalRetrait)}</Text>
                  </View>
                  <View style={styles.listRow}>
                    <Text>Commission</Text>
                    <Text>{formatMoney(p.commission)}</Text>
                  </View>
                  <View style={styles.listRow}>
                    <Text>Disponibilités</Text>
                    <Text>{formatMoney(p.disponibilites)}</Text>
                  </View>

                  {Array.isArray(p.dettes) && p.dettes.length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: 700 }}>
                        Dettes ({p.dettes.length})
                      </Text>
                      {p.dettes.map((d, j) => (
                        <View key={d._id || j} style={styles.listRow}>
                          <Text style={{ width: "60%" }}>{d.description ?? "—"}</Text>
                          <Text style={{ width: "40%", textAlign: "right" }}>
                            {formatMoney(d.montant)} {d.status ? ` — ${d.status}` : ""}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dettes (global)</Text>
          {dettesList.length === 0 ? (
            <Text>—</Text>
          ) : (
            <>
              <Text style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>
                <Text style={styles.bold}>Payées:</Text> {dettesCounts.payee} —{" "}
                <Text style={styles.bold}>Impayées:</Text> {dettesCounts.impayee}
              </Text>
              {dettesList.map((d, idx) => (
                <View key={d._id || idx} style={styles.listRow}>
                  <Text style={{ width: "70%" }}>{d.description ?? "—"}</Text>
                  <Text style={{ width: "30%", textAlign: "right" }}>
                    {formatMoney(d.montant)}{d.status ? ` — ${d.status}` : ""}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Rapport généré — {new Date().toLocaleString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
}
