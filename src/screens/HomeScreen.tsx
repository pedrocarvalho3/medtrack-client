import { Text } from "@/src/components/ui/text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { History, LogOut, Minus, Package, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MedicationItem from "../components/commons/MedicationItem";
import ShowAppToast from "../components/commons/ShowToast";
import { Box } from "../components/ui/box";
import { Fab, FabIcon, FabLabel } from "../components/ui/fab";
import { HStack } from "../components/ui/hstack";
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
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState("1");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMedications = useCallback(async (isRefreshing = false) => {
    const apiUrl = Constants?.expoConfig?.extra?.API_URL;

    if (isRefreshing) {
      setRefreshing(true);
    }

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
    } finally {
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      fetchMedications();
    }, [fetchMedications])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("@app:token");
      onLogout()
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleMedicationPress = (medication: Medication) => {
    setSelectedMedication(medication);
    setQuantityToAdd("1");
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMedication(null);
    setQuantityToAdd("1");
  };

  const handleQuantityChange = (operation: 'increase' | 'decrease') => {
    const currentQuantity = parseInt(quantityToAdd) || 0;

    if (operation === 'increase') {
      setQuantityToAdd((currentQuantity + 1).toString());
    } else if (operation === 'decrease' && currentQuantity > 1) {
      setQuantityToAdd((currentQuantity - 1).toString());
    }
  };

  const handleAddToStock = async () => {
    if (!selectedMedication) return;

    const quantity = parseInt(quantityToAdd);
    if (quantity <= 0) {
      ShowAppToast(toast, "error", "Quantidade deve ser maior que zero");
      return;
    }

    setIsUpdating(true);
    const apiUrl = Constants?.expoConfig?.extra?.API_URL;

    try {
      const token = await AsyncStorage.getItem("@app:token");

      const response = await axios.patch(
        `${apiUrl}/medications/${selectedMedication.id}/add-stock`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        ShowAppToast(toast, "success", `${quantity} unidade(s) adicionada(s) ao estoque!`);

        setMedications(prevMedications =>
          prevMedications.map(med =>
            med.id === selectedMedication.id
              ? { ...med, quantityAvailable: (med.quantityAvailable || 0) + quantity }
              : med
          )
        );

        handleCloseModal();
      }
    } catch (error) {
      const defaultMessage = "Erro ao adicionar ao estoque";

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const toastMessage =
          status === 401
            ? "Sessão expirada. Faça login novamente."
            : error.response?.data?.message || defaultMessage;

        ShowAppToast(toast, "error", toastMessage);

        if (status === 401) {
          handleLogout();
        }
      } else {
        ShowAppToast(toast, "error", defaultMessage);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  console.log(medications)

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Box className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
        <Text className="text-xl font-bold text-gray-800">Bem vindo</Text>
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4" onPress={() => router.navigate('/history')}>
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
              onPress={() => handleMedicationPress(item)}
            />
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-gray-500">Nenhum medicamento cadastrado.</Text>
              <Text className="text-gray-500">Clique no botão flutuante para adicionar.</Text>
            </View>
          )}
          contentContainerClassName="p-4"
          refreshing={refreshing}
          onRefresh={() => fetchMedications(true)}
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <Box className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-xl">
            <VStack space="lg">
              <VStack space="sm">
                <HStack className="items-center justify-center" space="sm">
                  <View className="bg-teal-100 p-2 rounded-full">
                    <Package size={24} color="#14b8a6" />
                  </View>
                  <Text className="text-xl font-bold text-gray-800">
                    Adicionar ao Estoque
                  </Text>
                </HStack>

                <Text className="text-center text-gray-600">
                  {selectedMedication?.name}
                </Text>

                <Text className="text-center text-sm text-gray-500">
                  Estoque atual: {selectedMedication?.quantityAvailable || 0} unidade(s)
                </Text>
              </VStack>

              <VStack space="sm">
                <Text className="text-base font-medium text-gray-700">
                  Quantidade a adicionar:
                </Text>

                <HStack className="items-center justify-center" space="md">
                  <TouchableOpacity
                    onPress={() => handleQuantityChange('decrease')}
                    className="bg-gray-100 rounded-full p-3"
                    disabled={parseInt(quantityToAdd) <= 1}
                  >
                    <Minus
                      size={20}
                      color={parseInt(quantityToAdd) <= 1 ? "#9ca3af" : "#374151"}
                    />
                  </TouchableOpacity>

                  <TextInput
                    value={quantityToAdd}
                    onChangeText={setQuantityToAdd}
                    keyboardType="numeric"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center text-lg font-semibold min-w-20"
                    maxLength={3}
                  />

                  <TouchableOpacity
                    onPress={() => handleQuantityChange('increase')}
                    className="bg-gray-100 rounded-full p-3"
                  >
                    <Plus size={20} color="#374151" />
                  </TouchableOpacity>
                </HStack>
              </VStack>

              <HStack space="sm">
                <TouchableOpacity
                  onPress={handleCloseModal}
                  className="flex-1 bg-gray-100 rounded-xl py-3"
                  disabled={isUpdating}
                >
                  <Text className="text-center text-gray-700 font-medium">
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleAddToStock}
                  className="flex-1 bg-teal-500 rounded-xl py-3"
                  disabled={isUpdating}
                >
                  <Text className="text-center text-white font-medium">
                    {isUpdating ? "Adicionando..." : "Adicionar"}
                  </Text>
                </TouchableOpacity>
              </HStack>
            </VStack>
          </Box>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;