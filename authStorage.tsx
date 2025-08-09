import * as SecureStore from 'expo-secure-store';

const USER_KEY = 'user_uid';

export const saveUser = async (uid: string) => {
    await SecureStore.setItemAsync(USER_KEY, uid);
};

export const getSavedUser = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(USER_KEY);
};

export const clearUser = async () => {
    await SecureStore.deleteItemAsync(USER_KEY);
};
