import * as ImagePicker from 'expo-image-picker';
import { upload } from './client';

/**
 * Image picker and upload utilities
 */

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export const pickImage = async (
  options: ImagePickerOptions = {}
): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Permission to access media library was denied');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect,
    quality: options.quality ?? 0.8,
    allowsMultipleSelection: false,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri || null;
};

export const takePhoto = async (
  options: ImagePickerOptions = {}
): Promise<string | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Permission to access camera was denied');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect,
    quality: options.quality ?? 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri || null;
};

export const validateImageDimensions = (
  uri: string,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): Promise<boolean> => {
  return new Promise((resolve) => {
    // In React Native, we'd use Image.getSize
    // For now, we'll assume validation passes
    // In production, implement actual dimension checking
    resolve(true);
  });
};

export const uploadImage = async (uri: string): Promise<{ id: string; url: string }> => {
  return upload.image(uri);
};



