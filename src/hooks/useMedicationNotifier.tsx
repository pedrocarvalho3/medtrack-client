import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


interface UpcomingDose {
  id: string;
  medication_id: string;
  medication_name: string;
  scheduledAt: string;
}

async function fetchUpcomingDoses(): Promise<UpcomingDose[]> {
  console.log('Buscando próximas doses do backend...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  const now = new Date();
  return [
    {
      id: 'dose-123',
      medication_id: 'med-abc',
      medication_name: 'Remédio Exemplo A',
      scheduledAt: new Date(now.getTime() + 2 * 60 * 1000).toISOString(),
    },
    {
      id: 'dose-456',
      medication_id: 'med-xyz',
      medication_name: 'Remédio Exemplo B',
      scheduledAt: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'dose-789',
      medication_id: 'med-abc',
      medication_name: 'Remédio Exemplo A',
      scheduledAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

const useMedicationNotifier = () => {
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      Alert.alert('Erro', 'Notificações push só funcionam em dispositivos físicos.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permissão Negada', 'Não é possível agendar lembretes sem permissão para notificações.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medicine-reminders', {
        name: 'Lembretes de Medicamentos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('Canal de notificação Android configurado.');
    }

    console.log('Permissão para notificações concedida.');

    // try {
    //   const tokenData = await Notifications.getExpoPushTokenAsync();
    //   const token = tokenData.data;
    //   console.log('Expo Push Token obtido:', token);
    //   return token;
    // } catch (error) {
    //   console.error('Erro ao obter o Expo Push Token:', error);
    //   Alert.alert('Erro', 'Não foi possível obter o token para notificações push.');
    //   return null;
    // }

  };


  const syncAndScheduleNotifications = async () => {
    console.log('Iniciando sincronização de notificações...');
    const permissionStatus = await Notifications.getPermissionsAsync();
    if (permissionStatus.status !== 'granted') {
      console.warn('Permissão não concedida, não é possível agendar.');
      return;
    }

    try {
      const upcomingDoses = await fetchUpcomingDoses();
      if (!upcomingDoses || upcomingDoses.length === 0) {
        console.log('Nenhuma dose futura encontrada para agendar.');
      }

      console.log('Cancelando notificações de medicamentos anteriores...');
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      let cancelledCount = 0;
      for (const notif of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        cancelledCount++;
      }
      console.log(`${cancelledCount} notificações anteriores canceladas.`);

      console.log(`Agendando ${upcomingDoses.length} novas notificações...`);
      let scheduledCount = 0;
      for (const dose of upcomingDoses) {
        const scheduledAtDate = new Date(dose.scheduledAt);
        console.log(`[Notifier Debug] Dose ID: ${dose.id}, Raw scheduledAt: ${dose.scheduledAt}, Parsed Date: ${scheduledAtDate.toISOString()}`);

        if (scheduledAtDate > new Date()) {
          try {
            const identifier = `dose-${dose.id}`;
            const trigger = {
              date: scheduledAtDate,
              channelId: 'medicine-reminders',
            };
            console.log(`[Notifier Debug] Scheduling ID: ${identifier} with trigger:`, JSON.stringify(trigger));

            await Notifications.scheduleNotificationAsync({
              identifier: identifier,
              content: {
                title: '💊 Hora do Remédio!',
                body: `Não se esqueça de tomar ${dose.medication_name}.`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: {
                  doseId: dose.id,
                  medicationId: dose.medication_id,
                  url: `myapp://medicine/${dose.medication_id}`
                },
              },
              trigger: trigger,
            });
            scheduledCount++;
          } catch (scheduleError) {
            console.error(`[Notifier Debug] Erro ao agendar notificação para dose ${dose.id}:`, scheduleError);
          }
        } else {
          console.log(`[Notifier Debug] Dose ${dose.id} (${dose.medication_name}) está no passado, não será agendada.`);
        }
      }
      console.log(`${scheduledCount} notificações agendadas com sucesso.`);

      console.log(`[Notifier Debug] ${scheduledCount} notificações agendadas.`);
      const actualScheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('[Notifier Debug] Notificações realmente agendadas pelo sistema:', JSON.stringify(actualScheduled, null, 2));
    } catch (error) {
      console.error('Erro ao sincronizar e agendar notificações:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os lembretes de medicamentos.');
    }
  }

  return { registerForPushNotificationsAsync, syncAndScheduleNotifications };
};

export { useMedicationNotifier };
