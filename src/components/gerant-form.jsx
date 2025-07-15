"use client";

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
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Check } from "lucide-react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

export default function GerantForm({ business = [], className, ...props }) {
  const methods = useForm({
    defaultValues: {
      business: "",
      revenueCash: 0,
      revenueOrangeMoney: 0,
      revenueWave: 0,
      sortieCaisse: [{ description: "", total: 0 }],
      versementTataDiara: 0,
      sales: [{ ref: "", description: "", total: "" }],
      debts: [{ ref: "", description: "", total: "" }],
      reglementDebts: [{ ref: "", description: "", total: "" }],
    },
    mode: 'onBlur'
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: {errors}
  } = methods;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const salesArray = useFieldArray({ control, name: "sales" });
  const debtsArray = useFieldArray({ control, name: "debts" });
  const regDebtsArray = useFieldArray({ control, name: "reglementDebts" });
  const sortieArray = useFieldArray({ control, name: "sortieCaisse" });

  const selectedBusiness = watch("business");

  const refValidation = {
      pattern: /^(facture num \d+|ticket num \d+|reçu num \d+)$/i,

  };

  const onSubmit = async (data) => {
    // If not final step, validate refs then go to next
    if (step < 5) {
      setStep((s) => s + 1);
      return;
    }

    const salesOk = await trigger(salesArray.fields.map((_, i) => `sales.${i}.ref`));
    const debtsOk = await trigger(debtsArray.fields.map((_, i) => `debts.${i}.ref`));
    const regOk = await trigger(
      regDebtsArray.fields.map((_, i) => `reglementDebts.${i}.ref`)
    );

    if (!salesOk || !debtsOk || !regOk) {
      if (!salesOk) setStep(2);
      else if (!debtsOk) setStep(3);
      else setStep(4);

      toast.error("Chaque référence doit être au format 'facture num XXXX' ou 'ticket num XXXX'.")
      return;
    }

    // Final submission
    const clean = (arr, hasRef = true) =>
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
    
    data.sales = clean(data.sales, true);
    data.debts = clean(data.debts, true);
    data.reglementDebts = clean(data.reglementDebts, true);
    data.sortieCaisse = clean(data.sortieCaisse, false);

    ["sales", "debts", "reglementDebts", "sortieCaisse"].forEach((key) => {
      if (data[key].length === 0) delete data[key];
    })

    setIsLoading(true);
    try {
      const rep = await axios.post("/api/daily-report", data);
      toast.success(rep.data.message || "Rapport enregistré avec succès");
      reset();
      setStep(1);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement du rapport");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <FormProvider {...methods}>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="fixed top-20 right-4">
          <Link href="/dashboard/liste-rapport-quincaillerie">
            <Button>
              Voir les rapports du jour
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Rapport</CardTitle>
            <CardDescription>Complétez le rapport du jour.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                {/* Step 1 */}
                {step === 1 && (
                  <>
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="grid gap-3 flex-1">
                        <Label htmlFor="business">
                          Sélectionner l'activité
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full text-left"
                            >
                              {business.find((b) => b.id === selectedBusiness)
                                ?.name || "Sélectionner l'activité"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <Command>
                              <CommandInput placeholder="Rechercher..." />
                              <CommandEmpty>
                                Aucune business trouvée.
                              </CommandEmpty>
                              <CommandGroup>
                                {business.map((b) => (
                                  <CommandItem
                                    key={b.id}
                                    onSelect={() => setValue("business", b.id)}
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
                          <p className="text-red-500 text-sm">
                            Veuillez sélectionner une activité.
                          </p>
                        )}
                      </div>
                      <div className="grid gap-3 flex-1">
                        <Label htmlFor="revenueCash">Revenu en espèces</Label>
                        <Input
                          id="revenueCash"
                          type="number"
                          {...register("revenueCash")}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="grid gap-3 flex-1">
                        <Label htmlFor="revenueOrangeMoney">
                          Revenu Orange Money
                        </Label>
                        <Input
                          id="revenueOrangeMoney"
                          type="number"
                          {...register("revenueOrangeMoney")}
                        />
                      </div>
                      <div className="grid gap-3 flex-1">
                        <Label htmlFor="revenueWave">Revenu Wave</Label>
                        <Input
                          id="revenueWave"
                          type="number"
                          {...register("revenueWave")}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="grid gap-3 flex-1">
                        <Label htmlFor="versementTataDiara">
                          Somme versée à Tata Diara
                        </Label>
                        <Input
                          id="versementTataDiara"
                          type="number"
                          {...register("versementTataDiara")}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2: Sortie de caisse */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Sortie de caisse :</h2>
                      <Button
                        type="button"
                        onClick={() => sortieArray.append({ description: "", total: 0 })}
                        className="h-8 w-8 p-0 text-lg flex items-center justify-center"
                      >
                        +
                      </Button>
                    </div>
                    {sortieArray.fields.map((field, idx) => (
                      <div key={field.id} className="flex items-end space-x-2">
                        <div className="flex-1 grid gap-1">
                          <Label htmlFor={`sortieCaisse.${idx}.description`}>Description</Label>
                          <Input
                            id={`sortieCaisse.${idx}.description`}
                            type="text"
                            {...register(`sortieCaisse.${idx}.description`)}
                          />
                        </div>
                        <div className="w-32 grid gap-1">
                          <Label htmlFor={`sortieCaisse.${idx}.total`}>Total</Label>
                          <Input
                            id={`sortieCaisse.${idx}.total`}
                            type="number"
                            {...register(`sortieCaisse.${idx}.total`, { valueAsNumber: true })}
                          />
                        </div>
                        <Button type="button" onClick={() => sortieArray.remove(idx)}>–</Button>
                      </div>
                    ))}
                  </div>
                )}


                {/* Step 3: Ventes */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">
                        Ventes du jour :
                      </h2>
                      <Button
                        type="button"
                        onClick={() => 
                          salesArray.append({
                            ref: "",
                            description: "",
                            total: "",
                          })
                        }
                        className="h-8 w-8 p-0 text-lg flex items-center justify-center"
                      >
                        +
                      </Button>
                    </div>
                    {salesArray.fields.map((field, idx) => (
                      <div key={field.id} className="flex items-end space-x-2">
                        <div className="w-24 grid gap-1">
                          <Label htmlFor={`sales.${idx}.ref`}>
                            Réf
                          </Label>
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
                          <Label htmlFor={`sales.${idx}.total`}>
                            Total
                          </Label>
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

                {/* Step 4: Dettes */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Dettes client :</h2>
                      <Button
                        type="button"
                        onClick={() =>
                          debtsArray.append({
                            ref: "",
                            description: "",
                            total: "",
                          })
                        }
                        className="h-8 w-8 p-0 text-lg flex items-center justify-center"
                      >
                        +
                      </Button>
                    </div>
                    {debtsArray.fields.map((field, idx) => (
                      <div key={field.id} className="flex items-end space-x-2">
                        <div className="w-24 grid gap-1">
                          <Label htmlFor={`debts.${idx}.ref`}>
                            Réf
                          </Label>
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

                {/* Step 5: Règlement dettes */}
                {step === 5 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">
                        Règlement dettes client :
                      </h2>
                      <Button
                        type="button"
                        onClick={() =>
                          regDebtsArray.append({
                            ref: "",
                            description: "",
                            total: "",
                          })
                        }
                        className="h-8 w-8 p-0 text-lg flex items-center justify-center"
                      >
                        +
                      </Button>
                    </div>
                    {regDebtsArray.fields.map((field, idx) => (
                      <div key={field.id} className="flex items-end space-x-2">
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
                          <Label htmlFor={`reglementDebts.${idx}.description`}>
                            Description
                          </Label>
                          <Input
                            id={`reglementDebts.${idx}.description`}
                            type="text"
                            {...register(
                              `reglementDebts.${idx}.description`
                            )}
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
                          onClick={() => regDebtsArray.remove(idx)}
                        >
                          –
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Navigation buttons */}
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
                  {step <= 5 && (
                    <Button type="submit">
                      {step === 5 
                      ? (isLoading 
                          ? (<>
                            <span className="w-4 h-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></span> Enregistrement...
                          </>) 
                          : "Enregistrer"
                        )
                      : "Suivant"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
}
