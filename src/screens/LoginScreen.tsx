import { zodResolver } from "@hookform/resolvers/zod";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { SafeAreaView } from "react-native";
import { z } from "zod";
import ShowAppToast from "../components/commons/ShowToast";
import InputController from '../components/form/InputController';
import { Button, ButtonText } from "../components/ui/button";
import { Heading } from "../components/ui/heading";
import { useToast } from "../components/ui/toast";
import { VStack } from "../components/ui/vstack";

const loginSchema = z.object({
  email: z.string().email("Email inválido!"),
  password: z.string().min(8, 'A senha deve ter no minímo 8 caracteres!'),
});

type LoginSchema = z.infer<typeof loginSchema>;

type Props = {
  onLoginSuccess: () => void
}

const Login: React.FC<Props> = ({ onLoginSuccess }: Props) => {
  const toast = useToast()

  const { handleSubmit, control, formState: { errors } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async (data: LoginSchema) => {
    const apiUrl = Constants?.expoConfig?.extra?.API_URL;
    setIsLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/users/auth`, data);

      const { token } = response.data;
      await AsyncStorage.setItem("@app:token", token);

      ShowAppToast(toast, "success", "Login realizado com sucesso!");
      onLoginSuccess();
    } catch (error) {
      const defaultMessage = "Ocorreu um erro inesperado"

      if (axios.isAxiosError(error)) {
        const status = error.response?.status

        const toastMessage =
          status === 400
            ? "Credencias inválidas!"
            : defaultMessage

        ShowAppToast(toast, "error", toastMessage)
      } else {
        ShowAppToast(toast, "error", defaultMessage)
      }
    } finally {
      setIsLoading(false)
    }
  };

  const handleRegisterPress = () => {
    router.navigate("/register")
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 justify-center">
      <VStack space="xl" className="p-8">
        <Heading className="text-teal-500 font-bold text-7xl">
          Entrar
        </Heading>
        <VStack space="md">
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
        </VStack>

        <Button
          onPress={handleSubmit(handleLogin)}
          className="rounded-xl bg-teal-500 h-12 mt-4"
          disabled={isLoading}
        >
          <ButtonText>{isLoading ? "Carregando..." : "Login"}</ButtonText>
        </Button>
        <Button
          onPress={handleRegisterPress}
          variant="link"
          className="bg-gray-200 rounded-xl h-12"
          disabled={isLoading}
        >
          <ButtonText className="text-teal-500">
            Cadastre-se
          </ButtonText>
        </Button>
      </VStack>
    </SafeAreaView>
  );
};

export default Login;
