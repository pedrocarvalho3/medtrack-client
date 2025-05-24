import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native";
import { z } from "zod";
import ShowAppToast from "../components/commons/ShowToast";
import InputController from "../components/form/InputController";
import { Button, ButtonText } from "../components/ui/button";
import { Heading } from "../components/ui/heading";
import { useToast } from "../components/ui/toast";
import { VStack } from "../components/ui/vstack";

const registerSchema = z.object({
  email: z.string().email("Email inválido!"),
  password: z.string().min(8, 'A senha deve ter no minímo 8 caracteres!'),
  repeated_password: z.string().min(8, 'A senha deve ter no minímo 8 caracteres!'),
  name: z.string(),
});

type RegisterSchema = z.infer<typeof registerSchema>

const RegisterScreen: React.FC = () => {
  const toast = useToast()

  const { handleSubmit, control } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const router = useRouter()
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [repeatedShowPassword, setRepeatedShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRegister = async (data: RegisterSchema) => {
    const apiUrl = Constants?.expoConfig?.extra?.API_URL;
    setIsLoading(true);

    try {
      await axios.post(`${apiUrl}/users`, data);

      ShowAppToast(toast, "success", "Cadastro realizado com sucesso!");
      router.back();
    } catch (error) {
      const defaultMessage = "Ocorreu um erro inesperado"

      if (axios.isAxiosError(error)) {
        const status = error.response?.status

        const toastMessage =
          status === 409
            ? "Org com e-mail já cadastrado!"
            : defaultMessage

        ShowAppToast(toast, "error", toastMessage)
      } else {
        ShowAppToast(toast, "error", defaultMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 justify-center">
      <VStack space="xl" className="p-8">
        <Heading className="text-teal-500 font-bold text-5xl">
          Cadastre-se
        </Heading>

        <VStack space="md" className="mt-4">
          <InputController
            control={control}
            name="name"
            label="Nome do usuário"
          />

          <InputController
            control={control}
            name="email"
            label="Email"
            keyboardType="email-address"
          />

          <InputController
            control={control}
            name="password"
            label="Senha"
            secureTextEntry
            showToggle
            showPassword={showPassword}
            togglePassword={() => setShowPassword(prev => !prev)}
          />

          <InputController
            control={control}
            name="repeated_password"
            label="Confirmar senha"
            secureTextEntry
            showToggle
            showPassword={repeatedShowPassword}
            togglePassword={() => setRepeatedShowPassword(prev => !prev)}
          />
        </VStack>

        <Button
          onPress={handleSubmit(handleRegister)}
          className="rounded-xl bg-teal-500 h-12"
          disabled={isLoading}
        >
          <ButtonText>{isLoading ? "Carregando..." : "Cadastrar-se"}</ButtonText>
        </Button>
        <Button
          onPress={handleGoBack}
          variant="link"
          className="bg-gray-200 rounded-xl h-12"
        >
          <ButtonText className="text-teal-500">Já tenho uma conta</ButtonText>
        </Button>
      </VStack>
    </SafeAreaView>
  );
};

export default RegisterScreen;
