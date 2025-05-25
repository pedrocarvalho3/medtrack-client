import { Calendar, CheckCircle, Clock, PauseCircle, XCircle } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Badge } from '../ui/badge';
import { Box } from '../ui/box';
import { HStack } from '../ui/hstack';
import { Text } from '../ui/text';
import { VStack } from '../ui/vstack';

interface ScheduledDose {
  id: string;
  scheduledAt: string;
  status: 'PENDING' | 'TAKEN' | 'SNOOZED' | 'MISSED';
  medication: {
    name: string;
    dosage: string;
  };
}

interface Props {
  item: ScheduledDose;
  onPress: () => void;
}

const ScheduledDoseItem: React.FC<Props> = ({ item, onPress }) => {
  const formatScheduledTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const scheduleDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = scheduleDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const timeString = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diffDays === 0) return `Hoje às ${timeString}`;
    if (diffDays === 1) return `Amanhã às ${timeString}`;
    if (diffDays === -1) return `Ontem às ${timeString}`;
    if (diffDays > 1) return `${date.toLocaleDateString('pt-BR')} às ${timeString}`;
    if (diffDays < -1) return `${date.toLocaleDateString('pt-BR')} às ${timeString}`;

    return `${date.toLocaleDateString('pt-BR')} às ${timeString}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'TAKEN':
        return {
          icon: CheckCircle,
          color: '#10b981',
          bgColor: '#d1fae5',
          variant: 'solid' as const,
          text: 'Tomado',
          textColor: 'text-green-700'
        };
      case 'PENDING':
        return {
          icon: Clock,
          color: '#f59e0b',
          bgColor: '#fef3c7',
          variant: 'solid' as const,
          text: 'Pendente',
          textColor: 'text-yellow-700'
        };
      case 'SNOOZED':
        return {
          icon: PauseCircle,
          color: '#6366f1',
          bgColor: '#e0e7ff',
          variant: 'outline' as const,
          text: 'Adiado',
          textColor: 'text-indigo-700'
        };
      case 'MISSED':
        return {
          icon: XCircle,
          color: '#ef4444',
          bgColor: '#fee2e2',
          variant: 'solid' as const,
          text: 'Perdido',
          textColor: 'text-red-700'
        };
      default:
        return {
          icon: Clock,
          color: '#6b7280',
          bgColor: '#f3f4f6',
          variant: 'outline' as const,
          text: 'Pendente',
          textColor: 'text-gray-700'
        };
    }
  };

  const statusConfig = getStatusConfig(item.status);
  const StatusIcon = statusConfig.icon;

  const isOverdue = () => {
    if (item.status !== 'PENDING') return false;
    return new Date(item.scheduledAt) < new Date();
  };

  const overdue = isOverdue();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Box className={`bg-white rounded-xl p-4 shadow-sm border mb-3 ${overdue ? 'border-red-200' : 'border-gray-100'
        }`}>
        <VStack space="sm">
          <HStack className="items-center justify-between">
            <HStack className="items-center flex-1" space="sm">
              <View
                className="p-2 rounded-lg"
                style={{ backgroundColor: statusConfig.bgColor }}
              >
                <StatusIcon size={20} color={statusConfig.color} />
              </View>
              <VStack className="flex-1" space="xs">
                <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
                  {item.medication.name}
                </Text>
                <Text className="text-gray-600 text-sm">
                  Tomar {item.medication.dosage} {item.medication.dosage === "1" ? "unidade" : "unidades"}
                </Text>
              </VStack>
            </HStack>

            <Badge variant={statusConfig.variant} className="px-2 py-1">
              <Text className={`text-xs font-medium ${statusConfig.textColor}`}>
                {statusConfig.text}
              </Text>
            </Badge>
          </HStack>

          <HStack className="items-center justify-between mt-2">
            <HStack className="items-center" space="xs">
              <Calendar size={14} color="#6b7280" />
              <Text className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                {formatScheduledTime(item.scheduledAt)}
              </Text>
            </HStack>

            {overdue && (
              <Badge variant="solid" className="px-2 py-1">
                <Text className="text-xs font-medium text-red-600">
                  Atrasado
                </Text>
              </Badge>
            )}
          </HStack>
        </VStack>
      </Box>
    </TouchableOpacity>
  );
};

export default ScheduledDoseItem;