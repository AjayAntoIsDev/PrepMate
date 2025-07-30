import { MMKV } from "react-native-mmkv";
import { createSettingsManager } from "./manageSettings";
import { createTopicsManager } from "./manageTopics";

export const storage = new MMKV({
    id: "main-storage",
    encryptionKey: "hello",
});

export const settingsManager = createSettingsManager(storage);
export const topicsManager = createTopicsManager(storage);

export default storage;
