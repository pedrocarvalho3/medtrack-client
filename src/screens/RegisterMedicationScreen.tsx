import { zodResolver } from "@hookform/resolvers/zod";
import Constants from "expo-constants";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from "react-native";
import { z } from "zod";

import ShowAppToast from "@/src/components/commons/ShowToast";
import InputController from "@/src/components/form/InputController";

import { Button, ButtonText } from "@/src/components/ui/button";
import { FormControl, FormControlError, FormControlErrorIcon, FormControlErrorText, FormControlLabel, FormControlLabelText } from "@/src/components/ui/form-control";
import { Heading } from "@/src/components/ui/heading";
import { AlertCircleIcon, CircleIcon } from "@/src/components/ui/icon";
import { Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel } from "@/src/components/ui/radio";
import { VStack } from "@/src/components/ui/vstack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from "expo-router";
import { useToast } from "../components/ui/toast";
import { useMedicationNotifier } from "../hooks/useMedicationNotifier";

const medicationSchema = z.object({
  name: z.string().min(1, "Nome do medicamento é obrigatório."),
  dosage: z.string().min(1, "Dosagem é obrigatória."),
  periodicityType: z.enum(["INTERVAL", "FIXED_TIMES"], {
    required_error: "Tipo de periodicidade é obrigatório."
  }),
  periodicity: z.string().min(1, "Periodicidade é obrigatória."),
  validity: z.date({ required_error: "Data de validade é obrigatória." }),
  quantityAvailable: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) {
        return 0;
      }
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    },
    z.number({ invalid_type_error: "Quantidade deve ser um número." })
      .min(0, "Quantidade não pode ser negativa.")
      .finite("Quantidade inválida.")
  ),
}).superRefine((data, ctx) => {
  if (data.periodicityType === "INTERVAL") {
    const interval = parseInt(data.periodicity);
    if (isNaN(interval)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Intervalo deve ser um número válido.",
        path: ["periodicity"]
      });
      return;
    }
    if (interval < 1 || interval > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Intervalo deve ser entre 1 e 24 horas.",
        path: ["periodicity"]
      });
      return;
    }
  }

  if (data.periodicityType === "FIXED_TIMES") {
    const times = data.periodicity.split(',').map(t => t.trim());

    if (times.length === 0 || times.some(t => t === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pelo menos um horário deve ser informado.",
        path: ["periodicity"]
      });
      return;
    }

    if (times.length > 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Máximo de 6 horários por dia.",
        path: ["periodicity"]
      });
      return;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const invalidTimes = times.filter(time => !timeRegex.test(time));

    if (invalidTimes.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Formato inválido. Use HH:MM (ex: 08:00, 16:30).",
        path: ["periodicity"]
      });
      return;
    }

    const uniqueTimes = new Set(times);
    if (uniqueTimes.size !== times.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Horários duplicados não são permitidos.",
        path: ["periodicity"]
      });
      return;
    }

    const sortedTimes = times.sort();
    if (JSON.stringify(times) !== JSON.stringify(sortedTimes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Os horários devem estar em ordem cronológica.",
        path: ["periodicity"]
      });
      return;
    }
  }
});

type MedicationSchema = z.infer<typeof medicationSchema>;

