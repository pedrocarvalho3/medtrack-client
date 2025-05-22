import { Toast, ToastTitle, ToastDescription } from "../ui/toast";
import { HStack } from "../ui/hstack";
import { VStack } from "../ui/vstack";
import { Icon } from "../ui/icon";
import { AlertCircleIcon, CheckCircleIcon, InfoIcon, XCircleIcon } from "lucide-react-native";

type ToastType = "info" | "error" | "success" | "warning";

const ShowAppToast = (toast: any, type: ToastType, message: string, title?: string) => {
  const newId = Math.random();

  let IconComponent = InfoIcon;
  let color = "blue-500";
  let defaultTitle = "Informação";

  if (type === "error") {
    IconComponent = XCircleIcon;
    color = "red-500";
    defaultTitle = "Erro";
  } else if (type === "success") {
    IconComponent = CheckCircleIcon;
    color = "green-500";
    defaultTitle = "Sucesso";
  } else if (type === "warning") {
    IconComponent = AlertCircleIcon;
    color = "yellow-500";
    defaultTitle = "Atenção";
  }

  toast.show({
    id: newId,
    placement: "top",
    duration: 3000,
    render: ({ id }: { id: number }) => {
      return (
        <Toast
          action={type}
          variant="outline"
          nativeID={`toast-${id}`}
          className={`p-4 gap-6 border-${color} w-full shadow-hard-5 max-w-[443px] flex-row justify-between`}
        >
          <HStack space="md">
            <Icon as={IconComponent} className={`stroke-${color} mt-0.5`} />
            <VStack space="xs">
              <ToastTitle className={`font-semibold text-${color}`}>
                {title || defaultTitle}
              </ToastTitle>
              <ToastDescription size="sm">{message}</ToastDescription>
            </VStack>
          </HStack>
        </Toast>
      );
    },
  });
};

export default ShowAppToast
