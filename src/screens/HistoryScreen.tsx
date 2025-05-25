import ScheduledDoseItem from '../components/commons/ScheduledDoseItem';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Filter, History, LogOut } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, TouchableOpacity, View } from 'react-native';
import ShowAppToast from '../components/commons/ShowToast';
import { Box } from '../components/ui/box';
import { HStack } from '../components/ui/hstack';
import { Text } from '../components/ui/text';
import { VStack } from '../components/ui/vstack';

interface ScheduledDose {
  id: string;
  scheduledAt: string;
  status: 'TAKEN' | 'SNOOZED' | 'MISSED';
  medication: {
    name: string;
    dosage: string;
  };
}

interface Props {
  onLogout: () => void;
  toast: any;
}

const HistoryScreen: React.FC<Props> = ({ onLogout, toast }) => {
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  useEffect(() => {
    fetchScheduledDoses();
  }, [selectedStatuses]);

  const fetchScheduledDoses = async () => {
    const apiUrl = Constants?.expoConfig?.extra?.API_URL;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("@app:token");

      const statusQuery = selectedStatuses.length > 0
        ? `&status=${selectedStatuses.join(',')}`
        : '&status=TAKEN,SNOOZED,MISSED';

      const response = await axios.get(
        `${apiUrl}/scheduled-doses?page=1${statusQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      setScheduledDoses(response.data.scheduledDoses);
    } catch (error) {
      const defaultMessage = "Erro ao carregar doses agendadas";

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
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("@app:token");
      onLogout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleHistory = async () => {
  };

  const handleDosePress = (dose: ScheduledDose) => {
    console.log("Dose pressionada:", dose);
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const getFilterButtonStyle = (status: string) => {
    const isSelected = selectedStatuses.includes(status);
    return `px-3 py-2 rounded-full border ${isSelected
      ? 'bg-teal-100 border-teal-300'
      : 'bg-white border-gray-300'
      }`;
  };

  const getFilterTextStyle = (status: string) => {
    const isSelected = selectedStatuses.includes(status);
    return `text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-gray-600'
      }`;
  };

  const statusLabels = {
    TAKEN: 'Tomado',
    SNOOZED: 'Adiado',
    MISSED: 'Perdido'
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Box className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
        <Text className="text-xl font-bold text-gray-800">Histórico</Text>
        <View className="flex-row items-center">
          <TouchableOpacity className="mr-4" onPress={handleHistory}>
            <History size={24} className="text-gray-600" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={24} className="text-red-600" />
          </TouchableOpacity>
        </View>
      </Box>

      <Box className="bg-white p-4 border-b border-gray-200">
        <HStack className="items-center mb-2" space="sm">
          <Filter size={16} color="#6b7280" />
          <Text className="text-sm font-medium text-gray-700">Filtrar por status:</Text>
        </HStack>
        <HStack className="flex-wrap" space="sm">
          {Object.entries(statusLabels).map(([status, label]) => (
            <TouchableOpacity
              key={status}
              onPress={() => toggleStatusFilter(status)}
              className={getFilterButtonStyle(status)}
            >
              <Text className={getFilterTextStyle(status)}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </HStack>
        {selectedStatuses.length > 0 && (
          <TouchableOpacity
            onPress={() => setSelectedStatuses([])}
            className="mt-2"
          >
            <Text className="text-sm text-teal-600 font-medium">
              Limpar filtros
            </Text>
          </TouchableOpacity>
        )}
      </Box>

      <VStack className="flex-1">
        <Text className="text-lg font-bold text-gray-800 p-4">
          {selectedStatuses.length > 0
            ? `Doses filtradas (${scheduledDoses.length})`
            : `Suas doses (${scheduledDoses.length})`
          }
        </Text>

        <FlatList
          data={scheduledDoses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ScheduledDoseItem
              item={item}
              onPress={() => handleDosePress(item)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchScheduledDoses}
          ListEmptyComponent={
            <Box className="flex-1 justify-center items-center py-8">
              <Text className="text-gray-500 text-center">
                {selectedStatuses.length > 0
                  ? "Nenhuma dose encontrada com os filtros selecionados"
                  : "Nenhuma dose agendada encontrada"
                }
              </Text>
            </Box>
          }
        />
      </VStack>
    </SafeAreaView>
  );
};

export default HistoryScreen;