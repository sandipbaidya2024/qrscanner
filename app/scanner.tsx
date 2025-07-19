import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@expo/vector-icons/Feather';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';

const sendSmsNotification = async (studentName, parentPhone, attendanceType) => { /* ... */ };

export default function ScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const markAttendance = async (studentId: string) => { /* ... */ };
  const handleBarCodeScanned = async ({ data: studentId }) => { /* ... */ };
  const resetScanner = () => { /* ... */ };

  if (hasPermission === null) { /* ... */ }
  if (hasPermission === false) { /* ... */ }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {!scanned && (
        <View style={styles.overlay}>
          <Text style={styles.title}>Scan Attendance QR Code</Text>
          <View style={styles.scannerBox} />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="x" size={30} color={Colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={Colors.textOnPrimary} />
          <Text style={styles.statusText}>Verifying ID...</Text>
        </View>
      )}

      {!isLoading && status.message ? (
        <View style={styles.overlay}>
          <View style={[styles.statusBox, status.type === 'success' ? styles.successBox : styles.errorBox]}>
            <Icon name={status.type === 'success' ? 'check-circle' : 'x-circle'} size={60} color={Colors.textOnPrimary} />
            <Text style={styles.statusText}>{status.message}</Text>
            <TouchableOpacity style={styles.scanAgainButton} onPress={resetScanner}>
                <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, color: Colors.textOnPrimary, fontWeight: 'bold', position: 'absolute', top: 100 },
  scannerBox: { width: 250, height: 250, borderColor: Colors.textOnPrimary, borderWidth: 2, borderRadius: 10, borderStyle: 'dashed' },
  backButton: { position: 'absolute', top: 50, left: 20 },
  statusBox: { alignItems: 'center', justifyContent: 'center', padding: 30, borderRadius: 20, marginHorizontal: 20 },
  successBox: { backgroundColor: Colors.success },
  errorBox: { backgroundColor: Colors.danger },
  statusText: { color: Colors.textOnPrimary, fontSize: 18, marginTop: 20, textAlign: 'center' },
  scanAgainButton: { marginTop: 30, backgroundColor: Colors.surface, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 50 },
  scanAgainText: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
});