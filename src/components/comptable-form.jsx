// components/RapportFormCompta.jsx
"use client"

import React, { useState } from "react";
import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import Link from "next/link";

// Données statiques
const BANQUES = [
  { id: "b1", nom: "CBAO" },
  { id: "b2", nom: "BIS" },
  { id: "b3", nom: "UBA" },
];
const PLATEFORMES = [
  { id: "p1", nom: "Wafacash" },
  { id: "p2", nom: "Ria BIS" },
  { id: "p3", nom: "Orange Money" },
  { id: "p4", nom: "Free Money" },
  { id: "p5", nom: "Wizall" },
];

export default function RapportFormCompta({ business = [], className, ...props }) {
  const methods = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      banques: [],
      caissePrincipale: {},
      dettes: [],
      plateformes: [],
    },
  });

  const { control, register, handleSubmit, watch, formState: { isSubmitting } } = methods;
  const [step, setStep] = useState(1);

  const banquesArray    = useFieldArray({ control, name: "banques" });
  const entreesArray    = useFieldArray({ control, name: "caissePrincipale.entrees" });
  const sortiesArray    = useFieldArray({ control, name: "caissePrincipale.sorties" });
  const dettesArray     = useFieldArray({ control, name: "dettes" });
  const plateformesArray= useFieldArray({ control, name: "plateformes" });

  const onSubmit = async (data) => {
    if (step < 4) {
      setStep(s => s + 1);
      return;
    }
    try {
      await axios.post("/api/daily-report-compta", data);
      toast.success("Rapport enregistré avec succès");
      methods.reset();
      setStep(1);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="fixed top-20 right-4">
          <Link href="/dashboard/liste-rapport-quincaillerie">
            <Button>
              Voir les rapports
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Rapport Comptable</CardTitle>
            <CardDescription>Étape {step} / 4</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* STEP 1 – Date & Banques */}
              {step === 1 && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="date">Date du rapport</Label>
                    <Input type="date" {...register("date")} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Banques</h2>
                    {banquesArray.fields.map((f, idx) => (
                      <div key={f.id} className="flex items-end space-x-2">
                        <div className="flex-1 grid gap-1">
                          <Label>Banque {idx + 1}</Label>
                          <select {...register(`banques.${idx}.nom`)} className="input">
                            <option value="">Sélectionner</option>
                            {BANQUES.map(b => (
                              <option key={b.id} value={b.nom}>{b.nom}</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32 grid gap-1">
                          <Label>Montant</Label>
                          <Input type="number" {...register(`banques.${idx}.montant`, { valueAsNumber: true })} />
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => banquesArray.remove(idx)}
                          disabled={banquesArray.fields.length === 0}
                        >-</Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => banquesArray.append({ nom: "", montant: undefined })}
                      disabled={banquesArray.fields.length >= BANQUES.length}
                    >
                      Ajouter Banque
                    </Button>
                  </div>
                </>
              )}
              {/* STEP 2 – Caisse Principale */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <Label>Montant Caisse Principale</Label>
                    <Input type="number" {...register("caissePrincipale.montant", { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-semibold">Entrées</h2>
                    {entreesArray.fields.map((f, idx) => (
                      <div key={f.id} className="flex items-end space-x-2">
                        <div className="flex-1 grid gap-1">
                          <Label>Activité</Label>
                          <select {...register(`caissePrincipale.entrees.${idx}.business`)} className="input">
                            <option value="">Sélectionner</option>
                            {business.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-1 w-56">
                          <Label>Description</Label>
                          <Input {...register(`caissePrincipale.entrees.${idx}.description`)} />
                        </div>
                        <div className="flex-1 grid gap-1">
                          <Label>Montant</Label>
                          <Input type="number" {...register(`caissePrincipale.entrees.${idx}.montant`, { valueAsNumber: true })} />
                        </div>
                        <Button size="icon" onClick={() => entreesArray.remove(idx)}>-</Button>
                      </div>
                    ))}
                    <Button size="sm" type="button" onClick={() => entreesArray.append({ business: "", description: "", montant: undefined })}>
                      Ajouter Entrée
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-semibold">Sorties</h2>
                    {sortiesArray.fields.map((f, idx) => (
                      <div key={f.id} className="flex items-end space-x-2">
                        <div className="flex-1 grid gap-1">
                          <Label>Description</Label>
                          <Input {...register(`caissePrincipale.sorties.${idx}.description`)} />
                        </div>
                        <div className="w-32 grid gap-1">
                          <Label>Montant</Label>
                          <Input type="number" {...register(`caissePrincipale.sorties.${idx}.montant`, { valueAsNumber: true })} />
                        </div>
                        <Button size="icon" onClick={() => sortiesArray.remove(idx)}>-</Button>
                      </div>
                    ))}
                    <Button size="sm" type="button" onClick={() => sortiesArray.append({ description: "", montant: undefined })}>
                      Ajouter Sortie
                    </Button>
                  </div>
                </div>
              )}
              {/* STEP 3 – Dettes */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Dettes</h2>
                  {dettesArray.fields.map((f, idx) => (
                    <div key={f.id} className="flex items-end space-x-2">
                      <div className="flex-1 grid gap-1">
                        <Label>Description</Label>
                        <Input {...register(`dettes.${idx}.description`)} />
                      </div>
                      <div className="w-32 grid gap-1">
                        <Label>Montant</Label>
                        <Input type="number" {...register(`dettes.${idx}.montant`, { valueAsNumber: true })} />
                      </div>
                      <Button size="icon" onClick={() => dettesArray.remove(idx)}>-</Button>
                    </div>
                  ))}
                  <Button size="sm" type="button" onClick={() => dettesArray.append({ description: "", montant: undefined })}>
                    Ajouter Dette
                  </Button>
                </div>
              )}
              {/* STEP 4 – Plateformes */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Transfert d'argent</h2>
                  {plateformesArray.fields.map((f, idx) => (
                    <PlatformSection
                      key={f.id}
                      index={idx}
                      control={control}
                      register={register}
                      remove={() => plateformesArray.remove(idx)}
                      watch={watch}
                    />
                  ))}
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => plateformesArray.append({ nom: "", fondDeCaisse: undefined, uvDisponible: undefined, rechargeUV: undefined, totalDepot: undefined, totalRetrait: undefined, commission: undefined, disponibilites: undefined, dettes: [] })}
                  >
                    Ajouter Plateforme
                  </Button>
                </div>
              )}
              {/* NAVIGATION */}
              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <Button variant="secondary" type="button" onClick={() => setStep(s => s - 1)}>
                    Précédent
                  </Button>
                )}
                <Button type="submit">
                  {step < 4 ? "Suivant" : (isSubmitting ? "Enregistrement..." : "Enregistrer")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function PlatformSection({ index, control, register, watch, remove }) {
  const dettesArr = useFieldArray({ control, name: `plateformes.${index}.dettes` });
  const selected  = watch(`plateformes.${index}.nom`);

  return (
    <div className="border p-4 rounded">
      <div className="flex items-end space-x-2">
        <div className="flex-1 grid gap-1">
          <Label>Plateforme {index + 1}</Label>
          <select {...register(`plateformes.${index}.nom`)} className="input">
            <option value="">Sélectionner</option>
            {PLATEFORMES.map(p => (
              <option key={p.id} value={p.nom}>{p.nom}</option>
            ))}
          </select>
        </div>
        <Button size="icon" onClick={remove}>-</Button>
      </div>
      {selected && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {[
            "fondDeCaisse",
            "uvDisponible",
            "rechargeUV",
            "totalDepot",
            "totalRetrait",
            "commission",
            "disponibilites",
          ].map(key => (
            <div key={key} className="grid gap-1">
              <Label>{key === "totalDepot" ? "totalDepot/tranfert" : key}</Label>
              <Input type="number" {...register(`plateformes.${index}.${key}`, { valueAsNumber: true })} />
            </div>
          ))}
          <div className="col-span-2 space-y-2">
            <h3 className="font-semibold">Dettes</h3>
            {dettesArr.fields.map((d, di) => (
              <div key={d.id} className="flex items-end space-x-2">
                <div className="flex-1 grid gap-1">
                  <Label>Description</Label>
                  <Input {...register(`plateformes.${index}.dettes.${di}.description`)} />
                </div>
                <div className="w-32 grid gap-1">
                  <Label>Montant</Label>
                  <Input type="number" {...register(`plateformes.${index}.dettes.${di}.montant`, { valueAsNumber: true })} />
                </div>
                <Button size="icon" onClick={() => dettesArr.remove(di)}>-</Button>
              </div>
            ))}
            <Button size="sm" type="button" onClick={() => dettesArr.append({ description: "", montant: undefined })}>
              Ajouter Dette
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
