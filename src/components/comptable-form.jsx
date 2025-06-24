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

// Données statiques hardcodées
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
];

export default function RapportFormCompta({ business = [], className, ...props }) {
  // On utilise directement les arrays hardcodés
  const banques = BANQUES;
  const businesses = business;

  const methods = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      banques: [{ nom: "", montant: 0 }],
      caissePrincipale: { montant: 0, entrees: [{ business: "", description: "", montant: 0 }], sorties: [{ description: "", montant: 0 }] },
      dettes: [{ description: "", montant: 0 }],
      plateformes: [],
    },
  });

  const { control, register, handleSubmit, watch, formState: { isSubmitting } } = methods;
  const [step, setStep] = useState(1);
  const maxBanques = banques.length;

  // Field arrays
  const banquesArray = useFieldArray({ control, name: "banques" });
  const entreesArray = useFieldArray({ control, name: "caissePrincipale.entrees" });
  const sortiesArray = useFieldArray({ control, name: "caissePrincipale.sorties" });
  const dettesArray = useFieldArray({ control, name: "dettes" });
  const plateformesArray = useFieldArray({ control, name: "plateformes" });

  // Watch pour plateformes
  const watchPlateformes = useWatch({ control, name: "plateformes" });

  const onSubmit = async (data) => {
    console.log(data)
    if (step < 4) {
      setStep(prev => prev + 1);
      return;
    }
    try {
      await axios.post("/api/daily-report-compta", data);
      toast.success("Rapport enregistré avec succès");
      methods.reset();
      setStep(1);
    } catch (e) {
      console.error("Erreur lors de l'enregistrement du rapport comptable",e);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  return (
    <FormProvider {...methods}>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Rapport Comptable</CardTitle>
            <CardDescription>Étape {step} / 4</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                {/* Step 1: Date + Banques */}
                {step === 1 && (
                  <>
                    <div className="grid gap-3">
                      <Label htmlFor="date">Date du rapport</Label>
                      <Input type="date" {...methods.register("date")} />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold">Banques</h2>
                      {banquesArray.fields.map((field, idx) => (
                        <div key={field.id} className="flex items-end space-x-2">
                          <div className="flex-1 grid gap-1">
                            <Label>Banque {idx + 1}</Label>
                            <select
                              {...methods.register(`banques.${idx}.nom`)}
                              className="input"
                            >
                              <option value="">Sélectionner</option>
                              {banques.map(b => <option key={b.id} value={b.nom}>{b.nom}</option>)}
                            </select>
                          </div>
                          <div className="w-32 grid gap-1">
                            <Label>Montant</Label>
                            <Input
                              type="number"
                              {...methods.register(`banques.${idx}.montant`, { valueAsNumber: true })}
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => banquesArray.remove(idx)}
                            disabled={banquesArray.fields.length <= 1}
                          >-</Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => banquesArray.fields.length < maxBanques && banquesArray.append({ nom: "", montant: 0 })}
                        disabled={banquesArray.fields.length >= maxBanques}
                      >Ajouter Banque</Button>
                    </div>
                  </>
                )}

                {/* Step 2: Caisse Principale */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      <Label>Montant Caisse Principale</Label>
                      <Input
                        type="number"
                        {...methods.register("caissePrincipale.montant", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-semibold">Entrées</h2>
                      {entreesArray.fields.map((field, idx) => (
                        <div key={field.id} className="flex items-end space-x-2">
                          <div className="flex-1 grid gap-1">
                            <Label>Activité</Label>
                            <select
                              {...methods.register(`caissePrincipale.entrees.${idx}.business`)}
                              className="input"
                            >
                              <option value="">Sélectionner</option>
                              {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select> 
                          </div>
                          <div className="grid gap-1 w-56">
                            <Label>Description</Label>
                            <Input {...methods.register(`caissePrincipale.entrees.${idx}.description`)} />
                          </div>
                          <div className="flex-1 grid gap-1">
                            <Label>Montant</Label>
                            <Input
                              type="number"
                              {...methods.register(`caissePrincipale.entrees.${idx}.montant`, { valueAsNumber: true })}
                            />
                          </div>
                          <Button size="icon" onClick={() => entreesArray.remove(idx)}>-</Button>
                        </div>
                      ))}
                      <Button size="sm" type="button" onClick={() => entreesArray.append({ description: "", montant: 0 })}>Ajouter Entrée</Button>
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-semibold">Sorties</h2>
                      {sortiesArray.fields.map((field, idx) => (
                        <div key={field.id} className="flex items-end space-x-2">
                          <div className="flex-1 grid gap-1">
                            <Label>Description</Label>
                            <Input {...methods.register(`caissePrincipale.sorties.${idx}.description`)} />
                          </div>
                          <div className="w-32 grid gap-1">
                            <Label>Montant</Label>
                            <Input
                              type="number"
                              {...methods.register(`caissePrincipale.sorties.${idx}.montant`, { valueAsNumber: true })}
                            />
                          </div>
                          <Button size="icon" onClick={() => sortiesArray.remove(idx)}>-</Button>
                        </div>
                      ))}
                      <Button size="sm" type="button" onClick={() => sortiesArray.append({ description: "", montant: 0 })}>Ajouter Sortie</Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Dettes */}
                {step === 3 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Dettes</h2>
                    {dettesArray.fields.map((field, idx) => (
                      <div key={field.id} className="flex items-end space-x-2">
                        <div className="flex-1 grid gap-1">
                          <Label>Description</Label>
                          <Input {...methods.register(`dettes.${idx}.description`)} />
                        </div>
                        <div className="w-32 grid gap-1">
                          <Label>Montant</Label>
                          <Input type="number" {...methods.register(`dettes.${idx}.montant`, { valueAsNumber: true })} />
                        </div>
                        <Button size="icon" onClick={() => dettesArray.remove(idx)}>-</Button>
                      </div>
                    ))}
                    <Button size="sm" type="button" onClick={() => dettesArray.append({ description: "", montant: 0 })}>Ajouter Dette</Button>
                  </div>
                )}

                {/* Step 4: Plateformes */}
                {step === 4 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Transfert d'argent</h2>
                    {plateformesArray.fields.map((field, idx) => (
                        <PlatformSection
                            key={field.id}
                            index={idx}
                            control={control}
                            register={register}
                            watch={watch}
                            remove={plateformesArray.remove}
                        />
                    ))}
                    <Button size="sm" type="button" onClick={() => plateformesArray.append({ nom: "", fondDeCaisse: 0, uvDisponible: 0, rechargeUV: 0, totalDepot: 0, totalRetrait: 0, commission: 0, disponibilites: 0, dettes: [] })}>Moyens de transfert</Button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  {step > 1 && <Button variant="secondary" type="button" onClick={() => setStep(s => s - 1)}>Précédent</Button>}
                  <Button type="submit">
                    {step < 4 ? "Suivant" : (isSubmitting ? "Enregistrement..." : "Enregistrer")}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}

function PlatformSection({ index, control, register, watch, remove }) {
  const plateformes = PLATEFORMES;

  const dettesArray = useFieldArray({
    control,
    name: `plateformes.${index}.dettes`,
  });
  const selected = watch(`plateformes.${index}.nom`);

  return (
    <div className="border p-4 rounded">
      <div className="flex items-end space-x-2">
        <div className="flex-1 grid gap-1">
          <Label>Plateforme {index + 1}</Label>
          <select {...register(`plateformes.${index}.nom`)} className="input">
            <option value="">Sélectionner</option>
            {plateformes.map((p) => (
              <option key={p.id} value={p.nom}>
                {p.nom}
              </option>
            ))}
          </select>
        </div>
        <Button size="icon" onClick={() => remove(index)}>-</Button>
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
          ].map((key) => (
            <div key={key} className="grid gap-1">
              <Label>{key}</Label>
              <Input type="number" {...register(`plateformes.${index}.${key}`, { valueAsNumber: true })} />
            </div>
          ))}

          <div className="col-span-2 space-y-2">
            <h3 className="font-semibold">Dettes</h3>
            {dettesArray.fields.map((field, detIdx) => (
              <div key={field.id} className="flex items-end space-x-2">
                <div className="flex-1 grid gap-1">
                  <Label>Description</Label>
                  <Input {...register(`plateformes.${index}.dettes.${detIdx}.description`)} />
                </div>
                <div className="w-32 grid gap-1">
                  <Label>Montant</Label>
                  <Input
                    type="number"
                    {...register(`plateformes.${index}.dettes.${detIdx}.montant`, { valueAsNumber: true })}
                  />
                </div>
                <Button size="icon" onClick={() => dettesArray.remove(detIdx)}>-</Button>
              </div>
            ))}
            <Button
              size="sm"
              type="button"
              onClick={() => dettesArray.append({ description: "", montant: 0 })}
            >
              Ajouter Dette
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
