import { MMKV } from "react-native-mmkv";
import { createSettingsManager } from "./manageSettings";

export const storage = new MMKV({
    id: "main-storage",
    encryptionKey: "hello",
});

export const settingsManager = createSettingsManager(storage);

export default storage;
