"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function EditDailyReport({ business = [] }) {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const methods = useForm({
    defaultValues: {
      business: "",
      revenueCash: 0,
      revenueOrangeMoney: 0,
      revenueWave: 0,
      sortieCaisse: 0,
      versementTataDiara: 0,
      sales: [{ ref: "", description: "", total: 0 }],
      debts: [{ ref: "", description: "", total: 0 }],
      reglementDebts: [{ ref: "", description: "", total: 0 }],
    },
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = methods;

  const salesArray = useFieldArray({ control, name: "sales" });
  const debtsArray = useFieldArray({ control, name: "debts" });
  const regArray = useFieldArray({ control, name: "reglementDebts" });
  const selectedBusiness = watch("business");

  const refValidation = { pattern: /^(facture num \d+|ticket num \d+)$/i };

  // Charger le rapport existant
  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/daily-report/${id}`)
      .then(({ data }) => {
        console.log(data);
        if (!data.success) {
          console.log("Je suis ici");
          toast.error(data.message || "Impossible de charger le rapport.");
          return;
        }
        const rpt = data.data;
        console.log(rpt);
        reset({
          business: rpt.business._id || rpt.business,
          revenueCash: rpt.revenueCash,
          revenueOrangeMoney: rpt.revenueOrangeMoney,
          revenueWave: rpt.revenueWave,
          sortieCaisse: rpt.sortieCaisse,
          versementTataDiara: rpt.versementTataDiara,
          sales: rpt.sales.length
            ? rpt.sales
            : [{ ref: "", description: "", total: 0 }],
          debts: rpt.debts.length
            ? rpt.debts
            : [{ ref: "", description: "", total: 0 }],
          reglementDebts: rpt.reglementDebts.length
            ? rpt.reglementDebts
            : [{ ref: "", description: "", total: 0 }],
        });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Impossible de charger le rapport.");
      })
      .finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }

    // Validation des refs
    const salesOk = await trigger(
      salesArray.fields.map((_, i) => `sales.${i}.ref`)
    );
    const debtsOk = await trigger(
      debtsArray.fields.map((_, i) => `debts.${i}.ref`)
    );
    const regOk = await trigger(
      regArray.fields.map((_, i) => `reglementDebts.${i}.ref`)
    );

    if (!salesOk || !debtsOk || !regOk) {
      if (!salesOk) setStep(2);
      else if (!debtsOk) setStep(3);
      else setStep(4);
      toast.error(
        "Chaque référence doit être au format 'facture num XXXX' ou 'ticket num XXXX'."
      );
      return;
    }

    // Nettoyage
    const cleanArr = (arr) =>
      arr
        .map((i) => ({
          ref: i.ref.trim(),
          description: i.description.trim(),
          total: i.total,
        }))
        .filter((i) => i.ref || i.description || i.total);

    data.sales = cleanArr(data.sales);
    data.debts = cleanArr(data.debts);
    data.reglementDebts = cleanArr(data.reglementDebts);

    setIsSaving(true);
    try {
      await axios.put(`/api/daily-report/${id}`, data);
      toast.success("Rapport mis à jour !");
      router.push("/dashboard/liste-rapport-quincaillerie");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Erreur lors de la mise à jour."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 mt-16 md:mt-6">
        <Link
            href="/dashboard/liste-rapport-quincaillerie"
            className="self-start mb-4"
        >
        <Button variant="ghost" className="mb-4">
            ← Retour
        </Button>
      </Link>
      <div className="w-full max-w-xl">
        <FormProvider {...methods}>
          <div className={cn("flex flex-col gap-6")}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Modifier le rapport</CardTitle>
                <CardDescription>
                  Mettez à jour les informations du jour.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Étape 1 */}
                  {step === 1 && (
                    <>
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="business">Activité</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full text-left"
                              >
                                {business.find((b) => b.id === selectedBusiness)
                                  ?.name || "Sélectionner l'activité"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <Command>
                                <CommandInput placeholder="Rechercher..." />
                                <CommandEmpty>Aucune activité.</CommandEmpty>
                                <CommandGroup>
                                  {business.map((b) => (
                                    <CommandItem
                                      key={b.id}
                                      onSelect={() =>
                                        setValue("business", b.id)
                                      }
                                    >
                                      {b.name}
                                      {selectedBusiness === b.id && (
                                        <Check className="ml-auto" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {errors.business && (
                            <p className="text-red-500">
                              Veuillez sélectionner une activité.
                            </p>
                          )}
                        </div>
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="revenueCash">Revenu en espèces</Label>
                          <Input
                            id="revenueCash"
                            type="number"
                            {...register("revenueCash", {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="revenueOrangeMoney">
                            Revenu Orange Money
                          </Label>
                          <Input
                            id="revenueOrangeMoney"
                            type="number"
                            {...register("revenueOrangeMoney", {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="revenueWave">Revenu Wave</Label>
                          <Input
                            id="revenueWave"
                            type="number"
                            {...register("revenueWave", {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="sortieCaisse">Sortie de caisse</Label>
                          <Input
                            id="sortieCaisse"
                            type="number"
                            {...register("sortieCaisse", {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="versementTataDiara">
                            Somme versée à Tata Diara
                          </Label>
                          <Input
                            id="versementTataDiara"
                            type="number"
                            {...register("versementTataDiara", {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Étape 2: Ventes */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                          Ventes du jour
                        </h2>
                        <Button
                          type="button"
                          onClick={() =>
                            salesArray.append({
                              ref: "",
                              description: "",
                              total: 0,
                            })
                          }
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                      {salesArray.fields.map((field, idx) => (
                        <div
                          key={field.id}
                          className="flex items-end space-x-2"
                        >
                          <div className="w-24 grid gap-1">
                            <Label htmlFor={`sales.${idx}.ref`}>Réf</Label>
                            <Input
                              id={`sales.${idx}.ref`}
                              type="text"
                              {...register(`sales.${idx}.ref`, refValidation)}
                            />
                          </div>
                          <div className="flex-1 grid gap-1">
                            <Label htmlFor={`sales.${idx}.description`}>
                              Description
                            </Label>
                            <Input
                              id={`sales.${idx}.description`}
                              type="text"
                              {...register(`sales.${idx}.description`)}
                            />
                          </div>
                          <div className="w-32 grid gap-1">
                            <Label htmlFor={`sales.${idx}.total`}>Total</Label>
                            <Input
                              id={`sales.${idx}.total`}
                              type="number"
                              {...register(`sales.${idx}.total`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => salesArray.remove(idx)}
                          >
                            –
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Étape 3: Dettes */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Dettes client</h2>
                        <Button
                          type="button"
                          onClick={() =>
                            debtsArray.append({
                              ref: "",
                              description: "",
                              total: 0,
                            })
                          }
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                      {debtsArray.fields.map((field, idx) => (
                        <div
                          key={field.id}
                          className="flex items-end space-x-2"
                        >
                          <div className="w-24 grid gap-1">
                            <Label htmlFor={`debts.${idx}.ref`}>Réf</Label>
                            <Input
                              id={`debts.${idx}.ref`}
                              type="text"
                              {...register(`debts.${idx}.ref`, refValidation)}
                            />
                          </div>
                          <div className="flex-1 grid gap-1">
                            <Label htmlFor={`debts.${idx}.description`}>
                              Description
                            </Label>
                            <Input
                              id={`debts.${idx}.description`}
                              type="text"
                              {...register(`debts.${idx}.description`)}
                            />
                          </div>
                          <div className="w-32 grid gap-1">
                            <Label htmlFor={`debts.${idx}.total`}>Total</Label>
                            <Input
                              id={`debts.${idx}.total`}
                              type="number"
                              {...register(`debts.${idx}.total`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => debtsArray.remove(idx)}
                          >
                            –
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Étape 4: Règlement dettes */}
                  {step === 4 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                          Règlement dettes client
                        </h2>
                        <Button
                          type="button"
                          onClick={() =>
                            regArray.append({
                              ref: "",
                              description: "",
                              total: 0,
                            })
                          }
                          className="h-8 w-8"
                        >
                          +
                        </Button>
                      </div>
                      {regArray.fields.map((field, idx) => (
                        <div
                          key={field.id}
                          className="flex items-end space-x-2"
                        >
                          <div className="w-24 grid gap-1">
                            <Label htmlFor={`reglementDebts.${idx}.ref`}>
                              Réf
                            </Label>
                            <Input
                              id={`reglementDebts.${idx}.ref`}
                              type="text"
                              {...register(
                                `reglementDebts.${idx}.ref`,
                                refValidation
                              )}
                            />
                          </div>
                          <div className="flex-1 grid gap-1">
                            <Label
                              htmlFor={`reglementDebts.${idx}.description`}
                            >
                              Description
                            </Label>
                            <Input
                              id={`reglementDebts.${idx}.description`}
                              type="text"
                              {...register(`reglementDebts.${idx}.description`)}
                            />
                          </div>
                          <div className="w-32 grid gap-1">
                            <Label htmlFor={`reglementDebts.${idx}.total`}>
                              Total
                            </Label>
                            <Input
                              id={`reglementDebts.${idx}.total`}
                              type="number"
                              {...register(`reglementDebts.${idx}.total`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => regArray.remove(idx)}
                          >
                            –
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between pt-4">
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setStep((s) => s - 1)}
                      >
                        Précédent
                      </Button>
                    )}
                    <Button type="submit">
                      {step < 4 ? (
                        "Suivant"
                      ) : isSaving ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-r-transparent rounded-full"></span>
                      ) : (
                        "Mettre à jour"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}
