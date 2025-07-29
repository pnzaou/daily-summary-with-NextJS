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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function EditDailyReport() {
  const { data: session, status } = useSession()
  const router = useRouter();
  if (status !== 'authenticated') {
    router.push('/')
    return null
  }
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [businessName, setBusinessName] = useState("")

  const methods = useForm({
    defaultValues: {
      business: "",
      date: "",
      revenueCash: 0,
      revenueOrangeMoney: 0,
      revenueWave: 0,
      sortieCaisse: [{ description: "", total: 0 }],
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
    trigger,
    reset,
    formState: { errors },
  } = methods;

  const salesArray = useFieldArray({ control, name: "sales" });
  const debtsArray = useFieldArray({ control, name: "debts" });
  const regArray = useFieldArray({ control, name: "reglementDebts" });
  const sortieArray = useFieldArray({ control, name: "sortieCaisse" });

  const refValidation = { pattern: /^(facture num \d+|ticket num \d+|reçu num \d+)$/i };

  // Charger le rapport existant
  useEffect(() => {
    if (!id) return;
    axios
      .get(`/api/daily-report/${id}`)
      .then(({ data }) => {
        if (!data.success) {
          toast.error(data.message || "Impossible de charger le rapport.");
          return;
        }
        const rpt = data.data;
        setBusinessName(rpt.business.name)
        const formattedDate = new Date(rpt.date)
          .toISOString()
          .split("T")[0];
        reset({
          business: rpt.business._id || rpt.business,
          date: formattedDate,
          revenueCash: rpt.revenueCash,
          revenueOrangeMoney: rpt.revenueOrangeMoney,
          revenueWave: rpt.revenueWave,
          versementTataDiara: rpt.versementTataDiara,
          sortieCaisse: rpt.sortieCaisse.length
            ? rpt.sortieCaisse
            : [{ description: "", total: 0 }],
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
    if (step < 5) {
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
    const cleanArr = (arr, hasRef = true) =>
      (arr || [])
        .map((item) => {
          const obj = {
            description: item.description.trim(),
            total: item.total,
          };
          if (hasRef) obj.ref = item.ref.trim();
          return obj;
        })
        .filter(({ description, total, ref }) =>
          hasRef
            ? ref !== "" || description !== "" || total !== ""
            : description !== "" || total !== ""
        );

    data.sales = cleanArr(data.sales, true);
    data.debts = cleanArr(data.debts, true);
    data.reglementDebts = cleanArr(data.reglementDebts, true);
    data.sortieCaisse = cleanArr(data.sortieCaisse, false);

    setIsSaving(true);
    try {
      console.log(data)
      const rep = await axios.put(`/api/daily-report/${id}`, data);
      toast.success(rep.data.message || "Rapport mis à jour !");
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

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center">
      <p>Chargement...</p>
    </div>
  );

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
                      <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="date">Date du rapport</Label>
                          <Input
                            id="date"
                            type="date"
                            {...register("date", { required: true })}
                          />
                        </div>
                        <div className="flex-1 grid gap-3">
                          <Label htmlFor="business">Activité</Label>
                          <Input id="business" value={businessName} readOnly />


                          {/* Valeur réelle soumise par le formulaire */}
                          <input
                          type="hidden"
                            {...register("business", { required: true })} 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
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
                      </div>
                      <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
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

                  {/* Étape 2 */}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                          Sortie de caisse :
                        </h2>
                        <Button
                          type="button"
                          onClick={() =>
                            sortieArray.append({ description: "", total: 0 })
                          }
                          className="h-8 w-8 p-0 text-lg flex items-center justify-center"
                        >
                          +
                        </Button>
                      </div>
                      {sortieArray.fields.map((field, idx) => (
                        <div
                          key={field.id}
                          className="flex items-end space-x-2"
                        >
                          <div className="flex-1 grid gap-1">
                            <Label htmlFor={`sortieCaisse.${idx}.description`}>
                              Description
                            </Label>
                            <Input
                              id={`sortieCaisse.${idx}.description`}
                              type="text"
                              {...register(`sortieCaisse.${idx}.description`)}
                            />
                          </div>
                          <div className="w-32 grid gap-1">
                            <Label htmlFor={`sortieCaisse.${idx}.total`}>
                              Total
                            </Label>
                            <Input
                              id={`sortieCaisse.${idx}.total`}
                              type="number"
                              {...register(`sortieCaisse.${idx}.total`, {
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={() => sortieArray.remove(idx)}
                          >
                            –
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Étape 3: Ventes */}
                  {step === 3 && (
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

                  {/* Étape 4: Dettes */}
                  {step === 4 && (
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

                  {/* Étape 5: Règlement dettes */}
                  {step === 5 && (
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
                      {step < 5 ? (
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
