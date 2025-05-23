import { Text } from "@/src/components/ui/text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogOut } from "lucide-react-native";
import { SafeAreaView } from "react-native";
import { Button, ButtonIcon, ButtonText } from "../components/ui/button";

type Props = {
  onLogout: () => void
}

const HomeScreen: React.FC<Props> = ({ onLogout }: Props) => {

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("@app:token");
      onLogout()
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 justify-center">
      <Text>teste</Text>

      <Button
        onPress={handleLogout}
        variant="link"
        className="bg-red-200 rounded-xl h-12 items-center"
      >
        <ButtonIcon as={LogOut} className="stroke-red-600" />
        <ButtonText className="text-red-600">Sair</ButtonText>
      </Button>
    </SafeAreaView>
  );
};

export default HomeScreen;
