import { Text } from "@/src/components/ui/text";
import type { Medication } from "@/src/services/medications/types";
import { AlertTriangle, Calendar, Clock, Pill } from "lucide-react-native";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Badge } from "../ui/badge";
import { Box } from "../ui/box";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";

type Props = {
  item: Medication;
  onPress: () => void;
};

const MedicationItem: React.FC<Props> = ({ item, onPress }) => {
  const formatPeriodicity = (periodicity: string, periodicityType?: string) => {
    if (!periodicityType) {
      if (periodicity.includes(',') || periodicity.includes(':')) {
        return formatFixedTimes(periodicity);
      } else {
        return formatInterval(periodicity);
      }
    }

    if (periodicityType === 'INTERVAL') {
      return formatInterval(periodicity);
    } else if (periodicityType === 'FIXED_TIMES') {
      return formatFixedTimes(periodicity);
    }

    return periodicity;
  };

  const formatInterval = (periodicity: string) => {
    const hours = parseInt(periodicity);
    if (hours === 24) return "1x ao dia";
    if (hours === 12) return "2x ao dia";
    if (hours === 8) return "3x ao dia";
    if (hours === 6) return "4x ao dia";
    return `A cada ${hours}h`;
  };

  const formatFixedTimes = (periodicity: string) => {
    const times = periodicity.split(',').map(t => t.trim());
    if (times.length === 1) return `Às ${times[0]}`;
    if (times.length <= 3) return `Às ${times.join(', ')}`;
    return `${times.length}x ao dia`;
  };

  const formatValidity = (validity: string) => {
    const date = new Date(validity);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Vencido";
    if (diffDays === 0) return "Vence hoje";
    if (diffDays === 1) return "Vence amanhã";
    if (diffDays <= 30) return `Vence em ${diffDays} dias`;

    return date.toLocaleDateString('pt-BR');
  };

  const getValidityColor = (validity: string) => {
    const date = new Date(validity);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "solid";
    if (diffDays <= 7) return "solid";
    if (diffDays <= 30) return "outline";
    return "outline";
  };

  const getValidityTextColor = (validity: string) => {
    const date = new Date(validity);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "text-red-600";
    if (diffDays <= 7) return "text-orange-600";
    if (diffDays <= 30) return "text-yellow-600";
    return "text-gray-600";
  };

  const isLowQuantity = item.quantityAvailable !== undefined && item.quantityAvailable < 5;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3">
        <VStack space="sm">
          <HStack className="items-center justify-between">
            <HStack className="items-center flex-1" space="sm">
              <View className="bg-teal-100 p-2 rounded-lg">
                <Pill size={20} color="#14b8a6" />
              </View>
              <Text className="font-semibold text-gray-900 text-lg flex-1" numberOfLines={1}>
                {item.name}
              </Text>
            </HStack>

            {isLowQuantity && (
              <View className="bg-orange-100 p-1 rounded-full">
                <AlertTriangle size={16} color="#f97316" />
              </View>
            )}
          </HStack>

          <Text className="text-gray-600 text-base">
            Tomar {item.dosage} {item.dosage === "1" ? "unidade" : "unidades"}
          </Text>

          {item.periodicity && (
            <HStack className="items-center" space="xs">
              <Clock size={14} color="#6b7280" />
              <Text className="text-gray-600 text-sm">
                {formatPeriodicity(item.periodicity, item.periodicityType.toString())}
              </Text>
            </HStack>
          )}

          <HStack className="items-center justify-between mt-2">
            <HStack className="items-center" space="sm">
              {item.quantityAvailable !== undefined && (
                <Badge
                  variant={isLowQuantity ? "solid" : "outline"}
                  className="px-2 py-1"
                >
                  <Text className={`text-xs font-medium ${isLowQuantity ? "text-red-600" : "text-gray-600"
                    }`}>
                    {item.quantityAvailable} {item.quantityAvailable === 1 ? "unidade" : "unidades"}
                  </Text>
                </Badge>
              )}
            </HStack>

            <HStack className="items-center" space="xs">
              <Calendar size={12} color="#6b7280" />
              <Badge variant={getValidityColor(item.validity)} className="px-2 py-1">
                <Text className={`text-xs font-medium ${getValidityTextColor(item.validity)}`}>
                  {formatValidity(item.validity)}
                </Text>
              </Badge>
            </HStack>
          </HStack>
        </VStack>
      </Box>
    </TouchableOpacity>
  );
};

export default MedicationItem;