const RegisterMedicationScreen = () => {
  const toast = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const form = useForm<MedicationSchema>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosage: '',
      periodicityType: 'INTERVAL',
      periodicity: '',
      validity: new Date(),
      quantityAvailable: 0,
    }
  });

  const { control, handleSubmit, setValue, watch, formState: { errors } } = form;

  const { syncAndScheduleNotifications } = useMedicationNotifier();

  const periodicityType = watch('periodicityType');

  const handleSaveMedication = async (data: MedicationSchema): Promise<void> => {
    setIsLoading(true);
    const apiUrl = Constants?.expoConfig?.extra?.API_URL;

    const payload = {
      name: data.name,
      dosage: data.dosage,
      periodicityType: data.periodicityType,
      periodicity: data.periodicity,
      validity: data.validity.toISOString(),
      quantityAvailable: data.quantityAvailable,
    };

    try {
      const token = await AsyncStorage.getItem("@app:token");

      console.log(payload)

      const response = await fetch(`${apiUrl}/medications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log(response)

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 400 && errorData.errors) {
          const errorMessages = errorData.errors.map((err: any) =>
            `${err.field}: ${err.message}`
          ).join('\n');
          ShowAppToast(toast, "error", errorMessages);
        } else {
          ShowAppToast(toast, "error", errorData.message || "Erro ao cadastrar medicamento");
        }
        return;
      }

      ShowAppToast(toast, "success", "Medicamento cadastrado com sucesso!");
      syncAndScheduleNotifications()
      router.back();

    } catch (error) {
      console.error("Erro ao cadastrar medicamento:", error);
      const defaultMessage = "Ocorreu um erro ao cadastrar o medicamento.";
      ShowAppToast(toast, "error", defaultMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodicityPlaceholder = () => {
    return periodicityType === 'INTERVAL'
      ? "Ex: 8 (entre 1 e 24 horas)"
      : "Ex: 08:00,14:00,20:00 (máx 6 horários)";
  };

  const getPeriodicityLabel = () => {
    return periodicityType === 'INTERVAL'
      ? "Intervalo (em horas)"
      : "Horários Fixos (separados por vírgula)";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 p-4">
          <VStack space="lg">
            <Heading className="text-teal-500 font-bold text-4xl mb-8">
              Novo Medicamento
            </Heading>

            <InputController
              control={control}
              name="name"
              label="Nome do Medicamento"
              placeholder="Ex: Paracetamol 750mg"
            />

            <InputController
              control={control}
              name="dosage"
              label="Dosagem"
              placeholder="Ex: 1 comprimido"
            />

            <Controller
              control={control}
              name="periodicityType"
              render={({ field: { onChange, value } }) => (
                <FormControl isRequired isInvalid={!!errors.periodicityType}>
                  <FormControlLabel>
                    <FormControlLabelText>Tipo de Periodicidade</FormControlLabelText>
                  </FormControlLabel>

                  <RadioGroup
                    value={value}
                    onChange={(newValue) => {
                      onChange(newValue);
                      setValue('periodicity', '');
                    }}
                  >
                    <VStack space="sm">
                      <Radio value="INTERVAL">
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon} />
                        </RadioIndicator>
                        <RadioLabel>Intervalo (Ex: de 8 em 8 horas)</RadioLabel>
                      </Radio>

                      <Radio value="FIXED_TIMES">
                        <RadioIndicator>
                          <RadioIcon as={CircleIcon} />
                        </RadioIndicator>
                        <RadioLabel>Horários Fixos (Ex: 08:00, 16:00)</RadioLabel>
                      </Radio>
                    </VStack>
                  </RadioGroup>

                  {errors.periodicityType && (
                    <FormControlError>
                      <FormControlErrorIcon as={AlertCircleIcon} />
                      <FormControlErrorText>
                        {errors.periodicityType.message}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              )}
            />

            <InputController
              control={control}
              name="periodicity"
              label={getPeriodicityLabel()}
              placeholder={getPeriodicityPlaceholder()}
              keyboardType={periodicityType === 'INTERVAL' ? 'numeric' : 'default'}
            />

            <Controller
              control={control}
              name="validity"
              render={({ field: { value } }) => (
                <FormControl isRequired isInvalid={!!errors.validity}>
                  <FormControlLabel>
                    <FormControlLabelText>Data de Validade</FormControlLabelText>
                  </FormControlLabel>

                  <Button
                    onPress={() => setShowDatePicker(true)}
                    variant="outline"
                    className="mb-2"
                  >
                    <ButtonText>
                      Selecionar Data: {value.toLocaleDateString()}
                    </ButtonText>
                  </Button>

                  {showDatePicker && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={value}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                        const currentDate = selectedDate || value;

                        if (event.type === 'set') {
                          setValue('validity', currentDate, { shouldValidate: true });
                        }

                        setShowDatePicker(false);
                      }}
                    />
                  )}

                  {errors.validity && (
                    <FormControlError>
                      <FormControlErrorIcon as={AlertCircleIcon} />
                      <FormControlErrorText>
                        {errors.validity.message}
                      </FormControlErrorText>
                    </FormControlError>
                  )}
                </FormControl>
              )}
            />

            <InputController
              control={control}
              name="quantityAvailable"
              label="Quantidade Disponível"
              placeholder="Ex: 30"
              keyboardType="numeric"
            />

            <Button
              onPress={form.handleSubmit(handleSaveMedication)}
              size="lg"
              className="rounded-xl bg-teal-500 h-12 mt-4"
              disabled={isLoading}
            >
              <ButtonText>{isLoading ? "Salvando..." : "Salvar Medicamento"}</ButtonText>
            </Button>

            <Button
              onPress={() => router.back()}
              variant="link"
              className="bg-gray-200 rounded-xl h-12 mt-2"
              disabled={isLoading}
            >
              <ButtonText className="text-teal-500">Cancelar</ButtonText>
            </Button>

          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterMedicationScreen;