import { Text } from "@/src/components/ui/text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { History, LogOut } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, TouchableOpacity, View } from "react-native";
import MedicationItem from "../components/commons/MedicationItem";
import ShowAppToast from "../components/commons/ShowToast";
import { Box } from "../components/ui/box";
import { Fab, FabIcon, FabLabel } from "../components/ui/fab";
import { AddIcon } from "../components/ui/icon";
import { useToast } from "../components/ui/toast";
import { VStack } from "../components/ui/vstack";
import type { Medication } from "../services/medications/types";

type Props = {
  onLogout: () => void
}

const HomeScreen: React.FC<Props> = ({ onLogout }: Props) => {
  const toast = useToast()

  const router = useRouter()

  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    const fetchMedications = async () => {
      const apiUrl = Constants?.expoConfig?.extra?.API_URL;

      try {
        const token = await AsyncStorage.getItem("@app:token");

        const response = await axios.get(`${apiUrl}/medications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMedications(response.data.medications);
      } catch (error) {
        const defaultMessage = "Erro ao carregar medicamentos";

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const toastMessage =
            status === 401
              ? "Sessão expirada. Faça login novamente."
              : defaultMessage;

          ShowAppToast(toast, "error", toastMessage);

          if (status === 401) {
            handleLogout();
          }
        } else {
          ShowAppToast(toast, "error", defaultMessage);
        }
      }
    };

    fetchMedications();
  }, []);


  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("@app:token");
      onLogout()
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  console.log(medications)

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Box className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
        <Text className="text-xl font-bold text-gray-800">Bem vindo</Text>
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4">
            <History size={24} className="text-gray-600" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={24} className="text-red-600" />
          </TouchableOpacity>
        </View>
      </Box>

      <VStack>
        <Text className="text-2xl font-bold text-gray-800 p-4">Seus medicamentos:</Text>
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicationItem
              item={item}
              onPress={() => console.log("teste")}
            />
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-gray-500">Nenhum medicamento cadastrado.</Text>
              <Text className="text-gray-500">Clique no '+' para adicionar.</Text>
            </View>
          )}
          contentContainerClassName="p-4"
        />
      </VStack>


      <Fab
        size="lg"
        placement="bottom right"
        isHovered={false}
        isDisabled={false}
        isPressed={false}
        onPress={() => router.navigate('/register-medication')}
        className="bg-teal-500 mb-4"
      >
        <FabIcon as={AddIcon} />
        <FabLabel>Novo medicamento</FabLabel>
      </Fab>
    </SafeAreaView>
  );
};

export default HomeScreen;